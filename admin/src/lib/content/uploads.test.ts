import { afterEach, describe, expect, it, vi } from "vitest";
import type { Api } from "@/lib/api";
import { getUploads, pauseUpload, refuseVideo, resetUploads, resumeUpload, setTransport, startVideoUpload, cancelUpload, type Transport } from "./uploads";

const MB = 1024 * 1024;

function file(name: string, size: number, type = "video/mp4"): File {
  const f = new File(["x"], name, { type });
  Object.defineProperty(f, "size", { value: size });
  f.slice = vi.fn(() => new Blob(["part"])) as File["slice"];
  return f;
}

function api(stored: { number: number; etag: string }[] = []) {
  const calls: { m: string; p: string; b?: unknown }[] = [];
  const a: Api = {
    get: vi.fn(async (p: string, q?: unknown) => (calls.push({ m: "GET", p, b: q }), { parts: stored })) as Api["get"],
    post: vi.fn(async (p: string, b?: unknown) => {
      calls.push({ m: "POST", p, b });
      if (p.endsWith("/video-upload")) return { upload_id: "U1", part_size: 16 * MB, part_count: 3 };
      if (p.endsWith("/parts")) return { urls: Object.fromEntries((b as { part_numbers: number[] }).part_numbers.map((n) => [String(n), `https://s3/p${n}`])) };
      if (p.endsWith("/complete")) return { id: 5, videos: { it: { name: "x.mp4", duration: 371, size: 40 * MB, uploaded_at: null }, en: null } };
      return null;
    }) as Api["post"],
    put: vi.fn() as Api["put"],
    del: vi.fn() as Api["del"],
    blob: vi.fn() as Api["blob"],
  };
  return { a, calls };
}

const flush = () => new Promise((r) => setTimeout(r, 0));

afterEach(() => resetUploads());

describe("lesson video uploads", () => {
  it("refuses anything but MP4 or MOV up to 2 GB", () => {
    expect(refuseVideo({ name: "a.avi", size: 10 })).toBe("type");
    expect(refuseVideo({ name: "a.MP4", size: 2 * 1024 * MB + 1 })).toBe("size");
    expect(refuseVideo({ name: "a.mov", size: 2 * 1024 * MB })).toBeNull();
  });

  it("sends every part to its signed URL, then completes with the length read from the file", async () => {
    const put: string[] = [];
    setTransport({ putPart: async (url, _b, onProgress) => (onProgress(10), put.push(url), `"e-${url.slice(-1)}"`), readDuration: async () => 371.4 });
    const { a, calls } = api();
    const done = vi.fn();
    startVideoUpload({ api: a, lessonId: 5, lessonTitle: "Il valore del denaro", lang: "it", file: file("lezione.mp4", 40 * MB), onDone: done });
    await vi.waitFor(() => expect(done).toHaveBeenCalled());
    expect(put).toEqual(["https://s3/p1", "https://s3/p2", "https://s3/p3"]);
    expect(calls[0]).toEqual({ m: "POST", p: "/lessons/5/video-upload", b: { lang: "it", name: "lezione.mp4", size: 40 * MB, type: "video/mp4" } });
    const complete = calls.find((c) => c.p.endsWith("/complete"))!;
    expect(complete.b).toEqual({ upload_id: "U1", duration_seconds: 371, parts: [{ number: 1, etag: '"e-1"' }, { number: 2, etag: '"e-2"' }, { number: 3, etag: '"e-3"' }] });
    expect(getUploads()[0].status).toBe("done");
  });

  it("an unreadable length is sent as null, never made up", async () => {
    setTransport({ putPart: async () => '"e"', readDuration: async () => null });
    const { a, calls } = api();
    const done = vi.fn();
    startVideoUpload({ api: a, lessonId: 5, lessonTitle: "L", lang: "en", file: file("a.mov", 1 * MB, "video/quicktime"), onDone: done });
    await vi.waitFor(() => expect(done).toHaveBeenCalled());
    expect((calls.find((c) => c.p.endsWith("/complete"))!.b as { duration_seconds: unknown }).duration_seconds).toBeNull();
  });

  it("after a dropped connection it resumes with only the parts the server does not have", async () => {
    let fail = true;
    const put: string[] = [];
    const transport: Transport = {
      putPart: async (url) => {
        if (url.endsWith("p2") && fail) throw new Error("network");
        put.push(url);
        return '"e"';
      },
      readDuration: async () => 60,
    };
    setTransport(transport);
    const { a, calls } = api([{ number: 1, etag: '"e"' }]);
    const done = vi.fn();
    startVideoUpload({ api: a, lessonId: 5, lessonTitle: "L", lang: "it", file: file("a.mp4", 40 * MB), onDone: done });
    await vi.waitFor(() => expect(getUploads()[0].status).toBe("error"));
    fail = false;
    resumeUpload(getUploads()[0].id);
    await vi.waitFor(() => expect(done).toHaveBeenCalled());
    expect(calls.some((c) => c.m === "GET" && c.p === "/lessons/5/video-upload")).toBe(true);
    // p1 went before the failure and the server lists it: it is not sent again.
    expect(put).toEqual(["https://s3/p1", "https://s3/p2", "https://s3/p3"]);
  });

  it("pause stops sending and cancel tells the server to drop the upload", async () => {
    let release: () => void = () => undefined;
    setTransport({
      putPart: (_u, _b, _p, signal) =>
        new Promise((resolve, reject) => {
          release = () => resolve('"e"');
          signal.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
        }),
      readDuration: async () => 60,
    });
    const { a, calls } = api();
    startVideoUpload({ api: a, lessonId: 5, lessonTitle: "L", lang: "it", file: file("a.mp4", 40 * MB) });
    await vi.waitFor(() => expect(getUploads()[0].status).toBe("uploading"));
    await flush();
    pauseUpload(getUploads()[0].id);
    expect(getUploads()[0].status).toBe("paused");
    release();
    cancelUpload(getUploads()[0].id);
    expect(getUploads()).toEqual([]);
    expect(calls.some((c) => c.p === "/lessons/5/video-upload/abort")).toBe(true);
  });
});
