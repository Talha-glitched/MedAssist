import mongoose, { Document, Schema } from 'mongoose';

export interface IPatient extends Document {
    userId: mongoose.Types.ObjectId;
    doctorId: mongoose.Types.ObjectId;
    patientId: string; // Unique patient identifier
    demographics: {
        dateOfBirth: Date;
        gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
        phone: string;
        address: string;
        emergencyContact: {
            name: string;
            relationship: string;
            phone: string;
        };
    };
    medicalHistory: {
        allergies: string[];
        currentMedications: string[];
        pastSurgeries: Array<{
            procedure: string;
            date: Date;
            hospital: string;
        }>;
        chronicConditions: string[];
        familyHistory: string[];
    };
    insurance: {
        provider: string;
        policyNumber: string;
        groupNumber?: string;
        expiryDate?: Date;
    };
    preferences: {
        preferredLanguage: string;
        communicationMethod: 'email' | 'sms' | 'phone';
        appointmentReminders: boolean;
    };
    status: 'active' | 'inactive' | 'archived';
    notes: string; // General notes about the patient
    createdAt: Date;
    updatedAt: Date;
    age?: number | null; // Virtual property for age calculation
}

// Add static methods interface
export interface IPatientModel extends mongoose.Model<IPatient> {
    generatePatientId(doctorId: string): string;
}

const PatientSchema: Schema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
        },
        doctorId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Doctor ID is required'],
        },
        patientId: {
            type: String,
            required: [true, 'Patient ID is required'],
            unique: true,
        },
        demographics: {
            dateOfBirth: {
                type: Date,
                required: [true, 'Date of birth is required'],
            },
            gender: {
                type: String,
                enum: ['male', 'female', 'other', 'prefer_not_to_say'],
                required: [true, 'Gender is required'],
            },
            phone: {
                type: String,
                required: [true, 'Phone number is required'],
                trim: true,
            },
            address: {
                type: String,
                required: [true, 'Address is required'],
                trim: true,
            },
            emergencyContact: {
                name: {
                    type: String,
                    required: [true, 'Emergency contact name is required'],
                    trim: true,
                },
                relationship: {
                    type: String,
                    required: [true, 'Emergency contact relationship is required'],
                    trim: true,
                },
                phone: {
                    type: String,
                    required: [true, 'Emergency contact phone is required'],
                    trim: true,
                },
            },
        },
        medicalHistory: {
            allergies: [{
                type: String,
                trim: true,
            }],
            currentMedications: [{
                type: String,
                trim: true,
            }],
            pastSurgeries: [{
                procedure: {
                    type: String,
                    required: true,
                    trim: true,
                },
                date: {
                    type: Date,
                    required: true,
                },
                hospital: {
                    type: String,
                    required: true,
                    trim: true,
                },
            }],
            chronicConditions: [{
                type: String,
                trim: true,
            }],
            familyHistory: [{
                type: String,
                trim: true,
            }],
        },
        insurance: {
            provider: {
                type: String,
                trim: true,
            },
            policyNumber: {
                type: String,
                trim: true,
            },
            groupNumber: {
                type: String,
                trim: true,
            },
            expiryDate: {
                type: Date,
            },
        },
        preferences: {
            preferredLanguage: {
                type: String,
                default: 'en',
                enum: ['en', 'es', 'ur', 'fr', 'de'],
            },
            communicationMethod: {
                type: String,
                enum: ['email', 'sms', 'phone'],
                default: 'email',
            },
            appointmentReminders: {
                type: Boolean,
                default: true,
            },
        },
        status: {
            type: String,
            enum: ['active', 'inactive', 'archived'],
            default: 'active',
        },
        notes: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for better query performance
PatientSchema.index({ doctorId: 1, status: 1 });
PatientSchema.index({ patientId: 1 });
PatientSchema.index({ userId: 1 });
PatientSchema.index({ 'demographics.dateOfBirth': 1 });
PatientSchema.index({ createdAt: -1 });

// Virtual for age calculation
PatientSchema.virtual('age').get(function (this: IPatient) {
    if (!this.demographics?.dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(this.demographics.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    return age;
});

// Method to generate patient ID
PatientSchema.statics.generatePatientId = function (doctorId: string) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `P${doctorId.slice(-4)}${timestamp}${random}`;
};

// Method to get patient summary
PatientSchema.methods.getSummary = function () {
    return {
        patientId: this.patientId,
        name: this.userId, // Will be populated when referenced
        age: this.age,
        gender: this.demographics.gender,
        phone: this.demographics.phone,
        status: this.status,
        lastConsultation: null, // Will be populated from MedicalNote
        totalConsultations: 0, // Will be calculated from MedicalNote
    };
};

export default mongoose.model<IPatient, IPatientModel>('Patient', PatientSchema);
