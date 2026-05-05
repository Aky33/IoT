import type { Device } from "../types/device";
import type { DashboardSummary, LedStatusLegendItem } from "../types/dashboard";
import type { Notification } from "../types/notification";
import type { User } from "../types/user";

export const mockUsers: User[] = [
  { id: "u-1", name: "Admin User", role: "admin", email: "admin@iot.local" },
  { id: "u-2", name: "Caregiver User", role: "user", email: "caregiver@iot.local" }
];

export const mockDevices: Device[] = [
  {
    id: "d-1",
    name: "Tlacitko Obyvak",
    serialNumber: "SN-001",
    status: "online",
    assignedUserId: "u-2",
    caregiverId: "u-2",
    location: "Obyvak",
    lastSeenAt: new Date().toISOString(),
    ledStatus: "idle",
    createdAt: new Date().toISOString()
  },
  {
    id: "d-2",
    name: "Tlacitko Loznice",
    serialNumber: "SN-002",
    status: "offline",
    assignedUserId: "u-2",
    caregiverId: "u-2",
    location: "Loznice",
    lastSeenAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    ledStatus: "error",
    createdAt: new Date().toISOString()
  }
];

export const mockNotifications: Notification[] = [
  {
    id: "n-1",
    type: "urgent",
    status: "pending",
    deviceId: "d-1",
    deviceName: "Tlacitko Obyvak",
    createdAt: new Date().toISOString(),
    assignedUserId: "u-2"
  },
  {
    id: "n-2",
    type: "standard",
    status: "resolved",
    deviceId: "d-2",
    deviceName: "Tlacitko Loznice",
    createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    resolvedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    assignedUserId: "u-2"
  }
];

export const mockSummary: DashboardSummary = {
  activeDevicesCount: 1,
  offlineDevicesCount: 1,
  pendingNotificationsCount: 1,
  urgentNotificationsCount: 1
};

export const defaultLedLegendItems: LedStatusLegendItem[] = [
  { status: "idle", label: "Idle", description: "Zarizeni ceka na interakci." },
  { status: "sending", label: "Sending", description: "Notifikace se odesila." },
  { status: "success", label: "Success", description: "Notifikace uspesne odeslana." },
  { status: "error", label: "Error", description: "Chyba odeslani nebo spojeni." },
  { status: "urgent", label: "Urgent", description: "Urgentni rezim po dlouhem stisku." }
];
