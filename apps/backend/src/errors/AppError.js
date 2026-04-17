export class AppError extends Error {
  constructor(code, message, details = {}, status = 400) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
    this.status = status;
  }
}

export class ValidationError extends AppError {
  constructor(details) {
    super('validationError', 'Request body is invalid.', details, 400);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource, id) {
    super('notFound', `${resource} not found.`, { id }, 404);
    this.name = 'NotFoundError';
  }
}
