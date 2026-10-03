from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.modules.payments.router import router as payments_router

app = FastAPI(
    title="svc-payment-gateway",
    description="PSP integration boundary. Ships with a MockProvider -- see app/modules/payments/provider.py.",
    version="0.1.0",
)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
app.include_router(payments_router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "svc-payment-gateway", "provider": "mock (NOT production-ready)"}
