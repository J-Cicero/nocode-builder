import uuid
import bcrypt
from datetime import datetime, timedelta
from jose import JWTError, jwt
from fastapi import HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer

from app.core.config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def hash_password(password: str) -> str:
    pwd_bytes = password.encode("utf-8")[:72]
    return bcrypt.hashpw(pwd_bytes, bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8")[:72], hashed.encode("utf-8"))


def _encode(data: dict, expires: timedelta, token_type: str) -> tuple[str, str]:
    jti = str(uuid.uuid4())
    payload = data.copy()
    payload.update({"exp": datetime.utcnow() + expires, "type": token_type, "jti": jti})
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return token, jti


def create_access_token(data: dict) -> str:
    token, _ = _encode(data, timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES), "access")
    return token


def create_refresh_token(data: dict) -> tuple[str, str]:
    """Returns (token, jti). Caller persists the jti so it can be revoked / rotated-out."""
    return _encode(data, timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS), "refresh")


def create_mfa_step_up_token(data: dict) -> str:
    """Short-lived token issued after password check, before MFA code is verified.
    Proves 'who' but NOT 'fully authenticated' — cannot be used as an access token
    because downstream services check type == 'access'."""
    token, _ = _encode(data, timedelta(minutes=settings.MFA_STEP_UP_TOKEN_EXPIRE_MINUTES), "mfa_pending")
    return token


def decode_token(token: str, expected_type: str | None = None) -> dict:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    if expected_type and payload.get("type") != expected_type:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Expected a {expected_type} token")
    return payload


def get_bearer_payload(token: str = Depends(oauth2_scheme)) -> dict:
    return decode_token(token, expected_type="access")
