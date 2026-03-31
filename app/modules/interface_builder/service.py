from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from uuid import UUID

from app.modules.interface_builder.repository import (
    InterfaceRepository,
    PageRepository,
    ComposantRepository,
)
from app.modules.interface_builder.models import (
    Interface,
    Page,
    Composant,
)
from app.modules.interface_builder.schema import (
    PageCreate,
    PageUpdate,
    PageResponse,
    ComposantCreate,
    ComposantUpdate,
    ComposantResponse,
    InterfaceResponse,
)


class InterfaceService:

    def __init__(self, db: AsyncSession):
        self.interface_repo = InterfaceRepository(db)
        self.page_repo = PageRepository(db)
        self.composant_repo = ComposantRepository(db)
        self.db = db

    async def _build_page_response(self, page: Page, include_components: bool = False) -> PageResponse:
        composants_response = []
        if include_components:
            composants = await self.composant_repo.get_by_page_id(page.tracking_id)
            composants_response = [self._build_composant_response(c) for c in composants]

        return PageResponse(
            tracking_id=page.tracking_id,
            nom=page.nom,
            chemin=page.chemin,
            type_page=page.type_page,
            est_accueil=page.est_accueil,
            ordre=page.ordre,
            composants=composants_response,
            created_at=page.created_at,
        )

    def _build_composant_response(self, composant: Composant) -> ComposantResponse:
        return ComposantResponse(
            tracking_id=composant.tracking_id,
            type=composant.type,
            parent_id=composant.parent_id,
            position_x=composant.position_x,
            position_y=composant.position_y,
            largeur=composant.largeur,
            hauteur=composant.hauteur,
            styles=composant.styles,
            config=composant.config,
            connecte_a=composant.connecte_a,
            ordre=composant.ordre,
            enfants=[],
            created_at=composant.created_at,
        )

    async def get_or_create_interface(self, project_id: UUID) -> InterfaceResponse:
        """Récupère ou crée automatiquement l'interface d'un projet et hydrate pages/composants."""
        interface = await self.interface_repo.get_by_project_id(project_id)

        if not interface:
            try:
                interface = await self.interface_repo.create(project_id)
            except IntegrityError:
                # Une autre requête concurrente a déjà créé l'interface.
                await self.db.rollback()
                interface = await self.interface_repo.get_by_project_id(project_id)
                if not interface:
                    raise

        pages = await self.page_repo.get_by_interface_id(interface.tracking_id)
        hydrated_pages = []
        for page in pages:
            composants = await self.composant_repo.get_by_page_id(page.tracking_id)
            page_response = PageResponse(
                tracking_id=page.tracking_id,
                nom=page.nom,
                chemin=page.chemin,
                type_page=page.type_page,
                est_accueil=page.est_accueil,
                ordre=page.ordre,
                composants=[self._build_composant_response(c) for c in composants],
                created_at=page.created_at,
            )
            hydrated_pages.append(page_response)

        return InterfaceResponse(
            tracking_id=interface.tracking_id,
            project_id=interface.project_id,
            version=interface.version,
            pages=hydrated_pages,
            created_at=interface.created_at,
            updated_at=interface.updated_at,
        )

    # ─── PAGES ─────────────────────────────────────────

    async def create_page(
        self,
        project_id: UUID,
        data: PageCreate,
    ) -> PageResponse:
        interface = await self.get_or_create_interface(project_id)

        # Désactive l'ancienne page d'accueil
        if data.est_accueil:
            ancienne_accueil = await self.page_repo.get_accueil_page(interface.tracking_id)
            if ancienne_accueil:
                ancienne_accueil.est_accueil = False
                await self.page_repo.update(ancienne_accueil, {"est_accueil": False})

        page = await self.page_repo.create(
            interface_id=interface.tracking_id,
            nom=data.nom,
            chemin=data.chemin,
            type_page=data.type_page,
            est_accueil=data.est_accueil,
            ordre=data.ordre,
        )
        return await self._build_page_response(page, include_components=False)

    async def get_page(self, tracking_id: UUID) -> PageResponse:
        page = await self.page_repo.get_by_tracking_id(tracking_id)
        if not page:
            raise HTTPException(status_code=404, detail="Page introuvable")
        return await self._build_page_response(page, include_components=True)

    async def update_page(
        self,
        tracking_id: UUID,
        data: PageUpdate,
    ) -> PageResponse:
        page = await self.page_repo.get_by_tracking_id(tracking_id)
        if not page:
            raise HTTPException(status_code=404, detail="Page introuvable")

        update_data = {}
        if data.nom is not None:
            update_data["nom"] = data.nom
        if data.chemin is not None:
            update_data["chemin"] = data.chemin
        if data.type_page is not None:
            update_data["type_page"] = data.type_page
        if data.est_accueil is not None:
            update_data["est_accueil"] = data.est_accueil
        if data.ordre is not None:
            update_data["ordre"] = data.ordre

        page = await self.page_repo.update(page, update_data)
        return await self._build_page_response(page, include_components=False)

    async def delete_page(self, tracking_id: UUID):
        page = await self.page_repo.get_by_tracking_id(tracking_id)
        if not page:
            raise HTTPException(status_code=404, detail="Page introuvable")

        await self.page_repo.delete(page)
        return {"message": "Page supprimée"}

    # ─── COMPOSANTS ────────────────────────────────────

    async def create_composant(
        self,
        page_id: UUID,
        data: ComposantCreate,
    ) -> ComposantResponse:
        page = await self.page_repo.get_by_tracking_id(page_id)
        if not page:
            raise HTTPException(status_code=404, detail="Page introuvable")

        composant = await self.composant_repo.create(
            page_id=page_id,
            type=data.type,
            parent_id=data.parent_id,
            position_x=data.position_x,
            position_y=data.position_y,
            largeur=data.largeur,
            hauteur=data.hauteur,
            styles=data.styles,
            config=data.config,
            connecte_a=data.connecte_a,
            ordre=data.ordre,
        )
        return self._build_composant_response(composant)

    async def get_composant(self, tracking_id: UUID) -> ComposantResponse:
        composant = await self.composant_repo.get_by_tracking_id(tracking_id)
        if not composant:
            raise HTTPException(status_code=404, detail="Composant introuvable")
        return self._build_composant_response(composant)

    async def update_composant(
        self,
        tracking_id: UUID,
        data: ComposantUpdate,
    ) -> ComposantResponse:
        composant = await self.composant_repo.get_by_tracking_id(tracking_id)
        if not composant:
            raise HTTPException(status_code=404, detail="Composant introuvable")

        update_data = {}
        if data.position_x is not None:
            update_data["position_x"] = data.position_x
        if data.position_y is not None:
            update_data["position_y"] = data.position_y
        if data.largeur is not None:
            update_data["largeur"] = data.largeur
        if data.hauteur is not None:
            update_data["hauteur"] = data.hauteur
        if data.styles is not None:
            update_data["styles"] = data.styles
        if data.config is not None:
            update_data["config"] = data.config
        if data.connecte_a is not None:
            update_data["connecte_a"] = data.connecte_a
        if data.ordre is not None:
            update_data["ordre"] = data.ordre

        composant = await self.composant_repo.update(composant, update_data)
        return self._build_composant_response(composant)

    async def delete_composant(self, tracking_id: UUID):
        composant = await self.composant_repo.get_by_tracking_id(tracking_id)
        if not composant:
            raise HTTPException(status_code=404, detail="Composant introuvable")

        await self.composant_repo.delete(composant)
        return {"message": "Composant supprimé"}

    async def reorder_composants(self, page_id: UUID, ordre: list[dict]):
        page = await self.page_repo.get_by_tracking_id(page_id)
        if not page:
            raise HTTPException(status_code=404, detail="Page introuvable")

        provided_ids = []
        for item in ordre:
            raw_id = item.get("id")
            if raw_id is None:
                continue
            try:
                provided_ids.append(UUID(str(raw_id)))
            except (ValueError, TypeError):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Un identifiant composant est invalide.",
                )

        if len(provided_ids) != len(set(provided_ids)):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La liste de réordonnancement contient des IDs en double.",
            )

        existing_components = await self.composant_repo.get_by_page_id(page_id)
        existing_ids = {component.tracking_id for component in existing_components}
        unknown_ids = [pid for pid in provided_ids if pid not in existing_ids]
        if unknown_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Certains composants ne correspondent pas à cette page.",
            )

        await self.composant_repo.reorder(page_id, ordre)
        return {"message": "Composants réordonnés"}
