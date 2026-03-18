from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.modules.auth.router import router as auth_router
from app.modules.projects.router import router as projects_router
from app.modules.schema_builder.router import router as schema_router
from app.modules.data_engine.router import router as data_router
from app.modules.workflow_engine.router import router as workflow_router
from app.modules.interface_builder.router import router as interface_router
from app.modules.generator.router import router as generator_router

app = FastAPI(
    title="NoCode Builder",
    description="Plateforme no-code pour créer des apps sans coder.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api")
app.include_router(projects_router, prefix="/api")
app.include_router(schema_router, prefix="/api")
app.include_router(data_router, prefix="/api")
app.include_router(workflow_router, prefix="/api")
app.include_router(interface_router, prefix="/api")
app.include_router(generator_router, prefix="/api")

@app.get("/", tags=["Health"])
async def root():
    return {"message": "NoCode Builder API "}