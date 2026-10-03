from uuid import UUID
from datetime import datetime, timezone
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.users.models import User, RefreshToken


class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def email_exists(self, email: str) -> bool:
        res = await self.db.execute(select(User).where(User.email == email))
        return res.scalar_one_or_none() is not None

    async def create(self, **kwargs) -> User:
        user = User(**kwargs)
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def get_by_email(self, email: str) -> User | None:
        res = await self.db.execute(select(User).where(User.email == email))
        return res.scalar_one_or_none()

    async def get_by_id(self, user_id: UUID) -> User | None:
        res = await self.db.execute(select(User).where(User.id == user_id))
        return res.scalar_one_or_none()

    async def set_mfa_secret(self, user_id: UUID, secret: str) -> None:
        await self.db.execute(update(User).where(User.id == user_id).values(mfa_secret=secret))
        await self.db.commit()

    async def enable_mfa(self, user_id: UUID) -> None:
        await self.db.execute(update(User).where(User.id == user_id).values(mfa_enabled=True))
        await self.db.commit()

    async def anonymize(self, user_id: UUID) -> None:
        await self.db.execute(
            update(User).where(User.id == user_id)
            # NOTE: .local, .invalid, .test, .example are RFC 2606/6762
            # reserved TLDs that pydantic's EmailStr validator rejects --
            # using one here would 500 every endpoint that serializes this
            # user afterward (e.g. /auth/me), which is exactly what happened
            # until this was caught by testing the erasure flow live.
            .values(email=f"erased-{user_id}@erased.invalid-user.platform", name="Erased", surname="User", is_active=False)
        )
        await self.db.commit()

    # --- refresh token rotation / revocation ---

    async def store_refresh_token(self, jti: str, user_id: UUID, expires_at: datetime) -> None:
        self.db.add(RefreshToken(jti=jti, user_id=user_id, expires_at=expires_at))
        await self.db.commit()

    async def get_refresh_token(self, jti: str) -> RefreshToken | None:
        res = await self.db.execute(select(RefreshToken).where(RefreshToken.jti == jti))
        return res.scalar_one_or_none()

    async def rotate_refresh_token(self, old_jti: str, new_jti: str) -> None:
        await self.db.execute(
            update(RefreshToken).where(RefreshToken.jti == old_jti).values(revoked=True, replaced_by=new_jti)
        )
        await self.db.commit()

    async def revoke_all_for_user(self, user_id: UUID) -> None:
        """Used on logout-everywhere, password change, or suspected token theft."""
        await self.db.execute(
            update(RefreshToken).where(RefreshToken.user_id == user_id, RefreshToken.revoked == False)
            .values(revoked=True)
        )
        await self.db.commit()
