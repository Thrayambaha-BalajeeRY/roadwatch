from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

SECRET_KEY = "roadwatch-iitm-hackathon-2026"
ALGORITHM = "HS256"
TOKEN_HOURS = 24

pwd_context = CryptContext(schemes=["bcrypt"])
client = MongoClient(os.getenv("MONGODB_URI"))
db = client["roadwatch"]
users_col = db["users"]


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str,
                    hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = (
        datetime.utcnow() +
        timedelta(hours=TOKEN_HOURS)
    )
    return jwt.encode(
        payload, SECRET_KEY,
        algorithm=ALGORITHM
    )


def verify_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(
            token, SECRET_KEY,
            algorithms=[ALGORITHM]
        )
    except JWTError:
        return None


def get_current_user(
        token: str) -> Optional[dict]:
    if not token:
        return None
    payload = verify_token(token)
    if not payload:
        return None
    return {
        "email": payload.get("email"),
        "name": payload.get("name"),
        "role": payload.get("role", "citizen")
    }


def register_user(name: str,
                  email: str,
                  password: str,
                  role: str = "citizen") -> dict:
    if users_col.find_one({"email": email}):
        return {
            "success": False,
            "message": "Email already registered"
        }
    users_col.insert_one({
        "name": name,
        "email": email,
        "password": hash_password(password),
        "role": role,
        "created_at": datetime.now().isoformat(),
        "is_active": True
    })
    return {
        "success": True,
        "message": "Registered successfully",
        "name": name,
        "email": email
    }


def login_user(email: str,
               password: str) -> dict:
    user = users_col.find_one({"email": email})
    if not user:
        return {
            "success": False,
            "message": "Email not found"
        }
    if not verify_password(
            password, user["password"]):
        return {
            "success": False,
            "message": "Wrong password"
        }
    if not user.get("is_active", True):
        return {
            "success": False,
            "message": "Account suspended"
        }
    users_col.update_one(
        {"email": email},
        {"$set": {
            "last_login": datetime.now().isoformat()
        }}
    )
    token = create_token({
        "email": email,
        "name": user["name"],
        "role": user.get("role", "citizen")
    })
    return {
        "success": True,
        "message": "Login successful",
        "token": token,
        "name": user["name"],
        "role": user.get("role", "citizen")
    }


def seed_admin():
    if not users_col.find_one(
            {"email": "admin@roadwatch.gov.in"}):
        register_user(
            "RoadWatch Admin",
            "admin@roadwatch.gov.in",
            "Admin@2026",
            "admin"
        )
        print("Admin created")
        print("Email: admin@roadwatch.gov.in")
        print("Pass : Admin@2026")


if __name__ == "__main__":
    print("=== Testing Auth ===\n")
    seed_admin()

    r = register_user(
        "Priya Sharma",
        "priya@test.com",
        "Test@1234"
    )
    print(f"Register: {r['message']}")

    l = login_user("priya@test.com", "Test@1234")
    print(f"Login: {l['message']}")
    if l["success"]:
        print(f"Token: {l['token'][:50]}...")

    w = login_user("priya@test.com", "wrong")
    print(f"Wrong pass: {w['message']}")