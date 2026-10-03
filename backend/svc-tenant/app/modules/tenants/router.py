from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.identity import get_current_identity, require_role, Identity
from app.modules.tenants.schema import TenantCreate, TenantUpdate, TenantResponse
from app.modules.tenants.repository import TenantRepository

router = APIRouter(tags=["Tenants"])  # no prefix -- gateway's /api/tenants segment already identifies this service


def get_repo(db: AsyncSession = Depends(get_db)) -> TenantRepository:
    return TenantRepository(db)


@router.post("/", response_model=TenantResponse, status_code=status.HTTP_201_CREATED)
async def create_tenant(
    data: TenantCreate,
    identity: Identity = Depends(require_role("super_admin")),
    repo: TenantRepository = Depends(get_repo),
):
    """Only platform super-admins create tenants -- this is the "sign up an
    enterprise customer" operation, not a self-serve one in Phase 2."""
    if await repo.slug_exists(data.slug):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "This slug is already taken.")
    return await repo.create(name=data.name, slug=data.slug, plan=data.plan)


@router.get("/", response_model=list[TenantResponse])
async def list_tenants(
    identity: Identity = Depends(require_role("super_admin")),
    repo: TenantRepository = Depends(get_repo),
):
    return await repo.list_all()


@router.get("/{tenant_id}", response_model=TenantResponse)
async def get_tenant(
    tenant_id: UUID,
    identity: Identity = Depends(get_current_identity),
    repo: TenantRepository = Depends(get_repo),
):
    """Super-admins can view any tenant; admins/users can only view their own."""
    if identity.role != "super_admin" and str(tenant_id) != str(identity.tenant_id):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "You can only view your own tenant.")
    tenant = await repo.get(tenant_id)
    if not tenant:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tenant not found.")
    return tenant


@router.patch("/{tenant_id}", response_model=TenantResponse)
async def update_tenant(
    tenant_id: UUID,
    data: TenantUpdate,
    identity: Identity = Depends(require_role("super_admin")),
    repo: TenantRepository = Depends(get_repo),
):
    tenant = await repo.update(tenant_id, **data.model_dump())
    if not tenant:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tenant not found.")
    return tenant
