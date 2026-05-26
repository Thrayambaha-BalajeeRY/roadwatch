from roboflow import Roboflow
from dotenv import load_dotenv
from pymongo import MongoClient
import os

load_dotenv()

# Initialize Roboflow with your API key
rf = Roboflow(api_key=os.getenv("ROBOFLOW_API_KEY"))

# Download the real pothole dataset
# This is a real dataset with 665 labelled road images
project = rf.workspace("thrayambahas-workspace-lonrp").project("pothole-detection-th8es")
version = project.version(1)
dataset = version.download("yolov8")

print("Dataset downloaded successfully!")
print(f"Location: {dataset.location}")



load_dotenv()

client = MongoClient(os.getenv("MONGODB_URI"))
db = client["roadwatch"]

roads_col = db["roads"]
complaints_col = db["complaints"]
detections_col = db["detections"]

def test_connection():
    try:
        client.admin.command('ping')
        print("MongoDB connected successfully")
        return True
    except Exception as e:
        print(f"MongoDB connection failed: {e}")
        return False

if __name__ == "__main__":
    test_connection()