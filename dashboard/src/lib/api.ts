// MOB-1198 (FZW-WEB-01): the dashboard's only way to the backend.
// - Same origin (nginx forwards /api of app.finzyapp.com to Laravel): fetch
//   with credentials 'same-origin'; the session lives in httpOnly cookies
//   (__Host-finzy_web, __Host-finzy_web_refresh), never in JavaScript.
// - CSRF: `X-Finzy-Web: 1` on every state-changing call and on every
//   /api/web/* call (the backend refuses them without it, GET me included).
// - 401: one POST /api/web/refresh (shared by calls refused together), then
//   the call again; refused again → signed out (the sign-in page).
// - 402 (`unlimited_required`, or any plan gate): the page reserved to
//   Unlimited. That is how a plan that lapses mid-session shows that page
//   at the next page (FZW-WEB-01).

export type Query = Record<string, string | number | boolean | null | undefined>;

export class ApiError extends Error {
  readonly status: number;
  readonly code: string | null;
  readonly body: unknown;

  constructor(status: number, code: string | null, message: string, body: unknown = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.body = body;
  }
}

export type ApiOptions = {
  fetch?: typeof fetch;
  base?: string;
  onSignedOut?: () => void;
  onUnlimitedRequired?: (code: string | null) => void;
};

export type Api = {
  get<T>(path: string, query?: Query): Promise<T>;
  post<T>(path: string, body?: unknown): Promise<T>;
  del<T>(path: string): Promise<T>;
  /** The raw response of a GET (PDF downloads), after the same 401/402 handling. */
  blob(path: string): Promise<Blob>;
};

/** Calls that must never trigger a refresh: their 401 means «wrong details». */
const NO_REFRESH = ["/web/login", "/web/social", "/web/refresh", "/web/logout", "/send_reset_code", "/validate_new_pass"];

export const CSRF_HEADER = "X-Finzy-Web";

export function buildUrl(base: string, path: string, query?: Query): string {
  const url = path.startsWith("http") || path.startsWith(base + "/") ? path : `${base}${path}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${url}${url.includes("?") ? "&" : "?"}${qs}` : url;
}

async function readBody(res: Response): Promise<unknown> {
  const text = await res.text().catch(() => "");
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function errorCode(body: unknown): string | null {
  if (body && typeof body === "object") {
    const b = body as Record<string, unknown>;
    if (typeof b.error === "string") return b.error;
    if (typeof b.message === "string" && /^[a-z_.]+$/.test(b.message)) return b.message;
  }
  return null;
}

function errorMessage(body: unknown, status: number): string {
  if (body && typeof body === "object" && typeof (body as Record<string, unknown>).message === "string") {
    return (body as Record<string, string>).message;
  }
  return `HTTP ${status}`;
}

export function createApi(options: ApiOptions = {}): Api {
  const base = options.base ?? "/api";
  const doFetch: typeof fetch = (...args) => (options.fetch ?? globalThis.fetch)(...args);
  let refreshing: Promise<boolean> | null = null;

  function init(method: string, path: string, body?: unknown): RequestInit {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (method !== "GET" || path.startsWith("/web/")) headers[CSRF_HEADER] = "1";
    if (body !== undefined) headers["Content-Type"] = "application/json";
    return {
      method,
      credentials: "same-origin",
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    };
  }

  async function send(method: string, path: string, body?: unknown, query?: Query): Promise<Response> {
    try {
      return await doFetch(buildUrl(base, path, query), init(method, path, body));
    } catch (e) {
      throw new ApiError(0, "network", e instanceof Error ? e.message : "Network error");
    }
  }

  function refresh(): Promise<boolean> {
    if (!refreshing) {
      refreshing = send("POST", "/web/refresh")
        .then((res) => res.ok)
        .catch(() => false)
        .finally(() => {
          // Let the calls waiting on this refresh read its result first.
          setTimeout(() => {
            refreshing = null;
          }, 0);
        });
    }
    return refreshing;
  }

  async function request(method: string, path: string, body?: unknown, query?: Query): Promise<Response> {
    let res = await send(method, path, body, query);
    if (res.status === 401 && !NO_REFRESH.some((p) => path.startsWith(p))) {
      const ok = await refresh();
      if (ok) res = await send(method, path, body, query);
      if (res.status === 401) {
        options.onSignedOut?.();
      }
    }
    if (res.status === 402) {
      const b = await readBody(res);
      const code = errorCode(b);
      options.onUnlimitedRequired?.(code);
      throw new ApiError(402, code, errorMessage(b, 402), b);
    }
    if (!res.ok) {
      const b = await readBody(res);
      throw new ApiError(res.status, errorCode(b), errorMessage(b, res.status), b);
    }
    return res;
  }

  async function json<T>(method: string, path: string, body?: unknown, query?: Query): Promise<T> {
    const res = await request(method, path, body, query);
    const b = await readBody(res);
    if (b && typeof b === "object" && "data" in (b as Record<string, unknown>)) {
      return (b as { data: T }).data;
    }
    return b as T;
  }

  return {
    get: (path, query) => json("GET", path, undefined, query),
    post: (path, body) => json("POST", path, body ?? {}),
    del: (path) => json("DELETE", path),
    blob: async (path) => (await request("GET", path)).blob(),
  };
}
