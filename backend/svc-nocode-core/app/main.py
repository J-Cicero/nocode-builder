import asyncio
import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.core.config import settings
from app.core.database import Base, engine
from app.core.identity import decode_access_token, is_public_path
from app.core.logging import setup_logging
from app.modules.ai.validation import AIServiceError
from app.modules.templates.catalog import TEMPLATE_CATALOG as _PRELOADED_TEMPLATES  # noqa: F401

# ─── Logging Setup ──────────────────────────────────────────────────────────────
setup_logging()
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


# ─── Lifespan ───────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 NoCode Builder API starting up...")
    if os.getenv("AUTO_CREATE_TABLES", "true").lower() == "true":
        from app.modules.ai import models as _ai_models  # noqa: F401
        from app.modules.data_engine import models as _data_models  # noqa: F401
        from app.modules.generator import models as _gen_models  # noqa: F401
        from app.modules.interface_builder import models as _ui_models  # noqa: F401
        from app.modules.projects import models as _proj_models  # noqa: F401
        from app.modules.schema import models as _schema_models  # noqa: F401
        from app.modules.workflow_engine import models as _wf_models  # noqa: F401

        await _init_db_with_retry()
    yield
    logger.info("🛑 NoCode Builder API shutting down...")
    await engine.dispose()


# ─── App ────────────────────────────────────────────────────────────────────────
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Plateforme NoCode capable de générer une application complète à partir d'un Blueprint.",
    version=settings.API_VERSION,
    lifespan=lifespan,
)


@app.exception_handler(AIServiceError)
async def ai_service_error_handler(request: Request, exc: AIServiceError):
    payload: dict = {"detail": exc.detail, "code": exc.code}
    if exc.errors:
        payload["errors"] = exc.errors
    return JSONResponse(status_code=exc.status_code, content=payload)

# ─── CORS ───────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def enforce_jwt_middleware(request: Request, call_next):
    """Enforce JWT authentication globally except on the single public whitelist."""
    if request.method != "OPTIONS" and not is_public_path(request.url.path):
        auth_header = request.headers.get("authorization", "")
        service_header = request.headers.get("x-service-auth", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:].strip()
            try:
                request.state.identity = decode_access_token(token)
            except HTTPException as exc:
                return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})
        elif service_header and request.url.path.startswith("/api/projects/internal/"):
            # Verified by require_service_token dependency on internal DSAR routes.
            pass
        else:
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "Not authenticated"},
            )
    return await call_next(request)

# ─── Business Modules (Projects, Schema, Data, AI, Workflows, Generator, Interface) ──
modules_to_load = [
    ("app.modules.projects.router", "projects_router_module", "/api", ["Projets"]),
    ("app.modules.ai.router", "ai_router", "/api", ["AI Assistant"]),
    ("app.modules.ai.catalog_router", "ai_catalog_router", "/api", ["AI Catalogue"]),
    ("app.modules.schema.router", "schema_router", "/api", ["Constructeur de Schéma"]),
    ("app.modules.data_engine.router", "data_engine_router", "/api", ["Moteur de Données"]),
    ("app.modules.interface_builder.router", "interface_builder_router", "/api", ["Interface Builder"]),
    ("app.modules.generator.router", "generator_router", "/api", ["Générateur"]),
    ("app.modules.workflow_engine.router", "workflow_engine_router", "/api", ["Workflows"]),
    ("app.modules.templates.router", "templates_router", "/api", ["Templates"]),
]

for mod_path, router_name, prefix, tags in modules_to_load:
    try:
        import importlib
        mod = importlib.import_module(mod_path)
        router_obj = getattr(mod, "router")
        app.include_router(router_obj, prefix=prefix)
        logger.info(f"Loaded module router: {mod_path}")
    except Exception as e:
        logger.warning(f"Could not load module router {mod_path}: {e}")



# ─── Root & Health ──────────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
async def health():
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database unavailable") from exc
    return {"status": "ok", "service": "svc-nocode-core"}


@app.get("/", tags=["Root"])
async def root():
    return {
        "project": settings.PROJECT_NAME,
        "version": settings.API_VERSION,
        "docs": "/docs",
        "health": "/health",
    }
