from sqlalchemy import Column, String, Boolean, DateTime, Enum, Integer, Date
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
import enum
from app.core.database import Base


class UserRole(str, enum.Enum):
    ADMIN      = "admin"
    USER       = "user"


class UserPlan(str, enum.Enum):
    FREE       = "free"
    ENTERPRISE = "enterprise"


class User(Base):
    __tablename__ = "users"

    id               = Column(Integer, primary_key=True, index=True)      # interne uniquement
    tracking_id      = Column(UUID(as_uuid=True), default=uuid.uuid4, unique=True, index=True)  # exposé dans les requêtes
    email            = Column(String(255), unique=True, nullable=False, index=True)
    name             = Column(String(100), nullable=False)
    surname          = Column(String(100), nullable=False)
    birth_place      = Column(String(150), nullable=True)
    birth_date       = Column(Date, nullable=True)
    country          = Column(String(100), nullable=True)
    phone            = Column(String(20), nullable=True)
    hashed_password  = Column(String(255), nullable=False)  # ← jamais le vrai mot de passe

    role             = Column(Enum(UserRole), default=UserRole.USER, nullable=False)
    plan             = Column(Enum(UserPlan), default=UserPlan.FREE, nullable=True)

    company_name     = Column(String(200), nullable=True)
    company_size     = Column(String(50), nullable=True)

    is_active        = Column(Boolean, default=True)
    is_verified      = Column(Boolean, default=False)
    created_at       = Column(DateTime(timezone=True), server_default=func.now())
    updated_at       = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<User {self.email} | role={self.role} | plan={self.plan}>"