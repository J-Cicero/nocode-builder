from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from uuid import UUID
import re


def _clean_plans(value: Optional[List[str]]) -> List[str]:
    if not value:
        return []
    return sorted({p.strip().lower() for p in value if p and p.strip()})


# ─── Fournisseurs ────────────────────────────────────────────────────────────

class ProviderCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=60, description="Identifiant technique unique (ex: mistral)")
    display_name: str = Field(..., min_length=2, max_length=120)
    base_url: str = Field(..., min_length=8, max_length=300, description="URL compatible API OpenAI")
    api_key: str = Field(..., min_length=8, max_length=500)
    is_active: bool = True

    @field_validator("name")
    @classmethod
    def _slug(cls, v: str) -> str:
        v = v.strip().lower()
        if not re.fullmatch(r"[a-z0-9][a-z0-9_-]*", v):
            raise ValueError("Identifiant invalide : lettres minuscules, chiffres, tirets uniquement.")
        return v

    @field_validator("base_url")
    @classmethod
    def _url(cls, v: str) -> str:
        v = v.strip().rstrip("/")
        if not re.match(r"^https?://", v):
            raise ValueError("L'URL doit commencer par http:// ou https://")
        return v


class ProviderUpdate(BaseModel):
    display_name: Optional[str] = Field(None, min_length=2, max_length=120)
    base_url: Optional[str] = Field(None, min_length=8, max_length=300)
    api_key: Optional[str] = Field(None, min_length=8, max_length=500, description="Laisser vide pour conserver la clé actuelle")
    is_active: Optional[bool] = None

    @field_validator("base_url")
    @classmethod
    def _url(cls, v):
        if v is None:
            return v
        v = v.strip().rstrip("/")
        if not re.match(r"^https?://", v):
            raise ValueError("L'URL doit commencer par http:// ou https://")
        return v


class ProviderResponse(BaseModel):
    id: UUID
    tracking_id: UUID
    name: str
    display_name: str
    base_url: str
    api_key_hint: str
    is_active: bool
    models_count: int = 0


# ─── Modèles ─────────────────────────────────────────────────────────────────

class ModelCreate(BaseModel):
    provider_id: UUID
    model_id: str = Field(..., min_length=1, max_length=150, description="Identifiant chez le fournisseur (ex: mistral-small-latest)")
    display_name: str = Field(..., min_length=2, max_length=120)
    description: Optional[str] = Field(None, max_length=300)
    allowed_plans: List[str] = Field(default_factory=list, description="Vide = tous les abonnements")
    is_active: bool = True
    is_default: bool = False
    sort_order: int = 0

    @field_validator("allowed_plans")
    @classmethod
    def _plans(cls, v):
        return _clean_plans(v)


class ModelUpdate(BaseModel):
    model_id: Optional[str] = Field(None, min_length=1, max_length=150)
    display_name: Optional[str] = Field(None, min_length=2, max_length=120)
    description: Optional[str] = Field(None, max_length=300)
    allowed_plans: Optional[List[str]] = None
    is_active: Optional[bool] = None
    is_default: Optional[bool] = None
    sort_order: Optional[int] = None

    @field_validator("allowed_plans")
    @classmethod
    def _plans(cls, v):
        return None if v is None else _clean_plans(v)


class ModelResponse(BaseModel):
    id: UUID
    tracking_id: UUID
    provider_id: UUID
    provider_name: str
    model_id: str
    display_name: str
    description: Optional[str]
    allowed_plans: List[str]
    is_active: bool
    is_default: bool
    sort_order: int


class PublicModel(BaseModel):
    """Ce que voit un utilisateur : jamais de clé, d'URL ni d'identifiant technique."""
    id: UUID
    tracking_id: UUID
    display_name: str
    description: Optional[str]
    provider_label: str
    is_default: bool
    locked: bool = False
    required_plans: List[str] = []


class TestResult(BaseModel):
    ok: bool
    message: str
