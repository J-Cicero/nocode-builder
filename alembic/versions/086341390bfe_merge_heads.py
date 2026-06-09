"""merge heads

Revision ID: 086341390bfe
Revises: 2cab4c2cc924, f62c603f6dff
Create Date: 2026-05-29 10:18:20.474185

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '086341390bfe'
down_revision: Union[str, Sequence[str], None] = ('2cab4c2cc924', 'f62c603f6dff')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
