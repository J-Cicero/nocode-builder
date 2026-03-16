from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import Optional, Any, Dict


# ═══════════════════════════════════════════════════════════════
#  CREATE / UPDATE
# ═══════════════════════════════════════════════════════════════

class DonneeCreate(BaseModel):
    content: Dict[str, Any] = Field(..., description="Contenu JSON de la donnée")


class DonneeUpdate(BaseModel):
    content: Dict[str, Any] = Field(..., description="Contenu JSON mis à jour")


# ═══════════════════════════════════════════════════════════════
#  RESPONSES
# ═══════════════════════════════════════════════════════════════

class DonneeResponse(BaseModel):
    id: UUID
    project_id: int
    table_name: str
    content: Dict[str, Any]
    created_by: Optional[UUID]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class DonneeListResponse(BaseModel):
    total: int
    donnees: list[DonneeResponse]


# ═══════════════════════════════════════════════════════════════
#  HISTORIQUE
# ═══════════════════════════════════════════════════════════════

class HistoriqueResponse(BaseModel):
    id: UUID
    ancien_contenu: Dict[str, Any]
    nouveau_contenu: Dict[str, Any]
    modifie_par: Optional[UUID]
    modifie_le: datetime

    class Config:
        from_attributes = True
