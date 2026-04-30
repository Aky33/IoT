import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';

import { pushRouter } from '../../src/routes/push.js';
import { authorize } from '../../src/middleware/authorize.js';
import { errorHandler } from '../../src/middleware/errorHandler.js';

function createTestApp(role, sub) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.id = 'test';
    req.user = { role, sub };
    next();
  });
  app.use('/push', authorize('caregiver', 'admin'), pushRouter);
  app.use(errorHandler);
  return app;
}

describe('push route authorization', () => {
  it('caregiver can access GET /push/vapid-public-key', async () => {
    const app = createTestApp('caregiver', 'caregiver-1');
    const res = await request(app).get('/push/vapid-public-key');
    expect(res.status).toBe(200);
    expect(res.body.vapidPublicKey).toBeDefined();
  });

  it('admin can access GET /push/vapid-public-key', async () => {
    const app = createTestApp('admin', 'admin-1');
    const res = await request(app).get('/push/vapid-public-key');
    expect(res.status).toBe(200);
  });

  it('unknown role is blocked', async () => {
    const app = createTestApp('unknown', 'x');
    const res = await request(app).get('/push/vapid-public-key');
    expect(res.status).toBe(403);
  });

  it('caregiver can POST /push/subscribe', async () => {
    const app = createTestApp('caregiver', 'caregiver-1');
    const res = await request(app).post('/push/subscribe').send({
      endpoint: 'https://example.com/push',
      keys: { p256dh: 'test-key', auth: 'test-auth' },
    });
    expect(res.status).not.toBe(403);
  });

  it('caregiver can DELETE /push/unsubscribe', async () => {
    const app = createTestApp('caregiver', 'caregiver-1');
    const res = await request(app).delete('/push/unsubscribe');
    expect(res.status).not.toBe(403);
  });
});
