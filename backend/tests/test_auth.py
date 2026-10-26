from bson import ObjectId
from fastapi.testclient import TestClient

from app.api.auth import get_user_collection
from app.main import app


class FakeUsersCollection:
    def __init__(self):
        self.documents = {}

    def insert_one(self, document):
        if document["email"] in self.documents:
            from pymongo.errors import DuplicateKeyError

            raise DuplicateKeyError("duplicate email")
        document["_id"] = ObjectId()
        self.documents[document["email"]] = document
        return type("InsertResult", (), {"inserted_id": document["_id"]})()

    def find_one(self, query):
        if "email" in query:
            return self.documents.get(query["email"])
        return next(
            (document for document in self.documents.values() if document["_id"] == query["_id"]),
            None,
        )


def test_register_login_and_current_user():
    users = FakeUsersCollection()
    app.dependency_overrides[get_user_collection] = lambda: users
    try:
        with TestClient(app) as client:
            response = client.post(
                "/api/auth/register",
                json={"name": "Test User", "email": "TEST@example.com", "password": "correct-horse"},
            )
            assert response.status_code == 201
            registration = response.json()
            assert registration["user"]["email"] == "test@example.com"
            assert users.documents["test@example.com"]["password_hash"] != "correct-horse"

            duplicate = client.post(
                "/api/auth/register",
                json={"name": "Test User", "email": "test@example.com", "password": "correct-horse"},
            )
            assert duplicate.status_code == 409

            login = client.post(
                "/api/auth/login",
                json={"email": "test@example.com", "password": "correct-horse"},
            )
            assert login.status_code == 200
            token = login.json()["access_token"]

            current_user = client.get(
                "/api/auth/me", headers={"Authorization": f"Bearer {token}"}
            )
            assert current_user.status_code == 200
            assert current_user.json() == registration["user"]

            invalid_login = client.post(
                "/api/auth/login",
                json={"email": "test@example.com", "password": "incorrect-password"},
            )
            assert invalid_login.status_code == 401

            unauthorized = client.get("/api/auth/me")
            assert unauthorized.status_code == 401
    finally:
        app.dependency_overrides.pop(get_user_collection, None)


def test_register_rejects_short_password():
    users = FakeUsersCollection()
    app.dependency_overrides[get_user_collection] = lambda: users
    try:
        with TestClient(app) as client:
            response = client.post(
                "/api/auth/register",
                json={"name": "Test User", "email": "test@example.com", "password": "short"},
            )
            assert response.status_code == 422
    finally:
        app.dependency_overrides.pop(get_user_collection, None)
