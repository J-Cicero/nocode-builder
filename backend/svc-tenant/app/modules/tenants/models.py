import uuid
import enum
from sqlalchemy import Column, String, DateTime, Enum, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.core.database import Base


class PlanTier(str, enum.Enum):
    FREE = "free"
    STARTER = "starter"
    ENTERPRISE = "enterprise"


class Tenant(Base):
    """One row per organization/customer. tenant_id here is the same value
    stored on User.tenant_id in svc-iam -- the two are linked by that shared
    id, not a foreign key, since they live in separate databases (database-
    per-service, per the platform blueprint)."""
    __tablename__ = "tenants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(200), nullable=False)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    plan = Column(Enum(PlanTier), default=PlanTier.FREE, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
