from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.identity import get_current_identity, require_role, Identity
from app.core.service_auth import require_service_token
from app.modules.tickets.schema import TicketCreate, TicketUpdate, TicketResponse, EscalateRequest
from app.modules.tickets.repository import TicketRepository
from app.modules.tickets.models import TicketStatus

router = APIRouter(tags=["Service Desk"])  # no prefix -- gateway's /api/service-desk segment already identifies this service

LEVEL_ROLES = {"l1": "service_desk_l1", "l2": "service_desk_l2", "l3": "service_desk_l3"}
NEXT_LEVEL = {"l1": "l2", "l2": "l3"}


def get_repo(db: AsyncSession = Depends(get_db)) -> TicketRepository:
    return TicketRepository(db)


@router.post("/", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)
async def create_ticket(
    data: TicketCreate,
    identity: Identity = Depends(get_current_identity),
    repo: TicketRepository = Depends(get_repo),
):
    tenant_id = UUID(identity.tenant_id) if identity.tenant_id else None
    return await repo.create(
        tenant_id=tenant_id, requester_user_id=identity.user_id,
        subject=data.subject, description=data.description,
        priority=data.priority, level=data.level,
    )


@router.get("/queue/{level}", response_model=list[TicketResponse])
async def queue_for_level(
    level: str,
    identity: Identity = Depends(get_current_identity),
    repo: TicketRepository = Depends(get_repo),
):
    """L1 staff see the L1 queue, L2 see L2, L3 see L3. super_admin/admin can
    view any queue -- everyone else gets 403, including e.g. an L1 agent
    trying to peek at the L3 queue (levels are not a hierarchy of access,
    they're separate queues by design -- escalation moves a ticket between
    them explicitly rather than granting broader visibility)."""
    if level not in LEVEL_ROLES:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Level must be l1, l2, or l3.")
    if identity.role not in (LEVEL_ROLES[level], "admin", "super_admin"):
        raise HTTPException(status.HTTP_403_FORBIDDEN, f"Requires {LEVEL_ROLES[level]} (or admin).")
    return await repo.list_by_level(level)


@router.patch("/{ticket_id}", response_model=TicketResponse)
async def update_ticket(
    ticket_id: UUID,
    data: TicketUpdate,
    identity: Identity = Depends(require_role(*LEVEL_ROLES.values(), "admin", "super_admin")),
    repo: TicketRepository = Depends(get_repo),
):
    ticket = await repo.update(ticket_id, **data.model_dump())
    if not ticket:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Ticket not found.")
    return ticket


@router.post("/{ticket_id}/escalate", response_model=TicketResponse)
async def escalate(
    ticket_id: UUID,
    data: EscalateRequest,
    identity: Identity = Depends(require_role(*LEVEL_ROLES.values(), "admin", "super_admin")),
    repo: TicketRepository = Depends(get_repo),
):
    """L1 -> L2 -> L3 only, one step at a time -- an L1 agent can't jump a
    ticket straight to L3."""
    ticket = await repo.get(ticket_id)
    if not ticket:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Ticket not found.")
    next_level = NEXT_LEVEL.get(ticket.level)
    if not next_level:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Already at the highest level (L3).")
    return await repo.update(ticket_id, level=next_level, status=TicketStatus.ESCALATED)


@router.post("/internal/erase-user/{user_id}", status_code=status.HTTP_200_OK)
async def erase_user_tickets(
    user_id: UUID,
    caller: str = Depends(require_service_token("svc-consent-dsar")),
    repo: TicketRepository = Depends(get_repo),
):
    """Same redact-not-delete pattern as svc-customer-service's erasure
    endpoint -- see that service for the reasoning. Only callable by
    svc-consent-dsar's orchestration."""
    tickets = await repo.list_for_requester(user_id)
    for t in tickets:
        await repo.update(t.id, subject="[redacted]", description="[redacted -- GDPR erasure]")
    return {"erased": True, "tickets_redacted": len(tickets)}
