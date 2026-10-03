from uuid import UUID
from datetime import datetime
from pydantic import BaseModel
from app.modules.dsar.models import DSARRequestType, DSARStatus


class ConsentSubmit(BaseModel):
    purpose: str
    granted: bool
    session_id: str | None = None  # required if not authenticated (cookie banner, pre-login)


class ConsentResponse(BaseModel):
    id: UUID
    user_id: UUID | None
    session_id: str | None
    purpose: str
    granted: bool
    recorded_at: datetime

    class Config:
        from_attributes = True


class DSARSubmit(BaseModel):
    request_type: DSARRequestType
    notes: str | None = None


class DSARUpdate(BaseModel):
    status: DSARStatus
    notes: str | None = None


class DSARResponse(BaseModel):
    id: UUID
    user_id: UUID
    request_type: DSARRequestType
    status: DSARStatus
    notes: str | None
    submitted_at: datetime
    resolved_at: datetime | None

    class Config:
        from_attributes = True
