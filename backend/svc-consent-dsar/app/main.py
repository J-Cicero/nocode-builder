from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.modules.dsar.router import router as dsar_router

app = FastAPI(title="svc-consent-dsar", description="GDPR consent registry and DSAR workflow.", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
app.include_router(dsar_router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "svc-consent-dsar"}
