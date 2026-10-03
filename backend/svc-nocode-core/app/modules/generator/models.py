from sqlalchemy import Column, String, Integer, DateTime, Enum
from sqlalchemy.dialects.postgresql import UUID, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from datetime import datetime
import uuid
import enum


class StatutGeneration(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "en_cours"
    COMPLETED = "complété"
    FAILED = "échoué"


class StatutDeployment(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"


class Generation(Base):
    __tablename__ = "generations"

    id = Column(Integer, primary_key=True, index=True)
    tracking_id = Column(UUID(as_uuid=True), default=uuid.uuid4, unique=True, index=True)
    project_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    
    nom = Column(String(200), nullable=False)
    statut = Column(Enum(StatutGeneration), default=StatutGeneration.PENDING)
    url_zip = Column(String(500), nullable=True)
    erreur = Column(String(500), nullable=True)
    config = Column(JSON, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    def __repr__(self):
        return f"<Generation {self.nom} - {self.statut}>"


class Deployment(Base):
    __tablename__ = "deployments"

    id = Column(Integer, primary_key=True, index=True)
    tracking_id = Column(UUID(as_uuid=True), default=uuid.uuid4, unique=True, index=True)
    interface_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    url = Column(String(500), nullable=True)
    status = Column(Enum(StatutDeployment), default=StatutDeployment.PENDING, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<Deployment {self.interface_id} - {self.status}>"
