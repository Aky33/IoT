import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';

import { validateBody } from '../../src/middleware/validateBody.js';
import { errorHandler } from '../../src/middleware/errorHandler.js';

const schema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    age: { type: 'number' },
  },
  required: ['name'],
  additionalProperties: false,
};

function createApp() {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => { req.id = 'test'; next(); });
  app.post('/test', validateBody(schema), (req, res) => res.json(req.body));
  app.use(errorHandler);
  return app;
}

describe('validateBody', () => {
  it('passes valid body', async () => {
    const res = await request(createApp()).post('/test').send({ name: 'Alice', age: 30 });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Alice');
  });

  it('rejects missing required field', async () => {
    const res = await request(createApp()).post('/test').send({ age: 30 });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('validationError');
  });

  it('rejects wrong type', async () => {
    const res = await request(createApp()).post('/test').send({ name: 123 });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('validationError');
  });

  it('rejects additional properties', async () => {
    const res = await request(createApp()).post('/test').send({ name: 'Alice', extra: true });
    expect(res.status).toBe(400);
  });

  it('passes when optional field missing', async () => {
    const res = await request(createApp()).post('/test').send({ name: 'Alice' });
    expect(res.status).toBe(200);
  });
});
