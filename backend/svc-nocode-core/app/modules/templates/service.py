"""Business service for listing and atomically instantiating server templates."""
from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.app_builder import apply_blueprint
from app.core.identity import Identity
from app.modules.projects.models import Project
from app.modules.projects.repository import ProjectRepository
from app.modules.templates.catalog import TEMPLATE_CATALOG
from app.modules.templates.schemas import TemplateInstantiateRequest, TemplateSummary


class TemplateService:
    """Handles template catalog listing and single-transaction project creation."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.project_repo = ProjectRepository(db)

    @staticmethod
    def list_templates() -> list[TemplateSummary]:
        summaries: list[TemplateSummary] = []
        for tpl in TEMPLATE_CATALOG.values():
            section_types = sorted(
                {sec.type for page in tpl.interface.pages for sec in page.sections}
            )
            summaries.append(
                TemplateSummary(
                    id=tpl.id,
                    name=tpl.name,
                    description=tpl.description,
                    tables_count=len(tpl.schema_def.tables),
                    pages_count=len(tpl.interface.pages),
                    section_types=section_types,
                )
            )
        return summaries

    async def instantiate(
        self,
        template_id: str,
        data: TemplateInstantiateRequest,
        current_user: Identity,
    ) -> Project:
        tpl = TEMPLATE_CATALOG.get(template_id)
        if tpl is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Template '{template_id}' introuvable.",
            )

        try:
            project = await self.project_repo.create(
                name=data.name,
                description=data.description if data.description is not None else tpl.description,
                is_public=False,
                owner_id=current_user.tracking_id,
            )
            await apply_blueprint(
                self.db,
                project.tracking_id,
                schema=tpl.schema_def,
                interface=tpl.interface,
                replace=False,
            )
            await self.db.commit()
            await self.db.refresh(project)
            return project
        except Exception:
            await self.db.rollback()
            raise
