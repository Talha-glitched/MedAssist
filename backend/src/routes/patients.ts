import express from 'express';
import { authenticate, AuthRequest, authorize } from '../middleware/auth';
import { catchAsync, CustomError } from '../middleware/errorHandler';
import Patient from '../models/Patient';
import User from '../models/User';
import MedicalNote from '../models/MedicalNote';

const router = express.Router();

// Get all patients for a doctor
router.get('/patients',
    authenticate,
    authorize('doctor'),
    catchAsync(async (req: AuthRequest, res: any) => {
        const doctorId = req.userId;
        const { page = 1, limit = 10, search = '', status = 'active' } = req.query;

        try {
            const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

            // Build search query
            const searchQuery: any = { doctorId };
            if (status !== 'all') {
                searchQuery.status = status;
            }

            if (search) {
                searchQuery.$or = [
                    { patientId: { $regex: search, $options: 'i' } },
                    { 'demographics.phone': { $regex: search, $options: 'i' } },
                ];
            }

            const [patients, total] = await Promise.all([
                Patient.find(searchQuery)
                    .populate('userId', 'name email')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(limit as string)),
                Patient.countDocuments(searchQuery),
            ]);

            // Get consultation counts for each patient
            const patientsWithStats = await Promise.all(
                patients.map(async (patient) => {
                    const consultationCount = await MedicalNote.countDocuments({
                        patientId: patient.userId,
                        doctorId: patient.doctorId,
                    });

                    const lastConsultation = await MedicalNote.findOne({
                        patientId: patient.userId,
                        doctorId: patient.doctorId,
                    })
                        .sort({ createdAt: -1 })
                        .select('createdAt status');

                    return {
                        ...patient.toObject(),
                        consultationCount,
                        lastConsultation: lastConsultation ? {
                            date: lastConsultation.createdAt,
                            status: lastConsultation.status,
                        } : null,
                    };
                })
            );

            res.json({
                success: true,
                data: {
                    patients: patientsWithStats,
                    pagination: {
                        page: parseInt(page as string),
                        limit: parseInt(limit as string),
                        total,
                        pages: Math.ceil(total / parseInt(limit as string)),
                    },
                },
            });

        } catch (error: any) {
            console.error('Get patients error:', error);
            throw new CustomError('Failed to fetch patients', 500);
        }
    })
);

// Get a single patient with full details
router.get('/patients/:id',
    authenticate,
    authorize('doctor'),
    catchAsync(async (req: AuthRequest, res: any) => {
        const { id } = req.params;
        const doctorId = req.userId;

        try {
            const patient = await Patient.findOne({
                $or: [{ _id: id }, { patientId: id }],
                doctorId,
            }).populate('userId', 'name email');

            if (!patient) {
                throw new CustomError('Patient not found', 404);
            }

            // Get patient's consultation history
            const consultations = await MedicalNote.find({
                patientId: patient.userId,
                doctorId: patient.doctorId,
            })
                .sort({ createdAt: -1 })
                .select('createdAt status patientName subjective assessment plan diagnoses');

            // Get consultation statistics
            const stats = await MedicalNote.aggregate([
                {
                    $match: {
                        patientId: patient.userId,
                        doctorId: patient.doctorId,
                    },
                },
                {
                    $group: {
                        _id: null,
                        totalConsultations: { $sum: 1 },
                        avgAccuracy: { $avg: '$processingMetrics.confidenceScore' },
                        avgProcessingTime: { $avg: '$processingMetrics.nlpProcessingTime' },
                    },
                },
            ]);

            const patientStats = stats[0] || {
                totalConsultations: 0,
                avgAccuracy: 0,
                avgProcessingTime: 0,
            };

            res.json({
                success: true,
                data: {
                    patient: {
                        ...patient.toObject(),
                        age: patient.age,
                    },
                    consultations,
                    stats: {
                        totalConsultations: patientStats.totalConsultations,
                        avgAccuracy: Math.round((patientStats.avgAccuracy || 0) * 100),
                        avgProcessingTime: Math.round((patientStats.avgProcessingTime || 0) / 1000),
                    },
                },
            });

        } catch (error: any) {
            console.error('Get patient error:', error);
            throw new CustomError('Failed to fetch patient details', 500);
        }
    })
);

// Create a new patient
router.post('/patients',
    authenticate,
    authorize('doctor'),
    catchAsync(async (req: AuthRequest, res: any) => {
        const doctorId = req.userId;
        const patientData = req.body;

        try {
            // Generate unique patient ID
            const patientId = Patient.generatePatientId(doctorId!);

            // Create or find existing user
            let user = await User.findOne({ email: patientData.email });

            if (!user) {
                // Create new user account for patient
                user = await User.create({
                    name: patientData.name,
                    email: patientData.email,
                    password: Math.random().toString(36).slice(-8), // Generate random password
                    role: 'patient',
                });
            }

            // Create patient record
            const patient = await Patient.create({
                userId: user._id,
                doctorId,
                patientId,
                demographics: {
                    dateOfBirth: patientData.dateOfBirth,
                    gender: patientData.gender,
                    phone: patientData.phone,
                    address: patientData.address,
                    emergencyContact: patientData.emergencyContact,
                },
                medicalHistory: {
                    allergies: patientData.allergies || [],
                    currentMedications: patientData.currentMedications || [],
                    pastSurgeries: patientData.pastSurgeries || [],
                    chronicConditions: patientData.chronicConditions || [],
                    familyHistory: patientData.familyHistory || [],
                },
                insurance: patientData.insurance || {},
                preferences: patientData.preferences || {},
                notes: patientData.notes || '',
            });

            const populatedPatient = await Patient.findById(patient._id)
                .populate('userId', 'name email');

            if (!populatedPatient) {
                throw new CustomError('Failed to create patient', 500);
            }

            res.status(201).json({
                success: true,
                data: {
                    ...populatedPatient.toObject(),
                    age: populatedPatient.age,
                },
                message: 'Patient created successfully',
            });

        } catch (error: any) {
            console.error('Create patient error:', error);
            if (error.code === 11000) {
                throw new CustomError('Patient ID already exists', 400);
            }
            throw new CustomError('Failed to create patient', 500);
        }
    })
);

// Update patient information
router.put('/patients/:id',
    authenticate,
    authorize('doctor'),
    catchAsync(async (req: AuthRequest, res: any) => {
        const { id } = req.params;
        const doctorId = req.userId;
        const updateData = req.body;

        try {
            const patient = await Patient.findOneAndUpdate(
                {
                    $or: [{ _id: id }, { patientId: id }],
                    doctorId,
                },
                updateData,
                { new: true, runValidators: true }
            ).populate('userId', 'name email');

            if (!patient) {
                throw new CustomError('Patient not found', 404);
            }

            res.json({
                success: true,
                data: {
                    ...patient.toObject(),
                    age: patient.age,
                },
                message: 'Patient updated successfully',
            });

        } catch (error: any) {
            console.error('Update patient error:', error);
            throw new CustomError('Failed to update patient', 500);
        }
    })
);

// Delete patient (soft delete by setting status to archived)
router.delete('/patients/:id',
    authenticate,
    authorize('doctor'),
    catchAsync(async (req: AuthRequest, res: any) => {
        const { id } = req.params;
        const doctorId = req.userId;

        try {
            const patient = await Patient.findOneAndUpdate(
                {
                    $or: [{ _id: id }, { patientId: id }],
                    doctorId,
                },
                { status: 'archived' },
                { new: true }
            );

            if (!patient) {
                throw new CustomError('Patient not found', 404);
            }

            res.json({
                success: true,
                message: 'Patient archived successfully',
            });

        } catch (error: any) {
            console.error('Delete patient error:', error);
            throw new CustomError('Failed to archive patient', 500);
        }
    })
);

// Get patients for consultation assignment (active patients only)
router.get('/patients/active',
    authenticate,
    authorize('doctor'),
    catchAsync(async (req: AuthRequest, res: any) => {
        const doctorId = req.userId;
        const { search = '' } = req.query;

        try {
            const searchQuery: any = {
                doctorId,
                status: 'active'
            };

            if (search) {
                searchQuery.$or = [
                    { patientId: { $regex: search, $options: 'i' } },
                    { 'demographics.phone': { $regex: search, $options: 'i' } },
                ];
            }

            const patients = await Patient.find(searchQuery)
                .populate('userId', 'name email')
                .sort({ createdAt: -1 })
                .limit(50); // Limit for dropdown

            const patientsForAssignment = patients.map(patient => ({
                _id: patient._id,
                patientId: patient.patientId,
                name: (patient.userId as any).name,
                email: (patient.userId as any).email,
                phone: patient.demographics.phone,
                age: patient.age,
                gender: patient.demographics.gender,
            }));

            res.json({
                success: true,
                data: patientsForAssignment,
            });

        } catch (error: any) {
            console.error('Get active patients error:', error);
            throw new CustomError('Failed to fetch active patients', 500);
        }
    })
);

// Get patient consultation history
router.get('/patients/:id/consultations',
    authenticate,
    authorize('doctor'),
    catchAsync(async (req: AuthRequest, res: any) => {
        const { id } = req.params;
        const doctorId = req.userId;
        const { page = 1, limit = 10 } = req.query;

        try {
            const patient = await Patient.findOne({
                $or: [{ _id: id }, { patientId: id }],
                doctorId,
            });

            if (!patient) {
                throw new CustomError('Patient not found', 404);
            }

            const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

            const [consultations, total] = await Promise.all([
                MedicalNote.find({
                    patientId: patient.userId,
                    doctorId: patient.doctorId,
                })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(limit as string))
                    .select('createdAt status patientName subjective assessment plan diagnoses processingMetrics'),
                MedicalNote.countDocuments({
                    patientId: patient.userId,
                    doctorId: patient.doctorId,
                }),
            ]);

            res.json({
                success: true,
                data: {
                    consultations,
                    pagination: {
                        page: parseInt(page as string),
                        limit: parseInt(limit as string),
                        total,
                        pages: Math.ceil(total / parseInt(limit as string)),
                    },
                },
            });

        } catch (error: any) {
            console.error('Get patient consultations error:', error);
            throw new CustomError('Failed to fetch patient consultations', 500);
        }
    })
);

export default router;
