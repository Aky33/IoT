import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

import { authenticate } from '../../src/middleware/authenticate.js';
import { errorHandler } from '../../src/middleware/errorHandler.js';

const SECRET = process.env.JWT_ACCESS_SECRET || 'test-secret';

function createTestApp() {
  const app = express();
  app.use((req, _res, next) => {
    req.id = 'test';
    next();
  });
  app.get('/protected', authenticate, (req, res) => {
    res.json({ user: req.user });
  });
  app.use(errorHandler);
  return app;
}

describe('authenticate middleware', () => {
  it('passes with valid Bearer token', async () => {
    const token = jwt.sign({ sub: 'user1', role: 'admin' }, SECRET, { algorithm: 'HS256' });
    const app = createTestApp();
    const res = await request(app).get('/protected').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.sub).toBe('user1');
    expect(res.body.user.role).toBe('admin');
  });

  it('rejects missing Authorization header with 401', async () => {
    const app = createTestApp();
    const res = await request(app).get('/protected');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('unauthorized');
  });

  it('rejects malformed header (no Bearer prefix) with 401', async () => {
    const app = createTestApp();
    const res = await request(app).get('/protected').set('Authorization', 'Token abc123');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('unauthorized');
  });

  it('rejects expired token with tokenExpired code', async () => {
    const token = jwt.sign({ sub: 'x' }, SECRET, { algorithm: 'HS256', expiresIn: '0s' });
    const app = createTestApp();

    // Small delay to ensure expiry
    await new Promise((r) => setTimeout(r, 50));

    const res = await request(app).get('/protected').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('tokenExpired');
  });

  it('rejects token signed with wrong secret', async () => {
    const token = jwt.sign({ sub: 'x' }, 'wrong-secret', { algorithm: 'HS256' });
    const app = createTestApp();
    const res = await request(app).get('/protected').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('tokenInvalid');
  });
});
