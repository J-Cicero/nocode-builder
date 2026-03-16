from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.core.database import get_db
from app.core.security import decode_token, oauth2_scheme
from app.modules.projects.schema import (
    ProjectCreate, ProjectUpdate, ProjectStatusUpdate,
    ProjectResponse, ProjectListResponse,
)
from app.modules.projects.service import ProjectService
from app.modules.projects.repository import ProjectRepository
from app.modules.auth.repository import AuthRepository
from app.modules.auth.models import User

router = APIRouter(prefix="/projects", tags=["🚀 Projets"])


def get_project_service(db: AsyncSession = Depends(get_db)) -> ProjectService:
    return ProjectService(ProjectRepository(db))


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    from fastapi import HTTPException
    payload = decode_token(token)
    tracking_id = UUID(payload["sub"])
    user = await AuthRepository(db).get_by_tracking_id(tracking_id)
    if not user:
        raise HTTPException(status_code=401, detail="Utilisateur introuvable.")
    return user


@router.get("/", response_model=ProjectListResponse, summary="Mes projets")
async def get_my_projects(
    current_user: User = Depends(get_current_user),
    service: ProjectService = Depends(get_project_service),
):
    return await service.get_my_projects(current_user)


@router.post("/", response_model=ProjectResponse, status_code=201, summary="Créer un projet")
async def create_project(
    data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    service: ProjectService = Depends(get_project_service),
):
    return await service.create_project(data, current_user)


@router.get("/{tracking_id}", response_model=ProjectResponse, summary="Détails d'un projet")
async def get_project(
    tracking_id: UUID,
    current_user: User = Depends(get_current_user),
    service: ProjectService = Depends(get_project_service),
):
    return await service.get_project(tracking_id, current_user)


@router.patch("/{tracking_id}", response_model=ProjectResponse, summary="Modifier un projet")
async def update_project(
    tracking_id: UUID,
    data: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    service: ProjectService = Depends(get_project_service),
):
    return await service.update_project(tracking_id, data, current_user)


@router.patch("/{tracking_id}/status", response_model=ProjectResponse, summary="Changer le statut")
async def update_status(
    tracking_id: UUID,
    data: ProjectStatusUpdate,
    current_user: User = Depends(get_current_user),
    service: ProjectService = Depends(get_project_service),
):
    return await service.update_status(tracking_id, data, current_user)


@router.post("/{tracking_id}/duplicate", response_model=ProjectResponse, status_code=201, summary="Dupliquer")
async def duplicate_project(
    tracking_id: UUID,
    current_user: User = Depends(get_current_user),
    service: ProjectService = Depends(get_project_service),
):
    return await service.duplicate_project(tracking_id, current_user)


@router.delete("/{tracking_id}", status_code=204, summary="Supprimer un projet")
async def delete_project(
    tracking_id: UUID,
    current_user: User = Depends(get_current_user),
    service: ProjectService = Depends(get_project_service),
):
    await service.delete_project(tracking_id, current_user)
