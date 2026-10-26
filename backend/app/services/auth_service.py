import base64
import hashlib
import hmac
import json
import os
import secrets
import time
from functools import lru_cache
from typing import Any

from pymongo import MongoClient


MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "segmentiq")
TOKEN_SECRET = os.getenv("SECRET_KEY") or secrets.token_urlsafe(48)
TOKEN_LIFETIME_SECONDS = 60 * 60 * 24


@lru_cache(maxsize=1)
def get_users_collection():
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=3000)
    client.admin.command("ping")
    collection = client[MONGO_DB_NAME]["users"]
    collection.create_index("email", unique=True)
    return collection


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    derived_key = hashlib.scrypt(password.encode("utf-8"), salt=salt, n=2**14, r=8, p=1)
    return "scrypt${}${}${}".format(
        2**14,
        base64.urlsafe_b64encode(salt).decode("ascii"),
        base64.urlsafe_b64encode(derived_key).decode("ascii"),
    )


def verify_password(password: str, encoded_hash: str) -> bool:
    try:
        algorithm, work_factor, encoded_salt, encoded_key = encoded_hash.split("$")
        if algorithm != "scrypt":
            return False
        salt = base64.urlsafe_b64decode(encoded_salt.encode("ascii"))
        expected_key = base64.urlsafe_b64decode(encoded_key.encode("ascii"))
        actual_key = hashlib.scrypt(
            password.encode("utf-8"),
            salt=salt,
            n=int(work_factor),
            r=8,
            p=1,
            dklen=len(expected_key),
        )
        return hmac.compare_digest(actual_key, expected_key)
    except (ValueError, TypeError, UnicodeError):
        return False


def create_access_token(user_id: str) -> str:
    payload = json.dumps(
        {"sub": user_id, "exp": int(time.time()) + TOKEN_LIFETIME_SECONDS},
        separators=(",", ":"),
    ).encode("utf-8")
    encoded_payload = base64.urlsafe_b64encode(payload).decode("ascii").rstrip("=")
    signature = hmac.new(
        TOKEN_SECRET.encode("utf-8"), encoded_payload.encode("ascii"), hashlib.sha256
    ).digest()
    encoded_signature = base64.urlsafe_b64encode(signature).decode("ascii").rstrip("=")
    return f"{encoded_payload}.{encoded_signature}"


def read_access_token(token: str) -> str | None:
    try:
        encoded_payload, encoded_signature = token.split(".")
        expected_signature = hmac.new(
            TOKEN_SECRET.encode("utf-8"), encoded_payload.encode("ascii"), hashlib.sha256
        ).digest()
        supplied_signature = base64.urlsafe_b64decode(
            (encoded_signature + "=" * (-len(encoded_signature) % 4)).encode("ascii")
        )
        if not hmac.compare_digest(supplied_signature, expected_signature):
            return None
        payload_bytes = base64.urlsafe_b64decode(
            (encoded_payload + "=" * (-len(encoded_payload) % 4)).encode("ascii")
        )
        payload: Any = json.loads(payload_bytes.decode("utf-8"))
        user_id = payload.get("sub")
        if not isinstance(user_id, str) or payload.get("exp", 0) <= int(time.time()):
            return None
        return user_id
    except (ValueError, TypeError, UnicodeError, json.JSONDecodeError):
        return None
