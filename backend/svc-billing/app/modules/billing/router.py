from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.identity import get_current_identity, require_role, Identity
from app.core.service_auth import require_service_token
from app.modules.billing.schema import (
    SubscriptionCreate, SubscriptionResponse, InvoiceResponse, MarkPaidRequest,
)
from app.modules.billing.repository import BillingRepository

router = APIRouter(tags=["Billing"])  # no prefix -- gateway's /api/billing segment already identifies this service


def get_repo(db: AsyncSession = Depends(get_db)) -> BillingRepository:
    return BillingRepository(db)


def _authorize_tenant_access(identity: Identity, tenant_id: UUID):
    if identity.role not in ("super_admin",) and str(tenant_id) != str(identity.tenant_id):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "You can only view your own tenant's billing.")


@router.post("/subscriptions", response_model=SubscriptionResponse, status_code=status.HTTP_201_CREATED)
async def create_subscription(
    data: SubscriptionCreate,
    identity: Identity = Depends(require_role("super_admin")),
    repo: BillingRepository = Depends(get_repo),
):
    existing = await repo.get_subscription_by_tenant(data.tenant_id)
    if existing:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "This tenant already has a subscription.")
    return await repo.create_subscription(**data.model_dump())


@router.get("/subscriptions/{tenant_id}", response_model=SubscriptionResponse)
async def get_subscription(
    tenant_id: UUID,
    identity: Identity = Depends(get_current_identity),
    repo: BillingRepository = Depends(get_repo),
):
    _authorize_tenant_access(identity, tenant_id)
    sub = await repo.get_subscription_by_tenant(tenant_id)
    if not sub:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No subscription found for this tenant.")
    return sub


@router.post("/tenants/{tenant_id}/invoices", response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED)
async def issue_invoice(
    tenant_id: UUID,
    identity: Identity = Depends(require_role("super_admin")),
    repo: BillingRepository = Depends(get_repo),
):
    """Manual issuance for Phase 2 -- a real billing cycle scheduler (issue
    on period rollover) is a follow-up once this is proven out."""
    sub = await repo.get_subscription_by_tenant(tenant_id)
    if not sub:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No subscription found for this tenant.")
    return await repo.create_invoice(tenant_id, sub.id, sub.monthly_price)


@router.get("/tenants/{tenant_id}/invoices", response_model=list[InvoiceResponse])
async def list_invoices(
    tenant_id: UUID,
    identity: Identity = Depends(get_current_identity),
    repo: BillingRepository = Depends(get_repo),
):
    _authorize_tenant_access(identity, tenant_id)
    return await repo.list_invoices(tenant_id)


@router.post("/invoices/{invoice_id}/mark-paid", response_model=InvoiceResponse)
async def mark_paid(
    invoice_id: UUID,
    data: MarkPaidRequest,
    caller: str = Depends(require_service_token("svc-payment-gateway")),
    repo: BillingRepository = Depends(get_repo),
):
    """Called by svc-payment-gateway's webhook handler once a provider
    confirms payment. Requires a valid X-Service-Auth token minted for
    'svc-payment-gateway' -- this used to have no credential at all (see
    README "known limitations" from the earlier build). Not a user-facing
    endpoint; regular access tokens are rejected here, only service tokens
    are accepted."""
    inv = await repo.mark_invoice_paid(invoice_id, data.payment_provider_ref)
    if not inv:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Invoice not found.")
    return inv
