from fastapi import APIRouter, Depends, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
import os

from app.core.database import get_db
from app.core.security import decode_token, oauth2_scheme
from app.modules.generator.service import GeneratorService
from app.modules.generator.schema import (
    GenerationCreate,
    GenerationResponse,
    GenerationListResponse,
)
from app.modules.auth.repository import AuthRepository
from app.modules.auth.models import User


router = APIRouter(
    prefix="/generator",
    tags=["Generator"],
)


def get_generator_service(db: AsyncSession = Depends(get_db)) -> GeneratorService:
    return GeneratorService(db)


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
    response_model=GenerationResponse,
    status_code=201,
    summary="Générer une nouvelle appli",
)
async def generate_project(
    project_id: UUID,
    data: GenerationCreate,
    current_user: User = Depends(get_current_user),
    service: GeneratorService = Depends(get_generator_service),
):
    return await service.generate_project(project_id, data)


@router.get(
    "/{project_id}",
    response_model=GenerationListResponse,
    summary="Lister toutes les générations d'un projet",
)
async def get_project_generations(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    service: GeneratorService = Depends(get_generator_service),
):
    generations = await service.get_project_generations(project_id)
    return {
        "total": len(generations),
        "generations": generations,
    }


@router.get(
    "/generation/{tracking_id}",
    response_model=GenerationResponse,
    summary="Récupérer une génération",
)
async def get_generation(
    tracking_id: UUID,
    current_user: User = Depends(get_current_user),
    service: GeneratorService = Depends(get_generator_service),
):
    return await service.get_generation(tracking_id)


@router.get(
    "/download/{tracking_id}",
    summary="Télécharger le ZIP généré",
)
async def download_generation(
    tracking_id: UUID,
    current_user: User = Depends(get_current_user),
    service: GeneratorService = Depends(get_generator_service),
):
    generation = await service.get_generation(tracking_id)
    
    if not generation.url_zip or not os.path.exists(generation.url_zip):
        raise HTTPException(
            status_code=404,
            detail="Fichier ZIP introuvable",
        )
    
    return FileResponse(
        path=generation.url_zip,
        media_type="application/zip",
        filename=f"{generation.nom}.zip",
    )
