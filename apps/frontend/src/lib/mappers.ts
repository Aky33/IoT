import type { Device } from "../types/device";
import type { Notification } from "../types/notification";
import type { User } from "../types/user";

export type BackendDevice = {
  id: string;
  name: string;
  userId?: string;
  caregiverId?: string;
  macAddress?: string;
  firmwareVersion?: string;
  lastSeenAt?: string;
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

export const ONLINE_THRESHOLD_MS = 10 * 60 * 1000;

export function deriveDeviceStatus(lastSeenAt?: string): Device["status"] {
  if (!lastSeenAt) {
    return "offline";
  }

  return Date.now() - new Date(lastSeenAt).getTime() <= ONLINE_THRESHOLD_MS ? "online" : "offline";
}

export function mapDevice(device: BackendDevice): Device {
  const status = deriveDeviceStatus(device.lastSeenAt);

  return {
    id: device.id,
    name: device.name,
    assignedUserId: device.userId,
    caregiverId: device.caregiverId,
    macAddress: device.macAddress,
    firmwareVersion: device.firmwareVersion,
    lastSeenAt: device.lastSeenAt,
    createdAt: device.createdAt,
    status,
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
