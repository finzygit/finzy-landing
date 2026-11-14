"use client";

// MOB-1198 (FZW-WEB-11): the app's articles linked to the stock, newest
// first, with title, date and image; opening one shows the summary the app
// shows (blogs.summary, in the dashboard's language). Beside the list on a
// wide screen, in place of it on a phone. No article: the empty state.
import { useEffect, useMemo, useState } from "react";
import { useApp, useLoad } from "@/lib/app";
import { formatDate, type Lang } from "@/lib/format";
import type { Blog, StockHeader } from "@/lib/types";
import { FinzyMark } from "../Logo";
import { Card, EmptyState, ErrorState, Icon, Skeleton } from "../ui";
import { StockFoot } from "../StockFoot";

export function summaryParagraphs(blog: Blog, lang: Lang): string[] {
  const s = blog.summary;
  if (!s || typeof s !== "object") return [];
  const local = s[lang] ?? s.en ?? s.it ?? (s as unknown as Record<string, string>);
  return ["happening", "meaning", "effects", "care"]
    .map((k) => (local as Record<string, unknown>)[k])
    .filter((v): v is string => typeof v === "string" && v.trim() !== "")
    .map((v) => v.trim());
}

function meta(blog: Blog, lang: Lang): string {
  const when = formatDate(blog.created_at, lang, { time: true });
  return [blog.testata?.name, when].filter(Boolean).join(" · ");
}

function Thumb({ url, size = "row" }: { url: string | null; size?: "row" | "hero" }) {
  const box = size === "row" ? "h-[74px] w-[110px] flex-none rounded-tile" : "aspect-[2/1] w-full rounded-tile";
  if (!url) {
    return (
      <span className={`raised flex items-center justify-center text-accent-soft ${box}`} aria-hidden>
        <FinzyMark size={22} />
      </span>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element -- static export: no image optimisation server
  return <img src={url} alt="" className={`${box} object-cover`} loading="lazy" />;
}

function ArticlePanel({ blog, onClose }: { blog: Blog; onClose: () => void }) {
  const { api, t, lang } = useApp();
  const [full, setFull] = useState<Blog | null>(null);
  const [failed, setFailed] = useState(false);
  const listed = summaryParagraphs(blog, lang);
  useEffect(() => {
    if (listed.length > 0) return;
    let alive = true;
    api
      .get<Blog>(`/blogs/${blog.id}`)
      .then((b) => alive && setFull(b))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [api, blog.id, listed.length]);
  const paragraphs = listed.length > 0 ? listed : full ? summaryParagraphs(full, lang) : [];
  return (
    <Card>
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-tiny text-ink-3">{t("news_ai")}</span>
        <button type="button" aria-label={t("close")} onClick={onClose} className="raised inline-flex h-10 w-10 items-center justify-center rounded-full text-ink">
          <Icon name="close" size={18} />
        </button>
      </div>
      <Thumb url={blog.image_url} size="hero" />
      <h3 className="mb-2 mt-4 text-[22px] leading-[28px] font-bold tracking-[-0.01em] text-ink">{blog.title}</h3>
      <p className="m-0 mb-4 text-meta text-ink-3">{meta(blog, lang)}</p>
      {paragraphs.length === 0 && (full || failed) ? (
        <p className="m-0 text-row text-ink-3">{t("na")}</p>
      ) : paragraphs.length === 0 ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      ) : (
        paragraphs.map((p) => (
          <p key={p.slice(0, 32)} className="m-0 mb-4 text-row leading-[22px] text-[rgba(244,247,246,0.86)] last:mb-0">
            {p}
          </p>
        ))
      )}
    </Card>
  );
}

export function NewsTab({ stock }: { stock: StockHeader }) {
  const { api, t, lang } = useApp();
  const [openId, setOpenId] = useState<number | null>(null);
  const load = useLoad(`news:${stock.symbol}:${stock.id ?? ""}`, async () => {
    // The news are linked by the azione id: without it (backend shape to align)
    // this is an error, never «no news».
    if (!stock.id) throw new Error("stock header without id");
    return api.get<Blog[]>("/blogs", { azione: stock.id, limit: 30, lang });
  });
  const blogs = useMemo(
    () => (load.status === "ready" ? [...(load.data ?? [])].sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? "")) : []),
    [load],
  );
  const open = blogs.find((b) => b.id === openId) ?? null;

  let body;
  if (load.status === "loading") {
    body = (
      <Card pad="px-[22px] py-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-4 border-b border-hair py-4 last:border-b-0">
            <Skeleton className="h-[74px] w-[110px] rounded-tile" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-3 w-2/5" />
            </div>
          </div>
        ))}
      </Card>
    );
  } else if (load.status === "error") {
    body = (
      <Card>
        <ErrorState title={t("err_title")} retry={t("retry")} onRetry={load.reload} />
      </Card>
    );
  } else if (blogs.length === 0) {
    body = (
      <Card>
        <EmptyState icon="doc" title={t("news_empty_t")} body={t("news_empty_b")} />
      </Card>
    );
  } else {
    const list = (
      <Card pad="px-2 py-2 sm:px-[10px]">
        <ul className="m-0 flex list-none flex-col p-0">
          {blogs.map((b) => {
            const selected = b.id === openId;
            return (
              <li key={b.id}>
                <button
                  type="button"
                  onClick={() => setOpenId(b.id)}
                  aria-current={selected || undefined}
                  className={`flex w-full items-start gap-3.5 rounded-tile px-2.5 py-3 text-left ${selected ? "bg-[rgba(39,204,216,0.08)] shadow-[inset_3px_0_0_var(--color-accent)]" : ""}`}
                >
                  <Thumb url={b.image_url} />
                  <span className="flex min-w-0 flex-col gap-1.5">
                    <span className="text-row font-[650] leading-[20px] text-ink">{b.title}</span>
                    <span className="text-meta text-ink-3">{meta(b, lang)}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </Card>
    );
    body = open ? (
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <div className="hidden lg:block">{list}</div>
        <ArticlePanel key={open.id} blog={open} onClose={() => setOpenId(null)} />
      </div>
    ) : (
      list
    );
  }
  return (
    <div className="flex flex-col gap-5">
      {body}
      <StockFoot stock={stock} />
    </div>
  );
}
