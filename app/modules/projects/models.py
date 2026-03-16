from sqlalchemy import Column, String, Boolean, DateTime, Enum, Integer, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum
from app.core.database import Base


class ProjectStatus(str, enum.Enum):
    DRAFT     = "draft"
    PUBLISHED = "published"
    ARCHIVED  = "archived"


class Project(Base):
    __tablename__ = "projects"

    id          = Column(Integer, primary_key=True, index=True)
    tracking_id = Column(UUID(as_uuid=True), default=uuid.uuid4, unique=True, index=True)
    name        = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    slug        = Column(String(200), unique=True, nullable=False, index=True)
    status      = Column(Enum(ProjectStatus), default=ProjectStatus.DRAFT, nullable=False)
    is_public   = Column(Boolean, default=False)

    # Structure JSON : pages, thème, composants, datasources
    config      = Column(JSONB, default=dict, nullable=False)

    # Lié au tracking_id de l'utilisateur (pas l'id entier !)
    owner_id    = Column(UUID(as_uuid=True), ForeignKey("users.tracking_id"), nullable=False)

    created_at  = Column(DateTime(timezone=True), server_default=func.now())
    updated_at  = Column(DateTime(timezone=True), onupdate=func.now())

    owner       = relationship("User", backref="projects")

    def __repr__(self):
        return f"<Project {self.name} | {self.status}>"
