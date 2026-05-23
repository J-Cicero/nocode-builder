from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.core.database import get_db
from app.core.security import decode_token, oauth2_scheme
from app.modules.workflow_engine.service import WorkflowService
from app.modules.workflow_engine.schema import (
    WorkflowCreate,
    WorkflowUpdate,
    WorkflowResponse,
    ExecutionResponse,
    WorkflowGraphResponse,
    WorkflowGraphUpdate,
)
from app.modules.auth.repository import AuthRepository
from app.modules.auth.models import User


router = APIRouter(
    prefix="/workflows",
    tags=["Workflows"],
)


def get_workflow_service(db: AsyncSession = Depends(get_db)) -> WorkflowService:
    return WorkflowService(db)


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    from fastapi import HTTPException
    payload = decode_token(token)
    tracking_id = UUID(payload["sub"])
    repo = AuthRepository(db)
    user = await repo.get_by_tracking_id(tracking_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Utilisateur introuvable.",
        )
    return user


@router.post(
    "/{project_id}",
    response_model=WorkflowResponse,
    status_code=201,
    summary="Créer un workflow",
)
async def create_workflow(
    project_id: UUID,
    data: WorkflowCreate,
    current_user: User = Depends(get_current_user),
    service: WorkflowService = Depends(get_workflow_service),
):
    return await service.create_workflow(project_id, data)


@router.get(
    "/{project_id}",
    response_model=list[WorkflowResponse],
    summary="Lister les workflows d'un projet",
)
async def get_project_workflows(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    service: WorkflowService = Depends(get_workflow_service),
):
    return await service.get_project_workflows(project_id)


@router.get(
    "/detail/{tracking_id}",
    response_model=WorkflowResponse,
    summary="Récupérer les détails d'un workflow",
)
async def get_workflow(
    tracking_id: UUID,
    current_user: User = Depends(get_current_user),
    service: WorkflowService = Depends(get_workflow_service),
):
    return await service.get_workflow(tracking_id)


@router.patch(
    "/{tracking_id}",
    response_model=WorkflowResponse,
    summary="Modifier un workflow",
)
async def update_workflow(
    tracking_id: UUID,
    data: WorkflowUpdate,
    current_user: User = Depends(get_current_user),
    service: WorkflowService = Depends(get_workflow_service),
):
    return await service.update_workflow(tracking_id, data)


@router.delete(
    "/{tracking_id}",
    status_code=204,
    summary="Supprimer un workflow",
)
async def delete_workflow(
    tracking_id: UUID,
    current_user: User = Depends(get_current_user),
    service: WorkflowService = Depends(get_workflow_service),
):
    await service.delete_workflow(tracking_id)


@router.get(
    "/{workflow_id}/executions",
    response_model=list[ExecutionResponse],
    summary="Historique d'exécution d'un workflow",
)
async def get_workflow_executions(
    workflow_id: UUID,
    current_user: User = Depends(get_current_user),
    service: WorkflowService = Depends(get_workflow_service),
):
    return await service.get_executions(workflow_id)


# ─── GRAPH (React Flow) ─────────────────────────────────────────

@router.get(
    "/{workflow_id}/graph",
    response_model=WorkflowGraphResponse,
    summary="Obtenir le graphe (nodes/edges) d'un workflow",
)
async def get_workflow_graph(
    workflow_id: UUID,
    current_user: User = Depends(get_current_user),
    service: WorkflowService = Depends(get_workflow_service),
):
    return await service.get_graph(workflow_id)


@router.put(
    "/{workflow_id}/graph",
    response_model=WorkflowGraphResponse,
    summary="Mettre à jour le graphe (nodes/edges) d'un workflow",
)
async def update_workflow_graph(
    workflow_id: UUID,
    data: WorkflowGraphUpdate,
    current_user: User = Depends(get_current_user),
    service: WorkflowService = Depends(get_workflow_service),
):
    return await service.update_graph(workflow_id, data)
