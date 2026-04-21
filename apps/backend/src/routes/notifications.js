import { Router } from 'express';

import { notificationController } from '../controllers/notificationController.js';
import { validateBody } from '../middleware/validateBody.js';
import { createNotificationSchema } from '../validation/notificationValidation.js';

export const notificationsRouter = Router();

// Command-style routes per spec:
//   POST /notifications/create → create notification model
//   GET  /notifications/all    → list all notification models
notificationsRouter.post(
  '/create',
  validateBody(createNotificationSchema),
  notificationController.create,
);
notificationsRouter.get('/all', notificationController.all);
