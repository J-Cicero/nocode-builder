from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, field_validator
import re
from app.modules.tenants.models import PlanTier

SLUG_RE = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")


class TenantCreate(BaseModel):
    name: str
    slug: str
    plan: PlanTier = PlanTier.FREE

    @field_validator("slug")
    @classmethod
    def valid_slug(cls, v: str) -> str:
        if not SLUG_RE.match(v):
            raise ValueError("Slug must be lowercase alphanumeric with hyphens only.")
        return v


class TenantUpdate(BaseModel):
    name: str | None = None
    plan: PlanTier | None = None
    is_active: bool | None = None


class TenantResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    plan: PlanTier
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
