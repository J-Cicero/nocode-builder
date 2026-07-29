from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class WorkspaceBase(BaseModel):
    name: str
    slug: str

class WorkspaceCreate(WorkspaceBase):
    pass

class WorkspaceUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None

class WorkspaceResponse(WorkspaceBase):
    uuid: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
