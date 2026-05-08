import type { DeviceStatus, LedStatus } from "./common";

export type Device = {
  id: string;
  name: string;
  status: DeviceStatus;
  assignedUserId?: string;
  caregiverId?: string;
  macAddress?: string;
  firmwareVersion?: string;
  lastSeenAt?: string;
  ledStatus?: LedStatus;
  createdAt: string;
};

export type DeviceFormValues = {
  name: string;
  assignedUserId?: string;
};
