"""add deployments table

Revision ID: ca4b9e7b1f21
Revises: 9a2f1be8c4d1
Create Date: 2026-03-31 16:10:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision: str = "ca4b9e7b1f21"
down_revision: Union[str, Sequence[str], None] = "9a2f1be8c4d1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


deployment_status_enum = sa.Enum("pending", "completed", "failed", name="statutdeployment")


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_tables = set(inspector.get_table_names())

    deployment_status_enum.create(bind, checkfirst=True)

    if "deployments" not in existing_tables:
        op.create_table(
            "deployments",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("tracking_id", sa.UUID(), nullable=True),
            sa.Column("interface_id", sa.UUID(), nullable=False),
            sa.Column("url", sa.String(length=500), nullable=True),
            sa.Column("status", deployment_status_enum, nullable=False, server_default="pending"),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
            sa.ForeignKeyConstraint(["interface_id"], ["interfaces.tracking_id"]),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("tracking_id"),
        )
        op.create_index(op.f("ix_deployments_id"), "deployments", ["id"], unique=False)
        op.create_index(op.f("ix_deployments_interface_id"), "deployments", ["interface_id"], unique=False)
        op.create_index(op.f("ix_deployments_tracking_id"), "deployments", ["tracking_id"], unique=True)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_tables = set(inspector.get_table_names())

    if "deployments" in existing_tables:
        op.drop_index(op.f("ix_deployments_tracking_id"), table_name="deployments")
        op.drop_index(op.f("ix_deployments_interface_id"), table_name="deployments")
        op.drop_index(op.f("ix_deployments_id"), table_name="deployments")
        op.drop_table("deployments")

    deployment_status_enum.drop(bind, checkfirst=True)

