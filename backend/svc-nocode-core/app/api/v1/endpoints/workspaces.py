from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.core.database import get_db
from app.schemas import WorkspaceCreate, WorkspaceUpdate, WorkspaceResponse
from app.services.workspace_service import workspace_service

router = APIRouter()

@router.post("/", response_model=WorkspaceResponse, status_code=status.HTTP_201_CREATED)
async def create_workspace(workspace_in: WorkspaceCreate, db: AsyncSession = Depends(get_db)):
    return await workspace_service.create_workspace(db, workspace_in)

@router.get("/", response_model=List[WorkspaceResponse])
async def read_workspaces(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    return await workspace_service.get_workspaces(db, skip=skip, limit=limit)

@router.get("/{uuid}", response_model=WorkspaceResponse)
async def read_workspace(uuid: str, db: AsyncSession = Depends(get_db)):
    workspace = await workspace_service.get_workspace_by_uuid(db, uuid=uuid)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return workspace

@router.put("/{uuid}", response_model=WorkspaceResponse)
async def update_workspace(uuid: str, workspace_in: WorkspaceUpdate, db: AsyncSession = Depends(get_db)):
    workspace = await workspace_service.get_workspace_by_uuid(db, uuid=uuid)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return await workspace_service.update_workspace(db, db_obj=workspace, workspace_in=workspace_in)

@router.delete("/{uuid}", response_model=WorkspaceResponse)
async def delete_workspace(uuid: str, db: AsyncSession = Depends(get_db)):
    workspace = await workspace_service.get_workspace_by_uuid(db, uuid=uuid)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return await workspace_service.delete_workspace(db, uuid=uuid)
