# Finzy web dashboard (MOB-1198, FZW-WEB)

The dashboard for Unlimited users on **app.finzyapp.com** (staging: staging.app.finzyapp.com).
A separate Next.js 16 app inside the landing repo, with its own `package.json` and lockfile.
The site (`finzyapp.com`) does not build, lint, type-check or style it: see
`src/lib/dashboard-isolation.test.ts` at the repo root.

- Static export (`output: "export"`): `pnpm build` writes `out/`. No Node on the server.
- Same origin as the API: nginx serves `out/` and forwards `/api` to the Laravel backend,
  so the session cookies (`__Host-finzy_web*`, httpOnly) work with no CORS.
- Dark only. Design: boards `EVO-WEB-01…17` and `Kit-W-1/2` (app repo, branch
  `design/evo-evo-web`, `design/v2/evo_evo-web.py`). FZW-PRO (boards 18–21) is not here yet.

## Commands

From the repo root:

| Command | What it does |
|---|---|
| `pnpm dashboard:test` | installs the dashboard's deps (offline when cached) and runs its unit and component tests (also part of the root `pnpm test`) |
| `pnpm dashboard:check` | tests, `tsc --noEmit`, eslint and the static build |
| `pnpm dashboard:build` | the static build only (`dashboard/out/`) |

Inside `dashboard/`: `pnpm dev` (port 3100; it rewrites the repo's `AGENTS.md`: never commit
that), `pnpm test`, `pnpm check`, and `pnpm build && pnpm test:layout` for the Playwright
layout checks and screenshots (`SHOTS=<dir>` saves them). Playwright 1.63 is pinned because its
Chromium is already in the Mac's cache: nothing is installed machine-wide.

Every API call in tests is mocked (`src/test/setup.ts` fails any fetch a test did not mock;
`e2e/mock-api.ts` answers `/api` in the browser checks).

## Configuration

Firebase web config for «Accedi con Google / Apple»: copy `.env.example` to `.env.local`
before the build and fill it in (public values, but kept out of git). Without it the two
buttons are hidden and email/password still works.

## Texts

`src/lib/texts-evo-web.ts` is generated from the boards' texts table:
`node scripts/texts-from-md.mjs <app repo>/design/v2/EVO-WEB.md`. The few texts that are not
in that table are in `src/lib/texts-extra.ts` and `src/lib/labels.ts`, each marked «board»,
«ARB» or «new» (new ones wait for Victor's OK, D385).

## Routes

| Path | Page | Who |
|---|---|---|
| `/accedi` | sign-in (`?reset=1` after a password reset, `?next=` to come back) | visitors |
| `/password` | reset with the 4-digit code | visitors |
| `/riservata` | page reserved to Unlimited (`?scaduto=1` when a plan lapsed mid-session) | signed in, not Unlimited |
| `/` | search | Unlimited |
| `/titolo?s=NVDA&tab=summary` | stock (tabs `summary`, `profilo`, `statistiche`, `punteggi`, `finanza`, `notizie`, `report`) | Unlimited |
| `/osservati` | watchlist | Unlimited |

The stock is a query parameter, not a path segment, so the export has a single
`titolo.html` for every stock.

## nginx (server, done by Victor; never by a lane)

```nginx
server {
    server_name app.finzyapp.com;            # staging: staging.app.finzyapp.com
    root /var/www/html/dashboard/out;        # the uploaded out/ folder
    index index.html;

    add_header X-Robots-Tag "noindex, nofollow" always;
    # + the security headers of the console block (MOB-625) and the same limit_req as console

    location / {
        try_files $uri $uri.html =404;
    }
    error_page 404 /404.html;

    # /api goes to the same Laravel as console (staging: /var/www/html/staging and its socket).
    location /api {
        root /var/www/html/server/public;
        try_files $uri /index.php$is_args$args;
    }
    location = /index.php {
        root /var/www/html/server/public;
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;   # copy the console block's pool
    }
}
```

A sketch to check against the live console block before use (paths, socket, headers).

`try_files $uri $uri.html =404` serves `/titolo` from `titolo.html` (one file for every stock)
and an unknown path with the dashboard's own 404 page (`404.html`).

## Store buttons

The reserved page shows text buttons for App Store and Google Play, not the official badges:
both badges must be downloaded from Apple's and Google's own badge generators, and Google's
requires its trademark line («Google Play and the Google Play logo are trademarks of
Google LLC.») next to it, which is a new text to approve. To switch to the badges: put the two
SVGs in `public/`, add the line, and swap `StoreButtons` in `src/components/Auth.tsx`.
