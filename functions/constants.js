/**
 * ECHO Backend Constants
 *
 * Encounter phases aligned with the Calgary-Cambridge Guide to the Medical Interview.
 * Scoring rubric uses a 0-3 anchored scale modeled after the Mini-CEX.
 *
 * References:
 *   Kurtz SM, Silverman JD, Draper J. Teaching and Learning Communication Skills in Medicine.
 *   Norcini JJ, et al. The Mini-CEX. Ann Intern Med. 2003.
 *   Makoul G. Kalamazoo Consensus Statement. Acad Med. 2001.
 *   Tervalon M, Murray-Garcia J. Cultural humility. J Health Care Poor Underserved. 1998.
 *   Elwyn G, et al. Shared decision making. BMJ. 2012.
 *   Pangaro LN. RIME framework. Acad Med. 1999.
 */

const ENCOUNTER_PHASES = {
  0: {
    name: 'Introduction & Initial Presentation',
    coachIntro: (patient) =>
      `Welcome to ECHO! You're about to meet **${patient.name}**, a **${patient.age}**-year-old. Their main complaint is: "${patient.mainComplaint}". Your goal is to conduct a complete clinical encounter following the Calgary-Cambridge model of patient-centered communication. Let's begin with **Phase 1: Initiating the Session**. Greet the patient, introduce yourself, and establish initial rapport.`,
  },
  1: {
    name: 'Initiating the Session',
    maxTurns: 0,
    phaseGoalDescription:
      'Establish initial rapport through appropriate greeting and introduction. Identify the patient\'s reason(s) for the encounter. Negotiate a shared agenda. (Calgary-Cambridge: Initiating the Session)',
    coachIntro: (patient) =>
      `**Phase 1: Initiating the Session** — Your goals: greet ${patient.name} warmly, introduce yourself and your role, confirm the patient's identity, and establish why they are here today. Try to negotiate a shared agenda for this visit.`,
    coachPrompt:
      'Focus on your opening: Have you introduced yourself clearly? Have you asked the patient what brought them in today using an open-ended question? Have you negotiated the agenda for this visit?',
  },
  2: {
    name: 'Gathering Information',
    maxTurns: 0,
    phaseGoalDescription:
      'Explore the patient\'s problems using the open-to-closed cone technique. Elicit the patient\'s perspective using the ICE framework (Ideas, Concerns, Expectations). Obtain relevant biomedical history (HPI, PMH, medications, allergies, family/social history) and psychosocial context. (Calgary-Cambridge: Gathering Information)',
    coachIntro: (patient) =>
      `**Phase 2: Gathering Information** — Now explore ${patient.name}'s concerns in depth. Use open-ended questions first, then focus with closed questions. Remember to explore their Ideas, Concerns, and Expectations (ICE). Gather relevant medical, family, and social history.`,
    coachPrompt:
      'Are you using the open-to-closed cone? Have you explored the patient\'s ICE (Ideas about what\'s wrong, Concerns/fears, Expectations for this visit)? Have you covered past medical history, medications, allergies, family history, and social history?',
  },
  3: {
    name: 'Physical Examination',
    maxTurns: 0,
    phaseGoalDescription:
      'Explain what you will examine and why. Obtain consent for the examination. Maintain patient dignity and comfort. Share relevant findings with the patient. (Calgary-Cambridge: Physical Examination)',
    coachIntro: (patient) =>
      `**Phase 3: Physical Examination** — Explain to ${patient.name} what you'd like to examine and why. Obtain their consent, maintain their comfort and dignity, and share your findings as you go.`,
    coachPrompt:
      'Have you explained what you are examining and why? Did you obtain consent? Are you sharing your findings with the patient and checking their comfort?',
  },
  4: {
    name: 'Explanation & Planning',
    maxTurns: 0,
    phaseGoalDescription:
      'Provide information using the chunk-and-check technique. Use shared decision-making (team talk, option talk, decision talk). Assess understanding with teach-back. Create a mutually agreed management plan. (Calgary-Cambridge: Explanation and Planning)',
    coachIntro: (patient) =>
      `**Phase 4: Explanation & Planning** — Share your assessment with ${patient.name}. Use chunk-and-check: give information in small pieces and verify understanding. Involve the patient in shared decision-making about the plan. Use teach-back to confirm comprehension.`,
    coachPrompt:
      'Are you chunking information into manageable pieces? Are you checking understanding after each chunk? Have you involved the patient in deciding the plan? Have you used teach-back to verify comprehension?',
  },
  5: {
    name: 'Closing the Session',
    maxTurns: 0,
    phaseGoalDescription:
      'Summarize the encounter and agreed plan. Provide clear safety-netting instructions (what to watch for, when to return). Final check for remaining questions or concerns. Ensure the patient feels heard and cared for. (Calgary-Cambridge: Closing the Session)',
    coachIntro: (patient) =>
      `**Phase 5: Closing the Session** — Wrap up with ${patient.name}. Summarize what was discussed and the agreed plan. Provide clear safety-netting advice. Ask if they have any remaining questions. Ensure they leave feeling heard and cared for.`,
    coachPrompt:
      'Have you summarized the key points and plan? Have you provided safety-netting (red flags, when to return)? Have you done a final check for any remaining questions or concerns?',
  },
  6: {
    name: 'Encounter Complete',
    coachPrompt: 'The encounter is now complete. Review your overall feedback and scoring breakdown.',
  },
};

/**
 * Phase Rubric — Mini-CEX Anchored Scale (0-3)
 *
 *   0 = Not Done / Omitted
 *   1 = Needs Improvement
 *   2 = Meets Expectations
 *   3 = Exceeds Expectations
 */
const PHASE_RUBRIC = {
  communication: {
    max: 3,
    desc: 'Communication Skills — Uses open-to-closed questioning (cone/funnel), active listening with facilitative responses (PEARLS), and clear jargon-free language calibrated to the patient\'s health literacy. (Kalamazoo elements 1-3)',
    behavioralAnchors: {
      0: 'Does not ask questions or uses only closed/leading questions; interrupts; uses unexplained jargon.',
      1: 'Some open questions but defaults to closed; minimal active listening; some jargon without explanation.',
      2: 'Uses open-to-closed cone appropriately; demonstrates active listening (reflecting, summarizing); language appropriate for patient.',
      3: 'Masterful questioning techniques; consistent facilitative responses; perfectly calibrates language to patient literacy and emotional state.',
    },
  },
  trustRapport: {
    max: 3,
    desc: 'Rapport & Relational Skills — Establishes therapeutic relationship through empathic responses, emotional validation, and relational continuity. (Calgary-Cambridge: Building the Relationship thread)',
    behavioralAnchors: {
      0: 'No empathic responses; dismissive of emotions; fails to establish rapport.',
      1: 'Acknowledges emotions superficially; inconsistent rapport-building; misses emotional cues.',
      2: 'Responds empathically; creates safe environment; validates concerns appropriately.',
      3: 'Proactively explores and validates emotions; genuine curiosity about the patient as a person; masterfully navigates difficult emotions.',
    },
  },
  clinicalReasoning: {
    max: 3,
    desc: 'Clinical Reasoning & Accuracy — Asks clinically relevant, appropriately sequenced questions to build a differential. Gathers pertinent positives/negatives systematically. (RIME: Reporter and Interpreter levels)',
    behavioralAnchors: {
      0: 'Questions clinically irrelevant or disorganized; fails to gather key history; misses red flags.',
      1: 'Some relevant questions but significant gaps; incomplete review; misses important findings.',
      2: 'Systematic and clinically appropriate questioning; gathers pertinent positives/negatives; identifies key findings.',
      3: 'Expertly targeted questioning that efficiently narrows the differential; anticipates red flags; integrates biopsychosocial factors seamlessly.',
    },
  },
  culturalHumility: {
    max: 3,
    desc: 'Cultural Humility & Safety — Explores the patient\'s explanatory model (Kleinman\'s questions), health beliefs, and cultural context without assumptions. Adapts communication to cultural framework and language needs. (Tervalon & Murray-Garcia)',
    behavioralAnchors: {
      0: 'Makes cultural assumptions/stereotypes; ignores language barriers; does not explore patient perspective.',
      1: 'Some cultural awareness but relies on assumptions; minimal adaptation; superficial exploration of beliefs.',
      2: 'Asks about health beliefs respectfully; addresses language needs; avoids assumptions; explores ICE.',
      3: 'Genuine cultural curiosity; integrates explanatory model into care planning; proactively addresses structural barriers; creates culturally safe space.',
    },
  },
  sharedDecisionMaking: {
    max: 3,
    desc: 'Shared Decision-Making & Patient Education — Involves patient as active partner using the three-talk model. Uses chunk-and-check and teach-back. (Elwyn et al.)',
    behavioralAnchors: {
      0: 'Dictates plan without input; no understanding checks; no patient education.',
      1: 'Mentions options but does not explore preferences; minimal understanding checks; incomplete education.',
      2: 'Presents options and elicits preferences; uses chunk-and-check; confirms understanding; clear safety-netting.',
      3: 'Masterfully balances clinical guidance with patient autonomy; effective teach-back; tailored education; empowers self-management.',
    },
  },
};

module.exports = { ENCOUNTER_PHASES, PHASE_RUBRIC };
