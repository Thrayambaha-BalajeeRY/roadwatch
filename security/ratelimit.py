from datetime import datetime, timedelta
from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

client = MongoClient(os.getenv("MONGODB_URI"))
db = client["roadwatch"]
rate_col = db["rate_limits"]

LIMITS = {
    "chat":      {"requests": 20, "minutes": 1},
    "detect":    {"requests": 10, "minutes": 1},
    "complaint": {"requests": 5,  "minutes": 60},
    "login":     {"requests": 5,  "minutes": 15},
    "register":  {"requests": 3,  "minutes": 60},
}


def check_limit(ip: str,
                endpoint: str) -> dict:
    rule = LIMITS.get(
        endpoint,
        {"requests": 30, "minutes": 1}
    )
    max_req = rule["requests"]
    window_start = (
        datetime.utcnow() -
        timedelta(minutes=rule["minutes"])
    ).isoformat()

    count = rate_col.count_documents({
        "ip": ip,
        "endpoint": endpoint,
        "time": {"$gte": window_start}
    })

    if count >= max_req:
        return {
            "allowed": False,
            "message": (
                f"Too many requests. "
                f"Max {max_req} per "
                f"{rule['minutes']} min."
            )
        }

    rate_col.insert_one({
        "ip": ip,
        "endpoint": endpoint,
        "time": datetime.utcnow().isoformat()
    })

    return {
        "allowed": True,
        "remaining": max_req - count - 1
    }


if __name__ == "__main__":
    print("=== Testing Rate Limiter ===\n")
    ip = "192.168.1.100"

    print("Complaint limit (max 5/hour):")
    for i in range(7):
        r = check_limit(ip, "complaint")
        status = "OK" if r["allowed"] else "BLOCKED"
        print(
            f"  Request {i+1}: {status}"
            f" {r.get('message','')}"
        )