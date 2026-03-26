"""add page type for device targeting

Revision ID: 9a2f1be8c4d1
Revises: 5e0d3f6f2a11
Create Date: 2026-03-26 15:10:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision: str = "9a2f1be8c4d1"
down_revision: Union[str, Sequence[str], None] = "5e0d3f6f2a11"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


TYPE_PAGE_ENUM = sa.Enum("mobile", "tablet", "desktop", name="typepage")


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_tables = set(inspector.get_table_names())

    TYPE_PAGE_ENUM.create(bind, checkfirst=True)

    if "pages" in existing_tables:
        columns = {column["name"] for column in inspector.get_columns("pages")}
        if "type_page" not in columns:
            op.add_column(
                "pages",
                sa.Column(
                    "type_page",
                    TYPE_PAGE_ENUM,
                    nullable=False,
                    server_default="mobile",
                ),
            )
            op.alter_column("pages", "type_page", server_default=None)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_tables = set(inspector.get_table_names())

    if "pages" in existing_tables:
        columns = {column["name"] for column in inspector.get_columns("pages")}
        if "type_page" in columns:
            op.drop_column("pages", "type_page")

    TYPE_PAGE_ENUM.drop(bind, checkfirst=True)
