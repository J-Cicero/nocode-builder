from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.identity import get_current_identity, require_role, Identity
from app.core.service_auth import require_service_token
from app.modules.tickets.schema import TicketCreate, TicketUpdate, TicketResponse
from app.modules.tickets.repository import TicketRepository

router = APIRouter(prefix="/tickets", tags=["Customer Service"])

STAFF_ROLES = ("customer_service", "admin", "super_admin")


def get_repo(db: AsyncSession = Depends(get_db)) -> TicketRepository:
    return TicketRepository(db)


@router.post("/", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)
async def create_ticket(
    data: TicketCreate,
    identity: Identity = Depends(get_current_identity),
    repo: TicketRepository = Depends(get_repo),
):
    """Any authenticated user can open a ticket."""
    tenant_id = UUID(identity.tenant_id) if identity.tenant_id else None
    return await repo.create(
        tenant_id=tenant_id, requester_user_id=identity.user_id,
        subject=data.subject, description=data.description, priority=data.priority,
    )


@router.get("/mine", response_model=list[TicketResponse])
async def my_tickets(
    identity: Identity = Depends(get_current_identity),
    repo: TicketRepository = Depends(get_repo),
):
    return await repo.list_for_requester(identity.user_id)


@router.get("/", response_model=list[TicketResponse])
async def all_tickets(
    identity: Identity = Depends(require_role(*STAFF_ROLES)),
    repo: TicketRepository = Depends(get_repo),
):
    """Queue view for customer service staff."""
    return await repo.list_all()


@router.patch("/{ticket_id}", response_model=TicketResponse)
async def update_ticket(
    ticket_id: UUID,
    data: TicketUpdate,
    identity: Identity = Depends(require_role(*STAFF_ROLES)),
    repo: TicketRepository = Depends(get_repo),
):
    ticket = await repo.update(ticket_id, **data.model_dump())
    if not ticket:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Ticket not found.")
    return ticket


@router.post("/{ticket_id}/escalate", response_model=TicketResponse)
async def escalate_to_service_desk(
    ticket_id: UUID,
    identity: Identity = Depends(require_role(*STAFF_ROLES)),
    repo: TicketRepository = Depends(get_repo),
):
    """Marks the ticket escalated here; svc-service-desk owns L1/L2/L3 queue
    routing once escalated -- this just flips the status flag that signals
    'this needs the service desk now'. Real cross-service handoff (creating
    the corresponding svc-service-desk record automatically via a Kafka
    support.ticket.escalated.v1 event, per the blueprint's topic scheme) is
    a follow-up; this synchronous version proves the status transition."""
    from app.modules.tickets.models import TicketStatus
    ticket = await repo.update(ticket_id, status=TicketStatus.ESCALATED)
    if not ticket:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Ticket not found.")
    return ticket


@router.post("/internal/erase-user/{user_id}", status_code=status.HTTP_200_OK)
async def erase_user_tickets(
    user_id: UUID,
    caller: str = Depends(require_service_token("svc-consent-dsar")),
    repo: TicketRepository = Depends(get_repo),
):
    """Fulfills the support-ticket side of a GDPR erasure DSAR. Redacts
    subject/description on this user's tickets rather than deleting the
    tickets outright -- a support history ("N tickets, average resolution
    time") often needs to survive for the team's own operational metrics
    even after the requester's personal content is gone; the ticket shell
    stays, the identifying content doesn't.

    Only callable by svc-consent-dsar's orchestration."""
    tickets = await repo.list_for_requester(user_id)
    for t in tickets:
        await repo.update(t.id, subject="[redacted]", description="[redacted -- GDPR erasure]")
    return {"erased": True, "tickets_redacted": len(tickets)}
