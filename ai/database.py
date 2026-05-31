from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

client = MongoClient(os.getenv("MONGODB_URI"))
db = client["roadwatch"]

roads_col = db["roads"]
complaints_col = db["complaints"]
detections_col = db["detections"]
users_col = db["users"]
rate_col = db["rate_limits"]

def test_connection():
    try:
        client.admin.command('ping')
        print("MongoDB connected successfully")
        return True
    except Exception as e:
        print(f"MongoDB connection failed: {e}")
        return False
