from uuid import UUID
from datetime import datetime, timezone
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.dsar.models import ConsentRecord, DSARRequest, DSARStatus


class ConsentRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def record(self, **kwargs) -> ConsentRecord:
        rec = ConsentRecord(**kwargs)
        self.db.add(rec)
        await self.db.commit()
        await self.db.refresh(rec)
        return rec

    async def latest_for_user(self, user_id: UUID) -> list[ConsentRecord]:
        res = await self.db.execute(
            select(ConsentRecord).where(ConsentRecord.user_id == user_id).order_by(ConsentRecord.recorded_at.desc())
        )
        return list(res.scalars().all())


class DSARRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, **kwargs) -> DSARRequest:
        req = DSARRequest(**kwargs)
        self.db.add(req)
        await self.db.commit()
        await self.db.refresh(req)
        return req

    async def get(self, request_id: UUID) -> DSARRequest | None:
        res = await self.db.execute(select(DSARRequest).where(DSARRequest.id == request_id))
        return res.scalar_one_or_none()

    async def list_for_user(self, user_id: UUID) -> list[DSARRequest]:
        res = await self.db.execute(select(DSARRequest).where(DSARRequest.user_id == user_id))
        return list(res.scalars().all())

    async def list_all(self) -> list[DSARRequest]:
        res = await self.db.execute(select(DSARRequest))
        return list(res.scalars().all())

    async def update_status(self, request_id: UUID, status: DSARStatus, notes: str | None) -> DSARRequest | None:
        values = {"status": status}
        if notes is not None:
            values["notes"] = notes
        if status in (DSARStatus.COMPLETED, DSARStatus.REJECTED):
            values["resolved_at"] = datetime.now(timezone.utc)
        await self.db.execute(update(DSARRequest).where(DSARRequest.id == request_id).values(**values))
        await self.db.commit()
        return await self.get(request_id)
