from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    SERVICE_NAME: str = "svc-tenant"
    DATABASE_URL: str = "postgresql+asyncpg://tenant:tenant@localhost:5432/tenant"

    # Same signing secret as svc-iam -- this service validates tokens svc-iam
    # already issued, it never authenticates users itself. Vault-injected in
    # real environments, never hardcoded.
    SECRET_KEY: str = "change-me-in-vault"
    ALGORITHM: str = "HS256"

    class Config:
        env_file = ".env"


settings = Settings()
