// Mock data + API client with graceful fallback
export interface Road {
  name: string;
  city: string;
  state: string;
  type: string;
  score: number;
  status: string;
  contractor: string;
  last_repaired: string;
  sanctioned_cr: number;
  spent_cr: number;
  pothole_count: number;
  accident_history_2yr: number;
  defects: string[];
  officer_name: string;
  office_phone: string;
  coordinates: { lat: number; lon: number };
}

export const MOCK_ROADS: Road[] = [
  { name: "MG Road", city: "Bengaluru", state: "Karnataka", type: "Arterial", score: 39, status: "Critical", contractor: "L&T Limited", last_repaired: "2022-03-14", sanctioned_cr: 48, spent_cr: 46, pothole_count: 34, accident_history_2yr: 12, defects: ["Potholes", "Cracks", "Faded markings"], officer_name: "Sri E. Ramakrishnappa", office_phone: "080-22660000", coordinates: { lat: 12.9756, lon: 77.6050 } },
  { name: "Outer Ring Road", city: "Bengaluru", state: "Karnataka", type: "Highway", score: 52, status: "At Risk", contractor: "GMR Infrastructure", last_repaired: "2023-08-01", sanctioned_cr: 220, spent_cr: 198, pothole_count: 87, accident_history_2yr: 41, defects: ["Potholes", "Drainage failure"], officer_name: "Shri R. Kumar", office_phone: "080-22221111", coordinates: { lat: 12.9352, lon: 77.6245 } },
  { name: "Bandra-Worli Sea Link", city: "Mumbai", state: "Maharashtra", type: "Expressway", score: 88, status: "Good", contractor: "HCC Limited", last_repaired: "2024-11-10", sanctioned_cr: 140, spent_cr: 132, pothole_count: 2, accident_history_2yr: 4, defects: [], officer_name: "Shri P. Joshi", office_phone: "022-26591234", coordinates: { lat: 19.0289, lon: 72.8158 } },
  { name: "Western Express Highway", city: "Mumbai", state: "Maharashtra", type: "Highway", score: 61, status: "At Risk", contractor: "IRB Infrastructure", last_repaired: "2023-05-22", sanctioned_cr: 310, spent_cr: 289, pothole_count: 54, accident_history_2yr: 28, defects: ["Potholes", "Cracks"], officer_name: "Smt. A. Mehta", office_phone: "022-26451100", coordinates: { lat: 19.1071, lon: 72.8478 } },
  { name: "Connaught Place Inner Circle", city: "New Delhi", state: "Delhi", type: "Arterial", score: 71, status: "Fair", contractor: "NBCC Limited", last_repaired: "2024-02-18", sanctioned_cr: 22, spent_cr: 21, pothole_count: 11, accident_history_2yr: 6, defects: ["Cracks"], officer_name: "Shri V. Sharma", office_phone: "011-23341010", coordinates: { lat: 28.6315, lon: 77.2167 } },
  { name: "NH-44 (Delhi-Sonipat)", city: "New Delhi", state: "Delhi", type: "National Highway", score: 33, status: "Critical", contractor: "Sadbhav Engineering", last_repaired: "2021-09-30", sanctioned_cr: 420, spent_cr: 415, pothole_count: 142, accident_history_2yr: 67, defects: ["Potholes", "Cracks", "Edge break"], officer_name: "Shri N. Tiwari", office_phone: "011-25841090", coordinates: { lat: 28.7041, lon: 77.1025 } },
  { name: "Anna Salai", city: "Chennai", state: "Tamil Nadu", type: "Arterial", score: 58, status: "At Risk", contractor: "Larsen & Toubro", last_repaired: "2023-12-04", sanctioned_cr: 90, spent_cr: 84, pothole_count: 29, accident_history_2yr: 18, defects: ["Potholes"], officer_name: "Thiru K. Selvam", office_phone: "044-25384343", coordinates: { lat: 13.0604, lon: 80.2496 } },
  { name: "Marine Drive", city: "Chennai", state: "Tamil Nadu", type: "Coastal", score: 82, status: "Good", contractor: "URC Construction", last_repaired: "2024-09-12", sanctioned_cr: 65, spent_cr: 61, pothole_count: 5, accident_history_2yr: 3, defects: [], officer_name: "Thiru R. Iyer", office_phone: "044-25670909", coordinates: { lat: 13.0500, lon: 80.2824 } },
  { name: "Park Street", city: "Kolkata", state: "West Bengal", type: "Arterial", score: 47, status: "At Risk", contractor: "Simplex Infra", last_repaired: "2022-11-25", sanctioned_cr: 38, spent_cr: 36, pothole_count: 41, accident_history_2yr: 15, defects: ["Potholes", "Drainage"], officer_name: "Shri S. Banerjee", office_phone: "033-22141200", coordinates: { lat: 22.5533, lon: 88.3520 } },
  { name: "Banjara Hills Road No.1", city: "Hyderabad", state: "Telangana", type: "Arterial", score: 76, status: "Fair", contractor: "Megha Engineering", last_repaired: "2024-04-08", sanctioned_cr: 55, spent_cr: 52, pothole_count: 8, accident_history_2yr: 5, defects: [], officer_name: "Shri C. Reddy", office_phone: "040-23456789", coordinates: { lat: 17.4156, lon: 78.4347 } },
  { name: "Hosur Road", city: "Bengaluru", state: "Karnataka", type: "Highway", score: 44, status: "At Risk", contractor: "NCC Limited", last_repaired: "2023-01-10", sanctioned_cr: 180, spent_cr: 178, pothole_count: 68, accident_history_2yr: 33, defects: ["Potholes", "Cracks"], officer_name: "Shri M. Gowda", office_phone: "080-29760888", coordinates: { lat: 12.8996, lon: 77.6353 } },
];

// Configure your backend URL via Vercel env var VITE_API_BASE (e.g. https://api.your-domain.com).
// Falls back to localhost in dev; if unreachable, MOCK_ROADS are returned so the UI keeps working.
const API =
  (import.meta.env.VITE_API_BASE as string | undefined) ||
  (typeof window !== "undefined" && (window as { __RW_API__?: string }).__RW_API__) ||
  "http://localhost:8000";

async function safeFetch<T>(path: string, init?: RequestInit, fallback?: T): Promise<T> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 1800);
    const res = await fetch(`${API}${path}`, { ...init, signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) throw new Error(String(res.status));
    return (await res.json()) as T;
  } catch {
    if (fallback !== undefined) return fallback;
    throw new Error("API unavailable");
  }
}

export const api = {
  roads: () => safeFetch<Road[]>("/roads", undefined, MOCK_ROADS),
  worst: () =>
    safeFetch<Road[]>(
      "/roads/worst",
      undefined,
      [...MOCK_ROADS].sort((a, b) => a.score - b.score).slice(0, 5),
    ),
  budgetIssues: () =>
    safeFetch<Road[]>(
      "/roads/budget-issues",
      undefined,
      MOCK_ROADS.filter((r) => r.spent_cr / r.sanctioned_cr > 0.93),
    ),
  chat: (message: string, history: { role: string; content: string }[]) =>
    safeFetch<{ reply: string; history: { role: string; content: string }[] }>(
      "/chat",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history }),
      },
      {
        reply: mockReply(message),
        history: [...history, { role: "user", content: message }, { role: "assistant", content: mockReply(message) }],
      },
    ),
};

function mockReply(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("worst") || m.includes("critical"))
    return "The most critical road right now is **NH-44 (Delhi-Sonipat)** with a score of 33/100 — 142 potholes detected and 67 accidents in the past 2 years. Contractor: Sadbhav Engineering. 📍 28.7041° N, 77.1025° E";
  if (m.includes("budget") || m.includes("money"))
    return "I've flagged 4 roads where 93%+ of sanctioned budget was spent with minimal road improvement. The biggest red flag: **MG Road, Bengaluru** — ₹46Cr of ₹48Cr spent, score still 39/100.";
  if (m.includes("bengaluru") || m.includes("bangalore"))
    return "Bengaluru has 4 monitored roads. Most critical: **MG Road** (39/100). Outer Ring Road and Hosur Road both flagged. 📍 12.9716° N, 77.5946° E";
  if (m.includes("hello") || m.includes("hi"))
    return "Hello! I'm RoadWatch AI, powered by LLaMA 3.3. Ask me about road safety scores, budget mismanagement, or specific roads in any monitored city.";
  return "I'm running in offline-demo mode (backend not reachable). Try: 'show worst roads', 'budget issues', or 'critical roads in Bengaluru'.";
}

// Severity helpers
export const scoreColor = (s: number) =>
  s >= 75 ? "var(--green)" : s >= 55 ? "var(--yellow)" : s >= 40 ? "var(--orange)" : "var(--red)";

export const scoreLabel = (s: number) =>
  s >= 75 ? "GOOD" : s >= 55 ? "FAIR" : s >= 40 ? "AT RISK" : "CRITICAL";
