"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { cn } from "@/lib/utils";

// Proporzioni iPhone (unità scena), come il vecchio PhoneShowcase.
const W = 2.9;
const H = 6.0;
const D = 0.34;
const CORNER = 0.55;
const BEZEL = 0.09;

// Rotazione in profondità (terzo asse): fianco della scocca ben visibile.
const DEPTH_ANGLE = 0.56; // ~32°

// Corsa: margine dai bordi della sezione a inizio/fine scroll.
const PAD = 28;
// Solleva i telefoni rispetto alla corsa base (stanno più in alto nella sezione).
const LIFT = 160;
// Smorzamento del movimento (lerp per frame): 1 = istantaneo.
const EASE = 0.1;

type Phone = {
  src: string;
  side: "left" | "right";
  /** Rotazione a V nel piano (il 3D vero è nel canvas). */
  spin: string;
  /** Verso della rotazione in profondità: schermo girato verso il centro. */
  depth: number;
};

const PHONES: Phone[] = [
  { src: "/splash-screen.png", side: "left", spin: "rotateZ(-62deg)", depth: DEPTH_ANGLE },
  { src: "/home-screen.png", side: "right", spin: "rotateZ(62deg)", depth: -DEPTH_ANGLE },
];

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
 * Due iPhone 3D (Three.js: scocca estrusa con spessore reale, titanio
 * riflettente) ai lati della sezione, tra sfondo e contenuto, disposti a V
 * e ruotati in profondità così da mostrare il fianco. La scena è statica:
 * si renderizza una volta sola (niente rAF di rendering); la parallasse
 * lungo la sezione è un transform CSS sul wrapper, con smorzamento.
 * Reduced-motion: fermi a metà sezione. Sotto lg sono più piccoli e
 * spuntano tagliati dagli angoli in alto, ai lati del titolo.
 */
export function PhoneParallax({ className }: { className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const phoneRefs = useRef<(HTMLDivElement | null)[]>([]);
  const hostRefs = useRef<(HTMLDivElement | null)[]>([]);

  // --- Scene 3D statiche, una per telefono ---
  useEffect(() => {
    let disposed = false;
    const cleanups: (() => void)[] = [];

    PHONES.forEach((phone, i) => {
      const host = hostRefs.current[i];
      if (!host) return;

      const width = host.clientWidth || 185;
      const height = host.clientHeight || 400;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 100);
      camera.position.set(0, 0, 12.5);

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;
      host.appendChild(renderer.domElement);

      // Ambiente per i riflessi del titanio sul fianco.
      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      pmrem.dispose();

      const key = new THREE.DirectionalLight(0xffffff, 1.4);
      key.position.set(3, 5, 6);
      scene.add(key);
      scene.add(new THREE.AmbientLight(0xffffff, 0.35));

      const group = new THREE.Group();
      group.rotation.y = phone.depth;
      group.rotation.x = 0.07;
      scene.add(group);

      // Corpo: rounded-rect estruso con spessore reale e bordi smussati.
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
      const frontZ = bodyGeo.boundingBox!.max.z;
      const bodyMat = new THREE.MeshStandardMaterial({
        color: 0x1b1b1e,
        metalness: 0.9,
        roughness: 0.32,
      });
      group.add(new THREE.Mesh(bodyGeo, bodyMat));

      // Schermo con lo screenshot, angoli ritagliati concentrici al telaio.
      const Ws = W - 2 * BEZEL;
      const Hs = H - 2 * BEZEL;
      const screenGeo = new THREE.PlaneGeometry(Ws, Hs);
      const screenMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        toneMapped: false,
        transparent: true,
        depthWrite: false,
      });
      const screen = new THREE.Mesh(screenGeo, screenMat);
      screen.position.z = frontZ + 0.03;
      screen.renderOrder = 2;
      group.add(screen);

      // Dynamic Island.
      const islandGeo = new THREE.ShapeGeometry(roundedRectShape(0.8, 0.24, 0.12));
      const islandMat = new THREE.MeshBasicMaterial({
        color: 0x000000,
        toneMapped: false,
      });
      const island = new THREE.Mesh(islandGeo, islandMat);
      island.position.set(0, Hs / 2 - 0.16, frontZ + 0.05);
      island.renderOrder = 3;
      group.add(island);

      const render = () => {
        if (!disposed) renderer.render(scene, camera);
      };
      render(); // primo frame: scocca visibile anche prima della texture

      // Al cambio di dimensioni del wrapper (breakpoint/orientamento):
      // riallinea canvas e camera e ridisegna il frame statico.
      const onResize = () => {
        const w = host.clientWidth;
        const h = host.clientHeight;
        if (!w || !h) return;
        const size = renderer.getSize(new THREE.Vector2());
        if (size.x === w && size.y === h) return;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        render();
      };
      window.addEventListener("resize", onResize);

      // Texture dello schermo: ritaglio arrotondato + velo scuro (leggibilità
      // del testo davanti) direttamente in canvas.
      let screenTex: THREE.CanvasTexture | null = null;
      new THREE.TextureLoader()
        .loadAsync(phone.src)
        .then((tex) => {
          const img = tex.image as HTMLImageElement;
          const iw = img.naturalWidth || img.width;
          const ih = img.naturalHeight || img.height;
          const cv = document.createElement("canvas");
          cv.width = iw;
          cv.height = ih;
          const ctx = cv.getContext("2d")!;
          const r = iw * ((CORNER - BEZEL) / Ws);
          ctx.beginPath();
          ctx.moveTo(r, 0);
          ctx.arcTo(iw, 0, iw, ih, r);
          ctx.arcTo(iw, ih, 0, ih, r);
          ctx.arcTo(0, ih, 0, 0, r);
          ctx.arcTo(0, 0, iw, 0, r);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(img, 0, 0, iw, ih);
          ctx.fillStyle = "rgba(0,0,0,0.25)";
          ctx.fillRect(0, 0, iw, ih);
          tex.dispose();
          if (disposed) return;
          screenTex = new THREE.CanvasTexture(cv);
          screenTex.colorSpace = THREE.SRGBColorSpace;
          screenTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
          screenMat.map = screenTex;
          screenMat.needsUpdate = true;
          render();
        })
        .catch((err) => {
          console.error("[PhoneParallax] texture non caricata:", err);
        });

      cleanups.push(() => {
        window.removeEventListener("resize", onResize);
        bodyGeo.dispose();
        bodyMat.dispose();
        screenGeo.dispose();
        screenMat.dispose();
        screenTex?.dispose();
        islandGeo.dispose();
        islandMat.dispose();
        scene.environment?.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      });
    });

    return () => {
      disposed = true;
      cleanups.forEach((fn) => fn());
    };
  }, []);

  // --- Parallasse: trasla i wrapper lungo la sezione con lo scroll ---
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const clamp = (v: number, a: number, b: number) =>
      Math.min(Math.max(v, a), b);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const apply = (el: HTMLElement, y: number, spin: string) => {
      el.style.transform = `translateY(${y}px) ${spin}`;
    };

    // Reduced motion: telefoni fermi a metà sezione, nessun listener.
    if (reduce) {
      const rect = root.getBoundingClientRect();
      PHONES.forEach((p, i) => {
        const el = phoneRefs.current[i];
        if (el) apply(el, (rect.height - el.offsetHeight) / 2 - LIFT, p.spin);
      });
      return;
    }

    let target = 0;
    let current = -1; // ≠ target: forza il primo paint
    let inView = true;
    let raf = 0;

    const readScroll = () => {
      const rect = root.getBoundingClientRect();
      const vh = window.innerHeight;
      // Avanzamento della sezione nel viewport: 0 quando entra dal basso,
      // 1 quando il suo fondo raggiunge la cima → i telefoni percorrono
      // tutta la sezione e si fermano alla sua fine.
      target = clamp((vh - rect.top) / (vh + rect.height), 0, 1);
    };

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!inView || Math.abs(target - current) < 0.0005) return;
      current += (target - current) * EASE;
      const height = root.clientHeight;
      PHONES.forEach((p, i) => {
        const el = phoneRefs.current[i];
        if (!el) return;
        const travel = Math.max(height - el.offsetHeight - PAD * 2, 0);
        apply(el, PAD - LIFT + current * travel, p.spin);
      });
    };

    const io = new IntersectionObserver(
      ([e]) => {
        inView = e.isIntersecting;
      },
      { rootMargin: "120px" },
    );
    io.observe(root);

    readScroll();
    current = target - 0.001; // primo frame subito coerente con lo scroll
    tick();
    window.addEventListener("scroll", readScroll, { passive: true });
    window.addEventListener("resize", readScroll);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("scroll", readScroll);
      window.removeEventListener("resize", readScroll);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 z-0 overflow-hidden",
        className,
      )}
    >
      {PHONES.map((phone, i) => (
        <div
          key={phone.src}
          ref={(el) => {
            phoneRefs.current[i] = el;
          }}
          className={cn(
            "absolute top-0 h-[230px] w-[115px] will-change-transform sm:h-[300px] sm:w-[150px] lg:h-[400px] lg:w-[210px]",
            phone.side === "left"
              ? "left-[-18%] sm:left-[-6%] lg:left-[11%] xl:left-[15%]"
              : "right-[-18%] sm:right-[-6%] lg:right-[11%] xl:right-[15%]",
          )}
        >
          {/* Canvas 3D: scocca con spessore reale, render statico */}
          <div
            ref={(el) => {
              hostRefs.current[i] = el;
            }}
            className="h-full w-full"
          />
        </div>
      ))}
    </div>
  );
}
