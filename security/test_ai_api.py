import requests
from dotenv import load_dotenv
import os

load_dotenv()

AI_URL = os.getenv("AI_API_URL")
print(f"Testing: {AI_URL}\n")

try:
    r = requests.get(f"{AI_URL}/", timeout=5)
    print(f"Server: {r.json()['status']}")

    r = requests.get(f"{AI_URL}/roads")
    print(f"Roads: {len(r.json())} found")

    r = requests.post(
        f"{AI_URL}/chat",
        json={
            "message": "How is MG Road?",
            "history": []
        }
    )
    reply = r.json().get("reply", "")
    print(f"Chat: {reply[:80]}...")

    print("\nAI API working!")

except Exception as e:
    print(f"Failed: {e}")
    print("Tell AI team to check their server")