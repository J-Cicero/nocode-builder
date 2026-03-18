from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from app.modules.interface_builder.models import (
    Interface,
    Page,
    Composant,
)


class InterfaceRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_project_id(self, project_id: UUID) -> Interface | None:
        result = await self.db.execute(
            select(Interface).where(Interface.project_id == project_id)
        )
        return result.scalar_one_or_none()

    async def create(self, project_id: UUID) -> Interface:
        interface = Interface(project_id=project_id, version=1)
        self.db.add(interface)
        await self.db.flush()
        await self.db.refresh(interface)
        return interface

    async def update(self, interface: Interface, data: dict) -> Interface:
        for field, value in data.items():
            setattr(interface, field, value)
        await self.db.flush()
        await self.db.refresh(interface)
        return interface


class PageRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_tracking_id(self, tracking_id: UUID) -> Page | None:
        result = await self.db.execute(
            select(Page).where(Page.tracking_id == tracking_id)
        )
        return result.scalar_one_or_none()

    async def get_by_interface_id(self, interface_id: UUID) -> list[Page]:
        result = await self.db.execute(
            select(Page)
            .where(Page.interface_id == interface_id)
            .order_by(Page.ordre)
        )
        return list(result.scalars().all())

    async def get_accueil_page(self, interface_id: UUID) -> Page | None:
        result = await self.db.execute(
            select(Page).where(
                (Page.interface_id == interface_id) & (Page.est_accueil == True)
            )
        )
        return result.scalar_one_or_none()

    async def create(self, interface_id: UUID, nom: str, chemin: str, 
                    est_accueil: bool, ordre: int) -> Page:
        page = Page(
            interface_id=interface_id,
            nom=nom,
            chemin=chemin,
            est_accueil=est_accueil,
            ordre=ordre,
        )
        self.db.add(page)
        await self.db.flush()
        await self.db.refresh(page)
        return page

    async def update(self, page: Page, data: dict) -> Page:
        for field, value in data.items():
            setattr(page, field, value)
        await self.db.flush()
        await self.db.refresh(page)
        return page

    async def delete(self, page: Page) -> None:
        await self.db.delete(page)
        await self.db.flush()


class ComposantRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_tracking_id(self, tracking_id: UUID) -> Composant | None:
        result = await self.db.execute(
            select(Composant).where(Composant.tracking_id == tracking_id)
        )
        return result.scalar_one_or_none()

    async def get_by_page_id(self, page_id: UUID) -> list[Composant]:
        result = await self.db.execute(
            select(Composant)
            .where((Composant.page_id == page_id) & (Composant.parent_id == None))
            .order_by(Composant.ordre)
        )
        return list(result.scalars().all())

    async def create(self, page_id: UUID, type: str, parent_id: UUID | None,
                    position_x: int, position_y: int, largeur: str, hauteur: str,
                    styles: dict | None, config: dict | None, connecte_a: str | None,
                    ordre: int) -> Composant:
        composant = Composant(
            page_id=page_id,
            type=type,
            parent_id=parent_id,
            position_x=position_x,
            position_y=position_y,
            largeur=largeur,
            hauteur=hauteur,
            styles=styles,
            config=config,
            connecte_a=connecte_a,
            ordre=ordre,
        )
        self.db.add(composant)
        await self.db.flush()
        await self.db.refresh(composant)
        return composant

    async def update(self, composant: Composant, data: dict) -> Composant:
        for field, value in data.items():
            setattr(composant, field, value)
        await self.db.flush()
        await self.db.refresh(composant)
        return composant

    async def delete(self, composant: Composant) -> None:
        await self.db.delete(composant)
        await self.db.flush()

    async def reorder(self, page_id: UUID, ordre: list[dict]) -> None:
        for item in ordre:
            result = await self.db.execute(
                select(Composant).where(Composant.tracking_id == item["id"])
            )
            composant = result.scalar_one_or_none()
            if composant:
                composant.ordre = item.get("ordre", 0)
                composant.position_x = item.get("position_x", 0)
                composant.position_y = item.get("position_y", 0)
        await self.db.flush()
