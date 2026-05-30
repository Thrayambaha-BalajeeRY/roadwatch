from fastapi import (FastAPI, UploadFile,
                     File, Header, Request)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pymongo import MongoClient
from dotenv import load_dotenv
from datetime import datetime
import requests as req
import os
import sys

sys.path.insert(0, os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))
))

from security.Auth import (
    login_user, register_user,
    get_current_user, seed_admin
)
from security.ratelimit import check_limit
from security.validator import (
    validate_text, validate_image,
    validate_complaint, validate_email,
    validate_password
)
from security.hasher import (
    hash_complaint, hash_image, make_ref
)

load_dotenv()

app = FastAPI(title="RoadWatch Secure API v2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

client = MongoClient(os.getenv("MONGODB_URI"))
db = client["roadwatch"]

AI_URL = os.getenv(
    "AI_API_URL",
    "http://127.0.0.1:8000"
)


@app.on_event("startup")
def startup():
    seed_admin()
    print(f"Secure API started on port 8001")
    print(f"Connected to AI API: {AI_URL}")


# ══════════════════════════════
# PUBLIC ENDPOINTS
# ══════════════════════════════

@app.get("/")
def root():
    return {
        "status": "RoadWatch Secure API",
        "version": "2.0",
        "port": 8001,
        "security_layers": [
            "JWT Authentication",
            "Rate Limiting",
            "Input Validation",
            "SHA-256 Hashing",
            "Image Verification"
        ]
    }


@app.get("/roads")
def get_roads():
    return list(db.roads.find({}, {"_id": 0}))


@app.get("/roads/worst")
def get_worst():
    return list(
        db.roads.find(
            {}, {"_id": 0}
        ).sort("score", 1).limit(5)
    )


@app.get("/roads/budget-issues")
def get_budget():
    flagged = []
    for r in db.roads.find({}, {"_id": 0}):
        s = r.get("sanctioned_cr", 0)
        sp = r.get("spent_cr", 0)
        if s > 0:
            pct = (sp / s) * 100
            if pct < 80 and r.get("score", 100) < 60:
                r["percent_spent"] = round(pct, 1)
                r["unspent_cr"] = round(s - sp, 2)
                flagged.append(r)
    return flagged


@app.get("/roads/{name}")
def get_road(name: str):
    r = db.roads.find_one(
        {"name": {"$regex": name,
                  "$options": "i"}},
        {"_id": 0}
    )
    return r if r else {"error": "Not found"}


# ══════════════════════════════
# AUTH ENDPOINTS
# ══════════════════════════════

@app.post("/register")
async def register(
        request: Request,
        data: dict):
    ip = request.client.host

    limit = check_limit(ip, "register")
    if not limit["allowed"]:
        return JSONResponse(
            status_code=429,
            content={"error": limit["message"]}
        )

    for fn, val in [
        (validate_email, data.get("email", "")),
        (validate_password, data.get("password", "")),
        (validate_text, data.get("name", ""))
    ]:
        result = fn(val)
        if not result["valid"]:
            return JSONResponse(
                status_code=400,
                content={"error": result["message"]}
            )

    return register_user(
        data.get("name"),
        data.get("email"),
        data.get("password")
    )


@app.post("/login")
async def login(
        request: Request,
        data: dict):
    ip = request.client.host

    limit = check_limit(ip, "login")
    if not limit["allowed"]:
        return JSONResponse(
            status_code=429,
            content={"error": limit["message"]}
        )

    return login_user(
        data.get("email", ""),
        data.get("password", "")
    )


# ══════════════════════════════
# CHAT — RATE LIMITED
# ══════════════════════════════

@app.post("/chat")
async def chat(
        request: Request,
        data: dict,
        authorization: str = Header(None)):
    ip = request.client.host

    # Rate limit
    limit = check_limit(ip, "chat")
    if not limit["allowed"]:
        return JSONResponse(
            status_code=429,
            content={"error": limit["message"]}
        )

    # Validate message
    msg = data.get("message", "")
    check = validate_text(msg)
    if not check["valid"]:
        return JSONResponse(
            status_code=400,
            content={"error": check["message"]}
        )

    # Forward to AI API
    try:
        response = req.post(
            f"{AI_URL}/chat",
            json={
                "message": msg,
                "history": data.get("history", [])
            },
            timeout=30
        )
        return response.json()
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={"error": f"AI error: {e}"}
        )


# ══════════════════════════════
# DETECT — SECURED
# ══════════════════════════════

@app.post("/detect")
async def detect(
        request: Request,
        file: UploadFile = File(...),
        authorization: str = Header(None)):
    ip = request.client.host

    # Rate limit
    limit = check_limit(ip, "detect")
    if not limit["allowed"]:
        return JSONResponse(
            status_code=429,
            content={"error": limit["message"]}
        )

    # Read and validate file
    file_bytes = await file.read()
    check = validate_image(
        file_bytes,
        file.filename,
        file.content_type
    )
    if not check["valid"]:
        return JSONResponse(
            status_code=400,
            content={"error": check["message"]}
        )

    # Hash image for integrity
    img_hash = hash_image(file_bytes)

    # Forward to AI API
    try:
        response = req.post(
            f"{AI_URL}/detect",
            files={"file": (
                file.filename,
                file_bytes,
                file.content_type
            )},
            timeout=60
        )
        result = response.json()
        result["image_hash"] = img_hash
        result["verified"] = True
        return result
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={"error": f"Detection error: {e}"}
        )


# ══════════════════════════════
# COMPLAINT — LOGIN REQUIRED
# ══════════════════════════════

@app.post("/complaint")
async def complaint(
        request: Request,
        data: dict,
        authorization: str = Header(None)):
    ip = request.client.host

    # Check login
    token = (
        authorization.replace("Bearer ", "")
        if authorization else None
    )
    user = get_current_user(token)
    if not user:
        return JSONResponse(
            status_code=401,
            content={
                "error": "Login required to file complaint"
            }
        )

    # Rate limit
    limit = check_limit(ip, "complaint")
    if not limit["allowed"]:
        return JSONResponse(
            status_code=429,
            content={"error": limit["message"]}
        )

    # Validate complaint data
    check = validate_complaint(data)
    if not check["valid"]:
        return JSONResponse(
            status_code=400,
            content={"error": check["message"]}
        )

    # Find road in MongoDB
    road = db.roads.find_one(
        {"name": {
            "$regex": data.get("road_name", ""),
            "$options": "i"
        }},
        {"_id": 0}
    )
    if not road:
        return JSONResponse(
            status_code=404,
            content={"error": "Road not found"}
        )

    # Create complaint with hash
    timestamp = datetime.now().isoformat()
    c_hash = hash_complaint({
        "road_name": road["name"],
        "defect": data.get("defect"),
        "severity": data.get("severity"),
        "created_at": timestamp
    })
    ref = make_ref(road["name"], timestamp)

    record = {
        "reference": ref,
        "road_name": road["name"],
        "city": road.get("city", ""),
        "defect_description": data.get("defect"),
        "severity": data.get("severity"),
        "filed_by_email": user["email"],
        "filed_by_name": user["name"],
        "routed_to": road.get("officer_name"),
        "authority": road.get("authority"),
        "phone": road.get("office_phone"),
        "officer_email": road.get("office_email"),
        "integrity_hash": c_hash,
        "status": "Submitted",
        "created_at": timestamp
    }

    db.complaints.insert_one(record)
    record.pop("_id", None)

    return {
        "success": True,
        "reference": ref,
        "message": f"Complaint filed. Ref: {ref}",
        "routed_to": road.get("officer_name"),
        "authority": road.get("authority"),
        "phone": road.get("office_phone"),
        "integrity_hash": c_hash
    }


# ══════════════════════════════
# ADMIN ENDPOINTS
# ══════════════════════════════

@app.get("/complaints")
async def all_complaints(
        authorization: str = Header(None)):
    token = (
        authorization.replace("Bearer ", "")
        if authorization else None
    )
    user = get_current_user(token)
    if not user or user.get("role") != "admin":
        return JSONResponse(
            status_code=403,
            content={"error": "Admin access only"}
        )
    return list(
        db.complaints.find({}, {"_id": 0})
    )


@app.get("/my-complaints")
async def my_complaints(
        authorization: str = Header(None)):
    token = (
        authorization.replace("Bearer ", "")
        if authorization else None
    )
    user = get_current_user(token)
    if not user:
        return JSONResponse(
            status_code=401,
            content={"error": "Login required"}
        )
    return list(db.complaints.find(
        {"filed_by_email": user["email"]},
        {"_id": 0}
    ))


@app.get("/security-stats")
async def security_stats(
        authorization: str = Header(None)):
    token = (
        authorization.replace("Bearer ", "")
        if authorization else None
    )
    user = get_current_user(token)
    if not user or user.get("role") != "admin":
        return JSONResponse(
            status_code=403,
            content={"error": "Admin only"}
        )
    return {
        "total_users": (
            db.users.count_documents({})
        ),
        "total_complaints": (
            db.complaints.count_documents({})
        ),
        "total_detections": (
            db.detections.count_documents({})
        ),
        "security_layers": [
            "JWT Auth — Active",
            "Rate Limiting — Active",
            "Input Validation — Active",
            "SHA-256 Hashing — Active",
            "Image Verification — Active"
        ]
    }