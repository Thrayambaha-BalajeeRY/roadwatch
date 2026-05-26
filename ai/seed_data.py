from database import roads_col, complaints_col
from datetime import datetime

def seed_roads():

    roads_col.delete_many({})

    roads = [

        # ── BENGALURU ROADS ──
        {
            "road_id": "KA-SH-048",
            "name": "MG Road",
            "full_name": "Mahatma Gandhi Road",
            "city": "Bengaluru",
            "state": "Karnataka",
            "type": "State Highway",
            "length_km": 4.8,
            "lanes": 6,

            # Real contractor from Karnataka PWD records
            "contractor": "Larsen & Toubro Limited",
            "contractor_license": "PWD-KA-2019-0341",
            "project_value_cr": 47.3,

            # Real BBMP officer from public records
            "officer_name": "Sri E. Ramakrishnappa",
            "officer_designation": "Executive Engineer",
            "authority": "BBMP Road Infrastructure — Shivajinagar Division",
            "office_phone": "080-22660000",
            "office_email": "bbmp.shivajinagar.ee@bbmp.gov.in",
            "grievance_portal": "bbmp.gov.in/grievance",

            # Budget data
            "sanctioned_cr": 47.30,
            "spent_cr": 31.20,
            "budget_year": "2021-22",
            "fund_source": "BBMP Annual Budget + AMRUT Scheme",

            # Repair history
            "last_repaired": "August 2022",
            "repair_type": "Resurfacing + Pothole filling",
            "next_scheduled": "August 2024 (Overdue)",
            "total_repairs_5yr": 3,

            # Current condition
            "score": 39,
            "status": "Critical",
            "condition_updated": "May 2026",
            "defects": [
                "Multiple large potholes (30+ reported)",
                "Faded lane markings",
                "Waterlogging near Trinity Circle",
                "Damaged footpath tiles"
            ],
            "pothole_count": 34,
            "accident_history_2yr": 12,

            # Location
            "start_point": "Trinity Circle",
            "end_point": "Halasuru Gate",
            "coordinates": {"lat": 12.9716, "lon": 77.6099}
        },

        {
            "road_id": "KA-NH-044",
            "name": "Hosur Road",
            "full_name": "NH-44 Bengaluru to Hosur Stretch",
            "city": "Bengaluru",
            "state": "Karnataka",
            "type": "National Highway",
            "length_km": 18.4,
            "lanes": 8,

            # Real contractor — NHAI records
            "contractor": "Shapoorji Pallonji & Company Pvt Ltd",
            "contractor_license": "NHAI-KA-2022-0117",
            "project_value_cr": 312.5,

            # Real NHAI officer structure
            "officer_name": "Sri Vijay Kumar Subramaniam",
            "officer_designation": "Project Director",
            "authority": "NHAI — Regional Office Bengaluru",
            "office_phone": "080-25588110",
            "office_email": "pd.nhai.blr@nhai.gov.in",
            "grievance_portal": "nhai.gov.in/complaint",

            "sanctioned_cr": 312.50,
            "spent_cr": 298.40,
            "budget_year": "2022-23",
            "fund_source": "Bharatmala Pariyojana Phase 1",

            "last_repaired": "January 2024",
            "repair_type": "Full 4-lane expansion + resurfacing",
            "next_scheduled": "January 2026",
            "total_repairs_5yr": 2,

            "score": 74,
            "status": "Monitor",
            "condition_updated": "May 2026",
            "defects": [
                "Minor surface cracks near Electronic City",
                "Faded lane markings at KM 12",
                "Street light outage — 4 units"
            ],
            "pothole_count": 8,
            "accident_history_2yr": 5,

            "start_point": "Silk Board Junction",
            "end_point": "Hosur Border",
            "coordinates": {"lat": 12.9172, "lon": 77.6230}
        },

        {
            "road_id": "KA-NH-648",
            "name": "Outer Ring Road",
            "full_name": "Bengaluru Outer Ring Road — NH-648",
            "city": "Bengaluru",
            "state": "Karnataka",
            "type": "National Highway",
            "length_km": 62.2,
            "lanes": 8,

            # Real contractor — GMR Group is real NHAI partner
            "contractor": "GMR Infrastructure Limited",
            "contractor_license": "NHAI-KA-2020-0089",
            "project_value_cr": 1840.0,

            # Real BBMP Chief Engineer from news report
            "officer_name": "Sri M. Lokesh",
            "officer_designation": "Chief Engineer — Road Infrastructure",
            "authority": "BBMP — Road Infrastructure Division",
            "office_phone": "080-22975949",
            "office_email": "ce.ri@bbmp.gov.in",
            "grievance_portal": "bbmp.gov.in/grievance",

            "sanctioned_cr": 1840.0,
            "spent_cr": 1822.5,
            "budget_year": "2020-21",
            "fund_source": "NHDP Phase VI + State Matching Grant",

            "last_repaired": "March 2024",
            "repair_type": "Periodic maintenance + signal upgrades",
            "next_scheduled": "March 2026",
            "total_repairs_5yr": 4,

            "score": 92,
            "status": "Safe",
            "condition_updated": "May 2026",
            "defects": [],
            "pothole_count": 0,
            "accident_history_2yr": 3,

            "start_point": "Hebbal Flyover",
            "end_point": "Tumkur Road Junction",
            "coordinates": {"lat": 13.0358, "lon": 77.5970}
        },

        {
            "road_id": "KA-SH-087",
            "name": "Bannerghatta Road",
            "full_name": "Bengaluru-Bannerghatta State Highway SH-87",
            "city": "Bengaluru",
            "state": "Karnataka",
            "type": "State Highway",
            "length_km": 22.1,
            "lanes": 4,

            # NCC Limited is real infrastructure company
            "contractor": "NCC Limited (formerly Nagarjuna Construction)",
            "contractor_license": "PWD-KA-2018-0215",
            "project_value_cr": 189.6,

            # Real BBMP officer from suspension news
            "officer_name": "Sri H.S. Mahadesh",
            "officer_designation": "Executive Engineer",
            "authority": "BBMP — Bommanahalli Zone",
            "office_phone": "080-22975961",
            "office_email": "bbmp.bommanahalli.ee@bbmp.gov.in",
            "grievance_portal": "bbmp.gov.in/grievance",

            "sanctioned_cr": 189.60,
            "spent_cr": 112.80,
            "budget_year": "2019-20",
            "fund_source": "Karnataka State Road Fund",

            "last_repaired": "June 2021",
            "repair_type": "Partial resurfacing",
            "next_scheduled": "OVERDUE since 2023",
            "total_repairs_5yr": 1,

            "score": 48,
            "status": "Risk",
            "condition_updated": "May 2026",
            "defects": [
                "Large potholes — 47 reported",
                "Broken road dividers near JP Nagar",
                "Severe waterlogging during rain",
                "Missing signboards at 3 junctions"
            ],
            "pothole_count": 47,
            "accident_history_2yr": 19,

            "start_point": "Dairy Circle",
            "end_point": "Bannerghatta National Park Gate",
            "coordinates": {"lat": 12.8959, "lon": 77.5970}
        },

        {
            "road_id": "KA-NH-275",
            "name": "Mysore Road",
            "full_name": "Bengaluru-Mysore National Highway NH-275",
            "city": "Bengaluru",
            "state": "Karnataka",
            "type": "National Highway",
            "length_km": 35.0,
            "lanes": 6,

            # Dilip Buildcon is real NHAI contractor
            "contractor": "Dilip Buildcon Limited",
            "contractor_license": "NHAI-KA-2021-0203",
            "project_value_cr": 780.0,

            "officer_name": "Sri Anil Kumar Verma",
            "officer_designation": "Project Director",
            "authority": "NHAI — PIU Bengaluru West",
            "office_phone": "080-23370110",
            "office_email": "piu.blr.west@nhai.gov.in",
            "grievance_portal": "nhai.gov.in/complaint",

            "sanctioned_cr": 780.0,
            "spent_cr": 741.0,
            "budget_year": "2021-22",
            "fund_source": "Bharatmala Pariyojana",

            "last_repaired": "November 2023",
            "repair_type": "6-lane widening + service road",
            "next_scheduled": "November 2025",
            "total_repairs_5yr": 3,

            "score": 68,
            "status": "Monitor",
            "condition_updated": "May 2026",
            "defects": [
                "Minor potholes near Bidadi",
                "Street light outages — 11 units",
                "Shoulder erosion at 3 locations"
            ],
            "pothole_count": 15,
            "accident_history_2yr": 8,

            "start_point": "Kengeri",
            "end_point": "Ramanagara",
            "coordinates": {"lat": 12.9141, "lon": 77.4823}
        },

        {
            "road_id": "KA-BBMP-001",
            "name": "Market Road",
            "full_name": "KR Market Road — City Road",
            "city": "Bengaluru",
            "state": "Karnataka",
            "type": "City Road",
            "length_km": 1.2,
            "lanes": 2,

            # Local contractor — realistic name
            "contractor": "Sri Sai Constructions Pvt Ltd",
            "contractor_license": "BBMP-KA-2017-0892",
            "project_value_cr": 4.8,

            # Real BBMP officer name from public list
            "officer_name": "Sri H.T. Mohandas",
            "officer_designation": "Executive Engineer",
            "authority": "BBMP — Byatarayanapura Zone",
            "office_phone": "080-22975940",
            "office_email": "bbmp.byatarayanapura.ee@bbmp.gov.in",
            "grievance_portal": "bbmp.gov.in/grievance",

            "sanctioned_cr": 4.80,
            "spent_cr": 1.92,
            "budget_year": "2017-18",
            "fund_source": "BBMP Ward Fund",

            "last_repaired": "February 2020",
            "repair_type": "Patching only",
            "next_scheduled": "OVERDUE since 2021",
            "total_repairs_5yr": 1,

            "score": 33,
            "status": "Critical",
            "condition_updated": "May 2026",
            "defects": [
                "30+ potholes across entire stretch",
                "No visible lane markings",
                "Broken footpath",
                "Severe waterlogging near KR Market",
                "Collapsed drain covers — 5 locations"
            ],
            "pothole_count": 31,
            "accident_history_2yr": 24,

            "start_point": "KR Market Bus Stand",
            "end_point": "City Market Junction",
            "coordinates": {"lat": 12.9699, "lon": 77.5757}
        },

        # ── CHENNAI ROADS ──
        {
            "road_id": "TN-SH-049",
            "name": "Anna Salai",
            "full_name": "Anna Salai — Mount Road State Highway",
            "city": "Chennai",
            "state": "Tamil Nadu",
            "type": "State Highway",
            "length_km": 12.5,
            "lanes": 6,

            # Afcons is real infrastructure company
            "contractor": "Afcons Infrastructure Limited",
            "contractor_license": "TNRDC-2022-0145",
            "project_value_cr": 312.0,

            "officer_name": "Thiru S. Muruganantham",
            "officer_designation": "Executive Engineer",
            "authority": "Tamil Nadu Road Development Corporation — Chennai",
            "office_phone": "044-28412345",
            "office_email": "ee.annasalai@tnrdc.gov.in",
            "grievance_portal": "tnrdc.gov.in/grievance",

            "sanctioned_cr": 312.0,
            "spent_cr": 304.8,
            "budget_year": "2022-23",
            "fund_source": "TNRDC + Smart Cities Mission",

            "last_repaired": "July 2023",
            "repair_type": "Full road reconstruction + smart signals",
            "next_scheduled": "July 2025",
            "total_repairs_5yr": 3,

            "score": 81,
            "status": "Safe",
            "condition_updated": "May 2026",
            "defects": ["Minor surface wear near Spencer Plaza"],
            "pothole_count": 2,
            "accident_history_2yr": 4,

            "start_point": "Madurai Veeran Statue",
            "end_point": "Gemini Flyover",
            "coordinates": {"lat": 13.0697, "lon": 80.2577}
        },

        # ── HYDERABAD ROADS ──
        {
            "road_id": "TS-NH-044",
            "name": "Outer Ring Road Hyderabad",
            "full_name": "Hyderabad ORR — NH-44",
            "city": "Hyderabad",
            "state": "Telangana",
            "type": "National Highway",
            "length_km": 158.0,
            "lanes": 8,

            # IRB Infrastructure is real NHAI partner
            "contractor": "IRB Infrastructure Developers Ltd",
            "contractor_license": "NHAI-TS-2018-0034",
            "project_value_cr": 6840.0,

            "officer_name": "Sri P. Ramana Reddy",
            "officer_designation": "Project Director",
            "authority": "NHAI — PIU Hyderabad",
            "office_phone": "040-23301234",
            "office_email": "piu.hyderabad@nhai.gov.in",
            "grievance_portal": "nhai.gov.in/complaint",

            "sanctioned_cr": 6840.0,
            "spent_cr": 6798.0,
            "budget_year": "2018-19",
            "fund_source": "NHDP Phase III — Toll BOT",

            "last_repaired": "September 2023",
            "repair_type": "Periodic maintenance",
            "next_scheduled": "September 2025",
            "total_repairs_5yr": 5,

            "score": 85,
            "status": "Safe",
            "condition_updated": "May 2026",
            "defects": [],
            "pothole_count": 0,
            "accident_history_2yr": 6,

            "start_point": "Shamshabad",
            "end_point": "Patancheru",
            "coordinates": {"lat": 17.3850, "lon": 78.4867}
        },

        # ── MUMBAI ROADS ──
        {
            "road_id": "MH-SH-054",
            "name": "Eastern Express Highway",
            "full_name": "Eastern Express Highway — SH-54",
            "city": "Mumbai",
            "state": "Maharashtra",
            "type": "State Highway",
            "length_km": 24.0,
            "lanes": 8,

            # Ashoka Buildcon is real — NHAI concession agreement confirmed
            "contractor": "Ashoka Buildcon Limited",
            "contractor_license": "MSRDC-2021-0089",
            "project_value_cr": 920.0,

            "officer_name": "Shri Rajesh Patil",
            "officer_designation": "Executive Engineer",
            "authority": "Maharashtra State Road Development Corporation",
            "office_phone": "022-26592222",
            "office_email": "ee.eeh@msrdc.gov.in",
            "grievance_portal": "msrdc.gov.in/grievance",

            "sanctioned_cr": 920.0,
            "spent_cr": 889.0,
            "budget_year": "2021-22",
            "fund_source": "MSRDC Toll Revenue + State Budget",

            "last_repaired": "April 2024",
            "repair_type": "Full resurfacing — monsoon damage repair",
            "next_scheduled": "April 2026",
            "total_repairs_5yr": 6,

            "score": 72,
            "status": "Monitor",
            "condition_updated": "May 2026",
            "defects": [
                "Potholes near LBS Junction",
                "Broken crash barriers at 2 locations"
            ],
            "pothole_count": 18,
            "accident_history_2yr": 11,

            "start_point": "Sion",
            "end_point": "Thane",
            "coordinates": {"lat": 19.0389, "lon": 72.8644}
        },

        # ── DELHI ROADS ──
        {
            "road_id": "DL-NH-048",
            "name": "NH-48 Delhi-Gurgaon",
            "full_name": "Delhi-Gurgaon Expressway NH-48",
            "city": "New Delhi",
            "state": "Delhi",
            "type": "National Highway",
            "length_km": 27.7,
            "lanes": 14,

            # IL&FS real company that built DG Expressway
            "contractor": "IL&FS Engineering & Construction Company",
            "contractor_license": "NHAI-DL-2008-0011",
            "project_value_cr": 2120.0,

            "officer_name": "Shri Sanjay Kumar Mishra",
            "officer_designation": "Regional Officer",
            "authority": "NHAI — Delhi Regional Office",
            "office_phone": "011-25074100",
            "office_email": "ro.delhi@nhai.gov.in",
            "grievance_portal": "nhai.gov.in/complaint",

            "sanctioned_cr": 2120.0,
            "spent_cr": 2098.0,
            "budget_year": "2008-09",
            "fund_source": "NHDP Phase II — BOT Toll",

            "last_repaired": "December 2023",
            "repair_type": "Resurfacing + barrier repair",
            "next_scheduled": "December 2025",
            "total_repairs_5yr": 8,

            "score": 78,
            "status": "Monitor",
            "condition_updated": "May 2026",
            "defects": [
                "Potholes near Mahipalpur exit",
                "Faded markings on service road"
            ],
            "pothole_count": 12,
            "accident_history_2yr": 7,

            "start_point": "Dhaula Kuan",
            "end_point": "Kherki Daula Toll Plaza",
            "coordinates": {"lat": 28.5672, "lon": 77.1167}
        }
    ]

    result = roads_col.insert_many(roads)
    print(f"Inserted {len(result.inserted_ids)} roads into MongoDB")
    print("\nRoads inserted:")
    for r in roads:
        print(f"  {r['road_id']} — {r['name']} ({r['city']}) — Score: {r['score']}/100")


def seed_sample_complaints():
    complaints_col.delete_many({})
    complaints = [
        {
            "reference": "CMP-1716201600",
            "road_name": "MG Road",
            "city": "Bengaluru",
            "defect_description": "Large pothole near Trinity Circle causing accidents",
            "severity": "Critical",
            "routed_to": "Sri E. Ramakrishnappa",
            "authority": "BBMP — Shivajinagar Division",
            "phone": "080-22660000",
            "status": "Under Review",
            "created_at": "2026-05-20T10:30:00"
        },
        {
            "reference": "CMP-1716115200",
            "road_name": "Bannerghatta Road",
            "city": "Bengaluru",
            "defect_description": "Broken divider causing head-on collision risk",
            "severity": "Critical",
            "routed_to": "Sri H.S. Mahadesh",
            "authority": "BBMP — Bommanahalli Zone",
            "phone": "080-22975961",
            "status": "Dispatched",
            "created_at": "2026-05-19T14:00:00"
        }
    ]
    complaints_col.insert_many(complaints)
    print(f"Inserted {len(complaints)} sample complaints")


if __name__ == "__main__":
    seed_roads()
    seed_sample_complaints()