import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';

import { errorHandler } from './middleware/errorHandler.js';
import { requestId } from './middleware/requestId.js';
import { authenticate } from './middleware/authenticate.js';
import { authenticateDevice } from './middleware/authenticateDevice.js';
import { authorize } from './middleware/authorize.js';

import { authRouter } from './routes/auth.js';
import { usersRouter } from './routes/users.js';
import { caregiversRouter } from './routes/caregivers.js';
import { devicesRouter } from './routes/devices.js';
import { notificationsRouter } from './routes/notifications.js';
import { invitationsRouter } from './routes/invitations.js';

morgan.token('id', (req) => req.id);

export function createApp() {
  const app = express();

  app.use(requestId);
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());
  app.use(morgan(':id :method :url :status :response-time ms - :res[content-length]'));

  // --- Public ---
  app.get('/health', (_req, res) => {
    const dbState = mongoose.connection.readyState;
    const dbStatus = dbState === 1 ? 'connected' : 'disconnected';
    const status = dbState === 1 ? 'ok' : 'degraded';
    res
      .status(dbState === 1 ? 200 : 503)
      .json({ status, db: dbStatus, timestamp: new Date().toISOString() });
  });

  app.use('/auth', authRouter);

  // --- IoT Device (HMAC auth) ---
  app.use('/notifications', authenticateDevice, notificationsRouter);

  // --- Caregiver / Admin (JWT auth) ---
  app.use('/invitations', authenticate, authorize('admin'), invitationsRouter);
  app.use('/users', authenticate, authorize('admin'), usersRouter);
  app.use('/caregivers', authenticate, authorize('admin'), caregiversRouter);
  app.use('/devices', authenticate, authorize('admin'), devicesRouter);

  // --- 404 ---
  app.use((req, res) => {
    res.status(404).json({
      error: {
        code: 'notFound',
        message: `Route not found: ${req.method} ${req.path}`,
        details: {},
      },
    });
  });

  app.use(errorHandler);

  return app;
}
