from fastapi import APIRouter, Depends, status, Request, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
import os

from uuid import UUID
from app.core.database import get_db
from app.core.identity import get_current_identity as get_current_user, Identity as User
from app.modules.generator.service import GeneratorService
from app.modules.generator.schema import (
    GenerationCreate,
    GenerationResponse,
    GenerationListResponse,
    DeploymentPreviewResponse,
    DeploymentCreate,
    DeploymentResponse,
)


router = APIRouter(
    prefix="/generator",
    tags=["Generator"],
)


def get_generator_service(db: AsyncSession = Depends(get_db)) -> GeneratorService:
    return GeneratorService(db)




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


@router.post(
    "/{project_id}/deploy-preview",
    response_model=DeploymentPreviewResponse,
    status_code=200,
    summary="Deployer une preview statique",
)
async def deploy_preview(
    project_id: UUID,
    request: Request,
    current_user: User = Depends(get_current_user),
    service: GeneratorService = Depends(get_generator_service),
):
    return await service.deploy_preview(project_id, str(request.base_url).rstrip("/"))


@router.post(
    "/deploy",
    response_model=DeploymentResponse,
    status_code=201,
    summary="Deployer sur Vercel",
)
async def deploy_to_vercel(
    data: DeploymentCreate,
    current_user: User = Depends(get_current_user),
    service: GeneratorService = Depends(get_generator_service),
):
    return await service.deploy_to_vercel(data.project_id)
