from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.identity import get_current_identity, Identity
from app.modules.ai import catalog_schemas as s
from app.modules.ai.catalog_service import AICatalogService, is_admin_role

router = APIRouter(prefix="/ai", tags=["AI Catalogue"])


def get_catalog(db: AsyncSession = Depends(get_db)) -> AICatalogService:
    return AICatalogService(db)


def require_admin(identity: Identity = Depends(get_current_identity)) -> Identity:
    if not is_admin_role(identity.role):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Réservé aux administrateurs.")
    return identity


# ─── Utilisateur : palette d'IA selon l'abonnement ───────────────────────────

@router.get("/models", response_model=list[s.PublicModel], summary="Modèles d'IA proposés à l'utilisateur")
async def list_available_models(
    identity: Identity = Depends(get_current_identity),
    catalog: AICatalogService = Depends(get_catalog),
):
    return await catalog.list_for_user(identity.plan, identity.role)


# ─── Administration (rôles admin / super_admin) ──────────────────────────────

@router.get("/admin/providers", response_model=list[s.ProviderResponse])
async def admin_list_providers(_: Identity = Depends(require_admin), catalog: AICatalogService = Depends(get_catalog)):
    return await catalog.list_providers()


@router.post("/admin/providers", response_model=s.ProviderResponse, status_code=status.HTTP_201_CREATED)
async def admin_create_provider(
    data: s.ProviderCreate, _: Identity = Depends(require_admin), catalog: AICatalogService = Depends(get_catalog)
):
    return await catalog.create_provider(data)


@router.patch("/admin/providers/{provider_id}", response_model=s.ProviderResponse)
async def admin_update_provider(
    provider_id: UUID, data: s.ProviderUpdate,
    _: Identity = Depends(require_admin), catalog: AICatalogService = Depends(get_catalog),
):
    return await catalog.update_provider(provider_id, data)


@router.delete("/admin/providers/{provider_id}", status_code=status.HTTP_204_NO_CONTENT)
async def admin_delete_provider(
    provider_id: UUID, _: Identity = Depends(require_admin), catalog: AICatalogService = Depends(get_catalog)
):
    await catalog.delete_provider(provider_id)


@router.post("/admin/providers/{provider_id}/test", response_model=s.TestResult)
async def admin_test_provider(
    provider_id: UUID, _: Identity = Depends(require_admin), catalog: AICatalogService = Depends(get_catalog)
):
    return await catalog.test_provider(provider_id)


@router.get("/admin/models", response_model=list[s.ModelResponse])
async def admin_list_models(_: Identity = Depends(require_admin), catalog: AICatalogService = Depends(get_catalog)):
    return await catalog.list_models()


@router.post("/admin/models", response_model=s.ModelResponse, status_code=status.HTTP_201_CREATED)
async def admin_create_model(
    data: s.ModelCreate, _: Identity = Depends(require_admin), catalog: AICatalogService = Depends(get_catalog)
):
    return await catalog.create_model(data)


@router.patch("/admin/models/{model_id}", response_model=s.ModelResponse)
async def admin_update_model(
    model_id: UUID, data: s.ModelUpdate,
    _: Identity = Depends(require_admin), catalog: AICatalogService = Depends(get_catalog),
):
    return await catalog.update_model(model_id, data)


@router.delete("/admin/models/{model_id}", status_code=status.HTTP_204_NO_CONTENT)
async def admin_delete_model(
    model_id: UUID, _: Identity = Depends(require_admin), catalog: AICatalogService = Depends(get_catalog)
):
    await catalog.delete_model(model_id)


@router.post("/admin/models/{model_id}/test", response_model=s.TestResult)
async def admin_test_model(
    model_id: UUID, _: Identity = Depends(require_admin), catalog: AICatalogService = Depends(get_catalog)
):
    return await catalog.test_model(model_id)
