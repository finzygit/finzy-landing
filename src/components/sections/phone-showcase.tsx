"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { cn } from "@/lib/utils";

// Proporzioni iPhone 16 Pro (in unità scena). Spessore reale ≈ 8.25/71.5 di W.
const W = 2.9;
const H = 6.0;
const D = 0.34;
const CORNER = 0.55;
const BEZEL = 0.09; // cornice frontale attorno allo schermo (più sottile)

const START_ANGLE = -1.4; // ~-80°, di taglio (si vede lo spessore)
const FADE_FROM = 0.34; // crossfade splash → home (in progress di scroll)
const FADE_TO = 0.5;

function roundedRectShape(w: number, h: number, r: number) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

/**
 * Vetrina 3D dell'app: iPhone 16 Pro costruito in Three.js (vero solido con
 * spessore reale, telaio nero titanio). Scorrendo la sezione ruota da profilo a
 * fronte; a metà scroll lo schermo passa da splash a home (crossfade). Lo
 * schermo usa MeshBasicMaterial → sempre nitido, indipendente dalle luci.
 * Rispetta reduced-motion (fermo, frontale).
 */
export function PhoneShowcase({ className }: { className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    const host = hostRef.current;
    if (!root || !host) return;

    let disposed = false;
    const clamp = (v: number, a: number, b: number) =>
      Math.min(Math.max(v, a), b);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const width = host.clientWidth || 320;
    const height = host.clientHeight || 620;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 100);
    camera.position.set(0, 0, 12.5);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    host.appendChild(renderer.domElement);

    // Ambiente per i riflessi del titanio.
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    const key = new THREE.DirectionalLight(0xffffff, 1.4);
    key.position.set(3, 5, 6);
    scene.add(key);
    scene.add(new THREE.AmbientLight(0xffffff, 0.35));

    const phone = new THREE.Group();
    scene.add(phone);

    // Corpo: rounded-rect estruso con bordi smussati.
    const bodyGeo = new THREE.ExtrudeGeometry(roundedRectShape(W, H, CORNER), {
      depth: D,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelSegments: 4,
      curveSegments: 24,
    });
    bodyGeo.center();
    bodyGeo.computeBoundingBox();
    const frontZ = bodyGeo.boundingBox!.max.z; // Z reale della faccia frontale
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x1b1b1e,
      metalness: 0.95,
      roughness: 0.32,
      emissive: new THREE.Color(0x151518), // fill scuro uniforme da frontale
      emissiveIntensity: 0,
    });
    phone.add(new THREE.Mesh(bodyGeo, bodyMat));

    // Schermo: due layer (splash + home) per il crossfade. Texture con angoli
    // trasparenti (niente rettangolo nero), colore bianco (texture a piena luce).
    const Ws = W - 2 * BEZEL;
    const Hs = H - 2 * BEZEL;
    const screenGeo = new THREE.PlaneGeometry(Ws, Hs);
    const makeScreenMat = () =>
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        toneMapped: false,
        side: THREE.DoubleSide,
        transparent: true,
        depthWrite: false,
      });
    const splashMat = makeScreenMat();
    const homeMat = makeScreenMat();
    homeMat.opacity = 0;
    const screenSplash = new THREE.Mesh(screenGeo, splashMat);
    screenSplash.position.z = frontZ + 0.03;
    screenSplash.renderOrder = 2;
    const screenHome = new THREE.Mesh(screenGeo, homeMat);
    screenHome.position.z = frontZ + 0.032;
    screenHome.renderOrder = 3;
    phone.add(screenSplash, screenHome);

    // Dynamic Island.
    const islandGeo = new THREE.ShapeGeometry(roundedRectShape(0.8, 0.24, 0.12));
    const islandMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      toneMapped: false,
      side: THREE.DoubleSide,
    });
    const island = new THREE.Mesh(islandGeo, islandMat);
    // Allineata alla status bar dello screenshot (orario/batteria).
    island.position.set(0, Hs / 2 - 0.16, frontZ + 0.05);
    island.renderOrder = 3;
    phone.add(island);

    const maxAniso = renderer.capabilities.getMaxAnisotropy();

    // Ritaglia lo screenshot con angoli arrotondati (angoli NERI = come il
    // telaio), texture opaca → sempre visibile e ben incastonata nel frame.
    const makeScreenTexture = (img: HTMLImageElement) => {
      const iw = img.naturalWidth || img.width;
      const ih = img.naturalHeight || img.height;
      const cv = document.createElement("canvas");
      cv.width = iw;
      cv.height = ih;
      const ctx = cv.getContext("2d")!;
      // canvas trasparente: fuori dal ritaglio arrotondato resta trasparente
      // (niente rettangolo nero che sporge oltre il telaio).
      const r = iw * ((CORNER - BEZEL) / Ws); // raggio concentrico al telaio
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(r, 0);
      ctx.arcTo(iw, 0, iw, ih, r);
      ctx.arcTo(iw, ih, 0, ih, r);
      ctx.arcTo(0, ih, 0, 0, r);
      ctx.arcTo(0, 0, iw, 0, r);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, 0, 0, iw, ih);
      ctx.restore();
      const tex = new THREE.CanvasTexture(cv);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = maxAniso;
      return tex;
    };

    const loader = new THREE.TextureLoader();
    let splashTex: THREE.Texture | null = null;
    let homeTex: THREE.Texture | null = null;

    Promise.all([
      loader.loadAsync("/splash-screen.png"),
      loader.loadAsync("/home-screen.png"),
    ])
      .then(([s, h]) => {
        if (disposed) {
          s.dispose();
          h.dispose();
          return;
        }
        splashTex = makeScreenTexture(s.image as HTMLImageElement);
        homeTex = makeScreenTexture(h.image as HTMLImageElement);
        s.dispose();
        h.dispose();
        splashMat.map = splashTex;
        splashMat.needsUpdate = true;
        homeMat.map = homeTex;
        homeMat.needsUpdate = true;
        setReady(true);
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error("[PhoneShowcase] texture non caricate:", err);
        setReady(true);
      });

    // --- Scroll → rotazione + crossfade schermata ---
    let targetRot = START_ANGLE;
    let curRot = START_ANGLE;
    let targetFade = 0;
    let curFade = 0;
    let inView = true;

    const readScroll = () => {
      const rect = root.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = clamp((vh - rect.top) / (vh + rect.height), 0, 1);

      if (reduce) {
        targetRot = 0;
        targetFade = 1; // reduced-motion: mostra direttamente la home
        return;
      }

      // Rotazione completata presto (entro ~p 0.30): così quando il telefono è
      // centrato/visibile è già perfettamente frontale (0°) e resta matte.
      const rotP = clamp((p - 0.08) / 0.22, 0, 1);
      const eased = 1 - Math.pow(1 - rotP, 3);
      targetRot = START_ANGLE * (1 - eased);

      // Crossfade splash → home (smoothstep sul progress di scroll).
      const f = clamp((p - FADE_FROM) / (FADE_TO - FADE_FROM), 0, 1);
      targetFade = f * f * (3 - 2 * f);
    };

    const io = new IntersectionObserver(
      ([e]) => {
        inView = e.isIntersecting;
      },
      { rootMargin: "100px" },
    );
    io.observe(host);

    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!inView) return;
      curRot += (targetRot - curRot) * 0.12;
      curFade += (targetFade - curFade) * 0.12;
      phone.rotation.y = curRot;
      splashMat.opacity = 1 - curFade;
      homeMat.opacity = curFade;

      // Frontale (curRot→0): telaio matte UNIFORME via emissive, con riflessi e
      // luce direzionale azzerati (erano loro a creare il gradiente chiaro→scuro).
      // Di taglio: emissive off + riflessi pieni → metallico 3D.
      // Zona matte ampia attorno al frontale (fino a ~20°): il telaio diventa un
      // dielettrico opaco (metalness bassa + roughness alta) con riflessi e luce
      // azzerati → nessuno speculare/gradiente. Oltre, torna metallico e 3D.
      const rotated = clamp((Math.abs(curRot) - 0.35) / 0.6, 0, 1);
      bodyMat.emissiveIntensity = 1 - rotated;
      bodyMat.envMapIntensity = rotated;
      bodyMat.metalness = 0.15 + rotated * 0.8;
      bodyMat.roughness = 0.9 - rotated * 0.55;
      key.intensity = rotated * 1.4;

      renderer.render(scene, camera);
    };

    const onScroll = () => readScroll();
    const onResize = () => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    readScroll();
    tick();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      bodyGeo.dispose();
      bodyMat.dispose();
      screenGeo.dispose();
      splashMat.dispose();
      homeMat.dispose();
      splashTex?.dispose();
      homeTex?.dispose();
      islandGeo.dispose();
      islandMat.dispose();
      scene.environment?.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className={cn("relative flex justify-center py-6", className)}
    >
      {/* alone luminoso dietro */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.06] blur-[90px]"
      />

      {/* Canvas 3D (fade-in quando pronto) */}
      <div
        ref={hostRef}
        className={cn(
          "relative z-10 h-[560px] w-[280px] transition-opacity duration-700 sm:h-[620px] sm:w-[320px]",
          ready ? "opacity-100" : "opacity-0",
        )}
      />

      {/* Fallback statico finché le texture non sono pronte */}
      <div
        aria-hidden={ready}
        className={cn(
          "absolute left-1/2 top-1/2 z-0 h-[540px] w-[262px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[2.4rem] border-[6px] border-[#0c0c0d] bg-black transition-opacity duration-700",
          ready ? "opacity-0" : "opacity-100",
        )}
      >
        <Image
          src="/splash-screen.png"
          alt="Finzy — splash screen"
          fill
          sizes="262px"
          className="object-cover"
        />
      </div>
    </div>
  );
}
