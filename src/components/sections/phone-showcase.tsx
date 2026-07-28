"use client";

import { createElement, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

// Modello 3D dell'iPhone 16 Pro (da mettere in public/models/).
const MODEL_SRC = "/models/iphone-16-pro.glb";

// Nomi di materiale "schermo" da cercare nel modello per proiettarci gli screenshot.
const SCREEN_MATERIAL_HINTS = ["screen", "display", "wallpaper", "glass", "lcd"];

// Camera: da ~profilo (theta alto) a fronte (0°). PHI = elevazione (90 = frontale).
const THETA_START = 78;
const THETA_END = 0;
const PHI = 82;

type ScreenMaterial = {
  name: string;
  pbrMetallicRoughness: {
    baseColorTexture?: { setTexture: (t: unknown) => void };
  };
  setEmissiveFactor?: (rgb: [number, number, number]) => void;
};

type MVElement = HTMLElement & {
  model?: { materials: ScreenMaterial[] };
  createTexture?: (url: string) => Promise<unknown>;
};

/**
 * Vetrina 3D dell'app: un iPhone 16 Pro reale (modello .glb via <model-viewer>)
 * che ruota da profilo a fronte mentre scorri la sezione, mostrando prima la
 * splash e poi la home (texture dello schermo scambiata a metà scroll). Finché
 * il .glb non è caricato mostra un fallback statico. Reduced-motion: fermo.
 */
export function PhoneShowcase({ className }: { className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const mvRef = useRef<MVElement | null>(null);
  const screenMatRef = useRef<ScreenMaterial | null>(null);
  const currentTexRef = useRef<"splash" | "home" | null>(null);
  const [modelLoaded, setModelLoaded] = useState(false);

  // Registra il web component (solo lato client).
  useEffect(() => {
    import("@google/model-viewer").catch(() => {});
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const mv = mvRef.current;
    if (!root || !mv) return;

    const clamp = (v: number, a: number, b: number) =>
      Math.min(Math.max(v, a), b);

    const applyScreen = async (which: "splash" | "home") => {
      if (!mv.model || !mv.createTexture) return;
      if (currentTexRef.current === which) return;

      if (!screenMatRef.current) {
        const mats = mv.model.materials;
        // Nomi materiali in console: utile per capire quale è lo schermo.
        // eslint-disable-next-line no-console
        console.log(
          "[PhoneShowcase] materiali:",
          mats.map((m) => m.name),
        );
        screenMatRef.current =
          mats.find((m) =>
            SCREEN_MATERIAL_HINTS.some((h) => m.name.toLowerCase().includes(h)),
          ) ?? null;
      }
      const mat = screenMatRef.current;
      if (!mat) return;

      currentTexRef.current = which;
      const url = which === "splash" ? "/splash-screen.png" : "/home-screen.png";
      const tex = await mv.createTexture(url);
      mat.pbrMetallicRoughness.baseColorTexture?.setTexture(tex);
      mat.setEmissiveFactor?.([1, 1, 1]);
    };

    const onModelLoad = () => {
      setModelLoaded(true);
      applyScreen("splash");
    };
    mv.addEventListener("load", onModelLoad);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = root.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = clamp((vh - rect.top) / (vh + rect.height), 0, 1);

      const rotP = reduce ? 1 : clamp((p - 0.12) / 0.38, 0, 1);
      const eased = 1 - Math.pow(1 - rotP, 3);
      const theta = THETA_START + eased * (THETA_END - THETA_START);
      mv.setAttribute("camera-orbit", `${theta}deg ${PHI}deg auto`);

      applyScreen(p > 0.62 ? "home" : "splash");
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      mv.removeEventListener("load", onModelLoad);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const modelViewer = createElement("model-viewer" as unknown as string, {
    ref: mvRef,
    src: MODEL_SRC,
    alt: "iPhone 16 Pro con l'app Finzy",
    "interaction-prompt": "none",
    exposure: "1.15",
    "shadow-intensity": "0.9",
    "shadow-softness": "1",
    "environment-image": "neutral",
    "camera-orbit": `${THETA_START}deg ${PHI}deg auto`,
    "field-of-view": "26deg",
    style: {
      position: "absolute",
      left: "50%",
      top: "50%",
      width: "min(340px, 82vw)",
      height: "620px",
      transform: "translate(-50%, -50%)",
      backgroundColor: "transparent",
      opacity: modelLoaded ? 1 : 0,
      transition: "opacity 0.5s ease",
    },
  });

  return (
    <div
      ref={rootRef}
      className={cn("relative flex justify-center py-6", className)}
    >
      {/* alone luminoso dietro */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[90px]"
      />

      {/* Fallback statico finché il modello 3D non è caricato */}
      <div
        aria-hidden={modelLoaded}
        className={cn(
          "relative z-0 h-[560px] w-[272px] overflow-hidden rounded-[2.6rem] border-[6px] border-[#0c0c0d] bg-black shadow-2xl transition-opacity duration-500",
          modelLoaded ? "opacity-0" : "opacity-100",
        )}
      >
        <Image
          src="/splash-screen.png"
          alt="Finzy — splash screen"
          fill
          sizes="272px"
          className="object-cover"
        />
      </div>

      {modelViewer}
    </div>
  );
}
