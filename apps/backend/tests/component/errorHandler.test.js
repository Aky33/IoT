import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';

import { errorHandler } from '../../src/middleware/errorHandler.js';
import { AppError, NotFoundError, ValidationError } from '../../src/errors/AppError.js';

function createTestApp(throwFn) {
  const app = express();
  app.use((req, _res, next) => {
    req.id = 'test-req-id';
    next();
  });
  app.get('/test', (_req, _res) => {
    throw throwFn();
  });
  app.use(errorHandler);
  return app;
}

describe('errorHandler middleware', () => {
  it('serializes AppError as JSON with correct status', async () => {
    const app = createTestApp(() => new AppError('testErr', 'Test error', { foo: 1 }, 418));
    const res = await request(app).get('/test');
    expect(res.status).toBe(418);
    expect(res.body.error.code).toBe('testErr');
    expect(res.body.error.message).toBe('Test error');
    expect(res.body.error.details.foo).toBe(1);
  });

  it('handles NotFoundError with 404', async () => {
    const app = createTestApp(() => new NotFoundError('User', '123'));
    const res = await request(app).get('/test');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('notFound');
  });

  it('handles ValidationError with 400', async () => {
    const app = createTestApp(() => new ValidationError({ field: 'email' }));
    const res = await request(app).get('/test');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('validationError');
  });

  it('handles Mongoose duplicate key (11000) as 409', async () => {
    const app = createTestApp(() => {
      const err = new Error('dup');
      err.code = 11000;
      err.keyPattern = { email: 1 };
      return err;
    });
    const res = await request(app).get('/test');
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('duplicateKey');
    expect(res.body.error.details.field).toBe('email');
  });

  it('returns 500 for unknown errors with requestId', async () => {
    const app = createTestApp(() => new Error('unexpected'));
    const res = await request(app).get('/test');
    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('internalError');
    expect(res.body.error.details.requestId).toBe('test-req-id');
  });
});
