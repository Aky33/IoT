import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';

import { usersRouter } from '../../src/routes/users.js';
import { errorHandler } from '../../src/middleware/errorHandler.js';

function createTestApp(role, sub) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.id = 'test';
    req.user = { role, sub };
    next();
  });
  app.use('/users', usersRouter);
  app.use(errorHandler);
  return app;
}

describe('user route authorization', () => {
  it('caregiver can access GET /users/get/:id', async () => {
    const app = createTestApp('caregiver', 'caregiver-1');
    const res = await request(app).get('/users/get/invalid-id');
    expect(res.status).not.toBe(403);
  });

  it('caregiver is blocked from GET /users/all', async () => {
    const app = createTestApp('caregiver', 'caregiver-1');
    const res = await request(app).get('/users/all');
    expect(res.status).toBe(403);
  });

  it('caregiver is blocked from POST /users/create', async () => {
    const app = createTestApp('caregiver', 'caregiver-1');
    const res = await request(app).post('/users/create').send({});
    expect(res.status).toBe(403);
  });

  it('caregiver is blocked from PUT /users/edit/:id', async () => {
    const app = createTestApp('caregiver', 'caregiver-1');
    const res = await request(app).put('/users/edit/507f1f77bcf86cd799439011').send({});
    expect(res.status).toBe(403);
  });

  it('caregiver is blocked from DELETE /users/delete/:id', async () => {
    const app = createTestApp('caregiver', 'caregiver-1');
    const res = await request(app).delete('/users/delete/507f1f77bcf86cd799439011');
    expect(res.status).toBe(403);
  });

  it('admin is not blocked by authorize on POST /users/create', async () => {
    const app = createTestApp('admin', 'admin-1');
    const res = await request(app).post('/users/create').send({});
    expect(res.status).not.toBe(403);
  });
});
