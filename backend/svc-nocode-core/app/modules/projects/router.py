from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from uuid import UUID
from app.core.database import get_db
from app.core.identity import get_current_identity as get_current_user, Identity as User
from app.core.service_auth import require_service_token
from app.modules.projects.schema import (
    ProjectCreate, ProjectUpdate, ProjectStatusUpdate,
    ProjectResponse, ProjectListResponse,
)
from app.modules.projects.service import ProjectService
from app.modules.projects.repository import ProjectRepository

router = APIRouter(prefix="/projects", tags=[" Projets"])


def get_project_service(db: AsyncSession = Depends(get_db)) -> ProjectService:
    return ProjectService(ProjectRepository(db))




@router.get(
    "/", 
    response_model=ProjectListResponse, 
    summary="Récupérer mes projets",
    description="Récupère la liste complète de tous les projets appartenant à l'utilisateur connecté, avec le nombre total de projets."
)
async def get_my_projects(
    current_user: User = Depends(get_current_user),
    service: ProjectService = Depends(get_project_service),
):
    return await service.get_my_projects(current_user)


@router.post(
    "/", 
    response_model=ProjectResponse, 
    status_code=201, 
    summary="Créer un nouveau projet",
    description="Crée un nouveau projet avec les informations fournies. Le projet est automatiquement assigné à l'utilisateur connecté et un slug unique est généré."
)
async def create_project(
    data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    service: ProjectService = Depends(get_project_service),
):
    return await service.create_project(data, current_user)


@router.get(
    "/{tracking_id}", 
    response_model=ProjectResponse, 
    summary="Récupérer les détails d'un projet",
    description="Récupère les informations complètes d'un projet spécifique. L'utilisateur doit être propriétaire ou le projet doit être public."
)
async def get_project(
    tracking_id: UUID,
    current_user: User = Depends(get_current_user),
    service: ProjectService = Depends(get_project_service),
):
    return await service.get_project(tracking_id, current_user)


@router.patch(
    "/{tracking_id}", 
    response_model=ProjectResponse, 
    summary="Modifier un projet",
    description="Modifie les informations d'un projet (nom, description, configuration, etc.). Seul le propriétaire ou un administrateur peut effectuer cette action."
)
async def update_project(
    tracking_id: UUID,
    data: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    service: ProjectService = Depends(get_project_service),
):
    return await service.update_project(tracking_id, data, current_user)


@router.patch(
    "/{tracking_id}/status", 
    response_model=ProjectResponse, 
    summary="Modifier le statut d'un projet",
    description="Change le statut d'un projet (brouillon, publié ou archivé). Seul le propriétaire ou un administrateur peut effectuer cette action."
)
async def update_status(
    tracking_id: UUID,
    data: ProjectStatusUpdate,
    current_user: User = Depends(get_current_user),
    service: ProjectService = Depends(get_project_service),
):
    return await service.update_status(tracking_id, data, current_user)


@router.post(
    "/{tracking_id}/duplicate", 
    response_model=ProjectResponse, 
    status_code=201, 
    summary="Dupliquer un projet",
    description="Crée une copie complète d'un projet existant. La copie est assignée à l'utilisateur connecté et le statut est remis à 'brouillon'."
)
async def duplicate_project(
    tracking_id: UUID,
    current_user: User = Depends(get_current_user),
    service: ProjectService = Depends(get_project_service),
):
    return await service.duplicate_project(tracking_id, current_user)


@router.delete(
    "/{tracking_id}", 
    status_code=204, 
    summary="Supprimer un projet",
    description="Supprime complètement un projet de la base de données. Seul le propriétaire ou un administrateur peut effectuer cette action. Cette action est irréversible."
)
async def delete_project(
    tracking_id: UUID,
    current_user: User = Depends(get_current_user),
    service: ProjectService = Depends(get_project_service),
):
    await service.delete_project(tracking_id, current_user)


@router.post("/internal/erase-user/{user_id}", status_code=status.HTTP_200_OK)
async def erase_user_projects(
    user_id: UUID,
    caller: str = Depends(require_service_token("svc-consent-dsar")),
    db: AsyncSession = Depends(get_db),
):
    """Fulfills the project-data side of a GDPR erasure DSAR: deletes every
    project this user owns. Unlike svc-iam's anonymize-in-place approach,
    a hard delete is correct here -- nothing else references a project's
    primary key across services, so there's no orphaned-foreign-key risk,
    and 'my app configurations' is squarely inside what erasure should
    remove, not just identity fields.

    Only callable by svc-consent-dsar's orchestration."""
    repo = ProjectRepository(db)
    projects = await repo.get_all_by_owner(user_id)
    for project in projects:
        await repo.delete(project)
    await db.commit()
    return {"erased": True, "projects_deleted": len(projects)}
