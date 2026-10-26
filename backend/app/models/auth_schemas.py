import re

from pydantic import BaseModel, Field, field_validator


class AuthCredentials(BaseModel):
    email: str
    password: str = Field(min_length=8, max_length=1024)

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, value: object) -> str:
        if not isinstance(value, str):
            raise ValueError("Enter a valid email address.")
        normalized = value.strip().lower()
        if len(normalized) > 254 or not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", normalized):
            raise ValueError("Enter a valid email address.")
        return normalized


class RegisterRequest(AuthCredentials):
    name: str = Field(min_length=2, max_length=60)

    @field_validator("name", mode="before")
    @classmethod
    def normalize_name(cls, value: object) -> str:
        if not isinstance(value, str):
            raise ValueError("Name must be between 2 and 60 characters.")
        normalized = value.strip()
        if not 2 <= len(normalized) <= 60:
            raise ValueError("Name must be between 2 and 60 characters.")
        return normalized


class AuthUser(BaseModel):
    id: str
    name: str
    email: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: AuthUser
