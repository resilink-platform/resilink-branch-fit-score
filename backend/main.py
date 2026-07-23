from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
import os
import sys
import traceback

from models import BranchFitRequest, BranchFitResponse, DimensionScores, SpecialtyResult
from engine.scorer import rank_specialties
from data.questions import QUESTIONS
from db import supabase

app = FastAPI(
    title="Resilink — Branch Fit Score API",
    description="Psychometric engine matching NEET PG aspirants to medical specialties.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

ADMIN_KEY = os.getenv("ADMIN_KEY", "resilink-admin-secret")


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/", tags=["Health"])
def health():
    return {"status": "ok", "service": "branch-fit-score", "version": "1.0.0"}


# ── DB check ─────────────────────────────────────────────────────────────────

@app.get("/db-check", tags=["Health"])
def db_check():
    """Quick Supabase connectivity test — hit this before /branch-fit."""
    import inspect
    client_type = type(supabase).__name__
    try:
        res = supabase.table("branch_fit_responses").select("id").limit(1).execute()
        return {
            "supabase_client_type": client_type,
            "execute_return_type": type(res).__name__,
            "data": res.data,
            "status": "connected",
        }
    except Exception as e:
        return {
            "supabase_client_type": client_type,
            "status": "error",
            "error_type": type(e).__name__,
            "error": str(e),
        }


# ── Questions ─────────────────────────────────────────────────────────────────

@app.get("/questions", tags=["Questions"])
def get_questions():
    return {
        "total": len(QUESTIONS),
        "scale": {
            "min": 1, "label_min": "Strongly disagree",
            "max": 5, "label_max": "Strongly agree"
        },
        "questions": QUESTIONS,
    }


# ── Aspirant — score + save ───────────────────────────────────────────────────

@app.post("/branch-fit", response_model=BranchFitResponse, tags=["Scoring"])
def compute_branch_fit(request: BranchFitRequest):
    """
    Aspirant submits 40 answers → get top 5 specialty matches.
    Result is saved anonymously to Supabase.
    """
    categorical_answers = {
        "work_setting": request.work_setting or [],
        "age_group":    request.age_group or "no_preference",
        "career_vision": request.career_vision or "",
    }
    try:
        result = rank_specialties(request.answers, categorical_answers)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scoring error: {str(e)}")

    # Save to Supabase (anonymous — no user_id required for aspirants yet)
    print("[DB] Attempting Supabase insert...", flush=True)
    try:
        res = supabase.table("branch_fit_responses").insert({
            "user_id":          request.user_id or "anonymous",
            "respondent_type":  "aspirant",
            "schema_version":   "v1",
            "raw_answers":      request.answers,
            "dimension_scores": result["dimension_scores"],
            "top_matches":      result["top_matches"],
            "is_complete":      True,
            "completion_secs":  request.completion_secs,
            "specialty_name":   None,
        }).execute()
        print(f"[DB] execute() returned: type={type(res).__name__} value={res!r}", flush=True)
        # supabase-py v1 surfaces errors in res.error rather than raising
        if hasattr(res, "error") and res.error:
            print(f"[ERROR] Supabase insert failed (API error): {res.error}", flush=True)
        else:
            print(f"[INFO] Supabase insert OK — rows saved: {len(res.data) if res.data else 0}", flush=True)
    except Exception as e:
        # Don't fail the request if DB save fails — user still gets their result
        print(f"[ERROR] Supabase insert exception: {type(e).__name__}: {e}", flush=True)
        traceback.print_exc(file=sys.stdout)
        sys.stdout.flush()

    return BranchFitResponse(
        dimension_scores=DimensionScores(**result["dimension_scores"]),
        top_matches=[SpecialtyResult(**r) for r in result["top_matches"]],
        total_specialties_evaluated=20,
    )


# ── Resident — submit psychometric data ──────────────────────────────────────

@app.post("/resident/submit", tags=["Resident"])
def resident_submit(request: BranchFitRequest):
    """
    Resident submits 40 answers → saved with their specialty tag.
    This data builds the empirical specialty profiles over time.
    """
    if not request.user_id:
        raise HTTPException(status_code=400, detail="user_id is required for resident submissions.")
    if not request.specialty:
        raise HTTPException(status_code=400, detail="specialty is required for resident submissions.")

    categorical_answers = {
        "work_setting":  request.work_setting or [],
        "age_group":     request.age_group or "no_preference",
        "career_vision": request.career_vision or "",
    }
    try:
        result = rank_specialties(request.answers, categorical_answers)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scoring error: {str(e)}")

    try:
        supabase.table("branch_fit_responses").insert({
            "user_id":            request.user_id,
            "respondent_type":    "resident",
            "schema_version":     "v1",
            "specialty_id":       None,
            "specialty_name":     request.specialty,
            "raw_answers":        request.answers,
            "dimension_scores":   result["dimension_scores"],
            "top_matches":        result["top_matches"],
            "was_first_choice":   request.was_first_choice,
            "year_of_residency":  request.year_of_residency,
            "completion_secs":    request.completion_secs,
            "is_complete":        True,
            "would_choose_again": request.would_choose_again,
            "workload_reality":   request.workload_reality,
            "institute_type":     request.institute_type,
        }).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB error: {str(e)}")

    return BranchFitResponse(
        dimension_scores=DimensionScores(**result["dimension_scores"]),
        top_matches=[SpecialtyResult(**r) for r in result["top_matches"]],
        total_specialties_evaluated=20,
    )


# ── Admin — compute empirical profiles ───────────────────────────────────────

@app.get("/admin/profiles/computed", tags=["Admin"])
def get_computed_profiles(x_admin_key: str = Header(...)):
    """
    Averages all resident submissions per specialty.
    Returns empirical profiles ready to replace the hand-authored ones.
    Only accessible with the admin key.
    """
    if x_admin_key != ADMIN_KEY:
        raise HTTPException(status_code=403, detail="Invalid admin key.")

    try:
        res = supabase.table("branch_fit_responses") \
            .select("specialty_id, dimension_scores, was_first_choice, completion_secs") \
            .eq("respondent_type", "resident") \
            .eq("is_complete", True) \
            .execute()

        rows = res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB error: {str(e)}")

    if not rows:
        return {"message": "No resident data yet.", "profiles": {}}

    DIMS = [
        "procedural", "patient_interaction", "work_life_balance", "stress_tolerance",
        "manual_dexterity", "academic", "emergency", "tech_affinity", "income", "stamina"
    ]

    # Group by specialty, filter quality
    from collections import defaultdict
    grouped = defaultdict(list)
    for row in rows:
        # Quality filters
        if row.get("completion_secs") and row["completion_secs"] < 90:
            continue  # too fast = spam
        if row.get("was_first_choice") is False:
            continue  # rank-pushed, not genuine
        if row.get("specialty_id"):
            grouped[row["specialty_id"]].append(row["dimension_scores"])

    computed = {}
    for specialty_id, scores_list in grouped.items():
        if len(scores_list) < 3:  # minimum 3 residents before trusting the average
            continue
        avg = {}
        for dim in DIMS:
            values = [s[dim] for s in scores_list if dim in s]
            avg[dim] = round(sum(values) / len(values), 2) if values else 0.0
        computed[specialty_id] = {
            "n_residents": len(scores_list),
            "profile": avg,
        }

    return {
        "total_specialties": len(computed),
        "note": "Only includes genuine first-choice residents with completion_secs > 90",
        "profiles": computed,
    }