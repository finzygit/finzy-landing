# finzy — landing page

Landing page di **finzy**, costruita con Next.js.

## Stack

- **Next.js 16** (App Router + Turbopack)
- **React 19**
- **TypeScript**
- **Tailwind CSS v4** (design tokens in `src/app/globals.css`)
- **lucide-react** per le icone
- `cn()` helper (`clsx` + `tailwind-merge`) in `src/lib/utils.ts`

## Comandi

```bash
pnpm dev      # avvia il dev server su http://localhost:3000
pnpm build    # build di produzione
pnpm start    # avvia la build di produzione
pnpm lint     # eslint
```

## Struttura

```
src/
├── app/
│   ├── globals.css      # design tokens (colori, radius) + reset
│   ├── layout.tsx       # root layout, font, metadata SEO
│   └── page.tsx         # home: qui si compongono le sezioni
├── components/
│   ├── layout/          # header, footer, nav
│   ├── sections/        # sezioni della landing (hero, features, ...)
│   └── ui/              # primitive riutilizzabili (Container, Button, ...)
└── lib/
    └── utils.ts         # cn() e utility condivise
```

## Design tokens

I colori di brand sono definiti come CSS variables in `src/app/globals.css`
(`--primary`, `--accent`, `--muted`, ...) e mappati su utility Tailwind
(`bg-primary`, `text-muted-foreground`, ...). Sono valori placeholder:
vanno sostituiti con i colori ufficiali di finzy.

## Ticker di mercato

Il ticker in testata mostra le quotazioni reali del DB dell'app. Le legge
`src/lib/ticker.ts` dall'API pubblica del backend, `/api/aziones`, e le pagine
si rigenerano ogni 5 minuti. Se l'API non risponde il ticker sparisce e il sito
resta online.

La lista degli strumenti è configurazione. Senza impostazioni valgono i venti
titoli di `DEFAULT_INSTRUMENTS`. Per cambiarla imposta la variabile d'ambiente
`TICKER_INSTRUMENTS` su Vercel e rilancia il deploy, senza toccare il codice.

```bash
TICKER_INSTRUMENTS="NVDA:Nvidia,AAPL:Apple,MC.PA:LVMH"
```

Ogni voce è `SIMBOLO:Nome`, nell'ordine in cui scorre. Il simbolo è quello del
catalogo dell'app. Il nome è facoltativo, se manca il ticker usa quello del
catalogo.

## Come procediamo

La landing si costruisce una sezione alla volta. Ogni nuova sezione vive in
`src/components/sections/` e viene composta dentro `src/app/page.tsx`.
