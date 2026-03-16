from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from app.modules.auth.models import User, UserRole, UserPlan


class AuthRepository:

    def __init__(self, db: AsyncSession):
        self.db = db


    async def get_by_email(self, email: str) -> User | None:
        result = await self.db.execute(
            select(User).where(User.email == email)
        )
        return result.scalar_one_or_none()

    async def get_by_tracking_id(self, tracking_id: UUID) -> User | None:
        result = await self.db.execute(
            select(User).where(User.tracking_id == tracking_id)
        )
        return result.scalar_one_or_none()

    async def email_exists(self, email: str) -> bool:
        """Vérifie si un email est déjà utilisé."""
        result = await self.db.execute(
            select(User.id).where(User.email == email)
        )
        return result.scalar_one_or_none() is not None



    async def create_free_user(
        self,
        email: str,
        name: str,
        surname: str,
        hashed_password: str,
        birth_place: str | None,
        birth_date,
        country: str | None,
        phone: str | None,
    ) -> User:
        user = User(
            email=email,
            name=name,
            surname=surname,
            hashed_password=hashed_password,
            birth_place=birth_place,
            birth_date=birth_date,
            country=country,
            phone=phone,
            role=UserRole.USER,
            plan=UserPlan.FREE,
        )
        self.db.add(user)
        await self.db.flush()        
        await self.db.refresh(user) 
        return user

    async def create_enterprise_user(
        self,
        email: str,
        name: str,
        surname: str,
        hashed_password: str,
        birth_place: str | None,
        birth_date,
        country: str | None,
        phone: str | None,
        company_name: str,
        company_size: str,
    ) -> User:
        user = User(
            email=email,
            name=name,
            surname=surname,
            hashed_password=hashed_password,
            birth_place=birth_place,
            birth_date=birth_date,
            country=country,
            phone=phone,
            role=UserRole.USER,
            plan=UserPlan.ENTERPRISE,
            company_name=company_name,
            company_size=company_size,
        )
        self.db.add(user)
        await self.db.flush()
        await self.db.refresh(user)
        return user

    async def create_admin(
        self,
        email: str,
        name: str,
        surname: str,
        hashed_password: str,
    ) -> User:
        user = User(
            email=email,
            name=name,
            surname=surname,
            hashed_password=hashed_password,
            role=UserRole.ADMIN,
            plan=None,  # un admin n'a pas de plan
        )
        self.db.add(user)
        await self.db.flush()
        await self.db.refresh(user)
        return user
    
    async def deactivate_user(self, tracking_id: UUID) -> User:
        result = await self.db.execute(
            select(User).where(User.tracking_id == tracking_id)
        )
        user = result.scalar_one_or_none()
        user.is_active = False
        await self.db.flush()
        await self.db.refresh(user)
        return user

    async def reactivate_user(self, tracking_id: UUID) -> User:
        result = await self.db.execute(
            select(User).where(User.tracking_id == tracking_id)
        )
        user = result.scalar_one_or_none()
        user.is_active = True
        await self.db.flush()
        await self.db.refresh(user)
        return user