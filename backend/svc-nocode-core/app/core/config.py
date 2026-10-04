import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )
    # ─── Project ─────────────────────────────────────────────────────────────────
    PROJECT_NAME: str = "NoCode Builder"
    API_VERSION: str = "2.0.0"
    ENVIRONMENT: str = "development"

    # ─── CORS ────────────────────────────────────────────────────────────────────
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]

    # ─── Database ────────────────────────────────────────────────────────────────
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "nocode"
    POSTGRES_PASSWORD: str = "nocode"
    POSTGRES_DB: str = "nocode_builder_v2"

    # ─── Security (Sprint 2) ─────────────────────────────────────────────────────
    SECRET_KEY: str = "changeme-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ─── AI Engine (Mistral AI / OpenAI Compatible) ──────────────────────────────
    AI_PROVIDER: str = "mistral"
    AI_API_KEY: str = "Qee9f37Fr4ZTqU2FyKUvXV6qWmbdYQ8x"
    AI_BASE_URL: str = "https://api.mistral.ai/v1"
    AI_MODEL: str = "mistral-small-latest"

    # ─── Deployment Engine ───────────────────────────────────────────────────────
    VERCEL_TOKEN: str = ""
    VERCEL_TEAM_SLUG: str = ""

    @property
    def DATABASE_URL(self) -> str:
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    @property
    def DATABASE_URL_SYNC(self) -> str:
        """URL synchrone pour Alembic."""
        return (
            f"postgresql+psycopg2://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )


settings = Settings()
