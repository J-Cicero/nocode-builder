"""Payment provider abstraction.

MockProvider is what's wired up by default -- it simulates a PSP without
making any real network call (this sandbox has no route to Stripe/Adyen/
local WA payment rails anyway, and a real integration needs real merchant
credentials this environment can't hold). It exists so the rest of the
service -- the checkout-session flow, webhook signature verification
pattern, and the call into svc-billing on success -- is real, tested code
today, and swapping in a StripeProvider later is a matter of implementing
this same interface, not restructuring the service.

DO NOT deploy MockProvider to any environment that touches real money.
"""
import hashlib
import hmac
import time
import uuid
from abc import ABC, abstractmethod


class PaymentProvider(ABC):
    @abstractmethod
    def create_checkout_session(self, invoice_id: str, amount: str, currency: str) -> dict:
        """Returns {checkout_url, session_id}."""

    @abstractmethod
    def verify_webhook_signature(self, payload: bytes, signature: str) -> bool:
        ...

    @abstractmethod
    def parse_webhook_event(self, payload: bytes) -> dict:
        """Returns {event_type, invoice_id, provider_ref} on success."""


class MockProvider(PaymentProvider):
    """Deterministic, no network calls. 'Charges' always succeed instantly --
    good enough to prove the checkout -> webhook -> svc-billing wiring works
    end to end, not good enough for anything real."""

    WEBHOOK_SECRET = "mock-provider-webhook-secret"  # would be provider-issued + Vault-stored for real

    def create_checkout_session(self, invoice_id: str, amount: str, currency: str) -> dict:
        session_id = f"mock_sess_{uuid.uuid4().hex[:16]}"
        return {
            "checkout_url": f"https://mock-provider.local/checkout/{session_id}",
            "session_id": session_id,
        }

    def sign(self, payload: bytes) -> str:
        return hmac.new(self.WEBHOOK_SECRET.encode(), payload, hashlib.sha256).hexdigest()

    def verify_webhook_signature(self, payload: bytes, signature: str) -> bool:
        expected = self.sign(payload)
        return hmac.compare_digest(expected, signature)

    def parse_webhook_event(self, payload: bytes) -> dict:
        import json
        data = json.loads(payload)
        return {
            "event_type": data.get("type", "payment.succeeded"),
            "invoice_id": data["invoice_id"],
            "provider_ref": data.get("provider_ref", f"mock_charge_{uuid.uuid4().hex[:12]}"),
        }


def get_provider() -> PaymentProvider:
    return MockProvider()
