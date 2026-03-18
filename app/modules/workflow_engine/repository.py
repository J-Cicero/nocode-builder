from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from app.modules.workflow_engine.models import (
    Workflow,
    EtapeWorkflow,
    ExecutionWorkflow,
)


class WorkflowRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_tracking_id(self, tracking_id: UUID) -> Workflow | None:
        result = await self.db.execute(
            select(Workflow).where(Workflow.tracking_id == tracking_id)
        )
        return result.scalar_one_or_none()

    async def get_by_project_id(self, project_id: UUID) -> list[Workflow]:
        result = await self.db.execute(
            select(Workflow)
            .where(Workflow.project_id == project_id)
            .order_by(Workflow.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_active_by_project(self, project_id: UUID) -> list[Workflow]:
        result = await self.db.execute(
            select(Workflow)
            .where((Workflow.project_id == project_id) & (Workflow.actif == True))
            .order_by(Workflow.created_at.desc())
        )
        return list(result.scalars().all())

    async def create(self, project_id: UUID, nom: str, description: str | None, etapes: list | None) -> Workflow:
        workflow = Workflow(
            project_id=project_id,
            nom=nom,
            description=description,
            actif=True,
        )
        if etapes:
            for etape_data in etapes:
                etape = EtapeWorkflow(
                    ordre=etape_data.get("ordre"),
                    type=etape_data.get("type"),
                    config=etape_data.get("config", {}),
                )
                workflow.etapes.append(etape)
        
        self.db.add(workflow)
        await self.db.flush()
        await self.db.refresh(workflow)
        return workflow

    async def update(self, workflow: Workflow, data: dict) -> Workflow:
        for field, value in data.items():
            setattr(workflow, field, value)
        await self.db.flush()
        await self.db.refresh(workflow)
        return workflow

    async def delete(self, workflow: Workflow) -> None:
        await self.db.delete(workflow)
        await self.db.flush()


class EtapeRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_tracking_id(self, tracking_id: UUID) -> EtapeWorkflow | None:
        result = await self.db.execute(
            select(EtapeWorkflow).where(EtapeWorkflow.tracking_id == tracking_id)
        )
        return result.scalar_one_or_none()

    async def get_by_workflow_id(self, workflow_id: UUID) -> list[EtapeWorkflow]:
        result = await self.db.execute(
            select(EtapeWorkflow)
            .where(EtapeWorkflow.workflow_id == workflow_id)
            .order_by(EtapeWorkflow.ordre)
        )
        return list(result.scalars().all())

    async def create(self, workflow_id: UUID, ordre: int, type: str, config: dict) -> EtapeWorkflow:
        etape = EtapeWorkflow(
            workflow_id=workflow_id,
            ordre=ordre,
            type=type,
            config=config,
        )
        self.db.add(etape)
        await self.db.flush()
        await self.db.refresh(etape)
        return etape

    async def update(self, etape: EtapeWorkflow, data: dict) -> EtapeWorkflow:
        for field, value in data.items():
            setattr(etape, field, value)
        await self.db.flush()
        await self.db.refresh(etape)
        return etape

    async def delete(self, etape: EtapeWorkflow) -> None:
        await self.db.delete(etape)
        await self.db.flush()


class ExecutionRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_tracking_id(self, tracking_id: UUID) -> ExecutionWorkflow | None:
        result = await self.db.execute(
            select(ExecutionWorkflow).where(ExecutionWorkflow.tracking_id == tracking_id)
        )
        return result.scalar_one_or_none()

    async def get_by_workflow_id(self, workflow_id: UUID) -> list[ExecutionWorkflow]:
        result = await self.db.execute(
            select(ExecutionWorkflow)
            .where(ExecutionWorkflow.workflow_id == workflow_id)
            .order_by(ExecutionWorkflow.triggered_at.desc())
        )
        return list(result.scalars().all())

    async def create(self, workflow_id: UUID, declencheur: dict | None = None) -> ExecutionWorkflow:
        execution = ExecutionWorkflow(
            workflow_id=workflow_id,
            declencheur=declencheur,
        )
        self.db.add(execution)
        await self.db.flush()
        await self.db.refresh(execution)
        return execution

    async def update(self, execution: ExecutionWorkflow, data: dict) -> ExecutionWorkflow:
        for field, value in data.items():
            setattr(execution, field, value)
        await self.db.flush()
        await self.db.refresh(execution)
        return execution
