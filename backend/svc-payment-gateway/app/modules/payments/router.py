import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel

from app.core.identity import get_current_identity, Identity
from app.core.service_auth import create_service_token
from app.modules.payments.provider import get_provider, PaymentProvider
from app.core.config import settings

router = APIRouter(tags=["Payments"])  # no prefix -- gateway's /api/payments segment already identifies this service

BILLING_UPSTREAM = "http://svc-billing:8004"  # overridden via env in real envs; see main.py


class CheckoutRequest(BaseModel):
    invoice_id: str
    amount: str
    currency: str = "USD"


@router.post("/checkout")
async def create_checkout(
    data: CheckoutRequest,
    identity: Identity = Depends(get_current_identity),
    provider: PaymentProvider = Depends(get_provider),
):
    return provider.create_checkout_session(data.invoice_id, data.amount, data.currency)


@router.post("/webhook", status_code=status.HTTP_204_NO_CONTENT)
async def webhook(request: Request, provider: PaymentProvider = Depends(get_provider)):
    """Provider calls this on payment events. Verifies signature, then tells
    svc-billing to mark the invoice paid -- this service owns the PSP
    relationship, svc-billing owns invoice state, and they only talk over
    this one call. No user auth here (by design -- the caller is the PSP,
    not a logged-in user); signature verification is what stands in for
    auth, exactly as a real Stripe webhook handler works."""
    payload = await request.body()
    signature = request.headers.get("x-webhook-signature", "")
    if not provider.verify_webhook_signature(payload, signature):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid webhook signature.")

    event = provider.parse_webhook_event(payload)
    service_token = create_service_token("svc-payment-gateway")
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(
            f"{settings.BILLING_UPSTREAM}/invoices/{event['invoice_id']}/mark-paid",
            json={"payment_provider_ref": event["provider_ref"]},
            headers={"X-Service-Auth": service_token},
        )
        resp.raise_for_status()
