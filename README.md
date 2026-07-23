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

## Come procediamo

La landing si costruisce una sezione alla volta. Ogni nuova sezione vive in
`src/components/sections/` e viene composta dentro `src/app/page.tsx`.
