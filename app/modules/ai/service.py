import json
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from sqlalchemy import select
from uuid import UUID
from openai import AsyncOpenAI
import time

from app.core.config import settings
from app.modules.ai.models import Conversation, Message
from app.modules.ai.repository import ConversationRepository, MessageRepository
from app.modules.ai.schemas import (
    MessageCreate,
    MessageResponse,
    ConversationResponse,
    SchemaGenerationRequest,
    SchemaGenerationResponse,
    InterfaceGenerationRequest,
    InterfaceGenerationResponse,
    AppGenerationRequest,
    AppGenerationResponse,
)
from app.modules.ai.prompts import (
    SYSTEM_PROMPT_CHAT,
    SYSTEM_PROMPT_SCHEMA_GENERATION,
    SYSTEM_PROMPT_INTERFACE_GENERATION,
    SYSTEM_PROMPT_WORKFLOW_GENERATION,
)
from app.modules.projects.repository import ProjectRepository
from app.modules.schema.models import Schema, TableSchema, Field, Relation
from app.modules.schema.models import FieldType, RelationType
from app.modules.auth.models import User
from app.modules.interface_builder.models import Interface, Page, Composant, TypePage, TypeComposant, Section
from app.modules.interface_builder.repository import InterfaceRepository, PageRepository, ComposantRepository, SectionRepository
from app.modules.workflow_engine.repository import WorkflowRepository


class AIService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.conv_repo = ConversationRepository(db)
        self.msg_repo = MessageRepository(db)
        self.interface_repo = InterfaceRepository(db)
        self.page_repo = PageRepository(db)
        self.composant_repo = ComposantRepository(db)
        self.section_repo = SectionRepository(db)
        self.ai_client = AsyncOpenAI(
            api_key=settings.AI_API_KEY,
            base_url=settings.AI_BASE_URL
        )
        self.model = settings.AI_MODEL

    @staticmethod
    def _clean_json_response(raw_content: str) -> dict:
        import re
        import json

        raw_content = raw_content.strip()

        # Étape 1: Enlever les blocs markdown ```json...```
        if "```json" in raw_content:
            raw_content = raw_content.split("```json")[1].split("```")[0].strip()
        elif "```" in raw_content:
            parts = raw_content.split("```")
            if len(parts) >= 2:
                raw_content = parts[1].strip()

        # Étape 2: Essayer de parser directement
        try:
            return json.loads(raw_content)
        except json.JSONDecodeError:
            pass

        # Étape 3: Extraire le JSON en trouvant { et }
        # Cherche la première { et la dernière }
        start_idx = raw_content.find('{')
        end_idx = raw_content.rfind('}')

        if start_idx != -1 and end_idx != -1 and start_idx < end_idx:
            json_string = raw_content[start_idx:end_idx + 1]
            try:
                return json.loads(json_string)
            except json.JSONDecodeError:
                pass

        # Étape 4: Chercher [ et ] pour les arrays
        start_idx = raw_content.find('[')
        end_idx = raw_content.rfind(']')

        if start_idx != -1 and end_idx != -1 and start_idx < end_idx:
            json_string = raw_content[start_idx:end_idx + 1]
            try:
                return json.loads(json_string)
            except json.JSONDecodeError:
                pass

        # Étape 5: Nettoyer les virgules mal placées
        raw_content = re.sub(r',\s*}', '}', raw_content)
        raw_content = re.sub(r',\s*]', ']', raw_content)

        try:
            return json.loads(raw_content)
        except json.JSONDecodeError as e:
            print(f"❌ JSON parsing failed after all attempts: {e}")
            print(f"Raw content: {raw_content[:200]}...")
            raise ValueError(f"Failed to parse JSON: {str(e)}")

    @staticmethod
    def _requested_devices_from_description(description: str) -> list[str]:
        """Extrait les types d'appareils demandés dans la description"""
        text = description.lower()
        devices = []
        if any(token in text for token in ["mobile", "phone", "smartphone", "téléphone"]):
            devices.append("mobile")
        if any(token in text for token in ["tablet", "tablette", "ipad"]):
            devices.append("tablet")
        if any(token in text for token in ["desktop", "web", "ordinateur", "bureau", "laptop", "pc"]):
            devices.append("desktop")
        return devices or ["mobile"]

    @staticmethod
    def _ensure_requested_device_pages(interface_json: dict, requested_devices: list[str]) -> dict:
        """Duplique les pages pour chaque appareil demandé"""
        pages = interface_json.get("pages", [])
        if not pages:
            return interface_json

        # Grouper les pages existantes par device
        by_device = {}
        for page in pages:
            device = str(page.get("device", "mobile")).lower()
            by_device.setdefault(device, []).append(page)

        # Commencer avec les pages existantes
        normalized_pages = list(pages)

        # Ajouter les pages manquantes pour les devices demandés
        for device in requested_devices:
            if device in by_device:
                continue
            source_pages = by_device.get("mobile") or normalized_pages
            cloned_pages = []
            for page in source_pages:
                clone = {
                    **page,
                    "device": device,
                    "is_home": bool(page.get("is_home", False)),
                    "components": list(page.get("components", [])),
                }
                cloned_pages.append(clone)
            normalized_pages.extend(cloned_pages)
            by_device[device] = cloned_pages

        interface_json["pages"] = normalized_pages
        return interface_json

    async def chat(self, project_id: UUID, data: MessageCreate, current_user: User) -> MessageResponse:
        start_time = time.time()
        print(f"🚀 [AI CHAT] Starting request for project {project_id}...")
        project_repo = ProjectRepository(self.db)
        project = await project_repo.get_by_tracking_id(project_id)
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        conversation = await self.conv_repo.get_or_create(project_id)
        await self.msg_repo.create(conversation_id=conversation.tracking_id, role="user", content=data.content)
        history = await self.msg_repo.get_by_conversation(conversation.tracking_id, limit=20)
        project_context = await self._build_project_context(project_id)
        messages = [{"role": "system", "content": SYSTEM_PROMPT_CHAT}]
        if project_context:
            messages.append({"role": "system", "content": project_context})
        for msg in history:
            messages.append({"role": msg.role.value, "content": msg.content})
        tools = [
            {"type": "function", "function": {"name": "generate_app", "description": "Generate both database schema and user interface in one go.", "parameters": {"type": "object", "properties": {"description": {"type": "string", "description": "Complete details about the data and the screens"}}, "required": ["description"]}}},
            {"type": "function", "function": {"name": "generate_schema", "description": "Generate only database tables and fields from description", "parameters": {"type": "object", "properties": {"description": {"type": "string", "description": "Details about the tables and data structure"}}, "required": ["description"]}}},
            {"type": "function", "function": {"name": "generate_interface", "description": "Generate only UI pages and components from description", "parameters": {"type": "object", "properties": {"description": {"type": "string", "description": "Details about the screens and UI elements"}}, "required": ["description"]}}}
        ]
        try:
            response = await self.ai_client.chat.completions.create(model=self.model, messages=messages, tools=tools, tool_choice="auto", temperature=0.3, max_tokens=8192)
            response_message = response.choices[0].message
            tool_calls = response_message.tool_calls
            ai_content = response_message.content or ""
            if tool_calls:
                tool_results = []
                for tool_call in tool_calls:
                    function_name = tool_call.function.name
                    try:
                        print(f"🛠️ [AI TOOL] Calling {function_name}...")
                        f_start = time.time()
                        function_args = json.loads(tool_call.function.arguments)
                        if function_name == "generate_app":
                            await self.generate_app(project_id, AppGenerationRequest(**function_args), current_user)
                            tool_results.append("✅ Application complète générée avec succès.")
                        elif function_name == "generate_schema":
                            await self.generate_schema(project_id, SchemaGenerationRequest(**function_args), current_user)
                            tool_results.append("✅ Les informations (données) ont été structurées.")
                        elif function_name == "generate_interface":
                            await self.generate_interface(project_id, InterfaceGenerationRequest(**function_args), current_user)
                            tool_results.append("✅ L'interface utilisateur (les écrans) a été créée.")
                        print(f"⏱️ [AI TOOL] {function_name} finished in {time.time() - f_start:.2f}s")
                    except Exception as e:
                        print(f"❌ [AI TOOL ERROR] Tool '{function_name}' failed: {str(e)}")
                        tool_results.append(f"⚠️ J'ai rencontré une erreur interne en essayant de '{function_name}'.")
                if tool_results:
                    ai_content = (ai_content or "") + "\n\n---\n\n" + "\n".join(tool_results)
            if not ai_content:
                ai_content = "Désolé, je n'ai pas pu générer de réponse."
        except Exception as e:
            print(f"❌ Chat Tool Error: {e}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"AI API error: {str(e)}")
        ai_message = await self.msg_repo.create(conversation_id=conversation.tracking_id, role="assistant", content=ai_content)
        await self.db.commit()
        print(f"🏁 [AI CHAT] Total execution time: {time.time() - start_time:.2f}s")
        return MessageResponse.model_validate(ai_message)

    async def generate_schema(self, project_id: UUID, data: SchemaGenerationRequest, current_user: User) -> SchemaGenerationResponse:
        project_repo = ProjectRepository(self.db)
        project = await project_repo.get_by_tracking_id(project_id)
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        try:
            response = await self.ai_client.chat.completions.create(model=self.model, messages=[{"role": "system", "content": SYSTEM_PROMPT_SCHEMA_GENERATION}, {"role": "user", "content": data.description}], temperature=0.1, max_tokens=8192)
            raw_content = response.choices[0].message.content
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"AI API error: {str(e)}")
        try:
            schema_json = self._clean_json_response(raw_content)
        except Exception as e:
            print(f"❌ AI JSON Parsing Error in generate_schema: {e}")
            print(f"Raw content was: {raw_content[:500]}...")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"AI returned invalid JSON for schema: {str(e)}")
        schema_stmt = select(Schema).where(Schema.project_id == project_id)
        schema_result = await self.db.execute(schema_stmt)
        schema = schema_result.scalar_one_or_none()
        if not schema:
            schema = Schema(project_id=project_id)
            self.db.add(schema)
            await self.db.flush()
            await self.db.refresh(schema)
        
        # Smart synchronization: delete old schema before creating new one
        existing_tables = await self.db.execute(select(TableSchema).where(TableSchema.schema_id == schema.tracking_id))
        for table in existing_tables.scalars().all():
            await self.db.delete(table)
        await self.db.flush()

        table_mapping = {}
        for table_data in schema_json.get("tables", []):
            table_name = table_data.get("name")
            display_name = table_data.get("display_name", table_name)
            table = TableSchema(schema_id=schema.tracking_id, name=table_name, display_name=display_name)
            self.db.add(table)
            await self.db.flush()
            await self.db.refresh(table)
            table_mapping[table_name] = table.tracking_id
            for field_data in table_data.get("fields", []):
                field_name = field_data.get("name")
                field_type = field_data.get("type", "text")
                try:
                    field_type_enum = FieldType[field_type.upper()]
                except KeyError:
                    field_type_enum = FieldType.TEXT
                field_config = {"default": field_data.get("default")}
                field = Field(table_id=table.tracking_id, name=field_name, display_name=field_name.replace("_", " ").title(), type=field_type_enum, required=field_data.get("required", False), unique=field_data.get("unique", False), config=field_config)
                self.db.add(field)
            await self.db.flush()
        relations_count = 0
        for relation_data in schema_json.get("relations", []):
            from_table = relation_data.get("from_table")
            to_table = relation_data.get("to_table")
            relation_type = relation_data.get("type", "one_to_many")
            if from_table in table_mapping and to_table in table_mapping:
                try:
                    relation_type_enum = RelationType[relation_type.upper().replace("-", "_")]
                except KeyError:
                    relation_type_enum = RelationType.ONE_TO_MANY
                relation_name = relation_data.get("name") or f"{from_table}_{relation_type}_{to_table}"
                relation = Relation(schema_id=schema.tracking_id, source_table_id=table_mapping[from_table], target_table_id=table_mapping[to_table], name=relation_name, type=relation_type_enum, description=relation_data.get("description"), source_key=relation_data.get("source_key", "id"), target_key=relation_data.get("target_key", "id"))
                self.db.add(relation)
                relations_count += 1
            await self.db.flush()
        conversation = await self.conv_repo.get_or_create(project_id)
        table_names = list(table_mapping.keys())
        summary = f"I analyzed your description and created {len(table_names)} tables: {', '.join(table_names)}. You can now see them in the Tables tab."
        await self.msg_repo.create(conversation_id=conversation.tracking_id, role="assistant", content=summary)
        await self.db.commit()
        return SchemaGenerationResponse(success=True, message=f"Successfully created {len(table_mapping)} tables and {relations_count} relations", tables_created=table_names, relations_created=relations_count, raw_schema=schema_json)

    async def generate_interface(self, project_id: UUID, data: InterfaceGenerationRequest, current_user: User, context_tables: list[str] = None) -> InterfaceGenerationResponse:
        project_repo = ProjectRepository(self.db)
        project = await project_repo.get_by_tracking_id(project_id)
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        if not context_tables:
            schema_stmt = select(Schema).where(Schema.project_id == project_id)
            schema = (await self.db.execute(schema_stmt)).scalar_one_or_none()
            if not schema or not (await self.db.execute(select(TableSchema).where(TableSchema.schema_id == schema.tracking_id).limit(1))).first():
                print("⚠️ [ARCH FIX] No schema found. Generating schema before interface.")
                schema_resp = await self.generate_schema(project_id, SchemaGenerationRequest(description=data.description), current_user)
                context_tables = schema_resp.tables_created

        prompt_description = data.description
        if context_tables:
            prompt_description += f"\n\nIMPORTANT: Utilize these existing database tables for data bindings: {', '.join(context_tables)}. For forms or lists, add a 'connecte_a' property pointing to the table name."

        # 1. Appeler Groq avec SYSTEM_PROMPT_INTERFACE_GENERATION
        try:
            print(f"📤 [INTERFACE] Sending prompt with {len(context_tables or [])} tables: {context_tables}")
            response = await self.ai_client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT_INTERFACE_GENERATION},
                    {"role": "user", "content": prompt_description}
                ],
                temperature=0.2,
                max_tokens=8192
            )
            raw_content = response.choices[0].message.content
            print(f"📥 [INTERFACE] Raw AI response (first 1000 chars):\n{raw_content[:1000]}")
        except Exception as e:
            print(f"❌ [INTERFACE] API error: {e}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"AI API error: {str(e)}")

        # 2. Parser le JSON retourné
        try:
            interface_json = self._clean_json_response(raw_content)
            print(f"✅ [INTERFACE] Parsed JSON: {interface_json}")
            print(f"✅ [INTERFACE] Pages count: {len(interface_json.get('pages', []))}")
            for i, page in enumerate(interface_json.get("pages", [])):
                print(f"  Page {i}: {page.get('name')} - Sections: {len(page.get('sections', []))}")
        except Exception as e:
            print(f"❌ AI JSON Parsing Error: {e}")
            print(f"Raw content was: {raw_content[:500]}...")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"AI returned invalid JSON: {str(e)}")

        requested_devices = self._requested_devices_from_description(data.description)
        interface_json = self._ensure_requested_device_pages(interface_json, requested_devices)

        interface = await self.interface_repo.get_by_project_id(project_id)
        if not interface:
            try:
                interface = await self.interface_repo.create(project_id)
            except IntegrityError:
                await self.db.rollback()
                interface = await self.interface_repo.get_by_project_id(project_id)
                if not interface: raise

        existing_pages = await self.page_repo.get_by_interface_id(interface.tracking_id)
        for page in existing_pages:
            await self.page_repo.delete(page)
        await self.db.flush()

        page_type_mapping = {"mobile": TypePage.MOBILE, "tablet": TypePage.TABLET, "desktop": TypePage.DESKTOP}
        pages_created = []
        sections_created = 0

        # 3. Pour chaque page dans pages[]
        for page_index, page_data in enumerate(interface_json.get("pages", [])):
            page_name = page_data.get("name") or f"Page {page_index + 1}"
            page_path = page_data.get("path") or f"/page-{page_index + 1}"
            page_device = str(page_data.get("device", "mobile")).lower()

            page = Page(
                interface_id=interface.tracking_id,
                nom=page_name,
                chemin=page_path,
                type_page=page_type_mapping.get(page_device, TypePage.MOBILE),
                est_accueil=bool(page_data.get("is_home", page_index == 0)),
                ordre=page_index
            )
            self.db.add(page)
            await self.db.flush()
            await self.db.refresh(page)
            pages_created.append(page_name)

            # 4. Pour chaque section dans page["sections"]
            for section_index, section_data in enumerate(page_data.get("sections", [])):
                section_type = section_data.get("type", "text-section")
                section_ordre = section_data.get("ordre", section_index)
                section_config = section_data.get("config", {})
                section_connecte_a = section_config.get("table")
                section_title = section_config.get("title")

                section = Section(
                    page_id=page.tracking_id,
                    type=section_type,
                    ordre=section_ordre,
                    config=section_config,
                    connecte_a=section_connecte_a,
                    title=section_title
                )
                self.db.add(section)
                sections_created += 1

        # 5. Retourner le nombre de pages et sections créées
        await self.db.flush()

        conversation = await self.conv_repo.get_or_create(project_id)
        summary = f"I created {len(pages_created)} pages and {sections_created} sections for your interface. You can review them in the Interface tab."
        await self.msg_repo.create(conversation_id=conversation.tracking_id, role="assistant", content=summary)
        await self.db.commit()

        return InterfaceGenerationResponse(
            success=True,
            message=f"Successfully created {len(pages_created)} pages and {sections_created} sections",
            pages_created=pages_created,
            components_created=sections_created,
            raw_interface=interface_json
        )

    async def generate_app(self, project_id: UUID, data: AppGenerationRequest, current_user: User) -> AppGenerationResponse:
        schema_resp = await self.generate_schema(project_id, SchemaGenerationRequest(description=data.description), current_user)
        interface_resp = await self.generate_interface(project_id, InterfaceGenerationRequest(description=data.description), current_user, context_tables=schema_resp.tables_created)
        workflows_count = await self.generate_workflows(project_id, data.description, current_user)
        return AppGenerationResponse(success=True, message=f"Génération terminée. {len(schema_resp.tables_created)} tables, {len(interface_resp.pages_created)} pages, {workflows_count} workflows.", db_schema=schema_resp, interface=interface_resp, workflows_created=workflows_count)

    async def generate_workflows(
        self,
        project_id: UUID,
        description: str,
        current_user: User,
    ) -> int:
        """Génère les workflows depuis la description."""
        from app.modules.workflow_engine.models import Workflow, EtapeWorkflow

        try:
            response = await self.ai_client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT_WORKFLOW_GENERATION},
                    {"role": "user", "content": description}
                ],
                temperature=0.1,
                max_tokens=2000
            )
            raw_content = response.choices[0].message.content
            workflows_json = self._clean_json_response(raw_content)
        except Exception as e:
            print(f"⚠️ [AI WORKFLOW] Error generating workflows: {e}")
            return 0

        count = 0
        for wf_data in workflows_json.get("workflows", []):
            workflow = Workflow(
                project_id=project_id,
                nom=wf_data.get("nom", "Workflow"),
                description=wf_data.get("description"),
                actif=True,
            )
            self.db.add(workflow)
            await self.db.flush()
            await self.db.refresh(workflow)

            for etape_data in wf_data.get("etapes", []):
                etape = EtapeWorkflow(
                    workflow_id=workflow.tracking_id,
                    type=etape_data.get("type", "declencheur"),
                    ordre=etape_data.get("ordre", 0),
                    config=etape_data.get("config", {}),
                )
                self.db.add(etape)
            count += 1

        await self.db.commit()
        return count

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
        schema_stmt = select(Schema).where(Schema.project_id == project_id)
        schema = (await self.db.execute(schema_stmt)).scalar_one_or_none()
        if schema:
            tables_stmt = (select(TableSchema).where(TableSchema.schema_id == schema.tracking_id).order_by(TableSchema.created_at.desc()))
            tables = list((await self.db.execute(tables_stmt)).scalars().all())
            table_map = {t.tracking_id: t.name for t in tables}
            table_summaries = []
            for table in tables[:6]:
                fields_stmt = (select(Field).where(Field.table_id == table.tracking_id).order_by(Field.created_at))
                fields = list((await self.db.execute(fields_stmt)).scalars().all())
                field_names = [f.name for f in fields[:6]]
                table_summaries.append(f"{table.name}: " + (", ".join(field_names) if field_names else "no fields"))
            relations_stmt = (select(Relation).where(Relation.schema_id == schema.tracking_id).order_by(Relation.created_at.desc()))
            relations = list((await self.db.execute(relations_stmt)).scalars().all())
            relation_summaries = []
            for rel in relations[:6]:
                rel_type = rel.type.value if hasattr(rel.type, "value") else rel.type
                src = table_map.get(rel.source_table_id, str(rel.source_table_id))
                tgt = table_map.get(rel.target_table_id, str(rel.target_table_id))
                relation_summaries.append(f"{src}->{tgt} ({rel_type})")
            parts.append("SCHEMA: " + ("; ".join(table_summaries) if table_summaries else "none"))
            if relation_summaries:
                parts.append("RELATIONS: " + "; ".join(relation_summaries))
        interface_stmt = select(Interface).where(Interface.project_id == project_id)
        interface = (await self.db.execute(interface_stmt)).scalar_one_or_none()
        if interface:
            pages_stmt = (select(Page).where(Page.interface_id == interface.tracking_id).order_by(Page.created_at))
            pages = list((await self.db.execute(pages_stmt)).scalars().all())
            page_summaries = []
            for page in pages[:6]:
                comps_stmt = (select(Composant).where(Composant.page_id == page.tracking_id))
                comps = list((await self.db.execute(comps_stmt)).scalars().all())
                comp_types = [c.type.value for c in comps[:10]]
                page_summaries.append(f"{page.nom} [{page.chemin}] device={page.type_page} components={','.join(comp_types) if comp_types else 'none'}")
            parts.append("INTERFACE: " + ("; ".join(page_summaries) if page_summaries else "none"))
        if not parts:
            return ""
        return "PROJECT CONTEXT:\n" + "\n".join(parts)
