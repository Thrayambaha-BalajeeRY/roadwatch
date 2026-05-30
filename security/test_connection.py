from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

try:
    client = MongoClient(os.getenv("MONGODB_URI"))
    client.admin.command('ping')
    db = client["roadwatch"]
    roads = list(db.roads.find(
        {}, {"_id": 0, "name": 1}
    ))
    print("MongoDB Connected!")
    print(f"Roads found: {len(roads)}")
    for r in roads:
        print(f"  - {r['name']}")
except Exception as e:
    print(f"Failed: {e}")