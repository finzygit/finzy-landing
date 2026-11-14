import Image from "next/image";
import type { ReactNode } from "react";

/**
 * I fornitori di notizie di Finzy, che scorrono in continuo come il ticker di
 * mercato. Solo i tre veri (MOB-958, decisione D414): MT Newswires e Adnkronos
 * con il loro logo, Benzinga con il wordmark (non abbiamo il file del logo).
 * I loghi sono colorati con testo scuro: sul nero diventano sagome bianche
 * (brightness-0 invert) con la stessa opacità dei wordmark.
 */
type Brand =
  | { key: string; node: ReactNode }
  | {
      key: string;
      logo: { src: string; alt: string; width: number; height: number; className: string };
    };

const BRANDS: Brand[] = [
  {
    key: "benzinga",
    node: (
      <span className="font-sans font-extrabold lowercase tracking-tight">
        benzinga
      </span>
    ),
  },
  {
    key: "mt-newswires",
    logo: {
      src: "/mtnews-logo.webp",
      alt: "MT Newswires",
      // Misura mostrata da sm in su (h-11): next/image non scarica il file
      // da 2878 px per un logo largo circa 300 px.
      width: 297,
      height: 44,
      className: "h-9 sm:h-11",
    },
  },
  {
    key: "adnkronos",
    logo: {
      src: "/adnkronos-logo.webp",
      alt: "Adnkronos",
      width: 199,
      height: 56,
      className: "h-11 sm:h-14",
    },
  },
];

// Con tre soli nomi una copia è più stretta di uno schermo largo: ogni metà
// della fascia ripete i nomi tre volte, così lo scorrimento (-50%) non lascia
// mai un buco a destra. Lo spazio tra i nomi è un padding a destra di ogni
// nome, non un gap della riga: così ogni metà è esattamente il 50% e il giro
// riparte senza scatto.
const HALF = [...BRANDS, ...BRANDS, ...BRANDS];

export function Sources() {
  return (
    <section
      id="fonti"
      className="relative overflow-hidden bg-background py-16 sm:py-20"
    >
      {/* Fascia scorrevole dei fornitori (a tutta larghezza, con dissolvenza ai bordi) */}
      <div className="w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_7%,black_93%,transparent)]">
        <div className="flex w-max animate-marquee items-center text-5xl text-white/55 sm:text-6xl">
          {[...HALF, ...HALF].map((b, i) => {
            const hidden = i >= BRANDS.length;
            return (
              <span
                key={`${b.key}-${i}`}
                aria-hidden={hidden}
                className="group whitespace-nowrap pr-12 leading-none transition-colors duration-200 hover:text-white/80 sm:pr-32"
              >
                {"logo" in b ? (
                  <Image
                    src={b.logo.src}
                    alt={hidden ? "" : b.logo.alt}
                    width={b.logo.width}
                    height={b.logo.height}
                    className={`${b.logo.className} w-auto brightness-0 invert opacity-55 transition-opacity duration-200 group-hover:opacity-80`}
                  />
                ) : (
                  b.node
                )}
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
}
