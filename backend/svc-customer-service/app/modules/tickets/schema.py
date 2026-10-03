from uuid import UUID
from datetime import datetime
from pydantic import BaseModel
from app.modules.tickets.models import TicketStatus, TicketPriority


class TicketCreate(BaseModel):
    subject: str
    description: str
    priority: TicketPriority = TicketPriority.NORMAL


class TicketUpdate(BaseModel):
    status: TicketStatus | None = None
    priority: TicketPriority | None = None
    assigned_to_user_id: UUID | None = None


class TicketResponse(BaseModel):
    id: UUID
    tenant_id: UUID | None
    requester_user_id: UUID
    subject: str
    description: str
    status: TicketStatus
    priority: TicketPriority
    assigned_to_user_id: UUID | None
    created_at: datetime

    class Config:
        from_attributes = True
