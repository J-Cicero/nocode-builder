from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional
from app.models.project import ProjectStatus

class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    frontend_framework: Optional[str] = None
    backend_framework: Optional[str] = None
    status: ProjectStatus = ProjectStatus.DRAFT

class ProjectCreate(ProjectBase):
    workspace_uuid: str

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    frontend_framework: Optional[str] = None
    backend_framework: Optional[str] = None
    status: Optional[ProjectStatus] = None

class ProjectResponse(ProjectBase):
    uuid: str
    workspace_uuid: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
