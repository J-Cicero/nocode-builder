from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.modules.tickets.router import router as tickets_router

app = FastAPI(title="svc-customer-service", description="Customer support tickets.", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
app.include_router(tickets_router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "svc-customer-service"}
