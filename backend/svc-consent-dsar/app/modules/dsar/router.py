from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.ext.asyncio import AsyncSession
from jose import jwt, JWTError

from app.core.database import get_db
from app.core.identity import get_current_identity, require_role, Identity
from app.core.config import settings
from app.modules.dsar.schema import (
    ConsentSubmit, ConsentResponse, DSARSubmit, DSARUpdate, DSARResponse,
)
from app.modules.dsar.repository import ConsentRepository, DSARRepository
from app.modules.dsar.models import DSARRequestType, DSARStatus
from app.modules.dsar.erasure import erase_user_everywhere

router = APIRouter(tags=["Consent & DSAR"])


def get_consent_repo(db: AsyncSession = Depends(get_db)) -> ConsentRepository:
    return ConsentRepository(db)


def get_dsar_repo(db: AsyncSession = Depends(get_db)) -> DSARRepository:
    return DSARRepository(db)


def optional_identity(authorization: str | None = Header(default=None)) -> Identity | None:
    """Cookie/consent banners fire before login exists -- consent must be
    recordable anonymously. If a bearer token IS present and valid, we
    attach it so a logged-in user's consent is tied to their account instead
    of just a browser session id."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.removeprefix("Bearer ")
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "access":
            return None
        return Identity(user_id=UUID(payload["sub"]), role=payload.get("role"), tenant_id=payload.get("tenant_id"))
    except (JWTError, KeyError, ValueError):
        return None


@router.post("/consent", response_model=ConsentResponse, status_code=status.HTTP_201_CREATED)
async def submit_consent(
    data: ConsentSubmit,
    identity: Identity | None = Depends(optional_identity),
    repo: ConsentRepository = Depends(get_consent_repo),
):
    if not identity and not data.session_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "session_id is required for anonymous consent.")
    return await repo.record(
        user_id=identity.user_id if identity else None,
        session_id=data.session_id if not identity else None,
        purpose=data.purpose, granted=data.granted,
    )


@router.get("/consent/me", response_model=list[ConsentResponse])
async def my_consent_history(
    identity: Identity = Depends(get_current_identity),
    repo: ConsentRepository = Depends(get_consent_repo),
):
    return await repo.latest_for_user(identity.user_id)


@router.post("/dsar", response_model=DSARResponse, status_code=status.HTTP_201_CREATED)
async def submit_dsar(
    data: DSARSubmit,
    identity: Identity = Depends(get_current_identity),
    repo: DSARRepository = Depends(get_dsar_repo),
):
    """GDPR Art. 15/17/20 requests -- access, erasure, portability. Requires
    login (we need to know whose data to act on)."""
    return await repo.create(user_id=identity.user_id, request_type=data.request_type, notes=data.notes)


@router.get("/dsar/mine", response_model=list[DSARResponse])
async def my_dsar_requests(
    identity: Identity = Depends(get_current_identity),
    repo: DSARRepository = Depends(get_dsar_repo),
):
    return await repo.list_for_user(identity.user_id)


@router.get("/dsar", response_model=list[DSARResponse])
async def all_dsar_requests(
    identity: Identity = Depends(require_role("admin", "super_admin")),
    repo: DSARRepository = Depends(get_dsar_repo),
):
    """Compliance team queue -- who's handling this is a Phase-3-follow-up
    role (compliance_officer isn't in svc-iam's role enum yet); admin/
    super_admin cover it for now."""
    return await repo.list_all()


@router.patch("/dsar/{request_id}", response_model=DSARResponse)
async def resolve_dsar(
    request_id: UUID,
    data: DSARUpdate,
    identity: Identity = Depends(require_role("admin", "super_admin")),
    repo: DSARRepository = Depends(get_dsar_repo),
):
    """Marking an ACCESS or PORTABILITY request resolved is a label change
    here -- fulfilling those (assembling a data export) is a separate,
    unbuilt capability. Marking an ERASURE request COMPLETED is different:
    it actually triggers erasure across svc-iam, svc-nocode-core,
    svc-customer-service, and svc-service-desk (see erasure.py) before the
    status is allowed to become COMPLETED. If any target fails, the request
    is left at IN_PROGRESS with the per-service results recorded in notes,
    rather than silently reporting success -- an admin can retry once
    whatever failed is fixed."""
    req = await repo.get(request_id)
    if not req:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "DSAR request not found.")

    if req.request_type == DSARRequestType.ERASURE and data.status == DSARStatus.COMPLETED:
        results = await erase_user_everywhere(str(req.user_id))
        all_ok = all(r["ok"] for r in results.values())
        summary = "; ".join(f"{svc}: {'ok' if r['ok'] else 'FAILED - ' + r['detail']}" for svc, r in results.items())
        final_status = DSARStatus.COMPLETED if all_ok else DSARStatus.IN_PROGRESS
        notes = f"{data.notes or ''}\nErasure results: {summary}".strip()
        return await repo.update_status(request_id, final_status, notes)

    return await repo.update_status(request_id, data.status, data.notes)
