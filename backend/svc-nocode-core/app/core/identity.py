"""Identity bridge to svc-iam.

svc-nocode-core no longer authenticates users itself — svc-iam is the single
system of record for identity (registration, login, MFA, refresh rotation).
This module only *validates* access tokens svc-iam already issued (same
signing secret, injected via Vault in real environments — see
security/vault-config in the platform blueprint) and exposes the claims as
an `Identity`, so the rest of this service can keep scoping data to
`current_user.tracking_id` exactly as before.

This replaces nine near-identical copies of a `get_current_user` dependency
that used to live one per module (auth, projects, schema, data_engine,
interface_builder, generator, workflow_engine, ai) and each independently
queried a local `users` table that no longer exists here — user records now
live only in svc-iam's database. Keeping `tracking_id` as the attribute name
(rather than renaming to `id`) is deliberate: it's the one attribute every
consuming router actually reads, so this is a drop-in replacement with no
changes needed in those routers beyond the import line.
"""
from dataclasses import dataclass
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError

from app.core.config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")  # kept for docs/OpenAPI only; login lives in svc-iam


@dataclass
class Identity:
    tracking_id: UUID
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
        tracking_id=UUID(payload["sub"]),
        role=payload.get("role"),
        tenant_id=payload.get("tenant_id"),
    )
