from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from uuid import UUID

from app.modules.data_engine.models import DonneeProjet, HistoriqueDonnee


class DonneeRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_tracking_id(self, tracking_id: UUID) -> DonneeProjet | None:
        result = await self.db.execute(
            select(DonneeProjet).where(DonneeProjet.tracking_id == tracking_id)
        )
        return result.scalar_one_or_none()

    async def get_by_project_and_table(self, project_id: UUID, table_name: str) -> list[DonneeProjet]:
        result = await self.db.execute(
            select(DonneeProjet)
            .where(
                and_(
                    DonneeProjet.project_id == project_id,
                    DonneeProjet.table_name == table_name
                )
            )
            .order_by(DonneeProjet.created_at.desc())
        )
        return list(result.scalars().all())

    async def create(self, project_id: UUID, table_name: str, content: dict, created_by: UUID | None = None) -> DonneeProjet:
        donnee = DonneeProjet(
            project_id=project_id,
            table_name=table_name,
            content=content,
            created_by=created_by,
        )
        self.db.add(donnee)
        await self.db.flush()
        await self.db.refresh(donnee)
        return donnee

    async def update(self, donnee: DonneeProjet, content: dict) -> DonneeProjet:
        donnee.content = content
        await self.db.flush()
        await self.db.refresh(donnee)
        return donnee

    async def delete(self, donnee: DonneeProjet) -> None:
        await self.db.delete(donnee)
        await self.db.flush()


class HistoriqueRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, donnee_id: UUID, ancien_contenu: dict, nouveau_contenu: dict, modifie_par: UUID | None = None) -> HistoriqueDonnee:
        historique = HistoriqueDonnee(
            donnee_id=donnee_id,
            ancien_contenu=ancien_contenu,
            nouveau_contenu=nouveau_contenu,
            modifie_par=modifie_par,
        )
        self.db.add(historique)
        await self.db.flush()
        await self.db.refresh(historique)
        return historique

    async def get_by_donnee(self, donnee_id: UUID) -> list[HistoriqueDonnee]:
        result = await self.db.execute(
            select(HistoriqueDonnee)
            .where(HistoriqueDonnee.donnee_id == donnee_id)
            .order_by(HistoriqueDonnee.modifie_le.desc())
        )
        return list(result.scalars().all())
