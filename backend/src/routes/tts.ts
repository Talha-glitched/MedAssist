import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { catchAsync, CustomError } from '../middleware/errorHandler';
import { generateSpeech, getSupportedVoices } from '../services/ttsService';

const router = express.Router();

// Generate speech from text
router.post('/tts',
  authenticate,
  catchAsync(async (req: AuthRequest, res: any) => {
    const { text, language = 'en', voice = 'default', speed = 1.0 } = req.body;

    if (!text) {
      throw new CustomError('Text is required', 400);
    }

    if (text.length > 2000) {
      throw new CustomError('Text too long. Maximum 2000 characters allowed.', 400);
    }

    try {
      const result = await generateSpeech(text, {
        language,
        voice,
        speed: Math.max(0.5, Math.min(2.0, speed)), // Clamp speed between 0.5 and 2.0
      });

      // Set appropriate headers for audio file
      res.setHeader('Content-Type', 'audio/wav');
      res.setHeader('Content-Length', result.audioBuffer.length);
      res.setHeader('Content-Disposition', 'attachment; filename="speech.wav"');

      // Send the audio buffer
      res.send(result.audioBuffer);

    } catch (error: any) {
      console.error('TTS error:', error);
      throw new CustomError('Speech generation failed', 500);
    }
  })
);

// Generate speech for medical summary
router.post('/tts/summary',
  authenticate,
  catchAsync(async (req: AuthRequest, res: any) => {
    const { summaryText, language = 'en', patientFriendly = true } = req.body;

    if (!summaryText) {
      throw new CustomError('Summary text is required', 400);
    }

    try {
      // Optimize text for TTS (patient-friendly)
      let optimizedText = summaryText;

      if (patientFriendly) {
        // Add pauses and improve readability for audio
        optimizedText = summaryText
          .replace(/\./g, '. ')
          .replace(/,/g, ', ')
          .replace(/:/g, ': ')
          .replace(/\s+/g, ' ')
          .trim();
      }

      const result = await generateSpeech(optimizedText, {
        language,
        voice: 'medical', // Use medical-specific voice if available
        speed: 0.9, // Slightly slower for medical content
      });

      res.setHeader('Content-Type', 'audio/wav');
      res.setHeader('Content-Length', result.audioBuffer.length);
      res.setHeader('Content-Disposition', 'attachment; filename="medical-summary.wav"');

      res.send(result.audioBuffer);

    } catch (error: any) {
      console.error('Medical summary TTS error:', error);
      throw new CustomError('Medical summary speech generation failed', 500);
    }
  })
);

// Get supported voices
router.get('/tts/voices',
  authenticate,
  catchAsync(async (req: AuthRequest, res: any) => {
    const { language } = req.query;

    try {
      const voices = await getSupportedVoices(language as string);

      res.json({
        success: true,
        data: voices,
      });

    } catch (error: any) {
      console.error('Get voices error:', error);
      throw new CustomError('Failed to fetch supported voices', 500);
    }
  })
);

export default router;