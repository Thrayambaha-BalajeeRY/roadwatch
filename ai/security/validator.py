import re
import os
from PIL import Image
import io

ALLOWED_EXT = {'.jpg', '.jpeg', '.png', '.webp'}
ALLOWED_TYPE = {
    'image/jpeg', 'image/png',
    'image/webp', 'image/jpg'
}
MAX_SIZE = 10 * 1024 * 1024

DANGEROUS = [
    r'<script', r'javascript:',
    r'onclick=', r'onerror=',
    r'DROP TABLE', r'DELETE FROM',
    r'UNION SELECT', r'\$where',
    r'eval\(', r'exec\(',
    r'INSERT INTO', r'--',
    r';\s*DROP'
]


def validate_text(text: str) -> dict:
    if not text or not text.strip():
        return {
            "valid": False,
            "message": "Cannot be empty"
        }
    if len(text) > 2000:
        return {
            "valid": False,
            "message": "Too long. Max 2000 chars"
        }
    for p in DANGEROUS:
        if re.search(p, text, re.IGNORECASE):
            return {
                "valid": False,
                "message": "Invalid input detected"
            }
    return {"valid": True, "message": "OK"}


def validate_email(email: str) -> dict:
    p = (r'^[a-zA-Z0-9._%+-]+'
         r'@[a-zA-Z0-9.-]+'
         r'\.[a-zA-Z]{2,}$')
    if not re.match(p, email):
        return {
            "valid": False,
            "message": "Invalid email format"
        }
    return {"valid": True, "message": "OK"}


def validate_password(pwd: str) -> dict:
    if len(pwd) < 8:
        return {
            "valid": False,
            "message": "Min 8 characters"
        }
    if not re.search(r'[A-Z]', pwd):
        return {
            "valid": False,
            "message": "Need one uppercase letter"
        }
    if not re.search(r'[0-9]', pwd):
        return {
            "valid": False,
            "message": "Need one number"
        }
    return {"valid": True, "message": "Strong"}


def validate_image(file_bytes: bytes,
                   filename: str,
                   content_type: str) -> dict:
    if len(file_bytes) > MAX_SIZE:
        return {
            "valid": False,
            "message": "Max 10MB allowed"
        }
    if len(file_bytes) < 1000:
        return {
            "valid": False,
            "message": "File too small"
        }
    ext = os.path.splitext(filename.lower())[1]
    if ext not in ALLOWED_EXT:
        return {
            "valid": False,
            "message": "Only jpg png webp allowed"
        }
    if content_type not in ALLOWED_TYPE:
        return {
            "valid": False,
            "message": "Invalid content type"
        }
    try:
        img = Image.open(io.BytesIO(file_bytes))
        img.verify()
        return {"valid": True, "message": "OK"}
    except Exception:
        return {
            "valid": False,
            "message": "Not a valid image"
        }


def validate_complaint(data: dict) -> dict:
    road = data.get("road_name", "")
    defect = data.get("defect", "")
    severity = data.get("severity", "")

    if not road or len(road) < 3:
        return {
            "valid": False,
            "message": "Road name required"
        }
    if not defect or len(defect) < 10:
        return {
            "valid": False,
            "message": "Describe defect min 10 chars"
        }
    if severity not in [
        "Minor", "Moderate", "Critical"
    ]:
        return {
            "valid": False,
            "message": "Severity: Minor Moderate Critical"
        }
    t = validate_text(defect)
    if not t["valid"]:
        return t
    return {"valid": True, "message": "OK"}


if __name__ == "__main__":
    print("=== Testing Validator ===\n")

    tests = [
        ("Normal road question", True),
        ("<script>alert('xss')</script>", False),
        ("DROP TABLE roads", False),
        ("", False),
        ("Pothole near main junction", True),
    ]

    for text, expected in tests:
        r = validate_text(text)
        icon = "PASS" if r["valid"] == expected else "FAIL"
        print(
            f"[{icon}] '{text[:35]}'"
            f" → {r['message']}"
        )