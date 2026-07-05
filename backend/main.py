from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from models import BranchFitRequest, BranchFitResponse, DimensionScores, SpecialtyResult
from engine.scorer import rank_specialties
from data.questions import QUESTIONS

app = FastAPI(
    title="Resilink — Branch Fit Score API",
    description="Rule-based psychometric engine that matches a NEET PG aspirant to the most suitable medical specialties.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],       # tighten to your frontend domain in production
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/", tags=["Health"])
def health():
    return {"status": "ok", "service": "branch-fit-score", "version": "1.0.0"}


# ── Questions ─────────────────────────────────────────────────────────────────

@app.get("/questions", tags=["Questions"])
def get_questions():
    """
    Return all 40 psychometric questions in order.
    Frontend renders these one-by-one and collects answers (1–5).
    """
    return {
        "total": len(QUESTIONS),
        "scale": {"min": 1, "label_min": "Strongly disagree", "max": 5, "label_max": "Strongly agree"},
        "questions": QUESTIONS,
    }


# ── Branch Fit Score ──────────────────────────────────────────────────────────

@app.post("/branch-fit", response_model=BranchFitResponse, tags=["Scoring"])
def compute_branch_fit(request: BranchFitRequest):
    """
    Submit 40 answers and receive a ranked list of the top 5 specialty matches.

    **Request body**
    ```json
    { "answers": [3, 4, 5, 2, ...] }   // exactly 40 integers, each 1–5
    ```

    **Response**
    - `dimension_scores` — aspirant's 10 psychometric dimension scores (0–10)
    - `top_matches`      — top 5 specialties ranked by fit %, with matched and mismatched traits
    """
    try:
        result = rank_specialties(request.answers)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scoring error: {str(e)}")

    return BranchFitResponse(
        dimension_scores=DimensionScores(**result["dimension_scores"]),
        top_matches=[SpecialtyResult(**r) for r in result["top_matches"]],
        total_specialties_evaluated=20,
    )
