"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/*
 * QR generato da https://finzyapp.com/download (error correction H, così il
 * badge col logo al centro non compromette la scansione). Per rigenerarlo:
 * npx qrcode -t svg -e H -q 0 "https://finzyapp.com/download"
 */
const QR_VIEWBOX = "0 0 33 33";
const QR_PATH =
  "M0 0.5h7m2 0h1m1 0h1m1 0h1m4 0h2m1 0h2m1 0h1m1 0h7M0 1.5h1m5 0h1m8 0h1m1 0h2m1 0h1m3 0h1m1 0h1m5 0h1M0 2.5h1m1 0h3m1 0h1m1 0h2m1 0h1m1 0h3m2 0h2m1 0h4m1 0h1m1 0h3m1 0h1M0 3.5h1m1 0h3m1 0h1m1 0h1m3 0h3m1 0h1m2 0h3m1 0h2m1 0h1m1 0h3m1 0h1M0 4.5h1m1 0h3m1 0h1m2 0h3m3 0h1m1 0h1m3 0h3m2 0h1m1 0h3m1 0h1M0 5.5h1m5 0h1m2 0h2m2 0h3m2 0h4m2 0h1m1 0h1m5 0h1M0 6.5h7m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h7M9 7.5h1m1 0h2m1 0h1m1 0h2m1 0h1m2 0h2M3 8.5h2m1 0h2m1 0h1m1 0h2m1 0h2m1 0h1m1 0h1m3 0h1m5 0h2M1 9.5h1m2 0h2m2 0h4m1 0h1m1 0h1m3 0h1m2 0h2m1 0h1m1 0h2m1 0h1M1 10.5h1m2 0h1m1 0h1m4 0h2m1 0h3m3 0h2m1 0h1m3 0h1m3 0h2M2 11.5h1m1 0h1m13 0h1m7 0h3m1 0h1m1 0h1M0 12.5h1m5 0h2m2 0h1m1 0h1m5 0h1m2 0h2m3 0h4m2 0h1M2 13.5h3m2 0h1m6 0h4m2 0h4m5 0h1m1 0h1M0 14.5h2m2 0h3m1 0h1m6 0h1m2 0h2m6 0h4M1 15.5h1m1 0h1m1 0h1m1 0h2m2 0h4m1 0h2m2 0h1m3 0h2m1 0h6M1 16.5h1m1 0h1m2 0h2m1 0h2m2 0h1m2 0h1m1 0h2m3 0h1m1 0h5m1 0h1M2 17.5h2m3 0h1m1 0h1m1 0h4m3 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h2m2 0h1M2 18.5h2m1 0h2m2 0h1m1 0h1m3 0h1m1 0h2m1 0h4m4 0h3m1 0h1M2 19.5h1m4 0h1m2 0h3m1 0h2m3 0h1m3 0h3m1 0h6M0 20.5h2m1 0h1m1 0h2m2 0h2m2 0h3m1 0h4m1 0h1m3 0h1m2 0h1m2 0h1M0 21.5h1m3 0h1m2 0h1m2 0h1m4 0h1m1 0h1m3 0h2m1 0h1m1 0h3M0 22.5h1m1 0h6m1 0h1m1 0h3m1 0h1m3 0h2m1 0h2m2 0h3m1 0h3M0 23.5h1m1 0h1m5 0h2m1 0h2m1 0h6m2 0h3m2 0h1m2 0h1m1 0h1M0 24.5h2m1 0h2m1 0h1m3 0h1m1 0h2m4 0h1m1 0h1m2 0h7M8 25.5h1m2 0h1m6 0h2m1 0h1m2 0h1m3 0h2m1 0h1M0 26.5h7m1 0h1m1 0h2m1 0h1m1 0h2m2 0h1m3 0h2m1 0h1m1 0h2M0 27.5h1m5 0h1m3 0h1m1 0h3m1 0h2m1 0h1m1 0h4m3 0h4M0 28.5h1m1 0h3m1 0h1m1 0h3m2 0h3m2 0h1m2 0h9m1 0h1M0 29.5h1m1 0h3m1 0h1m1 0h3m2 0h1m4 0h2m1 0h5m1 0h1m1 0h3M0 30.5h1m1 0h3m1 0h1m2 0h1m1 0h2m1 0h5m1 0h1m1 0h1m1 0h1m3 0h1m1 0h3M0 31.5h1m5 0h1m5 0h4m3 0h1m1 0h1m3 0h1m3 0h4M0 32.5h7m2 0h5m4 0h1m1 0h2m1 0h2m3 0h1";

/**
 * QR fluttuante in basso a destra che punta a /download (smart link che
 * smista su App Store o Google Play). Compare dalla seconda sezione in poi,
 * come la StickyNav; nascosto su mobile dove non si può inquadrare lo schermo.
 */
export function QrDownloadFloat() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const about = document.getElementById("cos-e-finzy");
      if (!about) return;
      setVisible(about.getBoundingClientRect().top < window.innerHeight * 0.6);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      aria-hidden={!visible}
      className={cn(
        "fixed bottom-5 right-5 z-40 hidden flex-col items-center gap-2.5 rounded-2xl border border-white/10 bg-[#0b1520]/95 p-4 shadow-2xl backdrop-blur-md transition-all duration-300 ease-out md:flex",
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-6 opacity-0",
      )}
    >
      <div className="relative">
        <svg
          viewBox={QR_VIEWBOX}
          shapeRendering="crispEdges"
          role="img"
          aria-label="QR code — scarica Finzy"
          className="h-28 w-28"
        >
          <path stroke="var(--primary)" d={QR_PATH} />
        </svg>
        <span className="absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-lg bg-[#0b1520]">
          <Image
            src="/finzy-favicon.png"
            alt=""
            width={28}
            height={28}
            className="h-7 w-7 rounded-md"
          />
        </span>
      </div>
      <p className="text-sm font-semibold text-white">Download Finzy</p>
    </div>
  );
}
