import type { LedStatus, PairingStatusType } from "./common";

export type DashboardSummary = {
  activeDevicesCount: number;
  offlineDevicesCount: number;
  pendingNotificationsCount: number;
  urgentNotificationsCount: number;
};

export type LedStatusLegendItem = {
  status: LedStatus;
  label: string;
  description: string;
};

export type PairingState = {
  status: PairingStatusType;
  message?: string;
};
