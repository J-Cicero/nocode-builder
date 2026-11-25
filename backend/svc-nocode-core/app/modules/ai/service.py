"""AI assistant and structured app/schema/interface/workflow generation service."""
from __future__ import annotations

import asyncio
import json
import logging
import time
from uuid import UUID

import httpx
from fastapi import HTTPException, status
from openai import (
    APIConnectionError,
    APIStatusError,
    APITimeoutError,
    AsyncOpenAI,
    AuthenticationError,
    OpenAIError,
    RateLimitError,
)
from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.app_builder import apply_blueprint
from app.core.config import settings
from app.core.identity import Identity as User
from app.modules.ai.catalog_service import AICatalogService
from app.modules.ai.prompts import (
    SYSTEM_PROMPT_CHAT,
    SYSTEM_PROMPT_INTERFACE_GENERATION,
    SYSTEM_PROMPT_SCHEMA_GENERATION,
    SYSTEM_PROMPT_WORKFLOW_GENERATION,
)
from app.modules.ai.repository import ConversationRepository, MessageRepository
from app.modules.ai.schemas import (
    AppGenerationRequest,
    AppGenerationResponse,
    ConversationResponse,
    InterfaceGenerationRequest,
    InterfaceGenerationResponse,
    MessageCreate,
    MessageResponse,
    SchemaGenerationRequest,
    SchemaGenerationResponse,
)
from app.modules.ai.validation import (
    AIServiceError,
    ValidatedInterfaceOutput,
    ValidatedSchemaOutput,
    ValidatedWorkflowsOutput,
    format_validation_errors,
    parse_ai_json,
)
from app.modules.interface_builder.models import (
    Composant,
    Interface,
    Page,
    SectionType,  # noqa: F401
)
from app.modules.interface_builder.repository import InterfaceRepository
from app.modules.projects.repository import ProjectRepository
from app.modules.schema.models import Field, Relation, Schema, TableSchema

logger = logging.getLogger(__name__)


class AIService:
    """Orchestrates chat and validated, transactional AI generation for projects."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.conv_repo = ConversationRepository(db)
        self.msg_repo = MessageRepository(db)
        self.interface_repo = InterfaceRepository(db)
        self._env_api_key = (settings.AI_API_KEY or "").strip()
        self._env_configured = bool(self._env_api_key)
        self.ai_client = AsyncOpenAI(
            api_key=self._env_api_key or "not-configured",
            base_url=settings.AI_BASE_URL,
            timeout=float(settings.AI_TIMEOUT_SECONDS),
            max_retries=0,
        )
        self.model = settings.AI_MODEL
        self._model_selected = False
        self.catalog = AICatalogService(db)

    def _sanitize(self, text: str) -> str:
        if self._env_api_key:
            return text.replace(self._env_api_key, "***")
        return text

    async def _select_model(self, model_ref: UUID | None, current_user: User) -> None:
        """Select AI client from DB catalog if populated, else fall back to env vars."""
        if self._model_selected and model_ref is None:
            return
        resolved = await self.catalog.resolve(
            model_ref,
            getattr(current_user, "plan", None),
            getattr(current_user, "role", None),
        )
        if resolved:
            self.ai_client, self.model = resolved.client, resolved.model_id
        elif not self._env_configured:
            raise AIServiceError(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Le service IA n'est pas configuré (AI_API_KEY manquante).",
                code="AI_NOT_CONFIGURED",
            )
        self._model_selected = True

    async def _require_project(self, project_id: UUID):
        project = await ProjectRepository(self.db).get_by_tracking_id(project_id)
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Projet introuvable.")
        return project

    async def _project_has_content(self, project_id: UUID) -> bool:
        table_exists = await self.db.execute(
            select(TableSchema.tracking_id)
            .join(Schema, TableSchema.schema_id == Schema.tracking_id)
            .where(Schema.project_id == project_id)
            .limit(1)
        )
        if table_exists.first() is not None:
            return True

        page_exists = await self.db.execute(
            select(Page.tracking_id)
            .join(Interface, Page.interface_id == Interface.tracking_id)
            .where(Interface.project_id == project_id)
            .limit(1)
        )
        return page_exists.first() is not None

    async def _ensure_replaceable(self, project_id: UUID, replace: bool) -> None:
        if not replace and await self._project_has_content(project_id):
            raise AIServiceError(
                status_code=status.HTTP_409_CONFLICT,
                detail="Le projet contient déjà un schéma ou une interface. Utilisez ?replace=true pour remplacer.",
                code="PROJECT_NOT_EMPTY",
            )

    async def _call_llm(
        self,
        messages: list[dict[str, str]],
        *,
        temperature: float,
        max_tokens: int,
        tools: list[dict] | None = None,
        tool_choice: str | None = None,
    ):
        kwargs: dict = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if tools is not None:
            kwargs["tools"] = tools
            kwargs["tool_choice"] = tool_choice or "auto"
        try:
            return await asyncio.wait_for(
                self.ai_client.chat.completions.create(**kwargs),
                timeout=float(settings.AI_TIMEOUT_SECONDS) + 1.0,
            )
        except AuthenticationError as exc:
            logger.warning("AI provider authentication failed: %s", type(exc).__name__)
            raise AIServiceError(
                status.HTTP_502_BAD_GATEWAY,
                "Authentification refusée par le fournisseur IA.",
                "AI_PROVIDER_AUTH",
            )
        except RateLimitError as exc:
            logger.warning("AI provider rate limit: %s", type(exc).__name__)
            raise AIServiceError(
                status.HTTP_503_SERVICE_UNAVAILABLE,
                "Le fournisseur IA limite temporairement les requêtes.",
                "AI_RATE_LIMITED",
            )
        except (APITimeoutError, httpx.TimeoutException, asyncio.TimeoutError, TimeoutError) as exc:
            logger.warning("AI provider timeout: %s", type(exc).__name__)
            raise AIServiceError(
                status.HTTP_504_GATEWAY_TIMEOUT,
                "Le fournisseur IA n'a pas répondu dans le délai imparti.",
                "AI_TIMEOUT",
            )
        except APIStatusError as exc:
            code_num = getattr(exc, "status_code", 502)
            logger.warning("AI provider status error: HTTP %s", code_num)
            if code_num == 401:
                raise AIServiceError(
                    status.HTTP_502_BAD_GATEWAY,
                    "Authentification refusée par le fournisseur IA.",
                    "AI_PROVIDER_AUTH",
                )
            if code_num == 429:
                raise AIServiceError(
                    status.HTTP_503_SERVICE_UNAVAILABLE,
                    "Le fournisseur IA limite temporairement les requêtes.",
                    "AI_RATE_LIMITED",
                )
            raise AIServiceError(
                status.HTTP_502_BAD_GATEWAY,
                f"Le fournisseur IA a renvoyé une erreur (HTTP {code_num}).",
                "AI_PROVIDER_ERROR",
            )
        except (APIConnectionError, OpenAIError, httpx.RequestError) as exc:
            logger.warning("AI provider connection error: %s", self._sanitize(type(exc).__name__))
            raise AIServiceError(
                status.HTTP_502_BAD_GATEWAY,
                "Erreur de communication avec le fournisseur IA.",
                "AI_PROVIDER_ERROR",
            )

    async def _generate_validated(
        self,
        system_prompt: str,
        user_prompt: str,
        schema_cls,
        *,
        temperature: float,
        max_tokens: int,
    ):
        """Call LLM and validate JSON against *schema_cls*, retrying once with exact errors."""
        messages: list[dict[str, str]] = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]
        last_errors: list[str] = []

        for attempt in range(2):
            response = await self._call_llm(messages, temperature=temperature, max_tokens=max_tokens)
            raw_content = (response.choices[0].message.content or "") if response.choices else ""
            try:
                parsed = parse_ai_json(raw_content)
                validated = schema_cls.model_validate(parsed)
                return validated, parsed
            except (ValueError, ValidationError) as exc:
                last_errors = format_validation_errors(exc)
                if attempt == 0:
                    errors_text = "\n".join(f"- {err}" for err in last_errors)
                    messages.append({"role": "assistant", "content": raw_content})
                    messages.append(
                        {
                            "role": "user",
                            "content": (
                                "Ta réponse JSON précédente contient les erreurs suivantes :\n"
                                f"{errors_text}\n"
                                "Corrige ces erreurs et réponds UNIQUEMENT avec un objet JSON valide."
                            ),
                        }
                    )

        raise AIServiceError(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="La sortie générée par l'IA est invalide : " + "; ".join(last_errors),
            code="AI_INVALID_OUTPUT",
            errors=last_errors,
        )

    async def _existing_table_names(self, project_id: UUID) -> list[str]:
        rows = await self.db.execute(
            select(TableSchema.name)
            .join(Schema, TableSchema.schema_id == Schema.tracking_id)
            .where(Schema.project_id == project_id)
            .order_by(TableSchema.created_at)
        )
        return [r[0] for r in rows.all()]

    async def chat(self, project_id: UUID, data: MessageCreate, current_user: User) -> MessageResponse:
        await self._select_model(data.model_id, current_user)
        await self._require_project(project_id)
        start_time = time.time()

        conversation = await self.conv_repo.get_or_create(project_id)
        await self.msg_repo.create(conversation_id=conversation.tracking_id, role="user", content=data.content)
        history = await self.msg_repo.get_by_conversation(conversation.tracking_id, limit=20)
        project_context = await self._build_project_context(project_id)

        messages: list[dict[str, str]] = [{"role": "system", "content": SYSTEM_PROMPT_CHAT}]
        if project_context:
            messages.append({"role": "system", "content": project_context})
        for msg in history:
            messages.append({"role": msg.role.value, "content": msg.content})

        tools = [
            {
                "type": "function",
                "function": {
                    "name": "generate_app",
                    "description": "Generate both database schema and user interface in one go.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "description": {"type": "string", "description": "Complete details about the data and the screens"}
                        },
                        "required": ["description"],
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "generate_schema",
                    "description": "Generate only database tables and fields from description",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "description": {"type": "string", "description": "Details about the tables and data structure"}
                        },
                        "required": ["description"],
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "generate_interface",
                    "description": "Generate only UI pages and components from description",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "description": {"type": "string", "description": "Details about the screens and UI elements"}
                        },
                        "required": ["description"],
                    },
                },
            },
        ]

        response = await self._call_llm(
            messages,
            temperature=0.3,
            max_tokens=4096,
            tools=tools,
            tool_choice="auto",
        )
        response_message = response.choices[0].message
        tool_calls = response_message.tool_calls
        ai_content = response_message.content or ""

        if tool_calls:
            tool_results = []
            for tool_call in tool_calls:
                function_name = tool_call.function.name
                try:
                    function_args = json.loads(tool_call.function.arguments)
                    if function_name == "generate_app":
                        await self.generate_app(project_id, AppGenerationRequest(**function_args), current_user)
                        tool_results.append("Application complète générée avec succès.")
                    elif function_name == "generate_schema":
                        await self.generate_schema(project_id, SchemaGenerationRequest(**function_args), current_user)
                        tool_results.append("Les tables de données ont été générées avec succès.")
                    elif function_name == "generate_interface":
                        await self.generate_interface(project_id, InterfaceGenerationRequest(**function_args), current_user)
                        tool_results.append("L'interface utilisateur a été générée avec succès.")
                except AIServiceError as exc:
                    tool_results.append(f"{exc.code}: {exc.detail}")
                except Exception as exc:
                    logger.warning("Chat tool '%s' failed: %s", function_name, self._sanitize(type(exc).__name__))
                    tool_results.append(f"Erreur lors de l'exécution de '{function_name}'.")
            if tool_results:
                ai_content = (ai_content + "\n\n---\n\n" + "\n".join(tool_results)).strip()

        if not ai_content:
            ai_content = "Désolé, je n'ai pas pu générer de réponse."

        ai_message = await self.msg_repo.create(
            conversation_id=conversation.tracking_id,
            role="assistant",
            content=ai_content,
        )
        await self.db.commit()
        logger.info("AI chat finished in %.2fs", time.time() - start_time)
        return MessageResponse.model_validate(ai_message)

    async def generate_schema(
        self,
        project_id: UUID,
        data: SchemaGenerationRequest,
        current_user: User,
        *,
        replace: bool = False,
    ) -> SchemaGenerationResponse:
        await self._select_model(data.model_id, current_user)
        await self._require_project(project_id)
        await self._ensure_replaceable(project_id, replace)

        validated, raw_schema = await self._generate_validated(
            SYSTEM_PROMPT_SCHEMA_GENERATION,
            data.description,
            ValidatedSchemaOutput,
            temperature=0.1,
            max_tokens=8192,
        )

        try:
            applied = await apply_blueprint(self.db, project_id, schema=validated, replace=replace)
            table_names = applied.tables_created
            relations_count = applied.relations_created
            conversation = await self.conv_repo.get_or_create(project_id)
            summary = f"Schéma généré avec {len(table_names)} table(s) : {', '.join(table_names)}."
            await self.msg_repo.create(conversation_id=conversation.tracking_id, role="assistant", content=summary)
            await self.db.commit()
        except Exception:
            await self.db.rollback()
            raise

        return SchemaGenerationResponse(
            success=True,
            message=f"Successfully created {len(table_names)} tables and {relations_count} relations",
            tables_created=table_names,
            relations_created=relations_count,
            raw_schema=raw_schema,
        )

    async def generate_interface(
        self,
        project_id: UUID,
        data: InterfaceGenerationRequest,
        current_user: User,
        context_tables: list[str] | None = None,
        *,
        replace: bool = False,
    ) -> InterfaceGenerationResponse:
        await self._select_model(data.model_id, current_user)
        await self._require_project(project_id)
        await self._ensure_replaceable(project_id, replace)

        tables_for_prompt = context_tables if context_tables is not None else await self._existing_table_names(project_id)
        prompt_description = data.description
        if tables_for_prompt:
            prompt_description += (
                f"\n\nIMPORTANT: Utilize these existing database tables for data bindings: {', '.join(tables_for_prompt)}. "
                "For forms or lists, add a 'connecte_a' property pointing to the table name."
            )

        validated, raw_interface = await self._generate_validated(
            SYSTEM_PROMPT_INTERFACE_GENERATION,
            prompt_description,
            ValidatedInterfaceOutput,
            temperature=0.2,
            max_tokens=8192,
        )

        try:
            applied = await apply_blueprint(self.db, project_id, interface=validated, replace=replace)
            pages_created = applied.pages_created
            sections_created = applied.sections_created
            conversation = await self.conv_repo.get_or_create(project_id)
            summary = f"Interface générée avec {len(pages_created)} page(s) et {sections_created} section(s)."
            await self.msg_repo.create(conversation_id=conversation.tracking_id, role="assistant", content=summary)
            await self.db.commit()
        except Exception:
            await self.db.rollback()
            raise

        return InterfaceGenerationResponse(
            success=True,
            message=f"Successfully created {len(pages_created)} pages and {sections_created} sections",
            pages_created=pages_created,
            components_created=sections_created,
            raw_interface=raw_interface,
        )

    async def generate_app(
        self,
        project_id: UUID,
        data: AppGenerationRequest,
        current_user: User,
        *,
        replace: bool = False,
    ) -> AppGenerationResponse:
        await self._select_model(data.model_id, current_user)
        await self._require_project(project_id)
        await self._ensure_replaceable(project_id, replace)

        # 1. Appels et validations IA complets AVANT toute écriture en base (atomicité garantie)
        schema_validated, raw_schema = await self._generate_validated(
            SYSTEM_PROMPT_SCHEMA_GENERATION,
            data.description,
            ValidatedSchemaOutput,
            temperature=0.1,
            max_tokens=8192,
        )

        context_tables = [t.name for t in schema_validated.tables]
        iface_prompt = data.description
        if context_tables:
            iface_prompt += (
                f"\n\nIMPORTANT: Utilize these existing database tables for data bindings: {', '.join(context_tables)}. "
                "For forms or lists, add a 'connecte_a' property pointing to the table name."
            )
        interface_validated, raw_interface = await self._generate_validated(
            SYSTEM_PROMPT_INTERFACE_GENERATION,
            iface_prompt,
            ValidatedInterfaceOutput,
            temperature=0.2,
            max_tokens=8192,
        )

        workflows_validated, _ = await self._generate_validated(
            SYSTEM_PROMPT_WORKFLOW_GENERATION,
            data.description,
            ValidatedWorkflowsOutput,
            temperature=0.1,
            max_tokens=2000,
        )

        # 2. Écriture atomique complète (remplacement + schéma + interface + workflows)
        try:
            applied = await apply_blueprint(
                self.db,
                project_id,
                schema=schema_validated,
                interface=interface_validated,
                workflows=workflows_validated,
                replace=replace,
            )
            table_names = applied.tables_created
            relations_count = applied.relations_created
            pages_created = applied.pages_created
            sections_created = applied.sections_created
            workflows_count = applied.workflows_created

            conversation = await self.conv_repo.get_or_create(project_id)
            summary = (
                f"Application générée : {len(table_names)} table(s), "
                f"{len(pages_created)} page(s), {workflows_count} workflow(s)."
            )
            await self.msg_repo.create(conversation_id=conversation.tracking_id, role="assistant", content=summary)
            await self.db.commit()
        except Exception:
            await self.db.rollback()
            raise

        schema_resp = SchemaGenerationResponse(
            success=True,
            message=f"Successfully created {len(table_names)} tables and {relations_count} relations",
            tables_created=table_names,
            relations_created=relations_count,
            raw_schema=raw_schema,
        )
        interface_resp = InterfaceGenerationResponse(
            success=True,
            message=f"Successfully created {len(pages_created)} pages and {sections_created} sections",
            pages_created=pages_created,
            components_created=sections_created,
            raw_interface=raw_interface,
        )
        return AppGenerationResponse(
            success=True,
            message=(
                f"Génération terminée. {len(table_names)} tables, "
                f"{len(pages_created)} pages, {workflows_count} workflows."
            ),
            db_schema=schema_resp,
            interface=interface_resp,
            workflows_created=workflows_count,
        )

    async def get_history(self, project_id: UUID) -> ConversationResponse:
        conversation = await self.conv_repo.get_or_create(project_id)
        return ConversationResponse.model_validate(conversation)

    async def clear_history(self, project_id: UUID) -> dict:
        conversation = await self.conv_repo.get_by_project_id(project_id)
        if conversation:
            await self.conv_repo.delete_messages(conversation.tracking_id)
            await self.db.commit()
        return {"message": "Conversation cleared successfully"}

    async def _build_project_context(self, project_id: UUID) -> str:
        parts: list[str] = []
        schema = (await self.db.execute(select(Schema).where(Schema.project_id == project_id))).scalar_one_or_none()
        if schema:
            tables = list(
                (
                    await self.db.execute(
                        select(TableSchema).where(TableSchema.schema_id == schema.tracking_id).order_by(TableSchema.created_at.desc())
                    )
                )
                .scalars()
                .all()
            )
            table_map = {t.tracking_id: t.name for t in tables}
            table_summaries = []
            for table in tables[:6]:
                fields = list(
                    (await self.db.execute(select(Field).where(Field.table_id == table.tracking_id).order_by(Field.created_at)))
                    .scalars()
                    .all()
                )
                field_names = [f.name for f in fields[:6]]
                table_summaries.append(f"{table.name}: " + (", ".join(field_names) if field_names else "no fields"))
            relations = list(
                (
                    await self.db.execute(
                        select(Relation).where(Relation.schema_id == schema.tracking_id).order_by(Relation.created_at.desc())
                    )
                )
                .scalars()
                .all()
            )
            relation_summaries = []
            for rel in relations[:6]:
                rel_type = rel.type.value if hasattr(rel.type, "value") else rel.type
                src = table_map.get(rel.source_table_id, str(rel.source_table_id))
                tgt = table_map.get(rel.target_table_id, str(rel.target_table_id))
                relation_summaries.append(f"{src}->{tgt} ({rel_type})")
            parts.append("SCHEMA: " + ("; ".join(table_summaries) if table_summaries else "none"))
            if relation_summaries:
                parts.append("RELATIONS: " + "; ".join(relation_summaries))

        interface = (await self.db.execute(select(Interface).where(Interface.project_id == project_id))).scalar_one_or_none()
        if interface:
            pages = list(
                (await self.db.execute(select(Page).where(Page.interface_id == interface.tracking_id).order_by(Page.created_at)))
                .scalars()
                .all()
            )
            page_summaries = []
            for page in pages[:6]:
                comps = list((await self.db.execute(select(Composant).where(Composant.page_id == page.tracking_id))).scalars().all())
                comp_types = [c.type.value for c in comps[:10]]
                page_summaries.append(
                    f"{page.nom} [{page.chemin}] device={page.type_page} components={','.join(comp_types) if comp_types else 'none'}"
                )
            parts.append("INTERFACE: " + ("; ".join(page_summaries) if page_summaries else "none"))

        if not parts:
            return ""
        return "PROJECT CONTEXT:\n" + "\n".join(parts)
