from uuid import UUID
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, status

from app.modules.users.repository import UserRepository
from app.modules.users.schema import UserRegister, LoginResult, TokenResponse
from app.modules.users.models import User
from app.modules.mfa.service import MFAService
from app.core.config import settings
from app.core.security import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, create_mfa_step_up_token,
    decode_token,
)


class UserService:
    def __init__(self, repo: UserRepository):
        self.repo = repo

    async def register(self, data: UserRegister) -> User:
        if await self.repo.email_exists(data.email):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "An account already exists with this email.")
        return await self.repo.create(
            email=data.email, name=data.name, surname=data.surname,
            hashed_password=hash_password(data.password),
            tenant_id=data.tenant_id, preferred_locale=data.preferred_locale,
        )

    async def _issue_token_pair(self, user: User) -> TokenResponse:
        claims = {"sub": str(user.id), "role": user.role.value, "tenant_id": str(user.tenant_id) if user.tenant_id else None}
        access = create_access_token(claims)
        refresh, jti = create_refresh_token(claims)
        await self.repo.store_refresh_token(
            jti, user.id, datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        )
        return TokenResponse(access_token=access, refresh_token=refresh)

    async def login(self, email: str, password: str) -> LoginResult:
        user = await self.repo.get_by_email(email)
        if not user or not verify_password(password, user.hashed_password):
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect email or password.")
        if not user.is_active:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "This account has been deactivated.")

        if user.mfa_enabled:
            step_up = create_mfa_step_up_token({"sub": str(user.id)})
            return LoginResult(mfa_required=True, mfa_step_up_token=step_up)

        pair = await self._issue_token_pair(user)
        return LoginResult(mfa_required=False, access_token=pair.access_token, refresh_token=pair.refresh_token)

    async def verify_mfa_and_login(self, step_up_token: str, code: str) -> TokenResponse:
        payload = decode_token(step_up_token, expected_type="mfa_pending")
        user = await self.repo.get_by_id(UUID(payload["sub"]))
        if not user or not user.mfa_secret:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "MFA not configured for this account.")
        if not MFAService.verify_code(user.mfa_secret, code):
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid MFA code.")
        return await self._issue_token_pair(user)

    async def refresh(self, refresh_token: str) -> TokenResponse:
        """Rotation: every refresh call invalidates the old refresh token and
        issues a new one. Reuse of an already-revoked token revokes the whole
        chain for that user — the standard signal of a stolen token."""
        payload = decode_token(refresh_token, expected_type="refresh")
        user_id = UUID(payload["sub"])
        old_jti = payload["jti"]

        stored = await self.repo.get_refresh_token(old_jti)
        if not stored:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Unknown refresh token.")
        if stored.revoked:
            await self.repo.revoke_all_for_user(user_id)
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Refresh token reuse detected — all sessions revoked.")

        user = await self.repo.get_by_id(user_id)
        if not user or not user.is_active:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found or inactive.")

        claims = {"sub": str(user.id), "role": user.role.value, "tenant_id": str(user.tenant_id) if user.tenant_id else None}
        new_access = create_access_token(claims)
        new_refresh, new_jti = create_refresh_token(claims)
        await self.repo.rotate_refresh_token(old_jti, new_jti)
        await self.repo.store_refresh_token(
            new_jti, user.id, datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        )
        return TokenResponse(access_token=new_access, refresh_token=new_refresh)

    async def logout_everywhere(self, user_id: UUID) -> None:
        await self.repo.revoke_all_for_user(user_id)

    async def enroll_mfa(self, user: User) -> dict:
        secret = MFAService.generate_secret()
        await self.repo.set_mfa_secret(user.id, secret)
        qr = MFAService.provisioning_qr_code_b64(user.email, secret)
        return {"secret": secret, "qr_code_png_base64": qr}

    async def confirm_mfa(self, user: User, code: str) -> None:
        if not user.mfa_secret or not MFAService.verify_code(user.mfa_secret, code):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid code — MFA not enabled.")
        await self.repo.enable_mfa(user.id)

    async def erase_user(self, user_id: UUID) -> bool:
        user = await self.repo.get_by_id(user_id)
        if not user:
            return False
        await self.repo.anonymize(user_id)
        await self.repo.revoke_all_for_user(user_id)
        return True
