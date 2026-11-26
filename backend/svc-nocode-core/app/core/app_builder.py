"""Shared transactional persistence helper for AI generation and server templates."""
from __future__ import annotations

from dataclasses import dataclass, field
import logging
import os
from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.ai.validation import (
    ValidatedInterfaceOutput,
    ValidatedSchemaOutput,
    ValidatedWorkflowsOutput,
)
from app.modules.interface_builder.models import (
    Composant,
    Interface,
    Page,
    Section,
    TypePage,
)
from app.modules.schema.models import Field, FieldType, Relation, RelationType, Schema, TableSchema
from app.modules.workflow_engine.models import EtapeWorkflow, ExecutionWorkflow, Workflow

logger = logging.getLogger(__name__)


@dataclass
class BlueprintApplyResult:
    tables_created: list[str] = field(default_factory=list)
    relations_created: int = 0
    pages_created: list[str] = field(default_factory=list)
    sections_created: int = 0
    workflows_created: int = 0


async def _clear_schema(db: AsyncSession, project_id: UUID) -> None:
    schema_ids = select(Schema.tracking_id).where(Schema.project_id == project_id)
    table_ids = select(TableSchema.tracking_id).where(TableSchema.schema_id.in_(schema_ids))
    await db.execute(delete(Field).where(Field.table_id.in_(table_ids)))
    await db.execute(delete(Relation).where(Relation.schema_id.in_(schema_ids)))
    await db.execute(delete(TableSchema).where(TableSchema.schema_id.in_(schema_ids)))
    await db.execute(delete(Schema).where(Schema.project_id == project_id))
    await db.flush()


async def _clear_interface(db: AsyncSession, project_id: UUID) -> None:
    iface_ids = select(Interface.tracking_id).where(Interface.project_id == project_id)
    page_ids = select(Page.tracking_id).where(Page.interface_id.in_(iface_ids))
    await db.execute(delete(Composant).where(Composant.page_id.in_(page_ids)))
    await db.execute(delete(Section).where(Section.page_id.in_(page_ids)))
    await db.execute(delete(Page).where(Page.interface_id.in_(iface_ids)))
    await db.execute(delete(Interface).where(Interface.project_id == project_id))
    await db.flush()


async def _clear_workflows(db: AsyncSession, project_id: UUID) -> None:
    wf_ids = select(Workflow.tracking_id).where(Workflow.project_id == project_id)
    await db.execute(delete(EtapeWorkflow).where(EtapeWorkflow.workflow_id.in_(wf_ids)))
    await db.execute(delete(ExecutionWorkflow).where(ExecutionWorkflow.workflow_id.in_(wf_ids)))
    await db.execute(delete(Workflow).where(Workflow.project_id == project_id))
    await db.flush()


async def _persist_schema(
    db: AsyncSession,
    project_id: UUID,
    validated: ValidatedSchemaOutput,
    *,
    replace: bool,
) -> tuple[list[str], int]:
    if replace:
        await _clear_schema(db, project_id)
    schema = (await db.execute(select(Schema).where(Schema.project_id == project_id))).scalar_one_or_none()
    if not schema:
        schema = Schema(project_id=project_id)
        db.add(schema)
        await db.flush()

    table_mapping: dict[str, UUID] = {}
    for t in validated.tables:
        table = TableSchema(
            schema_id=schema.tracking_id,
            name=t.name,
            display_name=t.display_name or t.name.replace("_", " ").title(),
        )
        db.add(table)
        await db.flush()
        table_mapping[t.name] = table.tracking_id
        for idx, f in enumerate(t.fields):
            field_type_enum = FieldType(f.type)
            field = Field(
                table_id=table.tracking_id,
                name=f.name,
                display_name=f.name.replace("_", " ").title(),
                type=field_type_enum,
                required=f.required,
                unique=f.unique,
                config={"default": f.default} if f.default is not None else {},
                order=idx,
            )
            db.add(field)
        await db.flush()

    relations_count = 0
    for rel in validated.relations:
        rel_type_enum = RelationType(rel.type)
        relation = Relation(
            schema_id=schema.tracking_id,
            source_table_id=table_mapping[rel.from_table],
            target_table_id=table_mapping[rel.to_table],
            name=rel.name or f"{rel.from_table}_{rel.type}_{rel.to_table}",
            type=rel_type_enum,
            description=rel.description,
            source_key=rel.source_key,
            target_key=rel.target_key,
        )
        db.add(relation)
        relations_count += 1
    await db.flush()
    return list(table_mapping.keys()), relations_count


async def _persist_interface(
    db: AsyncSession,
    project_id: UUID,
    validated: ValidatedInterfaceOutput,
    *,
    replace: bool,
) -> tuple[list[str], int]:
    if replace:
        await _clear_interface(db, project_id)
    interface = (
        await db.execute(select(Interface).where(Interface.project_id == project_id))
    ).scalar_one_or_none()
    if not interface:
        interface = Interface(project_id=project_id, version=1)
        db.add(interface)
        await db.flush()

    page_type_mapping = {
        "mobile": TypePage.MOBILE,
        "tablet": TypePage.TABLET,
        "desktop": TypePage.DESKTOP,
    }
    pages_created: list[str] = []
    sections_created = 0
    for page_idx, page_data in enumerate(validated.pages):
        page = Page(
            interface_id=interface.tracking_id,
            nom=page_data.name,
            chemin=page_data.path,
            type_page=page_type_mapping.get(page_data.device, TypePage.DESKTOP),
            est_accueil=bool(page_data.is_home or page_idx == 0),
            ordre=page_idx,
        )
        db.add(page)
        await db.flush()
        pages_created.append(page_data.name)

        # Env-only atomicity test hook (never reads HTTP headers; requires explicit ENABLE_TEST_HOOKS=1).
        if (
            os.getenv("ENABLE_TEST_HOOKS", "").strip() == "1"
            and os.getenv("TEST_FAIL_TEMPLATE_INSTANTIATION", "").strip() == "1"
        ):
            logger.error("TEST_FAIL_TEMPLATE_INSTANTIATION=1 triggered simulated failure inside transaction")
            raise RuntimeError("Simulated transactional failure during section persistence")

        for sec_idx, sec in enumerate(page_data.sections):
            sec_connecte_a = sec.connecte_a or (sec.config.get("table") if isinstance(sec.config, dict) else None)
            sec_title = sec.title or (sec.config.get("title") if isinstance(sec.config, dict) else None)
            section = Section(
                page_id=page.tracking_id,
                type=sec.type,
                ordre=sec.ordre if sec.ordre is not None else sec_idx,
                config=sec.config or {},
                connecte_a=sec_connecte_a,
                title=sec_title,
            )
            db.add(section)
            sections_created += 1
    await db.flush()
    return pages_created, sections_created


async def _persist_workflows(
    db: AsyncSession,
    project_id: UUID,
    validated: ValidatedWorkflowsOutput,
    *,
    replace: bool,
) -> int:
    if replace:
        await _clear_workflows(db, project_id)
    count = 0
    for wf_data in validated.workflows:
        workflow = Workflow(
            project_id=project_id,
            nom=wf_data.nom,
            description=wf_data.description,
            actif=True,
        )
        db.add(workflow)
        await db.flush()
        for etape_data in wf_data.etapes:
            etape = EtapeWorkflow(
                workflow_id=workflow.tracking_id,
                type=etape_data.type,
                ordre=etape_data.ordre,
                config=etape_data.config,
            )
            db.add(etape)
        count += 1
    await db.flush()
    return count


async def apply_blueprint(
    db: AsyncSession,
    project_id: UUID,
    *,
    schema: ValidatedSchemaOutput | None = None,
    interface: ValidatedInterfaceOutput | None = None,
    workflows: ValidatedWorkflowsOutput | None = None,
    replace: bool = False,
) -> BlueprintApplyResult:
    """Persist validated schema, interface and/or workflows within the caller's transaction."""
    result = BlueprintApplyResult()
    if schema is not None:
        result.tables_created, result.relations_created = await _persist_schema(
            db, project_id, schema, replace=replace
        )
    if interface is not None:
        result.pages_created, result.sections_created = await _persist_interface(
            db, project_id, interface, replace=replace
        )
    if workflows is not None:
        result.workflows_created = await _persist_workflows(
            db, project_id, workflows, replace=replace
        )
    return result
