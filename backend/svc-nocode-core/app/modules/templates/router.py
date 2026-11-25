"""API routes for listing and instantiating server-side templates."""
from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.identity import Identity, get_current_identity
from app.modules.projects.schema import ProjectResponse
from app.modules.templates.schemas import TemplateInstantiateRequest, TemplateSummary
from app.modules.templates.service import TemplateService

router = APIRouter(prefix="/templates", tags=["Templates"])


def get_template_service(db: AsyncSession = Depends(get_db)) -> TemplateService:
    return TemplateService(db)


@router.get(
    "",
    response_model=list[TemplateSummary],
    summary="Lister les templates disponibles",
)
async def list_templates(
    _: Identity = Depends(get_current_identity),
    service: TemplateService = Depends(get_template_service),
) -> list[TemplateSummary]:
    return service.list_templates()


@router.post(
    "/{template_id}/instantiate",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Instancier un template dans un nouveau projet",
)
async def instantiate_template(
    template_id: str,
    data: TemplateInstantiateRequest,
    current_user: Identity = Depends(get_current_identity),
    service: TemplateService = Depends(get_template_service),
):
    return await service.instantiate(template_id, data, current_user)
