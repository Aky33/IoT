import type { Device, DeviceFormValues } from "../types/device";
import type { Notification } from "../types/notification";
import type { User, UserFormValues } from "../types/user";
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
  deviceSecret?: string;
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
  notes?: string;
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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
const ONLINE_THRESHOLD_MS = 10 * 60 * 1000;

let accessToken: string | null = null;
let _tokenVersion = 0;
const _tokenListeners = new Set<() => void>();

export function getTokenVersion() {
  return _tokenVersion;
}

export function onTokenChange(listener: () => void) {
  _tokenListeners.add(listener);
  return () => { _tokenListeners.delete(listener); };
}

function notifyTokenChange() {
  _tokenVersion++;
  _tokenListeners.forEach((fn) => fn());
}

function buildUrl(path: string, query?: Record<string, string | number | undefined>) {
  const base = API_BASE_URL || window.location.origin;
  const url = new URL(path, base);

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
  };
}

function mapNotification(notification: BackendNotification): Notification {
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

function mapUser(user: BackendUser): User {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    name: `${user.firstName} ${user.lastName}`.trim(),
    notes: user.notes,
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
    caregiverId: values.caregiverId || undefined,
  };
}

function urlBase64ToUint8Array(value: string) {
  const decoded = decodeBase64Url(value);
  return Uint8Array.from(decoded, (character) => character.charCodeAt(0));
}

let _refreshTimer: ReturnType<typeof setTimeout> | null = null;
let _refreshPromise: Promise<SessionUser | null> | null = null;

function scheduleTokenRefresh(token: string) {
  if (_refreshTimer !== null) {
    clearTimeout(_refreshTimer);
    _refreshTimer = null;
  }

  try {
    const [, payload] = token.split(".");
    if (!payload) return;
    const { exp } = JSON.parse(decodeBase64Url(payload)) as { exp?: number };
    if (!exp) return;
    const delay = exp * 1000 - Date.now() - 60_000; // 1 min before expiry
    if (delay <= 0) return;
    _refreshTimer = setTimeout(async () => {
      const session = await refreshSession();
      if (session && accessToken) scheduleTokenRefresh(accessToken);
    }, delay);
  } catch {
    // Ignore parse errors
  }
}

export function getAccessToken() {
  return accessToken;
}

export async function refreshSession() {
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = (async () => {
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
    notifyTokenChange();
    scheduleTokenRefresh(result.accessToken);
    return parseSessionUser(result.accessToken);
  })().finally(() => {
    _refreshPromise = null;
  });

  return _refreshPromise;
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
  notifyTokenChange();
  scheduleTokenRefresh(result.accessToken);

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
  notifyTokenChange();
  scheduleTokenRefresh(result.accessToken);

  const session = parseSessionUser(result.accessToken);

  if (!session) {
    throw new ApiError("Unable to parse authenticated session.", 500);
  }

  return session;
}

export async function logout() {
  if (_refreshTimer !== null) {
    clearTimeout(_refreshTimer);
    _refreshTimer = null;
  }

  try {
    // Best-effort push unsubscribe before invalidating the token
    await disablePushNotifications().catch(() => undefined);
    await request<void>("/auth/logout", { method: "POST" }, { auth: false, retryOnUnauthorized: false });
  } finally {
    accessToken = null;
  }
}

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

export type CreatedDevice = Device & { deviceSecret: string };

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

type NotificationQueryParams = {
  deviceId?: string;
  page?: number;
  pageSize?: number;
};

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

type BackendCaregiver = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

export type Caregiver = {
  id: string;
  name: string;
  email: string;
};

export async function listCaregivers() {
  const result = await request<PaginatedResponse<BackendCaregiver>>(
    buildUrl("/caregivers/all", { pageSize: 200 }),
  );
  return (result?.data ?? []).map((c): Caregiver => ({
    id: c.id,
    name: `${c.firstName} ${c.lastName}`.trim(),
    email: c.email,
  }));
}

export type PushPermissionState = "granted" | "denied" | "default" | "unsupported";

export async function getPushState(): Promise<{ permission: PushPermissionState; subscribed: boolean }> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    return { permission: "unsupported", subscribed: false };
  }

  const permission = Notification.permission as PushPermissionState;
  const registration = await navigator.serviceWorker.register("/sw.js");
  const subscription = await registration.pushManager.getSubscription();

  return { permission, subscribed: Boolean(subscription) };
}

export async function syncPushSubscription() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return false;
  }

  const registration = await navigator.serviceWorker.register("/sw.js");
  const subscription = await registration.pushManager.getSubscription();

  if (!subscription) return false;

  const { endpoint, keys } = subscription.toJSON();
  await request("/push/subscribe", {
    method: "POST",
    body: { endpoint, keys },
  });
  return true;
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

  const { endpoint, keys } = subscription.toJSON();
  await request("/push/subscribe", {
    method: "POST",
    body: { endpoint, keys },
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