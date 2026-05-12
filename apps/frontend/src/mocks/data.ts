import type { Device } from "../types/device";
import type { DashboardSummary } from "../types/dashboard";
import type { Notification } from "../types/notification";
import type { User } from "../types/user";

export const mockUsers: User[] = [
  { id: "u-1", firstName: "Jan", lastName: "Novák", name: "Jan Novák" },
  { id: "u-2", firstName: "Karel", lastName: "Dvořák", name: "Karel Dvořák", notes: "Potřebuje asistenci" },
];

export const mockDevices: Device[] = [
  {
    id: "d-1",
    name: "Tlacitko Obyvak",
    assignedUserId: "u-2",
    caregiverId: "u-2",
    createdAt: new Date().toISOString(),
  },
  {
    id: "d-2",
    name: "Tlacitko Loznice",
    assignedUserId: "u-2",
    caregiverId: "u-2",
    createdAt: new Date().toISOString(),
  },
];

export const mockNotifications: Notification[] = [
  {
    id: "n-1",
    type: "urgent",
    status: "pending",
    deviceId: "d-1",
    deviceName: "Tlacitko Obyvak",
    createdAt: new Date().toISOString(),
    assignedUserId: "u-2",
  },
  {
    id: "n-2",
    type: "standard",
    status: "delivered",
    deviceId: "d-2",
    deviceName: "Tlacitko Loznice",
    createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    deliveredAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    assignedUserId: "u-2",
  },
];

export const mockSummary: DashboardSummary = {
  pendingNotificationsCount: 1,
  urgentNotificationsCount: 1,
};
