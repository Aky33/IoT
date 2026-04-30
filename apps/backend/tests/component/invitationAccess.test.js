import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';

import { invitationsRouter } from '../../src/routes/invitations.js';
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
  app.use('/invitations', authorize('admin'), invitationsRouter);
  app.use(errorHandler);
  return app;
}

describe('invitation route authorization', () => {
  it('admin can access POST /invitations/create', async () => {
    const app = createTestApp('admin', 'admin-1');
    const res = await request(app).post('/invitations/create').send({ ttlHours: 24 });
    expect(res.status).not.toBe(403);
  });

  it('caregiver is blocked from POST /invitations/create', async () => {
    const app = createTestApp('caregiver', 'caregiver-1');
    const res = await request(app).post('/invitations/create').send({ ttlHours: 24 });
    expect(res.status).toBe(403);
  });

  it('caregiver is blocked from GET /invitations/all', async () => {
    const app = createTestApp('caregiver', 'caregiver-1');
    const res = await request(app).get('/invitations/all');
    expect(res.status).toBe(403);
  });

  it('caregiver is blocked from DELETE /invitations/revoke/:id', async () => {
    const app = createTestApp('caregiver', 'caregiver-1');
    const res = await request(app).delete('/invitations/revoke/507f1f77bcf86cd799439011');
    expect(res.status).toBe(403);
  });
});
