import base64
import json
import hmac
import hashlib
import time
from werkzeug.security import generate_password_hash, check_password_hash
from config import Config

def hash_password(password: str) -> str:
    return generate_password_hash(password)

def verify_password(password: str, hashed_password: str) -> bool:
    return check_password_hash(hashed_password, password)

def _b64_encode(data_dict: dict) -> str:
    json_str = json.dumps(data_dict, separators=(',', ':'))
    return base64.urlsafe_b64encode(json_str.encode('utf-8')).decode('utf-8').rstrip('=')

def _b64_decode(encoded_str: str) -> dict:
    padded = encoded_str + '=' * (-len(encoded_str) % 4)
    json_bytes = base64.urlsafe_b64decode(padded.encode('utf-8'))
    return json.loads(json_bytes.decode('utf-8'))

def generate_token(user_id: str, email: str, expires_in: int = 86400) -> str:
    header = {'alg': 'HS256', 'typ': 'JWT'}
    payload = {
        'sub': user_id,
        'email': email,
        'iat': int(time.time()),
        'exp': int(time.time()) + expires_in
    }

    header_b64 = _b64_encode(header)
    payload_b64 = _b64_encode(payload)
    
    signature_base = f"{header_b64}.{payload_b64}"
    signature = hmac.new(
        Config.SECRET_KEY.encode('utf-8'),
        signature_base.encode('utf-8'),
        hashlib.sha256
    ).digest()
    signature_b64 = base64.urlsafe_b64encode(signature).decode('utf-8').rstrip('=')

    return f"{signature_base}.{signature_b64}"

def verify_token(token: str) -> dict:
    try:
        parts = token.split('.')
        if len(parts) != 3:
            return None
        
        header_b64, payload_b64, signature_b64 = parts
        signature_base = f"{header_b64}.{payload_b64}"
        
        expected_sig = hmac.new(
            Config.SECRET_KEY.encode('utf-8'),
            signature_base.encode('utf-8'),
            hashlib.sha256
        ).digest()
        expected_sig_b64 = base64.urlsafe_b64encode(expected_sig).decode('utf-8').rstrip('=')

        if not hmac.compare_digest(signature_b64, expected_sig_b64):
            return None

        payload = _b64_decode(payload_b64)
        if payload.get('exp', 0) < time.time():
            return None

        return payload
    except Exception:
        return None
