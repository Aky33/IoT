import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';

import { errorHandler } from './middleware/errorHandler.js';
import { requestId } from './middleware/requestId.js';
import { notificationsRouter } from './routes/notifications.js';
import { usersRouter } from './routes/users.js';
import { caregiversRouter } from "./routes/caregivers.js";
import { devicesRouter } from './routes/devices.js';

// Morgan custom token → logs the correlation ID set by requestId middleware.
morgan.token('id', (req) => req.id);

export function createApp() {
  const app = express();

  app.use(requestId);
  app.use(cors());
  app.use(express.json());
  app.use(morgan(':id :method :url :status :response-time ms - :res[content-length]'));

  app.get('/health', (req, res) => {
    const dbState = mongoose.connection.readyState;
    const dbStatus = dbState === 1 ? 'connected' : 'disconnected';
    const status = dbState === 1 ? 'ok' : 'degraded';
    res.status(dbState === 1 ? 200 : 503).json({
      status,
      db: dbStatus,
      timestamp: new Date().toISOString(),
    });
  });

  app.use('/users', usersRouter);
  app.use('/notifications', notificationsRouter);
  app.use("/caregivers", caregiversRouter);
  app.use('/devices', devicesRouter);
  //
  // For unauthenticated write endpoints apply rate limiting per route:
  //   import { notificationsRateLimit } from './middleware/rateLimit.js';
  //   app.use('/notifications/create', notificationsRateLimit, notificationsRouter);

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
