"""DEPRECATED — svc-iam now owns registration, login, refresh, MFA, and
account activation/deactivation for the whole platform.

This module intentionally exposes zero routes. It's kept (rather than
deleted outright) so `app/modules/auth/{models,repository,service,schema}.py`
remain readable as a historical reference during the migration, and so
`app/main.py`'s module loader doesn't need a special case -- including this
router with an empty route table is a no-op.

Call the equivalent endpoints on svc-iam instead, via the gateway:
  POST /api/iam/auth/register          (was: /register/free, /register/enterprise)
  POST /api/iam/auth/login             (was: /login -- now MFA-aware)
  POST /api/iam/auth/refresh           (was: /refresh -- now rotates + detects reuse)
  GET  /api/iam/auth/me                (was: /me)
  POST /api/iam/auth/logout-everywhere (was: /users/{id}/deactivate, closer semantics)

svc-iam does not yet have an admin-initiated deactivate/reactivate endpoint
(distinct from the user's own logout-everywhere) -- that's a Phase 2 item
once svc-tenant/RBAC exists to gate who's allowed to deactivate whom.
"""
from fastapi import APIRouter

router = APIRouter(prefix="/auth", tags=["Authentification (deprecated -- see svc-iam)"])
