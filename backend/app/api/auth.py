from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pymongo.errors import DuplicateKeyError, PyMongoError

from app.models.auth_schemas import AuthResponse, AuthUser, RegisterRequest, AuthCredentials
from app.services.auth_service import (
    create_access_token,
    get_users_collection,
    hash_password,
    read_access_token,
    verify_password,
)


router = APIRouter(prefix="/auth", tags=["authentication"])
bearer_scheme = HTTPBearer(auto_error=False)


def get_user_collection():
    try:
        return get_users_collection()
    except PyMongoError as exc:
        raise HTTPException(
            status_code=503,
            detail="MongoDB is unavailable. Confirm that the local MongoDB service is running.",
        ) from exc


def serialize_user(document: dict) -> AuthUser:
    return AuthUser(
        id=str(document["_id"]),
        name=document["name"],
        email=document["email"],
    )


@router.post("/register", response_model=AuthResponse, status_code=201)
def register(request: RegisterRequest, users=Depends(get_user_collection)):
    user = {
        "name": request.name,
        "email": request.email,
        "password_hash": hash_password(request.password),
    }
    try:
        result = users.insert_one(user)
    except DuplicateKeyError as exc:
        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists.",
        ) from exc
    except PyMongoError as exc:
        raise HTTPException(status_code=503, detail="Unable to save the account to MongoDB.") from exc

    user["_id"] = result.inserted_id
    return AuthResponse(access_token=create_access_token(str(result.inserted_id)), user=serialize_user(user))


@router.post("/login", response_model=AuthResponse)
def login(request: AuthCredentials, users=Depends(get_user_collection)):
    try:
        user = users.find_one({"email": request.email})
    except PyMongoError as exc:
        raise HTTPException(status_code=503, detail="Unable to read accounts from MongoDB.") from exc

    if not user or not verify_password(request.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Email or password is incorrect.")
    return AuthResponse(access_token=create_access_token(str(user["_id"])), user=serialize_user(user))


@router.get("/me", response_model=AuthUser)
def current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    users=Depends(get_user_collection),
):
    user_id = read_access_token(credentials.credentials) if credentials else None
    if not user_id:
        raise HTTPException(status_code=401, detail="Your session is invalid or has expired.")
    try:
        user = users.find_one({"_id": ObjectId(user_id)})
    except (ValueError, PyMongoError) as exc:
        raise HTTPException(status_code=401, detail="Your session is invalid or has expired.") from exc
    if not user:
        raise HTTPException(status_code=401, detail="Your session is invalid or has expired.")
    return serialize_user(user)
