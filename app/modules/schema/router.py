from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.core.database import get_db
from app.core.security import decode_token, oauth2_scheme
from app.modules.schema.schema import (
    FieldCreate, FieldUpdate, FieldResponse,
    TableSchemaCreate, TableSchemaUpdate, TableSchemaResponse, TableSchemaDetailResponse,
    RelationCreate, RelationUpdate, RelationResponse,
    SchemaResponse, SchemaDetailResponse,
)
from app.modules.schema.service import SchemaService
from app.modules.schema.repository import (
    SchemaRepository, TableSchemaRepository, FieldRepository, RelationRepository
)
from app.modules.projects.repository import ProjectRepository
from app.modules.projects.service import ProjectService
from app.modules.auth.repository import AuthRepository
from app.modules.auth.models import User

router = APIRouter(prefix="/schema", tags=["Constructeur de Schéma"])


def get_schema_service(db: AsyncSession = Depends(get_db)) -> SchemaService:
    return SchemaService(db)


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    from fastapi import HTTPException
    payload = decode_token(token)
    tracking_id = UUID(payload["sub"])
    user = await AuthRepository(db).get_by_tracking_id(tracking_id)
    if not user:
        raise HTTPException(status_code=401, detail="Utilisateur introuvable.")
    return user


@router.get(
    "/projects/{project_id}",
    response_model=SchemaDetailResponse,
    summary="Récupérer le schéma complet d'un projet",
    description="Récupère la structure complète d'un projet avec toutes ses tables, champs et relations."
)
async def get_schema(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    service: SchemaService = Depends(get_schema_service),
):
    schema = await service.get_or_create_schema(project_id)
    return schema


@router.get(
    "/projects/{project_id}/tables",
    response_model=list[TableSchemaResponse],
    summary="Lister toutes les tables d'un projet",
    description="Récupère la liste simple de toutes les tables définies dans le schéma du projet."
)
async def list_tables(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    service: SchemaService = Depends(get_schema_service),
):
    return await service.get_all_tables(project_id)


@router.post(
    "/projects/{project_id}/tables",
    response_model=TableSchemaResponse,
    status_code=201,
    summary="Créer une nouvelle table",
    description="Crée une nouvelle table dans le schéma du projet avec un nom unique et une description optionnelle."
)
async def create_table(
    project_id: UUID,
    data: TableSchemaCreate,
    current_user: User = Depends(get_current_user),
    service: SchemaService = Depends(get_schema_service),
):
    return await service.create_table(project_id, data)


@router.patch(
    "/tables/{table_id}",
    response_model=TableSchemaResponse,
    summary="Modifier les propriétés d'une table",
    description="Modifie les propriétés d'une table (nom, description, icône, etc.)."
)
async def update_table(
    table_id: UUID,
    data: TableSchemaUpdate,
    current_user: User = Depends(get_current_user),
    service: SchemaService = Depends(get_schema_service),
):
    return await service.update_table(table_id, data)


@router.delete(
    "/tables/{table_id}",
    status_code=204,
    summary="Supprimer une table complètement",
    description="Supprime une table et tous ses champs associés. Cette action est irréversible."
)
async def delete_table(
    table_id: UUID,
    current_user: User = Depends(get_current_user),
    service: SchemaService = Depends(get_schema_service),
):
    await service.delete_table(table_id)


@router.get(
    "/tables/{table_id}/fields",
    response_model=list[FieldResponse],
    summary="Lister tous les champs d'une table",
    description="Récupère la liste de tous les champs définis pour une table spécifique, triés par ordre d'affichage."
)
async def list_fields(
    table_id: UUID,
    current_user: User = Depends(get_current_user),
    service: SchemaService = Depends(get_schema_service),
):
    return await service.get_all_fields(table_id)


@router.post(
    "/tables/{table_id}/fields",
    response_model=FieldResponse,
    status_code=201,
    summary="Ajouter un champ à une table",
    description="Crée un nouveau champ dans une table avec type, validation et configuration personnalisée."
)
async def create_field(
    table_id: UUID,
    data: FieldCreate,
    current_user: User = Depends(get_current_user),
    service: SchemaService = Depends(get_schema_service),
):
    return await service.create_field(table_id, data)


@router.patch(
    "/fields/{field_id}",
    response_model=FieldResponse,
    summary="Modifier les propriétés d'un champ",
    description="Modifie les propriétés d'un champ (type, obligatoire, unique, configuration, etc.)."
)
async def update_field(
    field_id: UUID,
    data: FieldUpdate,
    current_user: User = Depends(get_current_user),
    service: SchemaService = Depends(get_schema_service),
):
    return await service.update_field(field_id, data)


@router.delete(
    "/fields/{field_id}",
    status_code=204,
    summary="Supprimer un champ d'une table",
    description="Supprime complètement un champ d'une table. Les données associées seront perdues."
)
async def delete_field(
    field_id: UUID,
    current_user: User = Depends(get_current_user),
    service: SchemaService = Depends(get_schema_service),
):
    await service.delete_field(field_id)


@router.get(
    "/projects/{project_id}/relations",
    response_model=list[RelationResponse],
    summary="Lister toutes les relations d'un projet",
    description="Récupère la liste de toutes les relations (OneToMany, ManyToOne, ManyToMany) définies entre les tables."
)
async def list_relations(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    service: SchemaService = Depends(get_schema_service),
):
    return await service.get_all_relations(project_id)


@router.post(
    "/projects/{project_id}/relations",
    response_model=RelationResponse,
    status_code=201,
    summary="Créer une relation entre deux tables",
    description="Crée un lien entre deux tables avec un type de relation spécifié (OneToMany, ManyToMany, etc.)."
)
async def create_relation(
    project_id: UUID,
    data: RelationCreate,
    current_user: User = Depends(get_current_user),
    service: SchemaService = Depends(get_schema_service),
):
    return await service.create_relation(project_id, data)


@router.patch(
    "/relations/{relation_id}",
    response_model=RelationResponse,
    summary="Modifier une relation",
    description="Modifie les propriétés d'une relation (type, clés étrangères, description, etc.)."
)
async def update_relation(
    relation_id: UUID,
    data: RelationUpdate,
    current_user: User = Depends(get_current_user),
    service: SchemaService = Depends(get_schema_service),
):
    return await service.update_relation(relation_id, data)


@router.delete(
    "/relations/{relation_id}",
    status_code=204,
    summary="Supprimer une relation",
    description="Supprime le lien entre deux tables. Les tables ne sont pas supprimées, seul le lien est rompu."
)
async def delete_relation(
    relation_id: UUID,
    current_user: User = Depends(get_current_user),
    service: SchemaService = Depends(get_schema_service),
):
    await service.delete_relation(relation_id)
