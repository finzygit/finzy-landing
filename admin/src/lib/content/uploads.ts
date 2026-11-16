// MOB-1380: lesson videos go from the browser straight to storage (S3
// multipart through signed part URLs from /api/admin/lessons/{id}/video-upload).
// A module-level store keeps every upload alive while the admin moves between
// the console's pages (the «Caricamenti» tray), with progress, time left,
// pause / resume (the server lists the parts already stored, so a resume
// sends only the missing ones), cancel and retry after a dropped connection.
// The lesson keeps its old video until the new one is complete (decision 7).

import { useSyncExternalStore } from "react";
import { ApiError, type Api } from "@/lib/api";
import type { Lang, LessonDetail } from "./types";

export const MAX_BYTES = 2 * 1024 * 1024 * 1024;
const OK_EXT = ["mp4", "mov"];
const BATCH = 8;

export type UploadStatus = "starting" | "uploading" | "paused" | "error" | "checking" | "done" | "cancelled";

export type Upload = {
  id: string;
  /** The admin who started it (the tray drops other admins' uploads after a sign-out in the same tab). */
  owner: number | null;
  lessonId: number;
  lessonTitle: string;
  lang: Lang;
  fileName: string;
  size: number;
  sent: number;
  status: UploadStatus;
  /** Bytes per second, smoothed. */
  rate: number;
};

export type Transport = {
  /** PUT a part, report its bytes as they go, resolve with the ETag. */
  putPart(url: string, body: Blob, onProgress: (loaded: number) => void, signal: AbortSignal): Promise<string>;
  /** The video's length in seconds, read from the file (null when the browser cannot read it). */
  readDuration(file: File): Promise<number | null>;
};

/** Why a file is refused before anything is sent. */
export function refuseVideo(file: { name: string; size: number }): "type" | "size" | null {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!OK_EXT.includes(ext)) return "type";
  if (file.size > MAX_BYTES) return "size";
  return null;
}

type Job = Upload & {
  file: File;
  api: Api;
  uploadId: string | null;
  partSize: number;
  partCount: number;
  etags: Map<number, string>;
  duration: number | null | undefined;
  inFlight: Map<number, number>;
  controller: AbortController | null;
  lastTick: { t: number; sent: number };
  onDone?: (lesson: LessonDetail) => void;
};

const jobs = new Map<string, Job>();
const listeners = new Set<() => void>();
let snapshot: Upload[] = [];
let transport: Transport = browserTransport();

function publish() {
  snapshot = [...jobs.values()].map(({ id, owner, lessonId, lessonTitle, lang, fileName, size, sent, status, rate }) => ({ id, owner, lessonId, lessonTitle, lang, fileName, size, sent, status, rate }));
  listeners.forEach((l) => l());
  syncUnloadGuard();
}

export function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export const getUploads = () => snapshot;

export function useUploads(): Upload[] {
  return useSyncExternalStore(subscribe, getUploads, getUploads);
}

/** Tests: swap the network and the duration reader, and forget every upload. */
export function setTransport(t: Transport) {
  transport = t;
}
export function resetUploads() {
  jobs.forEach((j) => j.controller?.abort());
  jobs.clear();
  publish();
}

export const isActive = (u: Upload) => u.status === "starting" || u.status === "uploading" || u.status === "checking" || u.status === "paused" || u.status === "error";

export function startVideoUpload(args: { api: Api; owner?: number | null; lessonId: number; lessonTitle: string; lang: Lang; file: File; onDone?: (lesson: LessonDetail) => void }): string {
  // One upload per lesson and language: a new file replaces a running one.
  for (const j of jobs.values()) if (j.lessonId === args.lessonId && j.lang === args.lang && isActive(j)) cancelUpload(j.id);
  const id = `${args.lessonId}-${args.lang}-${Date.now()}`;
  const job: Job = {
    id, owner: args.owner ?? null, lessonId: args.lessonId, lessonTitle: args.lessonTitle, lang: args.lang, fileName: args.file.name, size: args.file.size,
    sent: 0, status: "starting", rate: 0, file: args.file, api: args.api, uploadId: null, partSize: 0, partCount: 0,
    etags: new Map(), duration: undefined, inFlight: new Map(), controller: null, lastTick: { t: Date.now(), sent: 0 }, onDone: args.onDone,
  };
  jobs.set(id, job);
  publish();
  void run(job);
  return id;
}

export function pauseUpload(id: string) {
  const j = jobs.get(id);
  if (!j || (j.status !== "uploading" && j.status !== "starting")) return;
  j.status = "paused";
  j.controller?.abort();
  publish();
}

export function resumeUpload(id: string) {
  const j = jobs.get(id);
  if (!j || (j.status !== "paused" && j.status !== "error")) return;
  j.status = j.uploadId ? "uploading" : "starting";
  publish();
  void run(j);
}

export function cancelUpload(id: string) {
  const j = jobs.get(id);
  if (!j) return;
  const wasLive = isActive(j);
  j.status = "cancelled";
  j.controller?.abort();
  if (wasLive && j.uploadId) j.api.post(`/lessons/${j.lessonId}/video-upload/abort`, { upload_id: j.uploadId }).catch(() => undefined);
  jobs.delete(id);
  publish();
}

/** Takes the finished ones off the tray. */
/** Signing out: nothing of this admin's uploads stays in the tab for the next one. */
export function cancelAllUploads() {
  for (const id of [...jobs.keys()]) cancelUpload(id);
}

export function clearFinished() {
  for (const [id, j] of jobs) if (j.status === "done") jobs.delete(id);
  publish();
}

function sentNow(j: Job) {
  let done = 0;
  for (const n of j.etags.keys()) done += partBytes(j, n);
  for (const b of j.inFlight.values()) done += b;
  return Math.min(done, j.size);
}

function partBytes(j: Job, n: number) {
  return Math.min(j.partSize, j.size - (n - 1) * j.partSize);
}

function tick(j: Job) {
  j.sent = sentNow(j);
  const now = Date.now();
  const dt = (now - j.lastTick.t) / 1000;
  if (dt >= 0.5) {
    const r = (j.sent - j.lastTick.sent) / dt;
    j.rate = j.rate ? j.rate * 0.7 + r * 0.3 : r;
    j.lastTick = { t: now, sent: j.sent };
  }
  publish();
}

async function run(j: Job) {
  // One live run per upload: a resume aborts the previous run, and a run that is no longer the
  // job's own (paused, cancelled, replaced) never writes to the job again.
  j.controller?.abort();
  const controller = new AbortController();
  j.controller = controller;
  const stopped = () => controller.signal.aborted || j.controller !== controller || j.status === "paused" || j.status === "cancelled";
  j.lastTick = { t: Date.now(), sent: j.sent };
  j.rate = 0;
  try {
    if (j.duration === undefined) {
      // Unreadable (a codec the browser cannot open): sent as null, the lesson shows no length.
      const d = await transport.readDuration(j.file);
      j.duration = d && d >= 1 ? d : null;
    }
    if (!j.uploadId) {
      const up = await j.api.post<{ upload_id: string; part_size: number; part_count: number }>(`/lessons/${j.lessonId}/video-upload`, {
        lang: j.lang, name: j.fileName, size: j.size, type: j.file.type || null,
      });
      if (stopped()) {
        // Paused or cancelled while the server was starting it: drop that upload, the next run starts its own.
        j.api.post(`/lessons/${j.lessonId}/video-upload/abort`, { upload_id: up.upload_id }).catch(() => undefined);
        return;
      }
      j.uploadId = up.upload_id;
      j.partSize = up.part_size;
      j.partCount = up.part_count;
    } else {
      // Resume: the server says which parts are already stored.
      const have = await j.api.get<{ parts: { number: number; etag: string }[] }>(`/lessons/${j.lessonId}/video-upload`, { upload_id: j.uploadId });
      if (stopped()) return;
      j.etags = new Map(have.parts.map((p) => [p.number, p.etag]));
    }
    if (stopped()) return;
    j.status = "uploading";
    j.inFlight.clear();
    tick(j);

    const missing = () => Array.from({ length: j.partCount }, (_, i) => i + 1).filter((n) => !j.etags.has(n));
    for (let todo = missing(); todo.length; todo = missing()) {
      const batch = todo.slice(0, BATCH);
      const { urls } = await j.api.post<{ urls: Record<string, string> }>(`/lessons/${j.lessonId}/video-upload/parts`, { upload_id: j.uploadId, part_numbers: batch });
      if (stopped()) return;
      for (const n of batch) {
        if (stopped()) return;
        const start = (n - 1) * j.partSize;
        const blob = j.file.slice(start, start + partBytes(j, n));
        const etag = await transport.putPart(urls[String(n)], blob, (loaded) => {
          if (stopped()) return;
          j.inFlight.set(n, loaded);
          tick(j);
        }, controller.signal);
        if (stopped()) return;
        j.inFlight.delete(n);
        j.etags.set(n, etag);
        tick(j);
      }
    }
    if (stopped()) return;
    j.status = "checking";
    publish();
    const parts = [...j.etags.entries()].sort((a, b) => a[0] - b[0]).map(([number, etag]) => ({ number, etag }));
    const lesson = await j.api.post<LessonDetail>(`/lessons/${j.lessonId}/video-upload/complete`, { upload_id: j.uploadId, parts, duration_seconds: j.duration ? Math.round(j.duration) : null });
    if (j.controller !== controller || (j.status as UploadStatus) === "cancelled") return;
    j.status = "done";
    j.sent = j.size;
    publish();
    j.onDone?.(lesson);
  } catch (e) {
    if (stopped()) return;
    j.inFlight.clear();
    // An upload id the server forgot (two days, or another tab finished it): start again from zero.
    if (e instanceof ApiError && e.code === "upload_not_found") {
      j.uploadId = null;
      j.etags.clear();
    }
    j.status = "error";
    j.sent = sentNow(j);
    publish();
  } finally {
    if (j.controller === controller) j.controller = null;
  }
}

// Leaving the page loses the file: the browser asks first while something is uploading.
let guarded = false;
function onBeforeUnload(e: BeforeUnloadEvent) {
  e.preventDefault();
  e.returnValue = "";
}
function syncUnloadGuard() {
  if (typeof window === "undefined") return;
  // Paused or failed uploads count too: reloading loses the file they still need.
  const live = snapshot.some(isActive);
  if (live && !guarded) window.addEventListener("beforeunload", onBeforeUnload);
  if (!live && guarded) window.removeEventListener("beforeunload", onBeforeUnload);
  guarded = live;
}

function browserTransport(): Transport {
  return {
    putPart(url, body, onProgress, signal) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", url);
        xhr.upload.onprogress = (e) => onProgress(e.loaded);
        xhr.onload = () => {
          const etag = xhr.getResponseHeader("ETag");
          if (xhr.status >= 200 && xhr.status < 300 && etag) resolve(etag);
          else reject(new Error(`part ${xhr.status}`));
        };
        xhr.onerror = () => reject(new Error("network"));
        xhr.onabort = () => reject(new DOMException("aborted", "AbortError"));
        signal.addEventListener("abort", () => xhr.abort(), { once: true });
        xhr.send(body);
      });
    },
    readDuration(file) {
      return new Promise((resolve) => {
        if (typeof document === "undefined" || typeof URL.createObjectURL !== "function") return resolve(null);
        const url = URL.createObjectURL(file);
        const v = document.createElement("video");
        const done = (d: number | null) => {
          URL.revokeObjectURL(url);
          resolve(d);
        };
        const timer = setTimeout(() => done(null), 20000);
        v.preload = "metadata";
        v.onloadedmetadata = () => {
          clearTimeout(timer);
          done(Number.isFinite(v.duration) ? v.duration : null);
        };
        v.onerror = () => {
          clearTimeout(timer);
          done(null);
        };
        v.src = url;
      });
    },
  };
}
