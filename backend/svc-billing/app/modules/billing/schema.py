from uuid import UUID
from decimal import Decimal
from datetime import datetime
from pydantic import BaseModel
from app.modules.billing.models import SubscriptionStatus, InvoiceStatus


class SubscriptionCreate(BaseModel):
    tenant_id: UUID
    plan: str
    monthly_price: Decimal


class SubscriptionResponse(BaseModel):
    id: UUID
    tenant_id: UUID
    plan: str
    status: SubscriptionStatus
    monthly_price: Decimal
    current_period_start: datetime
    current_period_end: datetime | None

    class Config:
        from_attributes = True


class InvoiceResponse(BaseModel):
    id: UUID
    tenant_id: UUID
    subscription_id: UUID
    amount: Decimal
    status: InvoiceStatus
    payment_provider_ref: str | None = None
    issued_at: datetime | None
    paid_at: datetime | None

    class Config:
        from_attributes = True


class MarkPaidRequest(BaseModel):
    payment_provider_ref: str
