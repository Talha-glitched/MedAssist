interface TTSOptions {
  language: string;
  voice: string;
  speed: number;
}

interface TTSResult {
  success: boolean;
  audioBuffer: Buffer;
  processingTime: number;
  error?: string;
}

interface Voice {
  id: string;
  name: string;
  language: string;
  gender: 'male' | 'female';
  description: string;
}

// Mock TTS service for development
const mockTTSService = async (text: string, options: TTSOptions): Promise<TTSResult> => {
  const startTime = Date.now();
  
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  const processingTime = Date.now() - startTime;

  // Generate a mock audio buffer (silence)
  // In a real implementation, this would be actual audio data
  const sampleRate = 44100;
  const duration = Math.ceil(text.length / 10); // Rough estimate: 10 chars per second
  const samples = sampleRate * duration;
  const audioBuffer = Buffer.alloc(samples * 2); // 16-bit samples

  // Fill with quiet sine wave for demo purposes
  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    const frequency = 440; // A4 note
    const amplitude = 0.1; // Quiet
    const sample = Math.sin(2 * Math.PI * frequency * t) * amplitude * 32767;
    audioBuffer.writeInt16LE(Math.round(sample), i * 2);
  }

  return {
    success: true,
    audioBuffer,
    processingTime,
  };
};

// Real TTS service integration (Web Speech API fallback or cloud service)
const realTTSService = async (text: string, options: TTSOptions): Promise<TTSResult> => {
  const startTime = Date.now();
  
  try {
    // In a real implementation, this would connect to a TTS service like:
    // - Google Cloud Text-to-Speech
    // - Amazon Polly
    // - Azure Cognitive Services Speech
    // - Coqui TTS
    
    // For now, fall back to mock service
    return await mockTTSService(text, options);

  } catch (error: any) {
    console.error('TTS service error:', error);
    
    return {
      success: false,
      audioBuffer: Buffer.alloc(0),
      processingTime: Date.now() - startTime,
      error: error.message,
    };
  }
};

export const generateSpeech = async (text: string, options: Partial<TTSOptions> = {}): Promise<TTSResult> => {
  const defaultOptions: TTSOptions = {
    language: 'en',
    voice: 'default',
    speed: 1.0,
  };

  const finalOptions = { ...defaultOptions, ...options };

  // Clean and prepare text for TTS
  const cleanText = text
    .replace(/[^\w\s.,!?;:-]/g, '') // Remove special characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  if (cleanText.length === 0) {
    return {
      success: false,
      audioBuffer: Buffer.alloc(0),
      processingTime: 0,
      error: 'No text to convert',
    };
  }

  if (cleanText.length > 2000) {
    return {
      success: false,
      audioBuffer: Buffer.alloc(0),
      processingTime: 0,
      error: 'Text too long for TTS conversion',
    };
  }

  const useMockService = process.env.NODE_ENV === 'development' || !process.env.TTS_SERVICE_URL;
  
  return useMockService 
    ? await mockTTSService(cleanText, finalOptions)
    : await realTTSService(cleanText, finalOptions);
};

export const getSupportedVoices = async (language?: string): Promise<Voice[]> => {
  const voices: Voice[] = [
    {
      id: 'default',
      name: 'Default Voice',
      language: 'en',
      gender: 'female',
      description: 'Standard English voice',
    },
    {
      id: 'medical',
      name: 'Medical Professional',
      language: 'en',
      gender: 'female',
      description: 'Clear voice optimized for medical content',
    },
    {
      id: 'male-en',
      name: 'English Male',
      language: 'en',
      gender: 'male',
      description: 'Male English voice',
    },
    {
      id: 'es-female',
      name: 'Spanish Female',
      language: 'es',
      gender: 'female',
      description: 'Female Spanish voice',
    },
    {
      id: 'es-male',
      name: 'Spanish Male',
      language: 'es',
      gender: 'male',
      description: 'Male Spanish voice',
    },
  ];

  if (language) {
    return voices.filter(voice => voice.language === language);
  }

  return voices;
};

// Medical-optimized TTS with slower speed and clear pronunciation
export const generateMedicalSpeech = async (
  text: string, 
  language: string = 'en'
): Promise<TTSResult> => {
  // Optimize text for medical TTS
  const medicalOptimizedText = text
    .replace(/mg/g, 'milligrams')
    .replace(/ml/g, 'milliliters')
    .replace(/BP/g, 'blood pressure')
    .replace(/HR/g, 'heart rate')
    .replace(/\b(\d+)\/(\d+)\b/g, '$1 over $2') // Blood pressure readings
    .replace(/°F/g, ' degrees Fahrenheit')
    .replace(/°C/g, ' degrees Celsius')
    .replace(/q6h/g, 'every 6 hours')
    .replace(/PRN/g, 'as needed')
    .replace(/bid/g, 'twice daily')
    .replace(/tid/g, 'three times daily');

  return await generateSpeech(medicalOptimizedText, {
    language,
    voice: 'medical',
    speed: 0.8, // Slower for clarity
  });
};