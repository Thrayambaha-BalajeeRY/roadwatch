from database import roads_col, complaints_col


# ══════════════════════════════
# SINGLE ROAD SEARCH
# ══════════════════════════════

def search_road(name: str):
    """Search road by name — partial match"""
    result = roads_col.find_one(
        {"name": {"$regex": name, "$options": "i"}},
        {"_id": 0}
    )
    return result


# ══════════════════════════════
# ROADS BY CITY
# ══════════════════════════════

def roads_by_city(city: str):
    """Get all roads in a city"""
    results = list(roads_col.find(
        {"city": {"$regex": city, "$options": "i"}},
        {"_id": 0}
    ))
    return results


# ══════════════════════════════
# WORST ROADS
# ══════════════════════════════

def worst_roads(n: int = 5):
    """Get roads with lowest safety scores"""
    results = list(
        roads_col.find(
            {}, {"_id": 0}
        ).sort("score", 1).limit(n)
    )
    return results


# ══════════════════════════════
# BEST ROADS
# ══════════════════════════════

def best_roads(n: int = 5):
    """Get roads with highest safety scores"""
    results = list(
        roads_col.find(
            {}, {"_id": 0}
        ).sort("score", -1).limit(n)
    )
    return results


# ══════════════════════════════
# BUDGET MISMANAGEMENT
# ══════════════════════════════

def budget_mismanagement():
    """
    Find roads where less than 80% budget
    was spent but road quality is still poor
    """
    all_roads = list(
        roads_col.find({}, {"_id": 0})
    )
    flagged = []

    for road in all_roads:
        sanctioned = road.get("sanctioned_cr", 0)
        spent = road.get("spent_cr", 0)
        score = road.get("score", 100)

        if sanctioned > 0:
            percent = (spent / sanctioned) * 100
            if percent < 80 and score < 60:
                road["percent_spent"] = round(
                    percent, 1
                )
                road["unspent_cr"] = round(
                    sanctioned - spent, 2
                )
                flagged.append(road)

    return flagged


# ══════════════════════════════
# ALL ROADS
# ══════════════════════════════

def all_roads_data():
    """Get all roads from MongoDB"""
    return list(
        roads_col.find({}, {"_id": 0})
    )


# ══════════════════════════════
# ROADS BY TYPE
# ══════════════════════════════

def roads_by_type(road_type: str):
    """Get roads by type"""
    results = list(roads_col.find(
        {
            "type": {
                "$regex": road_type,
                "$options": "i"
            }
        },
        {"_id": 0}
    ))
    return results


# ══════════════════════════════
# ROADS BY STATUS
# ══════════════════════════════

def roads_by_status(status: str):
    """Get roads by status"""
    results = list(roads_col.find(
        {
            "status": {
                "$regex": status,
                "$options": "i"
            }
        },
        {"_id": 0}
    ))
    return results


# ══════════════════════════════
# SMART SEARCH — MAIN FUNCTION
# ══════════════════════════════

def smart_search(msg: str) -> dict:
    """
    Reads user message and decides which
    MongoDB query to run.
    Returns relevant road data.
    """
    msg_lower = msg.lower()

    # Words to skip when matching road names
    skip_words = {
        "road", "the", "of", "to",
        "about", "how", "is", "tell",
        "me", "show", "in", "on",
        "for", "and", "all", "a",
        "an", "want", "complain",
        "pothole", "crack", "issue",
        "problem", "complaint", "what",
        "which", "where", "when", "who",
        "give", "please", "can", "you",
        "i", "my", "this", "that",
        "with", "from", "by", "at",
        "are", "was", "were", "be",
        "been", "being", "have", "has",
        "had", "do", "does", "did",
        "will", "would", "could", "should",
        "may", "might", "must", "shall"
    }

    # ── Step 1: Get all roads from MongoDB ──
    all_roads = list(roads_col.find(
        {}, {"_id": 0, "name": 1, "city": 1}
    ))

    matched_road = None

    for road in all_roads:
        road_name = road["name"].lower()

        # Check 1 — full road name in message
        if road_name in msg_lower:
            matched_road = road["name"]
            break

        # Check 2 — road name words in message
        words = road_name.split()
        matched_words = 0
        total_meaningful = 0

        for word in words:
            if word not in skip_words and len(word) > 3:
                total_meaningful += 1
                if word in msg_lower:
                    matched_words += 1

        # If more than half meaningful words match
        if (total_meaningful > 0 and
                matched_words >= max(
                    1, total_meaningful // 2
                )):
            matched_road = road["name"]
            break

    if matched_road:
        r = search_road(matched_road)
        if r:
            return {
                "type": "single",
                "data": r,
                "query": matched_road
            }

    # ── Step 2: Check city names ──
    city_map = {
        "bengaluru": "Bengaluru",
        "bangalore": "Bengaluru",
        "chennai": "Chennai",
        "madras": "Chennai",
        "hyderabad": "Hyderabad",
        "mumbai": "Mumbai",
        "bombay": "Mumbai",
        "delhi": "Delhi",
        "new delhi": "New Delhi",
        "kolkata": "Kolkata",
        "calcutta": "Kolkata",
        "pune": "Pune"
    }

    for keyword, city_name in city_map.items():
        if keyword in msg_lower:
            data = roads_by_city(city_name)
            if data:
                return {
                    "type": "city",
                    "data": data,
                    "query": city_name
                }
            else:
                # City found in message but
                # no roads in database for it
                return {
                    "type": "city_not_found",
                    "data": [],
                    "query": city_name
                }

    # ── Step 3: Worst / dangerous roads ──
    if any(w in msg_lower for w in [
        "worst", "dangerous", "bad road",
        "poor road", "terrible", "horrible",
        "most dangerous", "accident prone",
        "lowest score", "most damaged",
        "most potholes"
    ]):
        return {
            "type": "worst",
            "data": worst_roads(5),
            "query": "worst roads"
        }

    # ── Step 4: Best / safe roads ──
    if any(w in msg_lower for w in [
        "best", "safest", "good road",
        "well maintained", "highest score",
        "safe road", "best road",
        "most safe", "top road"
    ]):
        return {
            "type": "best",
            "data": best_roads(5),
            "query": "best roads"
        }

    # ── Step 5: Budget / money issues ──
    if any(w in msg_lower for w in [
        "budget", "money", "spent",
        "sanctioned", "corruption",
        "mismanagement", "fund",
        "crore", "allocated", "wasted",
        "unspent", "underspent",
        "not spent", "budget issue",
        "financial"
    ]):
        data = budget_mismanagement()
        return {
            "type": "budget",
            "data": data,
            "query": "budget issues"
        }

    # ── Step 6: Road type ──
    if any(w in msg_lower for w in [
        "national highway", "nh road",
        "all nh", "show nh"
    ]):
        return {
            "type": "road_type",
            "data": roads_by_type("National Highway"),
            "query": "National Highway"
        }

    if any(w in msg_lower for w in [
        "state highway", "sh road",
        "all sh", "show sh"
    ]):
        return {
            "type": "road_type",
            "data": roads_by_type("State Highway"),
            "query": "State Highway"
        }

    if any(w in msg_lower for w in [
        "city road", "municipal road",
        "urban road"
    ]):
        return {
            "type": "road_type",
            "data": roads_by_type("City Road"),
            "query": "City Road"
        }

    # ── Step 7: Complaint keywords ──
    if any(w in msg_lower for w in [
        "complain", "complaint",
        "file complaint", "lodge complaint",
        "who to contact", "contact officer",
        "report issue", "raise complaint",
        "register complaint"
    ]):
        return {
            "type": "all",
            "data": all_roads_data(),
            "query": "complaint help"
        }

    # ── Step 8: Status based ──
    if any(w in msg_lower for w in [
        "critical road", "critical status",
        "show critical", "all critical"
    ]):
        return {
            "type": "status",
            "data": roads_by_status("Critical"),
            "query": "Critical roads"
        }

    if any(w in msg_lower for w in [
        "at risk", "risk road",
        "show risk", "risk status"
    ]):
        return {
            "type": "status",
            "data": roads_by_status("Risk"),
            "query": "Risk roads"
        }

    # ── Step 9: Default — return all roads ──
    return {
        "type": "all",
        "data": all_roads_data(),
        "query": "all roads"
    }


# ══════════════════════════════
# FORMAT DATA FOR CHATBOT
# ══════════════════════════════

def format_data(result: dict) -> str:
    """
    Converts MongoDB result into clean text
    that chatbot reads to answer questions
    """
    result_type = result.get("type", "all")
    data = result.get("data")
    query = result.get("query", "")

    # ── City not found ──
    if result_type == "city_not_found":
        return (
            f"No roads found for {query} "
            f"in the database currently. "
            f"Database has roads in Bengaluru, "
            f"Chennai, Hyderabad, Mumbai, Delhi."
        )

    if not data:
        return "No road data found in database."

    # ── Single road ──
    if result_type == "single":
        road = data
        sanctioned = road.get("sanctioned_cr", 0)
        spent = road.get("spent_cr", 0)
        percent = round(
            (spent / sanctioned) * 100, 1
        ) if sanctioned > 0 else 0

        defects = road.get("defects", [])
        defect_text = (
            ", ".join(defects)
            if defects
            else "None reported"
        )

        budget_flag = ""
        if percent < 80 and road.get(
                "score", 100) < 60:
            budget_flag = (
                "\n⚠ SUSPECTED MISMANAGEMENT: "
                "Less than 80% budget spent "
                "but road quality is poor"
            )

        return f"""
ROAD FOUND IN DATABASE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Road ID        : {road.get('road_id', 'N/A')}
Name           : {road.get('name', 'N/A')}
Full Name      : {road.get('full_name', 'N/A')}
City           : {road.get('city', 'N/A')}
State          : {road.get('state', 'N/A')}
Type           : {road.get('type', 'N/A')}
Length         : {road.get('length_km', 0)} KM
Lanes          : {road.get('lanes', 0)}

SAFETY INFORMATION:
━━━━━━━━━━━━━━━━━━
Safety Score   : {road.get('score', 0)}/100
Status         : {road.get('status', 'N/A')}
Potholes       : {road.get('pothole_count', 0)} reported
Accidents      : {road.get('accident_history_2yr', 0)} in last 2 years
Active Defects : {defect_text}

CONTRACTOR DETAILS:
━━━━━━━━━━━━━━━━━━
Company        : {road.get('contractor', 'N/A')}
License No     : {road.get('contractor_license', 'N/A')}
Project Value  : Rs {road.get('project_value_cr', 0)} Crore

REPAIR HISTORY:
━━━━━━━━━━━━━━
Last Repaired  : {road.get('last_repaired', 'N/A')}
Repair Type    : {road.get('repair_type', 'N/A')}
Next Scheduled : {road.get('next_scheduled', 'N/A')}

BUDGET DETAILS:
━━━━━━━━━━━━━━
Sanctioned     : Rs {sanctioned} Crore
Spent          : Rs {spent} Crore
Utilised       : {percent}%
Fund Source    : {road.get('fund_source', 'N/A')}
{budget_flag}

COMPLAINT CONTACT:
━━━━━━━━━━━━━━━━━
Officer        : {road.get('officer_name', 'N/A')}
Designation    : {road.get('officer_designation', 'N/A')}
Authority      : {road.get('authority', 'N/A')}
Phone          : {road.get('office_phone', 'N/A')}
Email          : {road.get('office_email', 'N/A')}
Portal         : {road.get('grievance_portal', 'N/A')}
"""

    # ── Multiple roads ──
    elif result_type in [
        "city", "worst", "best",
        "road_type", "status",
        "complaint_help", "all"
    ]:
        roads = data
        header = (
            f"ROADS FOUND ({len(roads)} results)"
            f" for query: {query}\n"
            f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
        )

        rows = []
        for road in roads:
            sanctioned = road.get(
                "sanctioned_cr", 0
            )
            spent = road.get("spent_cr", 0)
            percent = round(
                (spent / sanctioned) * 100, 1
            ) if sanctioned > 0 else 0

            flag = ""
            if percent < 80 and road.get(
                    "score", 100) < 60:
                flag = " ⚠ BUDGET ISSUE"

            rows.append(
                f"• {road.get('name')} "
                f"({road.get('city')})\n"
                f"  Score      : "
                f"{road.get('score')}/100"
                f" — {road.get('status')}\n"
                f"  Contractor : "
                f"{road.get('contractor')}\n"
                f"  Last Repair: "
                f"{road.get('last_repaired')}\n"
                f"  Budget     : "
                f"Rs {sanctioned}Cr sanctioned"
                f" — {percent}% used{flag}\n"
                f"  Officer    : "
                f"{road.get('officer_name')}\n"
                f"  Phone      : "
                f"{road.get('office_phone')}\n"
            )

        return header + "\n".join(rows)

    # ── Budget issues ──
    elif result_type == "budget":
        roads = data
        if not roads:
            return (
                "No budget issues found. "
                "All roads have proper spending."
            )

        header = (
            f"BUDGET ISSUES FOUND "
            f"({len(roads)} roads flagged):\n"
            f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
        )

        rows = []
        for road in roads:
            unspent = road.get("unspent_cr", 0)
            percent = road.get("percent_spent", 0)

            rows.append(
                f"⚠ {road.get('name')} "
                f"({road.get('city')})\n"
                f"  Score        : "
                f"{road.get('score')}/100"
                f" — {road.get('status')}\n"
                f"  Budget Spent : {percent}% only\n"
                f"  Unspent      : "
                f"Rs {unspent} Crore\n"
                f"  Contractor   : "
                f"{road.get('contractor')}\n"
                f"  Officer      : "
                f"{road.get('officer_name')}\n"
                f"  Phone        : "
                f"{road.get('office_phone')}\n"
            )

        return header + "\n".join(rows)

    return str(data)


# ══════════════════════════════
# TEST ALL FUNCTIONS
# ══════════════════════════════

if __name__ == "__main__":
    print("=== Testing search.py ===\n")

    tests = [
        "How is MG Road?",
        "Tell me about Hosur Road",
        "Show Bengaluru roads",
        "Show all roads in Chennai",
        "Which are the worst roads?",
        "Any budget mismanagement?",
        "How is Bannerghatta Road?",
        "I want to complain about pothole on Bannerghatta Road",
        "Show National Highway roads",
        "How is Anna Salai?",
        "Tell me about Outer Ring Road",
        "How is Eastern Express Highway Mumbai?",
        "Which roads are dangerous?",
        "Show roads in Hyderabad",
        "Is there any corruption in road funds?",
    ]

    for test in tests:
        print(f"Q: {test}")
        result = smart_search(test)
        formatted = format_data(result)
        print(f"Type: {result['type']}")
        print(f"A: {formatted[:300]}...")
        print("─" * 60)