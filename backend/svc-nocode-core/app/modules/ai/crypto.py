"""Chiffrement des clés API des fournisseurs d'IA stockées en base.

La clé de chiffrement vient de AI_KEYS_ENCRYPTION_KEY (à fournir via l'environnement
ou un coffre à secrets). En développement, si elle est absente, une clé est dérivée
de SECRET_KEY : pratique en local, mais en production il faut une clé dédiée,
sinon changer SECRET_KEY rendrait les clés stockées illisibles.
"""
import base64
import hashlib
import logging

from cryptography.fernet import Fernet, InvalidToken

from app.core.config import settings

logger = logging.getLogger(__name__)


def _fernet() -> Fernet:
    if settings.AI_KEYS_ENCRYPTION_KEY:
        return Fernet(settings.AI_KEYS_ENCRYPTION_KEY.encode())
    if settings.ENVIRONMENT != "development":
        logger.warning("AI_KEYS_ENCRYPTION_KEY absente hors développement : clé dérivée de SECRET_KEY.")
    derived = base64.urlsafe_b64encode(hashlib.sha256(settings.SECRET_KEY.encode()).digest())
    return Fernet(derived)


def encrypt_secret(plain: str) -> str:
    return _fernet().encrypt(plain.encode()).decode()


def decrypt_secret(token: str) -> str:
    try:
        return _fernet().decrypt(token.encode()).decode()
    except InvalidToken:
        raise ValueError("Clé API illisible : la clé de chiffrement a changé. Ressaisissez la clé du fournisseur.")


def key_hint(plain: str) -> str:
    """Indice affichable (jamais la clé complète)."""
    return "••••" + plain[-4:] if len(plain) >= 8 else "••••"
