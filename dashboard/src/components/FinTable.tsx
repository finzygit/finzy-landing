"use client";

// MOB-1198 (FZW-WEB-07): web_fin_table. The only thing on the dashboard that
// scrolls sideways: labels frozen on the left, years to the right, the next
// column half visible with a fade and a round arrow (design decision 7).
// Totals bold, items indented grey, a missing value is a dash. Negative
// figures stay white with the minus: red is only for falls.
import { useEffect, useRef, useState } from "react";
import { Icon } from "./ui";

export type FinRow = { key: string; label: string; kind: "total" | "sub" | "plain"; cells: (string | null)[] };

export function FinTable({ columns, rows, nextLabel }: { columns: string[]; rows: FinRow[]; nextLabel: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [more, setMore] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setMore(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [columns, rows]);

  const step = () => {
    const el = ref.current;
    if (!el) return;
    const col = el.querySelector<HTMLElement>("th[data-col]");
    el.scrollBy({ left: (col?.offsetWidth ?? 110) * 2, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <div ref={ref} className="scroll-x -mx-1 px-1" data-testid="fin-scroll">
        <table className="tnum w-max min-w-full border-separate border-spacing-0 text-right">
          <thead>
            <tr>
              <th className="sticky left-0 z-[2] min-w-[120px] max-w-[120px] bg-[#0f1617] pb-3 sm:min-w-[260px] sm:max-w-[260px]" />
              {columns.map((c, i) => (
                <th key={`${i}-${c}`} data-col className="min-w-[80px] border-b-2 border-[rgba(255,255,255,0.12)] px-2 pb-3 text-meta font-semibold whitespace-nowrap text-ink-2 sm:min-w-[118px] sm:px-0 sm:pr-2">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key}>
                <th
                  scope="row"
                  className={`sticky left-0 z-[1] min-w-[120px] max-w-[120px] border-b bg-[#0f1617] py-2.5 pr-3 text-left sm:min-w-[260px] sm:max-w-[260px] ${
                    r.kind === "total" ? "border-[rgba(255,255,255,0.12)] text-label font-bold text-ink sm:text-row" : r.kind === "sub" ? "border-hair pl-4 text-meta font-normal text-ink-2 sm:text-label" : "border-hair text-label font-normal text-ink"
                  }`}
                >
                  <span className="line-clamp-2">{r.label}</span>
                </th>
                {r.cells.map((v, i) => (
                  <td
                    key={i}
                    className={`border-b px-2 py-2.5 whitespace-nowrap sm:px-0 sm:pr-2 ${r.kind === "total" ? "border-[rgba(255,255,255,0.12)] text-label font-bold text-ink sm:text-row" : r.kind === "sub" ? "border-hair text-label text-ink-2" : "border-hair text-label text-ink"}`}
                  >
                    {v ?? <span className="text-ink-3">—</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {more && (
        <>
          <span aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-14 bg-[linear-gradient(90deg,rgba(13,19,20,0),rgba(13,19,20,0.92))]" />
          <button
            type="button"
            onClick={step}
            aria-label={nextLabel}
            className="raised absolute right-1 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-ink shadow-[0_6px_18px_rgba(0,0,0,0.45)]"
          >
            <Icon name="chevron_right" size={18} />
          </button>
        </>
      )}
    </div>
  );
}
