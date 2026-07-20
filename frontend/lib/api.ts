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

/** GET /questions — returns the 40 Likert questions only (categorical ones excluded). */
export async function fetchQuestions(): Promise<Question[]> {
  const res = await fetch(`${API_URL}/questions`);
  if (!res.ok) throw new Error("Couldn't load questions. Is the backend running on " + API_URL + "?");
  const data: { questions: Array<{ id: number; text: string; type?: string }> } = await res.json();
  return data.questions
    .filter((q) => q.type !== "multi_select" && q.type !== "single_select")
    .map((q) => ({ id: q.id, text: q.text }));
}

/** POST /branch-fit — sends 40 answers (each 1–5) plus optional categorical answers. */
export async function submitAnswers(
  answers: number[],
  workSetting?: string[],
  ageGroup?: string,
  careerVision?: string,
): Promise<BranchFitResponse> {
  const body: Record<string, unknown> = { answers };
  if (workSetting && workSetting.length > 0) body.work_setting = workSetting;
  if (ageGroup) body.age_group = ageGroup;
  if (careerVision) body.career_vision = careerVision;

  const res = await fetch(`${API_URL}/branch-fit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err: { detail?: string } = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? "Something went wrong computing your results.");
  }
  return res.json();
}
