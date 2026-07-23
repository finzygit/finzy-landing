import { cn } from "@/lib/utils";

function AppleGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 384 512" fill="currentColor" aria-hidden className={className}>
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
  );
}

function GooglePlayGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <defs>
        <linearGradient id="finzy-gplay" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#00c3ff" />
          <stop offset="0.4" stopColor="#00e676" />
          <stop offset="0.72" stopColor="#ffce00" />
          <stop offset="1" stopColor="#ff3b44" />
        </linearGradient>
      </defs>
      <path
        fill="url(#finzy-gplay)"
        d="M4 3.5c0-.9.97-1.46 1.74-1L20 11c.77.44.77 1.56 0 2L5.74 21.5C4.97 21.96 4 21.4 4 20.5V3.5z"
      />
    </svg>
  );
}

/**
 * Bottoni di download App Store / Google Play.
 * href placeholder (#): sostituire con i link reali quando disponibili.
 * Per badge ufficiali 1:1 basta mettere gli asset in /public e swappare.
 */
export function StoreButtons({ className }: { className?: string }) {
  const base =
    "group inline-flex items-center gap-3 rounded-xl border border-white/15 bg-black px-5 py-2.5 transition-colors hover:border-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div
      className={cn("flex flex-wrap items-center justify-center gap-3", className)}
    >
      <a href="#" aria-label="Scarica su App Store" className={base}>
        <AppleGlyph className="h-7 w-7 text-white" />
        <span className="flex flex-col gap-0.5 text-left leading-none">
          <span className="text-[0.65rem] text-white/70">Download on the</span>
          <span className="text-lg font-semibold text-white">App Store</span>
        </span>
      </a>

      <a href="#" aria-label="Scarica su Google Play" className={base}>
        <GooglePlayGlyph className="h-6 w-6" />
        <span className="flex flex-col gap-0.5 text-left leading-none">
          <span className="text-[0.65rem] uppercase tracking-wide text-white/70">
            Get it on
          </span>
          <span className="text-lg font-semibold text-white">Google Play</span>
        </span>
      </a>
    </div>
  );
}
