from sqlalchemy import Column, String, Integer, DateTime, Enum, Text, ForeignKey, Boolean, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import uuid
import enum


class MessageRole(str, enum.Enum):
    USER = "user"
    ASSISTANT = "assistant"


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    tracking_id = Column(UUID(as_uuid=True), default=uuid.uuid4, unique=True, index=True)
    project_id = Column(UUID(as_uuid=True), nullable=False, unique=True)
    
    title = Column(String(200), default="Project Assistant")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relations
    messages = relationship("Message", backref="conversation", cascade="all, delete-orphan",
                           order_by="Message.created_at.asc()")

    def __repr__(self):
        return f"<Conversation {self.tracking_id} | project={self.project_id}>"


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    tracking_id = Column(UUID(as_uuid=True), default=uuid.uuid4, unique=True, index=True)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.tracking_id"),
                            nullable=False)
    
    role = Column(Enum(MessageRole), nullable=False)
    content = Column(Text, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<Message {self.role} in conversation {self.conversation_id}>"


# ═══════════════════════════════════════════════════════════════
#  CATALOGUE D'IA (géré dynamiquement par l'administrateur)
# ═══════════════════════════════════════════════════════════════

class AIProvider(Base):
    """Un fournisseur d'IA compatible API OpenAI (Mistral, OpenAI, Groq, Ollama...).
    La clé API est stockée chiffrée, jamais en clair et jamais renvoyée par l'API."""
    __tablename__ = "ai_providers"

    id = Column(Integer, primary_key=True, index=True)
    tracking_id = Column(UUID(as_uuid=True), default=uuid.uuid4, unique=True, index=True)
    name = Column(String(60), nullable=False, unique=True)          # identifiant technique (slug)
    display_name = Column(String(120), nullable=False)
    base_url = Column(String(300), nullable=False)
    api_key_encrypted = Column(Text, nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    models = relationship("AIModel", back_populates="provider", cascade="all, delete-orphan")


class AIModel(Base):
    """Un modèle proposé aux utilisateurs, rattaché à un fournisseur.
    `allowed_plans` vide = disponible pour tous les abonnements."""
    __tablename__ = "ai_models"

    id = Column(Integer, primary_key=True, index=True)
    tracking_id = Column(UUID(as_uuid=True), default=uuid.uuid4, unique=True, index=True)
    provider_id = Column(UUID(as_uuid=True), ForeignKey("ai_providers.tracking_id", ondelete="CASCADE"), nullable=False)
    model_id = Column(String(150), nullable=False)                  # ex: mistral-small-latest
    display_name = Column(String(120), nullable=False)
    description = Column(String(300), nullable=True)
    allowed_plans = Column(JSON, nullable=False, default=list)
    is_active = Column(Boolean, nullable=False, default=True)
    is_default = Column(Boolean, nullable=False, default=False)
    sort_order = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    provider = relationship("AIProvider", back_populates="models")
