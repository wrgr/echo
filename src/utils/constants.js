/**
 * ECHO Encounter Phases - Aligned with the Calgary-Cambridge Guide to the Medical Interview
 *
 * The Calgary-Cambridge framework structures the clinical encounter into distinct tasks:
 *   Initiating the Session → Gathering Information → Physical Examination →
 *   Explanation & Planning → Closing the Session
 * with "Providing Structure" and "Building the Relationship" as continuous threads.
 *
 * References:
 *   Kurtz SM, Silverman JD, Draper J. Teaching and Learning Communication Skills in Medicine.
 *   Silverman J, Kurtz S, Draper J. Skills for Communicating with Patients. 3rd ed.
 */
export const ENCOUNTER_PHASES_CLIENT = {
  0: {
    name: "Introduction & Initial Presentation",
    maxScore: 0,
    coachIntro: (patient) =>
      `Welcome to ECHO! You're about to meet **${patient.name}**, a **${patient.age}**-year-old. Their main complaint is: "${patient.mainComplaint}". Your goal is to conduct a complete clinical encounter following the Calgary-Cambridge model of patient-centered communication. Let's begin with **Phase 1: Initiating the Session**. Greet the patient, introduce yourself, and establish initial rapport.`,
  },
  1: {
    name: "Initiating the Session",
    maxScore: 15,
    calgaryCambridgeMapping: "Initiating the Session",
    learningObjectives: [
      "Establish initial rapport with appropriate greeting and introduction",
      "Identify and confirm the patient's reason(s) for the encounter",
      "Negotiate a shared agenda for the visit",
    ],
  },
  2: {
    name: "Gathering Information",
    maxScore: 15,
    calgaryCambridgeMapping: "Gathering Information",
    learningObjectives: [
      "Explore the patient's problems using open-to-closed questioning",
      "Elicit the patient's perspective using the ICE framework (Ideas, Concerns, Expectations)",
      "Obtain relevant biomedical and psychosocial history",
    ],
  },
  3: {
    name: "Physical Examination",
    maxScore: 15,
    calgaryCambridgeMapping: "Physical Examination",
    learningObjectives: [
      "Explain examination steps and obtain consent",
      "Maintain patient dignity and comfort throughout",
      "Share relevant findings with the patient",
    ],
  },
  4: {
    name: "Explanation & Planning",
    maxScore: 15,
    calgaryCambridgeMapping: "Explanation and Planning",
    learningObjectives: [
      "Provide information in manageable amounts using the chunk-and-check method",
      "Involve the patient in shared decision-making",
      "Assess patient understanding using teach-back techniques",
    ],
  },
  5: {
    name: "Closing the Session",
    maxScore: 15,
    calgaryCambridgeMapping: "Closing the Session",
    learningObjectives: [
      "Summarize and confirm the agreed plan",
      "Provide clear safety-netting and follow-up instructions",
      "Final check for any remaining patient questions or concerns",
    ],
  },
  6: { name: "Encounter Complete", maxScore: 0 },
};

/**
 * Rubric Categories - Grounded in validated medical education assessment frameworks
 *
 * Scoring uses a 0-3 anchored scale modeled after the Mini-CEX (Mini Clinical Evaluation Exercise),
 * a widely validated workplace-based assessment tool endorsed by the ABIM and ACGME.
 *
 * Scale:
 *   0 = Not Done / Omitted — The skill was not demonstrated
 *   1 = Needs Improvement    — Attempted but significant deficiencies observed
 *   2 = Meets Expectations   — Competent performance consistent with training level
 *   3 = Exceeds Expectations — Exemplary performance demonstrating mastery
 *
 * References:
 *   Norcini JJ, et al. The Mini-CEX: a method for assessing clinical skills. Ann Intern Med. 2003.
 *   Makoul G. Essential elements of communication in medical encounters: the Kalamazoo Consensus Statement. Acad Med. 2001.
 *   Tervalon M, Murray-Garcia J. Cultural humility versus cultural competence. J Health Care Poor Underserved. 1998.
 */
export const SCORING_SCALE = {
  NOT_DONE: { value: 0, label: "Not Done / Omitted", description: "The skill was not demonstrated at all during this phase." },
  NEEDS_IMPROVEMENT: { value: 1, label: "Needs Improvement", description: "Attempted but with significant deficiencies; may hinder patient care or communication." },
  MEETS_EXPECTATIONS: { value: 2, label: "Meets Expectations", description: "Competent performance appropriate for training level; achieves the core objective." },
  EXCEEDS_EXPECTATIONS: { value: 3, label: "Exceeds Expectations", description: "Exemplary performance demonstrating mastery; could serve as a model for peers." },
};

export const PHASE_RUBRIC_DEFINITIONS = {
  communication: {
    label: "Communication Skills",
    desc: "Uses open-to-closed questioning technique (cone/funnel approach), active listening with appropriate facilitative responses (PEARLS: Partnership, Empathy, Apology/Acknowledgment, Respect, Legitimation, Support), and clear jargon-free language calibrated to the patient's health literacy level. Aligned with Kalamazoo Consensus Statement elements 1-3.",
    max: 3,
    icon: "💬",
    behavioralAnchors: {
      0: "Does not ask questions or uses only closed/leading questions; interrupts the patient; uses unexplained medical jargon.",
      1: "Asks some open questions but defaults to closed; minimal active listening; some medical jargon without explanation.",
      2: "Uses open-to-closed cone appropriately; demonstrates active listening (reflecting, summarizing); language generally appropriate for patient.",
      3: "Masterful use of questioning techniques; consistently uses facilitative responses; perfectly calibrates language to patient's literacy and emotional state.",
    },
  },
  trustRapport: {
    label: "Rapport & Relational Skills",
    desc: "Establishes and maintains a therapeutic relationship through empathic responses, nonverbal attentiveness, and emotional validation. Demonstrates the relational competencies emphasized in the Calgary-Cambridge 'Building the Relationship' thread and the patient-centered clinical method (Stewart et al.).",
    max: 3,
    icon: "🤝",
    behavioralAnchors: {
      0: "No empathic responses; dismissive of patient emotions; fails to establish any rapport.",
      1: "Acknowledges emotions superficially; rapport-building is inconsistent; misses key emotional cues.",
      2: "Responds empathically to expressed emotions; creates a safe environment; appropriately validates concerns.",
      3: "Proactively explores and validates emotions; demonstrates genuine curiosity about the patient as a person; masterfully navigates difficult emotions.",
    },
  },
  clinicalReasoning: {
    label: "Clinical Reasoning & Accuracy",
    desc: "Asks clinically relevant and appropriately sequenced questions to build a differential diagnosis. Gathers pertinent positives and negatives systematically. Demonstrates the clinical reasoning competencies assessed in the RIME framework (Reporter level: accurate data gathering; Interpreter level: synthesizing findings).",
    max: 3,
    icon: "🎯",
    behavioralAnchors: {
      0: "Questions are clinically irrelevant or disorganized; fails to gather key history elements; misses critical red flags.",
      1: "Some relevant questions but significant gaps in history; incomplete review of pertinent systems; misses some important findings.",
      2: "Systematic and clinically appropriate questioning; gathers pertinent positives/negatives; identifies key findings for differential.",
      3: "Expertly targeted questioning that efficiently narrows the differential; anticipates and asks about red flags; integrates biopsychosocial factors seamlessly.",
    },
  },
  culturalHumility: {
    label: "Cultural Humility & Safety",
    desc: "Explores the patient's explanatory model of illness (Kleinman's questions), health beliefs, and cultural context without assumptions. Adapts communication style to the patient's cultural framework and language needs. Grounded in Tervalon & Murray-Garcia's cultural humility framework and the concept of cultural safety.",
    max: 3,
    icon: "🌍",
    behavioralAnchors: {
      0: "Makes cultural assumptions or stereotypes; ignores language barriers; does not explore the patient's perspective on illness.",
      1: "Shows some cultural awareness but relies on assumptions; minimal adaptation to patient's cultural needs; superficial exploration of health beliefs.",
      2: "Asks about health beliefs and cultural practices respectfully; addresses language needs appropriately; avoids assumptions; explores ICE (Ideas, Concerns, Expectations).",
      3: "Demonstrates genuine cultural curiosity; skillfully integrates the patient's explanatory model into care planning; proactively addresses structural barriers; creates a culturally safe space.",
    },
  },
  sharedDecisionMaking: {
    label: "Shared Decision-Making & Patient Education",
    desc: "Involves the patient as an active partner in clinical decisions using the three-talk model (team talk, option talk, decision talk). Uses chunk-and-check technique for information delivery and teach-back to verify understanding. Aligned with Elwyn et al.'s shared decision-making framework.",
    max: 3,
    icon: "🔄",
    behavioralAnchors: {
      0: "Dictates plan without patient input; no checking of understanding; provides no patient education.",
      1: "Mentions options but does not genuinely explore patient preferences; minimal checking of understanding; education is incomplete or unclear.",
      2: "Presents options and elicits patient preferences; uses chunk-and-check; confirms understanding; provides clear safety-netting.",
      3: "Masterfully balances clinical guidance with patient autonomy; uses teach-back effectively; tailors education to patient's needs; empowers the patient in self-management.",
    },
  },
};

/**
 * Performance Level Descriptors - Based on the RIME Framework and Dreyfus Model of Skill Acquisition
 *
 * Used for overall encounter grading and formative feedback.
 *
 * RIME: Pangaro LN. A new vocabulary and other innovations for improving descriptive in-training evaluations. Acad Med. 1999.
 * Dreyfus: Dreyfus SE. The five-stage model of adult skill acquisition. Bull Sci Tech Soc. 2004.
 */
export const PERFORMANCE_LEVELS = {
  NOVICE: {
    label: "Novice",
    minPercentage: 0,
    maxPercentage: 39,
    description: "Significant gaps in clinical communication skills. Needs structured guidance and deliberate practice on foundational techniques.",
    rimeLevel: "Pre-Reporter",
    color: "#e53e3e",
  },
  DEVELOPING: {
    label: "Developing",
    minPercentage: 40,
    maxPercentage: 59,
    description: "Demonstrates emerging skills but inconsistently. Can gather basic information but struggles with complex communication tasks.",
    rimeLevel: "Reporter",
    color: "#d69e2e",
  },
  COMPETENT: {
    label: "Competent",
    minPercentage: 60,
    maxPercentage: 79,
    description: "Meets expectations for training level. Communicates effectively in routine encounters with appropriate patient-centered techniques.",
    rimeLevel: "Interpreter",
    color: "#3182ce",
  },
  PROFICIENT: {
    label: "Proficient",
    minPercentage: 80,
    maxPercentage: 100,
    description: "Exceeds expectations. Demonstrates mastery of patient-centered communication and adapts skillfully to complex situations.",
    rimeLevel: "Manager/Educator",
    color: "#38a169",
  },
};

/**
 * Get the performance level for a given score percentage
 */
export const getPerformanceLevel = (scorePercentage) => {
  if (scorePercentage >= PERFORMANCE_LEVELS.PROFICIENT.minPercentage) return PERFORMANCE_LEVELS.PROFICIENT;
  if (scorePercentage >= PERFORMANCE_LEVELS.COMPETENT.minPercentage) return PERFORMANCE_LEVELS.COMPETENT;
  if (scorePercentage >= PERFORMANCE_LEVELS.DEVELOPING.minPercentage) return PERFORMANCE_LEVELS.DEVELOPING;
  return PERFORMANCE_LEVELS.NOVICE;
};
