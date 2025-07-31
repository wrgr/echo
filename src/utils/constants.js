export const ENCOUNTER_PHASES_CLIENT = {
  0: {
    name: "Introduction & Initial Presentation",
    maxScore: 0,
    coachIntro: (patient) => `Welcome to ECHO! You're about to meet **${patient.name}**, a **${patient.age}**-year-old. Their main complaint is: "${patient.mainComplaint}". Your goal is to conduct a complete clinical encounter adhering to the Patient-Centered / Biopsychosocial model. Let's begin with **Phase 1: Initiation and Building the Relationship**. What is your first step?`
  },
  1: { name: "Initiation & Building the Relationship", maxScore: 5 },
  2: { name: "Information Gathering & History Taking", maxScore: 5 },
  3: { name: "Physical Examination", maxScore: 5 },
  4: { name: "Assessment & Plan / Shared Decision-Making", maxScore: 5 },
  5: { name: "Closure", maxScore: 5 },
  6: { name: "Encounter Complete", maxScore: 0 },
};

export const PHASE_RUBRIC_DEFINITIONS = {
  communication: {
    label: "Communication",
    desc: "Provider demonstrates clear, appropriate language, active listening, and effective questioning techniques. Messages are easy to understand for the patient.",
    max: 1,
    icon: "💬",
  },
  trustRapport: {
    label: "Trust & Rapport",
    desc: "Provider establishes an empathetic and respectful connection with the patient, builds trust, and manages emotions effectively, fostering an open environment.",
    max: 1,
    icon: "🤝",
  },
  accuracy: {
    label: "Accuracy",
    desc: "Provider asks clinically relevant questions, gathers precise and complete information, and identifies key symptoms/history details crucial for diagnosis.",
    max: 1,
    icon: "🎯",
  },
  culturalHumility: {
    label: "Cultural Humility",
    desc: "Provider explores patient's ideas, beliefs, and cultural context respectfully, avoids assumptions, and acknowledges cultural factors influencing health/illness and decision-making.",
    max: 1,
    icon: "🌍",
  },
  sharedUnderstanding: {
    label: "Shared Understanding",
    desc: "Provider ensures patient comprehension of information and the management plan, actively involves the patient in decisions, and effectively uses techniques like teach-back.",
    max: 1,
    icon: "🔄",
  },
};
