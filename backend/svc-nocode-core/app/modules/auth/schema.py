from pydantic import BaseModel, EmailStr, Field , field_validator
from typing import Optional
from uuid import UUID
from datetime import date, datetime
from app.modules.auth.models import UserRole, UserPlan
import re


class UserRegisterFree(BaseModel):
    email     : EmailStr
    name      : str = Field(..., min_length=2, max_length=100)
    surname   : str = Field(..., min_length=2, max_length=100)
    birth_place : Optional[str] = Field(None, max_length=150)
    birth_date  : Optional[date] = None
    country   : Optional[str] = None
    phone     : Optional[str] = Field(
                    default=None,
                    pattern=r"^\+?[\d\s\-]{8,20}$"   # accepte formats internationaux
                )
    password: str = Field(..., min_length=8)

    @field_validator("password")   # ← ajoute ça
    @classmethod
    def password_strength(cls, v):
        return validate_password(v)



class UserRegisterEnterprise(BaseModel):
    email        : EmailStr
    name         : str = Field(..., min_length=2, max_length=100)
    surname      : str = Field(..., min_length=2, max_length=100)
    birth_place  : Optional[str] = Field(None, max_length=150)
    birth_date   : Optional[date] = None
    country      : Optional[str] = None
    phone        : Optional[str] = Field(
                       default=None,
                       pattern=r"^\+?[\d\s\-]{8,20}$"
                   )
    password: str = Field(..., min_length=8)

    company_name : str = Field(..., min_length=2, max_length=200)
    company_size : str = Field(..., pattern=r"^(1-10|11-50|51-200|200\+)$")

    @field_validator("password")   # ← ajoute ça
    @classmethod
    def password_strength(cls, v):
        return validate_password(v)

class AdminCreate(BaseModel):
    """Création d'un admin (réservé à un super admin)."""
    email    : EmailStr
    name     : str = Field(..., min_length=2, max_length=100)
    surname  : str = Field(..., min_length=2, max_length=100)
    password: str = Field(..., min_length=8)

    @field_validator("password")   # ← ajoute ça
    @classmethod
    def password_strength(cls, v):
        return validate_password(v)

class UserLogin(BaseModel):
    email    : EmailStr
    password : str
    




class UserResponse(BaseModel):
    tracking_id  : UUID       
    email        : str
    name         : str
    surname      : str
    birth_place  : Optional[str]
    birth_date   : Optional[date]
    country      : Optional[str]
    phone        : Optional[str]
    role         : UserRole
    plan         : Optional[UserPlan]
    company_name : Optional[str]
    is_active    : bool
    is_verified  : bool
    created_at   : datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token  : str
    refresh_token : str
    token_type    : str = "bearer"


class RefreshTokenRequest(BaseModel):
    refresh_token : str


def validate_password(value: str) -> str:
    """
    Vérifie que le mot de passe contient :
    - au moins une lettre
    - au moins un chiffre
    - au moins un caractère spécial (@$!%*?&#._-)
    """
    if not re.search(r"[A-Za-z]", value):
        raise ValueError("Le mot de passe doit contenir au moins une lettre.")
    if not re.search(r"\d", value):
        raise ValueError("Le mot de passe doit contenir au moins un chiffre.")
    if not re.search(r"[@$!%*?&#._-]", value):
        raise ValueError("Le mot de passe doit contenir au moins un caractère spécial (@$!%*?&#._-).")
    return value