import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';

import { sseHandler } from '../../src/middleware/sseHandler.js';
import { authorize } from '../../src/middleware/authorize.js';
import { errorHandler } from '../../src/middleware/errorHandler.js';

function createTestApp(role, sub) {
  const app = express();
  app.use((req, _res, next) => {
    req.id = 'test';
    req.user = { role, sub };
    next();
  });
  app.get('/notifications/stream', authorize('caregiver'), sseHandler);
  app.use(errorHandler);
  return app;
}

describe('SSE handler', () => {
  it('caregiver receives SSE headers', async () => {
    const app = createTestApp('caregiver', 'caregiver-1');
    const res = await request(app)
      .get('/notifications/stream')
      .buffer(false)
      .parse((res, cb) => {
        res.on('data', () => {});
        setTimeout(() => {
          res.destroy();
          cb(null, {});
        }, 100);
      });
    expect(res.headers['content-type']).toBe('text/event-stream');
    expect(res.headers['cache-control']).toBe('no-cache');
  });

  it('admin is blocked from SSE stream', async () => {
    const app = createTestApp('admin', 'admin-1');
    const res = await request(app).get('/notifications/stream');
    expect(res.status).toBe(403);
  });
});
