import axios from 'axios';

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

// Real TTS service integration using ElevenLabs (free tier available)
const realTTSService = async (text: string, options: TTSOptions): Promise<TTSResult> => {
  const startTime = Date.now();

  try {
    // Option 1: ElevenLabs TTS (free tier available)
    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'; // Default voice

    if (ELEVENLABS_API_KEY) {
      const response = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
        {
          text: text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
          },
        },
        {
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': ELEVENLABS_API_KEY,
          },
          responseType: 'arraybuffer',
          timeout: 30000,
        }
      );

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        audioBuffer: Buffer.from(response.data),
        processingTime,
      };
    }

    // Option 2: Google Cloud TTS (requires setup)
    const GOOGLE_CLOUD_API_KEY = process.env.GOOGLE_CLOUD_API_KEY;
    if (GOOGLE_CLOUD_API_KEY) {
      const response = await axios.post(
        `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_CLOUD_API_KEY}`,
        {
          input: { text: text },
          voice: {
            languageCode: options.language,
            name: options.voice,
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: options.speed,
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      const processingTime = Date.now() - startTime;
      const audioContent = response.data.audioContent;

      return {
        success: true,
        audioBuffer: Buffer.from(audioContent, 'base64'),
        processingTime,
      };
    }

    // Option 3: Fallback to mock service if no API keys configured
    console.log('No TTS API keys configured, using mock service');
    return await mockTTSService(text, options);

  } catch (error: any) {
    console.error('TTS service error:', error);

    // Fall back to mock service on error
    return await mockTTSService(text, options);
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

  try {
    // Check if any TTS API key is available
    const hasTTSKeys = process.env.ELEVENLABS_API_KEY || process.env.GOOGLE_CLOUD_API_KEY;

    if (!hasTTSKeys) {
      throw new Error('TTS API key is required for real speech generation');
    }

    return await realTTSService(cleanText, finalOptions);

  } catch (error: any) {
    console.error('TTS generation error:', error);
    throw new Error(`TTS processing failed: ${error.message}`);
  }
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