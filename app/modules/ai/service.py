import json
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from uuid import UUID
from groq import Groq

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
)
from app.modules.ai.prompts import (
    SYSTEM_PROMPT_CHAT,
    SYSTEM_PROMPT_SCHEMA_GENERATION,
    SYSTEM_PROMPT_INTERFACE_GENERATION,
)
from app.modules.projects.repository import ProjectRepository
from app.modules.schema.models import Schema, TableSchema, Field, Relation
from app.modules.schema.models import FieldType, RelationType
from app.modules.auth.models import User
from app.modules.interface_builder.models import Interface, Page, Composant, TypePage, TypeComposant
from app.modules.interface_builder.repository import InterfaceRepository, PageRepository, ComposantRepository


class AIService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.conv_repo = ConversationRepository(db)
        self.msg_repo = MessageRepository(db)
        self.interface_repo = InterfaceRepository(db)
        self.page_repo = PageRepository(db)
        self.composant_repo = ComposantRepository(db)
        self.groq_client = Groq(api_key=settings.GROQ_API_KEY)
        self.model = "llama-3.3-70b-versatile"

    @staticmethod
    def _clean_json_response(raw_content: str) -> dict:
        raw_content = raw_content.strip()
        if raw_content.startswith("```json"):
            raw_content = raw_content[7:]
        if raw_content.startswith("```"):
            raw_content = raw_content[3:]
        if raw_content.endswith("```"):
            raw_content = raw_content[:-3]
        raw_content = raw_content.strip()
        return json.loads(raw_content)

    @staticmethod
    def _requested_devices_from_description(description: str) -> list[str]:
        text = description.lower()
        devices = []
        if any(token in text for token in ["mobile", "phone", "smartphone"]):
            devices.append("mobile")
        if any(token in text for token in ["tablet", "tablette", "ipad"]):
            devices.append("tablet")
        if any(token in text for token in ["desktop", "web", "ordinateur", "bureau", "laptop"]):
            devices.append("desktop")
        return devices or ["mobile"]

    @staticmethod
    def _ensure_requested_device_pages(interface_json: dict, requested_devices: list[str]) -> dict:
        pages = interface_json.get("pages", [])
        if not pages:
            return interface_json

        by_device = {}
        for page in pages:
            device = str(page.get("device", "mobile")).lower()
            by_device.setdefault(device, []).append(page)

        normalized_pages = list(pages)
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

    async def chat(
        self,
        project_id: UUID,
        data: MessageCreate,
        current_user: User,
    ) -> MessageResponse:
        """
        Chat with AI about a specific project.
        Returns the AI's response as a MessageResponse.
        """
        # 1. Verify project exists
        project_repo = ProjectRepository(self.db)
        project = await project_repo.get_by_tracking_id(project_id)
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )

        # 2. Get or create conversation
        conversation = await self.conv_repo.get_or_create(project_id)

        # 3. Save user message
        user_message = await self.msg_repo.create(
            conversation_id=conversation.tracking_id,
            role="user",
            content=data.content
        )

        # 4. Get last 20 messages for context
        history = await self.msg_repo.get_by_conversation(
            conversation.tracking_id,
            limit=20
        )

        # 5. Build messages list for Groq
        messages = [{"role": "system", "content": SYSTEM_PROMPT_CHAT}]
        for msg in history:
            messages.append({
                "role": msg.role.value,
                "content": msg.content
            })

        # 6. Call Groq API
        try:
            response = self.groq_client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.7,
                max_tokens=1024
            )
            ai_content = response.choices[0].message.content
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Groq API error: {str(e)}"
            )

        # 7. Save AI response
        ai_message = await self.msg_repo.create(
            conversation_id=conversation.tracking_id,
            role="assistant",
            content=ai_content
        )

        # 8. Return response
        await self.db.commit()
        return MessageResponse.model_validate(ai_message)

    async def generate_schema(
        self,
        project_id: UUID,
        data: SchemaGenerationRequest,
        current_user: User,
    ) -> SchemaGenerationResponse:
        """
        Generate database schema from natural language description.
        Creates tables, fields, and relations in the database.
        """
        # 1. Verify project exists
        project_repo = ProjectRepository(self.db)
        project = await project_repo.get_by_tracking_id(project_id)
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )

        # 2. Call Groq with schema generation prompt
        try:
            response = self.groq_client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT_SCHEMA_GENERATION},
                    {"role": "user", "content": data.description}
                ],
                temperature=0.1,
                max_tokens=3000
            )
            raw_content = response.choices[0].message.content
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Groq API error: {str(e)}"
            )

        # 3. Parse JSON response
        # Strip any accidental backticks or "json" prefix
        try:
            schema_json = self._clean_json_response(raw_content)
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="AI returned invalid JSON. Please try again with a clearer description."
            )

        # 4. Create schema if not exists
        from sqlalchemy import select
        schema_stmt = select(Schema).where(Schema.project_id == project_id)
        schema_result = await self.db.execute(schema_stmt)
        schema = schema_result.scalar_one_or_none()

        if not schema:
            schema = Schema(project_id=project_id)
            self.db.add(schema)
            await self.db.flush()
            await self.db.refresh(schema)

        # 5. Create tables and fields
        table_mapping = {}  # table_name -> TableSchema tracking_id

        for table_data in schema_json.get("tables", []):
            table_name = table_data.get("name")
            display_name = table_data.get("display_name", table_name)

            # Create TableSchema
            table = TableSchema(
                schema_id=schema.tracking_id,
                name=table_name,
                display_name=display_name
            )
            self.db.add(table)
            await self.db.flush()
            await self.db.refresh(table)

            table_mapping[table_name] = table.tracking_id

            # Create fields
            for field_data in table_data.get("fields", []):
                field_name = field_data.get("name")
                field_type = field_data.get("type", "text")

                # Map string type to FieldType enum
                try:
                    field_type_enum = FieldType[field_type.upper()]
                except KeyError:
                    field_type_enum = FieldType.TEXT

                field_config = {
                    "default": field_data.get("default")
                }

                field = Field(
                    table_id=table.tracking_id,
                    name=field_name,
                    display_name=field_name.replace("_", " ").title(),
                    type=field_type_enum,
                    required=field_data.get("required", False),
                    unique=field_data.get("unique", False),
                    config=field_config
                )
                self.db.add(field)
            
            await self.db.flush()

        # 6. Create relations
        relations_count = 0
        for relation_data in schema_json.get("relations", []):
            from_table = relation_data.get("from_table")
            to_table = relation_data.get("to_table")
            relation_type = relation_data.get("type", "one_to_many")

            if from_table in table_mapping and to_table in table_mapping:
                # Map string type to RelationType enum
                try:
                    relation_type_enum = RelationType[relation_type.upper().replace("-", "_")]
                except KeyError:
                    relation_type_enum = RelationType.ONE_TO_MANY

                relation_name = relation_data.get("name") or f"{from_table}_{relation_type}_{to_table}"
                relation = Relation(
                    schema_id=schema.tracking_id,
                    source_table_id=table_mapping[from_table],
                    target_table_id=table_mapping[to_table],
                    name=relation_name,
                    type=relation_type_enum,
                    description=relation_data.get("description"),
                    source_key=relation_data.get("source_key", "id"),
                    target_key=relation_data.get("target_key", "id"),
                )
                self.db.add(relation)
                relations_count += 1

            await self.db.flush()

        # 7. Save summary message in conversation
        conversation = await self.conv_repo.get_or_create(project_id)
        table_names = list(table_mapping.keys())
        summary = (
            f"I analyzed your description and created {len(table_names)} tables: "
            f"{', '.join(table_names)}. "
            f"You can now see them in the Tables tab."
        )
        await self.msg_repo.create(
            conversation_id=conversation.tracking_id,
            role="assistant",
            content=summary
        )

        # 8. Commit all changes
        await self.db.commit()

        return SchemaGenerationResponse(
            success=True,
            message=f"Successfully created {len(table_mapping)} tables and {relations_count} relations",
            tables_created=table_names,
            relations_created=relations_count,
            raw_schema=schema_json
        )

    async def generate_interface(
        self,
        project_id: UUID,
        data: InterfaceGenerationRequest,
        current_user: User,
    ) -> InterfaceGenerationResponse:
        project_repo = ProjectRepository(self.db)
        project = await project_repo.get_by_tracking_id(project_id)
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )

        try:
            response = self.groq_client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT_INTERFACE_GENERATION},
                    {"role": "user", "content": data.description}
                ],
                temperature=0.2,
                max_tokens=3000
            )
            raw_content = response.choices[0].message.content
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Groq API error: {str(e)}"
            )

        try:
            interface_json = self._clean_json_response(raw_content)
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="AI returned invalid JSON for interface generation."
            )

        requested_devices = self._requested_devices_from_description(data.description)
        interface_json = self._ensure_requested_device_pages(interface_json, requested_devices)

        interface = await self.interface_repo.get_by_project_id(project_id)
        if not interface:
            try:
                interface = await self.interface_repo.create(project_id)
            except IntegrityError:
                await self.db.rollback()
                interface = await self.interface_repo.get_by_project_id(project_id)
                if not interface:
                    raise

        existing_pages = await self.page_repo.get_by_interface_id(interface.tracking_id)
        for page in existing_pages:
            await self.page_repo.delete(page)
        await self.db.flush()

        type_mapping = {
            "container": TypeComposant.CONTENEUR,
            "columns": TypeComposant.CONTENEUR,
            "divider": TypeComposant.CONTENEUR,
            "spacer": TypeComposant.CONTENEUR,
            "title": TypeComposant.TEXTE,
            "text": TypeComposant.TEXTE,
            "badge": TypeComposant.TEXTE,
            "button": TypeComposant.BOUTON,
            "input": TypeComposant.CHAMP_INPUT,
            "textarea": TypeComposant.CHAMP_INPUT,
            "dropdown": TypeComposant.CHAMP_INPUT,
            "checkbox": TypeComposant.CHAMP_INPUT,
            "image": TypeComposant.IMAGE,
            "dataList": TypeComposant.LISTE,
            "card": TypeComposant.CARTE,
        }
        page_type_mapping = {
            "mobile": TypePage.MOBILE,
            "tablet": TypePage.TABLET,
            "desktop": TypePage.DESKTOP,
        }

        pages_created = []
        components_created = 0

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
                ordre=page_index,
            )
            self.db.add(page)
            await self.db.flush()
            await self.db.refresh(page)
            pages_created.append(page_name)

            for component_index, component_data in enumerate(page_data.get("components", [])):
                ui_type = component_data.get("ui_type", "text")
                composant = Composant(
                    page_id=page.tracking_id,
                    type=type_mapping.get(ui_type, TypeComposant.TEXTE),
                    parent_id=None,
                    position_x=0,
                    position_y=component_index,
                    largeur=str(component_data.get("width", "100%")),
                    hauteur=str(component_data.get("height", "auto")),
                    styles=component_data.get("styles") or {},
                    config={
                        "uiType": ui_type,
                        "props": component_data.get("props") or {},
                    },
                    connecte_a=None,
                    ordre=component_index,
                )
                self.db.add(composant)
                components_created += 1

        conversation = await self.conv_repo.get_or_create(project_id)
        summary = (
            f"I created {len(pages_created)} pages and {components_created} components "
            f"for your interface. You can review them in the Interface tab."
        )
        await self.msg_repo.create(
            conversation_id=conversation.tracking_id,
            role="assistant",
            content=summary
        )

        await self.db.commit()

        return InterfaceGenerationResponse(
            success=True,
            message=f"Successfully created {len(pages_created)} pages and {components_created} components",
            pages_created=pages_created,
            components_created=components_created,
            raw_interface=interface_json,
        )

    async def get_history(self, project_id: UUID) -> ConversationResponse:
        """Get conversation history for a project"""
        conversation = await self.conv_repo.get_or_create(project_id)
        return ConversationResponse.model_validate(conversation)

    async def clear_history(self, project_id: UUID) -> dict:
        """Clear all messages in a conversation"""
        conversation = await self.conv_repo.get_by_project_id(project_id)
        if conversation:
            await self.conv_repo.delete_messages(conversation.tracking_id)
            await self.db.commit()

        return {"message": "Conversation cleared successfully"}
