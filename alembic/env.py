from logging.config import fileConfig
from sqlalchemy import create_engine, pool
from alembic import context

# Import de ta config et de tes modèles
from app.core.config import settings
from app.core.database import Base
from app.modules.auth.models import User  # ← importe chaque modèle ici
from app.modules.projects.models import Project

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Alembic regarde cette variable pour savoir quelles tables créer
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = settings.DATABASE_URL.replace("+asyncpg", "")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    # On remplace +asyncpg par rien car alembic a besoin du driver sync
    connectable = create_engine(
        settings.DATABASE_URL.replace("+asyncpg", ""),
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
