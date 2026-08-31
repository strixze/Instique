import logger from '../config/logger.js';
import ApiError from '../utils/ApiError.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logFilePath = path.join(__dirname, '../../errorlogs');

const logToFile = (err, req) => {
  try {
    const timestamp = new Date().toISOString();
    const method = req?.method || 'N/A';
    const url = req?.originalUrl || req?.url || 'N/A';
    const body = req?.body ? JSON.stringify(req.body) : '';
    const query = req?.query ? JSON.stringify(req.query) : '';
    const userId = req?.user?._id ? req.user._id.toString() : 'Unauthenticated';

    let errorDetails = '';
    if (err.errors) {
      errorDetails = `\nDetails: ${JSON.stringify(err.errors, null, 2)}`;
    }

    const logEntry = `
================================================================================
Timestamp: ${timestamp}
Method: ${method}
URL: ${url}
User ID: ${userId}
Query: ${query}
Body: ${body}
Error Name: ${err.name || 'Error'}
Error Message: ${err.message || 'No message'}
Stack Trace: ${err.stack || 'No stack trace'}${errorDetails}
================================================================================
\n`;

    fs.appendFileSync(logFilePath, logEntry, 'utf8');
  } catch (logErr) {
    console.error('Failed to write to errorlogs:', logErr);
  }
};

const errorMiddleware = (err, req, res, next) => {
  logToFile(err, req);

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors || [],
    });
  }

  logger.error('Unhandled error:', err);

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors,
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      success: false,
      message: `${field} already exists`,
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format',
    });
  }

  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
  });
};

export default errorMiddleware;
