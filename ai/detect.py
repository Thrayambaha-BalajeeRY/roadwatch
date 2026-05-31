from fastapi import FastAPI, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from ultralytics import YOLO
from datetime import datetime
import shutil, os, sys, gc

# ── Fix all import paths ──
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import detections_col, complaints_col
from chatbot import chat, file_complaint
from search import (smart_search, format_data,
                    all_roads_data, worst_roads,
                    budget_mismanagement, search_road)
from security.Auth import (
    login_user, register_user,
    get_current_user, seed_admin
)
from security.ratelimit import check_limit
from security.validator import (
    validate_text, validate_image,
    validate_complaint
)
from security.hasher import (
    hash_complaint, hash_image, make_ref
)

app = FastAPI(title="RoadWatch API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8000",
        "https://roadwatch-api-6339.onrender.com",
        "https://street-eye-dash.lovable.app",
        "*"
    ],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True
)

# ── Lazy Model Loader ──
MODEL_PATH = os.path.join(
    os.path.dirname(__file__),
    "models", "roadwatch", "weights", "best.pt"
)

_model = None  # Don't load at startup

def get_model():
    global _model
    if _model is None:
        if os.path.exists(MODEL_PATH):
            _model = YOLO(MODEL_PATH)
            print(f"Loaded trained model: {MODEL_PATH}")
        else:
            fallback = os.path.join(os.path.dirname(__file__), "yolov8s.pt")
            _model = YOLO(fallback)
            print(f"Trained model not found — using fallback: {fallback}")
    return _model

# Seed admin on startup
try:
    seed_admin()
except Exception as e:
    print(f"Admin seed skipped: {e}")


# ══════════════════════════════
# ROOT
# ══════════════════════════════

@app.get("/")
def root():
    return {
        "status": "RoadWatch API Running",
        "version": "1.0"
    }


# ══════════════════════════════
# CHAT
# ══════════════════════════════

@app.post("/chat")
async def chat_api(data: dict):
    msg = data.get("message", "")
    history = data.get("history", [])
    if not msg:
        return {"error": "Message cannot be empty"}
    reply, updated = chat(msg, history)
    return {"reply": reply, "history": updated}


# ══════════════════════════════
# DETECT
# ══════════════════════════════

@app.post("/detect")
async def detect(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(
            ('.jpg', '.jpeg', '.png', '.webp')):
        return {"error": "Only image files allowed"}

    upload_dir = os.path.join(os.path.dirname(__file__), "uploads")
    os.makedirs(upload_dir, exist_ok=True)
    path = os.path.join(upload_dir, file.filename)

    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # ✅ Load model only when first request comes in
    results = get_model()(path)

    defects = []
    for result in results:
        for box in result.boxes:
            conf = float(box.conf[0])
            defects.append({
                "type": "Pothole" if conf > 0.5 else "Road Defect",
                "confidence_pct": round(conf * 100, 1),
                "severity": (
                    "Critical" if conf > 0.7
                    else "Moderate" if conf > 0.4
                    else "Minor"
                ),
                "bbox": box.xyxy[0].tolist()
            })

    record = {
        "filename": file.filename,
        "defects": defects,
        "total": len(defects),
        "timestamp": datetime.now().isoformat()
    }
    detections_col.insert_one(record)

    if os.path.exists(path):
        os.remove(path)

    # ✅ Free memory after inference
    gc.collect()

    if defects:
        severities = [d['severity'] for d in defects]
        worst = (
            "Critical" if "Critical" in severities
            else "Moderate" if "Moderate" in severities
            else "Minor"
        )
        message = f"Found {len(defects)} defect(s) — most severe: {worst}"
    else:
        message = "No defects detected"

    return {
        "defects": defects,
        "total_found": len(defects),
        "message": message
    }


# ══════════════════════════════
# ROADS
# ══════════════════════════════

@app.get("/roads")
def get_roads():
    return all_roads_data()


@app.get("/roads/worst")
def get_worst():
    return worst_roads()


@app.get("/roads/budget-issues")
def get_budget():
    return budget_mismanagement()


@app.get("/roads/{name}")
def get_road(name: str):
    r = search_road(name)
    return r if r else {"error": "Road not found"}


# ══════════════════════════════
# COMPLAINTS
# ══════════════════════════════

@app.get("/complaints")
def get_complaints():
    return list(complaints_col.find({}, {"_id": 0}))


@app.post("/complaint")
def create_complaint(data: dict):
    road_name = data.get("road_name", "")
    defect = data.get("defect", "")
    severity = data.get("severity", "Moderate")

    if not road_name:
        return {"error": "Road name required"}
    if not defect:
        return {"error": "Defect description required"}
    if severity not in ["Minor", "Moderate", "Critical"]:
        return {"error": "Severity must be Minor Moderate or Critical"}

    c = file_complaint(road_name, defect, severity)
    return c if c else {"error": "Road not found"}


# ══════════════════════════════
# AUTH
# ══════════════════════════════

@app.post("/register")
async def register(request: Request, data: dict):
    ip = request.client.host
    limit = check_limit(ip, "register")
    if not limit["allowed"]:
        return JSONResponse(
            status_code=429,
            content={"error": limit["message"]}
        )
    return register_user(
        data.get("name"),
        data.get("email"),
        data.get("password")
    )


@app.post("/login")
async def login(request: Request, data: dict):
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


@app.get("/my-complaints")
async def my_complaints(request: Request):
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    user = get_current_user(token)
    if not user:
        return JSONResponse(status_code=401, content={"error": "Unauthorized"})
    return list(complaints_col.find(
        {"filed_by": user["email"]}, {"_id": 0}
    ))
