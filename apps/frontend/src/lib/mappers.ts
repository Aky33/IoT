import type { Device } from "../types/device";
import type { Notification } from "../types/notification";
import type { User } from "../types/user";

export type BackendDevice = {
  id: string;
  name: string;
  userId?: string;
  caregiverId?: string;
  createdAt: string;
  deviceSecret?: string;
};

export type BackendNotification = {
  id: string;
  type: Notification["type"];
  status: Notification["status"];
  deviceId: string | { id?: string; name?: string };
  userId?: string;
  caregiverId?: string;
  createdAt: string;
  sentAt?: string | null;
  deliveredAt?: string | null;
  cancelledAt?: string | null;
};

export type BackendUser = {
  id: string;
  firstName: string;
  lastName: string;
  notes?: string;
};

export function mapDevice(device: BackendDevice): Device {
  return {
    id: device.id,
    name: device.name,
    assignedUserId: device.userId,
    caregiverId: device.caregiverId,
    createdAt: device.createdAt,
  };
}

export function mapNotification(notification: BackendNotification): Notification {
  const deviceId = typeof notification.deviceId === "string"
    ? notification.deviceId
    : notification.deviceId.id ?? "unknown-device";

  const deviceName = typeof notification.deviceId === "string"
    ? "Unknown device"
    : notification.deviceId.name ?? "Unknown device";

  return {
    id: notification.id,
    type: notification.type,
    status: notification.status,
    deviceId,
    deviceName,
    createdAt: notification.createdAt,
    sentAt: notification.sentAt ?? undefined,
    deliveredAt: notification.deliveredAt ?? undefined,
    cancelledAt: notification.cancelledAt ?? undefined,
    assignedUserId: notification.userId,
  };
}

export function mapUser(user: BackendUser): User {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    name: `${user.firstName} ${user.lastName}`.trim(),
    notes: user.notes,
  };
}
