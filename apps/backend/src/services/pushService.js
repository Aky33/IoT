import webpush from 'web-push';
import { config } from '../config/index.js';
import { Caregiver } from '../models/Caregiver.js';

if (config.vapid.publicKey && config.vapid.privateKey) {
  webpush.setVapidDetails(
    config.vapid.subject,
    config.vapid.publicKey,
    config.vapid.privateKey,
  );
}

export async function sendPush(caregiverId, subscription, notification) {
  const payload = JSON.stringify({
    title: notification.type === 'urgent' ? 'URGENTNÍ ALERT' : 'Nová notifikace',
    body: `Zařízení: ${notification.deviceName || 'Neznámé'}`,
    type: notification.type,
    notificationId: notification.id,
  });

  try {
    await webpush.sendNotification(subscription, payload);
    return true;
  } catch (err) {
    if (err.statusCode === 410 || err.statusCode === 404) {
      await Caregiver.findByIdAndUpdate(caregiverId, { $unset: { pushSubscription: 1 } });
    }
    return false;
  }
}
