import mongoose from 'mongoose';

import { AppError } from '../errors/AppError.js';

export function errorHandler(err, req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
  }

  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({
      error: {
        code: 'invalidId',
        message: `Invalid ${err.path}: "${err.value}".`,
        details: { path: err.path, value: err.value },
      },
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({
      error: {
        code: 'duplicateKey',
        message: `Duplicate value for "${field}".`,
        details: { field },
      },
    });
  }

  console.error(`[error] req=${req.id}`, err);
  return res.status(500).json({
    error: {
      code: 'internalError',
      message: 'Internal server error.',
      details: { requestId: req.id },
    },
  });
}
