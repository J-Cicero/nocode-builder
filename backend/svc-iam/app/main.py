import asyncio
import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.core.database import Base, engine
from app.modules.users import models as _users_models  # noqa: F401
from app.modules.users.router import router as users_router

logger = logging.getLogger(__name__)


async def _init_db_with_retry(timeout_seconds: float = 35.0, interval_seconds: float = 1.0) -> None:
    """Wait for PostgreSQL availability and create tables, retrying for at least 30s."""
    deadline = asyncio.get_running_loop().time() + timeout_seconds
    attempt = 0
    while True:
        attempt += 1
        try:
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            return
        except Exception as exc:
            if asyncio.get_running_loop().time() >= deadline:
                raise
            logger.warning(f"DB init attempt {attempt} failed ({exc}); retrying in {interval_seconds}s")
            await asyncio.sleep(interval_seconds)


@asynccontextmanager
async def lifespan(app: FastAPI):
    if os.getenv("AUTO_CREATE_TABLES", "true").lower() == "true":
        await _init_db_with_retry()
    yield
    await engine.dispose()


app = FastAPI(
    title="svc-iam",
    description="Identity, authentication, MFA and session lifecycle for the platform.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tightened per-env via Terraform-managed config, not hardcoded, in real deploys
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users_router)


@app.get("/health")
async def health():
    async with engine.connect() as conn:
        await conn.execute(text("SELECT 1"))
    return {"status": "ok", "service": "svc-iam"}
