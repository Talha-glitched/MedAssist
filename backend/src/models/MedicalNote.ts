import mongoose, { Document, Schema } from 'mongoose';

export interface IMedicalNote extends Document {
  transcriptId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  patientId?: mongoose.Types.ObjectId;
  patientName: string;
  dateOfService: Date;
  sessionId: string;

  // SOAP Note structure
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;

  // Additional medical information
  chiefComplaint?: string;
  historyOfPresentIllness?: string;
  reviewOfSystems?: string;
  pastMedicalHistory?: string;
  medications: string[];
  allergies: string[];
  socialHistory?: string;
  familyHistory?: string;

  // Physical examination
  vitalSigns?: {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    respiratoryRate?: number;
    oxygenSaturation?: number;
    weight?: number;
    height?: number;
    bmi?: number;
  };

  // Clinical data
  diagnoses: Array<{
    code: string;
    description: string;
    type: 'primary' | 'secondary';
  }>;

  procedures: Array<{
    code: string;
    description: string;
    date: Date;
  }>;

  // Treatment plan
  recommendations: string[];
  followUp: string;
  referrals: Array<{
    specialty: string;
    reason: string;
    urgency: 'routine' | 'urgent' | 'stat';
  }>;

  // Patient-friendly summary
  patientSummary: string;
  translations: Map<string, string>; // language code -> translated summary

  // Workflow and quality
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  rejectionReason?: string;
  editHistory: Array<{
    editedBy: mongoose.Types.ObjectId;
    editedAt: Date;
    changes: string;
    version: number;
  }>;

  // AI processing metadata
  processingMetrics: {
    nlpProcessingTime: number;
    confidenceScore: number;
    modelVersion: string;
    extractedEntities: Array<{
      entity: string;
      type: 'medication' | 'diagnosis' | 'symptom' | 'procedure';
      confidence: number;
    }>;
  };

  // Compliance and audit
  accessLog: Array<{
    userId: mongoose.Types.ObjectId;
    action: 'viewed' | 'edited' | 'approved' | 'rejected' | 'exported';
    timestamp: Date;
    ipAddress?: string;
  }>;

  isEncrypted: boolean;
  encryptionKeyId?: string;

  createdAt: Date;
  updatedAt: Date;
}

const MedicalNoteSchema: Schema = new Schema(
  {
    transcriptId: {
      type: Schema.Types.ObjectId,
      ref: 'Transcript',
      required: [true, 'Transcript ID is required'],
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
    patientName: {
      type: String,
      required: [true, 'Patient name is required'],
      trim: true,
    },
    dateOfService: {
      type: Date,
      required: [true, 'Date of service is required'],
      default: Date.now,
    },
    sessionId: {
      type: String,
      required: [true, 'Session ID is required'],
    },

    // SOAP sections
    subjective: {
      type: String,
      required: [true, 'Subjective section is required'],
    },
    objective: {
      type: String,
      required: [true, 'Objective section is required'],
    },
    assessment: {
      type: String,
      required: [true, 'Assessment section is required'],
    },
    plan: {
      type: String,
      required: [true, 'Plan section is required'],
    },

    // Additional sections
    chiefComplaint: String,
    historyOfPresentIllness: String,
    reviewOfSystems: String,
    pastMedicalHistory: String,
    medications: [String],
    allergies: [String],
    socialHistory: String,
    familyHistory: String,

    // Vital signs
    vitalSigns: {
      bloodPressure: String,
      heartRate: Number,
      temperature: Number,
      respiratoryRate: Number,
      oxygenSaturation: Number,
      weight: Number,
      height: Number,
      bmi: Number,
    },

    // Structured medical data
    diagnoses: [{
      code: {
        type: String,
        required: true,
      },
      description: {
        type: String,
        required: true,
      },
      type: {
        type: String,
        enum: ['primary', 'secondary'],
        default: 'primary',
      },
    }],

    procedures: [{
      code: String,
      description: String,
      date: {
        type: Date,
        default: Date.now,
      },
    }],

    // Treatment
    recommendations: [String],
    followUp: String,
    referrals: [{
      specialty: {
        type: String,
        required: true,
      },
      reason: String,
      urgency: {
        type: String,
        enum: ['routine', 'urgent', 'stat'],
        default: 'routine',
      },
    }],

    // Patient communication
    patientSummary: {
      type: String,
      required: [true, 'Patient summary is required'],
    },
    translations: {
      type: Map,
      of: String,
      default: new Map(),
    },

    // Workflow
    status: {
      type: String,
      enum: ['draft', 'pending', 'approved', 'rejected'],
      default: 'draft',
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: Date,
    rejectionReason: String,
    editHistory: [{
      editedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      editedAt: {
        type: Date,
        default: Date.now,
      },
      changes: String,
      version: {
        type: Number,
        required: true,
      },
    }],

    // AI metadata
    processingMetrics: {
      nlpProcessingTime: {
        type: Number,
        required: true,
      },
      confidenceScore: {
        type: Number,
        required: true,
        min: 0,
        max: 1,
      },
      modelVersion: {
        type: String,
        required: true,
        default: 'flan-t5-large',
      },
      extractedEntities: [{
        entity: {
          type: String,
          required: true,
        },
        type: {
          type: String,
          enum: ['medication', 'diagnosis', 'symptom', 'procedure'],
          required: true,
        },
        confidence: {
          type: Number,
          required: true,
          min: 0,
          max: 1,
        },
      }],
    },

    // Audit trail
    accessLog: [{
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      action: {
        type: String,
        enum: ['viewed', 'edited', 'approved', 'rejected', 'exported'],
        required: true,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
      ipAddress: String,
    }],

    // Encryption
    isEncrypted: {
      type: Boolean,
      default: false,
    },
    encryptionKeyId: String,
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
MedicalNoteSchema.index({ doctorId: 1, createdAt: -1 });
MedicalNoteSchema.index({ patientId: 1, dateOfService: -1 });
MedicalNoteSchema.index({ sessionId: 1 });
MedicalNoteSchema.index({ status: 1, createdAt: -1 });
MedicalNoteSchema.index({ 'diagnoses.code': 1 });
MedicalNoteSchema.index({ 'processingMetrics.confidenceScore': 1 });
MedicalNoteSchema.index({ dateOfService: -1 });

// Virtual for latest version
MedicalNoteSchema.virtual('currentVersion').get(function () {
  return (this.editHistory as any).length > 0 ? Math.max(...(this.editHistory as any).map((h: any) => h.version)) : 1;
});

// Method to add access log entry
MedicalNoteSchema.methods.logAccess = function (userId: mongoose.Types.ObjectId, action: string, ipAddress?: string) {
  this.accessLog.push({
    userId,
    action,
    timestamp: new Date(),
    ipAddress,
  });
};

// Method to add edit history
MedicalNoteSchema.methods.addEditHistory = function (editedBy: mongoose.Types.ObjectId, changes: string) {
  const newVersion = this.currentVersion + 1;
  this.editHistory.push({
    editedBy,
    editedAt: new Date(),
    changes,
    version: newVersion,
  });
};

export default mongoose.model<IMedicalNote>('MedicalNote', MedicalNoteSchema);