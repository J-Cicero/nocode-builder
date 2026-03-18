from pydantic import BaseModel, Field
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


class GenerationResponse(BaseModel):
    tracking_id: UUID
    project_id: UUID
    nom: str
    statut: StatutGeneration
    url_zip: Optional[str]
    erreur: Optional[str]
    config: Optional[dict[str, Any]]
    created_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


class GenerationListResponse(BaseModel):
    total: int
    generations: list[GenerationResponse]
