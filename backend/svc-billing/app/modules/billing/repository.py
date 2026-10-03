from uuid import UUID
from datetime import datetime, timezone
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.billing.models import Subscription, Invoice, InvoiceStatus, SubscriptionStatus


class BillingRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_subscription(self, **kwargs) -> Subscription:
        sub = Subscription(**kwargs, status=SubscriptionStatus.TRIALING)
        self.db.add(sub)
        await self.db.commit()
        await self.db.refresh(sub)
        return sub

    async def get_subscription_by_tenant(self, tenant_id: UUID) -> Subscription | None:
        res = await self.db.execute(select(Subscription).where(Subscription.tenant_id == tenant_id))
        return res.scalar_one_or_none()

    async def create_invoice(self, tenant_id: UUID, subscription_id: UUID, amount) -> Invoice:
        inv = Invoice(
            tenant_id=tenant_id, subscription_id=subscription_id, amount=amount,
            status=InvoiceStatus.ISSUED, issued_at=datetime.now(timezone.utc),
        )
        self.db.add(inv)
        await self.db.commit()
        await self.db.refresh(inv)
        return inv

    async def list_invoices(self, tenant_id: UUID) -> list[Invoice]:
        res = await self.db.execute(select(Invoice).where(Invoice.tenant_id == tenant_id))
        return list(res.scalars().all())

    async def get_invoice(self, invoice_id: UUID) -> Invoice | None:
        res = await self.db.execute(select(Invoice).where(Invoice.id == invoice_id))
        return res.scalar_one_or_none()

    async def mark_invoice_paid(self, invoice_id: UUID, provider_ref: str) -> Invoice | None:
        await self.db.execute(
            update(Invoice).where(Invoice.id == invoice_id)
            .values(status=InvoiceStatus.PAID, paid_at=datetime.now(timezone.utc), payment_provider_ref=provider_ref)
        )
        await self.db.commit()
        return await self.get_invoice(invoice_id)
