from pydantic import BaseModel, Field, model_validator
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

    @model_validator(mode="before")
    @classmethod
    def handle_section_aliases(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "ordre" not in data and "order" in data:
                data["ordre"] = data["order"]
            if not data.get("title") and data.get("titre"):
                data["title"] = data["titre"]
            if not data.get("config") and data.get("props"):
                data["config"] = data["props"]
        return data


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
    type_page: TypePage = TypePage.DESKTOP
    est_accueil: bool = False
    ordre: int = 0

    @model_validator(mode="before")
    @classmethod
    def handle_page_aliases(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "nom" not in data and "name" in data:
                data["nom"] = data["name"]
            if not data.get("chemin"):
                slug = data.get("slug") or data.get("path")
                if slug:
                    data["chemin"] = f"/{slug.lstrip('/')}"
                elif data.get("nom"):
                    data["chemin"] = f"/{data['nom'].lower().replace(' ', '-')}"
                else:
                    data["chemin"] = "/page"
            if "type_page" not in data:
                data["type_page"] = TypePage.DESKTOP
        return data


class PageUpdate(BaseModel):
    nom: Optional[str] = Field(None, min_length=1, max_length=200)
    chemin: Optional[str] = Field(None, min_length=1, max_length=200)
    type_page: Optional[TypePage] = None
    est_accueil: Optional[bool] = None
    ordre: Optional[int] = None

    @model_validator(mode="before")
    @classmethod
    def handle_update_aliases(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "nom" not in data and "name" in data:
                data["nom"] = data["name"]
            if "chemin" not in data and "path" in data:
                data["chemin"] = data["path"]
        return data


class PageResponse(BaseModel):
    tracking_id: UUID
    nom: str
    name: Optional[str] = None
    chemin: str
    path: Optional[str] = None
    slug: Optional[str] = None
    type_page: TypePage
    est_accueil: bool
    ordre: int
    composants: List[ComposantResponse] = []
    sections: List[SectionResponse] = []
    created_at: datetime

    @model_validator(mode="after")
    def sync_aliases(self):
        if self.name is None:
            self.name = self.nom
        if self.path is None:
            self.path = self.chemin
        if self.slug is None:
            self.slug = self.chemin.lstrip("/")
        return self

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
