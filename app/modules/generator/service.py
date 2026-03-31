from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from datetime import datetime
from sqlalchemy import select
import httpx

from app.core.config import settings
from app.modules.generator.repository import GenerationRepository, DeploymentRepository
from app.modules.generator.models import Generation, StatutGeneration, StatutDeployment
from app.modules.generator.schema import (
    GenerationCreate,
    GenerationResponse,
    DeploymentPreviewResponse,
    DeploymentResponse,
)
from app.modules.generator.generator_engine import GeneratorEngine
from app.modules.interface_builder.models import Interface, Page, Composant
from app.modules.projects.repository import ProjectRepository
from app.modules.generator.preview_renderer import render_preview_site, build_static_site_files


class GeneratorService:

    def __init__(self, db: AsyncSession):
        self.repo = GenerationRepository(db)
        self.deployment_repo = DeploymentRepository(db)
        self.project_repo = ProjectRepository(db)
        self.db = db

    async def generate_project(
        self,
        project_id: UUID,
        data: GenerationCreate,
    ) -> GenerationResponse:
        """Lance la génération d'une nouvelle appli"""
        
        # Crée l'entrée de génération
        generation = await self.repo.create(
            project_id=project_id,
            nom=data.nom,
        )

        try:
            # Change le statut
            await self.repo.update(
                generation,
                {"statut": StatutGeneration.IN_PROGRESS}
            )

            # Lance la génération
            engine = GeneratorEngine(self.db, project_id)
            zip_path = await engine.generate()

            # Mise à jour réussie
            update_data = {
                "statut": StatutGeneration.COMPLETED,
                "url_zip": zip_path,
                "completed_at": datetime.utcnow(),
            }
            generation = await self.repo.update(generation, update_data)

        except Exception as e:
            # Erreur
            update_data = {
                "statut": StatutGeneration.FAILED,
                "erreur": str(e),
                "completed_at": datetime.utcnow(),
            }
            generation = await self.repo.update(generation, update_data)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Erreur lors de la génération: {str(e)}"
            )

        return GenerationResponse.from_orm(generation)

    async def get_generation(self, tracking_id: UUID) -> GenerationResponse:
        """Récupère une génération"""
        generation = await self.repo.get_by_tracking_id(tracking_id)
        if not generation:
            raise HTTPException(
                status_code=404,
                detail="Génération introuvable"
            )
        return GenerationResponse.from_orm(generation)

    async def get_project_generations(
        self,
        project_id: UUID,
    ) -> list[GenerationResponse]:
        """Récupère toutes les générations d'un projet"""
        generations = await self.repo.get_by_project_id(project_id)
        return [GenerationResponse.from_orm(g) for g in generations]

    async def deploy_preview(self, project_id: UUID, base_url: str) -> DeploymentPreviewResponse:
        interface_stmt = select(Interface).where(Interface.project_id == project_id)
        interface_result = await self.db.execute(interface_stmt)
        interface = interface_result.scalar_one_or_none()
        if not interface:
            raise HTTPException(status_code=404, detail="Interface introuvable")

        pages_stmt = (
            select(Page)
            .where(Page.interface_id == interface.tracking_id)
            .order_by(Page.ordre)
        )
        pages_result = await self.db.execute(pages_stmt)
        pages = list(pages_result.scalars().all())
        if not pages:
            raise HTTPException(status_code=400, detail="Aucune page a deployer")

        pages_payload = []
        for page in pages:
            composants_stmt = (
                select(Composant)
                .where((Composant.page_id == page.tracking_id) & (Composant.parent_id == None))
                .order_by(Composant.ordre)
            )
            composants_result = await self.db.execute(composants_stmt)
            composants = list(composants_result.scalars().all())
            pages_payload.append(
                {
                    "nom": page.nom,
                    "chemin": page.chemin,
                    "type_page": page.type_page.value if hasattr(page.type_page, "value") else str(page.type_page),
                    "est_accueil": page.est_accueil,
                    "composants": [
                        {
                            "largeur": composant.largeur,
                            "hauteur": composant.hauteur,
                            "config": composant.config,
                        }
                        for composant in composants
                    ],
                }
            )

        deployment_id = str(project_id)
        render_preview_site(str(project_id), pages_payload, deployment_id)
        preview_url = f"{base_url.rstrip('/')}/public-deployments/{deployment_id}/"

        return DeploymentPreviewResponse(
            success=True,
            message="Preview deployed successfully",
            preview_url=preview_url,
        )

    async def deploy_to_vercel(self, project_id: UUID) -> DeploymentResponse:
        if not settings.VERCEL_TOKEN:
            raise HTTPException(status_code=400, detail="VERCEL_TOKEN is not configured on the backend.")

        project = await self.project_repo.get_by_tracking_id(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Projet introuvable")

        interface_stmt = select(Interface).where(Interface.project_id == project_id)
        interface_result = await self.db.execute(interface_stmt)
        interface = interface_result.scalar_one_or_none()
        if not interface:
            raise HTTPException(status_code=404, detail="Interface introuvable")

        pages_stmt = (
            select(Page)
            .where(Page.interface_id == interface.tracking_id)
            .order_by(Page.ordre)
        )
        pages_result = await self.db.execute(pages_stmt)
        pages = list(pages_result.scalars().all())
        if not pages:
            raise HTTPException(status_code=400, detail="Aucune page a deployer")

        pages_payload = []
        for page in pages:
            composants_stmt = (
                select(Composant)
                .where((Composant.page_id == page.tracking_id) & (Composant.parent_id == None))
                .order_by(Composant.ordre)
            )
            composants_result = await self.db.execute(composants_stmt)
            composants = list(composants_result.scalars().all())
            pages_payload.append(
                {
                    "nom": page.nom,
                    "chemin": page.chemin,
                    "type_page": page.type_page.value if hasattr(page.type_page, "value") else str(page.type_page),
                    "est_accueil": page.est_accueil,
                    "composants": [
                        {
                            "largeur": composant.largeur,
                            "hauteur": composant.hauteur,
                            "config": composant.config,
                        }
                        for composant in composants
                    ],
                }
            )

        deployment = await self.deployment_repo.create(interface.tracking_id)
        await self.db.commit()
        await self.db.refresh(deployment)
        files = build_static_site_files(project.name, pages_payload)
        payload = {
            "name": f"{project.slug}-buildr-preview",
            "target": "production",
            "projectSettings": {
                "framework": None,
                "outputDirectory": ".",
            },
            "files": [{"file": filename, "data": content} for filename, content in files.items()],
        }
        params = {}
        if settings.VERCEL_TEAM_SLUG:
            params["slug"] = settings.VERCEL_TEAM_SLUG

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    "https://api.vercel.com/v13/deployments",
                    params=params,
                    headers={
                        "Authorization": f"Bearer {settings.VERCEL_TOKEN}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                )
            response.raise_for_status()
            data = response.json()
            url = data.get("url")
            if url and not url.startswith("http"):
                url = f"https://{url}"
            if not url:
                await self.deployment_repo.update(deployment, {"status": StatutDeployment.FAILED})
                await self.db.commit()
                raise HTTPException(status_code=502, detail="Vercel deployment did not return a public URL.")
        except httpx.HTTPStatusError as exc:
            await self.deployment_repo.update(deployment, {"status": StatutDeployment.FAILED})
            await self.db.commit()
            detail = exc.response.text or "Vercel deployment failed."
            raise HTTPException(status_code=502, detail=f"Vercel deployment failed: {detail}")
        except Exception as exc:
            await self.deployment_repo.update(deployment, {"status": StatutDeployment.FAILED})
            await self.db.commit()
            raise HTTPException(status_code=500, detail=f"Deployment error: {str(exc)}")

        deployment = await self.deployment_repo.update(
            deployment,
            {
                "url": url,
                "status": StatutDeployment.COMPLETED,
            },
        )
        await self.db.commit()
        return DeploymentResponse.from_orm(deployment)
