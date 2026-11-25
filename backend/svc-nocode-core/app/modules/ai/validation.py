"""Strict JSON parsing and Pydantic v2 validation for AI generation outputs."""
from __future__ import annotations

import json
import re
from typing import Any

from pydantic import BaseModel, Field, ValidationError, field_validator, model_validator

from app.modules.interface_builder.models import SectionType
from app.modules.schema.models import FieldType, RelationType
from app.modules.workflow_engine.models import TypeEtape

SNAKE_CASE_RE = re.compile(r"^[a-z][a-z0-9_]*$")

ALLOWED_FIELD_TYPES: frozenset[str] = frozenset(e.value for e in FieldType)
ALLOWED_RELATION_TYPES: frozenset[str] = frozenset(e.value for e in RelationType)
ALLOWED_SECTION_TYPES: frozenset[str] = frozenset(e.value for e in SectionType)
ALLOWED_WORKFLOW_STEP_TYPES: frozenset[str] = frozenset(e.value for e in TypeEtape)
ALLOWED_DEVICES: frozenset[str] = frozenset({"desktop", "web", "mobile", "tablet"})

RESERVED_TABLE_NAMES: frozenset[str] = frozenset(
    {
        "user",
        "users",
        "admin",
        "system",
        "select",
        "table",
        "from",
        "where",
        "order",
        "group",
        "index",
        "key",
        "primary",
        "null",
        "true",
        "false",
        "schemas",
        "tables_schema",
        "fields",
        "relations",
        "interfaces",
        "pages",
        "sections",
        "composants",
        "workflows",
        "etapes_workflow",
        "executions_workflow",
        "generations",
        "deployments",
        "donnees_projets",
        "historique_donnees",
        "conversations",
        "messages",
        "nocode_projects",
        "ai_providers",
        "ai_models",
    }
)

RESERVED_FIELD_NAMES: frozenset[str] = frozenset(
    {
        "id",
        "tracking_id",
        "created_at",
        "updated_at",
        "select",
        "from",
        "where",
        "order",
        "group",
        "null",
        "true",
        "false",
        "primary",
    }
)


class AIServiceError(Exception):
    """Structured French error raised by the AI pipeline and serialized to JSON."""

    def __init__(
        self,
        status_code: int,
        detail: str,
        code: str,
        errors: list[str] | None = None,
    ) -> None:
        super().__init__(detail)
        self.status_code = status_code
        self.detail = detail
        self.code = code
        self.errors = errors


def parse_ai_json(raw_content: str) -> dict[str, Any]:
    """Strip markdown code fences and surrounding prose, and parse a JSON object."""
    if not isinstance(raw_content, str) or not raw_content.strip():
        raise ValueError("Réponse IA vide.")

    text = raw_content.strip()
    fence_match = re.search(r"```(?:json)?\s*([\s\S]*?)```", text, flags=re.IGNORECASE)
    if fence_match:
        text = fence_match.group(1).strip()

    candidates = [text]
    start_idx = text.find("{")
    end_idx = text.rfind("}")
    if start_idx != -1 and end_idx != -1 and start_idx < end_idx:
        candidates.append(text[start_idx : end_idx + 1])

    for candidate in candidates:
        cleaned = re.sub(r",\s*([}\]])", r"\1", candidate)
        try:
            parsed = json.loads(cleaned)
        except json.JSONDecodeError:
            continue
        if not isinstance(parsed, dict):
            raise ValueError("La réponse JSON de l'IA doit être un objet JSON.")
        return parsed

    raise ValueError("Impossible d'extraire un objet JSON valide de la réponse de l'IA.")


def format_validation_errors(exc: Exception) -> list[str]:
    """Convert Pydantic/ValueError exceptions into concise human-readable messages."""
    if isinstance(exc, ValidationError):
        messages: list[str] = []
        for err in exc.errors():
            loc = ".".join(str(part) for part in err.get("loc", ()))
            msg = str(err.get("msg", "Valeur invalide"))
            messages.append(f"{loc}: {msg}" if loc else msg)
        return messages or ["Erreur de validation Pydantic."]
    return [str(exc)]


class ValidatedField(BaseModel):
    name: str
    type: str
    required: bool = False
    unique: bool = False
    default: Any = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        if not SNAKE_CASE_RE.match(value):
            raise ValueError(f"Le nom de champ '{value}' doit être en snake_case.")
        if value in RESERVED_FIELD_NAMES:
            raise ValueError(f"Le nom de champ '{value}' est réservé.")
        return value

    @field_validator("type")
    @classmethod
    def validate_type(cls, value: str) -> str:
        normalized = str(value).strip().lower()
        if normalized not in ALLOWED_FIELD_TYPES:
            raise ValueError(
                f"Type de champ '{value}' invalide (autorisés: {sorted(ALLOWED_FIELD_TYPES)})."
            )
        return normalized


class ValidatedTable(BaseModel):
    name: str
    display_name: str | None = None
    fields: list[ValidatedField] = Field(..., min_length=1)

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        if not SNAKE_CASE_RE.match(value):
            raise ValueError(f"Le nom de table '{value}' doit être en snake_case.")
        if value in RESERVED_TABLE_NAMES:
            raise ValueError(f"Le nom de table '{value}' est réservé.")
        return value

    @model_validator(mode="after")
    def validate_unique_fields(self) -> ValidatedTable:
        seen: set[str] = set()
        for f in self.fields:
            if f.name in seen:
                raise ValueError(f"Champ en double '{f.name}' dans la table '{self.name}'.")
            seen.add(f.name)
        return self


class ValidatedRelation(BaseModel):
    from_table: str
    to_table: str
    type: str
    name: str | None = None
    description: str | None = None
    source_key: str = "id"
    target_key: str = "id"

    @field_validator("type")
    @classmethod
    def validate_type(cls, value: str) -> str:
        normalized = str(value).strip().lower().replace("-", "_")
        if normalized not in ALLOWED_RELATION_TYPES:
            raise ValueError(
                f"Type de relation '{value}' invalide (autorisés: {sorted(ALLOWED_RELATION_TYPES)})."
            )
        return normalized


class ValidatedSchemaOutput(BaseModel):
    tables: list[ValidatedTable] = Field(..., min_length=1)
    relations: list[ValidatedRelation] = Field(default_factory=list)

    @model_validator(mode="after")
    def validate_tables_and_relations(self) -> ValidatedSchemaOutput:
        table_names: set[str] = set()
        for t in self.tables:
            if t.name in table_names:
                raise ValueError(f"Table en double '{t.name}'.")
            table_names.add(t.name)
        for rel in self.relations:
            if rel.from_table not in table_names:
                raise ValueError(f"La relation référence une table source inconnue '{rel.from_table}'.")
            if rel.to_table not in table_names:
                raise ValueError(f"La relation référence une table cible inconnue '{rel.to_table}'.")
        return self


class ValidatedSection(BaseModel):
    type: str
    ordre: int = Field(default=0, ge=0)
    title: str | None = None
    config: dict[str, Any] = Field(default_factory=dict)
    connecte_a: str | None = None

    @field_validator("type")
    @classmethod
    def validate_section_type(cls, value: str) -> str:
        normalized = str(value).strip().lower()
        if normalized not in ALLOWED_SECTION_TYPES:
            raise ValueError(
                f"Type de section '{value}' inconnu (autorisés: {sorted(ALLOWED_SECTION_TYPES)})."
            )
        return normalized


class ValidatedPage(BaseModel):
    name: str = Field(..., min_length=1)
    path: str = Field(..., min_length=1)
    device: str = "desktop"
    is_home: bool = False
    sections: list[ValidatedSection] = Field(..., min_length=1)

    @field_validator("path")
    @classmethod
    def validate_path(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned.startswith("/"):
            raise ValueError(f"Le chemin de page '{value}' doit commencer par '/'.")
        return cleaned

    @field_validator("device")
    @classmethod
    def validate_device(cls, value: str) -> str:
        normalized = str(value).strip().lower()
        if normalized not in ALLOWED_DEVICES:
            raise ValueError(f"Device '{value}' invalide (autorisés: {sorted(ALLOWED_DEVICES)}).")
        return "desktop" if normalized == "web" else normalized


class ValidatedInterfaceOutput(BaseModel):
    pages: list[ValidatedPage] = Field(..., min_length=1)

    @model_validator(mode="after")
    def validate_unique_paths(self) -> ValidatedInterfaceOutput:
        seen_paths: set[str] = set()
        for page in self.pages:
            if page.path in seen_paths:
                raise ValueError(f"Chemin de page en double '{page.path}'.")
            seen_paths.add(page.path)
        return self


class ValidatedWorkflowStep(BaseModel):
    type: str
    ordre: int = Field(default=0, ge=0)
    config: dict[str, Any] = Field(default_factory=dict)

    @field_validator("type")
    @classmethod
    def validate_step_type(cls, value: str) -> str:
        normalized = str(value).strip().lower()
        if normalized not in ALLOWED_WORKFLOW_STEP_TYPES:
            raise ValueError(
                f"Type d'étape '{value}' invalide (autorisés: {sorted(ALLOWED_WORKFLOW_STEP_TYPES)})."
            )
        return normalized


class ValidatedWorkflow(BaseModel):
    nom: str = Field(..., min_length=1)
    description: str | None = None
    etapes: list[ValidatedWorkflowStep] = Field(default_factory=list)


class ValidatedWorkflowsOutput(BaseModel):
    workflows: list[ValidatedWorkflow] = Field(default_factory=list)


AISchemaOutput = ValidatedSchemaOutput
AIInterfaceOutput = ValidatedInterfaceOutput
AIWorkflowsOutput = ValidatedWorkflowsOutput
