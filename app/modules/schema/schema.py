from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from uuid import UUID
from datetime import datetime
from app.modules.schema.models import FieldType, RelationType


# ═══════════════════════════════════════════════════════════════
#  CHAMPS (Fields)
# ═══════════════════════════════════════════════════════════════

class FieldCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    display_name: Optional[str] = None
    type: FieldType = FieldType.TEXT
    description: Optional[str] = None
    required: bool = False
    unique: bool = False
    indexed: bool = False
    config: Dict[str, Any] = {}


class FieldUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    display_name: Optional[str] = None
    type: Optional[FieldType] = None
    description: Optional[str] = None
    required: Optional[bool] = None
    unique: Optional[bool] = None
    indexed: Optional[bool] = None
    config: Optional[Dict[str, Any]] = None


class FieldResponse(BaseModel):
    tracking_id: UUID
    name: str
    display_name: Optional[str]
    type: FieldType
    description: Optional[str]
    required: bool
    unique: bool
    indexed: bool
    config: Dict[str, Any]
    order: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


# ═══════════════════════════════════════════════════════════════
#  RELATIONS
# ═══════════════════════════════════════════════════════════════

class RelationCreate(BaseModel):
    source_table_id: int
    target_table_id: int
    name: str = Field(..., min_length=2, max_length=100)
    type: RelationType = RelationType.ONE_TO_MANY
    description: Optional[str] = None
    source_key: str = "id"
    target_key: str = "id"


class RelationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    type: Optional[RelationType] = None
    description: Optional[str] = None
    source_key: Optional[str] = None
    target_key: Optional[str] = None


class RelationResponse(BaseModel):
    tracking_id: UUID
    source_table_id: int
    target_table_id: int
    name: str
    type: RelationType
    description: Optional[str]
    source_key: str
    target_key: str
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


# ═══════════════════════════════════════════════════════════════
#  TABLES
# ═══════════════════════════════════════════════════════════════

class TableSchemaCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    display_name: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None


class TableSchemaUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    display_name: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None


class TableSchemaResponse(BaseModel):
    tracking_id: UUID
    name: str
    display_name: Optional[str]
    description: Optional[str]
    icon: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class TableSchemaDetailResponse(TableSchemaResponse):
    fields: List[FieldResponse] = []


# ═══════════════════════════════════════════════════════════════
#  SCHEMAS
# ═══════════════════════════════════════════════════════════════

class SchemaResponse(BaseModel):
    tracking_id: UUID
    project_id: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class SchemaDetailResponse(SchemaResponse):
    tables: List[TableSchemaDetailResponse] = []
    relations: List[RelationResponse] = []
