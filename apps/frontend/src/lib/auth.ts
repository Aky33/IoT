import type { UserRole } from "../types/common";
import { request, setAccessToken, setRefreshFn, ApiError } from "./api-client";

type AuthResponse = {
  accessToken: string;
};

type SessionPayload = {
  sub: string;
  email?: string;
  role: UserRole;
};

export type RegisterPayload = {
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

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return atob(padded);
}

export function parseSessionUser(token: string): SessionUser | null {
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
      if (session) {
        const currentToken = (await import("./api-client")).getAccessToken();
        if (currentToken) scheduleTokenRefresh(currentToken);
      }
    }, delay);
  } catch {
    // Ignore parse errors
  }
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
      setAccessToken(null);
      return null;
    }

    setAccessToken(result.accessToken);
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

  setAccessToken(result.accessToken);
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

  setAccessToken(result.accessToken);
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
    const { disablePushNotifications } = await import("./push");
    // Best-effort push unsubscribe before invalidating the token
    await disablePushNotifications().catch(() => undefined);
    await request<void>("/auth/logout", { method: "POST" }, { auth: false, retryOnUnauthorized: false });
  } finally {
    setAccessToken(null);
  }
}

// Register the refresh function with api-client so request() can call it on 401
setRefreshFn(async () => {
  const session = await refreshSession();
  return session !== null;
});
