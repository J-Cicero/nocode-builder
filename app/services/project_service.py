from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from app.repositories.core import project_repo
from app.schemas import ProjectCreate, ProjectUpdate
from app.models import Project

class ProjectService:
    @staticmethod
    async def get_project_by_uuid(db: AsyncSession, uuid: str) -> Optional[Project]:
        return await project_repo.get_by_uuid(db, uuid=uuid)

    @staticmethod
    async def get_projects(db: AsyncSession, skip: int = 0, limit: int = 100) -> List[Project]:
        return await project_repo.get_multi(db, skip=skip, limit=limit)

    @staticmethod
    async def create_project_from_dict(db: AsyncSession, project_data: dict) -> Project:
        db_obj = Project(**project_data)
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    @staticmethod
    async def update_project(db: AsyncSession, db_obj: Project, project_in: ProjectUpdate) -> Project:
        return await project_repo.update(db, db_obj=db_obj, obj_in=project_in)

    @staticmethod
    async def delete_project(db: AsyncSession, uuid: str) -> Project:
        return await project_repo.remove_by_uuid(db, uuid=uuid)

project_service = ProjectService()
