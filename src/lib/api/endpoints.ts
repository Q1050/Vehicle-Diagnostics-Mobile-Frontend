/**
 * Future FastAPI contract surface.
 *
 * Capability switches are independent so integrations can be enabled incrementally.
 */
export const API_BASE_URL = import.meta.env["VITE_API_BASE_URL"] ?? "";

const USE_DIAGNOSTIC_MOCKS = import.meta.env["VITE_USE_MOCKS"] === "true";

export const MOCK_SERVICES = {
  image: USE_DIAGNOSTIC_MOCKS,
  audio: USE_DIAGNOSTIC_MOCKS,
  video: USE_DIAGNOSTIC_MOCKS,
  fusion: USE_DIAGNOSTIC_MOCKS,
  liveAudio: USE_DIAGNOSTIC_MOCKS,
  auth: false,
  vehicles: false,
  conversations: false,
  history: false,
  chat: USE_DIAGNOSTIC_MOCKS,
} as const;

export type ApiService = keyof typeof MOCK_SERVICES;
export const shouldUseMocks = (service: ApiService) => MOCK_SERVICES[service];

export const ENDPOINTS = {
  // Diagnostics
  image: "/api/v1/diagnostics/image",
  audio: "/api/v1/diagnostics/audio",
  video: "/api/v1/diagnostics/video",
  fuse: "/api/v1/diagnostics/fuse",
  liveAudioSocket: "/ws/audio",

  // Planned services
  signIn: "/api/v1/auth/login",
  signUp: "/api/v1/auth/register",
  vehicles: "/api/v1/vehicles",
  conversations: "/api/v1/conversations",
  history: "/api/v1/diagnostics/sessions",
  currentUser: "/api/v1/auth/me",
  symptoms: "/api/v1/diagnostics/symptoms",
  manuals: "/api/v1/manuals",
  manualSearch: "/api/v1/manuals/search",
} as const;

export const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Single place where real fetch calls will land later. */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface ApiRequestOptions extends Omit<RequestInit, "headers"> {
  headers?: HeadersInit;
  authToken?: string;
  timeoutMs?: number;
}

export async function apiRequest<T>(path: string, init: ApiRequestOptions = {}): Promise<T> {
  const { authSession } = await import("./session-storage");
  const headers = new Headers(init.headers);
  const token = init.authToken ?? authSession.getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const { authToken: _authToken, timeoutMs: _timeoutMs, ...requestInit } = init;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), init.timeoutMs ?? 15_000);
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...requestInit,
      headers,
      signal: controller.signal,
    });
  } catch (error) {
    throw new ApiError(
      error instanceof DOMException && error.name === "AbortError"
        ? "The request timed out. Please try again."
        : "AutoAssist could not reach the server. Check your connection and try again.",
      0,
      error,
    );
  } finally {
    window.clearTimeout(timeout);
  }
  if (!res.ok) {
    let details: unknown;
    try {
      details = await res.clone().json();
    } catch {
      details = await res.text();
    }
    const backendError =
      typeof details === "object" && details !== null && "error" in details
        ? (details as { error?: { message?: string } }).error
        : undefined;
    if (res.status === 401 && token) {
      authSession.clear();
      window.dispatchEvent(new Event("autoassist:unauthorized"));
    }
    throw new ApiError(
      backendError?.message ?? `Request failed: ${res.status}`,
      res.status,
      details,
    );
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
