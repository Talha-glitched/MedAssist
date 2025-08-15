import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';

export interface AuthRequest extends Request {
  user?: IUser;
  userId?: string;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    console.log('=== AUTH MIDDLEWARE ===');
    console.log('Request URL:', req.url);
    console.log('Request method:', req.method);

    const authHeader = req.headers.authorization;
    console.log('Auth header present:', !!authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No valid auth header found');
      return res.status(401).json({
        success: false,
        message: 'Access token is required',
      });
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not configured');
    }

    const decoded = jwt.verify(token, jwtSecret) as { userId: string };
    console.log('Token decoded, userId:', decoded.userId);

    const user = await User.findById(decoded.userId).select('+password');
    console.log('User found:', !!user);
    console.log('User active:', user?.isActive);

    if (!user || !user.isActive) {
      console.log('User not found or inactive');
      return res.status(401).json({
        success: false,
        message: 'Invalid token or user not found',
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    req.user = user;
    req.userId = (user._id as any).toString();
    console.log('User authenticated, userId:', req.userId);
    console.log('User role:', req.user?.role);

    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
      });
    }

    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed',
    });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        requiredRoles: roles,
        userRole: req.user.role,
      });
    }

    next();
  };
};

export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      return next();
    }

    const decoded = jwt.verify(token, jwtSecret) as { userId: string };
    const user = await User.findById(decoded.userId);

    if (user && user.isActive) {
      req.user = user;
      req.userId = (user._id as any).toString();
    }

    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    next();
  }
};