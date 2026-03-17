from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.core.database import get_db
from app.core.security import decode_token, oauth2_scheme
from app.modules.data_engine.schema import DonneeCreate, DonneeUpdate, DonneeResponse, DonneeListResponse
from app.modules.data_engine.service import DataEngineService
from app.modules.auth.repository import AuthRepository
from app.modules.auth.models import User

router = APIRouter(prefix="/data", tags=[" Data Engine"])


def get_data_service(db: AsyncSession = Depends(get_db)) -> DataEngineService:
    return DataEngineService(db)


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


@router.post(
    "/projects/{project_id}/{table_name}",
    response_model=DonneeResponse,
    status_code=201,
    summary="Créer une nouvelle entrée de données",
    description="Crée une nouvelle entrée dans une table après validation contre le schéma défini."
)
async def create_data(
    project_id: int,
    table_name: str,
    data: DonneeCreate,
    current_user: User = Depends(get_current_user),
    service: DataEngineService = Depends(get_data_service),
):
    return await service.create(project_id, table_name, data, current_user.tracking_id)


@router.get(
    "/projects/{project_id}/{table_name}",
    response_model=DonneeListResponse,
    summary="Lister toutes les entrées d'une table",
    description="Récupère toutes les données stockées dans une table spécifique d'un projet."
)
async def list_data(
    project_id: int,
    table_name: str,
    current_user: User = Depends(get_current_user),
    service: DataEngineService = Depends(get_data_service),
):
    return await service.list(project_id, table_name)


@router.get(
    "/projects/{project_id}/{table_name}/{donnee_id}",
    response_model=DonneeResponse,
    summary="Récupérer une entrée spécifique",
    description="Récupère les détails complets d'une seule entrée de données."
)
async def get_data(
    project_id: int,
    table_name: str,
    donnee_id: UUID,
    current_user: User = Depends(get_current_user),
    service: DataEngineService = Depends(get_data_service),
):
    return await service.get(donnee_id)


@router.put(
    "/projects/{project_id}/{table_name}/{donnee_id}",
    response_model=DonneeResponse,
    summary="Modifier une entrée de données",
    description="Met à jour le contenu d'une entrée et sauvegarde automatiquement l'historique des modifications."
)
async def update_data(
    project_id: int,
    table_name: str,
    donnee_id: UUID,
    data: DonneeUpdate,
    current_user: User = Depends(get_current_user),
    service: DataEngineService = Depends(get_data_service),
):
    return await service.update(donnee_id, data, current_user.tracking_id)


@router.delete(
    "/projects/{project_id}/{table_name}/{donnee_id}",
    status_code=204,
    summary="Supprimer une entrée de données",
    description="Supprime complètement une entrée ainsi que son historique. Cette action est irréversible."
)
async def delete_data(
    project_id: int,
    table_name: str,
    donnee_id: UUID,
    current_user: User = Depends(get_current_user),
    service: DataEngineService = Depends(get_data_service),
):
    await service.delete(donnee_id)
