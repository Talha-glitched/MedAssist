import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { authenticate, AuthRequest } from '../middleware/auth';
import { authRateLimit } from '../middleware/rateLimiter';
import { catchAsync, CustomError } from '../middleware/errorHandler';

const router = express.Router();

// Generate JWT token
const generateToken = (userId: string): string => {
  const jwtSecret = process.env.JWT_SECRET;
  const jwtExpire = process.env.JWT_EXPIRE || '7d';

  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not configured');
  }

  return jwt.sign({ userId }, jwtSecret as any, {
    expiresIn: jwtExpire as any,
  });
};

// Register
router.post('/register', authRateLimit, catchAsync(async (req: AuthRequest, res: any) => {
  const { name, email, password, role } = req.body;

  // Validation
  if (!name || !email || !password || !role) {
    throw new CustomError('Please provide name, email, password, and role', 400);
  }

  if (!['doctor', 'patient'].includes(role)) {
    throw new CustomError('Role must be either doctor or patient', 400);
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new CustomError('User already exists with this email', 400);
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role,
  });

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    },
  });
}));

// Login
router.post('/login', authRateLimit, catchAsync(async (req: AuthRequest, res: any) => {
  const { email, password } = req.body;

  // Validation
  if (!email || !password) {
    throw new CustomError('Please provide email and password', 400);
  }

  // Find user and include password
  const user = await User.findOne({ email }).select('+password');

  if (!user || !user.isActive) {
    throw new CustomError('Invalid email or password', 401);
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new CustomError('Invalid email or password', 401);
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Generate token
  const token = generateToken((user._id as any).toString());

  res.json({
    success: true,
    message: 'Login successful',
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
}));

// Get current user profile
router.get('/profile', authenticate, catchAsync(async (req: AuthRequest, res: any) => {
  const user = await User.findById(req.userId).populate('profile');

  if (!user) {
    throw new CustomError('User not found', 404);
  }

  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile: user.profile,
        preferences: user.preferences,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      },
    },
  });
}));

// Update profile
router.put('/profile', authenticate, catchAsync(async (req: AuthRequest, res: any) => {
  const allowedFields = [
    'name',
    'profile.specialization',
    'profile.licenseNumber',
    'profile.phone',
    'profile.address',
    'preferences.language',
    'preferences.notifications.email',
    'preferences.notifications.sms',
  ];

  const updateData: any = {};

  // Build update object with only allowed fields
  Object.keys(req.body).forEach(key => {
    if (allowedFields.includes(key)) {
      if (key.includes('.')) {
        // Handle nested fields
        const [parent, child] = key.split('.');
        if (!updateData[parent]) updateData[parent] = {};
        updateData[parent][child] = req.body[key];
      } else {
        updateData[key] = req.body[key];
      }
    }
  });

  const user = await User.findByIdAndUpdate(
    req.userId,
    updateData,
    { new: true, runValidators: true }
  );

  if (!user) {
    throw new CustomError('User not found', 404);
  }

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: { user },
  });
}));

// Change password
router.put('/change-password', authenticate, catchAsync(async (req: AuthRequest, res: any) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new CustomError('Please provide current password and new password', 400);
  }

  if (newPassword.length < 6) {
    throw new CustomError('New password must be at least 6 characters long', 400);
  }

  const user = await User.findById(req.userId).select('+password');

  if (!user) {
    throw new CustomError('User not found', 404);
  }

  // Verify current password
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    throw new CustomError('Current password is incorrect', 400);
  }

  // Update password
  user.password = newPassword;
  await user.save();

  res.json({
    success: true,
    message: 'Password changed successfully',
  });
}));

// Demo data initialization
router.post('/init-demo', catchAsync(async (req: AuthRequest, res: any) => {
  if (process.env.NODE_ENV === 'production') {
    throw new CustomError('Demo initialization not available in production', 403);
  }

  // Check if demo users already exist
  const existingDoctor = await User.findOne({ email: 'doctor@demo.com' });
  const existingPatient = await User.findOne({ email: 'patient@demo.com' });

  if (existingDoctor && existingPatient) {
    return res.json({
      success: true,
      message: 'Demo users already exist',
    });
  }

  // Create demo doctor
  if (!existingDoctor) {
    await User.create({
      name: 'Dr. John Smith',
      email: 'doctor@demo.com',
      password: 'password123',
      role: 'doctor',
      profile: {
        specialization: 'Internal Medicine',
        licenseNumber: 'MD123456',
        phone: '+1-555-0123',
      },
    });
  }

  // Create demo patient
  if (!existingPatient) {
    await User.create({
      name: 'Jane Doe',
      email: 'patient@demo.com',
      password: 'password123',
      role: 'patient',
      profile: {
        phone: '+1-555-0456',
      },
    });
  }

  res.json({
    success: true,
    message: 'Demo users created successfully',
    credentials: {
      doctor: { email: 'doctor@demo.com', password: 'password123' },
      patient: { email: 'patient@demo.com', password: 'password123' },
    },
  });
}));

export default router;