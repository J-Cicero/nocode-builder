from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import Optional, Any, List
from enum import Enum


class TypeEtape(str, Enum):
    DECLENCHEUR = "declencheur"
    CONDITION = "condition"
    ACTION = "action"


class StatutExecution(str, Enum):
    EN_COURS = "en_cours"
    REUSSI = "réussi"
    ECHEC = "échoué"

class EtapeCreate(BaseModel):
    ordre: int = Field(..., ge=0)
    type: TypeEtape
    config: dict[str, Any]


class EtapeUpdate(BaseModel):
    ordre: Optional[int] = None
    type: Optional[TypeEtape] = None
    config: Optional[dict[str, Any]] = None


class EtapeResponse(BaseModel):
    tracking_id: UUID
    ordre: int
    type: TypeEtape
    config: dict[str, Any]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class WorkflowCreate(BaseModel):
    nom: str = Field(..., min_length=2, max_length=200)
    description: Optional[str] = Field(None, max_length=500)
    etapes: List[EtapeCreate] = []
    actif: bool = True


class WorkflowUpdate(BaseModel):
    nom: Optional[str] = Field(None, min_length=2, max_length=200)
    description: Optional[str] = Field(None, max_length=500)
    actif: Optional[bool] = None


class WorkflowResponse(BaseModel):
    tracking_id: UUID
    project_id: UUID
    nom: str
    description: Optional[str]
    actif: bool
    etapes: List[EtapeResponse] = []
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class ExecutionResponse(BaseModel):
    tracking_id: UUID
    workflow_id: UUID
    statut: StatutExecution
    declencheur: Optional[dict]
    resultat: Optional[dict]
    erreur: Optional[str]
    durée_secondes: Optional[float]
    triggered_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True


# ═══════════════════════════════════════════════════════════════
#  GRAPH (React Flow compat)
# ═══════════════════════════════════════════════════════════════

class GraphPosition(BaseModel):
    x: float = 0
    y: float = 0


class GraphNode(BaseModel):
    id: UUID
    type: TypeEtape
    data: dict[str, Any] = {}
    position: GraphPosition = GraphPosition()


class GraphEdge(BaseModel):
    id: str
    source: UUID
    target: UUID
    label: Optional[str] = None
    type: Optional[str] = "smoothstep"


class WorkflowGraphResponse(BaseModel):
    workflow_id: UUID
    nodes: List[GraphNode]
    edges: List[GraphEdge]


class WorkflowGraphUpdate(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge] = []
