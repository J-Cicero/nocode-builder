import uuid
import enum
from sqlalchemy import Column, String, Boolean, DateTime, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.core.database import Base


class UserRole(str, enum.Enum):
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    USER = "user"
    CUSTOMER_SERVICE = "customer_service"
    SERVICE_DESK_L1 = "service_desk_l1"
    SERVICE_DESK_L2 = "service_desk_l2"
    SERVICE_DESK_L3 = "service_desk_l3"


class User(Base):
    """Core identity record. Business/product data (projects, plans, usage) stays
    in the owning services (svc-tenant, svc-billing, svc-nocode-core) and is
    linked by tracking_id — svc-iam only owns 'who is this and what can they do'."""
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), nullable=True, index=True)  # null for platform-internal roles
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    surname = Column(String(100), nullable=False)
    hashed_password = Column(String(255), nullable=False)

    role = Column(Enum(UserRole), default=UserRole.USER, nullable=False)
    preferred_locale = Column(String(5), default="en")  # en, fr, es, pt, ar, de

    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)

    mfa_enabled = Column(Boolean, default=False)
    mfa_secret = Column(String(64), nullable=True)  # TOTP secret, encrypted at rest via Vault transit in prod

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<User {self.email} role={self.role}>"


class RefreshToken(Base):
    """Server-side record of issued refresh tokens so they can be rotated and
    revoked — closes the gap flagged in the original monolith's architecture
    report ('no refresh token rotation')."""
    __tablename__ = "refresh_tokens"

    jti = Column(String(36), primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    revoked = Column(Boolean, default=False)
    replaced_by = Column(String(36), nullable=True)  # jti of the token that rotated this one out
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)
