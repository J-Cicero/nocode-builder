from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import Optional, Any, List
from enum import Enum


class TypeComposant(str, Enum):
    CONTENEUR = "conteneur"
    TEXTE = "texte"
    BOUTON = "bouton"
    FORMULAIRE = "formulaire"
    CHAMP_INPUT = "champ_input"
    LISTE = "liste"
    CARTE = "carte"
    IMAGE = "image"
    NAVIGATION = "navigation"


# ═══════════════════════════════════════════════════════════════
#  COMPOSANT
# ═══════════════════════════════════════════════════════════════

class ComposantCreate(BaseModel):
    type: TypeComposant
    parent_id: Optional[UUID] = None
    position_x: int = 0
    position_y: int = 0
    largeur: str = "100%"
    hauteur: str = "auto"
    styles: Optional[dict[str, Any]] = None
    config: Optional[dict[str, Any]] = None
    connecte_a: Optional[str] = None
    ordre: int = 0


class ComposantUpdate(BaseModel):
    position_x: Optional[int] = None
    position_y: Optional[int] = None
    largeur: Optional[str] = None
    hauteur: Optional[str] = None
    styles: Optional[dict[str, Any]] = None
    config: Optional[dict[str, Any]] = None
    connecte_a: Optional[str] = None
    ordre: Optional[int] = None


class ComposantResponse(BaseModel):
    tracking_id: UUID
    type: TypeComposant
    parent_id: Optional[UUID]
    position_x: int
    position_y: int
    largeur: str
    hauteur: str
    styles: Optional[dict[str, Any]]
    config: Optional[dict[str, Any]]
    connecte_a: Optional[str]
    ordre: int
    enfants: List["ComposantResponse"] = []
    created_at: datetime

    class Config:
        from_attributes = True


ComposantResponse.model_rebuild()


# ═══════════════════════════════════════════════════════════════
#  PAGE
# ═══════════════════════════════════════════════════════════════

class PageCreate(BaseModel):
    nom: str = Field(..., min_length=1, max_length=200)
    chemin: str = Field(..., min_length=1, max_length=200)
    est_accueil: bool = False
    ordre: int = 0


class PageUpdate(BaseModel):
    nom: Optional[str] = Field(None, min_length=1, max_length=200)
    chemin: Optional[str] = Field(None, min_length=1, max_length=200)
    est_accueil: Optional[bool] = None
    ordre: Optional[int] = None


class PageResponse(BaseModel):
    tracking_id: UUID
    nom: str
    chemin: str
    est_accueil: bool
    ordre: int
    composants: List[ComposantResponse] = []
    created_at: datetime

    class Config:
        from_attributes = True


# ═══════════════════════════════════════════════════════════════
#  INTERFACE
# ═══════════════════════════════════════════════════════════════

class InterfaceResponse(BaseModel):
    tracking_id: UUID
    project_id: UUID
    version: int
    pages: List[PageResponse] = []
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
