from fastapi import APIRouter

router = APIRouter()

@router.get("/health", tags=["Health"])
async def check_health():
    """Endpoint pour vérifier la santé de l'API."""
    return {"status": "ok"}
