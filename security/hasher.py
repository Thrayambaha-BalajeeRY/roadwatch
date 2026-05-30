import hashlib
import json
from datetime import datetime


def hash_complaint(complaint: dict) -> str:
    data = {
        "road_name": complaint.get("road_name",""),
        "defect": complaint.get("defect", ""),
        "severity": complaint.get("severity", ""),
        "time": complaint.get(
            "created_at",
            datetime.now().isoformat()
        )
    }
    string = json.dumps(data, sort_keys=True)
    return hashlib.sha256(
        string.encode()
    ).hexdigest()


def hash_image(image_bytes: bytes) -> str:
    return hashlib.sha256(
        image_bytes
    ).hexdigest()


def verify_hash(complaint: dict,
                stored_hash: str) -> bool:
    return hash_complaint(complaint) == stored_hash


def make_ref(road: str,
             timestamp: str) -> str:
    data = f"{road}{timestamp}"
    short = hashlib.md5(
        data.encode()
    ).hexdigest()[:8].upper()
    return f"CMP-{short}"


if __name__ == "__main__":
    print("=== Testing Hasher ===\n")

    c = {
        "road_name": "MG Road",
        "defect": "Large pothole near junction",
        "severity": "Critical",
        "created_at": "2026-05-23T10:00:00"
    }

    h = hash_complaint(c)
    print(f"Hash: {h}")
    print(f"Verify: {verify_hash(c, h)}")

    c["severity"] = "Minor"
    print(f"Tamper check: {verify_hash(c, h)}")

    ref = make_ref("MG Road", "2026-05-23")
    print(f"Ref ID: {ref}")