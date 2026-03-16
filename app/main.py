from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.modules.auth.router import router as auth_router
from app.modules.projects.router import router as projects_router

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

app.include_router(auth_router, prefix="/api/v1")
app.include_router(projects_router, prefix="/api/v1")


@app.get("/", tags=["Health"])
async def root():
    return {"message": "NoCode Builder API "}