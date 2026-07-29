from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.core.database import get_db
from app.schemas import ProjectCreate, ProjectUpdate, ProjectResponse, BlueprintResponse
from app.services.project_service import project_service
from app.services.blueprint_service import blueprint_service
from app.services.workspace_service import workspace_service

router = APIRouter()

@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(project_in: ProjectCreate, db: AsyncSession = Depends(get_db)):
    if project_in.workspace_uuid:
        workspace = await workspace_service.get_workspace_by_uuid(db, uuid=project_in.workspace_uuid)
        if not workspace:
            raise HTTPException(status_code=404, detail="Workspace not found")
    else:
        workspace = await workspace_service.get_default_workspace(db)
    
    project_data = project_in.model_dump()
    project_data.pop("workspace_uuid", None)
    project_data["workspace_id"] = workspace.id
    
    return await project_service.create_project_from_dict(db, project_data)

@router.get("/", response_model=List[ProjectResponse])
async def read_projects(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    return await project_service.get_projects(db, skip=skip, limit=limit)

@router.get("/{uuid}", response_model=ProjectResponse)
async def read_project(uuid: str, db: AsyncSession = Depends(get_db)):
    project = await project_service.get_project_by_uuid(db, uuid=uuid)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.put("/{uuid}", response_model=ProjectResponse)
async def update_project(uuid: str, project_in: ProjectUpdate, db: AsyncSession = Depends(get_db)):
    project = await project_service.get_project_by_uuid(db, uuid=uuid)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return await project_service.update_project(db, db_obj=project, project_in=project_in)

@router.delete("/{uuid}", response_model=ProjectResponse)
async def delete_project(uuid: str, db: AsyncSession = Depends(get_db)):
    project = await project_service.get_project_by_uuid(db, uuid=uuid)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return await project_service.delete_project(db, uuid=uuid)

@router.get("/{uuid}/blueprints", response_model=List[BlueprintResponse])
async def read_project_blueprints(uuid: str, db: AsyncSession = Depends(get_db)):
    project = await project_service.get_project_by_uuid(db, uuid=uuid)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return await blueprint_service.get_blueprints_by_project(db, project_id=project.id)
