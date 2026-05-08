import type { NotificationStatus, NotificationType } from "./common";

export type Notification = {
  id: string;
  type: NotificationType;
  status: NotificationStatus;
  deviceId: string;
  deviceName: string;
  createdAt: string;
  resolvedAt?: string;
  assignedUserId?: string;
};

export type NotificationFilters = {
  type?: NotificationType;
  status?: NotificationStatus;
  deviceId?: string;
  dateFrom?: string;
  dateTo?: string;
};
