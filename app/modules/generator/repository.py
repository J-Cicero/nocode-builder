from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from app.modules.generator.models import Generation


class GenerationRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_tracking_id(self, tracking_id: UUID) -> Generation | None:
        result = await self.db.execute(
            select(Generation).where(Generation.tracking_id == tracking_id)
        )
        return result.scalar_one_or_none()

    async def get_by_project_id(self, project_id: UUID) -> list[Generation]:
        result = await self.db.execute(
            select(Generation)
            .where(Generation.project_id == project_id)
            .order_by(Generation.created_at.desc())
        )
        return list(result.scalars().all())

    async def create(self, project_id: UUID, nom: str) -> Generation:
        generation = Generation(
            project_id=project_id,
            nom=nom,
        )
        self.db.add(generation)
        await self.db.flush()
        await self.db.refresh(generation)
        return generation

    async def update(self, generation: Generation, data: dict) -> Generation:
        for field, value in data.items():
            setattr(generation, field, value)
        await self.db.flush()
        await self.db.refresh(generation)
        return generation
