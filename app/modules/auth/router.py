from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.core.database import get_db
from app.core.security import decode_token, oauth2_scheme
from app.modules.auth.schema import (
    UserRegisterFree,
    UserRegisterEnterprise,
    AdminCreate,
    UserLogin,
    UserResponse,
    TokenResponse,
    RefreshTokenRequest,
)
from app.modules.auth.service import AuthService
from app.modules.auth.repository import AuthRepository
from app.modules.auth.models import User

router = APIRouter(
    prefix="/auth",
    tags=[" Authentification"],
)


def get_auth_service(db: AsyncSession = Depends(get_db)) -> AuthService:
    return AuthService(AuthRepository(db))


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    payload = decode_token(token)
    tracking_id = UUID(payload["sub"])
    repo = AuthRepository(db)
    user = await repo.get_by_tracking_id(tracking_id)

    if not user:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Utilisateur introuvable."
        )
    return user


@router.post(
    "/register/free",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Inscription compte gratuit",
    description="""
Crée un nouveau compte utilisateur avec le plan **gratuit**.

**Règles du mot de passe :**
- 8 caractères minimum
- Au moins une lettre
- Au moins un chiffre
- Au moins un caractère spécial (@$!%*?&)

**Exemple :** `MonApp2024!`
    """,
)
async def register_free(
    data: UserRegisterFree,
    service: AuthService = Depends(get_auth_service),
):
    return await service.register_free(data)


@router.post(
    "/register/enterprise",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Inscription compte entreprise",
    description="""
Crée un nouveau compte utilisateur avec le plan **entreprise**.

Nécessite en plus du compte gratuit :
- Le nom de l'entreprise
- La taille de l'entreprise : `1-10`, `11-50`, `51-200`, `200+`
    """,
)
async def register_enterprise(
    data: UserRegisterEnterprise,
    service: AuthService = Depends(get_auth_service),
):
    return await service.register_enterprise(data)


@router.post(
    "/register/admin",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Création d'un administrateur",
    description="""
Crée un compte **administrateur système**.

⚠️ Endpoint sensible :
- En développement : libre d'accès pour les tests
- En production : à protéger pour les admins existants uniquement

Le mot de passe admin nécessite **12 caractères minimum**.
    """,
)
async def register_admin(
    data: AdminCreate,
    service: AuthService = Depends(get_auth_service),
):
    return await service.create_admin(data)


# ─────────────────────────────────────────────────────
# CONNEXION & TOKENS
# ─────────────────────────────────────────────────────

@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Connexion",
    description="""
Connecte un utilisateur et retourne deux tokens JWT :

- **access_token** : à envoyer dans le header `Authorization: Bearer <token>` pour chaque requête protégée. Expire après **30 minutes**.
- **refresh_token** : à utiliser sur `/auth/refresh` pour obtenir un nouveau token sans se reconnecter. Expire après **7 jours**.
    """,
)
async def login(
    data: UserLogin,
    service: AuthService = Depends(get_auth_service),
):
    return await service.login(data.email, data.password)


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Renouveler le token",
    description="""
Génère un nouvel **access_token** à partir du **refresh_token**.

À utiliser quand l'access_token est expiré (après 30 minutes)
pour éviter à l'utilisateur de se reconnecter.
    """,
)
async def refresh(
    data: RefreshTokenRequest,
    service: AuthService = Depends(get_auth_service),
):
    return await service.refresh_tokens(data.refresh_token)


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Profil de l'utilisateur connecté",
)
async def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch(
    "/users/{tracking_id}/deactivate",
    response_model=UserResponse,
    summary="Désactiver un compte",
)
async def deactivate_user(
    tracking_id: UUID,
    current_user: User = Depends(get_current_user),
    service: AuthService = Depends(get_auth_service),
):
    return await service.deactivate_user(tracking_id, current_user)


@router.patch(
    "/users/{tracking_id}/reactivate",
    response_model=UserResponse,
    summary="Réactiver un compte",
)
async def reactivate_user(
    tracking_id: UUID,
    current_user: User = Depends(get_current_user),
    service: AuthService = Depends(get_auth_service),
):
    return await service.reactivate_user(tracking_id, current_user)
