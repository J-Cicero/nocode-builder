import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.health import router as health_router
from app.api.v1.endpoints.workspaces import router as workspaces_router
from app.api.v1.endpoints.projects import router as projects_router
from app.api.v1.endpoints.blueprints import router as blueprints_router
from app.core.config import settings
from app.core.database import engine
from app.core.logging import setup_logging

# ─── Logging Setup ──────────────────────────────────────────────────────────────
setup_logging()
logger = logging.getLogger(__name__)


# ─── Lifespan ───────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 NoCode Builder API starting up...")
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

# ─── CORS ───────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ────────────────────────────────────────────────────────────────────
app.include_router(health_router, prefix="/api/v1")
app.include_router(workspaces_router, prefix="/api/v1/workspaces", tags=["Workspaces"])
app.include_router(projects_router, prefix="/api/v1/projects", tags=["Projects"])
app.include_router(blueprints_router, prefix="/api/v1/blueprints", tags=["Blueprints"])

# ─── Business Modules (Auth, Schema, Data, AI, Workflows, Generator, Interface) ──
modules_to_load = [
    ("app.modules.auth.router", "auth_router", "/api", ["Auth"]),
    ("app.modules.projects.router", "projects_router_module", "/api", [" Projets"]),
    ("app.modules.ai.router", "ai_router", "/api", ["AI Assistant"]),
    ("app.modules.schema.router", "schema_router", "/api", ["Constructeur de Schéma"]),
    ("app.modules.data_engine.router", "data_engine_router", "/api", ["Moteur de Données"]),
    ("app.modules.interface_builder.router", "interface_builder_router", "/api", ["Interface Builder"]),
    ("app.modules.generator.router", "generator_router", "/api", ["Générateur"]),
    ("app.modules.workflow_engine.router", "workflow_engine_router", "/api", ["Workflows"]),
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



# ─── Root ───────────────────────────────────────────────────────────────────────
@app.get("/", tags=["Root"])
async def root():
    return {
        "project": settings.PROJECT_NAME,
        "version": settings.API_VERSION,
        "docs": "/docs",
        "health": "/api/v1/health",
    }
