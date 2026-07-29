from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from app.repositories.base import BaseRepository
from app.models import Workspace, Project, Blueprint
from app.schemas import WorkspaceCreate, WorkspaceUpdate, ProjectCreate, ProjectUpdate, BlueprintCreate, BlueprintUpdate

class WorkspaceRepository(BaseRepository[Workspace, WorkspaceCreate, WorkspaceUpdate]):
    pass

class ProjectRepository(BaseRepository[Project, ProjectCreate, ProjectUpdate]):
    async def get_by_workspace(self, db: AsyncSession, workspace_id: int) -> List[Project]:
        result = await db.execute(select(self.model).filter(self.model.workspace_id == workspace_id))
        return list(result.scalars().all())

class BlueprintRepository(BaseRepository[Blueprint, BlueprintCreate, BlueprintUpdate]):
    async def get_by_project(self, db: AsyncSession, project_id: int) -> List[Blueprint]:
        result = await db.execute(select(self.model).filter(self.model.project_id == project_id))
        return list(result.scalars().all())

workspace_repo = WorkspaceRepository(Workspace)
project_repo = ProjectRepository(Project)
blueprint_repo = BlueprintRepository(Blueprint)
