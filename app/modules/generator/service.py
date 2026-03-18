from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from datetime import datetime

from app.modules.generator.repository import GenerationRepository
from app.modules.generator.models import Generation, StatutGeneration
from app.modules.generator.schema import GenerationCreate, GenerationResponse
from app.modules.generator.generator_engine import GeneratorEngine


class GeneratorService:

    def __init__(self, db: AsyncSession):
        self.repo = GenerationRepository(db)
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
