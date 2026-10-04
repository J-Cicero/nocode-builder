from pydantic import BaseModel, Field, model_validator
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

    @model_validator(mode="before")
    @classmethod
    def handle_workflow_aliases(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "nom" not in data and "name" in data:
                data["nom"] = data["name"]
            if "actif" not in data and "is_active" in data:
                data["actif"] = data["is_active"]
            # Convert trigger_type / actions into etapes if etapes is not explicitly provided
            if not data.get("etapes"):
                built_etapes = []
                idx = 0
                if data.get("trigger_type"):
                    built_etapes.append({
                        "ordre": idx,
                        "type": "declencheur",
                        "config": data.get("trigger_config", {"type": data["trigger_type"]})
                    })
                    idx += 1
                if data.get("actions") and isinstance(data["actions"], list):
                    for act in data["actions"]:
                        built_etapes.append({
                            "ordre": idx,
                            "type": "action",
                            "config": act.get("config", act)
                        })
                        idx += 1
                if built_etapes:
                    data["etapes"] = built_etapes
        return data


class WorkflowUpdate(BaseModel):
    nom: Optional[str] = Field(None, min_length=2, max_length=200)
    description: Optional[str] = Field(None, max_length=500)
    actif: Optional[bool] = None

    @model_validator(mode="before")
    @classmethod
    def handle_update_aliases(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "nom" not in data and "name" in data:
                data["nom"] = data["name"]
            if "actif" not in data and "is_active" in data:
                data["actif"] = data["is_active"]
        return data


class WorkflowResponse(BaseModel):
    tracking_id: UUID
    project_id: UUID
    nom: str
    name: Optional[str] = None
    description: Optional[str]
    actif: bool
    is_active: Optional[bool] = None
    etapes: List[EtapeResponse] = []
    created_at: datetime
    updated_at: Optional[datetime]

    @model_validator(mode="after")
    def sync_aliases(self):
        if self.name is None:
            self.name = self.nom
        if self.is_active is None:
            self.is_active = self.actif
        return self

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
