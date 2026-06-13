import numpy as np
from data.questions import QUESTIONS, DIMENSIONS
from data.profiles import SPECIALTY_PROFILES, DIM_LABELS


def compute_dimension_scores(answers: list[int]) -> dict[str, float]:
    """
    Convert 35 raw Likert answers (1–5) into 10 dimension scores (0–10).

    Steps:
    1. Reverse-score flagged questions:  adj = 6 - raw
    2. Normalise each adjusted score to 0–10:  norm = (adj - 1) / 4 * 10
    3. Average all normalised scores per dimension
    """
    dim_totals: dict[str, float] = {d: 0.0 for d in DIMENSIONS}
    dim_counts: dict[str, int]   = {d: 0   for d in DIMENSIONS}

    for i, question in enumerate(QUESTIONS):
        raw = answers[i]
        adjusted   = (6 - raw) if question["reverse"] else raw
        normalised = (adjusted - 1) / 4 * 10          # maps 1–5 → 0–10

        dim = question["dimension"]
        dim_totals[dim] += normalised
        dim_counts[dim] += 1

    return {
        dim: round(dim_totals[dim] / dim_counts[dim], 4)
        for dim in DIMENSIONS
        if dim_counts[dim] > 0
    }


def cosine_similarity(vec_a: np.ndarray, vec_b: np.ndarray) -> float:
    """Return cosine similarity in [0, 1]. Returns 0.0 for zero vectors."""
    norm_a = np.linalg.norm(vec_a)
    norm_b = np.linalg.norm(vec_b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(vec_a, vec_b) / (norm_a * norm_b))


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


def rank_specialties(answers: list[int]) -> dict:
    """
    Main entry point.

    Args:
        answers: List of 35 integers (1–5), one per question in order.

    Returns:
        {
          "dimension_scores": { dim: score, ... },   # aspirant's 10 scores
          "top_matches": [ { specialty, type, fit_score, matched_traits, mismatched_traits }, ... ]
        }
    """
    aspirant_scores = compute_dimension_scores(answers)
    aspirant_vector = np.array([aspirant_scores[d] for d in DIMENSIONS])

    results = []

    for name, data in SPECIALTY_PROFILES.items():
        sp_scores = data["scores"]
        sp_vector = np.array([sp_scores[d] for d in DIMENSIONS])

        fit_pct  = round(cosine_similarity(aspirant_vector, sp_vector) * 100, 1)
        matched, mismatched = get_matched_mismatched(aspirant_scores, sp_scores)

        results.append({
            "specialty":         name,
            "type":              data["type"],
            "fit_score":         fit_pct,
            "matched_traits":    matched,
            "mismatched_traits": mismatched,
        })

    results.sort(key=lambda x: x["fit_score"], reverse=True)

    return {
        "dimension_scores": aspirant_scores,
        "top_matches":      results[:5],
    }
