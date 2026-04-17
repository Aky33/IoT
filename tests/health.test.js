// TEMPLATE — API test pattern using supertest.
//
// This test does NOT connect to MongoDB. It imports createApp() directly and
// hits routes in-process. For endpoints that touch DB (everything except
// /health when Mongo is down), either:
//   (a) start a real Mongo via docker-compose (`npm run db:up`) before tests
//   (b) use mongodb-memory-server for fully in-memory DB per test
//
// Colleagues: replicate this structure for each resource under tests/.
// Naming convention: tests/<resource>.test.js

import { describe, it, expect } from 'vitest';
import request from 'supertest';

import { createApp } from '../src/app.js';

describe('GET /health', () => {
  it('responds with status and db fields (503 when DB not connected)', async () => {
    const app = createApp();
    const res = await request(app).get('/health');

    // DB is not connected in this test (no mongoose.connect called) → 503.
    expect(res.status).toBe(503);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('db');
    expect(res.body).toHaveProperty('timestamp');
  });
});

describe('404 handler', () => {
  it('returns structured error for unknown routes', async () => {
    const app = createApp();
    const res = await request(app).get('/nope/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('notFound');
    expect(res.body.error.message).toMatch(/nope/);
  });
});
