from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    SERVICE_NAME: str = "svc-customer-service"
    DATABASE_URL: str = "postgresql+asyncpg://customer_service:customer_service@localhost:5432/customer_service"

    # Same signing secret as svc-iam -- this service validates tokens svc-iam
    # already issued, it never authenticates users itself. Vault-injected in
    # real environments, never hardcoded.
    SECRET_KEY: str = "change-me-in-vault"
    ALGORITHM: str = "HS256"

    class Config:
        env_file = ".env"


settings = Settings()
