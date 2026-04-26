// Integration test — requires running MongoDB (npm run db:up).
// Run: npm run test:integration

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

import { createApp } from '../../src/app.js';
import { config } from '../../src/config/index.js';
import { Caregiver } from '../../src/models/Caregiver.js';
import { Invitation } from '../../src/models/Invitation.js';

const app = createApp();

describe('Auth flow (integration)', () => {
  let adminToken;
  let invitationCode;

  beforeAll(async () => {
    await mongoose.connect(config.mongoUri);
    await Caregiver.deleteMany({});
    await Invitation.deleteMany({});

    // Seed an admin directly (like seed-admin.js does).
    const passwordHash = await bcrypt.hash('adminPass123', 10);
    await Caregiver.create({
      firstName: 'Admin',
      lastName: 'Test',
      email: 'admin@test.com',
      passwordHash,
      role: 'admin',
    });
  });

  afterAll(async () => {
    await Caregiver.deleteMany({});
    await Invitation.deleteMany({});
    await mongoose.disconnect();
  });

  it('POST /auth/login — admin logs in', async () => {
    const res = await request(app).post('/auth/login').send({
      email: 'admin@test.com',
      password: 'adminPass123',
    });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    adminToken = res.body.accessToken;
  });

  it('POST /invitations/create — admin creates invitation', async () => {
    const res = await request(app)
      .post('/invitations/create')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ttlHours: 1 });

    expect(res.status).toBe(201);
    expect(res.body.code).toBeDefined();
    expect(res.body.code).toHaveLength(8);
    invitationCode = res.body.code;
  });

  it('POST /auth/register — rejects without invitation code', async () => {
    const res = await request(app).post('/auth/register').send({
      firstName: 'Marie',
      lastName: 'Nováková',
      email: 'marie@test.com',
      password: 'securePass123',
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('invitationRequired');
  });

  it('POST /auth/register — rejects invalid invitation code', async () => {
    const res = await request(app).post('/auth/register').send({
      firstName: 'Marie',
      lastName: 'Nováková',
      email: 'marie@test.com',
      password: 'securePass123',
      invitationCode: 'BADCODE1',
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('invitationInvalid');
  });

  it('POST /auth/register — creates caregiver with valid invitation', async () => {
    const res = await request(app).post('/auth/register').send({
      firstName: 'Marie',
      lastName: 'Nováková',
      email: 'marie@test.com',
      password: 'securePass123',
      phone: '+420123456789',
      invitationCode,
    });

    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.caregiver.email).toBe('marie@test.com');
    expect(res.body.caregiver.role).toBe('caregiver');
    expect(res.body.caregiver.passwordHash).toBeUndefined();
    expect(res.body.caregiver.refreshTokens).toBeUndefined();

    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies.some((c) => c.startsWith('refreshToken='))).toBe(true);
  });

  it('POST /auth/register — rejects already-used invitation code', async () => {
    const res = await request(app).post('/auth/register').send({
      firstName: 'Eva',
      lastName: 'Nová',
      email: 'eva@test.com',
      password: 'securePass123',
      invitationCode,
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('invitationInvalid');
  });

  it('POST /auth/register — rejects duplicate email', async () => {
    // Create a fresh invitation for this test.
    const invRes = await request(app)
      .post('/invitations/create')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});
    const freshCode = invRes.body.code;

    const res = await request(app).post('/auth/register').send({
      firstName: 'Marie',
      lastName: 'Duplicate',
      email: 'marie@test.com',
      password: 'anotherPass123',
      invitationCode: freshCode,
    });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('emailTaken');
  });

  it('POST /auth/register — rejects weak password', async () => {
    const invRes = await request(app)
      .post('/invitations/create')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    const res = await request(app).post('/auth/register').send({
      firstName: 'Jan',
      lastName: 'Weak',
      email: 'weak@test.com',
      password: '123',
      invitationCode: invRes.body.code,
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('weakPassword');
  });

  it('POST /auth/login — caregiver logs in', async () => {
    const res = await request(app).post('/auth/login').send({
      email: 'marie@test.com',
      password: 'securePass123',
    });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
  });

  it('POST /auth/login — rejects wrong password', async () => {
    const res = await request(app).post('/auth/login').send({
      email: 'marie@test.com',
      password: 'wrongPass',
    });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('invalidCredentials');
  });

  it('protected route rejects caregiver from admin endpoints', async () => {
    const loginRes = await request(app).post('/auth/login').send({
      email: 'marie@test.com',
      password: 'securePass123',
    });

    const res = await request(app)
      .get('/users/all')
      .set('Authorization', `Bearer ${loginRes.body.accessToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('forbidden');
  });

  it('protected route rejects without token', async () => {
    const res = await request(app).get('/users/all');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('unauthorized');
  });

  it('POST /auth/refresh — rotates tokens', async () => {
    const loginRes = await request(app).post('/auth/login').send({
      email: 'marie@test.com',
      password: 'securePass123',
    });

    const cookies = loginRes.headers['set-cookie'];
    const refreshCookie = cookies.find((c) => c.startsWith('refreshToken='));

    const res = await request(app).post('/auth/refresh').set('Cookie', refreshCookie);

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('POST /auth/logout — clears cookie', async () => {
    const res = await request(app).post('/auth/logout');

    expect(res.status).toBe(204);
    const cookies = res.headers['set-cookie'];
    expect(cookies.some((c) => c.includes('refreshToken=;'))).toBe(true);
  });

  it('GET /invitations/all — admin sees unused invitations', async () => {
    const res = await request(app)
      .get('/invitations/all')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
