import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';

import { notificationListRouter } from '../../src/routes/notifications.js';
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
  app.use('/notifications', authorize('caregiver', 'admin'), notificationListRouter);
  app.use(errorHandler);
  return app;
}

describe('notification list route authorization', () => {
  it('caregiver can access GET /notifications/all', async () => {
    const app = createTestApp('caregiver', 'caregiver-1');
    const res = await request(app).get('/notifications/all');
    expect(res.status).not.toBe(403);
  });

  it('admin can access GET /notifications/all', async () => {
    const app = createTestApp('admin', 'admin-1');
    const res = await request(app).get('/notifications/all');
    expect(res.status).not.toBe(403);
  });

  it('unknown role is blocked from GET /notifications/all', async () => {
    const app = createTestApp('unknown', 'x');
    const res = await request(app).get('/notifications/all');
    expect(res.status).toBe(403);
  });
});
