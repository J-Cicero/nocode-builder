from fastapi import HTTPException, status
from uuid import UUID

from app.modules.projects.repository import ProjectRepository
from app.modules.projects.schema import (
    ProjectCreate, ProjectUpdate,
    ProjectStatusUpdate, ProjectListResponse, ProjectSummary
)
from app.modules.projects.models import Project
from app.modules.auth.models import User, UserRole


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
        await self.repo.delete(project)

    async def duplicate_project(self, tracking_id: UUID, user: User) -> Project:
        project = await self.repo.get_by_tracking_id(tracking_id)
        if not project:
            raise HTTPException(status_code=404, detail="Projet introuvable.")
        self._check_owner(project, user)
        return await self.repo.duplicate(project, user.tracking_id)
