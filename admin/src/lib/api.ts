// MOB-1372: the console's only way to the backend (/api/admin on the same origin).
// - Same origin: fetch with credentials 'same-origin'; the session lives in the
//   httpOnly Laravel cookie, never in JavaScript.
// - CSRF: `X-Finzy-Admin: 1` on every call (the backend refuses any call without it).
// - Errors are `{code}`. The client turns the ones every page shares into
//   navigation (onRedirect): signed out → the sign-in page, second step
//   missing → the code page or the set-up, session expired → sign-in with the
//   «scaduta» note. Everything else is thrown as ApiError for the page.

export type Query = Record<string, string | number | boolean | null | undefined>;

export const CONSOLE_HEADER = "X-Finzy-Admin";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string | null;
  readonly body: unknown;

  constructor(status: number, code: string | null, body: unknown = null) {
    super(code ?? `HTTP ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.body = body;
  }
}

/** Where a shared error sends the admin (routes inside the console). */
export type Redirect = "/accedi" | "/accedi?scaduta=1" | "/accedi/codice" | "/accedi/attiva";

export function redirectFor(status: number, code: string | null): Redirect | null {
  if (status === 401) return code === "session_expired" ? "/accedi?scaduta=1" : "/accedi";
  if (status === 403 && code === "two_factor_required") return "/accedi/codice";
  if (status === 403 && code === "two_factor_setup_required") return "/accedi/attiva";
  return null;
}

export type ApiOptions = {
  fetch?: typeof fetch;
  base?: string;
  /** Called (once per failing call) with where the admin must go; the call still throws. */
  onRedirect?: (to: Redirect) => void;
};

export type Api = {
  get<T>(path: string, query?: Query): Promise<T>;
  post<T>(path: string, body?: unknown): Promise<T>;
  put<T>(path: string, body?: unknown): Promise<T>;
  del<T>(path: string): Promise<T>;
  /** A file (CSV export): the same header and error handling, the body as a Blob. */
  blob(path: string, query?: Query): Promise<Blob>;
};

export function buildUrl(base: string, path: string, query?: Query): string {
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
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

function codeOf(body: unknown): string | null {
  if (body && typeof body === "object" && typeof (body as { code?: unknown }).code === "string") {
    return (body as { code: string }).code;
  }
  return null;
}


export function createApi(options: ApiOptions = {}): Api {
  const doFetch = options.fetch ?? ((...args: Parameters<typeof fetch>) => fetch(...args));
  const base = options.base ?? "/api/admin";

  async function call<T>(method: string, path: string, body?: unknown, query?: Query, asBlob = false): Promise<T> {
    const headers: Record<string, string> = { Accept: "application/json", [CONSOLE_HEADER]: "1" };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    let res: Response;
    try {
      res = await doFetch(buildUrl(base, path, query), {
        method,
        headers,
        credentials: "same-origin",
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch {
      throw new ApiError(0, "offline");
    }
    if (res.ok && asBlob) return (await res.blob()) as T;
    const data = await readBody(res);
    if (res.ok) return data as T;
    const code = codeOf(data);
    // A wrong password or code is 422/429, never 401/403: those always mean «go elsewhere».
    const to = path === "/session" ? null : redirectFor(res.status, code);
    if (to && options.onRedirect) options.onRedirect(to);
    throw new ApiError(res.status, code, data);
  }

  return {
    get: (path, query) => call("GET", path, undefined, query),
    post: (path, body) => call("POST", path, body ?? {}),
    put: (path, body) => call("PUT", path, body ?? {}),
    del: (path) => call("DELETE", path),
    blob: (path, query) => call<Blob>("GET", path, undefined, query, true),
  };
}
