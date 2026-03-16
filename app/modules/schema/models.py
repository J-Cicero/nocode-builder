from sqlalchemy import Column, String, Boolean, DateTime, Enum, Integer, Text, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum
from app.core.database import Base


class FieldType(str, enum.Enum):
    TEXT = "text"
    NUMBER = "number"
    BOOLEAN = "boolean"
    DATE = "date"
    DATETIME = "datetime"
    EMAIL = "email"
    URL = "url"
    JSON_FIELD = "json"


class RelationType(str, enum.Enum):
    ONE_TO_MANY = "one_to_many"
    MANY_TO_ONE = "many_to_one"
    MANY_TO_MANY = "many_to_many"


class Schema(Base):
    __tablename__ = "schemas"

    id = Column(Integer, primary_key=True, index=True)
    tracking_id = Column(UUID(as_uuid=True), default=uuid.uuid4, unique=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, unique=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    tables = relationship("TableSchema", backref="schema", cascade="all, delete-orphan")
    project = relationship("Project", backref="schema")

    def __repr__(self):
        return f"<Schema for Project {self.project_id}>"


class TableSchema(Base):
    __tablename__ = "tables_schema"

    id = Column(Integer, primary_key=True, index=True)
    tracking_id = Column(UUID(as_uuid=True), default=uuid.uuid4, unique=True, index=True)
    schema_id = Column(Integer, ForeignKey("schemas.id"), nullable=False)
    
    name = Column(String(100), nullable=False)
    display_name = Column(String(200), nullable=True)
    description = Column(Text, nullable=True)
    icon = Column(String(10), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    fields = relationship("Field", backref="table", cascade="all, delete-orphan")
    relations = relationship(
        "Relation",
        foreign_keys="Relation.source_table_id",
        backref="source_table",
        cascade="all, delete-orphan"
    )
    incoming_relations = relationship(
        "Relation",
        foreign_keys="Relation.target_table_id",
        backref="target_table"
    )

    def __repr__(self):
        return f"<TableSchema {self.name}>"


class Field(Base):
    __tablename__ = "fields"

    id = Column(Integer, primary_key=True, index=True)
    tracking_id = Column(UUID(as_uuid=True), default=uuid.uuid4, unique=True, index=True)
    table_id = Column(Integer, ForeignKey("tables_schema.id"), nullable=False)
    
    name = Column(String(100), nullable=False)
    display_name = Column(String(200), nullable=True)
    type = Column(Enum(FieldType), default=FieldType.TEXT, nullable=False)
    description = Column(Text, nullable=True)
    
    required = Column(Boolean, default=False)
    unique = Column(Boolean, default=False)
    indexed = Column(Boolean, default=False)
    
    # Configuration supplémentaire en JSON : min_length, max_length, regex, options, etc.
    config = Column(JSONB, default=dict, nullable=False)
    
    order = Column(Integer, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<Field {self.name} : {self.type}>"


class Relation(Base):
    __tablename__ = "relations"

    id = Column(Integer, primary_key=True, index=True)
    tracking_id = Column(UUID(as_uuid=True), default=uuid.uuid4, unique=True, index=True)
    schema_id = Column(Integer, ForeignKey("schemas.id"), nullable=False)
    
    source_table_id = Column(Integer, ForeignKey("tables_schema.id"), nullable=False)
    target_table_id = Column(Integer, ForeignKey("tables_schema.id"), nullable=False)
    
    name = Column(String(100), nullable=False)
    type = Column(Enum(RelationType), default=RelationType.ONE_TO_MANY, nullable=False)
    description = Column(Text, nullable=True)
    
    # Clés étrangères
    source_key = Column(String(100), default="id")
    target_key = Column(String(100), default="id")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<Relation {self.name}>"
