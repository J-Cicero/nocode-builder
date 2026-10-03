from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import Any, Dict, Optional
from app.schemas.blueprint_content import BlueprintContent

class BlueprintBase(BaseModel):
    version: int = 1
    content: BlueprintContent = Field(default_factory=BlueprintContent)

class BlueprintCreate(BlueprintBase):
    project_uuid: str

class BlueprintUpdate(BaseModel):
    version: Optional[int] = None
    content: Optional[BlueprintContent] = None

class BlueprintResponse(BlueprintBase):
    uuid: str
    project_uuid: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
