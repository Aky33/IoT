import { Router } from 'express';

import { notificationController } from '../controllers/notificationController.js';
import { validateBody } from '../middleware/validateBody.js';
import { createNotificationSchema } from '../validation/notificationValidation.js';

export const notificationCreateRouter = Router();
notificationCreateRouter.post(
  '/',
  validateBody(createNotificationSchema),
  notificationController.create,
);

export const notificationListRouter = Router();
notificationListRouter.get('/all', notificationController.all);
