"""Service-to-service authentication.

Endpoints called only by other backend services (never by end users) verify
a short-lived token minted with this same shared secret (Vault-injected in
real environments), carried in the X-Service-Auth header -- kept separate
from the user-facing Authorization header so a service token can never be
mistaken for, or substituted with, a user's access token, and vice versa.

This is what was missing from svc-payment-gateway's call into
svc-billing's mark-paid endpoint: that call had no credential at all before
this. It's also what makes DSAR erasure orchestration (svc-consent-dsar
calling into svc-iam/svc-nocode-core/svc-customer-service/svc-service-desk)
a real internal-only capability rather than an open endpoint anyone who can
reach the service directly could hit.
"""
import time
from fastapi import Header, HTTPException, status
from jose import jwt, JWTError
from app.core.config import settings

SERVICE_TOKEN_TTL_SECONDS = 60  # minted right before the call, never stored or reused


def create_service_token(caller: str) -> str:
    payload = {"caller": caller, "type": "service", "exp": int(time.time()) + SERVICE_TOKEN_TTL_SECONDS}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def require_service_token(*allowed_callers: str):
    """Dependency factory: require_service_token('svc-payment-gateway')."""
    def _check(x_service_auth: str | None = Header(default=None)) -> str:
        if not x_service_auth:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing X-Service-Auth header.")
        try:
            payload = jwt.decode(x_service_auth, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        except JWTError:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired service token.")
        if payload.get("type") != "service":
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not a service token.")
        caller = payload.get("caller")
        if caller not in allowed_callers:
            raise HTTPException(status.HTTP_403_FORBIDDEN, f"Caller '{caller}' is not authorized for this endpoint.")
        return caller
    return _check
