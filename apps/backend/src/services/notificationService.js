import { Caregiver } from '../models/Caregiver.js';
import { Device } from '../models/Device.js';
import { notificationRepository } from '../repositories/notificationRepository.js';
import { AppError } from '../errors/AppError.js';
import { sendPush } from './pushService.js';
import { emit } from './sseManager.js';

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

  const deviceDoc = await Device.findById(device.id);
  const deviceName = deviceDoc?.name || 'Neznámé zařízení';

  let pushOk = false;
  if (caregiver.pushSubscription?.endpoint) {
    pushOk = await sendPush(caregiver._id, caregiver.pushSubscription, {
      id: notification.id,
      type,
      deviceName,
    });
  }

  const sseDelivered = emit(device.caregiverId.toString(), {
    id: notification.id,
    type,
    deviceName,
    createdAt: notification.createdAt,
  });

  let status;
  if (pushOk) {
    status = 'sent';
  } else if (sseDelivered) {
    status = 'sent';
  } else {
    status = 'failed';
  }

  const updated = await notificationRepository.update(notification.id, {
    status,
    sentAt: status === 'sent' ? new Date() : undefined,
  });

  return updated || notification;
}
