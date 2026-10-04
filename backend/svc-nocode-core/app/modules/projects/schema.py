from pydantic import BaseModel, Field, model_validator
from typing import Optional, Dict, Any, List
from uuid import UUID
from datetime import datetime
from app.modules.projects.models import ProjectStatus


class ProjectCreate(BaseModel):
    name        : str = Field(..., min_length=2, max_length=200)
    description : Optional[str] = None
    is_public   : bool = False

    @model_validator(mode="before")
    @classmethod
    def handle_project_aliases(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "name" not in data and "nom" in data:
                data["name"] = data["nom"]
        return data


class ProjectUpdate(BaseModel):
    name        : Optional[str] = Field(None, min_length=2, max_length=200)
    description : Optional[str] = None
    is_public   : Optional[bool] = None
    config      : Optional[Dict[str, Any]] = None

    @model_validator(mode="before")
    @classmethod
    def handle_update_aliases(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "name" not in data and "nom" in data:
                data["name"] = data["nom"]
        return data


class ProjectStatusUpdate(BaseModel):
    status : ProjectStatus


class ProjectResponse(BaseModel):
    tracking_id : UUID
    name        : str
    description : Optional[str]
    slug        : str
    status      : ProjectStatus
    is_public   : bool
    config      : Dict[str, Any]
    owner_id    : UUID
    created_at  : datetime
    updated_at  : Optional[datetime]

    class Config:
        from_attributes = True


class ProjectSummary(BaseModel):
    tracking_id : UUID
    name        : str
    description : Optional[str]
    slug        : str
    status      : ProjectStatus
    is_public   : bool
    created_at  : datetime

    class Config:
        from_attributes = True


# ← ta bonne idée de ProjetListResponse gardée !
class ProjectListResponse(BaseModel):
    total    : int
    projects : List[ProjectSummary]
