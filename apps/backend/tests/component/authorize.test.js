import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';

import { authorize } from '../../src/middleware/authorize.js';
import { errorHandler } from '../../src/middleware/errorHandler.js';

function createTestApp(...roles) {
  const app = express();
  app.use((req, _res, next) => {
    req.id = 'test';
    next();
  });
  app.get(
    '/admin',
    (req, _res, next) => {
      req.user = { role: 'admin' };
      next();
    },
    authorize(...roles),
    (_req, res) => res.json({ ok: true }),
  );
  app.get(
    '/caregiver',
    (req, _res, next) => {
      req.user = { role: 'caregiver' };
      next();
    },
    authorize(...roles),
    (_req, res) => res.json({ ok: true }),
  );
  app.get(
    '/no-role',
    (req, _res, next) => {
      req.user = {};
      next();
    },
    authorize(...roles),
    (_req, res) => res.json({ ok: true }),
  );
  app.use(errorHandler);
  return app;
}

describe('authorize middleware', () => {
  it('allows matching role', async () => {
    const app = createTestApp('admin');
    const res = await request(app).get('/admin');
    expect(res.status).toBe(200);
  });

  it('rejects non-matching role with 403', async () => {
    const app = createTestApp('admin');
    const res = await request(app).get('/caregiver');
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('forbidden');
  });

  it('allows if multiple roles specified and user matches one', async () => {
    const app = createTestApp('admin', 'caregiver');
    const res = await request(app).get('/caregiver');
    expect(res.status).toBe(200);
  });

  it('rejects when user has no role', async () => {
    const app = createTestApp('admin');
    const res = await request(app).get('/no-role');
    expect(res.status).toBe(403);
  });
});
