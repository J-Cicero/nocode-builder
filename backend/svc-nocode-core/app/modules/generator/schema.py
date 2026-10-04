from pydantic import BaseModel, Field, model_validator
from uuid import UUID
from datetime import datetime
from typing import Optional, Any
from enum import Enum


class StatutGeneration(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "en_cours"
    COMPLETED = "complété"
    FAILED = "échoué"


class GenerationCreate(BaseModel):
    nom: str = Field(..., min_length=1, max_length=200)

    @model_validator(mode="before")
    @classmethod
    def handle_generation_aliases(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "nom" not in data and "name" in data:
                data["nom"] = data["name"]
        return data


class GenerationResponse(BaseModel):
    tracking_id: UUID
    project_id: UUID
    nom: str
    name: Optional[str] = None
    statut: StatutGeneration
    url_zip: Optional[str]
    erreur: Optional[str]
    config: Optional[dict[str, Any]]
    created_at: datetime
    completed_at: Optional[datetime]

    @model_validator(mode="after")
    def sync_aliases(self):
        if self.name is None:
            self.name = self.nom
        return self

    class Config:
        from_attributes = True


class GenerationListResponse(BaseModel):
    total: int
    generations: list[GenerationResponse]


class DeploymentPreviewResponse(BaseModel):
    success: bool
    message: str
    preview_url: str


class DeploymentCreate(BaseModel):
    project_id: UUID


class DeploymentResponse(BaseModel):
    tracking_id: UUID
    interface_id: UUID
    url: Optional[str]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
