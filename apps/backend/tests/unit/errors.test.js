import { describe, it, expect } from 'vitest';

import { AppError, ValidationError, NotFoundError, ForbiddenError } from '../../src/errors/AppError.js';

describe('AppError', () => {
  it('has correct properties', () => {
    const err = new AppError('testCode', 'test message', { key: 'val' }, 422);
    expect(err).toBeInstanceOf(Error);
    expect(err.code).toBe('testCode');
    expect(err.message).toBe('test message');
    expect(err.details).toEqual({ key: 'val' });
    expect(err.status).toBe(422);
    expect(err.name).toBe('AppError');
  });

  it('defaults to 400 status', () => {
    const err = new AppError('x', 'x');
    expect(err.status).toBe(400);
    expect(err.details).toEqual({});
  });
});

describe('ValidationError', () => {
  it('is an AppError with code validationError and 400', () => {
    const err = new ValidationError({ field: 'email' });
    expect(err).toBeInstanceOf(AppError);
    expect(err.code).toBe('validationError');
    expect(err.status).toBe(400);
    expect(err.details).toEqual({ field: 'email' });
    expect(err.name).toBe('ValidationError');
  });
});

describe('NotFoundError', () => {
  it('formats message with resource name and id', () => {
    const err = new NotFoundError('User', '123abc');
    expect(err).toBeInstanceOf(AppError);
    expect(err.code).toBe('notFound');
    expect(err.message).toBe('User not found.');
    expect(err.status).toBe(404);
    expect(err.details).toEqual({ id: '123abc' });
  });
});

describe('ForbiddenError', () => {
  it('sets correct defaults', () => {
    const err = new ForbiddenError();
    expect(err).toBeInstanceOf(AppError);
    expect(err.code).toBe('forbidden');
    expect(err.status).toBe(403);
    expect(err.message).toBe('You do not have permission to access this resource.');
    expect(err.details).toEqual({});
  });
});
