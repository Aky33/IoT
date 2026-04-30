import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';

import { authenticateDevice } from '../../src/middleware/authenticateDevice.js';
import { errorHandler } from '../../src/middleware/errorHandler.js';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => { req.id = 'test'; next(); });
  app.post('/test', authenticateDevice, (_req, res) => res.json({ ok: true }));
  app.use(errorHandler);
  return app;
}

describe('authenticateDevice middleware', () => {
  it('rejects request with no headers', async () => {
    const res = await request(createApp()).post('/test').send({ type: 'standard' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('deviceAuthMissing');
  });

  it('rejects request with missing X-Device-Id', async () => {
    const res = await request(createApp())
      .post('/test')
      .set('X-Timestamp', '1234567890')
      .set('X-Signature', 'abc')
      .send({ type: 'standard' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('deviceAuthMissing');
  });

  it('rejects request with missing X-Timestamp', async () => {
    const res = await request(createApp())
      .post('/test')
      .set('X-Device-Id', '507f1f77bcf86cd799439011')
      .set('X-Signature', 'abc')
      .send({ type: 'standard' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('deviceAuthMissing');
  });

  it('rejects request with missing X-Signature', async () => {
    const res = await request(createApp())
      .post('/test')
      .set('X-Device-Id', '507f1f77bcf86cd799439011')
      .set('X-Timestamp', '1234567890')
      .send({ type: 'standard' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('deviceAuthMissing');
  });

  it('rejects expired timestamp', async () => {
    const expiredTs = (Math.floor(Date.now() / 1000) - 600).toString();
    const res = await request(createApp())
      .post('/test')
      .set('X-Device-Id', '507f1f77bcf86cd799439011')
      .set('X-Timestamp', expiredTs)
      .set('X-Signature', 'abc')
      .send({ type: 'standard' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('timestampExpired');
  });

  it('rejects future timestamp beyond tolerance', async () => {
    const futureTs = (Math.floor(Date.now() / 1000) + 600).toString();
    const res = await request(createApp())
      .post('/test')
      .set('X-Device-Id', '507f1f77bcf86cd799439011')
      .set('X-Timestamp', futureTs)
      .set('X-Signature', 'abc')
      .send({ type: 'standard' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('timestampExpired');
  });
});
