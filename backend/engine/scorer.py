import numpy as np
from data.questions import QUESTIONS, DIMENSIONS
from data.profiles import SPECIALTY_PROFILES, DIM_LABELS

# Exclude "categorical" — not a Likert scoring dimension
SCORING_DIMS = [d for d in DIMENSIONS if d != "categorical"]


def compute_dimension_scores(answers: list[int]) -> dict[str, float]:
    """
    Convert 40 raw Likert answers (1–5) into 10 dimension scores (0–10).

    Steps:
    1. Reverse-score flagged questions:  adj = 6 - raw
    2. Normalise each adjusted score to 0–10:  norm = (adj - 1) / 4 * 10
    3. Average all normalised scores per dimension
    """
    dim_totals: dict[str, float] = {d: 0.0 for d in SCORING_DIMS}
    dim_counts: dict[str, int]   = {d: 0   for d in SCORING_DIMS}

    likert_qs = [q for q in QUESTIONS if q.get("dimension") != "categorical"]
    for i, question in enumerate(likert_qs):
        raw = answers[i]
        adjusted   = (6 - raw) if question["reverse"] else raw
        normalised = (adjusted - 1) / 4 * 10          # maps 1–5 → 0–10

        dim = question["dimension"]
        dim_totals[dim] += normalised
        dim_counts[dim] += 1

    return {
        dim: round(dim_totals[dim] / dim_counts[dim], 4)
        for dim in SCORING_DIMS
        if dim_counts[dim] > 0
    }


def cosine_similarity(vec_a: np.ndarray, vec_b: np.ndarray) -> float:
    """Return cosine similarity in [0, 1]. Returns 0.0 for zero vectors."""
    norm_a = np.linalg.norm(vec_a)
    norm_b = np.linalg.norm(vec_b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(vec_a, vec_b) / (norm_a * norm_b))


def mean_centered_cosine(vec_a: np.ndarray, vec_b: np.ndarray) -> float:
    """
    Pearson-correlation similarity (mean-centered cosine).

    WHY: Raw cosine on all-positive vectors always produces 95–99% because
    any two vectors pointing "generally upward" look similar. Subtracting
    each vector's own mean centers them around 0, so only vectors with a
    matching *shape* (same peaks/valleys across dimensions) score high.

    Result: scores spread naturally across ~40–90% range.
    Negative correlations (opposite profiles) are clamped to 0.
    """
    a = vec_a - vec_a.mean()   # center aspirant around their own average
    b = vec_b - vec_b.mean()   # center specialty around its own average
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        # Flat vector (all dims equal) — no profile shape to compare
        return 0.0
    return max(0.0, float(np.dot(a, b) / (norm_a * norm_b)))


def get_matched_mismatched(
    aspirant: dict[str, float],
    specialty: dict[str, int],
) -> tuple[list[str], list[str]]:
    """
    Identify strongly matched and mismatched traits.

    A dimension is evaluated only when the specialty demands it highly (score ≥ 7).
    - Matched:    aspirant score ≥ 6  (aspirant has what the specialty needs)
    - Mismatched: aspirant score ≤ 3  (aspirant lacks what the specialty needs)
    """
    matched    = []
    mismatched = []

    for dim, sp_score in specialty.items():
        if sp_score >= 7:
            asp_score = aspirant.get(dim, 5.0)
            label     = DIM_LABELS.get(dim, dim)
            if asp_score >= 6:
                matched.append(label)
            elif asp_score <= 3:
                mismatched.append(label)

    return matched, mismatched


def apply_categorical_multipliers(
    base_scores: dict[str, float],
    categorical_answers: dict,
) -> dict[str, float]:
    """
    Applies multipliers to base fit scores based on Q41, Q42, Q43 answers.
    base_scores: {specialty_name: fit_score}
    categorical_answers: {
        "work_setting": ["or_procedures", "icu_emergency"],  # list, Q41
        "age_group": "adults",                               # string, Q42
        "career_vision": "private_practice"                  # string, Q43
    }
    Returns adjusted scores dict.
    """
    scores = dict(base_scores)

    # Q41 — Work setting multipliers
    work_settings = categorical_answers.get("work_setting", [])
    setting_boosts = {
        "or_procedures":     ["General Surgery", "Orthopedics", "OBG", "Ophthalmology", "ENT", "Anesthesiology"],
        "icu_emergency":     ["Emergency Medicine", "Anesthesiology", "Pediatrics", "General Medicine"],
        "opd_clinic":        ["General Medicine", "Pediatrics", "Psychiatry", "Dermatology (DVL)", "Pulmonary Medicine"],
        "lab_microscopy":    ["Pathology", "Microbiology", "Biochemistry", "Pharmacology"],
        "radiology_console": ["Radiology"],
        "community":         ["Community Medicine (PSM)", "Forensic Medicine"],
    }
    for setting in work_settings:
        for specialty in setting_boosts.get(setting, []):
            if specialty in scores:
                scores[specialty] *= 1.12

    # Q42 — Age group multipliers
    age_group = categorical_answers.get("age_group", "no_preference")
    age_boosts = {
        "neonates_children":  ["Pediatrics", "OBG"],
        "adults":             ["General Medicine", "General Surgery", "Orthopedics", "Psychiatry", "Pulmonary Medicine"],
        "prefer_no_patients": ["Radiology", "Pathology", "Microbiology", "Pharmacology", "Biochemistry", "Anatomy", "Forensic Medicine"],
        "no_preference":      [],
    }
    for specialty in age_boosts.get(age_group, []):
        if specialty in scores:
            scores[specialty] *= 1.15

    # Q43 — Career vision multipliers
    career_vision = categorical_answers.get("career_vision", "")
    career_boosts = {
        "superspecialization": ["General Medicine", "General Surgery", "Pediatrics", "Radiology", "Anesthesiology"],
        "private_practice":    ["Dermatology (DVL)", "Orthopedics", "Ophthalmology", "ENT", "Radiology"],
        "teaching_academics":  ["Pharmacology", "Physiology", "Biochemistry", "Anatomy", "Pathology", "Microbiology", "Community Medicine (PSM)"],
        "public_health":       ["Community Medicine (PSM)", "Forensic Medicine", "General Medicine"],
        "research_industry":   ["Pharmacology", "Microbiology", "Biochemistry", "Pathology"],
        "entrepreneurship":    ["Dermatology (DVL)", "Ophthalmology", "Radiology", "Orthopedics"],
    }
    for specialty in career_boosts.get(career_vision, []):
        if specialty in scores:
            scores[specialty] *= 1.10

    return scores


def rank_specialties(answers: list[int], categorical_answers: dict | None = None) -> dict:
    """
    Main entry point.

    Args:
        answers: List of 40 integers (1–5), one per question in order.
        categorical_answers: Optional dict with work_setting, age_group, career_vision.

    Returns:
        {
          "dimension_scores": { dim: score, ... },   # aspirant's 10 scores
          "top_matches": [ { specialty, type, fit_score, matched_traits, mismatched_traits }, ... ]
        }
    """
    if categorical_answers is None:
        categorical_answers = {}

    aspirant_scores = compute_dimension_scores(answers)
    aspirant_vector = np.array([aspirant_scores[d] for d in SCORING_DIMS])

    results = []

    for name, data in SPECIALTY_PROFILES.items():
        sp_scores = data["scores"]
        sp_vector = np.array([sp_scores[d] for d in SCORING_DIMS])

        fit_pct  = round(mean_centered_cosine(aspirant_vector, sp_vector) * 100, 1)
        matched, mismatched = get_matched_mismatched(aspirant_scores, sp_scores)

        results.append({
            "specialty":         name,
            "type":              data["type"],
            "fit_score":         fit_pct,
            "matched_traits":    matched,
            "mismatched_traits": mismatched,
        })

    # Apply categorical multipliers when provided
    if categorical_answers:
        base = {r["specialty"]: r["fit_score"] for r in results}
        adjusted = apply_categorical_multipliers(base, categorical_answers)
        for r in results:
            r["fit_score"] = min(99.9, round(adjusted[r["specialty"]], 1))

    results.sort(key=lambda x: x["fit_score"], reverse=True)

    return {
        "dimension_scores": aspirant_scores,
        "top_matches":      results[:5],
    }
