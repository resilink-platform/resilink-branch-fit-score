from pydantic import BaseModel, Field, field_validator
from typing import List


class BranchFitRequest(BaseModel):
    answers: List[int] = Field(
        ...,
        description="Exactly 40 integers, each between 1 and 5 (Likert scale).",
        min_length=40,
        max_length=40,
    )

    @field_validator("answers")
    @classmethod
    def validate_range(cls, v: List[int]) -> List[int]:
        for i, ans in enumerate(v):
            if ans < 1 or ans > 5:
                raise ValueError(
                    f"Answer at position {i + 1} is {ans}. Must be between 1 and 5."
                )
        return v


class SpecialtyResult(BaseModel):
    specialty:         str
    type:              str
    fit_score:         float
    matched_traits:    List[str]
    mismatched_traits: List[str]


class DimensionScores(BaseModel):
    procedural:         float
    patient_interaction:float
    work_life_balance:  float
    stress_tolerance:   float
    manual_dexterity:   float
    academic:           float
    emergency:          float
    tech_affinity:      float
    income:             float
    stamina:            float


class BranchFitResponse(BaseModel):
    dimension_scores:            DimensionScores
    top_matches:                 List[SpecialtyResult]
    total_specialties_evaluated: int = 20
