from fastapi import HTTPException, status
from uuid import UUID

from app.modules.projects.repository import ProjectRepository
from app.modules.projects.schema import (
    ProjectCreate, ProjectUpdate,
    ProjectStatusUpdate, ProjectListResponse, ProjectSummary
)
from app.modules.projects.models import Project
from app.modules.auth.models import User, UserRole
from sqlalchemy.exc import IntegrityError
from sqlalchemy import text


class ProjectService:

    def __init__(self, repo: ProjectRepository):
        self.repo = repo

    def _check_owner(self, project: Project, user: User) -> None:
        is_admin = user.role == UserRole.ADMIN
        is_owner = str(project.owner_id) == str(user.tracking_id)
        if not is_admin and not is_owner:
            raise HTTPException(status_code=403, detail="Accès refusé.")

    async def get_my_projects(self, user: User) -> ProjectListResponse:
        projects = await self.repo.get_all_by_owner(user.tracking_id)
        return ProjectListResponse(
            total=len(projects),
            projects=[ProjectSummary.model_validate(p) for p in projects]
        )

    async def create_project(self, data: ProjectCreate, user: User) -> Project:
        return await self.repo.create(
            name=data.name,
            description=data.description,
            is_public=data.is_public,
            owner_id=user.tracking_id,
        )

    async def get_project(self, tracking_id: UUID, user: User) -> Project:
        project = await self.repo.get_by_tracking_id(tracking_id)
        if not project:
            raise HTTPException(status_code=404, detail="Projet introuvable.")
        if not project.is_public:
            self._check_owner(project, user)
        return project

    async def update_project(self, tracking_id: UUID, data: ProjectUpdate, user: User) -> Project:
        project = await self.repo.get_by_tracking_id(tracking_id)
        if not project:
            raise HTTPException(status_code=404, detail="Projet introuvable.")
        self._check_owner(project, user)
        return await self.repo.update(project, data.model_dump(exclude_unset=True))

    async def update_status(self, tracking_id: UUID, data: ProjectStatusUpdate, user: User) -> Project:
        project = await self.repo.get_by_tracking_id(tracking_id)
        if not project:
            raise HTTPException(status_code=404, detail="Projet introuvable.")
        self._check_owner(project, user)
        return await self.repo.update(project, {"status": data.status})

    async def delete_project(self, tracking_id: UUID, user: User) -> None:
        project = await self.repo.get_by_tracking_id(tracking_id)
        if not project:
            raise HTTPException(status_code=404, detail="Projet introuvable.")
        self._check_owner(project, user)
        try:
            # Essayer de supprimer les dépendances manuellement si cascade n'est pas configuré
            repo_db = self.repo.db
            pid = project.tracking_id
            
            # 1. Schéma et Tables
            await repo_db.execute(text("DELETE FROM fields WHERE table_id IN (SELECT tracking_id FROM tables_schema WHERE schema_id IN (SELECT tracking_id FROM schemas WHERE project_id = :pid))").bindparams(pid=pid))
            await repo_db.execute(text("DELETE FROM relations WHERE schema_id IN (SELECT tracking_id FROM schemas WHERE project_id = :pid)").bindparams(pid=pid))
            await repo_db.execute(text("DELETE FROM tables_schema WHERE schema_id IN (SELECT tracking_id FROM schemas WHERE project_id = :pid)").bindparams(pid=pid))
            await repo_db.execute(text("DELETE FROM schemas WHERE project_id = :pid").bindparams(pid=pid))
            
            # 2. Interface et Composants
            await repo_db.execute(text("DELETE FROM composants WHERE page_id IN (SELECT tracking_id FROM pages WHERE interface_id IN (SELECT tracking_id FROM interfaces WHERE project_id = :pid))").bindparams(pid=pid))
            await repo_db.execute(text("DELETE FROM pages WHERE interface_id IN (SELECT tracking_id FROM interfaces WHERE project_id = :pid)").bindparams(pid=pid))
            await repo_db.execute(text("DELETE FROM interfaces WHERE project_id = :pid").bindparams(pid=pid))
            
            # 3. AI et Conversations
            await repo_db.execute(text("DELETE FROM messages WHERE conversation_id IN (SELECT tracking_id FROM conversations WHERE project_id = :pid)").bindparams(pid=pid))
            await repo_db.execute(text("DELETE FROM conversations WHERE project_id = :pid").bindparams(pid=pid))
            
            # 4. Workflows
            await repo_db.execute(text("DELETE FROM etapes_workflow WHERE workflow_id IN (SELECT tracking_id FROM workflows WHERE project_id = :pid)").bindparams(pid=pid))
            await repo_db.execute(text("DELETE FROM workflows WHERE project_id = :pid").bindparams(pid=pid))
            
            # 5. Données
            await repo_db.execute(text("DELETE FROM historique_donnees WHERE donnee_id IN (SELECT tracking_id FROM donnees_projets WHERE project_id = :pid)").bindparams(pid=pid))
            await repo_db.execute(text("DELETE FROM donnees_projets WHERE project_id = :pid").bindparams(pid=pid))
            
            await self.repo.delete(project)
        except IntegrityError:
            await self.repo.db.rollback()
            raise HTTPException(status_code=400, detail="Impossible de supprimer ce projet car il contient des données liées.")

    async def duplicate_project(self, tracking_id: UUID, user: User) -> Project:
        project = await self.repo.get_by_tracking_id(tracking_id)
        if not project:
            raise HTTPException(status_code=404, detail="Projet introuvable.")
        self._check_owner(project, user)
        return await self.repo.duplicate(project, user.tracking_id)
