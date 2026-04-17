import { AppError } from '../errors/AppError.js';

export function errorHandler(err, req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
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
