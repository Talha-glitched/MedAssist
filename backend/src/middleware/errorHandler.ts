import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

export interface AppError extends Error {
  statusCode?: number;
  status?: string;
  isOperational?: boolean;
}

export class CustomError extends Error implements AppError {
  statusCode: number;
  status: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = statusCode >= 400 && statusCode < 500 ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

const handleCastErrorDB = (error: mongoose.Error.CastError): CustomError => {
  const message = `Invalid ${error.path}: ${error.value}`;
  return new CustomError(message, 400);
};

const handleDuplicateFieldsDB = (error: any): CustomError => {
  const field = Object.keys(error.keyValue)[0];
  const value = error.keyValue[field];
  const message = `Duplicate field value: ${field} = "${value}". Please use another value.`;
  return new CustomError(message, 400);
};

const handleValidationErrorDB = (error: mongoose.Error.ValidationError): CustomError => {
  const errors = Object.values(error.errors).map((err: any) => err.message);
  const message = `Invalid input data: ${errors.join('. ')}`;
  return new CustomError(message, 400);
};

const handleJWTError = (): CustomError => {
  return new CustomError('Invalid token. Please log in again.', 401);
};

const handleJWTExpiredError = (): CustomError => {
  return new CustomError('Your token has expired. Please log in again.', 401);
};

const sendErrorDev = (err: AppError, res: Response) => {
  res.status(err.statusCode || 500).json({
    success: false,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err: AppError, res: Response) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
    });
  } else {
    // Programming or other unknown error: don't leak error details
    console.error('ERROR:', err);

    res.status(500).json({
      success: false,
      message: 'Something went wrong!',
    });
  }
};

export const errorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  console.log('=== ERROR HANDLER TRIGGERED ===');
  console.log('Error name:', error.name);
  console.log('Error message:', error.message);
  console.log('Error stack:', error.stack);
  console.log('Request URL:', req.url);
  console.log('Request method:', req.method);

  let err = { ...error };
  err.message = error.message;
  err.statusCode = error.statusCode;

  // Log error
  console.error(`Error ${error.statusCode || 500}: ${error.message}`);

  // Mongoose bad ObjectId
  if (error.name === 'CastError') {
    err = handleCastErrorDB(err);
  }

  // Mongoose duplicate key
  if (error.code === 11000) {
    err = handleDuplicateFieldsDB(err);
  }

  // Mongoose validation error
  if (error.name === 'ValidationError') {
    err = handleValidationErrorDB(err);
  }

  // JWT invalid signature
  if (error.name === 'JsonWebTokenError') {
    err = handleJWTError();
  }

  // JWT expired
  if (error.name === 'TokenExpiredError') {
    err = handleJWTExpiredError();
  }

  // Send appropriate error response
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    sendErrorProd(err, res);
  }
};

// Async error handler wrapper
export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};