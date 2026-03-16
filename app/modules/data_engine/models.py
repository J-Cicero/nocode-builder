from sqlalchemy import Column, String, DateTime, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from datetime import datetime
import uuid


class DonneeProjet(Base):
    __tablename__ = "donnees_projets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    table_name = Column(String(100), nullable=False)
    content = Column(JSON, nullable=False)
    
    created_by = Column(UUID(as_uuid=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relations
    historique = relationship("HistoriqueDonnee", backref="donnee", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<DonneeProjet {self.table_name}:{self.id}>"


class HistoriqueDonnee(Base):
    __tablename__ = "historique_donnees"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    donnee_id = Column(UUID(as_uuid=True), ForeignKey("donnees_projets.id"), nullable=False)
    
    ancien_contenu = Column(JSON, nullable=False)
    nouveau_contenu = Column(JSON, nullable=False)
    
    modifie_par = Column(UUID(as_uuid=True), nullable=True)
    modifie_le = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<HistoriqueDonnee donnee_id={self.donnee_id}>"
