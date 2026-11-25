"""Centralized project-ownership enforcement for svc-nocode-core.

All tenant/user data isolation in V1 goes through this module. Any resource
belonging to another user (or non-existent) raises HTTP 404 so resource
existence is never leaked across accounts. No role-based bypass exists in V1.
"""
from collections.abc import Callable
from typing import Any
from uuid import UUID

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.identity import Identity, get_current_identity
from app.modules.ai.models import Conversation
from app.modules.data_engine.models import DonneeProjet
from app.modules.generator.models import Deployment, Generation
from app.modules.interface_builder.models import Composant, Interface, Page, Section
from app.modules.projects.models import Project
from app.modules.schema.models import Field, Relation, Schema, TableSchema
from app.modules.workflow_engine.models import Workflow

# Paramètres de chemin protégés par require_ownership / assert_resource_owner.
OWNED_PATH_PARAMS: frozenset[str] = frozenset(
    {
        "project_id",
        "tracking_id",
        "table_id",
        "field_id",
        "relation_id",
        "page_id",
        "composant_id",
        "section_id",
        "donnee_id",
        "workflow_id",
    }
)

# Paramètres de chemin explicitement non-identifiants de ressource utilisateur
# (ou protégés par un autre mécanisme : token service / rôle admin catalogue / catalogue public).
NON_OWNERSHIP_PATH_PARAMS: frozenset[str] = frozenset(
    {
        "table_name",
        "model_id",
        "provider_id",
        "user_id",
        "template_id",  # Identifiant public du catalogue serveur de templates (GET/instantiate)
    }
)


def _not_found() -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ressource introuvable.")


def _owned_project_stmt(project_col: Any, target_model: type, target_id: UUID, owner_id: UUID, extra_joins: list[tuple] | None = None):
    stmt = select(Project.tracking_id).select_from(target_model)
    for model, on_clause in (extra_joins or []):
        stmt = stmt.join(model, on_clause)
    stmt = stmt.join(Project, Project.tracking_id == project_col).where(
        target_model.tracking_id == target_id,
        Project.owner_id == owner_id,
    )
    return stmt


# Table de résolution déclarative : resource_kind -> (model, project_fk_col, joins)
_RESOURCE_OWNERSHIP_MAP: dict[str, tuple[type, Any, list[tuple]]] = {
    "schema": (Schema, Schema.project_id, []),
    "table": (
        TableSchema,
        Schema.project_id,
        [(Schema, TableSchema.schema_id == Schema.tracking_id)],
    ),
    "field": (
        Field,
        Schema.project_id,
        [
            (TableSchema, Field.table_id == TableSchema.tracking_id),
            (Schema, TableSchema.schema_id == Schema.tracking_id),
        ],
    ),
    "relation": (
        Relation,
        Schema.project_id,
        [(Schema, Relation.schema_id == Schema.tracking_id)],
    ),
    "interface": (Interface, Interface.project_id, []),
    "page": (
        Page,
        Interface.project_id,
        [(Interface, Page.interface_id == Interface.tracking_id)],
    ),
    "section": (
        Section,
        Interface.project_id,
        [
            (Page, Section.page_id == Page.tracking_id),
            (Interface, Page.interface_id == Interface.tracking_id),
        ],
    ),
    "composant": (
        Composant,
        Interface.project_id,
        [
            (Page, Composant.page_id == Page.tracking_id),
            (Interface, Page.interface_id == Interface.tracking_id),
        ],
    ),
    "donnee": (DonneeProjet, DonneeProjet.project_id, []),
    "workflow": (Workflow, Workflow.project_id, []),
    "generation": (Generation, Generation.project_id, []),
    "deployment": (
        Deployment,
        Interface.project_id,
        [(Interface, Deployment.interface_id == Interface.tracking_id)],
    ),
    "conversation": (Conversation, Conversation.project_id, []),
}


async def assert_project_owner(db: AsyncSession, project_id: UUID, identity: Identity) -> UUID:
    """Verify *project_id* exists and is owned by *identity*, else raise 404."""
    stmt = select(Project.tracking_id).where(
        Project.tracking_id == project_id,
        Project.owner_id == identity.tracking_id,
    )
    found = (await db.execute(stmt)).scalar_one_or_none()
    if found is None:
        raise _not_found()
    return found


async def assert_resource_owner(
    db: AsyncSession,
    resource_kind: str,
    resource_id: UUID,
    identity: Identity,
) -> UUID:
    """Verify *resource_id* of *resource_kind* belongs to a project owned by *identity*, else raise 404."""
    if resource_kind == "project":
        return await assert_project_owner(db, resource_id, identity)
    spec = _RESOURCE_OWNERSHIP_MAP.get(resource_kind)
    if spec is None:
        raise ValueError(f"Unsupported ownership resource kind: {resource_kind}")
    model, project_col, joins = spec
    stmt = _owned_project_stmt(project_col, model, resource_id, identity.tracking_id, joins)
    found = (await db.execute(stmt)).scalar_one_or_none()
    if found is None:
        raise _not_found()
    return found


def require_ownership(resource_kind: str, param_name: str = "project_id") -> Callable:
    """FastAPI dependency enforcing ownership of path param *param_name* as *resource_kind*."""

    async def _verify_ownership(
        request: Request,
        identity: Identity = Depends(get_current_identity),
        db: AsyncSession = Depends(get_db),
    ) -> Identity:
        raw_id = request.path_params.get(param_name)
        if raw_id is None:
            raise _not_found()
        try:
            resource_uuid = raw_id if isinstance(raw_id, UUID) else UUID(str(raw_id))
        except (ValueError, TypeError):
            raise _not_found()
        await assert_resource_owner(db, resource_kind, resource_uuid, identity)
        return identity

    return _verify_ownership
