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


class TypePage(str, Enum):
    MOBILE = "mobile"
    TABLET = "tablet"
    DESKTOP = "desktop"


class SectionType(str, Enum):
    NAVBAR = "navbar"
    HERO = "hero"
    STATS_ROW = "stats-row"
    DATA_TABLE = "data-table"
    FORM = "form"
    CARD_GRID = "card-grid"
    TEXT_SECTION = "text-section"
    MOBILE_HEADER = "mobile-header"
    MOBILE_CARD_LIST = "mobile-card-list"
    BOTTOM_NAV = "bottom-nav"


# ═══════════════════════════════════════════════════════════════
#  SECTION
# ═══════════════════════════════════════════════════════════════

class SectionCreate(BaseModel):
    type: SectionType
    ordre: int = 0
    title: Optional[str] = None
    config: Optional[dict[str, Any]] = None
    connecte_a: Optional[str] = None
    styles: Optional[dict[str, Any]] = None


class SectionUpdate(BaseModel):
    type: Optional[SectionType] = None
    ordre: Optional[int] = None
    title: Optional[str] = None
    config: Optional[dict[str, Any]] = None
    connecte_a: Optional[str] = None
    styles: Optional[dict[str, Any]] = None


class SectionResponse(BaseModel):
    tracking_id: UUID
    type: SectionType
    ordre: int
    title: Optional[str]
    config: Optional[dict[str, Any]]
    connecte_a: Optional[str]
    styles: Optional[dict[str, Any]]
    created_at: datetime

    class Config:
        from_attributes = True


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
    type_page: TypePage = TypePage.MOBILE
    est_accueil: bool = False
    ordre: int = 0


class PageUpdate(BaseModel):
    nom: Optional[str] = Field(None, min_length=1, max_length=200)
    chemin: Optional[str] = Field(None, min_length=1, max_length=200)
    type_page: Optional[TypePage] = None
    est_accueil: Optional[bool] = None
    ordre: Optional[int] = None


class PageResponse(BaseModel):
    tracking_id: UUID
    nom: str
    chemin: str
    type_page: TypePage
    est_accueil: bool
    ordre: int
    composants: List[ComposantResponse] = []
    sections: List[SectionResponse] = []
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
