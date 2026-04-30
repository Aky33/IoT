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
import { Device } from '../../src/models/Device.js';
import { User } from '../../src/models/User.js';

const app = createApp();

describe('Cross-tenant data isolation (integration)', () => {
  let adminToken;
  let caregiverAToken;
  let caregiverBToken;
  let caregiverAId;
  let caregiverBId;
  let deviceAId;
  let deviceBId;
  let userAId;
  let userBId;

  beforeAll(async () => {
    await mongoose.connect(config.mongoUri);
    await Caregiver.deleteMany({});
    await Invitation.deleteMany({});
    await Device.deleteMany({});
    await User.deleteMany({});

    // Seed admin directly.
    const passwordHash = await bcrypt.hash('adminPass123', 10);
    await Caregiver.create({
      firstName: 'Admin',
      lastName: 'Test',
      email: 'admin@tenant-test.com',
      passwordHash,
      role: 'admin',
    });

    // Log in as admin.
    const adminLogin = await request(app).post('/auth/login').send({
      email: 'admin@tenant-test.com',
      password: 'adminPass123',
    });
    adminToken = adminLogin.body.accessToken;

    // Create invitation for Caregiver A.
    const invA = await request(app)
      .post('/invitations/create')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ttlHours: 1 });
    const codeA = invA.body.code;

    // Register Caregiver A.
    const regA = await request(app).post('/auth/register').send({
      firstName: 'Alice',
      lastName: 'Alpha',
      email: 'alice@tenant-test.com',
      password: 'securePass123',
      invitationCode: codeA,
    });
    caregiverAToken = regA.body.accessToken;
    caregiverAId = regA.body.caregiver.id;

    // Create invitation for Caregiver B.
    const invB = await request(app)
      .post('/invitations/create')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ttlHours: 1 });
    const codeB = invB.body.code;

    // Register Caregiver B.
    const regB = await request(app).post('/auth/register').send({
      firstName: 'Bob',
      lastName: 'Beta',
      email: 'bob@tenant-test.com',
      password: 'securePass123',
      invitationCode: codeB,
    });
    caregiverBToken = regB.body.accessToken;
    caregiverBId = regB.body.caregiver.id;

    // Create User A and User B (admin-only).
    const userARes = await request(app)
      .post('/users/create')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ firstName: 'UserA', lastName: 'One' });
    userAId = userARes.body.id;

    const userBRes = await request(app)
      .post('/users/create')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ firstName: 'UserB', lastName: 'Two' });
    userBId = userBRes.body.id;

    // Create Device A assigned to Caregiver A and User A (admin-only).
    const deviceARes = await request(app)
      .post('/devices/create')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Device Alpha', caregiverId: caregiverAId, userId: userAId });
    deviceAId = deviceARes.body.id;

    // Create Device B assigned to Caregiver B and User B (admin-only).
    const deviceBRes = await request(app)
      .post('/devices/create')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Device Beta', caregiverId: caregiverBId, userId: userBId });
    deviceBId = deviceBRes.body.id;
  });

  afterAll(async () => {
    await Caregiver.deleteMany({});
    await Invitation.deleteMany({});
    await Device.deleteMany({});
    await User.deleteMany({});
    await mongoose.disconnect();
  });

  it("GET /devices/all — Caregiver A only sees their own device, not Caregiver B's", async () => {
    const res = await request(app)
      .get('/devices/all')
      .set('Authorization', `Bearer ${caregiverAToken}`);

    expect(res.status).toBe(200);
    const ids = res.body.data.map((d) => d.id);
    expect(ids).toContain(deviceAId);
    expect(ids).not.toContain(deviceBId);
  });

  it("GET /devices/get/:id — Caregiver A gets 403 accessing Caregiver B's device", async () => {
    const res = await request(app)
      .get(`/devices/get/${deviceBId}`)
      .set('Authorization', `Bearer ${caregiverAToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('forbidden');
  });

  it("GET /users/get/:id — Caregiver A gets 403 accessing Caregiver B's user", async () => {
    const res = await request(app)
      .get(`/users/get/${userBId}`)
      .set('Authorization', `Bearer ${caregiverAToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('forbidden');
  });

  it('GET /devices/all — Admin sees all devices', async () => {
    const res = await request(app)
      .get('/devices/all')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const ids = res.body.data.map((d) => d.id);
    expect(ids).toContain(deviceAId);
    expect(ids).toContain(deviceBId);
  });
});
