from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.modules.tenants.router import router as tenants_router

app = FastAPI(title="svc-tenant", description="Organization/tenant lifecycle and plan assignment.", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
app.include_router(tenants_router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "svc-tenant"}
