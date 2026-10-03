from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas import BlueprintCreate, BlueprintUpdate, BlueprintResponse
from app.services.blueprint_service import blueprint_service
from app.services.project_service import project_service

router = APIRouter()

@router.post("/", response_model=BlueprintResponse, status_code=status.HTTP_201_CREATED)
async def create_blueprint(blueprint_in: BlueprintCreate, db: AsyncSession = Depends(get_db)):
    project = await project_service.get_project_by_uuid(db, uuid=blueprint_in.project_uuid)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    blueprint_data = blueprint_in.model_dump()
    del blueprint_data["project_uuid"]
    blueprint_data["project_id"] = project.id
    
    return await blueprint_service.create_blueprint_from_dict(db, blueprint_data)

@router.get("/{uuid}", response_model=BlueprintResponse)
async def read_blueprint(uuid: str, db: AsyncSession = Depends(get_db)):
    blueprint = await blueprint_service.get_blueprint_by_uuid(db, uuid=uuid)
    if not blueprint:
        raise HTTPException(status_code=404, detail="Blueprint not found")
    return blueprint

@router.put("/{uuid}", response_model=BlueprintResponse)
async def update_blueprint(uuid: str, blueprint_in: BlueprintUpdate, db: AsyncSession = Depends(get_db)):
    blueprint = await blueprint_service.get_blueprint_by_uuid(db, uuid=uuid)
    if not blueprint:
        raise HTTPException(status_code=404, detail="Blueprint not found")
    return await blueprint_service.update_blueprint(db, db_obj=blueprint, blueprint_in=blueprint_in)
