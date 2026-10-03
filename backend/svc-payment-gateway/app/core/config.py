from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    SERVICE_NAME: str = "svc-payment-gateway"
    DATABASE_URL: str = "postgresql+asyncpg://payment:payment@localhost:5432/payment"

    # Same signing secret as svc-iam -- this service validates tokens svc-iam
    # already issued, it never authenticates users itself. Vault-injected in
    # real environments, never hardcoded.
    SECRET_KEY: str = "change-me-in-vault"
    BILLING_UPSTREAM: str = "http://svc-billing:8004"
    ALGORITHM: str = "HS256"

    class Config:
        env_file = ".env"


settings = Settings()
