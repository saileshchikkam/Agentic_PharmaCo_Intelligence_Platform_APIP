"""Phase B2: Symptom-Specific Precautions and Healthcare Specialty Intelligence Engine.

Deterministic, rule-based recommendation of symptom-specific precautions,
healthcare specialty intelligence, and Phase B3 facility navigation preparation.
Non-clinical research demonstration.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Set

from models.medassist_ai.severity.contracts import UrgencyAssessment, UrgencyLevel
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

_MODULE_DIR = Path(__file__).resolve().parent
_PRECAUTIONS_KB_PATH = _MODULE_DIR / "precautions_kb.json"
_SPECIALTIES_PATH = _MODULE_DIR / "specialties.json"
_FACILITY_TIERS_PATH = _MODULE_DIR / "facility_tiers.json"


class PrecautionsEngine:
    """Deterministic precautions and specialty intelligence engine."""

    def __init__(
        self,
        precautions_kb_path: Optional[Path] = None,
        specialties_path: Optional[Path] = None,
        facility_tiers_path: Optional[Path] = None,
    ) -> None:
        kb_path = precautions_kb_path or _PRECAUTIONS_KB_PATH
        spec_path = specialties_path or _SPECIALTIES_PATH
        fac_path = facility_tiers_path or _FACILITY_TIERS_PATH

        with open(kb_path, "r", encoding="utf-8") as f:
            self._kb_data = json.load(f)
        with open(spec_path, "r", encoding="utf-8") as f:
            self._specialties_data = json.load(f)
        with open(fac_path, "r", encoding="utf-8") as f:
            self._facility_tiers_data = json.load(f)

        self.precautions_by_id: Dict[str, SymptomPrecautionRecord] = {}
        for item in self._kb_data.get("precautions", []):
            rec = SymptomPrecautionRecord(**item)
            self.precautions_by_id[rec.precaution_id] = rec

        self.specialties_by_id: Dict[str, Dict[str, Any]] = {
            s["specialty_id"]: s for s in self._specialties_data.get("specialties", [])
        }
        self.facility_tiers_by_id: Dict[str, Dict[str, Any]] = {
            t["tier_id"]: t for t in self._facility_tiers_data.get("facility_tiers", [])
        }

    def evaluate(
        self,
        urgency_assessment: UrgencyAssessment,
        age: Optional[int] = None,
        is_pregnant: bool = False,
    ) -> PrecautionGuidance:
        """Generate precautions, specialty intelligence, and facility navigation contract."""
        confirmed_symptoms = [s.strip().lower() for s in urgency_assessment.confirmed_symptoms]
        symptom_set = set(confirmed_symptoms)

        # 1. Match Symptom Precautions
        matched_precautions = self._match_precautions(
            symptom_set=symptom_set,
            risk_factors=urgency_assessment.relevant_risk_factors,
            age=age,
            is_pregnant=is_pregnant,
        )

        # 2. Build Urgency Guidance Details
        effective_urgency = urgency_assessment.assessed_urgency or UrgencyLevel.UNABLE_TO_ASSESS
        urgency_guidance = self._build_urgency_guidance(
            urgency=effective_urgency,
            emergency_override=urgency_assessment.emergency_override,
            emergency_trigger=urgency_assessment.emergency_trigger,
        )

        # 3. Recommend Healthcare Specialty
        specialty_rec = self._recommend_specialty(
            urgency_assessment=urgency_assessment,
            symptom_set=symptom_set,
            age=age,
            is_pregnant=is_pregnant,
        )

        # 4. Construct Phase B3 Facility Navigation Contract
        facility_contract = self._build_facility_navigation_contract(
            specialty_rec=specialty_rec,
            urgency=effective_urgency,
            emergency_override=urgency_assessment.emergency_override,
        )

        # Standard disclaimers
        disclaimers = [
            "Research-only demonstrator: not certified medical triage, diagnosis, or clinical advice.",
            "No drug prescriptions, pharmaceutical dosages, or diagnostic conclusions are provided.",
            "In case of life-threatening symptoms, immediately contact emergency services (112 / 108).",
            "Specialty recommendations and facility tiers are based on service capabilities without commercial or brand bias.",
        ]

        return PrecautionGuidance(
            schema_version="medassist.precautions.v1",
            research_only=True,
            clinical_claim=False,
            urgency_assessment=urgency_assessment,
            urgency_guidance=urgency_guidance,
            symptom_precautions=matched_precautions,
            specialty_recommendation=specialty_rec,
            facility_navigation_contract=facility_contract,
            disclaimers=disclaimers,
        )

    def _match_precautions(
        self,
        symptom_set: Set[str],
        risk_factors: List[str],
        age: Optional[int],
        is_pregnant: bool,
    ) -> List[SymptomPrecautionRecord]:
        matched: List[SymptomPrecautionRecord] = []
        matched_ids: Set[str] = set()

        for prec_id, record in self.precautions_by_id.items():
            # Check pediatric / pregnancy special cases
            if record.category == SymptomCategory.PEDIATRIC_PREGNANCY:
                has_ped_factor = any("pediatric" in rf.lower() or "ped" in rf.lower() for rf in risk_factors)
                is_ped = (age is not None and age < 5) or has_ped_factor
                has_preg_factor = any("pregnant" in rf.lower() or "maternal" in rf.lower() for rf in risk_factors)
                is_preg = is_pregnant or has_preg_factor
                if (is_ped or is_preg) and prec_id not in matched_ids:
                    matched.append(record)
                    matched_ids.add(prec_id)
                continue

            # Check overlap between confirmed symptoms and precaution symptom_ids
            record_triggers = {t.lower() for t in record.symptom_ids}
            overlap = symptom_set.intersection(record_triggers)
            # Also check substring match for common descriptions (e.g. "cough" in "persistent cough")
            if not overlap:
                for sym in symptom_set:
                    if any(t in sym or sym in t for t in record_triggers if len(t) >= 4):
                        overlap.add(sym)
                        break

            if overlap and prec_id not in matched_ids:
                matched.append(record)
                matched_ids.add(prec_id)

        # Fallback: if no specific precautions matched but fever or pain is present
        if not matched:
            for prec_id in ["PREC_FEVER_GENERAL", "PREC_HEADACHE_NEURO"]:
                if prec_id in self.precautions_by_id and prec_id not in matched_ids:
                    matched.append(self.precautions_by_id[prec_id])
                    matched_ids.add(prec_id)

        return matched

    def _build_urgency_guidance(
        self,
        urgency: UrgencyLevel,
        emergency_override: bool,
        emergency_trigger: Optional[str],
    ) -> UrgencyGuidanceDetails:
        if emergency_override or urgency == UrgencyLevel.EXTREME:
            return UrgencyGuidanceDetails(
                urgency_level=UrgencyLevel.EXTREME,
                title="Immediate Emergency Services Notification Required",
                recommended_timeframe="IMMEDIATE: Call emergency services (112 / 108 in India or local ambulance) or proceed immediately to the nearest 24x7 Emergency Department.",
                monitoring_advice=[
                    "Monitor breathing rate and depth continuously.",
                    "Keep patient conscious and responsive; talk to them calmly.",
                    "Watch for loss of consciousness, seizures, or sudden worsening of color (cyanosis / pallor).",
                ],
                preparation_for_doctor=[
                    "Locate government identity card and any health insurance papers.",
                    "Gather all active prescription medications, blister packs, and supplements into a clear bag.",
                    "Have exact timeline of symptom onset and changes ready to tell paramedics.",
                ],
                immediate_actions=[
                    "Immediately call 112 / 108 or have a bystander call.",
                    "Sit upright or in a position of greatest breathing ease; loosen tight clothing around neck and waist.",
                    "Unlock the front door and turn on porch lights so emergency responders can enter without delay.",
                    "Keep patient calm, warm, and resting without physical movement.",
                ],
                what_to_avoid=[
                    "DO NOT exert physically, walk around, or climb stairs.",
                    "DO NOT consume food, hot drinks, or water if choking, vomiting, or having acute chest pain.",
                    "DO NOT drive yourself or transport in private vehicle if emergency ambulance is dispatchable.",
                    "DO NOT administer unprescribed medications or sedatives.",
                ],
                emergency_first_aid=[
                    "Ensure an open airway and keep calm.",
                    "If conscious and experiencing crushing chest pain without known aspirin allergy, adopt a semi-seated W-position.",
                    "If breathing stops or responsiveness is lost, begin cardiopulmonary resuscitation (CPR) if trained, or follow dispatcher instructions.",
                ],
                critical_information_for_responders=[
                    f"Emergency trigger noted: {emergency_trigger or 'Critical clinical escalation signs'}.",
                    "Exact time when acute emergency symptoms began.",
                    "Known chronic medical conditions (e.g. cardiac, respiratory, diabetic, kidney).",
                    "Current medications, blood thinners, and drug allergies.",
                ],
            )

        if urgency == UrgencyLevel.HIGH:
            return UrgencyGuidanceDetails(
                urgency_level=UrgencyLevel.HIGH,
                title="Same-Day Urgent Clinical Assessment Required",
                recommended_timeframe="Seek medical evaluation today (within 2 to 4 hours) at a Community Health Centre (CHC), District Hospital, or urgent outpatient clinic.",
                monitoring_advice=[
                    "Check body temperature and pulse every 2 hours.",
                    "Observe for any signs of breathing difficulty, chest tightness, or confusion.",
                    "Monitor ability to tolerate fluids without vomiting.",
                ],
                preparation_for_doctor=[
                    "Bring a complete list of current medications and allergies.",
                    "Note the precise progression of symptoms and highest temperature recorded.",
                    "Bring recent lab or clinic reports if available.",
                ],
                immediate_actions=[
                    "Rest quietly in a well-supported, comfortable position.",
                    "Arrange safe transportation accompanied by a family member or friend.",
                    "Keep oral hydration frequent in small sips.",
                ],
                what_to_avoid=[
                    "DO NOT drive yourself or operate machinery while experiencing intense symptoms.",
                    "DO NOT delay medical assessment until tomorrow.",
                    "DO NOT take unprescribed prescription drugs (antibiotics/steroids).",
                ],
            )

        if urgency == UrgencyLevel.MEDIUM:
            return UrgencyGuidanceDetails(
                urgency_level=UrgencyLevel.MEDIUM,
                title="Timely Outpatient Clinical Consultation Recommended",
                recommended_timeframe="Schedule an appointment with a general practitioner or appropriate specialist within 24 to 48 hours.",
                monitoring_advice=[
                    "Check temperature and symptoms morning and evening.",
                    "Observe for new or worsening warning signs (such as high fever, severe pain, or dehydration).",
                    "Log symptom changes in a notebook or mobile phone.",
                ],
                preparation_for_doctor=[
                    "Write down when symptoms started and what remedies provided relief.",
                    "List all prescription, OTC medications, and vitamins you take regularly.",
                    "Write down questions you want to ask the physician.",
                ],
                immediate_actions=[
                    "Rest comfortably and stay hydrated with water, ORS, or warm broths.",
                    "Follow safe symptom-specific comfort precautions.",
                    "Book an outpatient appointment at a nearby clinic or hospital.",
                ],
                what_to_avoid=[
                    "Avoid strenuous physical workouts or exhausting activities.",
                    "Avoid taking multiple combination cold/pain medicines with identical active ingredients.",
                    "Do not ignore symptoms if they become noticeably worse.",
                ],
            )

        if urgency == UrgencyLevel.LOW:
            return UrgencyGuidanceDetails(
                urgency_level=UrgencyLevel.LOW,
                title="Supportive Self-Care & Non-Pharmacological Comfort Guidance",
                recommended_timeframe="Monitor symptoms at home over the next 24 to 72 hours; consult a primary care clinician if symptoms persist beyond 3-5 days or worsen.",
                monitoring_advice=[
                    "Observe body temperature and overall comfort level once or twice daily.",
                    "Ensure normal urine output (pale yellow color) and regular bowel movements.",
                    "Watch for any unexpected escalation in discomfort.",
                ],
                preparation_for_doctor=[
                    "Keep a simple timeline of when symptoms began and their daily pattern.",
                    "Record any over-the-counter soothing measures tried.",
                ],
                immediate_actions=[
                    "Ensure adequate sleep and resting periods.",
                    "Maintain continuous hydration with oral fluids (water, soups, electrolyte fluids).",
                    "Wear comfortable, loose-fitting cotton clothing.",
                ],
                what_to_avoid=[
                    "Avoid heavy physical exertion and sleep deprivation.",
                    "Do not self-prescribe antibiotics or unverified medications.",
                    "Avoid active and passive tobacco smoke and alcohol consumption.",
                ],
            )

        # UNABLE_TO_ASSESS fallback
        return UrgencyGuidanceDetails(
            urgency_level=UrgencyLevel.UNABLE_TO_ASSESS,
            title="Incomplete Evidence — Professional Medical Evaluation Recommended",
            recommended_timeframe="Consult a licensed medical professional in person for physical examination and objective assessment.",
            monitoring_advice=[
                "Monitor for any red-flag emergency symptoms (chest pain, breathing difficulty, severe headache).",
                "Observe whether symptoms are improving, staying the same, or progressing.",
            ],
            preparation_for_doctor=[
                "List all symptoms clearly with their chronological onset.",
                "Bring all prescription medications and medical history documents.",
            ],
            immediate_actions=[
                "Rest in a quiet, safe environment.",
                "Seek in-person medical evaluation at a local primary care clinic or healthcare centre.",
            ],
            what_to_avoid=[
                "Do not assume absence of danger simply because symptoms cannot be fully classified online.",
                "Do not start medications without clinical examination.",
            ],
        )

    def _recommend_specialty(
        self,
        urgency_assessment: UrgencyAssessment,
        symptom_set: Set[str],
        age: Optional[int],
        is_pregnant: bool,
    ) -> SpecialtyRecommendation:
        # 1. Emergency override: absolute priority
        if urgency_assessment.emergency_override or urgency_assessment.assessed_urgency == UrgencyLevel.EXTREME:
            em = self.specialties_by_id["emergency_medicine"]
            return SpecialtyRecommendation(
                primary_specialty=SpecialtyId.EMERGENCY_MEDICINE,
                primary_specialty_name=em["name"],
                alternative_specialty=SpecialtyId.GENERAL_MEDICINE,
                alternative_specialty_name=self.specialties_by_id["general_medicine"]["name"],
                rationale="Assessed urgency is Extreme or emergency safety warning signs were detected. Immediate Emergency Medicine evaluation and resuscitation takes absolute clinical precedence.",
                emergency_override=True,
                confidence_factor=1.0,
            )

        # 2. Pediatric context: age < 18 (especially < 5)
        is_pediatric = (age is not None and age < 18) or any("pediatric" in rf.lower() for rf in urgency_assessment.relevant_risk_factors)
        if is_pediatric:
            peds = self.specialties_by_id["paediatrics"]
            return SpecialtyRecommendation(
                primary_specialty=SpecialtyId.PAEDIATRICS,
                primary_specialty_name=peds["name"],
                alternative_specialty=SpecialtyId.FAMILY_MEDICINE,
                alternative_specialty_name=self.specialties_by_id["family_medicine"]["name"],
                rationale=f"Patient is a child or adolescent (age {age if age is not None else '<18'}). Specialized paediatric evaluation is indicated for safe age-specific diagnosis and dosing.",
                emergency_override=False,
                confidence_factor=0.95,
            )

        # 3. Pregnancy / Obstetric context
        if is_pregnant or any("maternal" in rf.lower() or "pregnant" in rf.lower() for rf in urgency_assessment.relevant_risk_factors):
            obgyn = self.specialties_by_id["obstetrics_gynaecology"]
            return SpecialtyRecommendation(
                primary_specialty=SpecialtyId.OBSTETRICS_GYNAECOLOGY,
                primary_specialty_name=obgyn["name"],
                alternative_specialty=SpecialtyId.FAMILY_MEDICINE,
                alternative_specialty_name=self.specialties_by_id["family_medicine"]["name"],
                rationale="Maternal or pregnancy context requires specialized obstetric & gynaecological evaluation for fetal and maternal safety.",
                emergency_override=False,
                confidence_factor=0.95,
            )

        # 4. Multi-symptom mapping based on specific symptom triggers
        # Pulmonary
        pulm_triggers = {"e_201", "cough", "coughing", "e_203", "intense coughing fits", "e_212", "hoarse voice", "wheezing"}
        if symptom_set.intersection(pulm_triggers):
            spec = self.specialties_by_id["pulmonology"]
            return SpecialtyRecommendation(
                primary_specialty=SpecialtyId.PULMONOLOGY,
                primary_specialty_name=spec["name"],
                alternative_specialty=SpecialtyId.FAMILY_MEDICINE,
                alternative_specialty_name=self.specialties_by_id["family_medicine"]["name"],
                rationale="Confirmed respiratory symptoms (cough, coughing fits, or airway involvement) indicate Pulmonology or General Practice assessment.",
                emergency_override=False,
                confidence_factor=0.9,
            )

        # Dermatology
        derm_triggers = {"e_129", "rash", "rash or skin lesions", "skin lesions", "e_151", "swelling", "itching"}
        if symptom_set.intersection(derm_triggers):
            spec = self.specialties_by_id["dermatology"]
            return SpecialtyRecommendation(
                primary_specialty=SpecialtyId.DERMATOLOGY,
                primary_specialty_name=spec["name"],
                alternative_specialty=SpecialtyId.GENERAL_MEDICINE,
                alternative_specialty_name=self.specialties_by_id["general_medicine"]["name"],
                rationale="Confirmed dermatological signs (rash, skin lesions, or localized swelling) indicate specialized skin evaluation.",
                emergency_override=False,
                confidence_factor=0.9,
            )

        # ENT
        ent_triggers = {"e_97", "sore throat", "e_181", "nasal congestion or clear runny nose", "e_182", "green or yellow nasal discharge", "e_103", "loss of smell", "earache", "throat pain"}
        if symptom_set.intersection(ent_triggers):
            spec = self.specialties_by_id["ent"]
            return SpecialtyRecommendation(
                primary_specialty=SpecialtyId.ENT,
                primary_specialty_name=spec["name"],
                alternative_specialty=SpecialtyId.FAMILY_MEDICINE,
                alternative_specialty_name=self.specialties_by_id["family_medicine"]["name"],
                rationale="Confirmed upper airway, nasal, or pharyngeal complaints indicate Ear, Nose & Throat (ENT) examination.",
                emergency_override=False,
                confidence_factor=0.9,
            )

        # Ophthalmology
        eye_triggers = {"e_74", "red eyes", "e_127", "excessive tears", "e_170", "severe eye itching", "eye redness"}
        if symptom_set.intersection(eye_triggers):
            spec = self.specialties_by_id["ophthalmology"]
            return SpecialtyRecommendation(
                primary_specialty=SpecialtyId.OPHTHALMOLOGY,
                primary_specialty_name=spec["name"],
                alternative_specialty=SpecialtyId.GENERAL_MEDICINE,
                alternative_specialty_name=self.specialties_by_id["general_medicine"]["name"],
                rationale="Confirmed ocular symptoms (red eyes, excessive tearing, eye itching) indicate dedicated ophthalmological evaluation.",
                emergency_override=False,
                confidence_factor=0.9,
            )

        # Gastroenterology
        gi_triggers = {"e_51", "diarrhea", "e_148", "nausea", "e_211", "repeated vomiting", "e_30", "abdominal bloating", "stomach pain", "abdominal pain"}
        if symptom_set.intersection(gi_triggers):
            spec = self.specialties_by_id["gastroenterology"]
            return SpecialtyRecommendation(
                primary_specialty=SpecialtyId.GASTROENTEROLOGY,
                primary_specialty_name=spec["name"],
                alternative_specialty=SpecialtyId.GENERAL_MEDICINE,
                alternative_specialty_name=self.specialties_by_id["general_medicine"]["name"],
                rationale="Confirmed gastrointestinal symptoms (diarrhea, repeated vomiting, or abdominal distress) indicate Gastroenterology or Internal Medicine evaluation.",
                emergency_override=False,
                confidence_factor=0.9,
            )

        # Orthopaedics / Musculoskeletal
        ortho_triggers = {"e_144", "diffuse muscle pain", "body aches", "back pain", "joint pain", "muscle pain"}
        if symptom_set.intersection(ortho_triggers):
            spec = self.specialties_by_id["orthopaedics"]
            return SpecialtyRecommendation(
                primary_specialty=SpecialtyId.ORTHOPAEDICS,
                primary_specialty_name=spec["name"],
                alternative_specialty=SpecialtyId.GENERAL_MEDICINE,
                alternative_specialty_name=self.specialties_by_id["general_medicine"]["name"],
                rationale="Confirmed musculoskeletal or body pain complaints indicate Orthopaedic or General Medicine review.",
                emergency_override=False,
                confidence_factor=0.85,
            )

        # Dental
        dental_triggers = {"toothache", "dental pain", "mouth ulcer", "gum swelling", "bleeding gums", "tooth pain"}
        if symptom_set.intersection(dental_triggers):
            spec = self.specialties_by_id["dentistry"]
            return SpecialtyRecommendation(
                primary_specialty=SpecialtyId.DENTISTRY,
                primary_specialty_name=spec["name"],
                alternative_specialty=SpecialtyId.ENT,
                alternative_specialty_name=self.specialties_by_id["ent"]["name"],
                rationale="Confirmed oral or dental symptoms indicate direct dental examination.",
                emergency_override=False,
                confidence_factor=0.95,
            )

        # Default fallback: General Medicine / Family Medicine
        gm = self.specialties_by_id["general_medicine"]
        return SpecialtyRecommendation(
            primary_specialty=SpecialtyId.GENERAL_MEDICINE,
            primary_specialty_name=gm["name"],
            alternative_specialty=SpecialtyId.FAMILY_MEDICINE,
            alternative_specialty_name=self.specialties_by_id["family_medicine"]["name"],
            rationale="Generalized or multi-system presentation (fever, malaise, or constitutional symptoms) is best evaluated initially by General Medicine / Internal Medicine.",
            emergency_override=False,
            confidence_factor=0.85,
        )

    def _build_facility_navigation_contract(
        self,
        specialty_rec: SpecialtyRecommendation,
        urgency: UrgencyLevel,
        emergency_override: bool,
    ) -> FacilityNavigationContract:
        spec_data = self.specialties_by_id.get(specialty_rec.primary_specialty.value, {})
        base_capabilities = list(spec_data.get("required_capabilities", []))

        is_emergency = emergency_override or urgency == UrgencyLevel.EXTREME
        if is_emergency:
            emergency_caps = [
                "emergency_resuscitation",
                "advanced_cardiac_life_support",
                "emergency_airway_management",
                "24x7_emergency_services",
                "trauma_stabilization",
            ]
            for cap in emergency_caps:
                if cap not in base_capabilities:
                    base_capabilities.append(cap)

        # Filter eligible facility tiers matching urgency without brand or size bias
        eligible_tiers: List[FacilityTierId] = []
        for tier_id, tier_info in self.facility_tiers_by_id.items():
            urgencies_allowed = tier_info.get("eligible_urgencies", [])
            urgency_str = urgency.value if isinstance(urgency, UrgencyLevel) else str(urgency)

            if is_emergency:
                # Emergency requires emergency-capable facilities
                if tier_info.get("emergency_capable", False) and "extreme" in urgencies_allowed:
                    eligible_tiers.append(FacilityTierId(tier_id))
            else:
                if urgency_str in urgencies_allowed:
                    eligible_tiers.append(FacilityTierId(tier_id))

        # Verification requirements
        verification_reqs = [
            "verified_specialist_consultation",
            "active_operating_hours",
        ]
        if is_emergency or urgency == UrgencyLevel.HIGH:
            verification_reqs.insert(0, "24x7_operation")
            verification_reqs.append("inpatient_bed_availability")

        # Explicit exclusions
        exclusions: List[str] = []
        if is_emergency:
            exclusions = [
                "outpatient_only_clinics_without_emergency_resuscitation",
                "diagnostic_imaging_centres_without_resuscitation_capacity",
                "primary_health_centres_lacking_24x7_trauma_care",
            ]
        elif urgency == UrgencyLevel.HIGH:
            exclusions = [
                "standalone_diagnostic_centres_without_consulting_physicians",
            ]

        return FacilityNavigationContract(
            schema_version="medassist.facility-navigation.v1",
            research_only=True,
            clinical_claim=False,
            required_service=specialty_rec.primary_specialty_name,
            alternative_service=specialty_rec.alternative_specialty_name,
            required_capabilities=base_capabilities,
            urgency_level=urgency,
            emergency_department_required=is_emergency,
            facility_verification_requirements=verification_reqs,
            explicit_exclusions=exclusions,
            eligible_facility_tiers=eligible_tiers,
        )


def evaluate_precautions_and_specialty(
    urgency_assessment: UrgencyAssessment,
    age: Optional[int] = None,
    is_pregnant: bool = False,
) -> PrecautionGuidance:
    """Convenience helper function to run the PrecautionsEngine."""
    engine = PrecautionsEngine()
    return engine.evaluate(
        urgency_assessment=urgency_assessment,
        age=age,
        is_pregnant=is_pregnant,
    )
