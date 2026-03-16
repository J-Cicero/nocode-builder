from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
import re

from app.modules.projects.models import Project, ProjectStatus


def slugify(text: str, owner_id: UUID) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return f"{text}-{str(owner_id)[:8]}"


class ProjectRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_tracking_id(self, tracking_id: UUID) -> Project | None:
        result = await self.db.execute(
            select(Project).where(Project.tracking_id == tracking_id)
        )
        return result.scalar_one_or_none()

    async def get_all_by_owner(self, owner_id: UUID) -> list[Project]:
        result = await self.db.execute(
            select(Project)
            .where(Project.owner_id == owner_id)
            .order_by(Project.created_at.desc())
        )
        return list(result.scalars().all())

    async def create(self, name: str, description: str | None, is_public: bool, owner_id: UUID) -> Project:
        project = Project(
            name=name,
            description=description,
            slug=slugify(name, owner_id),
            is_public=is_public,
            owner_id=owner_id,
            config={
                "theme": {"primary_color": "#3B82F6", "font": "Inter"},
                "pages": [],
                "datasources": [],
            },
        )
        self.db.add(project)
        await self.db.flush()
        await self.db.refresh(project)
        return project

    async def update(self, project: Project, data: dict) -> Project:
        for field, value in data.items():
            setattr(project, field, value)
        await self.db.flush()
        await self.db.refresh(project)
        return project

    async def delete(self, project: Project) -> None:
        await self.db.delete(project)
        await self.db.flush()

    async def duplicate(self, project: Project, owner_id: UUID) -> Project:
        new_project = Project(
            name=f"{project.name} (copie)",
            description=project.description,
            slug=slugify(f"{project.name}-copie", owner_id),
            is_public=False,
            owner_id=owner_id,
            config=project.config.copy(),
        )
        self.db.add(new_project)
        await self.db.flush()
        await self.db.refresh(new_project)
        return new_project
