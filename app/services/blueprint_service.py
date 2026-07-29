from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from app.repositories.core import blueprint_repo
from app.schemas import BlueprintCreate, BlueprintUpdate
from app.models import Blueprint

class BlueprintService:
    @staticmethod
    async def get_blueprint_by_uuid(db: AsyncSession, uuid: str) -> Optional[Blueprint]:
        return await blueprint_repo.get_by_uuid(db, uuid=uuid)

    @staticmethod
    async def get_blueprints_by_project(db: AsyncSession, project_id: int) -> List[Blueprint]:
        return await blueprint_repo.get_by_project(db, project_id=project_id)

    @staticmethod
    async def create_blueprint_from_dict(db: AsyncSession, blueprint_data: dict) -> Blueprint:
        db_obj = Blueprint(**blueprint_data)
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    @staticmethod
    async def update_blueprint(db: AsyncSession, db_obj: Blueprint, blueprint_in: BlueprintUpdate) -> Blueprint:
        return await blueprint_repo.update(db, db_obj=db_obj, obj_in=blueprint_in)

    @staticmethod
    async def delete_blueprint(db: AsyncSession, uuid: str) -> Blueprint:
        return await blueprint_repo.remove_by_uuid(db, uuid=uuid)

blueprint_service = BlueprintService()
