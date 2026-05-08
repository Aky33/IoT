import type { Device, DeviceFormValues } from "../types/device";
import type { Notification } from "../types/notification";
import type { User } from "../types/user";
import type { UserRole } from "../types/common";

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: BodyInit | object;
};

type RequestBehavior = {
  auth?: boolean;
  retryOnUnauthorized?: boolean;
  ignoreUnauthorized?: boolean;
};

type PaginatedResponse<T> = {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
  };
};

type AuthResponse = {
  accessToken: string;
};

type BackendDevice = {
  id: string;
  name: string;
  userId?: string;
  caregiverId?: string;
  macAddress?: string;
  firmwareVersion?: string;
  lastSeenAt?: string;
  createdAt: string;
};

type BackendNotification = {
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

type BackendUser = {
  id: string;
  firstName: string;
  lastName: string;
};

type SessionPayload = {
  sub: string;
  email?: string;
  role: UserRole;
};

type RegisterPayload = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  invitationCode: string;
};

export type SessionUser = {
  id: string;
  email?: string;
  role: UserRole;
};

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";
const ONLINE_THRESHOLD_MS = 10 * 60 * 1000;

let accessToken: string | null = null;

function buildUrl(path: string, query?: Record<string, string | number | undefined>) {
  const url = new URL(path, API_BASE_URL);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url.toString();
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return atob(padded);
}

function parseSessionUser(token: string): SessionUser | null {
  try {
    const [, payload] = token.split(".");

    if (!payload) {
      return null;
    }

    const parsed = JSON.parse(decodeBase64Url(payload)) as SessionPayload;

    if (parsed.role !== "admin" && parsed.role !== "caregiver") {
      return null;
    }

    return {
      id: parsed.sub,
      email: parsed.email,
      role: parsed.role,
    };
  } catch {
    return null;
  }
}

function deriveDeviceStatus(lastSeenAt?: string): Device["status"] {
  if (!lastSeenAt) {
    return "offline";
  }

  return Date.now() - new Date(lastSeenAt).getTime() <= ONLINE_THRESHOLD_MS ? "online" : "offline";
}

function mapDevice(device: BackendDevice): Device {
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
    ledStatus: status === "online" ? "idle" : "error",
  };
}

function mapNotification(notification: BackendNotification): Notification {
  const deviceId = typeof notification.deviceId === "string"
    ? notification.deviceId
    : notification.deviceId.id ?? "unknown-device";

  const deviceName = typeof notification.deviceId === "string"
    ? notification.deviceId
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

function mapUser(user: BackendUser): User {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    name: `${user.firstName} ${user.lastName}`.trim(),
  };
}

async function parseError(response: Response) {
  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    throw new ApiError(`Request failed with status ${response.status}.`, response.status);
  }

  if (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof payload.error === "object" &&
    payload.error !== null
  ) {
    const backendError = payload.error as { message?: string; code?: string; details?: unknown };
    throw new ApiError(
      backendError.message ?? `Request failed with status ${response.status}.`,
      response.status,
      backendError.code,
      backendError.details,
    );
  }

  throw new ApiError(`Request failed with status ${response.status}.`, response.status);
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
  behavior: RequestBehavior = {},
): Promise<T | undefined> {
  const { auth = true, retryOnUnauthorized = true, ignoreUnauthorized = false } = behavior;
  const headers = new Headers(options.headers);
  const body = options.body;
  const isJsonBody = body !== undefined && !(body instanceof FormData) && typeof body === "object";

  if (auth && accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  if (isJsonBody) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(buildUrl(path), {
    ...options,
    headers,
    credentials: "include",
    body: isJsonBody ? JSON.stringify(body) : (body as BodyInit | undefined),
  });

  if (response.status === 401 && auth && retryOnUnauthorized) {
    const session = await refreshSession();

    if (session) {
      return request<T>(path, options, { ...behavior, retryOnUnauthorized: false });
    }
  }

  if (response.status === 401 && ignoreUnauthorized) {
    return undefined;
  }

  if (!response.ok) {
    await parseError(response);
  }

  if (response.status === 204) {
    return undefined;
  }

  const contentType = response.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    return response.json() as Promise<T>;
  }

  return undefined;
}

function toDevicePayload(values: DeviceFormValues) {
  return {
    name: values.name,
    userId: values.assignedUserId || undefined,
  };
}

function urlBase64ToUint8Array(value: string) {
  const decoded = decodeBase64Url(value);
  return Uint8Array.from(decoded, (character) => character.charCodeAt(0));
}

export function getAccessToken() {
  return accessToken;
}

export async function refreshSession() {
  const result = await request<AuthResponse>(
    "/auth/refresh",
    { method: "POST" },
    { auth: false, retryOnUnauthorized: false, ignoreUnauthorized: true },
  );

  if (!result?.accessToken) {
    accessToken = null;
    return null;
  }

  accessToken = result.accessToken;
  return parseSessionUser(result.accessToken);
}

export async function login(email: string, password: string) {
  const result = await request<AuthResponse>(
    "/auth/login",
    { method: "POST", body: { email, password } },
    { auth: false, retryOnUnauthorized: false },
  );

  if (!result?.accessToken) {
    throw new ApiError("Login did not return an access token.", 500);
  }

  accessToken = result.accessToken;

  const session = parseSessionUser(result.accessToken);

  if (!session) {
    throw new ApiError("Unable to parse authenticated session.", 500);
  }

  return session;
}

export async function register(payload: RegisterPayload) {
  const result = await request<AuthResponse>(
    "/auth/register",
    { method: "POST", body: payload },
    { auth: false, retryOnUnauthorized: false },
  );

  if (!result?.accessToken) {
    throw new ApiError("Registration did not return an access token.", 500);
  }

  accessToken = result.accessToken;

  const session = parseSessionUser(result.accessToken);

  if (!session) {
    throw new ApiError("Unable to parse authenticated session.", 500);
  }

  return session;
}

export async function logout() {
  try {
    await request<void>("/auth/logout", { method: "POST" }, { auth: false, retryOnUnauthorized: false });
  } finally {
    accessToken = null;
  }
}

export async function listDevices() {
  const result = await request<PaginatedResponse<BackendDevice>>("/devices/all");
  return (result?.data ?? []).map(mapDevice);
}

export async function getDevice(deviceId: string) {
  const result = await request<BackendDevice>(`/devices/get/${deviceId}`);
  return result ? mapDevice(result) : null;
}

export async function createDevice(values: DeviceFormValues) {
  const result = await request<BackendDevice>("/devices/create", {
    method: "POST",
    body: toDevicePayload(values),
  });

  if (!result) {
    throw new ApiError("Backend did not return the created device.", 500);
  }

  return mapDevice(result);
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

export async function listNotifications(deviceId?: string) {
  const result = await request<PaginatedResponse<BackendNotification>>("/notifications/all", {
    method: "GET",
  }, {
    auth: true,
    retryOnUnauthorized: true,
    ignoreUnauthorized: false,
  });

  const items = (result?.data ?? []).map(mapNotification);

  if (!deviceId) {
    return items;
  }

  return items.filter((notification) => notification.deviceId === deviceId);
}

export async function listUsers() {
  const result = await request<PaginatedResponse<BackendUser>>("/users/all");
  return (result?.data ?? []).map(mapUser);
}

export async function getPushEnabled() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return false;
  }

  const registration = await navigator.serviceWorker.register("/sw.js");
  const subscription = await registration.pushManager.getSubscription();
  return Boolean(subscription);
}

export async function enablePushNotifications() {
  if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    throw new ApiError("Push notifications are not supported in this browser.", 400);
  }

  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    throw new ApiError("Notification permission was not granted.", 400);
  }

  const registration = await navigator.serviceWorker.register("/sw.js");
  const keyResponse = await request<{ vapidPublicKey: string }>("/push/vapid-public-key");

  if (!keyResponse?.vapidPublicKey) {
    throw new ApiError("Missing VAPID public key.", 500);
  }

  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(keyResponse.vapidPublicKey),
    });
  }

  await request("/push/subscribe", {
    method: "POST",
    body: subscription.toJSON(),
  });
}

export async function disablePushNotifications() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return;
  }

  const registration = await navigator.serviceWorker.register("/sw.js");
  const subscription = await registration.pushManager.getSubscription();

  if (subscription) {
    await subscription.unsubscribe();
  }

  await request("/push/unsubscribe", { method: "DELETE" });
}