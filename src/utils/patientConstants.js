// patientConstants.js - Configuration data for PatientVoice module
// Mirrors the structure of existing ECHO constants

export const PATIENT_SPECIALTIES = [
  {
    id: 'primary_care',
    name: 'Primary Care',
    icon: '🩺',
    description: 'Learn effective communication for routine check-ups, preventive care, and chronic disease management',
    scenarioCount: 6
  },
  {
    id: 'specialist',
    name: 'Specialist Consultation',
    icon: '🔬',
    description: 'Navigate first-time specialist visits and complex medical discussions',
    scenarioCount: 5
  },
  {
    id: 'emergency',
    name: 'Emergency Department',
    icon: '🚨',
    description: 'Communicate effectively during urgent and stressful medical situations',
    scenarioCount: 4
  },
  {
    id: 'surgery',
    name: 'Surgical Consultation',
    icon: '⚕️',
    description: 'Understand surgical options, risks, and shared decision-making for procedures',
    scenarioCount: 4
  },
  {
    id: 'mental_health',
    name: 'Mental Health',
    icon: '🧠',
    description: 'Build communication skills for mental health appointments and therapy sessions',
    scenarioCount: 5
  },
  {
    id: 'chronic_care',
    name: 'Chronic Disease Management',
    icon: '📋',
    description: 'Learn ongoing communication for diabetes, hypertension, and other chronic conditions',
    scenarioCount: 6
  }
];

export const COMMUNICATION_PHASES = {
  preparation: {
    label: 'Pre-Visit Preparation',
    description: 'Preparing for your healthcare encounter',
    patientObjectives: [
      'Identify your main concerns and symptoms',
      'Prepare relevant questions using Ask Me 3+ framework',
      'Gather necessary medical history and medication lists',
      'Set realistic expectations for the visit'
    ],
    tips: 'Come prepared with specific questions and information about your symptoms.',
    placeholder: 'What questions or concerns do you want to discuss today?',
    canAdvance: true
  },
  
  opening: {
    label: 'Opening Communication',
    description: 'Starting the conversation effectively',
    patientObjectives: [
      'Clearly state your main concern or reason for visit',
      'Provide relevant context and timeline',
      'Establish rapport while maintaining professional boundaries',
      'Listen actively to provider responses'
    ],
    tips: 'Be clear and concise about why you\'re here. Your time is valuable - use it wisely.',
    placeholder: 'How would you start this conversation with your healthcare provider?',
    canAdvance: true
  },
  
  asking_questions: {
    label: 'Active Questioning',
    description: 'Using enhanced Ask Me 3+ framework',
    patientObjectives: [
      'Ask: What is my main problem/diagnosis?',
      'Ask: What are my treatment options?',
      'Ask: What should I realistically expect?',
      'Seek clarification when information is unclear'
    ],
    tips: 'Don\'t be afraid to ask for clarification. Good questions lead to better care.',
    placeholder: 'What specific questions do you have about your diagnosis or treatment options?',
    canAdvance: true
  },
  
  shared_decision_making: {
    label: 'Shared Decision Making',
    description: 'Participating in treatment decisions',
    patientObjectives: [
      'Express your values, preferences, and concerns',
      'Understand the risks and benefits of each option',
      'Ask about alternatives and what happens if you do nothing',
      'Collaborate on a plan that fits your life and values'
    ],
    tips: 'This is your health - you have a voice in decisions. Share what matters most to you.',
    placeholder: 'How do you feel about the treatment options discussed? What are your concerns?',
    canAdvance: true
  },
  
  understanding_role: {
    label: 'Understanding Professional Boundaries',
    description: 'Learning appropriate expectations',
    patientObjectives: [
      'Understand the difference between medical expertise and customer service',
      'Recognize when to advocate vs. when to trust professional judgment',
      'Learn appropriate ways to express dissatisfaction or concerns',
      'Understand emergency vs. non-emergency communication'
    ],
    tips: 'Healthcare is a partnership. Respect professional expertise while advocating for your needs.',
    placeholder: 'How would you handle a situation where you disagree with a recommendation?',
    canAdvance: true
  },
  
  follow_up: {
    label: 'Follow-up and Next Steps',
    description: 'Planning ongoing care',
    patientObjectives: [
      'Confirm understanding of the treatment plan',
      'Clarify your responsibilities as a patient',
      'Understand when and how to contact the provider',
      'Ask about warning signs or when to seek immediate care'
    ],
    tips: 'Make sure you understand your role in the care plan and when to seek help.',
    placeholder: 'What questions do you have about your responsibilities or next steps?',
    canAdvance: false
  }
};

export const PATIENT_SCENARIOS = {
  primary_care: [
    {
      id: 'pc_annual_checkup',
      title: 'Annual Physical Exam',
      difficulty: 'Beginner',
      description: 'Navigate your yearly check-up and discuss preventive care',
      context: 'You\'re here for your annual physical. You\'ve been having some minor concerns about fatigue and want to discuss preventive care options.',
      objectives: [
        'Practice effective opening communication',
        'Ask appropriate questions about health maintenance',
        'Understand the difference between screening and diagnostic tests',
        'Learn when customer service expectations are appropriate vs inappropriate'
      ],
      estimatedTime: '15-20 minutes'
    },
    {
      id: 'pc_new_symptoms',
      title: 'New Concerning Symptoms',
      difficulty: 'Intermediate',
      description: 'Discuss new symptoms that worry you',
      context: 'You\'ve been experiencing chest pain for the past week. You\'re worried but not sure if it\'s serious.',
      objectives: [
        'Effectively communicate symptom details',
        'Ask appropriate questions about concerning symptoms',
        'Understand when to advocate for further testing',
        'Learn about appropriate follow-up expectations'
      ],
      estimatedTime: '20-25 minutes'
    },
    {
      id: 'pc_medication_concerns',
      title: 'Medication Side Effects',
      difficulty: 'Intermediate',
      description: 'Discuss side effects and medication concerns',
      context: 'Your blood pressure medication is causing side effects that are affecting your quality of life.',
      objectives: [
        'Communicate side effects clearly',
        'Participate in shared decision-making about alternatives',
        'Understand the balance between benefits and risks',
        'Learn appropriate expectations for medication adjustments'
      ],
      estimatedTime: '15-20 minutes'
    }
  ],
  
  specialist: [
    {
      id: 'sp_cardiology_referral',
      title: 'First Cardiology Consultation',
      difficulty: 'Intermediate',
      description: 'Navigate your first visit to a heart specialist',
      context: 'You\'ve been referred to a cardiologist after an abnormal EKG. You\'re anxious and have many questions.',
      objectives: [
        'Prepare effective questions for specialist consultation',
        'Understand the referral process and specialist role',
        'Learn about diagnostic testing discussions',
        'Navigate anxiety while maintaining effective communication'
      ],
      estimatedTime: '25-30 minutes'
    },
    {
      id: 'sp_complex_diagnosis',
      title: 'Complex Medical Diagnosis',
      difficulty: 'Advanced',
      description: 'Understand and respond to a complex diagnosis',
      context: 'The specialist has diagnosed you with a chronic condition that will require ongoing management.',
      objectives: [
        'Process complex medical information',
        'Ask appropriate questions about prognosis',
        'Participate in long-term care planning',
        'Understand realistic expectations for chronic disease management'
      ],
      estimatedTime: '30-35 minutes'
    }
  ],
  
  emergency: [
    {
      id: 'ed_chest_pain',
      title: 'Emergency Room Visit - Chest Pain',
      difficulty: 'Advanced',
      description: 'Communicate effectively during an emergency situation',
      context: 'You\'re in the ER with chest pain. The environment is fast-paced and you\'re scared.',
      objectives: [
        'Provide clear information under stress',
        'Understand emergency vs. routine care expectations',
        'Ask appropriate questions in urgent situations',
        'Learn when to advocate vs. when to step back'
      ],
      estimatedTime: '20-25 minutes'
    }
  ],
  
  surgery: [
    {
      id: 'sg_pre_op_consult',
      title: 'Pre-Surgical Consultation',
      difficulty: 'Advanced',
      description: 'Navigate surgical decision-making and informed consent',
      context: 'You need surgery for a condition. The surgeon is explaining the procedure, risks, and alternatives.',
      objectives: [
        'Understand surgical risks and benefits',
        'Ask appropriate questions about alternatives',
        'Participate in informed consent process',
        'Learn about realistic recovery expectations'
      ],
      estimatedTime: '30-40 minutes'
    }
  ],
  
  mental_health: [
    {
      id: 'mh_first_appointment',
      title: 'First Mental Health Appointment',
      difficulty: 'Intermediate',
      description: 'Navigate your first therapy or psychiatry visit',
      context: 'This is your first appointment with a mental health professional. You\'re unsure what to expect.',
      objectives: [
        'Open up about mental health concerns',
        'Understand the therapeutic relationship',
        'Ask about treatment options and approaches',
        'Learn about confidentiality and professional boundaries'
      ],
      estimatedTime: '25-30 minutes'
    }
  ],
  
  chronic_care: [
    {
      id: 'cc_diabetes_management',
      title: 'Diabetes Management Visit',
      difficulty: 'Intermediate',
      description: 'Discuss ongoing diabetes care and lifestyle modifications',
      context: 'You have Type 2 diabetes and your recent A1C levels have been higher than target.',
      objectives: [
        'Discuss lifestyle challenges honestly',
        'Participate in treatment plan modifications',
        'Understand long-term health goals',
        'Learn about shared responsibility in chronic disease management'
      ],
      estimatedTime: '20-25 minutes'
    }
  ]
};

export const PATIENT_COMMUNICATION_RUBRIC = {
  preparation: {
    name: 'Preparation & Organization',
    description: 'Came prepared with questions, relevant information, and clear goals',
    maxScore: 10
  },
  active_listening: {
    name: 'Active Listening',
    description: 'Demonstrates understanding of medical information and asks for clarification',
    maxScore: 10
  },
  appropriate_questioning: {
    name: 'Effective Questioning',
    description: 'Asks relevant, constructive questions using frameworks like Ask Me 3+',
    maxScore: 10
  },
  boundary_awareness: {
    name: 'Professional Boundary Awareness',
    description: 'Understands professional vs. service relationship and appropriate expectations',
    maxScore: 10
  },
  shared_decision_participation: {
    name: 'Shared Decision-Making',
    description: 'Actively participates in collaborative treatment planning',
    maxScore: 10
  },
  expectation_management: {
    name: 'Realistic Expectations',
    description: 'Has appropriate understanding of outcomes, timelines, and limitations',
    maxScore: 10
  },
  responsibility_acceptance: {
    name: 'Patient Responsibility',
    description: 'Acknowledges and accepts patient role in care and treatment adherence',
    maxScore: 10
  },
  respectful_communication: {
    name: 'Respectful Interaction',
    description: 'Maintains professional, courteous communication even when frustrated',
    maxScore: 10
  },
  self_advocacy: {
    name: 'Appropriate Self-Advocacy',
    description: 'Speaks up for needs and concerns in constructive, appropriate ways',
    maxScore: 10
  },
  information_processing: {
    name: 'Information Processing',
    description: 'Effectively processes and responds to medical information and recommendations',
    maxScore: 10
  }
};

export const PATIENT_FEEDBACK_CATEGORIES = {
  excellent: { min: 9, color: '#28a745', label: 'Excellent' },
  good: { min: 7, color: '#17a2b8', label: 'Good' },
  needs_improvement: { min: 5, color: '#ffc107', label: 'Needs Improvement' },
  poor: { min: 0, color: '#dc3545', label: 'Needs Significant Work' }
};

export const PROFESSIONALISM_PRINCIPLES = {
  medical_expertise: {
    title: 'Respect for Medical Expertise',
    description: 'Understanding that healthcare providers have specialized training and professional obligations',
    examples: [
      'Trusting professional judgment while still asking questions',
      'Understanding why certain requests may not be appropriate',
      'Recognizing the difference between evidence-based medicine and customer preferences'
    ]
  },
  shared_responsibility: {
    title: 'Shared Responsibility in Care',
    description: 'Recognizing that healthcare is a partnership with mutual responsibilities',
    examples: [
      'Following through on treatment plans',
      'Providing accurate information about symptoms and adherence',
      'Taking an active role in health maintenance'
    ]
  },
  appropriate_advocacy: {
    title: 'Appropriate Self-Advocacy',
    description: 'Learning to advocate effectively within professional relationships',
    examples: [
      'Expressing concerns respectfully and constructively',
      'Asking for second opinions when appropriate',
      'Seeking clarification without being demanding'
    ]
  },
  emergency_vs_routine: {
    title: 'Emergency vs. Routine Care Understanding',
    description: 'Knowing when situations require immediate attention vs. routine follow-up',
    examples: [
      'Understanding triage in emergency departments',
      'Appropriate use of urgent care vs. emergency services',
      'When to call vs. when to schedule an appointment'
    ]
  }
};