import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { catchAsync, CustomError } from '../middleware/errorHandler';
import { translateText, getSupportedLanguages } from '../services/translationService';

const router = express.Router();

// Translate text
router.post('/translate',
  authenticate,
  catchAsync(async (req: AuthRequest, res: any) => {
    const { text, targetLanguage, sourceLanguage = 'en' } = req.body;

    if (!text || !targetLanguage) {
      throw new CustomError('Text and target language are required', 400);
    }

    if (text.length > 5000) {
      throw new CustomError('Text too long. Maximum 5000 characters allowed.', 400);
    }

    try {
      const result = await translateText(text, sourceLanguage, targetLanguage);

      res.json({
        success: true,
        data: {
          originalText: text,
          translatedText: result.translatedText,
          sourceLanguage: result.detectedSourceLanguage || sourceLanguage,
          targetLanguage,
          confidence: result.confidence,
          processingTime: result.processingTime,
        },
      });

    } catch (error: any) {
      console.error('Translation error:', error);
      throw new CustomError('Translation failed', 500);
    }
  })
);

// Get supported languages
router.get('/translate/languages',
  authenticate,
  catchAsync(async (req: AuthRequest, res: any) => {
    try {
      const languages = await getSupportedLanguages();

      res.json({
        success: true,
        data: languages,
      });

    } catch (error: any) {
      console.error('Get languages error:', error);
      throw new CustomError('Failed to fetch supported languages', 500);
    }
  })
);

// Translate medical note summary
router.post('/translate/summary',
  authenticate,
  catchAsync(async (req: AuthRequest, res: any) => {
    const { summaryText, targetLanguage } = req.body;

    if (!summaryText || !targetLanguage) {
      throw new CustomError('Summary text and target language are required', 400);
    }

    try {
      // Add medical context to improve translation accuracy
      const medicalContext = `This is a medical summary for a patient. Please translate accurately maintaining medical terminology:

${summaryText}`;

      const result = await translateText(medicalContext, 'en', targetLanguage);

      res.json({
        success: true,
        data: {
          originalSummary: summaryText,
          translatedSummary: result.translatedText,
          targetLanguage,
          confidence: result.confidence,
          processingTime: result.processingTime,
        },
      });

    } catch (error: any) {
      console.error('Summary translation error:', error);
      throw new CustomError('Summary translation failed', 500);
    }
  })
);

export default router;