import type { DeviceStatus, LedStatus } from "./common";

export type Device = {
  id: string;
  name: string;
  serialNumber: string;
  status: DeviceStatus;
  assignedUserId?: string;
  caregiverId?: string;
  location?: string;
  note?: string;
  lastSeenAt?: string;
  ledStatus?: LedStatus;
  createdAt: string;
};

export type DeviceFormValues = {
  name: string;
  serialNumber: string;
  assignedUserId?: string;
  location?: string;
  note?: string;
};
