from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    SERVICE_NAME: str = "svc-consent-dsar"
    DATABASE_URL: str = "postgresql+asyncpg://consent_dsar:consent_dsar@localhost:5432/consent_dsar"

    # Same signing secret as svc-iam -- this service validates tokens svc-iam
    # already issued, it never authenticates users itself. Vault-injected in
    # real environments, never hardcoded.
    SECRET_KEY: str = "change-me-in-vault"
    ALGORITHM: str = "HS256"

    # Erasure orchestration targets -- see app/modules/dsar/erasure.py.
    # svc-billing is deliberately NOT here: financial records (invoices)
    # are tenant-scoped, not user-scoped, and generally must be retained
    # for tax/legal reasons regardless of a GDPR erasure request -- that's
    # a real legal question a compliance team should confirm, not something
    # to silently automate away.
    IAM_UPSTREAM: str = "http://svc-iam:8001"
    NOCODE_UPSTREAM: str = "http://svc-nocode-core:8000"
    CUSTOMER_SERVICE_UPSTREAM: str = "http://svc-customer-service:8006"
    SERVICE_DESK_UPSTREAM: str = "http://svc-service-desk:8007"

    class Config:
        env_file = ".env"


settings = Settings()
