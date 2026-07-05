/* lib/api.ts — all backend communication lives here (single place to change the API). */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001";

export interface Question {
  id: number;
  text: string;
}

export interface DimensionScores {
  procedural: number;
  patient_interaction: number;
  work_life_balance: number;
  stress_tolerance: number;
  manual_dexterity: number;
  academic: number;
  emergency: number;
  tech_affinity: number;
  income: number;
  stamina: number;
}

export interface SpecialtyResult {
  specialty: string;
  type: string;
  fit_score: number;
  matched_traits: string[];
  mismatched_traits: string[];
}

export interface BranchFitResponse {
  dimension_scores: DimensionScores;
  top_matches: SpecialtyResult[];
  total_specialties_evaluated: number;
}

/** GET /questions — returns the 40 questions in order (id + text only). */
export async function fetchQuestions(): Promise<Question[]> {
  const res = await fetch(`${API_URL}/questions`);
  if (!res.ok) throw new Error("Couldn't load questions. Is the backend running on " + API_URL + "?");
  const data: { questions: Array<{ id: number; text: string }> } = await res.json();
  return data.questions.map((q) => ({ id: q.id, text: q.text }));
}

/** POST /branch-fit — sends 40 answers (each 1–5), returns ranked specialty matches. */
export async function submitAnswers(answers: number[]): Promise<BranchFitResponse> {
  const res = await fetch(`${API_URL}/branch-fit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answers }),
  });
  if (!res.ok) {
    const err: { detail?: string } = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? "Something went wrong computing your results.");
  }
  return res.json();
}