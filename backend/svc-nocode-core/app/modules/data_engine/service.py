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
        
        # ÉTAPE 4 — Déclenche les workflows associés (événement creation)
        try:
            from app.modules.workflow_engine.service import WorkflowService
            workflow_service = WorkflowService(self.db)
            await workflow_service.trigger_workflow(
                project_id=UUID(str(donnee.project_id)),
                evenement="creation",
                table=table_name,
                donnee={"id": str(donnee.tracking_id), **(donnee.content or {})}
            )
        except Exception as e:
            print(f"⚠️ [WORKFLOW TRIGGER ERROR - creation] {e}")

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
        donnee = await self.donnee_repo.get_by_tracking_id(donnee_id)
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
        donnee = await self.donnee_repo.get_by_tracking_id(donnee_id)
        if not donnee:
            raise HTTPException(status_code=404, detail="Donnée introuvable.")
        
        # Sauvegarde l'historique avant modification
        await self.historique_repo.create(
            donnee_id=donnee.tracking_id,
            ancien_contenu=donnee.content,
            nouveau_contenu=data.content,
            modifie_par=modifie_par,
        )
        
        # Met à jour la donnée
        donnee_updated = await self.donnee_repo.update(donnee, data.content)

        # Déclenche les workflows associés (événement modification)
        try:
            from app.modules.workflow_engine.service import WorkflowService
            workflow_service = WorkflowService(self.db)
            await workflow_service.trigger_workflow(
                project_id=UUID(str(donnee_updated.project_id)),
                evenement="modification",
                table=donnee_updated.table_name,
                donnee={"id": str(donnee_updated.tracking_id), **(donnee_updated.content or {})}
            )
        except Exception as e:
            print(f"⚠️ [WORKFLOW TRIGGER ERROR - modification] {e}")

        return DonneeResponse.model_validate(donnee_updated)

    async def delete(self, donnee_id: UUID) -> None:
        """Supprime une donnée."""
        donnee = await self.donnee_repo.get_by_tracking_id(donnee_id)
        if not donnee:
            raise HTTPException(status_code=404, detail="Donnée introuvable.")
        
        project_id = donnee.project_id
        table_name = donnee.table_name
        donnee_payload = {"id": str(donnee.tracking_id), **(donnee.content or {})}

        await self.donnee_repo.delete(donnee)

        # Déclenche les workflows associés (événement suppression)
        try:
            from app.modules.workflow_engine.service import WorkflowService
            workflow_service = WorkflowService(self.db)
            await workflow_service.trigger_workflow(
                project_id=UUID(str(project_id)),
                evenement="suppression",
                table=table_name,
                donnee=donnee_payload
            )
        except Exception as e:
            print(f"⚠️ [WORKFLOW TRIGGER ERROR - suppression] {e}")

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
