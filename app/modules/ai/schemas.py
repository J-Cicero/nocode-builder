from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime


class MessageCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=4000,
                        description="Message from user to the AI assistant")


class MessageResponse(BaseModel):
    tracking_id: UUID
    role: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ConversationResponse(BaseModel):
    tracking_id: UUID
    project_id: UUID
    title: str
    messages: List[MessageResponse] = []
    created_at: datetime

    model_config = {"from_attributes": True}


class SchemaGenerationRequest(BaseModel):
    description: str = Field(..., min_length=10, max_length=5000,
                            description="Natural language description of the application to build (French or English)")


class GeneratedField(BaseModel):
    name: str
    type: str
    required: bool = False
    unique: bool = False
    default: Optional[str] = None


class GeneratedTable(BaseModel):
    name: str
    display_name: str
    fields: List[GeneratedField]


class GeneratedRelation(BaseModel):
    from_table: str
    to_table: str
    type: str


class SchemaGenerationResponse(BaseModel):
    success: bool
    message: str
    tables_created: List[str] = []
    relations_created: int = 0
    raw_schema: Optional[dict] = None


class InterfaceGenerationRequest(BaseModel):
    description: str = Field(..., min_length=10, max_length=5000,
                            description="Natural language description of the application interface to build")


class InterfaceGenerationResponse(BaseModel):
    success: bool
    message: str
    pages_created: List[str] = []
    components_created: int = 0
    raw_interface: Optional[dict] = None


class AppGenerationRequest(BaseModel):
    description: str = Field(..., min_length=10, max_length=5000,
                            description="Description globale de l'application (fonctionnel, données, écrans, automatisations)")


class AppGenerationResponse(BaseModel):
    success: bool
    message: str
    schema: SchemaGenerationResponse
    interface: InterfaceGenerationResponse
    workflows_created: int = 0
