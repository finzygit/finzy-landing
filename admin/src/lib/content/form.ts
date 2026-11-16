// MOB-1380: picture uploads (lesson cover, tutorial step, avatar) as multipart
// form posts. The shell's api client sends JSON only, so this sends the same
// header and credentials itself and throws the same ApiError. A signed-out or
// half-signed-in answer asks the shell client for /me, which redirects.

import { ApiError, CONSOLE_HEADER, redirectFor, type Api } from "@/lib/api";

export const API_BASE = "/api/admin";

export async function postForm<T>(api: Api, path: string, form: FormData, doFetch: typeof fetch = (...a) => fetch(...a)): Promise<T> {
  let res: Response;
  try {
    res = await doFetch(`${API_BASE}${path}`, { method: "POST", headers: { Accept: "application/json", [CONSOLE_HEADER]: "1" }, credentials: "same-origin", body: form });
  } catch {
    throw new ApiError(0, "offline");
  }
  const text = await res.text().catch(() => "");
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (res.ok) return data as T;
  const code = data && typeof data === "object" && typeof (data as { code?: unknown }).code === "string" ? (data as { code: string }).code : null;
  if (redirectFor(res.status, code)) api.get("/me").catch(() => undefined);
  throw new ApiError(res.status, code, data);
}

/** Width and height of a picture file, read in the browser before it is sent (null when it cannot be read). */
export function imageSize(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    if (typeof URL.createObjectURL !== "function") return resolve(null);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve(null);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}
