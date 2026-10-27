import type { ApiErrorBody } from "@looptalk/shared";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Ohne gültige Session: zum Dex-Login und danach zurück auf die aktuelle Seite. */
export function redirectToLogin(): never {
  const returnTo = window.location.pathname + window.location.search;
  window.location.assign(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
  throw new ApiError(401, "unauthorized", "Bitte anmelden.");
}

export async function api<T = void>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: init.method ?? "GET",
    headers: init.body === undefined ? undefined : { "Content-Type": "application/json" },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    credentials: "same-origin",
  });
  if (res.status === 401) redirectToLogin();
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw new ApiError(res.status, body?.error.code ?? "error", body?.error.message ?? "Unbekannter Fehler.");
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
