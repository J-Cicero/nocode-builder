"""add missing module tables

Revision ID: 5e0d3f6f2a11
Revises: 39f0498ad542
Create Date: 2026-03-26 14:20:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "5e0d3f6f2a11"
down_revision: Union[str, Sequence[str], None] = "39f0498ad542"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    existing = set(inspect(bind).get_table_names())

    if "interfaces" not in existing:
        op.create_table(
            "interfaces",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("tracking_id", sa.UUID(), nullable=True),
            sa.Column("project_id", sa.UUID(), nullable=False),
            sa.Column("version", sa.Integer(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
            sa.ForeignKeyConstraint(["project_id"], ["projects.tracking_id"]),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("tracking_id"),
            sa.UniqueConstraint("project_id"),
        )
        op.create_index(op.f("ix_interfaces_id"), "interfaces", ["id"], unique=False)
        op.create_index(op.f("ix_interfaces_tracking_id"), "interfaces", ["tracking_id"], unique=True)

    if "pages" not in existing:
        op.create_table(
            "pages",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("tracking_id", sa.UUID(), nullable=True),
            sa.Column("interface_id", sa.UUID(), nullable=False),
            sa.Column("nom", sa.String(length=200), nullable=False),
            sa.Column("chemin", sa.String(length=200), nullable=False),
            sa.Column("est_accueil", sa.Boolean(), nullable=True),
            sa.Column("ordre", sa.Integer(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
            sa.ForeignKeyConstraint(["interface_id"], ["interfaces.tracking_id"]),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("tracking_id"),
        )
        op.create_index(op.f("ix_pages_id"), "pages", ["id"], unique=False)
        op.create_index(op.f("ix_pages_tracking_id"), "pages", ["tracking_id"], unique=True)

    if "composants" not in existing:
        op.create_table(
            "composants",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("tracking_id", sa.UUID(), nullable=True),
            sa.Column("page_id", sa.UUID(), nullable=False),
            sa.Column("parent_id", sa.UUID(), nullable=True),
            sa.Column(
                "type",
                sa.Enum(
                    "CONTENEUR",
                    "TEXTE",
                    "BOUTON",
                    "FORMULAIRE",
                    "CHAMP_INPUT",
                    "LISTE",
                    "CARTE",
                    "IMAGE",
                    "NAVIGATION",
                    name="typecomposant",
                ),
                nullable=False,
            ),
            sa.Column("position_x", sa.Integer(), nullable=True),
            sa.Column("position_y", sa.Integer(), nullable=True),
            sa.Column("largeur", sa.String(length=100), nullable=True),
            sa.Column("hauteur", sa.String(length=100), nullable=True),
            sa.Column("styles", postgresql.JSON(astext_type=sa.Text()), nullable=True),
            sa.Column("config", postgresql.JSON(astext_type=sa.Text()), nullable=True),
            sa.Column("connecte_a", sa.String(length=200), nullable=True),
            sa.Column("ordre", sa.Integer(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
            sa.ForeignKeyConstraint(["page_id"], ["pages.tracking_id"]),
            sa.ForeignKeyConstraint(["parent_id"], ["composants.tracking_id"]),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("tracking_id"),
        )
        op.create_index(op.f("ix_composants_id"), "composants", ["id"], unique=False)
        op.create_index(op.f("ix_composants_tracking_id"), "composants", ["tracking_id"], unique=True)

    if "workflows" not in existing:
        op.create_table(
            "workflows",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("tracking_id", sa.UUID(), nullable=True),
            sa.Column("project_id", sa.UUID(), nullable=False),
            sa.Column("nom", sa.String(length=200), nullable=False),
            sa.Column("description", sa.String(length=500), nullable=True),
            sa.Column("actif", sa.Boolean(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
            sa.ForeignKeyConstraint(["project_id"], ["projects.tracking_id"]),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("tracking_id"),
        )
        op.create_index(op.f("ix_workflows_id"), "workflows", ["id"], unique=False)
        op.create_index(op.f("ix_workflows_tracking_id"), "workflows", ["tracking_id"], unique=True)

    if "etapes_workflow" not in existing:
        op.create_table(
            "etapes_workflow",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("tracking_id", sa.UUID(), nullable=True),
            sa.Column("workflow_id", sa.UUID(), nullable=False),
            sa.Column("ordre", sa.Integer(), nullable=False),
            sa.Column(
                "type",
                sa.Enum("DECLENCHEUR", "CONDITION", "ACTION", name="typeetape"),
                nullable=False,
            ),
            sa.Column("config", postgresql.JSON(astext_type=sa.Text()), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
            sa.ForeignKeyConstraint(["workflow_id"], ["workflows.tracking_id"]),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("tracking_id"),
        )
        op.create_index(op.f("ix_etapes_workflow_id"), "etapes_workflow", ["id"], unique=False)
        op.create_index(op.f("ix_etapes_workflow_tracking_id"), "etapes_workflow", ["tracking_id"], unique=True)

    if "executions_workflow" not in existing:
        op.create_table(
            "executions_workflow",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("tracking_id", sa.UUID(), nullable=True),
            sa.Column("workflow_id", sa.UUID(), nullable=False),
            sa.Column(
                "statut",
                sa.Enum("EN_COURS", "REUSSI", "ECHEC", name="statutexecution"),
                nullable=True,
            ),
            sa.Column("declencheur", postgresql.JSON(astext_type=sa.Text()), nullable=True),
            sa.Column("resultat", postgresql.JSON(astext_type=sa.Text()), nullable=True),
            sa.Column("erreur", sa.String(length=500), nullable=True),
            sa.Column("durée_secondes", sa.Float(), nullable=True),
            sa.Column("triggered_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
            sa.ForeignKeyConstraint(["workflow_id"], ["workflows.tracking_id"]),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("tracking_id"),
        )
        op.create_index(op.f("ix_executions_workflow_id"), "executions_workflow", ["id"], unique=False)
        op.create_index(op.f("ix_executions_workflow_tracking_id"), "executions_workflow", ["tracking_id"], unique=True)

    if "generations" not in existing:
        op.create_table(
            "generations",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("tracking_id", sa.UUID(), nullable=True),
            sa.Column("project_id", sa.UUID(), nullable=False),
            sa.Column("nom", sa.String(length=200), nullable=False),
            sa.Column(
                "statut",
                sa.Enum("PENDING", "IN_PROGRESS", "COMPLETED", "FAILED", name="statutgeneration"),
                nullable=True,
            ),
            sa.Column("url_zip", sa.String(length=500), nullable=True),
            sa.Column("erreur", sa.String(length=500), nullable=True),
            sa.Column("config", postgresql.JSON(astext_type=sa.Text()), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
            sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("tracking_id"),
        )
        op.create_index(op.f("ix_generations_id"), "generations", ["id"], unique=False)
        op.create_index(op.f("ix_generations_project_id"), "generations", ["project_id"], unique=False)
        op.create_index(op.f("ix_generations_tracking_id"), "generations", ["tracking_id"], unique=True)

    if "conversations" not in existing:
        op.create_table(
            "conversations",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("tracking_id", sa.UUID(), nullable=True),
            sa.Column("project_id", sa.UUID(), nullable=False),
            sa.Column("title", sa.String(length=200), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
            sa.ForeignKeyConstraint(["project_id"], ["projects.tracking_id"]),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("tracking_id"),
            sa.UniqueConstraint("project_id"),
        )
        op.create_index(op.f("ix_conversations_id"), "conversations", ["id"], unique=False)
        op.create_index(op.f("ix_conversations_tracking_id"), "conversations", ["tracking_id"], unique=True)

    if "messages" not in existing:
        op.create_table(
            "messages",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("tracking_id", sa.UUID(), nullable=True),
            sa.Column("conversation_id", sa.UUID(), nullable=False),
            sa.Column("role", sa.Enum("USER", "ASSISTANT", name="messagerole"), nullable=False),
            sa.Column("content", sa.Text(), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
            sa.ForeignKeyConstraint(["conversation_id"], ["conversations.tracking_id"]),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("tracking_id"),
        )
        op.create_index(op.f("ix_messages_id"), "messages", ["id"], unique=False)
        op.create_index(op.f("ix_messages_tracking_id"), "messages", ["tracking_id"], unique=True)


def downgrade() -> None:
    bind = op.get_bind()
    existing = set(inspect(bind).get_table_names())

    if "messages" in existing:
        op.drop_index(op.f("ix_messages_tracking_id"), table_name="messages")
        op.drop_index(op.f("ix_messages_id"), table_name="messages")
        op.drop_table("messages")
    if "conversations" in existing:
        op.drop_index(op.f("ix_conversations_tracking_id"), table_name="conversations")
        op.drop_index(op.f("ix_conversations_id"), table_name="conversations")
        op.drop_table("conversations")
    if "generations" in existing:
        op.drop_index(op.f("ix_generations_tracking_id"), table_name="generations")
        op.drop_index(op.f("ix_generations_project_id"), table_name="generations")
        op.drop_index(op.f("ix_generations_id"), table_name="generations")
        op.drop_table("generations")
    if "executions_workflow" in existing:
        op.drop_index(op.f("ix_executions_workflow_tracking_id"), table_name="executions_workflow")
        op.drop_index(op.f("ix_executions_workflow_id"), table_name="executions_workflow")
        op.drop_table("executions_workflow")
    if "etapes_workflow" in existing:
        op.drop_index(op.f("ix_etapes_workflow_tracking_id"), table_name="etapes_workflow")
        op.drop_index(op.f("ix_etapes_workflow_id"), table_name="etapes_workflow")
        op.drop_table("etapes_workflow")
    if "workflows" in existing:
        op.drop_index(op.f("ix_workflows_tracking_id"), table_name="workflows")
        op.drop_index(op.f("ix_workflows_id"), table_name="workflows")
        op.drop_table("workflows")
    if "composants" in existing:
        op.drop_index(op.f("ix_composants_tracking_id"), table_name="composants")
        op.drop_index(op.f("ix_composants_id"), table_name="composants")
        op.drop_table("composants")
    if "pages" in existing:
        op.drop_index(op.f("ix_pages_tracking_id"), table_name="pages")
        op.drop_index(op.f("ix_pages_id"), table_name="pages")
        op.drop_table("pages")
    if "interfaces" in existing:
        op.drop_index(op.f("ix_interfaces_tracking_id"), table_name="interfaces")
        op.drop_index(op.f("ix_interfaces_id"), table_name="interfaces")
        op.drop_table("interfaces")
