from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.core.database import get_db
from app.core.security import decode_token, oauth2_scheme
from app.modules.ai.service import AIService
from app.modules.ai.schemas import (
    MessageCreate,
    MessageResponse,
    ConversationResponse,
    SchemaGenerationRequest,
    SchemaGenerationResponse,
)
from app.modules.auth.repository import AuthRepository
from app.modules.auth.models import User


router = APIRouter(prefix="/ai", tags=["🤖 AI Assistant"])


def get_ai_service(db: AsyncSession = Depends(get_db)) -> AIService:
    return AIService(db)


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    from fastapi import HTTPException
    payload = decode_token(token)
    tracking_id = UUID(payload["sub"])
    repo = AuthRepository(db)
    user = await repo.get_by_tracking_id(tracking_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Utilisateur introuvable."
        )
    return user


@router.post(
    "/projects/{project_id}/chat",
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Chat with AI about a project",
    description="Send a message to the AI assistant about a specific project. "
                "The AI provides contextual help for building the application."
)
async def chat(
    project_id: UUID,
    data: MessageCreate,
    current_user: User = Depends(get_current_user),
    service: AIService = Depends(get_ai_service),
) -> MessageResponse:
    return await service.chat(project_id, data, current_user)


@router.post(
    "/projects/{project_id}/generate-schema",
    response_model=SchemaGenerationResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate schema from description",
    description="Provide a natural language description of your application, "
                "and the AI will generate a database schema with tables, fields, and relations."
)
async def generate_schema(
    project_id: UUID,
    data: SchemaGenerationRequest,
    current_user: User = Depends(get_current_user),
    service: AIService = Depends(get_ai_service),
) -> SchemaGenerationResponse:
    return await service.generate_schema(project_id, data, current_user)


@router.get(
    "/projects/{project_id}/history",
    response_model=ConversationResponse,
    status_code=status.HTTP_200_OK,
    summary="Get conversation history",
    description="Retrieve the full conversation history for a project."
)
async def get_history(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    service: AIService = Depends(get_ai_service),
) -> ConversationResponse:
    return await service.get_history(project_id)


@router.delete(
    "/projects/{project_id}/history",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    summary="Clear conversation history",
    description="Delete all messages in the conversation for a project."
)
async def clear_history(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    service: AIService = Depends(get_ai_service),
) -> dict:
    return await service.clear_history(project_id)
