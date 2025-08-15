import mongoose, { Document, Schema } from 'mongoose';

export interface ITranscript extends Document {
  audioFileId: string;
  text: string;
  confidence: number;
  duration: number;
  language: string;
  speakerLabels: Array<{
    speaker: string;
    text: string;
    startTime: number;
    endTime: number;
    confidence: number;
  }>;
  processingMetrics: {
    processingTime: number;
    modelVersion: string;
    audioQuality: 'excellent' | 'good' | 'fair' | 'poor';
  };
  doctorId: mongoose.Types.ObjectId;
  patientId?: mongoose.Types.ObjectId;
  sessionId: string;
  status: 'processing' | 'completed' | 'failed';
  errorDetails?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TranscriptSchema: Schema = new Schema(
  {
    audioFileId: {
      type: String,
      required: [true, 'Audio file ID is required'],
    },
    text: {
      type: String,
      required: [true, 'Transcript text is required'],
    },
    confidence: {
      type: Number,
      required: [true, 'Confidence score is required'],
      min: [0, 'Confidence must be between 0 and 1'],
      max: [1, 'Confidence must be between 0 and 1'],
    },
    duration: {
      type: Number,
      required: [true, 'Audio duration is required'],
      min: [0, 'Duration must be positive'],
    },
    language: {
      type: String,
      default: 'en',
      enum: ['en', 'es', 'ur', 'fr', 'de'],
    },
    speakerLabels: [{
      speaker: {
        type: String,
        required: true,
      },
      text: {
        type: String,
        required: true,
      },
      startTime: {
        type: Number,
        required: true,
      },
      endTime: {
        type: Number,
        required: true,
      },
      confidence: {
        type: Number,
        required: true,
        min: 0,
        max: 1,
      },
    }],
    processingMetrics: {
      processingTime: {
        type: Number,
        required: true,
      },
      modelVersion: {
        type: String,
        required: true,
        default: 'whisper-large-v3',
      },
      audioQuality: {
        type: String,
        enum: ['excellent', 'good', 'fair', 'poor'],
        default: 'good',
      },
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Doctor ID is required'],
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    sessionId: {
      type: String,
      required: [true, 'Session ID is required'],
    },
    status: {
      type: String,
      enum: ['processing', 'completed', 'failed'],
      default: 'processing',
    },
    errorDetails: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
TranscriptSchema.index({ doctorId: 1, createdAt: -1 });
TranscriptSchema.index({ sessionId: 1 });
TranscriptSchema.index({ status: 1, createdAt: -1 });
TranscriptSchema.index({ audioFileId: 1 });

// Virtual for processing time in seconds
TranscriptSchema.virtual('processingTimeSeconds').get(function () {
  return (this.processingMetrics as any).processingTime / 1000;
});

export default mongoose.model<ITranscript>('Transcript', TranscriptSchema);