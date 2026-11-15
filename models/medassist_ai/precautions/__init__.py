"""Phase B2: Symptom-Specific Precautions and Healthcare Specialty Intelligence.

Research-only symptom precautions, specialty mapping, and facility navigation
preparation contracts for MedAssist Phase B2 and Phase B3.
"""
from __future__ import annotations

from .contracts import (
    FacilityNavigationContract,
    FacilityTierId,
    PrecautionGuidance,
    SpecialtyId,
    SpecialtyRecommendation,
    SymptomCategory,
    SymptomPrecautionRecord,
    UrgencyGuidanceDetails,
)
from .engine import PrecautionsEngine, evaluate_precautions_and_specialty

__all__ = [
    "FacilityNavigationContract",
    "FacilityTierId",
    "PrecautionGuidance",
    "PrecautionsEngine",
    "SpecialtyId",
    "SpecialtyRecommendation",
    "SymptomCategory",
    "SymptomPrecautionRecord",
    "UrgencyGuidanceDetails",
    "evaluate_precautions_and_specialty",
]
