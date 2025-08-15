import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';

// Create different rate limiters for different endpoints
const authLimiter = new RateLimiterMemory({
  points: 5, // Number of attempts
  duration: 900, // Per 15 minutes
  blockDuration: 900, // Block for 15 minutes
});

const apiLimiter = new RateLimiterMemory({
  points: 100, // Number of requests
  duration: 60, // Per minute
  blockDuration: 60, // Block for 1 minute
});

const uploadLimiter = new RateLimiterMemory({
  points: 10, // Number of uploads
  duration: 600, // Per 10 minutes
  blockDuration: 300, // Block for 5 minutes
});

export const rateLimiter = async (req: Request, res: Response, next: NextFunction) => {
  // Skip rate limiting in development
  if (process.env.NODE_ENV === 'development') {
    return next();
  }

  try {
    const key = req.ip || req.connection.remoteAddress || 'unknown';
    let limiter = apiLimiter;

    // Choose appropriate limiter based on endpoint
    if (req.path.includes('/auth/login') || req.path.includes('/auth/register')) {
      limiter = authLimiter;
    } else if (req.path.includes('/upload-audio')) {
      limiter = uploadLimiter;
    }

    await limiter.consume(key);
    next();
  } catch (rateLimiterRes: any) {
    const secs = Math.round(rateLimiterRes.msBeforeNext / 1000) || 1;

    res.set('Retry-After', String(secs));
    res.status(429).json({
      success: false,
      message: 'Too many requests',
      retryAfter: secs,
      limit: rateLimiterRes.limit,
      remaining: rateLimiterRes.remainingPoints,
    });
  }
};

// Specific rate limiter middleware
export const authRateLimit = async (req: Request, res: Response, next: NextFunction) => {
  // Skip rate limiting in development
  if (process.env.NODE_ENV === 'development') {
    return next();
  }

  try {
    const key = req.ip || req.connection.remoteAddress || 'unknown';
    await authLimiter.consume(key);
    next();
  } catch (rateLimiterRes: any) {
    const secs = Math.round(rateLimiterRes.msBeforeNext / 1000) || 1;

    res.set('Retry-After', String(secs));
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts. Please try again later.',
      retryAfter: secs,
    });
  }
};

export const uploadRateLimit = async (req: Request, res: Response, next: NextFunction) => {
  // Skip rate limiting in development
  if (process.env.NODE_ENV === 'development') {
    return next();
  }

  try {
    const key = req.ip || req.connection.remoteAddress || 'unknown';
    await uploadLimiter.consume(key);
    next();
  } catch (rateLimiterRes: any) {
    const secs = Math.round(rateLimiterRes.msBeforeNext / 1000) || 1;

    res.set('Retry-After', String(secs));
    res.status(429).json({
      success: false,
      message: 'Upload limit exceeded. Please wait before uploading again.',
      retryAfter: secs,
    });
  }
};