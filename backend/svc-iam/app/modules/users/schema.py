import re
from uuid import UUID
from pydantic import BaseModel, EmailStr, field_validator
from app.modules.users.models import UserRole

PASSWORD_RE = re.compile(r"^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$")


class UserRegister(BaseModel):
    email: EmailStr
    name: str
    surname: str
    password: str
    tenant_id: UUID | None = None
    preferred_locale: str = "en"

    @field_validator("password")
    @classmethod
    def strong_password(cls, v: str) -> str:
        if not PASSWORD_RE.match(v):
            raise ValueError("Password needs 8+ chars, a letter, a digit, and a special character (@$!%*?&)")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: UUID
    email: EmailStr
    name: str
    surname: str
    role: UserRole
    tenant_id: UUID | None
    preferred_locale: str
    mfa_enabled: bool
    is_active: bool
    is_verified: bool

    class Config:
        from_attributes = True


class LoginResult(BaseModel):
    """Either a full token pair (MFA off / already stepped-up) or a
    mfa_required flag with a short-lived step-up token the client must
    pass to /mfa/verify along with the TOTP code."""
    mfa_required: bool
    access_token: str | None = None
    refresh_token: str | None = None
    mfa_step_up_token: str | None = None
    token_type: str = "bearer"


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str
