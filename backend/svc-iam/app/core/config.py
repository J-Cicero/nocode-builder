from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    SERVICE_NAME: str = "svc-iam"
    DATABASE_URL: str = "postgresql+asyncpg://iam:iam@localhost:5432/iam"

    SECRET_KEY: str = "change-me-in-vault"          # injected via Vault in real envs, never committed
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15            # short-lived on purpose
    REFRESH_TOKEN_EXPIRE_DAYS: int = 14

    MFA_ISSUER_NAME: str = "Platform"
    MFA_STEP_UP_TOKEN_EXPIRE_MINUTES: int = 5         # short-lived token proving "password verified, MFA pending"

    class Config:
        env_file = ".env"


settings = Settings()
