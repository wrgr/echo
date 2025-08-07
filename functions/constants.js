const ENCOUNTER_PHASES = {
  0: {
    name: 'Introduction & Initial Presentation',
    coachIntro: (patient) => {
      const proficiency =
        patient.englishProficiency === 'None'
          ? 'No English'
          : `${patient.englishProficiency} English`;
      return `Welcome to ECHO! You are entering a patient room, where you will meet ${patient.name}, a ${patient.age}-year-old ${patient.genderIdentity} (${patient.pronouns}) whose primary language is ${patient.nativeLanguage} (${proficiency} proficiency). Their main complaint is: "${patient.mainComplaint}". Your goal is to conduct a complete clinical encounter with cultural humility and shared understanding. Entering Phase 1: Initiation and Building the Relationship. What is your first step?`;
    },
    phaseGoalDescription: 'This is the initial introduction to the scenario. There are no direct tasks for the provider in this phase other than to transition into Phase 1.',
    maxTurns: 0,
  },
  1: {
    name: 'Initiation & Building the Relationship',
    coachIntro: null,
    coachPrompt: 'You are in Phase 1 (Initiation & Relationship). Focus on greeting the patient, introducing yourself, establishing rapport, and clearly identifying the patient\'s chief complaint and agenda for the visit.',
    phaseGoalDescription: 'The provider should greet the patient, introduce themselves, establish initial rapport, and identify the patient\'s chief complaint and their agenda for the visit. Key actions include: open-ended questions about their visit, empathetic statements, and active listening.',
    maxTurns: 10,
  },
  2: {
    name: 'Information Gathering & History Taking',
    coachIntro: null,
    coachPrompt: 'You are in Phase 2 (Information Gathering). Focus on a comprehensive History of Present Illness (HPI), and relevant Past Medical, Social, Family History. Critically, explore the patient\'s Ideas, Concerns, and Expectations.',
    phaseGoalDescription: 'The provider should gather a comprehensive History of Present Illness and inquire about relevant Past Medical History, Medications/Allergies, Family History, and Social History. It is crucial to explore the patient\'s Ideas, Concerns, and Expectations. The provider should use a mix of open-ended and focused questions, and demonstrate active listening.',
    maxTurns: 10,
  },
  3: {
    name: 'Physical Examination',
    coachIntro: null,
    coachPrompt: 'You are in Phase 3 (Physical Examination). Clearly state what exam components you are performing. Remember to explain what you\'re doing and ask for consent. The patient will then state the findings.',
    phaseGoalDescription: 'The provider should clearly state the intention to perform a physical exam, explain what will be done, and ask for consent. They should then state specific, focused components of the physical exam relevant to the patient\'s complaint. The patient will then provide relevant findings.',
    maxTurns: 7,
  },
  4: {
    name: 'Assessment & Plan / Shared Decision-Making',
    coachIntro: null,
    coachPrompt: 'You are in Phase 4 (Assessment & Plan). Your goal is to synthesize findings, state a diagnosis, propose a management plan, and ensure shared understanding with the patient. Use the teach-back method.',
    phaseGoalDescription: 'The provider should synthesize the gathered subjective and objective data, formulate and communicate a likely diagnosis to the patient, propose a management plan (tests, treatments, referrals), and engage in shared decision-making. Critically, the provider must use techniques like teach-back to ensure the patient\'s understanding and address their preferences and concerns.',
    maxTurns: 7,
  },
  5: {
    name: 'Closure',
    coachIntro: null,
    coachPrompt: 'You are in Phase 5 (Closure). Summarize the agreed-upon plan, provide safety netting instructions (what to do if symptoms worsen), and address any final questions the patient may have.',
    phaseGoalDescription: 'The provider should provide a concise summary of the encounter and the agreed-upon plan, give clear safety-netting instructions (what to do, when to seek help), invite any final questions or concerns from the patient, and professionally close the encounter.',
    maxTurns: 3,
  },
  6: {
    name: 'Encounter Complete',
    coachIntro: null,
    coachPrompt: 'The encounter is complete.',
    phaseGoalDescription: 'The simulation has ended. Review the total score and detailed feedback.',
    maxTurns: 0,
  },
};

const PHASE_RUBRIC = {
  communication: {max: 1, desc: 'Clear, active listening, appropriate language. Asks clear questions, summarizes effectively.'},
  trustRapport: {max: 1, desc: 'Establishes empathetic connection, shows respect, builds trust, manages emotions.'},
  accuracy: {max: 1, desc: 'Asks clinically relevant questions, gathers precise and complete information, identifies key symptoms/history.'},
  culturalHumility: {max: 1, desc: 'Explores patient\'s ideas/beliefs/context respectfully, avoids assumptions, acknowledges cultural factors in health/illness.'},
  sharedUnderstanding: {max: 1, desc: 'Ensures patient comprehension of information/plan, actively involves patient in decisions, uses teach-back.'},
};

module.exports = { ENCOUNTER_PHASES, PHASE_RUBRIC };
