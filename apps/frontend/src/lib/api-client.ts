export type RequestOptions = Omit<RequestInit, "body"> & {
  body?: BodyInit | object;
};

export type RequestBehavior = {
  auth?: boolean;
  retryOnUnauthorized?: boolean;
  ignoreUnauthorized?: boolean;
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
  };
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

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

let _accessToken: string | null = null;
let _refreshFn: (() => Promise<boolean>) | null = null;

export function setAccessToken(token: string | null) {
  _accessToken = token;
}

export function getAccessToken() {
  return _accessToken;
}

export function setRefreshFn(fn: () => Promise<boolean>) {
  _refreshFn = fn;
}

export function buildUrl(path: string, query?: Record<string, string | number | undefined>) {
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

export async function request<T>(
  path: string,
  options: RequestOptions = {},
  behavior: RequestBehavior = {},
): Promise<T | undefined> {
  const { auth = true, retryOnUnauthorized = true, ignoreUnauthorized = false } = behavior;
  const headers = new Headers(options.headers);
  const body = options.body;
  const isJsonBody = body !== undefined && !(body instanceof FormData) && typeof body === "object";

  if (auth && _accessToken) {
    headers.set("Authorization", `Bearer ${_accessToken}`);
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

  if (response.status === 401 && auth && retryOnUnauthorized && _refreshFn) {
    const refreshed = await _refreshFn();

    if (refreshed) {
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
