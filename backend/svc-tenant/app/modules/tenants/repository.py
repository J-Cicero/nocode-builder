from uuid import UUID
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.tenants.models import Tenant


class TenantRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def slug_exists(self, slug: str) -> bool:
        res = await self.db.execute(select(Tenant).where(Tenant.slug == slug))
        return res.scalar_one_or_none() is not None

    async def create(self, **kwargs) -> Tenant:
        t = Tenant(**kwargs)
        self.db.add(t)
        await self.db.commit()
        await self.db.refresh(t)
        return t

    async def get(self, tenant_id: UUID) -> Tenant | None:
        res = await self.db.execute(select(Tenant).where(Tenant.id == tenant_id))
        return res.scalar_one_or_none()

    async def list_all(self, limit: int = 100, offset: int = 0) -> list[Tenant]:
        res = await self.db.execute(select(Tenant).limit(limit).offset(offset))
        return list(res.scalars().all())

    async def update(self, tenant_id: UUID, **kwargs) -> Tenant | None:
        kwargs = {k: v for k, v in kwargs.items() if v is not None}
        if kwargs:
            await self.db.execute(update(Tenant).where(Tenant.id == tenant_id).values(**kwargs))
            await self.db.commit()
        return await self.get(tenant_id)
