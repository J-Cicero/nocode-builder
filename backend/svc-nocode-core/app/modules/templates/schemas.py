"""Pydantic schemas for server-side template catalog and instantiation."""
from __future__ import annotations

from pydantic import BaseModel, Field, field_validator

from app.modules.ai.validation import AIInterfaceOutput, AISchemaOutput


class TemplateDefinition(BaseModel):
    """Full validated server-side template loaded from catalog JSON."""

    id: str = Field(..., min_length=1)
    name: str = Field(..., min_length=1)
    description: str = Field(..., min_length=1)
    schema_def: AISchemaOutput = Field(alias="schema")
    interface: AIInterfaceOutput


class TemplateSummary(BaseModel):
    """Public summary returned by GET /api/templates."""

    id: str
    name: str
    description: str
    tables_count: int
    pages_count: int
    section_types: list[str]


class TemplateInstantiateRequest(BaseModel):
    """Request payload for POST /api/templates/{template_id}/instantiate."""

    name: str = Field(..., min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=2000)

    @field_validator("name")
    @classmethod
    def validate_non_empty_name(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Le nom du projet ne peut pas être vide.")
        return cleaned
