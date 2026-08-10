from cryptography.fernet import Fernet, InvalidToken

from . import config

_fernet: Fernet | None = None


def _get_fernet() -> Fernet:
    global _fernet
    if _fernet is None:
        if not config.TOKEN_ENCRYPTION_KEY:
            raise RuntimeError(
                "TOKEN_ENCRYPTION_KEY is not set in backend/.env. Generate one with:\n"
                'python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"'
            )
        _fernet = Fernet(config.TOKEN_ENCRYPTION_KEY.encode())
    return _fernet


def encrypt_token(raw_token: str) -> str:
    return _get_fernet().encrypt(raw_token.encode()).decode()


def decrypt_token(encrypted_token: str) -> str:
    try:
        return _get_fernet().decrypt(encrypted_token.encode()).decode()
    except InvalidToken as exc:
        raise RuntimeError(
            "Stored GitHub token could not be decrypted (TOKEN_ENCRYPTION_KEY may have "
            "changed). Reconnect GitHub to fix this."
        ) from exc
