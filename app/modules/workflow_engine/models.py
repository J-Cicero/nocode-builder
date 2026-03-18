from sqlalchemy import Column, String, Boolean, Integer, DateTime
from sqlalchemy import Enum, ForeignKey, Float
from sqlalchemy.dialects.postgresql import UUID, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from datetime import datetime
import uuid
import enum


class TypeEtape(str, enum.Enum):
    DECLENCHEUR = "declencheur"
    CONDITION = "condition"
    ACTION = "action"


class StatutExecution(str, enum.Enum):
    EN_COURS = "en_cours"
    REUSSI = "réussi"
    ECHEC = "échoué"


class Workflow(Base):
    __tablename__ = "workflows"

    id = Column(Integer, primary_key=True, index=True)
    tracking_id = Column(UUID(as_uuid=True), default=uuid.uuid4, unique=True, index=True)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.tracking_id"), nullable=False)
    
    nom = Column(String(200), nullable=False)
    description = Column(String(500), nullable=True)
    actif = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relations
    etapes = relationship("EtapeWorkflow", backref="workflow", cascade="all, delete-orphan", 
                         order_by="EtapeWorkflow.ordre")
    executions = relationship("ExecutionWorkflow", backref="workflow", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Workflow {self.nom}>"


class EtapeWorkflow(Base):
    __tablename__ = "etapes_workflow"

    id = Column(Integer, primary_key=True, index=True)
    tracking_id = Column(UUID(as_uuid=True), default=uuid.uuid4, unique=True, index=True)
    workflow_id = Column(UUID(as_uuid=True), ForeignKey("workflows.tracking_id"), nullable=False)
    
    ordre = Column(Integer, nullable=False)
    type = Column(Enum(TypeEtape), nullable=False)
    config = Column(JSON, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<EtapeWorkflow {self.type} ordre={self.ordre}>"


class ExecutionWorkflow(Base):
    __tablename__ = "executions_workflow"

    id = Column(Integer, primary_key=True, index=True)
    tracking_id = Column(UUID(as_uuid=True), default=uuid.uuid4, unique=True, index=True)
    workflow_id = Column(UUID(as_uuid=True), ForeignKey("workflows.tracking_id"), nullable=False)
    
    statut = Column(Enum(StatutExecution), default=StatutExecution.EN_COURS)
    declencheur = Column(JSON, nullable=True)
    resultat = Column(JSON, nullable=True)
    erreur = Column(String(500), nullable=True)
    durée_secondes = Column(Float, nullable=True)
    
    triggered_at = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<ExecutionWorkflow statut={self.statut}>"
