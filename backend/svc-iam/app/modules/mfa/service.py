import pyotp
import qrcode
import io
import base64
from app.core.config import settings


class MFAService:
    """TOTP-based MFA (RFC 6238) — compatible with Google Authenticator, Authy, etc.
    WebAuthn/FIDO2 (security keys) is the natural Phase-1.5 addition once this
    is live; TOTP alone is what closes the 'no 2FA visible' gap fastest."""

    @staticmethod
    def generate_secret() -> str:
        return pyotp.random_base32()

    @staticmethod
    def provisioning_qr_code_b64(email: str, secret: str) -> str:
        uri = pyotp.totp.TOTP(secret).provisioning_uri(name=email, issuer_name=settings.MFA_ISSUER_NAME)
        img = qrcode.make(uri)
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        return base64.b64encode(buf.getvalue()).decode()

    @staticmethod
    def verify_code(secret: str, code: str) -> bool:
        return pyotp.TOTP(secret).verify(code, valid_window=1)  # ±30s clock drift tolerance
