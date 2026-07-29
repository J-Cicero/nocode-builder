from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db

router = APIRouter()

@router.get("/health", tags=["Health"])
async def check_health(db: AsyncSession = Depends(get_db)):
    """Endpoint pour vérifier la santé de l'API et de la base de données."""
    try:
        await db.execute(text("SELECT 1"))
        db_status = "ok"
    except Exception as e:
        db_status = f"error: {str(e)}"
        
    return {"status": "ok", "database": db_status}
