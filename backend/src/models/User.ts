import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'doctor' | 'patient';
  isActive: boolean;
  lastLogin?: Date;
  profile: {
    specialization?: string;
    licenseNumber?: string;
    phone?: string;
    address?: string;
  };
  preferences: {
    language: string;
    notifications: {
      email: boolean;
      sms: boolean;
    };
  };
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxLength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minLength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['doctor', 'patient'],
      required: [true, 'Role is required'],
      default: 'patient',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    profile: {
      specialization: {
        type: String,
        trim: true,
      },
      licenseNumber: {
        type: String,
        trim: true,
      },
      phone: {
        type: String,
        trim: true,
      },
      address: {
        type: String,
        trim: true,
      },
    },
    preferences: {
      language: {
        type: String,
        default: 'en',
        enum: ['en', 'es', 'ur', 'fr', 'de'],
      },
      notifications: {
        email: {
          type: Boolean,
          default: true,
        },
        sms: {
          type: Boolean,
          default: false,
        },
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret: any) {
        if (ret.password) {
          delete ret.password;
        }
        return ret;
      },
    },
  }
);

// Indexes for better query performance
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1, isActive: 1 });
UserSchema.index({ createdAt: -1 });

// Hash password before saving
UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const saltRounds = 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

export default mongoose.model<IUser>('User', UserSchema);