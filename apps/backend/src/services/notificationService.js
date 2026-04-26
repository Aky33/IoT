import { Caregiver } from '../models/Caregiver.js';
import { notificationRepository } from '../repositories/notificationRepository.js';
import { AppError } from '../errors/AppError.js';

/**
 * createFromDevicePress — called by POST /notifications/create.
 *
 * The device is already authenticated and attached to req.device
 * by the authenticateDevice middleware (HMAC-verified).
 *
 * Flow:
 *   1. Read userId + caregiverId from the authenticated device.
 *   2. Verify the target caregiver exists and is active.
 *   3. Create notification with denormalized snapshot of device relationships.
 *   4. (Future) Send push notification via FCM / alternative.
 *   5. Update notification status.
 */
export async function createFromDevicePress(device, type) {
  const caregiver = await Caregiver.findById(device.caregiverId);
  if (!caregiver || !caregiver.isActive) {
    throw new AppError(
      'caregiverNotFound',
      'Target caregiver not found or inactive.',
      { caregiverId: device.caregiverId },
      422,
    );
  }

  const notification = await notificationRepository.create({
    deviceId: device.id,
    userId: device.userId,
    caregiverId: device.caregiverId,
    type,
    status: 'pending',
  });

  // TODO: send push notification to caregiver.fcmToken.
  // On success: update status → 'sent', set sentAt.
  // On failure: update status → 'failed'.
  //
  // For now, mark as 'sent' immediately (no real push yet).
  const updated = await notificationRepository.update(notification.id, {
    status: 'sent',
    sentAt: new Date(),
  });

  return updated || notification;
}
