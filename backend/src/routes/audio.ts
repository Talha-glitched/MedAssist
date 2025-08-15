import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import { authenticate, AuthRequest } from '../middleware/auth';
import { uploadRateLimit } from '../middleware/rateLimiter';
import { catchAsync, CustomError } from '../middleware/errorHandler';
import Transcript from '../models/Transcript';
import { processAudioWithSTT } from '../services/sttService';
import { generateSOAPNote, generatePatientSummary } from '../services/nlpService';
import MedicalNote from '../models/MedicalNote';

const router = express.Router();

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'audio/mpeg',
      'audio/wav',
      'audio/mp4',
      'audio/m4a',
      'audio/webm',
      'audio/ogg',
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new CustomError('Invalid file type. Please upload an audio file.', 400));
    }
  },
});

// Upload and process audio
router.post('/upload-audio',
  authenticate,
  uploadRateLimit,
  upload.single('audio'),
  catchAsync(async (req: AuthRequest, res: any) => {
    if (!req.file) {
      throw new CustomError('No audio file provided', 400);
    }

    const { patientName, patientId, language = 'en' } = req.body;

    if (!patientName) {
      throw new CustomError('Patient name is required', 400);
    }

    // Generate unique session ID
    const sessionId = `session_${Date.now()}_${req.userId}`;
    const audioFileId = `audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Process audio with STT service first
      const sttResult = await processAudioWithSTT(req.file, '', language);

      // Create transcript record with actual results
      const transcript = await Transcript.create({
        audioFileId,
        text: sttResult.success ? sttResult.transcript : 'Processing failed',
        confidence: sttResult.confidence,
        duration: sttResult.duration,
        language,
        speakerLabels: sttResult.speakerLabels || [],
        processingMetrics: {
          processingTime: sttResult.processingTime,
          modelVersion: 'whisper-large-v3',
          audioQuality: sttResult.confidence > 0.9 ? 'excellent' :
            sttResult.confidence > 0.7 ? 'good' :
              sttResult.confidence > 0.5 ? 'fair' : 'poor',
        },
        doctorId: req.userId,
        patientId: patientId || null,
        sessionId,
        status: sttResult.success ? 'completed' : 'failed',
        errorDetails: sttResult.error,
      });

      // Generate SOAP notes automatically if transcript was successful
      let medicalNote = null;
      if (sttResult.success && sttResult.transcript) {
        try {
          // Generate SOAP note using NLP service
          const startTime = Date.now();
          const soapResult = await generateSOAPNote(sttResult.transcript);
          const processingTime = Date.now() - startTime;

          // Generate patient-friendly summary
          const summaryResult = await generatePatientSummary(soapResult.soapNote);

          // Create medical note
          medicalNote = await MedicalNote.create({
            transcriptId: transcript._id,
            doctorId: req.userId,
            patientId: patientId || null,
            patientName: patientName || 'Anonymous Patient',
            dateOfService: new Date(),
            sessionId: transcript.sessionId,

            // SOAP sections
            subjective: soapResult.soapNote.subjective,
            objective: soapResult.soapNote.objective,
            assessment: soapResult.soapNote.assessment,
            plan: soapResult.soapNote.plan,

            // Additional information
            medications: soapResult.extractedData.medications || [],
            diagnoses: soapResult.extractedData.diagnoses || [],
            recommendations: soapResult.extractedData.recommendations || [],
            followUp: soapResult.extractedData.followUp || '',

            // Patient summary
            patientSummary: summaryResult.summary,

            // Processing metadata
            processingMetrics: {
              nlpProcessingTime: processingTime,
              confidenceScore: soapResult.confidence,
              modelVersion: 'flan-t5-large',
              extractedEntities: soapResult.entities || [],
            },

            status: 'pending',
            isEncrypted: false,
          });

          // Log access
          (medicalNote as any).logAccess(new mongoose.Types.ObjectId(req.userId!), 'created');
          await medicalNote.save();

        } catch (noteError: any) {
          console.error('SOAP note generation error:', noteError);
          // Don't fail the entire request if note generation fails
        }
      }

      res.json({
        success: true,
        message: sttResult.success ? 'Audio processed and notes generated successfully' : 'Audio processing failed',
        data: {
          transcriptId: transcript._id,
          sessionId,
          audioFileId,
          status: transcript.status,
          transcript: sttResult.success ? sttResult.transcript : null,
          confidence: sttResult.confidence,
          duration: sttResult.duration,
          noteId: medicalNote?._id || null,
          noteGenerated: !!medicalNote,
        },
      });

    } catch (error: any) {
      console.error('Audio upload error:', error);
      throw new CustomError('Failed to process audio upload', 500);
    }
  })
);

// Get transcript status
router.get('/transcript/:id/status',
  authenticate,
  catchAsync(async (req: AuthRequest, res: any) => {
    const transcript = await Transcript.findById(req.params.id);

    if (!transcript) {
      throw new CustomError('Transcript not found', 404);
    }

    // Check if user has access to this transcript
    if (transcript.doctorId.toString() !== req.userId &&
      (!transcript.patientId || transcript.patientId.toString() !== req.userId)) {
      throw new CustomError('Access denied', 403);
    }

    res.json({
      success: true,
      data: {
        id: transcript._id,
        status: transcript.status,
        confidence: transcript.confidence,
        duration: transcript.duration,
        processingTime: transcript.processingMetrics.processingTime,
        errorDetails: transcript.errorDetails,
        createdAt: transcript.createdAt,
        updatedAt: transcript.updatedAt,
      },
    });
  })
);

// Get complete transcript
router.get('/transcript/:id',
  authenticate,
  catchAsync(async (req: AuthRequest, res: any) => {
    const transcript = await Transcript.findById(req.params.id)
      .populate('doctorId', 'name email')
      .populate('patientId', 'name email');

    if (!transcript) {
      throw new CustomError('Transcript not found', 404);
    }

    // Check if user has access to this transcript
    if (transcript.doctorId._id.toString() !== req.userId &&
      (!transcript.patientId || transcript.patientId._id.toString() !== req.userId)) {
      throw new CustomError('Access denied', 403);
    }

    res.json({
      success: true,
      data: transcript,
    });
  })
);

// Update transcript (for corrections)
router.put('/transcript/:id',
  authenticate,
  catchAsync(async (req: AuthRequest, res: any) => {
    const { text, speakerLabels } = req.body;

    const transcript = await Transcript.findById(req.params.id);

    if (!transcript) {
      throw new CustomError('Transcript not found', 404);
    }

    // Only doctor can edit transcript
    if (transcript.doctorId.toString() !== req.userId) {
      throw new CustomError('Only the consulting doctor can edit this transcript', 403);
    }

    const updatedData: any = {};

    if (text !== undefined) {
      updatedData.text = text;
    }

    if (speakerLabels !== undefined) {
      updatedData.speakerLabels = speakerLabels;
    }

    const updatedTranscript = await Transcript.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Transcript updated successfully',
      data: updatedTranscript,
    });
  })
);

// Get transcripts for a user
router.get('/transcripts',
  authenticate,
  catchAsync(async (req: AuthRequest, res: any) => {
    const {
      page = 1,
      limit = 10,
      status,
      language,
      startDate,
      endDate,
    } = req.query;

    const filter: any = {};

    // Filter by user role
    if (req.user?.role === 'doctor') {
      filter.doctorId = req.userId;
    } else {
      filter.patientId = req.userId;
    }

    // Additional filters
    if (status) {
      filter.status = status;
    }

    if (language) {
      filter.language = language;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate as string);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate as string);
      }
    }

    const options = {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      sort: { createdAt: -1 },
      populate: [
        { path: 'doctorId', select: 'name email' },
        { path: 'patientId', select: 'name email' },
      ],
    };

    const transcripts = await Transcript.find(filter)
      .populate(options.populate)
      .sort(options.sort as any)
      .limit(options.limit * options.page)
      .skip((options.page - 1) * options.limit);

    const total = await Transcript.countDocuments(filter);

    res.json({
      success: true,
      data: transcripts,
      pagination: {
        current: options.page,
        pages: Math.ceil(total / options.limit),
        total,
      },
    });
  })
);

export default router;