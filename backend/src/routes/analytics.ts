import express from 'express';
import { authenticate, AuthRequest, authorize } from '../middleware/auth';
import { catchAsync, CustomError } from '../middleware/errorHandler';
import MedicalNote from '../models/MedicalNote';
import Transcript from '../models/Transcript';
import User from '../models/User';

const router = express.Router();

// Dashboard statistics
router.get('/analytics/dashboard',
  authenticate,
  authorize('doctor'),
  catchAsync(async (req: AuthRequest, res: any) => {
    const doctorId = req.userId;

    try {
      const [
        totalConsultations,
        todayConsultations,
        pendingNotes,
        avgProcessingTime,
      ] = await Promise.all([
        MedicalNote.countDocuments({ doctorId }),
        MedicalNote.countDocuments({
          doctorId,
          createdAt: {
            $gte: new Date(new Date().setHours(0, 0, 0, 0)),
            $lte: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        }),
        MedicalNote.countDocuments({ doctorId, status: 'pending' }),
        Transcript.aggregate([
          { $match: { doctorId: doctorId } },
          { $group: { _id: null, avgTime: { $avg: '$processingMetrics.processingTime' } } },
        ]),
      ]);

      const averageProcessingTime = avgProcessingTime[0]?.avgTime || 0;

      res.json({
        success: true,
        data: {
          totalConsultations,
          todayConsultations,
          pendingNotes,
          averageProcessingTime: Math.round(averageProcessingTime / 1000), // Convert to seconds
        },
      });

    } catch (error: any) {
      console.error('Dashboard analytics error:', error);
      throw new CustomError('Failed to fetch dashboard statistics', 500);
    }
  })
);

// Usage statistics
router.get('/analytics/usage',
  authenticate,
  authorize('doctor'),
  catchAsync(async (req: AuthRequest, res: any) => {
    const { days = 30 } = req.query;
    const doctorId = req.userId;
    const daysCount = parseInt(days as string);

    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysCount);

      // Consultation trends
      const consultationTrends = await MedicalNote.aggregate([
        {
          $match: {
            doctorId: doctorId,
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' },
            },
            consultations: { $sum: 1 },
          },
        },
        {
          $project: {
            date: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: {
                  $dateFromParts: {
                    year: '$_id.year',
                    month: '$_id.month',
                    day: '$_id.day',
                  },
                },
              },
            },
            consultations: 1,
            _id: 0,
          },
        },
        { $sort: { date: 1 } },
      ]);

      // Status distribution
      const statusDistribution = await MedicalNote.aggregate([
        { $match: { doctorId: doctorId, createdAt: { $gte: startDate } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $project: { name: '$_id', count: 1, _id: 0 } },
      ]);

      res.json({
        success: true,
        data: {
          consultationTrends,
          statusDistribution,
          period: {
            days: daysCount,
            startDate,
            endDate: new Date(),
          },
        },
      });

    } catch (error: any) {
      console.error('Usage analytics error:', error);
      throw new CustomError('Failed to fetch usage statistics', 500);
    }
  })
);

// Performance metrics
router.get('/analytics/performance',
  authenticate,
  authorize('doctor'),
  catchAsync(async (req: AuthRequest, res: any) => {
    const doctorId = req.userId;

    try {
      // Processing metrics by service
      const processingMetrics = await Transcript.aggregate([
        { $match: { doctorId: doctorId, status: 'completed' } },
        {
          $project: {
            sttTime: '$processingMetrics.processingTime',
            nlpTime: { $ifNull: ['$nlpProcessingTime', 0] },
          },
        },
        {
          $group: {
            _id: null,
            avgSTTTime: { $avg: '$sttTime' },
            avgNLPTime: { $avg: '$nlpTime' },
          },
        },
        {
          $project: {
            _id: 0,
            data: [
              { service: 'Speech-to-Text', avgTime: { $round: [{ $divide: ['$avgSTTTime', 1000] }, 2] } },
              { service: 'NLP Processing', avgTime: { $round: [{ $divide: ['$avgNLPTime', 1000] }, 2] } },
            ],
          },
        },
      ]);

      // Accuracy statistics
      const accuracyStats = await Transcript.aggregate([
        { $match: { doctorId: doctorId, status: 'completed' } },
        {
          $bucket: {
            groupBy: '$confidence',
            boundaries: [0, 0.6, 0.8, 0.9, 1.0],
            default: 'other',
            output: { count: { $sum: 1 } },
          },
        },
        {
          $project: {
            range: {
              $switch: {
                branches: [
                  { case: { $eq: ['$_id', 0] }, then: '0-60%' },
                  { case: { $eq: ['$_id', 0.6] }, then: '60-80%' },
                  { case: { $eq: ['$_id', 0.8] }, then: '80-90%' },
                  { case: { $eq: ['$_id', 0.9] }, then: '90-100%' },
                ],
                default: 'Other',
              },
            },
            count: 1,
            _id: 0,
          },
        },
        { $sort: { range: 1 } },
      ]);

      res.json({
        success: true,
        data: {
          processingMetrics: processingMetrics[0]?.data || [],
          accuracyStats,
        },
      });

    } catch (error: any) {
      console.error('Performance analytics error:', error);
      throw new CustomError('Failed to fetch performance metrics', 500);
    }
  })
);

// System-wide analytics (admin only - for demo purposes, available to all doctors)
router.get('/analytics/system',
  authenticate,
  authorize('doctor'),
  catchAsync(async (req: AuthRequest, res: any) => {
    try {
      const [
        totalUsers,
        totalConsultations,
        totalTranscripts,
        systemStats,
      ] = await Promise.all([
        User.countDocuments({ isActive: true }),
        MedicalNote.countDocuments(),
        Transcript.countDocuments(),
        MedicalNote.aggregate([
          {
            $group: {
              _id: null,
              avgConfidence: { $avg: '$processingMetrics.confidenceScore' },
              avgProcessingTime: { $avg: '$processingMetrics.nlpProcessingTime' },
            },
          },
        ]),
      ]);

      // Top diagnoses
      const topDiagnoses = await MedicalNote.aggregate([
        { $unwind: '$diagnoses' },
        { $group: { _id: '$diagnoses.description', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $project: { diagnosis: '$_id', count: 1, _id: 0 } },
      ]);

      // Monthly growth
      const monthlyGrowth = await MedicalNote.aggregate([
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            consultations: { $sum: 1 },
          },
        },
        {
          $project: {
            month: {
              $dateToString: {
                format: '%Y-%m',
                date: {
                  $dateFromParts: {
                    year: '$_id.year',
                    month: '$_id.month',
                  },
                },
              },
            },
            consultations: 1,
            _id: 0,
          },
        },
        { $sort: { month: 1 } },
        { $limit: 12 }, // Last 12 months
      ]);

      const systemMetrics = systemStats[0] || {};

      res.json({
        success: true,
        data: {
          overview: {
            totalUsers,
            totalConsultations,
            totalTranscripts,
            avgConfidence: systemMetrics.avgConfidence || 0,
            avgProcessingTime: Math.round((systemMetrics.avgProcessingTime || 0) / 1000),
          },
          topDiagnoses,
          monthlyGrowth,
        },
      });

    } catch (error: any) {
      console.error('System analytics error:', error);
      throw new CustomError('Failed to fetch system analytics', 500);
    }
  })
);

export default router;