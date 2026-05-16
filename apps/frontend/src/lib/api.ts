import type { DeviceFormValues } from "../types/device";
import type { UserFormValues } from "../types/user";

import { request, buildUrl, ApiError } from "./api-client";
import type { PaginatedResponse } from "./api-client";
import {
  mapDevice,
  mapNotification,
  mapUser,
} from "./mappers";
import type { BackendDevice, BackendNotification, BackendUser } from "./mappers";
import type { Device } from "../types/device";

// ── Re-exports for backward compatibility ────────────────────────────────────
export { ApiError } from "./api-client";
export type { PaginatedResponse } from "./api-client";
export { buildUrl } from "./api-client";
export {
  type SessionUser,
  type RegisterPayload,
  refreshSession,
  login,
  register,
  logout,
  getTokenVersion,
  onTokenChange,
  parseSessionUser,
} from "./auth";
export { getAccessToken } from "./api-client";
export {
  type PushPermissionState,
  getPushState,
  syncPushSubscription,
  enablePushNotifications,
  disablePushNotifications,
} from "./push";

// ── Local types ───────────────────────────────────────────────────────────────

type BackendCaregiver = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role?: string;
  isActive?: boolean;
};

export type Caregiver = {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  isActive: boolean;
};

export type CaregiverFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role?: string;
};

export type CreatedDevice = Device & { deviceSecret: string };

type NotificationQueryParams = {
  deviceId?: string;
  page?: number;
  pageSize?: number;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function toDevicePayload(values: DeviceFormValues) {
  return {
    name: values.name,
    userId: values.assignedUserId || undefined,
    caregiverId: values.caregiverId || undefined,
  };
}

// ── Device CRUD ───────────────────────────────────────────────────────────────

export async function listDevices() {
  const result = await request<PaginatedResponse<BackendDevice>>(
    buildUrl("/devices/all", { pageSize: 200 }),
  );
  return (result?.data ?? []).map(mapDevice);
}

export async function getDevice(deviceId: string) {
  const result = await request<BackendDevice>(`/devices/get/${deviceId}`);
  return result ? mapDevice(result) : null;
}

export async function createDevice(values: DeviceFormValues): Promise<CreatedDevice> {
  const result = await request<BackendDevice>("/devices/create", {
    method: "POST",
    body: toDevicePayload(values),
  });

  if (!result) {
    throw new ApiError("Backend did not return the created device.", 500);
  }

  return { ...mapDevice(result), deviceSecret: result.deviceSecret ?? "" };
}

export async function updateDevice(deviceId: string, values: DeviceFormValues) {
  const result = await request<BackendDevice>(`/devices/edit/${deviceId}`, {
    method: "PUT",
    body: toDevicePayload(values),
  });

  if (!result) {
    throw new ApiError("Backend did not return the updated device.", 500);
  }

  return mapDevice(result);
}

export async function deleteDevice(deviceId: string) {
  await request<void>(`/devices/delete/${deviceId}`, { method: "DELETE" });
}

export async function simulateDevicePress(deviceId: string, type: "standard" | "urgent") {
  await request(`/devices/simulate/${deviceId}`, {
    method: "POST",
    body: { type },
  });
}

// ── Notification CRUD ─────────────────────────────────────────────────────────

export async function listNotifications(params: NotificationQueryParams = {}) {
  const result = await request<PaginatedResponse<BackendNotification>>(
    buildUrl("/notifications/all", {
      pageSize: params.pageSize ?? 200,
      page: params.page,
      deviceId: params.deviceId,
    }),
    { method: "GET" },
  );

  return {
    data: (result?.data ?? []).map(mapNotification),
    meta: result?.meta ?? { page: 1, pageSize: 200, total: 0 },
  };
}

// ── User CRUD ─────────────────────────────────────────────────────────────────

export async function listUsers() {
  const result = await request<PaginatedResponse<BackendUser>>(
    buildUrl("/users/all", { pageSize: 200 }),
  );
  return (result?.data ?? []).map(mapUser);
}

export async function createUser(values: UserFormValues) {
  const result = await request<BackendUser>("/users/create", {
    method: "POST",
    body: values,
  });
  if (!result) {
    throw new ApiError("Backend did not return the created user.", 500);
  }
  return mapUser(result);
}

export async function updateUser(userId: string, values: UserFormValues) {
  const result = await request<BackendUser>(`/users/edit/${userId}`, {
    method: "PUT",
    body: values,
  });
  if (!result) {
    throw new ApiError("Backend did not return the updated user.", 500);
  }
  return mapUser(result);
}

export async function deleteUser(userId: string) {
  await request<void>(`/users/delete/${userId}`, { method: "DELETE" });
}

// ── Caregiver CRUD ────────────────────────────────────────────────────────────

function mapCaregiver(c: BackendCaregiver): Caregiver {
  return {
    id: c.id,
    firstName: c.firstName,
    lastName: c.lastName,
    name: `${c.firstName} ${c.lastName}`.trim(),
    email: c.email,
    phone: c.phone,
    role: c.role ?? "caregiver",
    isActive: c.isActive ?? true,
  };
}

export async function listCaregivers() {
  const result = await request<PaginatedResponse<BackendCaregiver>>(
    buildUrl("/caregivers/all", { pageSize: 200 }),
  );
  return (result?.data ?? []).map(mapCaregiver);
}

export async function updateCaregiver(id: string, values: CaregiverFormValues) {
  const result = await request<BackendCaregiver>(`/caregivers/edit/${id}`, {
    method: "PUT",
    body: values,
  });
  if (!result) throw new ApiError("Backend did not return the updated caregiver.", 500);
  return mapCaregiver(result);
}

export async function deleteCaregiver(id: string) {
  await request<void>(`/caregivers/delete/${id}`, { method: "DELETE" });
}

// ── Invitations ───────────────────────────────────────────────────────────────

export type Invitation = {
  id: string;
  code: string;
  role: string;
  expiresAt: string;
  createdAt: string;
};

export async function listInvitations() {
  const result = await request<Invitation[]>("/invitations/all");
  return result ?? [];
}

export async function createInvitation(role: string = "caregiver", ttlHours: number = 24) {
  const result = await request<Invitation>("/invitations/create", {
    method: "POST",
    body: { role, ttlHours },
  });
  if (!result) throw new ApiError("Backend did not return the created invitation.", 500);
  return result;
}

export async function revokeInvitation(id: string) {
  await request<void>(`/invitations/revoke/${id}`, { method: "DELETE" });
}
