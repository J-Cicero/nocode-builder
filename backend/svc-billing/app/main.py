from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.modules.billing.router import router as billing_router

app = FastAPI(title="svc-billing", description="Subscriptions, invoices, usage metering.", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
app.include_router(billing_router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "svc-billing"}
