from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from uuid import UUID

from app.modules.ai.models import Conversation, Message


class ConversationRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_project_id(self, project_id: UUID) -> Conversation | None:
        """Get conversation by project_id"""
        stmt = select(Conversation).where(Conversation.project_id == project_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_tracking_id(self, tracking_id: UUID) -> Conversation | None:
        """Get conversation by tracking_id with messages loaded"""
        stmt = (select(Conversation)
                .where(Conversation.tracking_id == tracking_id)
                .options(selectinload(Conversation.messages)))
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def create(self, project_id: UUID) -> Conversation:
        """Create a new conversation for a project"""
        conversation = Conversation(project_id=project_id)
        self.db.add(conversation)
        await self.db.flush()
        await self.db.refresh(conversation)
        return conversation

    async def get_or_create(self, project_id: UUID) -> Conversation:
        """Get existing conversation or create a new one"""
        conversation = await self.get_by_project_id(project_id)
        if not conversation:
            conversation = await self.create(project_id)
        
        # Load messages
        conv_with_messages = await self.get_by_tracking_id(conversation.tracking_id)
        return conv_with_messages

    async def delete_messages(self, conversation_id: UUID) -> None:
        """Delete all messages in a conversation"""
        stmt = select(Message).where(Message.conversation_id == conversation_id)
        result = await self.db.execute(stmt)
        messages = result.scalars().all()
        
        for msg in messages:
            await self.db.delete(msg)
        
        await self.db.flush()


class MessageRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, conversation_id: UUID, role: str, content: str) -> Message:
        """Create a new message"""
        message = Message(conversation_id=conversation_id, role=role, content=content)
        self.db.add(message)
        await self.db.flush()
        await self.db.refresh(message)
        return message

    async def get_by_conversation(self, conversation_id: UUID, limit: int = 50) -> list[Message]:
        """Get messages for a conversation, ordered by created_at (oldest first)"""
        stmt = (select(Message)
                .where(Message.conversation_id == conversation_id)
                .order_by(Message.created_at.asc())
                .limit(limit))
        result = await self.db.execute(stmt)
        return result.scalars().all()
