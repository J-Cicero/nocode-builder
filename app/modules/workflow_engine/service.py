from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from datetime import datetime
import time
import re

from app.modules.workflow_engine.repository import (
    WorkflowRepository,
    EtapeRepository,
    ExecutionRepository,
)
from app.modules.workflow_engine.models import (
    Workflow,
    EtapeWorkflow,
    ExecutionWorkflow,
    StatutExecution,
    TypeEtape,
)
from app.modules.workflow_engine.schema import (
    WorkflowCreate,
    WorkflowUpdate,
    WorkflowResponse,
    ExecutionResponse,
    WorkflowGraphResponse,
    WorkflowGraphUpdate,
    GraphNode,
)


class WorkflowService:

    def __init__(self, db: AsyncSession):
        self.workflow_repo = WorkflowRepository(db)
        self.etape_repo = EtapeRepository(db)
        self.execution_repo = ExecutionRepository(db)
        self.db = db

    async def create_workflow(
        self,
        project_id: UUID,
        data: WorkflowCreate,
    ) -> WorkflowResponse:
        workflow = await self.workflow_repo.create(
            project_id=project_id,
            nom=data.nom,
            description=data.description,
            etapes=[etape.dict() for etape in data.etapes],
        )
        return WorkflowResponse.from_orm(workflow)

    async def get_workflow(self, tracking_id: UUID) -> WorkflowResponse:
        workflow = await self.workflow_repo.get_by_tracking_id(tracking_id)
        if not workflow:
            raise HTTPException(status_code=404, detail="Workflow introuvable")
        return WorkflowResponse.from_orm(workflow)

    async def get_project_workflows(self, project_id: UUID) -> list[WorkflowResponse]:
        workflows = await self.workflow_repo.get_by_project_id(project_id)
        return [WorkflowResponse.from_orm(w) for w in workflows]

    async def update_workflow(
        self,
        tracking_id: UUID,
        data: WorkflowUpdate,
    ) -> WorkflowResponse:
        workflow = await self.workflow_repo.get_by_tracking_id(tracking_id)
        if not workflow:
            raise HTTPException(status_code=404, detail="Workflow introuvable")
        
        update_data = {}
        if data.nom is not None:
            update_data["nom"] = data.nom
        if data.description is not None:
            update_data["description"] = data.description
        if data.actif is not None:
            update_data["actif"] = data.actif

        workflow = await self.workflow_repo.update(workflow, update_data)
        return WorkflowResponse.from_orm(workflow)

    async def delete_workflow(self, tracking_id: UUID):
        workflow = await self.workflow_repo.get_by_tracking_id(tracking_id)
        if not workflow:
            raise HTTPException(status_code=404, detail="Workflow introuvable")
        
        await self.workflow_repo.delete(workflow)
        return {"message": "Workflow supprimé"}

    async def trigger_workflow(
        self,
        project_id: UUID,
        evenement: str,
        table: str,
        donnee: dict,
    ):
        """Déclenche tous les workflows actifs qui écoutent cet événement"""
        workflows = await self.workflow_repo.get_active_by_project(project_id)
        
        for workflow in workflows:
            declencheur = self._get_declencheur(workflow)
            
            if (declencheur and 
                declencheur.get("evenement") == evenement and 
                declencheur.get("table") == table):
                await self._execute_workflow(workflow, donnee)

    async def _execute_workflow(self, workflow: Workflow, donnee: dict):
        """Exécute les étapes d'un workflow"""
        debut = time.time()
        
        execution = await self.execution_repo.create(
            workflow_id=workflow.tracking_id,
            declencheur=donnee,
        )

        try:
            resultats = []
            
            etapes_ordonnees = sorted(workflow.etapes, key=lambda e: e.ordre)
            
            for etape in etapes_ordonnees:
                if etape.type == TypeEtape.CONDITION:
                    if not self._evaluate_condition(etape.config, donnee):
                        break
                
                elif etape.type == TypeEtape.ACTION:
                    resultat = await self._execute_action(etape.config, donnee)
                    resultats.append(resultat)

            # Succès
            execution_data = {
                "statut": StatutExecution.REUSSI,
                "resultat": {"actions": resultats},
                "durée_secondes": time.time() - debut,
            }
            await self.execution_repo.update(execution, execution_data)

        except Exception as e:
            # Erreur
            execution_data = {
                "statut": StatutExecution.ECHEC,
                "erreur": str(e),
                "durée_secondes": time.time() - debut,
            }
            await self.execution_repo.update(execution, execution_data)

    def _get_declencheur(self, workflow: Workflow) -> dict | None:
        """Récupère la config du premier déclencheur du workflow"""
        for etape in workflow.etapes:
            if etape.type == TypeEtape.DECLENCHEUR:
                return etape.config
        return None

    def _evaluate_condition(self, config: dict, donnee: dict) -> bool:
        """Évalue une condition avec les données du déclencheur"""
        champ = config.get("champ")
        operateur = config.get("operateur")
        valeur = config.get("valeur")

        donnee_valeur = donnee.get(champ)

        if operateur == "egal_a":
            return str(donnee_valeur) == str(valeur)
        elif operateur == "different_de":
            return str(donnee_valeur) != str(valeur)
        elif operateur == "contient":
            return str(valeur) in str(donnee_valeur)
        elif operateur == "superieur_a":
            try:
                return float(donnee_valeur) > float(valeur)
            except:
                return False
        elif operateur == "inferieur_a":
            try:
                return float(donnee_valeur) < float(valeur)
            except:
                return False

        return False

    async def _execute_action(self, config: dict, donnee: dict) -> dict:
        """Exécute une action du workflow"""
        type_action = config.get("type")

        if type_action == "envoyer_email":
            destinataire = self._resolve_template(
                config.get("destinataire", ""),
                donnee,
            )
            return {
                "action": "email_envoyé",
                "destinataire": destinataire,
            }

        elif type_action == "envoyer_sms":
            telephone = self._resolve_template(
                config.get("telephone", ""),
                donnee,
            )
            return {
                "action": "sms_envoyé",
                "telephone": telephone,
            }

        elif type_action == "modifier_champ":
            champ = config.get("champ")
            valeur = self._resolve_template(
                str(config.get("valeur", "")),
                donnee,
            )
            donnee[champ] = valeur
            return {
                "action": "champ_modifié",
                "champ": champ,
                "valeur": valeur,
            }

        return {"action": "inconnue"}

    def _resolve_template(self, template: str, donnee: dict) -> str:
        """Résout les templates {{clé}} avec les données"""
        def replace(match):
            cle = match.group(1)
            return str(donnee.get(cle, ""))
        return re.sub(r'\{\{(.+?)\}\}', replace, template)

    async def get_executions(self, workflow_id: UUID) -> list[ExecutionResponse]:
        """Récupère l'historique d'exécution d'un workflow"""
        executions = await self.execution_repo.get_by_workflow_id(workflow_id)
        return [ExecutionResponse.from_orm(e) for e in executions]

    # ───────────────────── GRAPH (React Flow) ─────────────────────

    async def get_graph(self, workflow_id: UUID) -> WorkflowGraphResponse:
        workflow = await self.workflow_repo.get_by_tracking_id(workflow_id)
        if not workflow:
            raise HTTPException(status_code=404, detail="Workflow introuvable")

        nodes = []
        edges = []

        # Map etapes -> nodes, edges
        for etape in sorted(workflow.etapes, key=lambda e: e.ordre):
            cfg = etape.config or {}
            ui = cfg.get("ui", {})
            position = ui.get("position", {"x": 0, "y": etape.ordre * 120})
            nodes.append(
                GraphNode(
                    id=etape.tracking_id,
                    type=etape.type,
                    data=cfg,
                    position=position,
                )
            )

        # Edges : préférer ceux stockés dans ui.edges, sinon chaînage linéaire
        if nodes:
            # collect explicit
            for etape in workflow.etapes:
                ui_edges = (etape.config or {}).get("ui", {}).get("edges", [])
                for idx, e in enumerate(ui_edges):
                    edges.append(
                        {
                            "id": e.get("id") or f"e-{etape.tracking_id}-{idx}",
                            "source": e.get("source") or etape.tracking_id,
                            "target": e.get("target"),
                            "label": e.get("label"),
                            "type": e.get("type") or "smoothstep",
                        }
                    )
            if not edges:
                # fallback linear
                for i in range(len(nodes) - 1):
                    edges.append(
                        {
                            "id": f"e-{nodes[i].id}-{nodes[i+1].id}",
                            "source": nodes[i].id,
                            "target": nodes[i + 1].id,
                            "type": "smoothstep",
                        }
                    )

        return WorkflowGraphResponse(
            workflow_id=workflow.tracking_id,
            nodes=nodes,
            edges=edges,
        )

    async def update_graph(self, workflow_id: UUID, data: WorkflowGraphUpdate) -> WorkflowGraphResponse:
        workflow = await self.workflow_repo.get_by_tracking_id(workflow_id)
        if not workflow:
            raise HTTPException(status_code=404, detail="Workflow introuvable")

        # Index nodes/edges
        node_map = {str(n.id): n for n in data.nodes}
        edges_by_source = {}
        for edge in data.edges:
            edges_by_source.setdefault(str(edge.source), []).append(edge)

        # Update etapes
        for etape in workflow.etapes:
            node = node_map.get(str(etape.tracking_id))
            if not node:
                continue
            cfg = node.data or {}
            cfg["ui"] = {
                "position": {"x": node.position.x, "y": node.position.y},
                "edges": [
                    {
                        "id": e.id,
                        "source": str(e.source),
                        "target": str(e.target),
                        "label": e.label,
                        "type": e.type,
                    }
                    for e in edges_by_source.get(str(etape.tracking_id), [])
                ],
            }
            etape.config = cfg
            etape.ordre = node.data.get("ordre", etape.ordre)

        await self.db.flush()
        await self.db.refresh(workflow)
        return await self.get_graph(workflow_id)
