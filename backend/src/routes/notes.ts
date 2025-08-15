import express from 'express';
import { authenticate, AuthRequest, authorize } from '../middleware/auth';
import { catchAsync, CustomError } from '../middleware/errorHandler';
import MedicalNote from '../models/MedicalNote';
import Transcript from '../models/Transcript';
import { generateSOAPNote, generatePatientSummary } from '../services/nlpService';

const router = express.Router();

// Generate SOAP notes from transcript
router.post('/generate-notes',
  authenticate,
  catchAsync(async (req: AuthRequest, res: any) => {
    const { transcriptId, patientName } = req.body;

    if (!transcriptId) {
      throw new CustomError('Transcript ID is required', 400);
    }

    // Find transcript
    const transcript = await Transcript.findById(transcriptId);
    if (!transcript) {
      throw new CustomError('Transcript not found', 404);
    }

    // Check if user has access to this transcript
    if (transcript.doctorId.toString() !== req.userId) {
      throw new CustomError('Access denied', 403);
    }

    if (transcript.status !== 'completed') {
      throw new CustomError('Transcript is not ready for note generation', 400);
    }

    try {
      // Generate SOAP note using NLP service
      const startTime = Date.now();
      const soapResult = await generateSOAPNote(transcript.text);
      const processingTime = Date.now() - startTime;

      // Generate patient-friendly summary
      const summaryResult = await generatePatientSummary(soapResult.soapNote);

      // Create medical note
      const medicalNote = await MedicalNote.create({
        transcriptId: transcript._id,
        doctorId: req.userId,
        patientId: transcript.patientId || null,
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
      (medicalNote as any).logAccess(req.userId!, 'created');
      await medicalNote.save();

      res.json({
        success: true,
        message: 'Medical notes generated successfully',
        data: {
          noteId: medicalNote._id,
          note: medicalNote,
        },
      });

    } catch (error: any) {
      console.error('Note generation error:', error);
      throw new CustomError('Failed to generate medical notes', 500);
    }
  })
);

// Get all notes for a user
router.get('/notes',
  authenticate,
  catchAsync(async (req: AuthRequest, res: any) => {
    const {
      page = 1,
      limit = 10,
      status,
      startDate,
      endDate,
      patientName,
      patientView = false,
    } = req.query;

    const filter: any = {};

    // Filter by user role and access
    if (req.user?.role === 'doctor') {
      filter.doctorId = req.userId;
    } else {
      filter.patientId = req.userId;
      // Patients can only see approved notes
      filter.status = 'approved';
    }

    // Additional filters (only for doctors)
    if (req.user?.role === 'doctor') {
      if (status) {
        filter.status = status;
      }

      if (patientName) {
        filter.patientName = { $regex: patientName, $options: 'i' };
      }
    }

    if (startDate || endDate) {
      filter.dateOfService = {};
      if (startDate) {
        filter.dateOfService.$gte = new Date(startDate as string);
      }
      if (endDate) {
        filter.dateOfService.$lte = new Date(endDate as string);
      }
    }

    const options = {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      sort: { dateOfService: -1 },
    };

    // For patient view, limit the fields returned
    let projection = {};
    if (patientView || req.user?.role === 'patient') {
      projection = {
        patientName: 1,
        dateOfService: 1,
        patientSummary: 1,
        recommendations: 1,
        followUp: 1,
        status: 1,
        createdAt: 1,
        doctorName: '$doctorId.name',
      };
    }

    const notes = await MedicalNote.find(filter, projection)
      .populate('doctorId', 'name email')
      .populate('patientId', 'name email')
      .sort(options.sort as any)
      .limit(options.limit * options.page)
      .skip((options.page - 1) * options.limit);

    const total = await MedicalNote.countDocuments(filter);

    // Log access for each note
    const userId = req.userId!;
    await Promise.all(notes.map(async (note) => {
      (note as any).logAccess(userId, 'viewed');
      return note.save();
    }));

    res.json({
      success: true,
      data: notes,
      pagination: {
        current: options.page,
        pages: Math.ceil(total / options.limit),
        total,
      },
    });
  })
);

// Get single note
router.get('/notes/:id',
  authenticate,
  catchAsync(async (req: AuthRequest, res: any) => {
    const note = await MedicalNote.findById(req.params.id)
      .populate('doctorId', 'name email')
      .populate('patientId', 'name email')
      .populate('transcriptId');

    if (!note) {
      throw new CustomError('Note not found', 404);
    }

    // Check access permissions
    const hasAccess =
      note.doctorId._id.toString() === req.userId ||
      (note.patientId && note.patientId._id.toString() === req.userId && note.status === 'approved');

    if (!hasAccess) {
      throw new CustomError('Access denied', 403);
    }

    // Log access
    (note as any).logAccess(req.userId!, 'viewed', req.ip);
    await note.save();

    // For patients, return limited information
    let responseData = note.toObject();
    if (req.user?.role === 'patient') {
      responseData = {
        _id: note._id,
        patientName: note.patientName,
        dateOfService: note.dateOfService,
        patientSummary: note.patientSummary,
        recommendations: note.recommendations,
        followUp: note.followUp,
        status: note.status,
        createdAt: note.createdAt,
        doctorId: note.doctorId,
      } as any;
    }

    res.json({
      success: true,
      data: responseData,
    });
  })
);

// Update note (only doctors)
router.put('/notes/:id',
  authenticate,
  authorize('doctor'),
  catchAsync(async (req: AuthRequest, res: any) => {
    const note = await MedicalNote.findById(req.params.id);

    if (!note) {
      throw new CustomError('Note not found', 404);
    }

    // Check if doctor owns this note
    if (note.doctorId.toString() !== req.userId) {
      throw new CustomError('You can only edit your own notes', 403);
    }

    // Can't edit approved notes
    if (note.status === 'approved') {
      throw new CustomError('Cannot edit approved notes', 400);
    }

    const allowedFields = [
      'subjective', 'objective', 'assessment', 'plan',
      'medications', 'diagnoses', 'recommendations', 'followUp',
      'patientSummary', 'vitalSigns',
    ];

    const updateData: any = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    // Add edit history
    const changes = Object.keys(updateData).join(', ');
    (note as any).addEditHistory(req.userId!, `Updated: ${changes}`);

    const updatedNote = await MedicalNote.findByIdAndUpdate(
      req.params.id,
      { ...updateData, editHistory: note.editHistory },
      { new: true, runValidators: true }
    );

    // Log access
    (updatedNote as any)!.logAccess(req.userId!, 'edited', req.ip);
    await updatedNote!.save();

    res.json({
      success: true,
      message: 'Note updated successfully',
      data: updatedNote,
    });
  })
);

// Approve note (only doctors)
router.put('/notes/:id/approve',
  authenticate,
  authorize('doctor'),
  catchAsync(async (req: AuthRequest, res: any) => {
    const note = await MedicalNote.findById(req.params.id);

    if (!note) {
      throw new CustomError('Note not found', 404);
    }

    // Check if doctor owns this note
    if (note.doctorId.toString() !== req.userId) {
      throw new CustomError('You can only approve your own notes', 403);
    }

    if (note.status === 'approved') {
      throw new CustomError('Note is already approved', 400);
    }

    note.status = 'approved';
    note.approvedBy = req.userId! as any;
    note.approvedAt = new Date();

    // Log access
    (note as any).logAccess(req.userId!, 'approved', req.ip);
    await note.save();

    res.json({
      success: true,
      message: 'Note approved successfully',
      data: note,
    });
  })
);

// Reject note (only doctors)
router.put('/notes/:id/reject',
  authenticate,
  authorize('doctor'),
  catchAsync(async (req: AuthRequest, res: any) => {
    const { reason } = req.body;

    if (!reason) {
      throw new CustomError('Rejection reason is required', 400);
    }

    const note = await MedicalNote.findById(req.params.id);

    if (!note) {
      throw new CustomError('Note not found', 404);
    }

    // Check if doctor owns this note
    if (note.doctorId.toString() !== req.userId) {
      throw new CustomError('You can only reject your own notes', 403);
    }

    note.status = 'rejected';
    note.rejectionReason = reason;

    // Log access
    (note as any).logAccess(req.userId!, 'rejected', req.ip);
    await note.save();

    res.json({
      success: true,
      message: 'Note rejected',
      data: note,
    });
  })
);

// Export note as PDF
router.get('/notes/:id/pdf',
  authenticate,
  catchAsync(async (req: AuthRequest, res: any) => {
    const note = await MedicalNote.findById(req.params.id)
      .populate('doctorId', 'name email')
      .populate('patientId', 'name email');

    if (!note) {
      throw new CustomError('Note not found', 404);
    }

    // Check access permissions
    const hasAccess =
      note.doctorId._id.toString() === req.userId ||
      (note.patientId && note.patientId._id.toString() === req.userId && note.status === 'approved');

    if (!hasAccess) {
      throw new CustomError('Access denied', 403);
    }

    try {
      // TODO: Implement PDF generation service
      // For now, return a simple text representation
      const content = `
MEDICAL NOTE - ${note.patientName}
Date of Service: ${note.dateOfService.toLocaleDateString()}
Doctor: ${(note.doctorId as any).name}

SUBJECTIVE:
${note.subjective}

OBJECTIVE:
${note.objective}

ASSESSMENT:
${note.assessment}

PLAN:
${note.plan}

${note.medications.length ? `MEDICATIONS:\n${note.medications.join('\n')}` : ''}
${note.recommendations.length ? `\nRECOMMENDATIONS:\n${note.recommendations.join('\n')}` : ''}
${note.followUp ? `\nFOLLOW-UP:\n${note.followUp}` : ''}
      `.trim();

      // Log access
      (note as any).logAccess(req.userId!, 'exported', req.ip);
      await note.save();

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="medical-note-${note._id}.pdf"`);

      // For now, send as text (in production, use a PDF library)
      res.send(Buffer.from(content, 'utf-8'));

    } catch (error: any) {
      console.error('PDF export error:', error);
      throw new CustomError('Failed to export PDF', 500);
    }
  })
);

export default router;