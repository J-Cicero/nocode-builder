from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.modules.users.router import router as users_router

app = FastAPI(
    title="svc-iam",
    description="Identity, authentication, MFA and session lifecycle for the platform.",
    version="0.1.0",
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
    return {"status": "ok", "service": "svc-iam"}
