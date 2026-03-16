from fastapi import HTTPException, status
from uuid import UUID

from app.modules.auth.repository import AuthRepository
from app.modules.auth.schema import (
    UserRegisterFree,
    UserRegisterEnterprise,
    AdminCreate,
    TokenResponse,
)
from app.modules.auth.models import User
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)


class AuthService:

    def __init__(self, repo: AuthRepository):
        self.repo = repo


    async def register_free(self, data: UserRegisterFree) -> User:
        """Inscription avec un compte gratuit."""
        if await self.repo.email_exists(data.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Un compte existe déjà avec cet email."
            )
        return await self.repo.create_free_user(
            email=data.email,
            name=data.name,
            surname=data.surname,
            hashed_password=hash_password(data.password),
            birth_place=data.birth_place,
            birth_date=data.birth_date,
            country=data.country,
            phone=data.phone,
        )

    async def register_enterprise(self, data: UserRegisterEnterprise) -> User:
        """Inscription avec un compte entreprise."""
        if await self.repo.email_exists(data.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Un compte existe déjà avec cet email."
            )
        return await self.repo.create_enterprise_user(
            email=data.email,
            name=data.name,
            surname=data.surname,
            hashed_password=hash_password(data.password),
            birth_place=data.birth_place,
            birth_date=data.birth_date,
            country=data.country,
            phone=data.phone,
            company_name=data.company_name,
            company_size=data.company_size,
        )

    async def create_admin(self, data: AdminCreate) -> User:
        """Création d'un administrateur système."""
        if await self.repo.email_exists(data.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Un compte existe déjà avec cet email."
            )
        return await self.repo.create_admin(
            email=data.email,
            name=data.name,
            surname=data.surname,
            hashed_password=hash_password(data.password),
        )


    async def login(self, email: str, password: str) -> TokenResponse:
        """Connexion et génération des tokens JWT."""
        user = await self.repo.get_by_email(email)

        if not user or not verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email ou mot de passe incorrect."
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Ce compte a été désactivé. Contactez le support."
            )

        token_data = {"sub": str(user.tracking_id)}
        return TokenResponse(
            access_token=create_access_token(token_data),
            refresh_token=create_refresh_token(token_data),
        )


    async def refresh_tokens(self, refresh_token: str) -> TokenResponse:
        """Renouvelle les tokens à partir du refresh token."""
        payload = decode_token(refresh_token)

        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token invalide."
            )

        tracking_id = UUID(payload["sub"])
        user = await self.repo.get_by_tracking_id(tracking_id)

        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Utilisateur introuvable ou désactivé."
            )

        token_data = {"sub": str(user.tracking_id)}
        return TokenResponse(
            access_token=create_access_token(token_data),
            refresh_token=create_refresh_token(token_data),
        )


    async def deactivate_user(self, tracking_id: UUID, requester: User) -> User:
        """
        Désactive un compte utilisateur.

        Règles :
        - Un admin peut désactiver n'importe quel compte
        - Un utilisateur peut désactiver uniquement son propre compte
        """
        target_user = await self.repo.get_by_tracking_id(tracking_id)

        if not target_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Utilisateur introuvable."
            )

        # Vérifier les permissions
        is_admin = requester.role.value == "admin"
        is_own_account = str(requester.tracking_id) == str(tracking_id)

        if not is_admin and not is_own_account:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Vous n'avez pas la permission d'effectuer cette action."
            )

        # Empêcher un admin de se désactiver lui-même par accident
        if is_admin and is_own_account:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Un administrateur ne peut pas désactiver son propre compte."
            )

        return await self.repo.deactivate_user(tracking_id)

    async def reactivate_user(self, tracking_id: UUID, requester: User) -> User:
        """
        Réactive un compte désactivé.
        Réservé aux admins uniquement.
        """
        if requester.role.value != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Réservé aux administrateurs."
            )

        target_user = await self.repo.get_by_tracking_id(tracking_id)

        if not target_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Utilisateur introuvable."
            )

        if target_user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ce compte est déjà actif."
            )

        return await self.repo.reactivate_user(tracking_id)