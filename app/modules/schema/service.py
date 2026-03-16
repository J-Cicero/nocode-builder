from fastapi import HTTPException, status
from uuid import UUID

from app.modules.schema.repository import (
    SchemaRepository, TableSchemaRepository, FieldRepository, RelationRepository
)
from app.modules.schema.schema import (
    FieldCreate, FieldUpdate, TableSchemaCreate, TableSchemaUpdate,
    RelationCreate, RelationUpdate
)
from app.modules.projects.repository import ProjectRepository


class SchemaService:

    def __init__(self, db):
        self.schema_repo = SchemaRepository(db)
        self.table_repo = TableSchemaRepository(db)
        self.field_repo = FieldRepository(db)
        self.relation_repo = RelationRepository(db)
        self.project_repo = ProjectRepository(db)
        self.db = db

    async def _get_schema_or_404(self, project_id: int):
        schema = await self.schema_repo.get_by_project_id(project_id)
        if not schema:
            raise HTTPException(status_code=404, detail="Schéma introuvable.")
        return schema

    async def _get_table_or_404(self, table_id: UUID):
        table = await self.table_repo.get_by_tracking_id(table_id)
        if not table:
            raise HTTPException(status_code=404, detail="Table introuvable.")
        return table

    async def _get_field_or_404(self, field_id: UUID):
        field = await self.field_repo.get_by_tracking_id(field_id)
        if not field:
            raise HTTPException(status_code=404, detail="Champ introuvable.")
        return field

    async def _get_relation_or_404(self, relation_id: UUID):
        relation = await self.relation_repo.get_by_tracking_id(relation_id)
        if not relation:
            raise HTTPException(status_code=404, detail="Relation introuvable.")
        return relation

    # ═══════════════════════════════════════════════════════════════
    #  SCHEMA
    # ═══════════════════════════════════════════════════════════════

    async def get_or_create_schema(self, project_id: int):
        """Récupère ou crée le schéma d'un projet."""
        project = await self.project_repo.get_by_id(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Projet introuvable.")
        
        schema = await self.schema_repo.get_by_project_id(project_id)
        if not schema:
            schema = await self.schema_repo.create_for_project(project_id)
        return schema

    # ═══════════════════════════════════════════════════════════════
    #  TABLES
    # ═══════════════════════════════════════════════════════════════

    async def get_all_tables(self, project_id: int):
        """Liste toutes les tables d'un projet."""
        schema = await self._get_schema_or_404(project_id)
        return await self.table_repo.get_all_by_schema(schema.id)

    async def create_table(self, project_id: int, data: TableSchemaCreate):
        """Crée une nouvelle table dans le schéma."""
        schema = await self.schema_repo.get_by_project_id(project_id)
        if not schema:
            raise HTTPException(status_code=404, detail="Schéma introuvable.")
        
        # Vérifier que le nom est unique
        existing = await self.table_repo.get_by_name_and_schema(data.name, schema.id)
        if existing:
            raise HTTPException(status_code=400, detail="Une table avec ce nom existe déjà.")
        
        return await self.table_repo.create(
            schema_id=schema.id,
            name=data.name,
            display_name=data.display_name,
            description=data.description,
            icon=data.icon,
        )

    async def update_table(self, table_id: UUID, data: TableSchemaUpdate):
        """Modifie une table."""
        table = await self._get_table_or_404(table_id)
        return await self.table_repo.update(table, data.model_dump(exclude_unset=True))

    async def delete_table(self, table_id: UUID):
        """Supprime une table complètement."""
        table = await self._get_table_or_404(table_id)
        await self.table_repo.delete(table)

    # ═══════════════════════════════════════════════════════════════
    #  CHAMPS
    # ═══════════════════════════════════════════════════════════════

    async def get_all_fields(self, table_id: UUID):
        """Liste tous les champs d'une table."""
        table = await self._get_table_or_404(table_id)
        return await self.field_repo.get_all_by_table(table.id)

    async def create_field(self, table_id: UUID, data: FieldCreate):
        """Ajoute un champ à une table."""
        table = await self._get_table_or_404(table_id)
        return await self.field_repo.create(
            table_id=table.id,
            name=data.name,
            type=data.type,
            display_name=data.display_name,
            description=data.description,
            required=data.required,
            unique=data.unique,
            indexed=data.indexed,
            config=data.config,
        )

    async def update_field(self, field_id: UUID, data: FieldUpdate):
        """Modifie un champ."""
        field = await self._get_field_or_404(field_id)
        return await self.field_repo.update(field, data.model_dump(exclude_unset=True))

    async def delete_field(self, field_id: UUID):
        """Supprime un champ."""
        field = await self._get_field_or_404(field_id)
        await self.field_repo.delete(field)

    # ═══════════════════════════════════════════════════════════════
    #  RELATIONS
    # ═══════════════════════════════════════════════════════════════

    async def get_all_relations(self, project_id: int):
        """Liste toutes les relations d'un projet."""
        schema = await self._get_schema_or_404(project_id)
        return await self.relation_repo.get_all_by_schema(schema.id)

    async def create_relation(self, project_id: int, data: RelationCreate):
        """Crée une nouvelle relation."""
        schema = await self._get_schema_or_404(project_id)
        
        # Vérifier que les tables existent
        source = await self.table_repo.get_by_tracking_id(UUID(int=data.source_table_id))
        target = await self.table_repo.get_by_tracking_id(UUID(int=data.target_table_id))
        
        if not source or not target:
            raise HTTPException(status_code=404, detail="Une des tables introuvable.")
        
        return await self.relation_repo.create(
            schema_id=schema.id,
            source_table_id=source.id,
            target_table_id=target.id,
            name=data.name,
            type=data.type,
            description=data.description,
            source_key=data.source_key,
            target_key=data.target_key,
        )

    async def update_relation(self, relation_id: UUID, data: RelationUpdate):
        """Modifie une relation."""
        relation = await self._get_relation_or_404(relation_id)
        return await self.relation_repo.update(relation, data.model_dump(exclude_unset=True))

    async def delete_relation(self, relation_id: UUID):
        """Supprime une relation."""
        relation = await self._get_relation_or_404(relation_id)
        await self.relation_repo.delete(relation)
