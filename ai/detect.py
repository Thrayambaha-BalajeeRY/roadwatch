from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
from database import detections_col
from chatbot import chat, file_complaint
from search import (smart_search, format_data,
                    all_roads_data, worst_roads,
                    budget_mismanagement)
from datetime import datetime
import shutil, os

app = FastAPI(title="RoadWatch API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

# ── Load Trained Model ──
MODEL_PATH = "models/roadwatch/weights/best.pt"

if os.path.exists(MODEL_PATH):
    model = YOLO(MODEL_PATH)
    print(f"Loaded trained model: {MODEL_PATH}")
else:
    model = YOLO("yolov8n.pt")
    print("Trained model not found — using base model")


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
    return {
        "reply": reply,
        "history": updated
    }


# ══════════════════════════════
# DETECT
# ══════════════════════════════

@app.post("/detect")
async def detect(file: UploadFile = File(...)):

    # Validate file type
    if not file.filename.lower().endswith(
            ('.jpg', '.jpeg', '.png', '.webp')):
        return {"error": "Only image files allowed"}

    # Create uploads folder
    os.makedirs("uploads", exist_ok=True)
    path = f"uploads/{file.filename}"

    # Save file
    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # Run detection
    results = model(path)

    defects = []
    for result in results:
        for box in result.boxes:
            conf = float(box.conf[0])
            defects.append({
                "type": (
                    "Pothole"
                    if conf > 0.5
                    else "Road Defect"
                ),
                "confidence_pct": round(conf * 100, 1),
                "severity": (
                    "Critical" if conf > 0.7
                    else "Moderate" if conf > 0.4
                    else "Minor"
                ),
                "bbox": box.xyxy[0].tolist()
            })

    # Save to MongoDB
    record = {
        "filename": file.filename,
        "defects": defects,
        "total": len(defects),
        "timestamp": datetime.now().isoformat()
    }
    detections_col.insert_one(record)

    # Delete temp file
    if os.path.exists(path):
        os.remove(path)

    # Return result
    if defects:
        severities = [d['severity'] for d in defects]
        worst = (
            "Critical" if "Critical" in severities
            else "Moderate" if "Moderate" in severities
            else "Minor"
        )
        message = (
            f"Found {len(defects)} defect(s) — "
            f"most severe: {worst}"
        )
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
    from search import search_road
    r = search_road(name)
    return r if r else {"error": "Road not found"}


# ══════════════════════════════
# COMPLAINTS
# ══════════════════════════════

@app.get("/complaints")
def get_complaints():
    from database import complaints_col
    return list(
        complaints_col.find({}, {"_id": 0})
    )


@app.post("/complaint")
def create_complaint(data: dict):

    road_name = data.get("road_name", "")
    defect = data.get("defect", "")
    severity = data.get("severity", "Moderate")

    if not road_name:
        return {"error": "Road name required"}

    if not defect:
        return {"error": "Defect description required"}

    if severity not in [
        "Minor", "Moderate", "Critical"
    ]:
        return {
            "error": "Severity must be Minor Moderate or Critical"
        }

    c = file_complaint(road_name, defect, severity)
    return c if c else {"error": "Road not found"}