from uuid import UUID
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.tickets.models import Ticket


class TicketRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, **kwargs) -> Ticket:
        t = Ticket(**kwargs)
        self.db.add(t)
        await self.db.commit()
        await self.db.refresh(t)
        return t

    async def get(self, ticket_id: UUID) -> Ticket | None:
        res = await self.db.execute(select(Ticket).where(Ticket.id == ticket_id))
        return res.scalar_one_or_none()

    async def list_for_requester(self, requester_user_id: UUID) -> list[Ticket]:
        res = await self.db.execute(select(Ticket).where(Ticket.requester_user_id == requester_user_id))
        return list(res.scalars().all())

    async def list_all(self, status=None) -> list[Ticket]:
        q = select(Ticket)
        if status:
            q = q.where(Ticket.status == status)
        res = await self.db.execute(q)
        return list(res.scalars().all())

    async def update(self, ticket_id: UUID, **kwargs) -> Ticket | None:
        kwargs = {k: v for k, v in kwargs.items() if v is not None}
        if kwargs:
            await self.db.execute(update(Ticket).where(Ticket.id == ticket_id).values(**kwargs))
            await self.db.commit()
        return await self.get(ticket_id)
