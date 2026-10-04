"""Catalogue dynamique d'IA : l'administrateur ajoute fournisseurs et modèles
depuis l'interface, sans toucher au code ni redéployer."""
from dataclasses import dataclass
from uuid import UUID

from fastapi import HTTPException, status
from openai import AsyncOpenAI
from sqlalchemy import select, update, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.ai.crypto import encrypt_secret, decrypt_secret, key_hint
from app.modules.ai.models import AIProvider, AIModel
from app.modules.ai import catalog_schemas as s

ADMIN_ROLES = {"admin", "super_admin"}
DEFAULT_PLAN = "free"


def is_admin_role(role: str | None) -> bool:
    return (role or "").lower() in ADMIN_ROLES


def plan_allows(model: AIModel, plan: str | None, admin: bool) -> bool:
    if admin:
        return True
    allowed = [p.lower() for p in (model.allowed_plans or [])]
    return not allowed or (plan or DEFAULT_PLAN).lower() in allowed


@dataclass
class ResolvedModel:
    client: AsyncOpenAI
    model_id: str
    label: str


class AICatalogService:

    def __init__(self, db: AsyncSession):
        self.db = db

    # ─── Fournisseurs ────────────────────────────────────────────────────────

    async def _get_provider(self, tracking_id: UUID) -> AIProvider:
        res = await self.db.execute(
            select(AIProvider).options(selectinload(AIProvider.models)).where(AIProvider.tracking_id == tracking_id)
        )
        provider = res.scalar_one_or_none()
        if not provider:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Fournisseur introuvable.")
        return provider

    @staticmethod
    def _provider_out(p: AIProvider) -> s.ProviderResponse:
        try:
            hint = key_hint(decrypt_secret(p.api_key_encrypted))
        except ValueError:
            hint = "illisible"
        return s.ProviderResponse(
            id=p.tracking_id, tracking_id=p.tracking_id, name=p.name, display_name=p.display_name, base_url=p.base_url,
            api_key_hint=hint, is_active=p.is_active, models_count=len(p.models or []),
        )

    async def list_providers(self) -> list[s.ProviderResponse]:
        res = await self.db.execute(
            select(AIProvider).options(selectinload(AIProvider.models)).order_by(AIProvider.created_at)
        )
        return [self._provider_out(p) for p in res.scalars().all()]

    async def create_provider(self, data: s.ProviderCreate) -> s.ProviderResponse:
        exists = await self.db.execute(select(AIProvider.id).where(AIProvider.name == data.name))
        if exists.first():
            raise HTTPException(status.HTTP_409_CONFLICT, f"Un fournisseur « {data.name} » existe déjà.")
        provider = AIProvider(
            name=data.name, display_name=data.display_name, base_url=data.base_url,
            api_key_encrypted=encrypt_secret(data.api_key), is_active=data.is_active,
        )
        self.db.add(provider)
        await self.db.flush()
        provider = await self._get_provider(provider.tracking_id)
        return self._provider_out(provider)

    async def update_provider(self, tracking_id: UUID, data: s.ProviderUpdate) -> s.ProviderResponse:
        provider = await self._get_provider(tracking_id)
        patch = data.model_dump(exclude_unset=True)
        api_key = patch.pop("api_key", None)
        for field, value in patch.items():
            setattr(provider, field, value)
        if api_key:
            provider.api_key_encrypted = encrypt_secret(api_key)
        await self.db.flush()
        return self._provider_out(await self._get_provider(tracking_id))

    async def delete_provider(self, tracking_id: UUID) -> None:
        provider = await self._get_provider(tracking_id)
        await self.db.delete(provider)  # cascade sur ses modèles
        await self.db.flush()

    def _client_for(self, provider: AIProvider) -> AsyncOpenAI:
        return AsyncOpenAI(
            api_key=decrypt_secret(provider.api_key_encrypted),
            base_url=provider.base_url, timeout=60.0, max_retries=1,
        )

    async def test_provider(self, tracking_id: UUID) -> s.TestResult:
        provider = await self._get_provider(tracking_id)
        plain = None
        try:
            plain = decrypt_secret(provider.api_key_encrypted)
            await self._client_for(provider).models.list()
            return s.TestResult(ok=True, message="Connexion réussie.")
        except Exception as e:  # message renvoyé à l'admin, clé masquée
            msg = str(e)
            if plain:
                msg = msg.replace(plain, "••••")
            return s.TestResult(ok=False, message=f"Échec de connexion : {msg[:250]}")

    # ─── Modèles ─────────────────────────────────────────────────────────────

    @staticmethod
    def _model_out(m: AIModel) -> s.ModelResponse:
        return s.ModelResponse(
            id=m.tracking_id, tracking_id=m.tracking_id, provider_id=m.provider_id, provider_name=m.provider.display_name,
            model_id=m.model_id, display_name=m.display_name, description=m.description,
            allowed_plans=list(m.allowed_plans or []), is_active=m.is_active,
            is_default=m.is_default, sort_order=m.sort_order,
        )

    async def _get_model(self, tracking_id: UUID) -> AIModel:
        res = await self.db.execute(
            select(AIModel).options(selectinload(AIModel.provider)).where(AIModel.tracking_id == tracking_id)
        )
        model = res.scalar_one_or_none()
        if not model:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Modèle introuvable.")
        return model

    async def _clear_default(self, except_id: UUID | None = None) -> None:
        stmt = update(AIModel).values(is_default=False)
        if except_id:
            stmt = stmt.where(AIModel.tracking_id != except_id)
        await self.db.execute(stmt)

    async def list_models(self) -> list[s.ModelResponse]:
        res = await self.db.execute(
            select(AIModel).options(selectinload(AIModel.provider)).order_by(AIModel.sort_order, AIModel.created_at)
        )
        return [self._model_out(m) for m in res.scalars().all()]

    async def create_model(self, data: s.ModelCreate) -> s.ModelResponse:
        await self._get_provider(data.provider_id)
        model = AIModel(**data.model_dump())
        self.db.add(model)
        await self.db.flush()
        if data.is_default:
            await self._clear_default(except_id=model.tracking_id)
        return self._model_out(await self._get_model(model.tracking_id))

    async def update_model(self, tracking_id: UUID, data: s.ModelUpdate) -> s.ModelResponse:
        model = await self._get_model(tracking_id)
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(model, field, value)
        await self.db.flush()
        if data.is_default:
            await self._clear_default(except_id=tracking_id)
        return self._model_out(await self._get_model(tracking_id))

    async def delete_model(self, tracking_id: UUID) -> None:
        await self.db.delete(await self._get_model(tracking_id))
        await self.db.flush()

    async def test_model(self, tracking_id: UUID) -> s.TestResult:
        model = await self._get_model(tracking_id)
        plain = None
        try:
            plain = decrypt_secret(model.provider.api_key_encrypted)
            await self._client_for(model.provider).chat.completions.create(
                model=model.model_id, messages=[{"role": "user", "content": "Réponds juste: ok"}], max_tokens=5,
            )
            return s.TestResult(ok=True, message="Le modèle répond correctement.")
        except Exception as e:
            msg = str(e)
            if plain:
                msg = msg.replace(plain, "••••")
            return s.TestResult(ok=False, message=f"Échec : {msg[:250]}")

    # ─── Côté utilisateur ────────────────────────────────────────────────────

    async def _active_models(self) -> list[AIModel]:
        res = await self.db.execute(
            select(AIModel).options(selectinload(AIModel.provider))
            .where(AIModel.is_active.is_(True))
            .order_by(AIModel.sort_order, AIModel.created_at)
        )
        return [m for m in res.scalars().all() if m.provider.is_active]

    async def list_for_user(self, plan: str | None, role: str | None) -> list[s.PublicModel]:
        admin = is_admin_role(role)
        return [
            s.PublicModel(
                id=m.tracking_id, tracking_id=m.tracking_id, display_name=m.display_name, description=m.description,
                provider_label=m.provider.display_name, is_default=m.is_default,
                locked=not plan_allows(m, plan, admin),
                required_plans=list(m.allowed_plans or []),
            )
            for m in await self._active_models()
        ]

    async def resolve(self, model_ref: UUID | None, plan: str | None, role: str | None) -> ResolvedModel | None:
        """Retourne le client + modèle à utiliser. None si le catalogue est vide
        (l'appelant retombe alors sur la configuration d'environnement)."""
        admin = is_admin_role(role)
        models = await self._active_models()
        if not models:
            if model_ref:
                raise HTTPException(status.HTTP_404_NOT_FOUND, "Ce modèle d'IA n'est pas disponible.")
            return None

        if model_ref:
            chosen = next((m for m in models if m.tracking_id == model_ref), None)
            if not chosen:
                raise HTTPException(status.HTTP_404_NOT_FOUND, "Ce modèle d'IA n'est pas disponible.")
            if not plan_allows(chosen, plan, admin):
                raise HTTPException(
                    status.HTTP_403_FORBIDDEN,
                    "Ce modèle d'IA n'est pas inclus dans votre abonnement. Passez à une offre supérieure pour l'utiliser.",
                )
        else:
            accessible = [m for m in models if plan_allows(m, plan, admin)]
            if not accessible:
                raise HTTPException(status.HTTP_403_FORBIDDEN, "Aucun modèle d'IA n'est disponible avec votre abonnement.")
            chosen = next((m for m in accessible if m.is_default), accessible[0])

        try:
            client = self._client_for(chosen.provider)
        except ValueError as e:
            raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, str(e))
        return ResolvedModel(client=client, model_id=chosen.model_id, label=chosen.display_name)
