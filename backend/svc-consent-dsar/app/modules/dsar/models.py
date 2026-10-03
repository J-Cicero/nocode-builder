import uuid
import enum
from sqlalchemy import Column, String, DateTime, Enum, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.core.database import Base


class DSARRequestType(str, enum.Enum):
    ACCESS = "access"          # "send me all my data"
    ERASURE = "erasure"        # "delete my data" (GDPR Art. 17)
    PORTABILITY = "portability"  # "give me my data in a portable format"


class DSARStatus(str, enum.Enum):
    RECEIVED = "received"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    REJECTED = "rejected"


class ConsentRecord(Base):
    """One row per (user, purpose) consent decision. Append-only in spirit --
    changing consent inserts a new row rather than mutating the old one, so
    there's always a history of what was agreed to and when."""
    __tablename__ = "consent_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=True, index=True)  # nullable: pre-login cookie consent
    session_id = Column(String(64), nullable=True)  # for anonymous/pre-login consent
    purpose = Column(String(100), nullable=False)  # e.g. "analytics_cookies", "marketing_emails"
    granted = Column(Boolean, nullable=False)
    recorded_at = Column(DateTime(timezone=True), server_default=func.now())


class DSARRequest(Base):
    __tablename__ = "dsar_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    request_type = Column(Enum(DSARRequestType), nullable=False)
    status = Column(Enum(DSARStatus), default=DSARStatus.RECEIVED, nullable=False)
    notes = Column(Text, nullable=True)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)
