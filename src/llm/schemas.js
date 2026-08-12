/**
 * Structured-output schemas + tolerant parsing/validation.
 *
 * Modern advance vs. the original backend: instead of coaxing JSON out of the
 * model with regex fence-stripping (`responseText.replace(/^```json/…)`) and
 * hoping it parses, direct providers request schema-constrained JSON —
 * Anthropic via `output_config.format` (json_schema), Gemini via
 * `responseSchema`. `parseJson` remains as a defensive fallback, and the
 * score/response validators (ported from functions/gemini.js) clamp values the
 * schema can't (Anthropic strict JSON Schema doesn't support numeric min/max).
 */

import { PHASE_RUBRIC, RUBRIC_CATEGORIES } from './encounter.js';

// ---- Score update schema (fixed rubric categories) ----------------------

const scoreCategoryProps = Object.fromEntries(
  RUBRIC_CATEGORIES.map((cat) => [
    cat,
    {
      type: 'object',
      properties: {
        points: { type: 'integer', description: 'Score 0-3 on the Mini-CEX anchored scale.' },
        justification: { type: 'string' },
      },
      required: ['points', 'justification'],
      additionalProperties: false,
    },
  ]),
);

const scoreUpdateSchema = {
  type: 'object',
  properties: scoreCategoryProps,
  required: RUBRIC_CATEGORIES,
  additionalProperties: false,
};

// ---- Response schemas (Anthropic strict JSON Schema) --------------------

export const INTERACTION_SCHEMA = {
  type: 'object',
  properties: {
    from: { type: 'string', enum: ['patient', 'coach'] },
    simulatorResponse: { type: 'string' },
    phaseAssessment: {
      type: 'object',
      properties: {
        phaseComplete: { type: 'boolean' },
        justificationForCompletion: { type: 'string' },
      },
      required: ['phaseComplete', 'justificationForCompletion'],
      additionalProperties: false,
    },
    scoreUpdate: scoreUpdateSchema,
  },
  required: ['from', 'simulatorResponse', 'phaseAssessment', 'scoreUpdate'],
  additionalProperties: false,
};

export const PHASE_SCORE_SCHEMA = scoreUpdateSchema;

export const INJECTED_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    text: { type: 'string' },
    scoreUpdate: scoreUpdateSchema,
  },
  required: ['text', 'scoreUpdate'],
  additionalProperties: false,
};

export const PATIENT_FIELDS = [
  'name', 'age', 'genderIdentity', 'pronouns', 'nativeLanguage', 'englishProficiency',
  'culturalBackground', 'mainComplaint', 'secondaryComplaint', 'hiddenConcern',
  'illnessPerception_Ideas', 'illnessPerception_Concerns', 'illnessPerception_Expectations',
  'relevantPastMedicalHistory', 'relevantMedicationsAndAllergies', 'relevantFamilyHistory',
  'relevantSocialHistory', 'physicalExamFindings', 'correctDiagnosis', 'managementPlanOutline',
  'redFlags_worseningConditions', 'familyInvolvementPreference', 'patientPersona',
];

export const PATIENT_SCHEMA = {
  type: 'object',
  properties: Object.fromEntries(
    PATIENT_FIELDS.map((f) => [f, f === 'age' ? { type: 'integer' } : { type: 'string' }]),
  ),
  required: PATIENT_FIELDS,
  additionalProperties: false,
};

// ---- Gemini responseSchema adapter --------------------------------------
// Gemini's schema dialect is an OpenAPI 3.0 subset: it rejects
// `additionalProperties` and `$schema`. Strip those recursively.
export function toGeminiSchema(schema) {
  if (Array.isArray(schema)) return schema.map(toGeminiSchema);
  if (schema && typeof schema === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(schema)) {
      if (k === 'additionalProperties' || k === '$schema') continue;
      out[k] = toGeminiSchema(v);
    }
    return out;
  }
  return schema;
}

// ---- Tolerant JSON parsing (defensive fallback) -------------------------
export function parseJson(text) {
  if (text && typeof text === 'object') return text; // already parsed
  if (typeof text !== 'string') throw new Error('Expected JSON string from model.');
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch (_) {
    // Strip ```json … ``` fences if present.
    const unfenced = trimmed.replace(/^```(?:json)?\s*|\s*```$/gs, '');
    try {
      return JSON.parse(unfenced);
    } catch (_e) {
      // Last resort: extract the first balanced {...} block.
      const start = unfenced.indexOf('{');
      const end = unfenced.lastIndexOf('}');
      if (start !== -1 && end > start) {
        return JSON.parse(unfenced.slice(start, end + 1));
      }
      throw new Error('Model did not return valid JSON.');
    }
  }
}

// ---- Validation / clamping (ported from functions/gemini.js) ------------

export function validateScoreUpdate(raw) {
  const validated = {};
  for (const cat of RUBRIC_CATEGORIES) {
    const entry = raw && raw[cat];
    const maxPts = PHASE_RUBRIC[cat].max;

    if (!entry || typeof entry.points !== 'number') {
      validated[cat] = {
        points: 0,
        justification: entry && entry.justification
          ? `${entry.justification} [Score was non-numeric; defaulted to 0]`
          : 'AI did not return a valid score for this category.',
      };
      continue;
    }

    let pts = Math.round(entry.points);
    let note = '';
    if (pts < 0) { pts = 0; note = ` [Clamped from ${entry.points} to 0]`; }
    if (pts > maxPts) { pts = maxPts; note = ` [Clamped from ${entry.points} to ${maxPts}]`; }

    validated[cat] = {
      points: pts,
      justification: (entry.justification || 'No justification provided.') + note,
    };
  }
  return validated;
}

export function validateInteractionResponse(parsed) {
  const safe = { ...parsed };
  if (!['patient', 'coach'].includes(safe.from)) safe.from = 'patient';
  if (typeof safe.simulatorResponse !== 'string' || !safe.simulatorResponse.trim()) {
    safe.simulatorResponse = '...';
  }
  if (!safe.phaseAssessment || typeof safe.phaseAssessment !== 'object') {
    safe.phaseAssessment = { phaseComplete: false, justificationForCompletion: 'Phase assessment missing from AI response.' };
  }
  safe.phaseAssessment.phaseComplete = Boolean(safe.phaseAssessment.phaseComplete);
  if (typeof safe.phaseAssessment.justificationForCompletion !== 'string') {
    safe.phaseAssessment.justificationForCompletion = '';
  }
  safe.scoreUpdate = validateScoreUpdate(safe.scoreUpdate);
  return safe;
}
