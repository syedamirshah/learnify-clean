import base64
from Crypto.Cipher import AES
from django.core.signing import TimestampSigner, BadSignature, SignatureExpired
from django.core.signing import TimestampSigner, BadSignature, SignatureExpired

_signer = TimestampSigner(salt="payments-user-link")


def _pkcs5_pad(data: bytes, block_size: int = 16) -> bytes:
    pad_len = block_size - (len(data) % block_size)
    return data + bytes([pad_len]) * pad_len


def aes_ecb_pkcs5_base64(payload: str, key_16: str) -> str:
    """
    Easypay 'merchantHashedReq' format:
      AES/ECB/PKCS5(PAD) over the exact canonical string, then Base64.
    The key must be 16 chars (128-bit).
    """
    if not isinstance(key_16, (str, bytes)) or len(key_16) != 16:
        raise ValueError("Easypay HASH key must be exactly 16 characters long.")
    key = key_16.encode() if isinstance(key_16, str) else key_16
    data = payload.encode("utf-8")
    padded = _pkcs5_pad(data, 16)
    cipher = AES.new(key, AES.MODE_ECB)
    enc = cipher.encrypt(padded)
    return base64.b64encode(enc).decode("ascii")

def sign_uid(username: str) -> str:
    """Return a short, signed token for this username (validates later)."""
    return _signer.sign(username)

def unsign_uid(token: str, max_age_seconds: int = 86400) -> str | None:
    """Validate token and return username or None if invalid/expired."""
    try:
        return _signer.unsign(token, max_age=max_age_seconds)
    except (BadSignature, SignatureExpired):
        return None