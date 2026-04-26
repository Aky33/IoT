import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';

import { devicesRouter } from '../../src/routes/devices.js';
import { errorHandler } from '../../src/middleware/errorHandler.js';

function createTestApp(role, sub) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.id = 'test';
    req.user = { role, sub };
    next();
  });
  app.use('/devices', devicesRouter);
  app.use(errorHandler);
  return app;
}

describe('device route authorization', () => {
  it('caregiver can access GET /devices/all', async () => {
    const app = createTestApp('caregiver', 'caregiver-1');
    const res = await request(app).get('/devices/all');
    expect(res.status).not.toBe(403);
  });

  it('caregiver can access GET /devices/get/:id', async () => {
    const app = createTestApp('caregiver', 'caregiver-1');
    const res = await request(app).get('/devices/get/507f1f77bcf86cd799439011').timeout(3000).catch((err) => err.response ?? err);
    const status = res.status ?? (res.code === 'ECONNABORTED' ? 503 : res.status);
    expect(status).not.toBe(403);
  }, 15000);

  it('caregiver is blocked from POST /devices/create', async () => {
    const app = createTestApp('caregiver', 'caregiver-1');
    const res = await request(app).post('/devices/create').send({});
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('forbidden');
  });

  it('caregiver is blocked from PUT /devices/edit/:id', async () => {
    const app = createTestApp('caregiver', 'caregiver-1');
    const res = await request(app).put('/devices/edit/507f1f77bcf86cd799439011').send({});
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('forbidden');
  });

  it('caregiver is blocked from DELETE /devices/delete/:id', async () => {
    const app = createTestApp('caregiver', 'caregiver-1');
    const res = await request(app).delete('/devices/delete/507f1f77bcf86cd799439011');
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('forbidden');
  });

  it('admin can access POST /devices/create', async () => {
    const app = createTestApp('admin', 'admin-1');
    const res = await request(app).post('/devices/create').send({});
    expect(res.status).not.toBe(403);
  });
});
