from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from app.repositories.core import workspace_repo
from app.schemas import WorkspaceCreate, WorkspaceUpdate
from app.models import Workspace

class WorkspaceService:
    @staticmethod
    async def get_workspace_by_uuid(db: AsyncSession, uuid: str) -> Optional[Workspace]:
        return await workspace_repo.get_by_uuid(db, uuid=uuid)

    @staticmethod
    async def get_workspaces(db: AsyncSession, skip: int = 0, limit: int = 100) -> List[Workspace]:
        return await workspace_repo.get_multi(db, skip=skip, limit=limit)

    @staticmethod
    async def create_workspace(db: AsyncSession, workspace_in: WorkspaceCreate) -> Workspace:
        return await workspace_repo.create(db, obj_in=workspace_in)

    @staticmethod
    async def update_workspace(db: AsyncSession, db_obj: Workspace, workspace_in: WorkspaceUpdate) -> Workspace:
        return await workspace_repo.update(db, db_obj=db_obj, obj_in=workspace_in)

    @staticmethod
    async def delete_workspace(db: AsyncSession, uuid: str) -> Workspace:
        return await workspace_repo.remove_by_uuid(db, uuid=uuid)

workspace_service = WorkspaceService()
