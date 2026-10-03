from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_bearer_payload
from app.core.service_auth import require_service_token
from app.modules.users.schema import (
    UserRegister, UserLogin, UserResponse, LoginResult, TokenResponse, RefreshRequest,
)
from app.modules.users.service import UserService
from app.modules.users.repository import UserRepository

router = APIRouter(prefix="/auth", tags=["Identity"])


def get_service(db: AsyncSession = Depends(get_db)) -> UserService:
    return UserService(UserRepository(db))


async def get_current_user(payload: dict = Depends(get_bearer_payload), db: AsyncSession = Depends(get_db)):
    from uuid import UUID
    repo = UserRepository(db)
    user = await repo.get_by_id(UUID(payload["sub"]))
    if not user:
        from fastapi import HTTPException
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found.")
    return user


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(data: UserRegister, svc: UserService = Depends(get_service)):
    return await svc.register(data)


@router.post("/login", response_model=LoginResult)
async def login(data: UserLogin, svc: UserService = Depends(get_service)):
    """Returns either full tokens, or mfa_required=true + a step-up token
    the client must POST to /auth/mfa/verify with the 6-digit code."""
    return await svc.login(data.email, data.password)


@router.post("/mfa/verify", response_model=TokenResponse)
async def verify_mfa(step_up_token: str, code: str, svc: UserService = Depends(get_service)):
    return await svc.verify_mfa_and_login(step_up_token, code)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(data: RefreshRequest, svc: UserService = Depends(get_service)):
    return await svc.refresh(data.refresh_token)


@router.post("/logout-everywhere", status_code=status.HTTP_204_NO_CONTENT)
async def logout_everywhere(user=Depends(get_current_user), svc: UserService = Depends(get_service)):
    await svc.logout_everywhere(user.id)


@router.get("/me", response_model=UserResponse)
async def me(user=Depends(get_current_user)):
    return user


@router.post("/mfa/enroll")
async def enroll_mfa(user=Depends(get_current_user), svc: UserService = Depends(get_service)):
    """Step 1: returns a TOTP secret + QR code. Account is NOT protected yet
    until /mfa/confirm succeeds — avoids locking users out on a typo'd setup."""
    return await svc.enroll_mfa(user)


@router.post("/mfa/confirm", status_code=status.HTTP_204_NO_CONTENT)
async def confirm_mfa(code: str, user=Depends(get_current_user), svc: UserService = Depends(get_service)):
    await svc.confirm_mfa(user, code)


@router.post("/internal/erase-user/{user_id}", status_code=status.HTTP_200_OK)
async def erase_user(
    user_id: str,
    caller: str = Depends(require_service_token("svc-consent-dsar")),
    svc: UserService = Depends(get_service),
):
    """Fulfills a GDPR erasure DSAR: anonymizes the identity record (email,
    name become non-identifying placeholders) and deactivates + revokes every
    session -- rather than deleting the row outright, since other services
    (billing invoices, audit log once it exists) may still reference this
    user_id and a hard delete would break those foreign references. This is
    the standard "pseudonymize, don't delete the primary key" pattern for
    GDPR erasure in a system with cross-service references.

    Only callable by svc-consent-dsar's orchestration -- see that service's
    DSAR resolution endpoint, which is what a real erasure request goes
    through end to end."""
    from uuid import UUID as _UUID
    erased = await svc.erase_user(_UUID(user_id))
    return {"erased": erased}
