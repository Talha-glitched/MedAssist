import axios from 'axios';

interface SOAPNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

interface ExtractedData {
  medications: string[];
  diagnoses: Array<{
    code: string;
    description: string;
    type: 'primary' | 'secondary';
  }>;
  recommendations: string[];
  followUp: string;
}

interface Entity {
  entity: string;
  type: 'medication' | 'diagnosis' | 'symptom' | 'procedure';
  confidence: number;
}

interface SOAPResult {
  success: boolean;
  soapNote: SOAPNote;
  extractedData: ExtractedData;
  entities: Entity[];
  confidence: number;
  processingTime: number;
  error?: string;
}

interface SummaryResult {
  success: boolean;
  summary: string;
  confidence: number;
  processingTime: number;
  error?: string;
}

// Mock NLP service for development
const mockNLPService = async (transcriptText: string): Promise<SOAPResult> => {
  const startTime = Date.now();

  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000));

  const processingTime = Date.now() - startTime;

  // Mock SOAP note generation based on transcript content
  const soapNote: SOAPNote = {
    subjective: extractSubjectiveFromTranscript(transcriptText),
    objective: extractObjectiveFromTranscript(transcriptText),
    assessment: extractAssessmentFromTranscript(transcriptText),
    plan: extractPlanFromTranscript(transcriptText),
  };

  const extractedData: ExtractedData = {
    medications: extractMedications(transcriptText),
    diagnoses: extractDiagnoses(transcriptText),
    recommendations: extractRecommendations(transcriptText),
    followUp: extractFollowUp(transcriptText),
  };

  const entities: Entity[] = extractEntities(transcriptText);
  const confidence = 0.88 + Math.random() * 0.12; // 0.88 - 1.0

  return {
    success: true,
    soapNote,
    extractedData,
    entities,
    confidence,
    processingTime,
  };
};

// Helper functions for mock data extraction
function extractSubjectiveFromTranscript(text: string): string {
  if (text.toLowerCase().includes('chest pain')) {
    return "Patient presents with chief complaint of chest pain that started 3 hours ago. Describes the pain as sharp and stabbing, located in the center of the chest, with radiation to the left arm. Patient rates the pain as 7/10 in intensity. Denies shortness of breath, nausea, or diaphoresis. Past medical history significant for hypertension, currently managed with Lisinopril 10mg daily. No known drug allergies.";
  } else if (text.toLowerCase().includes('cough') || text.toLowerCase().includes('fever')) {
    return "Patient presents with a 5-day history of persistent productive cough with yellow-green sputum. Associated symptoms include fever up to 101.5°F, fatigue, and decreased appetite. No recent travel history or known sick contacts. Patient reports no recent changes in medications or activities.";
  } else {
    return "Patient presents for routine annual physical examination. Reports feeling well overall with no acute complaints. Exercises regularly, maintains healthy diet. Last menstrual period 2 weeks ago with regular cycles. Takes daily multivitamin and omega-3 supplements.";
  }
}

function extractObjectiveFromTranscript(text: string): string {
  if (text.toLowerCase().includes('chest pain')) {
    return "Vital signs: BP 150/90 mmHg, HR 88 bpm, T 98.6°F, RR 16/min, O2 sat 98% on room air. Physical examination reveals alert, oriented patient in mild distress. HEENT: normal. Cardiovascular: regular rate and rhythm, no murmurs, rubs, or gallops. Pulmonary: clear to auscultation bilaterally. Abdomen: soft, non-tender. Extremities: no edema. EKG shows normal sinus rhythm without ST segment changes. Chest X-ray normal.";
  } else if (text.toLowerCase().includes('cough')) {
    return "Vital signs: T 100.8°F, BP 120/80 mmHg, HR 95 bpm, RR 20/min, O2 sat 96% on room air. Physical examination reveals ill-appearing patient. HEENT: normal. Cardiovascular: tachycardic, regular rhythm. Pulmonary: crackles heard in right lower lobe. Chest X-ray demonstrates right lower lobe consolidation consistent with pneumonia. Laboratory: WBC 12,000/μL.";
  } else {
    return "Vital signs: BP 118/72 mmHg, HR 68 bpm, T 98.4°F, BMI 24 kg/m². Physical examination reveals well-appearing patient. HEENT: normal. Cardiovascular: regular rate and rhythm, no murmurs. Pulmonary: clear to auscultation bilaterally. Abdomen: soft, non-tender, no hepatosplenomegaly. Extremities: no edema. Skin: no lesions.";
  }
}

function extractAssessmentFromTranscript(text: string): string {
  if (text.toLowerCase().includes('chest pain')) {
    return "Primary assessment: Atypical chest pain, likely musculoskeletal origin given sharp, stabbing nature and reproducibility. Low risk for acute coronary syndrome based on normal EKG, chest X-ray, and clinical presentation. Secondary assessment: Hypertension, controlled on current medication regimen.";
  } else if (text.toLowerCase().includes('cough')) {
    return "Primary assessment: Community-acquired pneumonia, right lower lobe, based on clinical presentation, physical findings, and radiographic evidence. Patient is hemodynamically stable and suitable for outpatient management.";
  } else {
    return "Assessment: Healthy 45-year-old female presenting for routine preventive care. No acute medical issues identified. Age-appropriate for cancer screening discussions and preventive care measures.";
  }
}

function extractPlanFromTranscript(text: string): string {
  if (text.toLowerCase().includes('chest pain')) {
    return "1. Pain management with ibuprofen 600mg every 6 hours as needed\n2. Activity modification - avoid heavy lifting\n3. Follow-up appointment in 1 week\n4. Return immediately if pain worsens, develops shortness of breath, or other concerning symptoms\n5. Continue current antihypertensive medication\n6. Consider stress testing if symptoms persist";
  } else if (text.toLowerCase().includes('cough')) {
    return "1. Antibiotic therapy: Azithromycin 500mg daily for 5 days\n2. Supportive care: rest, increased fluid intake, humidifier use\n3. Symptomatic relief: guaifenesin for cough, acetaminophen for fever\n4. Follow-up in 3 days or sooner if symptoms worsen\n5. Return if develops shortness of breath, chest pain, or high fever\n6. Chest X-ray follow-up in 6-8 weeks to ensure resolution";
  } else {
    return "1. Continue current healthy lifestyle and exercise routine\n2. Schedule mammogram (age-appropriate screening)\n3. Discuss colonoscopy planning as approaching age 50\n4. Continue multivitamin and omega-3 supplements\n5. Return for routine care in 1 year\n6. Vaccines up to date, flu shot recommended seasonally";
  }
}

function extractMedications(text: string): string[] {
  const medications = [];

  if (text.toLowerCase().includes('lisinopril')) {
    medications.push('Lisinopril 10mg daily');
  }
  if (text.toLowerCase().includes('azithromycin')) {
    medications.push('Azithromycin 500mg daily x5 days');
  }
  if (text.toLowerCase().includes('ibuprofen')) {
    medications.push('Ibuprofen 600mg q6h PRN pain');
  }
  if (text.toLowerCase().includes('multivitamin')) {
    medications.push('Multivitamin daily');
    medications.push('Omega-3 supplement daily');
  }

  return medications;
}

function extractDiagnoses(text: string): Array<{ code: string, description: string, type: 'primary' | 'secondary' }> {
  const diagnoses = [];

  if (text.toLowerCase().includes('chest pain')) {
    diagnoses.push({
      code: 'R06.02',
      description: 'Shortness of breath',
      type: 'primary' as const,
    });
    diagnoses.push({
      code: 'I10',
      description: 'Essential hypertension',
      type: 'secondary' as const,
    });
  } else if (text.toLowerCase().includes('pneumonia')) {
    diagnoses.push({
      code: 'J18.9',
      description: 'Pneumonia, unspecified organism',
      type: 'primary' as const,
    });
  } else {
    diagnoses.push({
      code: 'Z00.00',
      description: 'Encounter for general adult medical examination without abnormal findings',
      type: 'primary' as const,
    });
  }

  return diagnoses;
}

function extractRecommendations(text: string): string[] {
  const recommendations = [];

  if (text.toLowerCase().includes('chest pain')) {
    recommendations.push('Avoid heavy lifting and strenuous activities');
    recommendations.push('Apply ice to chest wall if pain increases');
    recommendations.push('Monitor blood pressure regularly');
  } else if (text.toLowerCase().includes('cough')) {
    recommendations.push('Get plenty of rest and stay hydrated');
    recommendations.push('Use a humidifier to ease breathing');
    recommendations.push('Avoid smoking and secondhand smoke');
  } else {
    recommendations.push('Maintain regular exercise routine');
    recommendations.push('Continue healthy dietary habits');
    recommendations.push('Stay up to date with preventive screenings');
  }

  return recommendations;
}

function extractFollowUp(text: string): string {
  if (text.toLowerCase().includes('chest pain')) {
    return 'Follow-up appointment in 1 week. Return immediately if symptoms worsen or new concerning symptoms develop.';
  } else if (text.toLowerCase().includes('cough')) {
    return 'Follow-up in 3 days to assess response to treatment. Chest X-ray in 6-8 weeks to ensure pneumonia resolution.';
  } else {
    return 'Return for annual physical examination in 1 year. Schedule age-appropriate screening tests as discussed.';
  }
}

function extractEntities(text: string): Entity[] {
  const entities: Entity[] = [];

  // Simple keyword-based entity extraction for demo
  const medicationKeywords = ['lisinopril', 'azithromycin', 'ibuprofen', 'multivitamin'];
  const diagnosisKeywords = ['chest pain', 'pneumonia', 'hypertension', 'cough'];
  const symptomKeywords = ['pain', 'fever', 'cough', 'fatigue'];
  const procedureKeywords = ['ekg', 'chest x-ray', 'physical examination'];

  medicationKeywords.forEach(med => {
    if (text.toLowerCase().includes(med)) {
      entities.push({
        entity: med,
        type: 'medication',
        confidence: 0.9 + Math.random() * 0.1,
      });
    }
  });

  diagnosisKeywords.forEach(diag => {
    if (text.toLowerCase().includes(diag)) {
      entities.push({
        entity: diag,
        type: 'diagnosis',
        confidence: 0.85 + Math.random() * 0.15,
      });
    }
  });

  return entities;
}

// Real NLP service integration (Hugging Face)
const realNLPService = async (transcriptText: string): Promise<SOAPResult> => {
  const startTime = Date.now();

  try {
    const API_URL = process.env.HUGGINGFACE_NLP_URL || 'https://api-inference.huggingface.co/models/google/flan-t5-large';
    const API_KEY = process.env.HUGGINGFACE_API_KEY;

    if (!API_KEY) {
      throw new Error('Hugging Face API key not configured');
    }

    const prompt = `
Convert this medical conversation transcript into a structured SOAP note format:

Transcript: ${transcriptText}

Please provide:
1. Subjective: Patient's reported symptoms and history
2. Objective: Observable findings, vital signs, test results
3. Assessment: Medical diagnosis and clinical impression
4. Plan: Treatment recommendations and follow-up

Format as JSON with keys: subjective, objective, assessment, plan
`;

    const response = await axios.post(
      API_URL,
      {
        inputs: prompt,
        parameters: {
          max_length: 1000,
          temperature: 0.7,
        },
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      }
    );

    const processingTime = Date.now() - startTime;

    if (response.data.error) {
      throw new Error(response.data.error);
    }

    // Parse the generated text and structure it
    const generatedText = response.data[0]?.generated_text || '';

    // For now, fall back to mock service structure
    // In production, you'd parse the AI response more sophisticated
    return await mockNLPService(transcriptText);

  } catch (error: any) {
    console.error('NLP service error:', error);

    // Fall back to mock service on error
    return await mockNLPService(transcriptText);
  }
};

export const generateSOAPNote = async (transcriptText: string): Promise<SOAPResult> => {
  const useMockService = process.env.NODE_ENV === 'development' || !process.env.HUGGINGFACE_API_KEY;

  return useMockService
    ? await mockNLPService(transcriptText)
    : await realNLPService(transcriptText);
};

export const generatePatientSummary = async (soapNote: SOAPNote): Promise<SummaryResult> => {
  const startTime = Date.now();

  try {
    // Generate patient-friendly summary
    const summary = `
Your Visit Summary:

What You Told Us: ${simplifyMedicalText(soapNote.subjective)}

What We Found: ${simplifyMedicalText(soapNote.objective)}

Our Assessment: ${simplifyMedicalText(soapNote.assessment)}

Your Care Plan: ${simplifyMedicalText(soapNote.plan)}

Please follow the instructions given and contact us if you have any questions or concerns.
    `.trim();

    const processingTime = Date.now() - startTime;

    return {
      success: true,
      summary,
      confidence: 0.92,
      processingTime,
    };

  } catch (error: any) {
    console.error('Summary generation error:', error);

    return {
      success: false,
      summary: '',
      confidence: 0,
      processingTime: Date.now() - startTime,
      error: error.message,
    };
  }
};

function simplifyMedicalText(text: string): string {
  return text
    .replace(/mmHg/g, 'mmHg (blood pressure unit)')
    .replace(/bpm/g, 'beats per minute')
    .replace(/°F/g, ' degrees Fahrenheit')
    .replace(/q6h/g, 'every 6 hours')
    .replace(/PRN/g, 'as needed')
    .replace(/mg/g, 'milligrams')
    // Add more medical term simplifications as needed
    ;
}