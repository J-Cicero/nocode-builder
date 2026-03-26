from sqlalchemy import Column, String, Boolean, Integer, DateTime
from sqlalchemy import Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from datetime import datetime
import uuid
import enum


class TypeComposant(str, enum.Enum):
    CONTENEUR = "conteneur"
    TEXTE = "texte"
    BOUTON = "bouton"
    FORMULAIRE = "formulaire"
    CHAMP_INPUT = "champ_input"
    LISTE = "liste"
    CARTE = "carte"
    IMAGE = "image"
    NAVIGATION = "navigation"


class TypePage(str, enum.Enum):
    MOBILE = "mobile"
    TABLET = "tablet"
    DESKTOP = "desktop"


class Interface(Base):
    __tablename__ = "interfaces"

    id = Column(Integer, primary_key=True, index=True)
    tracking_id = Column(UUID(as_uuid=True), default=uuid.uuid4, unique=True, index=True)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.tracking_id"), nullable=False, unique=True)
    
    version = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relations
    pages = relationship("Page", backref="interface", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Interface projet={self.project_id} v{self.version}>"


class Page(Base):
    __tablename__ = "pages"

    id = Column(Integer, primary_key=True, index=True)
    tracking_id = Column(UUID(as_uuid=True), default=uuid.uuid4, unique=True, index=True)
    interface_id = Column(UUID(as_uuid=True), ForeignKey("interfaces.tracking_id"), nullable=False)
    
    nom = Column(String(200), nullable=False)
    chemin = Column(String(200), nullable=False)
    type_page = Column(
        Enum(TypePage, name="typepage", values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=TypePage.MOBILE,
        server_default=TypePage.MOBILE.value,
    )
    est_accueil = Column(Boolean, default=False)
    ordre = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relations
    composants = relationship("Composant", backref="page", cascade="all, delete-orphan",
                             foreign_keys="Composant.page_id")

    def __repr__(self):
        return f"<Page {self.nom}>"


class Composant(Base):
    __tablename__ = "composants"

    id = Column(Integer, primary_key=True, index=True)
    tracking_id = Column(UUID(as_uuid=True), default=uuid.uuid4, unique=True, index=True)
    page_id = Column(UUID(as_uuid=True), ForeignKey("pages.tracking_id"), nullable=False)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("composants.tracking_id"), nullable=True)
    
    type = Column(Enum(TypeComposant), nullable=False)
    position_x = Column(Integer, default=0)
    position_y = Column(Integer, default=0)
    largeur = Column(String(100), default="100%")
    hauteur = Column(String(100), default="auto")
    styles = Column(JSON, nullable=True)
    config = Column(JSON, nullable=True)
    connecte_a = Column(String(200), nullable=True)
    ordre = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relations
    enfants = relationship("Composant", backref="parent", remote_side=[tracking_id],
                          foreign_keys=[parent_id])

    def __repr__(self):
        return f"<Composant {self.type}>"
