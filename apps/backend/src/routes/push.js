import { Router } from 'express';

import { Caregiver } from '../models/Caregiver.js';
import { config } from '../config/index.js';
import { validateBody } from '../middleware/validateBody.js';
import { pushSubscriptionSchema } from '../validation/pushValidation.js';

export const pushRouter = Router();

pushRouter.post('/subscribe', validateBody(pushSubscriptionSchema), async (req, res) => {
  await Caregiver.findByIdAndUpdate(req.user.sub, {
    pushSubscription: req.body,
  });
  res.json({ ok: true });
});

pushRouter.delete('/unsubscribe', async (req, res) => {
  await Caregiver.findByIdAndUpdate(req.user.sub, {
    $unset: { pushSubscription: 1 },
  });
  res.json({ ok: true });
});

pushRouter.get('/vapid-public-key', (_req, res) => {
  res.json({ vapidPublicKey: config.vapid.publicKey });
});
