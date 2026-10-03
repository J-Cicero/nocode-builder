from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from app.modules.generator.models import Generation, Deployment, StatutDeployment


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


class DeploymentRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_tracking_id(self, tracking_id: UUID) -> Deployment | None:
        result = await self.db.execute(
            select(Deployment).where(Deployment.tracking_id == tracking_id)
        )
        return result.scalar_one_or_none()

    async def get_by_interface_id(self, interface_id: UUID) -> list[Deployment]:
        result = await self.db.execute(
            select(Deployment)
            .where(Deployment.interface_id == interface_id)
            .order_by(Deployment.created_at.desc())
        )
        return list(result.scalars().all())

    async def create(self, interface_id: UUID) -> Deployment:
        deployment = Deployment(
            interface_id=interface_id,
            status=StatutDeployment.PENDING,
        )
        self.db.add(deployment)
        await self.db.flush()
        await self.db.refresh(deployment)
        return deployment

    async def update(self, deployment: Deployment, data: dict) -> Deployment:
        for field, value in data.items():
            setattr(deployment, field, value)
        await self.db.flush()
        await self.db.refresh(deployment)
        return deployment
