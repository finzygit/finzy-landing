# Finzy admin console (`admin/`)

MOB-1369 / MOB-1372 (D399, D400). This is the new admin panel: a Next.js static export, separate from the site (root) and from the web dashboard (`dashboard/`, landing PR #26).

- **Where it runs.** nginx serves `out/` under a hidden path on console.finzyapp.com. `/api/admin/*` is forwarded to Laravel on the same origin, so there is no CORS and the session stays in an httpOnly cookie. The path is never committed: it is set at build time with `NEXT_PUBLIC_ADMIN_BASE=/<path> pnpm build`. Every page has `noindex`, and `robots.txt` disallows everything.
- **Private (D398).** While the backend switch `CONSOLE_NEXT_ON` is off, every `/api/admin` route answers 404. The nginx `auth_request` gate that also hides the static files is a server step (Victor's OK, knowledge/65).
- **Sign-in.**
  - Email and password, then the authenticator code. The second step is mandatory for everyone.
  - Without a confirmed authenticator, the only page is the set-up.
  - The client sends `X-Finzy-Admin: 1` on every call (CSRF) and maps the shared error codes to pages (`src/lib/api.ts`).
- **Menu.** `src/lib/nav.ts` holds the 9 page groups (same as `design/v2/ui_admin.py` NAV). Only what the role may open is drawn, and a page the role cannot open shows the 403 state.
- **Shell components.** In `src/components/shell/` (owned by MOB-1372): `AdminFrame`, `PageHead`, `Section`, `DataTable`, `Pager`, `Drawer`, `ConfirmDialog`, `Banner`, `Level`, `LevelPicker`, `Status`, `VerbChip`, `StateBlock`, `Toasts`, `AuthCard`, `CodeInput`. Other admin lanes use them and add their own pages under `src/app/<their routes>`.
- **Look.** The tokens in `src/app/globals.css` come from the 2.0 kit (design PR #701, Kit-ADM-1/2). When the dashboard (#26) merges, they move to a shared `kit/` package used by both apps.

## Deploy notes (server steps: Victor's OK, knowledge/65)
- Build with `ADMIN_DEPLOY=1 NEXT_PUBLIC_ADMIN_BASE=/<path> pnpm build`. Without the path, the build refuses.
- nginx serves `out/` under `/<path>/` with `try_files $uri $uri.html =404` and `error_page 404 /<path>/404.html`. It also needs an `auth_request` to the backend gate, so the static files also answer 404 to anyone not allowed.
- `/robots.txt` and `X-Robots-Tag: noindex` come from nginx at the host root: the copy in `public/` sits under the hidden path, where crawlers never look.
- `pnpm dev` has no proxy (rewrites don't work with `output: "export"`). Point a local nginx, or the backend's own host, at `/api/admin`.

## Commands
```
pnpm install --frozen-lockfile
pnpm dev            # http://localhost:3200 (needs a backend with CONSOLE_NEXT_ON=true behind /api/admin)
pnpm test           # vitest (fetch is always mocked)
pnpm check          # test + typecheck + lint + build
```
