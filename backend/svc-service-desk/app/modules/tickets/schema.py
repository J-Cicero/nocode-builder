from uuid import UUID
from datetime import datetime
from pydantic import BaseModel
from app.modules.tickets.models import TicketStatus, TicketPriority


class TicketCreate(BaseModel):
    subject: str
    description: str
    priority: TicketPriority = TicketPriority.NORMAL
    level: str = "l1"


class TicketUpdate(BaseModel):
    status: TicketStatus | None = None
    priority: TicketPriority | None = None
    assigned_to_user_id: UUID | None = None


class EscalateRequest(BaseModel):
    reason: str


class TicketResponse(BaseModel):
    id: UUID
    tenant_id: UUID | None
    requester_user_id: UUID
    subject: str
    description: str
    status: TicketStatus
    priority: TicketPriority
    level: str
    assigned_to_user_id: UUID | None
    created_at: datetime

    class Config:
        from_attributes = True
