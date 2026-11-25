"""Identity bridge to svc-iam & single public-route whitelist for svc-nocode-core.

svc-nocode-core no longer authenticates users itself — svc-iam is the single
system of record for identity (registration, login, MFA, refresh rotation).
This module validates access tokens issued by svc-iam and defines the single
source of truth for routes accessible without a JWT.
"""
from dataclasses import dataclass
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

from app.core.config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# Liste blanche UNIQUE des routes publiques (accessibles sans JWT).
PUBLIC_EXACT_PATHS: frozenset[str] = frozenset({"/health", "/docs", "/openapi.json"})
PUBLIC_PATH_PREFIXES: tuple[str, ...] = ("/public-deployments/",)


def is_public_path(path: str) -> bool:
    """Return True if *path* is explicitly whitelisted as public."""
    return path in PUBLIC_EXACT_PATHS or any(path.startswith(prefix) for prefix in PUBLIC_PATH_PREFIXES)


@dataclass
class Identity:
    tracking_id: UUID
    role: str | None = None
    tenant_id: str | None = None
    plan: str | None = None


def decode_access_token(token: str) -> Identity:
    """Decode and validate an access JWT issued by svc-iam."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token.")
    if payload.get("type") != "access":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Expected an access token issued by svc-iam.")
    try:
        tracking_id = UUID(str(payload["sub"]))
    except (KeyError, ValueError, TypeError):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid subject claim in token.")
    return Identity(
        tracking_id=tracking_id,
        role=payload.get("role"),
        tenant_id=payload.get("tenant_id"),
        plan=payload.get("plan"),
    )


def get_current_identity(token: str = Depends(oauth2_scheme)) -> Identity:
    return decode_access_token(token)
