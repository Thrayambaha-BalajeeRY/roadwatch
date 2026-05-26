from groq import Groq
from database import complaints_col
from search import smart_search, format_data, search_road
from dotenv import load_dotenv
from datetime import datetime
import os

load_dotenv()

# ── Setup Groq ──
client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)

print("Groq AI loaded successfully")


def chat(user_message, history=[]):

    # Search MongoDB live
    result = smart_search(user_message)
    db_data = format_data(result)

    # System prompt with live MongoDB data
    system = f"""You are RoadWatch AI — India's road quality
transparency assistant for IIT Madras Road Safety Hackathon 2026.

LIVE DATA FROM MONGODB DATABASE:
{db_data}

INSTRUCTIONS:
1. Use ONLY the database data above to answer
2. Always mention:
   - Safety score and status
   - Contractor name
   - Budget sanctioned vs spent percentage
   - Responsible officer name and phone
3. If budget spent less than 80% AND score
   below 60 — flag as SUSPECTED MISMANAGEMENT
4. Score meaning:
   80-100 = Safe
   60-79  = Monitor
   40-59  = Risk
   0-39   = Critical
5. Be helpful, clear, and factual
6. Answer in same language as user
7. Never make up data not in the database"""

    # Build messages for API
    messages = [
        {"role": "system", "content": system}
    ]

    # Add conversation history
    for h in history:
        if h["role"] in ["user", "assistant"]:
            messages.append({
                "role": h["role"],
                "content": h["content"]
            })

    # Add current message
    messages.append({
        "role": "user",
        "content": user_message
    })

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            max_tokens=1024,
            temperature=0.3
        )
        reply = response.choices[0].message.content

    except Exception as e:
        reply = f"Error: {str(e)}"

    # Update history
    history.append({
        "role": "user",
        "content": user_message
    })
    history.append({
        "role": "assistant",
        "content": reply
    })

    return reply, history


def file_complaint(road_name, defect, severity):

    road = search_road(road_name)
    if not road:
        return None

    c = {
        "reference": "CMP-" + str(
            int(datetime.now().timestamp())
        ),
        "road_name": road["name"],
        "road_id": road.get("road_id", ""),
        "city": road.get("city", ""),
        "defect_description": defect,
        "severity": severity,
        "routed_to": road.get("officer_name", ""),
        "designation": road.get(
            "officer_designation", ""
        ),
        "authority": road.get("authority", ""),
        "phone": road.get("office_phone", ""),
        "email": road.get("office_email", ""),
        "portal": road.get("grievance_portal", ""),
        "status": "Submitted",
        "created_at": datetime.now().isoformat()
    }

    complaints_col.insert_one(c)
    c.pop("_id", None)
    return c


if __name__ == "__main__":
    print("RoadWatch AI — MongoDB + Groq")
    print("Type quit to exit\n")

    history = []
    while True:
        q = input("You: ")
        if q.lower() == "quit":
            break
        reply, history = chat(q, history)
        print(f"\nBot: {reply}\n{'─'*50}\n")