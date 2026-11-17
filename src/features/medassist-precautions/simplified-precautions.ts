/**
 * Phase C1.1: Simplified Recommended Precautions Generator.
 *
 * Produces 4–7 concise, actionable bullet points in simple English,
 * completely grounded in confirmed symptoms and assessed urgency,
 * with zero repetition and strict preservation of safety-critical warnings.
 */
import type { UrgencyAssessment } from '../medassist-severity/severity-contracts';
import type { PrecautionGuidance } from './precaution-contracts';

export interface SimplifiedPrecaution {
  text: string;
  isWarning?: boolean;
}

export function generateSimplifiedPrecautions(
  assessment: UrgencyAssessment,
  _guidance: PrecautionGuidance,
  options?: { age?: number | null },
): SimplifiedPrecaution[] {
  const items: SimplifiedPrecaution[] = [];
  const symptoms = (assessment.confirmed_symptoms || []).map(s => s.trim().toLowerCase());
  const age = options?.age ?? null;

  const isEmergency = !!assessment.emergency_override;
  const urgency = assessment.assessed_urgency ?? 'unable_to_assess';

  const hasCoughOrRespiratory = symptoms.some(s =>
    s.includes('cough') || s.includes('e_201') || s.includes('dyspnea') || s.includes('breath') || s.includes('e_39') || s.includes('wheez'),
  );
  const hasFever = symptoms.some(s =>
    s.includes('fever') || s.includes('e_91') || s.includes('chill') || s.includes('e_86') || s.includes('temperature'),
  );
  const hasHeadacheOrPain = symptoms.some(s =>
    s.includes('headache') || s.includes('e_53') || s.includes('pain') || s.includes('e_76') || s.includes('dizz'),
  );
  const hasGI = symptoms.some(s =>
    s.includes('nausea') || s.includes('e_148') || s.includes('vomit') || s.includes('e_159') || s.includes('diarrhea') || s.includes('e_51'),
  );
  const hasSoreThroat = symptoms.some(s =>
    s.includes('sore throat') || s.includes('throat') || s.includes('e_97') || s.includes('swallow'),
  );
  const isPediatric = (age !== null && age < 19) || assessment.relevant_risk_factors.some(rf => rf.toLowerCase().includes('pediatric'));

  // =========================================================================
  // 1. TIMEFRAME & IMMEDIATE CARE (1-2 bullets)
  // =========================================================================
  if (isEmergency) {
    items.push({
      text: 'Call 112 (or 108) immediately or proceed to the nearest 24x7 Emergency Department.',
      isWarning: true,
    });
    items.push({
      text: 'Do not drive yourself; sit upright and keep medical details ready for ambulance responders.',
      isWarning: true,
    });
  } else if (urgency === 'high') {
    items.push({
      text: 'Seek medical evaluation promptly within 12 to 24 hours.',
    });
  } else if (urgency === 'medium') {
    items.push({
      text: 'Schedule an appointment with a doctor within 24 to 48 hours if symptoms do not improve.',
    });
  } else {
    items.push({
      text: 'Rest and monitor symptoms at home; consult a doctor if they worsen or persist.',
    });
  }

  // =========================================================================
  // 2. SYMPTOM-SPECIFIC COMFORT MEASURES (1-3 bullets)
  // =========================================================================
  if (isEmergency) {
    if (assessment.emergency_trigger) {
      items.push({
        text: `Critical warning sign active: ${assessment.emergency_trigger.replace(/_/g, ' ')}.`,
        isWarning: true,
      });
    }
  } else {
    if (hasCoughOrRespiratory && hasFever) {
      items.push({
        text: 'Rest with head and chest elevated, and stay well hydrated with warm water or clear broths.',
      });
      items.push({
        text: 'Wear lightweight cotton clothing and use a lukewarm sponge bath if fever causes discomfort.',
      });
    } else if (hasCoughOrRespiratory) {
      items.push({
        text: 'Rest with head and chest elevated using pillows to ease airflow and breathing.',
      });
      items.push({
        text: 'Drink warm fluids (water, herbal tea, or broth) to soothe your throat and thin mucus.',
      });
    } else if (hasFever) {
      items.push({
        text: 'Rest in a comfortably cool room and drink fluids frequently to replace sweat loss.',
      });
      items.push({
        text: 'Use a lukewarm water sponge bath for comfort; do not use cold water or ice baths.',
      });
    } else if (hasHeadacheOrPain) {
      items.push({
        text: 'Rest in a quiet, dimly lit room and apply a cool or lukewarm compress across your forehead.',
      });
      items.push({
        text: 'Drink plenty of water and eat regular light meals to avoid dehydration-triggered headache.',
      });
    } else if (hasGI) {
      items.push({
        text: 'Take frequent small sips of oral rehydration solution (ORS) or water to prevent dehydration.',
      });
      items.push({
        text: 'Eat small, bland meals (such as rice or crackers) only when hunger returns.',
      });
    } else if (hasSoreThroat) {
      items.push({
        text: 'Sip warm fluids or gargle with warm salt water to relieve throat soreness.',
      });
    } else {
      items.push({
        text: 'Rest adequately and maintain good oral hydration with water or clear liquids.',
      });
    }
  }

  // =========================================================================
  // 3. WHAT TO AVOID (1-2 bullets)
  // =========================================================================
  if (isEmergency) {
    items.push({
      text: 'Do not delay seeking emergency professional care and avoid any physical exertion.',
      isWarning: true,
    });
  } else {
    if (isPediatric && (hasFever || hasCoughOrRespiratory || hasHeadacheOrPain)) {
      items.push({
        text: 'Never give aspirin to children or adolescents under 19 years due to risk of Reye syndrome.',
      });
    }

    if (hasFever && !isPediatric) {
      items.push({
        text: 'Do not bundle in heavy blankets during chills, and avoid combining multi-symptom cold/fever drugs.',
      });
    } else if (hasCoughOrRespiratory) {
      items.push({
        text: 'Avoid physical exertion, cold air, and tobacco smoke or aerosol irritants.',
      });
    } else if (hasHeadacheOrPain && !isPediatric) {
      items.push({
        text: 'Avoid prolonged screen time in bright environments and avoid frequent unverified painkiller use.',
      });
    } else if (hasGI) {
      items.push({
        text: 'Avoid spicy, greasy, or dairy-heavy foods and caffeinated beverages until stomach settles.',
      });
    } else {
      items.push({
        text: 'Avoid strenuous physical workouts and do not self-prescribe unverified medications.',
      });
    }
  }

  // =========================================================================
  // 4. CRITICAL WARNING SIGNS / RED FLAGS (1-2 bullets)
  // =========================================================================
  if (hasCoughOrRespiratory || isEmergency) {
    items.push({
      text: 'Seek immediate emergency care if you notice breathing difficulty, chest pain, or bluish lips.',
      isWarning: true,
    });
  } else if (hasFever) {
    items.push({
      text: 'Seek immediate emergency care if fever exceeds 39.5°C (103°F), stiff neck, confusion, or dark rash appears.',
      isWarning: true,
    });
  } else if (hasHeadacheOrPain) {
    items.push({
      text: 'Seek immediate emergency care for sudden explosive thunderclap headache, slurred speech, or weakness on one side.',
      isWarning: true,
    });
  } else if (hasGI) {
    items.push({
      text: 'Seek immediate emergency care for inability to keep fluids down for 24h, blood in vomit/stool, or severe abdominal pain.',
      isWarning: true,
    });
  } else {
    items.push({
      text: 'Seek urgent medical attention immediately if symptoms worsen suddenly or new severe warning signs develop.',
      isWarning: true,
    });
  }

  // Ensure count is bounded (aim for 4–7 items, deduplicated)
  const seen = new Set<string>();
  const uniqueItems: SimplifiedPrecaution[] = [];
  for (const it of items) {
    const key = it.text.trim().toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      uniqueItems.push(it);
    }
  }

  return uniqueItems;
}
