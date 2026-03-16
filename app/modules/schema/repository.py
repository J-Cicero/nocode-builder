from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from app.modules.schema.models import Schema, TableSchema, Field, Relation


class SchemaRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_project_id(self, project_id: int) -> Schema | None:
        result = await self.db.execute(
            select(Schema).where(Schema.project_id == project_id)
        )
        return result.scalar_one_or_none()

    async def create_for_project(self, project_id: int) -> Schema:
        schema = Schema(project_id=project_id)
        self.db.add(schema)
        await self.db.flush()
        await self.db.refresh(schema)
        return schema


class TableSchemaRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_tracking_id(self, tracking_id: UUID) -> TableSchema | None:
        result = await self.db.execute(
            select(TableSchema).where(TableSchema.tracking_id == tracking_id)
        )
        return result.scalar_one_or_none()

    async def get_all_by_schema(self, schema_id: int) -> list[TableSchema]:
        result = await self.db.execute(
            select(TableSchema)
            .where(TableSchema.schema_id == schema_id)
            .order_by(TableSchema.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_by_name_and_schema(self, name: str, schema_id: int) -> TableSchema | None:
        result = await self.db.execute(
            select(TableSchema).where(
                (TableSchema.schema_id == schema_id) & (TableSchema.name == name)
            )
        )
        return result.scalar_one_or_none()

    async def create(self, schema_id: int, name: str, display_name: str | None, description: str | None, icon: str | None) -> TableSchema:
        table = TableSchema(
            schema_id=schema_id,
            name=name,
            display_name=display_name,
            description=description,
            icon=icon,
        )
        self.db.add(table)
        await self.db.flush()
        await self.db.refresh(table)
        return table

    async def update(self, table: TableSchema, data: dict) -> TableSchema:
        for field, value in data.items():
            setattr(table, field, value)
        await self.db.flush()
        await self.db.refresh(table)
        return table

    async def delete(self, table: TableSchema) -> None:
        await self.db.delete(table)
        await self.db.flush()


class FieldRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_tracking_id(self, tracking_id: UUID) -> Field | None:
        result = await self.db.execute(
            select(Field).where(Field.tracking_id == tracking_id)
        )
        return result.scalar_one_or_none()

    async def get_all_by_table(self, table_id: int) -> list[Field]:
        result = await self.db.execute(
            select(Field)
            .where(Field.table_id == table_id)
            .order_by(Field.order, Field.created_at)
        )
        return list(result.scalars().all())

    async def create(self, table_id: int, name: str, type: str, display_name: str | None, 
                    description: str | None, required: bool, unique: bool, indexed: bool, config: dict) -> Field:
        field = Field(
            table_id=table_id,
            name=name,
            type=type,
            display_name=display_name,
            description=description,
            required=required,
            unique=unique,
            indexed=indexed,
            config=config,
        )
        self.db.add(field)
        await self.db.flush()
        await self.db.refresh(field)
        return field

    async def update(self, field: Field, data: dict) -> Field:
        for key, value in data.items():
            setattr(field, key, value)
        await self.db.flush()
        await self.db.refresh(field)
        return field

    async def delete(self, field: Field) -> None:
        await self.db.delete(field)
        await self.db.flush()


class RelationRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_tracking_id(self, tracking_id: UUID) -> Relation | None:
        result = await self.db.execute(
            select(Relation).where(Relation.tracking_id == tracking_id)
        )
        return result.scalar_one_or_none()

    async def get_all_by_schema(self, schema_id: int) -> list[Relation]:
        result = await self.db.execute(
            select(Relation)
            .where(Relation.schema_id == schema_id)
            .order_by(Relation.created_at.desc())
        )
        return list(result.scalars().all())

    async def create(self, schema_id: int, source_table_id: int, target_table_id: int, 
                    name: str, type: str, description: str | None, source_key: str, target_key: str) -> Relation:
        relation = Relation(
            schema_id=schema_id,
            source_table_id=source_table_id,
            target_table_id=target_table_id,
            name=name,
            type=type,
            description=description,
            source_key=source_key,
            target_key=target_key,
        )
        self.db.add(relation)
        await self.db.flush()
        await self.db.refresh(relation)
        return relation

    async def update(self, relation: Relation, data: dict) -> Relation:
        for key, value in data.items():
            setattr(relation, key, value)
        await self.db.flush()
        await self.db.refresh(relation)
        return relation

    async def delete(self, relation: Relation) -> None:
        await self.db.delete(relation)
        await self.db.flush()
