import axios from 'axios';
import Transcript from '../models/Transcript';

interface STTResult {
  success: boolean;
  transcript: string;
  confidence: number;
  duration: number;
  speakerLabels: Array<{
    speaker: string;
    text: string;
    startTime: number;
    endTime: number;
    confidence: number;
  }>;
  processingTime: number;
  error?: string;
}

// Mock STT service for development
const mockSTTService = async (audioBuffer: Buffer, language: string = 'en'): Promise<STTResult> => {
  console.log('Mock STT Service called with buffer size:', audioBuffer.length);

  // Simulate processing time
  const startTime = Date.now();
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
  const processingTime = Date.now() - startTime;

  // Mock medical conversation transcripts
  const mockTranscripts = [
    {
      text: "Patient presents with chief complaint of chest pain that started three hours ago. The pain is described as sharp and stabbing, located in the center of the chest, radiating to the left arm. Patient rates the pain as 7 out of 10. No shortness of breath, nausea, or sweating. Patient has a history of hypertension and takes lisinopril 10mg daily. Vital signs show blood pressure 150 over 90, heart rate 88, temperature 98.6 degrees Fahrenheit. Physical examination reveals clear lungs, regular heart rhythm, no murmurs. EKG shows normal sinus rhythm with no ST changes. Chest X-ray is normal. Assessment is atypical chest pain, likely musculoskeletal. Plan includes pain medication, follow-up in one week, and return if symptoms worsen.",
      speakerLabels: [
        {
          speaker: "Doctor",
          text: "Good morning. What brings you in today?",
          startTime: 0.5,
          endTime: 3.2,
          confidence: 0.95
        },
        {
          speaker: "Patient",
          text: "I've been having chest pain for about three hours now. It's really concerning me.",
          startTime: 3.5,
          endTime: 8.1,
          confidence: 0.92
        },
        {
          speaker: "Doctor",
          text: "Can you describe the pain? Is it sharp, dull, crushing?",
          startTime: 8.5,
          endTime: 12.3,
          confidence: 0.96
        },
        {
          speaker: "Patient",
          text: "It's sharp and stabbing, right in the center of my chest. Sometimes it goes down my left arm.",
          startTime: 12.8,
          endTime: 18.4,
          confidence: 0.94
        }
      ]
    },
    {
      text: "Patient is a 45-year-old female presenting for routine annual physical examination. She reports feeling well overall with no acute complaints. She exercises regularly and maintains a healthy diet. Last menstrual period was two weeks ago, regular cycle. She takes a daily multivitamin and omega-3 supplement. Family history significant for diabetes in mother and father. Physical examination shows normal vital signs, BMI 24, normal heart and lung sounds, abdomen soft and non-tender. Laboratory results from last year showed normal cholesterol and blood glucose. Plan includes mammogram screening, colonoscopy scheduling as she turns 50 next year, and continue current healthy lifestyle.",
      speakerLabels: []
    },
    {
      text: "Patient presents with persistent cough and fever for five days. Temperature has been as high as 101.5 degrees Fahrenheit. Cough is productive with yellow-green sputum. Patient reports fatigue and decreased appetite. No recent travel or sick contacts. Physical examination reveals temperature 100.8, increased respiratory rate, crackles in right lower lobe. Chest X-ray shows right lower lobe pneumonia. White blood cell count is elevated at 12,000. Assessment is community-acquired pneumonia. Treatment plan includes antibiotic therapy with azithromycin, supportive care with rest and fluids, follow-up in three days or sooner if symptoms worsen.",
      speakerLabels: []
    }
  ];

  const randomTranscript = mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)];
  const confidence = 0.85 + Math.random() * 0.15; // 0.85 - 1.0
  const duration = 180 + Math.random() * 300; // 3-8 minutes

  const result = {
    success: true,
    transcript: randomTranscript.text,
    confidence,
    duration,
    speakerLabels: randomTranscript.speakerLabels,
    processingTime,
  };

  console.log('Mock STT Service returning:', {
    success: result.success,
    transcriptLength: result.transcript.length,
    confidence: result.confidence
  });

  return result;
};

// Real STT service integration (Hugging Face Whisper)
const realSTTService = async (audioBuffer: Buffer, language: string = 'en'): Promise<STTResult> => {
  const startTime = Date.now();

  try {
    const API_URL = process.env.HUGGINGFACE_STT_URL || 'https://api-inference.huggingface.co/models/openai/whisper-large-v3';
    const API_KEY = process.env.HUGGINGFACE_API_KEY;

    if (!API_KEY) {
      throw new Error('Hugging Face API key not configured');
    }

    // Determine content type based on audio buffer
    let contentType = 'audio/wav';
    if (audioBuffer.length > 4) {
      // Check file signature to determine format
      const signature = audioBuffer.slice(0, 4).toString('hex').toUpperCase();
      if (signature.startsWith('FFFE') || signature.startsWith('FFFE')) {
        contentType = 'audio/wav';
      } else if (signature.startsWith('494433') || signature.startsWith('ID3')) {
        contentType = 'audio/mpeg';
      } else if (signature.startsWith('4F676753')) {
        contentType = 'audio/ogg';
      }
    }

    console.log('Sending audio to Whisper API:', {
      url: API_URL,
      contentType,
      bufferSize: audioBuffer.length
    });

    const response = await axios.post(
      API_URL,
      audioBuffer,
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': contentType,
          'Accept': 'application/json',
        },
        timeout: 60000, // 60 seconds
      }
    );

    const processingTime = Date.now() - startTime;

    if (response.data.error) {
      throw new Error(response.data.error);
    }

    // Whisper API response format
    const result = response.data;

    return {
      success: true,
      transcript: result.text || '',
      confidence: result.confidence || 0.8,
      duration: result.duration || 0,
      speakerLabels: result.chunks || [],
      processingTime,
    };

  } catch (error: any) {
    console.error('STT service error:', error);

    return {
      success: false,
      transcript: '',
      confidence: 0,
      duration: 0,
      speakerLabels: [],
      processingTime: Date.now() - startTime,
      error: error.message,
    };
  }
};

export const processAudioWithSTT = async (
  file: Express.Multer.File,
  transcriptId?: string,
  language: string = 'en'
): Promise<STTResult> => {
  try {
    // Force real service usage
    const hasAPIKey = !!process.env.HUGGINGFACE_API_KEY;

    console.log('STT Processing:', {
      useMockService: false,
      NODE_ENV: process.env.NODE_ENV,
      hasAPIKey,
      fileSize: file.buffer.length,
      mimeType: file.mimetype
    });

    if (!hasAPIKey) {
      throw new Error('HUGGINGFACE_API_KEY is required for real STT processing');
    }

    let result: STTResult;
    try {
      result = await realSTTService(file.buffer, language);
    } catch (error: any) {
      console.error('Real STT service failed:', error.message);
      throw new Error(`STT processing failed: ${error.message}`);
    }

    console.log('STT Result:', {
      success: result.success,
      transcriptLength: result.transcript?.length || 0,
      confidence: result.confidence,
      error: result.error
    });

    // Update transcript in database if transcriptId is provided
    if (transcriptId) {
      const updateData: any = {
        processingMetrics: {
          processingTime: result.processingTime,
          modelVersion: 'whisper-large-v3',
          audioQuality: result.confidence > 0.9 ? 'excellent' :
            result.confidence > 0.7 ? 'good' :
              result.confidence > 0.5 ? 'fair' : 'poor',
        },
      };

      if (result.success) {
        updateData.text = result.transcript;
        updateData.confidence = result.confidence;
        updateData.duration = result.duration;
        updateData.speakerLabels = result.speakerLabels;
        updateData.status = 'completed';
      } else {
        updateData.status = 'failed';
        updateData.errorDetails = result.error;
      }

      await Transcript.findByIdAndUpdate(transcriptId, updateData);
    }

    return result;

  } catch (error: any) {
    console.error('Audio processing error:', error);

    // Update transcript with error status if transcriptId is provided
    if (transcriptId) {
      await Transcript.findByIdAndUpdate(transcriptId, {
        status: 'failed',
        errorDetails: error.message,
      });
    }

    return {
      success: false,
      transcript: '',
      confidence: 0,
      duration: 0,
      speakerLabels: [],
      processingTime: 0,
      error: error.message,
    };
  }
};

export const getSTTStatus = async (transcriptId: string) => {
  const transcript = await Transcript.findById(transcriptId);
  return transcript;
};