"""Trusts access tokens svc-iam already issued -- this service does not
authenticate users itself. See backend/svc-iam and
backend/svc-nocode-core/app/core/identity.py for the same pattern."""
from dataclasses import dataclass
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError

from app.core.config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/iam/auth/login")


@dataclass
class Identity:
    user_id: UUID
    role: str | None = None
    tenant_id: str | None = None


def get_current_identity(token: str = Depends(oauth2_scheme)) -> Identity:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token.")
    if payload.get("type") != "access":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Expected an access token issued by svc-iam.")
    return Identity(
        user_id=UUID(payload["sub"]),
        role=payload.get("role"),
        tenant_id=payload.get("tenant_id"),
    )


def require_role(*allowed: str):
    """Dependency factory: require_role('admin', 'super_admin')."""
    def _check(identity: Identity = Depends(get_current_identity)) -> Identity:
        if identity.role not in allowed:
            raise HTTPException(status.HTTP_403_FORBIDDEN, f"Requires one of roles: {', '.join(allowed)}")
        return identity
    return _check
