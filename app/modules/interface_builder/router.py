from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.core.database import get_db
from app.core.security import decode_token, oauth2_scheme
from app.modules.interface_builder.service import InterfaceService
from app.modules.interface_builder.schema import (
    PageCreate,
    PageUpdate,
    PageResponse,
    ComposantCreate,
    ComposantUpdate,
    ComposantResponse,
    InterfaceResponse,
)
from app.modules.auth.repository import AuthRepository
from app.modules.auth.models import User


router = APIRouter(
    prefix="/interface",
    tags=["Interface Builder"],
)


def get_interface_service(db: AsyncSession = Depends(get_db)) -> InterfaceService:
    return InterfaceService(db)


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


# ─── INTERFACE ─────────────────────────────────────

@router.get(
    "/{project_id}",
    response_model=InterfaceResponse,
    summary="Obtenir l'interface d'un projet",
)
async def get_interface(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    service: InterfaceService = Depends(get_interface_service),
):
    return await service.get_or_create_interface(project_id)


# ─── PAGES ─────────────────────────────────────────

@router.post(
    "/{project_id}/pages",
    response_model=PageResponse,
    status_code=201,
    summary="Créer une page",
)
async def create_page(
    project_id: UUID,
    data: PageCreate,
    current_user: User = Depends(get_current_user),
    service: InterfaceService = Depends(get_interface_service),
):
    return await service.create_page(project_id, data)


@router.get(
    "/pages/{page_id}",
    response_model=PageResponse,
    summary="Obtenir les détails d'une page",
)
async def get_page(
    page_id: UUID,
    current_user: User = Depends(get_current_user),
    service: InterfaceService = Depends(get_interface_service),
):
    return await service.get_page(page_id)


@router.patch(
    "/pages/{page_id}",
    response_model=PageResponse,
    summary="Modifier une page",
)
async def update_page(
    page_id: UUID,
    data: PageUpdate,
    current_user: User = Depends(get_current_user),
    service: InterfaceService = Depends(get_interface_service),
):
    return await service.update_page(page_id, data)


@router.delete(
    "/pages/{page_id}",
    status_code=204,
    summary="Supprimer une page",
)
async def delete_page(
    page_id: UUID,
    current_user: User = Depends(get_current_user),
    service: InterfaceService = Depends(get_interface_service),
):
    await service.delete_page(page_id)


# ─── COMPOSANTS ────────────────────────────────────

@router.post(
    "/pages/{page_id}/composants",
    response_model=ComposantResponse,
    status_code=201,
    summary="Créer un composant",
)
async def create_composant(
    page_id: UUID,
    data: ComposantCreate,
    current_user: User = Depends(get_current_user),
    service: InterfaceService = Depends(get_interface_service),
):
    return await service.create_composant(page_id, data)


@router.get(
    "/composants/{composant_id}",
    response_model=ComposantResponse,
    summary="Obtenir les détails d'un composant",
)
async def get_composant(
    composant_id: UUID,
    current_user: User = Depends(get_current_user),
    service: InterfaceService = Depends(get_interface_service),
):
    return await service.get_composant(composant_id)


@router.patch(
    "/composants/{composant_id}",
    response_model=ComposantResponse,
    summary="Modifier un composant",
)
async def update_composant(
    composant_id: UUID,
    data: ComposantUpdate,
    current_user: User = Depends(get_current_user),
    service: InterfaceService = Depends(get_interface_service),
):
    return await service.update_composant(composant_id, data)


@router.delete(
    "/composants/{composant_id}",
    status_code=204,
    summary="Supprimer un composant",
)
async def delete_composant(
    composant_id: UUID,
    current_user: User = Depends(get_current_user),
    service: InterfaceService = Depends(get_interface_service),
):
    await service.delete_composant(composant_id)


@router.post(
    "/pages/{page_id}/composants/reorder",
    summary="Réordonner les composants d'une page",
)
async def reorder_composants(
    page_id: UUID,
    ordre: list[dict],
    current_user: User = Depends(get_current_user),
    service: InterfaceService = Depends(get_interface_service),
):
    return await service.reorder_composants(page_id, ordre)
