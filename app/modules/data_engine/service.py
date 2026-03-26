from fastapi import HTTPException, status
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.data_engine.repository import DonneeRepository, HistoriqueRepository
from app.modules.data_engine.schema import DonneeCreate, DonneeUpdate, DonneeResponse, DonneeListResponse
from app.modules.schema.repository import SchemaRepository, TableSchemaRepository, FieldRepository


class DataEngineService:

    def __init__(self, db: AsyncSession):
        self.donnee_repo = DonneeRepository(db)
        self.historique_repo = HistoriqueRepository(db)
        self.schema_repo = SchemaRepository(db)
        self.table_repo = TableSchemaRepository(db)
        self.field_repo = FieldRepository(db)
        self.db = db

    async def create(
        self,
        project_id: int,
        table_name: str,
        data: DonneeCreate,
        created_by: UUID | None = None
    ) -> DonneeResponse:
        """Crée une nouvelle donnée dans une table."""
        
        # ÉTAPE 1 — Vérifie que la table existe
        schema = await self.schema_repo.get_by_project_id(project_id)
        if not schema:
            raise HTTPException(status_code=404, detail="Schéma du projet introuvable.")
        
        table = await self.table_repo.get_by_name_and_schema(table_name, schema.id)
        if not table:
            raise HTTPException(status_code=404, detail=f"Table '{table_name}' introuvable dans ce projet.")
        
        # ÉTAPE 2 — Valide les données
        await self._validate_content(table, data.content)
        
        # ÉTAPE 3 — Stocke la donnée
        donnee = await self.donnee_repo.create(
            project_id=project_id,
            table_name=table_name,
            content=data.content,
            created_by=created_by,
        )
        
        return DonneeResponse.model_validate(donnee)

    async def list(
        self,
        project_id: int,
        table_name: str
    ) -> DonneeListResponse:
        """Liste toutes les données d'une table."""
        donnees = await self.donnee_repo.get_by_project_and_table(project_id, table_name)
        
        return DonneeListResponse(
            total=len(donnees),
            donnees=[DonneeResponse.model_validate(d) for d in donnees]
        )

    async def get(self, donnee_id: UUID) -> DonneeResponse:
        """Récupère une donnée par ID."""
        donnee = await self.donnee_repo.get_by_id(donnee_id)
        if not donnee:
            raise HTTPException(status_code=404, detail="Donnée introuvable.")
        
        return DonneeResponse.model_validate(donnee)

    async def update(
        self,
        donnee_id: UUID,
        data: DonneeUpdate,
        modifie_par: UUID | None = None
    ) -> DonneeResponse:
        """Modifie une donnée et sauvegarde l'historique."""
        donnee = await self.donnee_repo.get_by_id(donnee_id)
        if not donnee:
            raise HTTPException(status_code=404, detail="Donnée introuvable.")
        
        # Sauvegarde l'historique avant modification
        await self.historique_repo.create(
            donnee_id=donnee.id,
            ancien_contenu=donnee.content,
            nouveau_contenu=data.content,
            modifie_par=modifie_par,
        )
        
        # Met à jour la donnée
        donnee_updated = await self.donnee_repo.update(donnee, data.content)
        return DonneeResponse.model_validate(donnee_updated)

    async def delete(self, donnee_id: UUID) -> None:
        """Supprime une donnée."""
        donnee = await self.donnee_repo.get_by_id(donnee_id)
        if not donnee:
            raise HTTPException(status_code=404, detail="Donnée introuvable.")
        
        await self.donnee_repo.delete(donnee)

    async def _validate_content(self, table, content: dict) -> None:
        """Valide les données contre le schéma de la table."""
        champs = await self.field_repo.get_all_by_table(table.id)
        erreurs = []
        
        for champ in champs:
            valeur = content.get(champ.name)
            
            # Vérifie champ obligatoire
            if champ.required and valeur is None:
                erreurs.append(f"'{champ.name}' est obligatoire")
                continue
            
            if valeur is not None:
                # Vérifie le type
                if champ.type.value == "number":
                    try:
                        float(valeur)
                    except (ValueError, TypeError):
                        erreurs.append(f"'{champ.name}' doit être un nombre")
                
                elif champ.type.value == "email":
                    import re
                    if not re.match(r'^[\w.-]+@[\w.-]+\.\w+$', str(valeur)):
                        erreurs.append(f"'{champ.name}' doit être un email valide")
                
                elif champ.type.value == "date":
                    try:
                        from datetime import datetime
                        datetime.fromisoformat(str(valeur).replace('Z', '+00:00'))
                    except ValueError:
                        erreurs.append(f"'{champ.name}' doit être une date valide (ISO 8601)")
                
                elif champ.type.value == "boolean":
                    if not isinstance(valeur, bool):
                        erreurs.append(f"'{champ.name}' doit être un booléen (true/false)")
        
        if erreurs:
            raise HTTPException(
                status_code=422,
                detail={"erreurs": erreurs}
            )
