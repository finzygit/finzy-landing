// MOB-1372: the console's menu, the 9 page groups in four sections, as the
// design draws them (design/v2/ui_admin.py NAV). An item the role cannot open
// is not drawn; a group whose only openable page is one of several shows that
// page as the item (its own label and route), so a role never lands on a page
// it cannot open (the marketing role sees «Promozioni», not «Ricavi»).

export type NavPage = { id: string; label: string; route: string; perm?: string };
export type NavGroup = { id: string; label: string; icon: string; perm: string; route: string; pages: NavPage[] };
export type NavSection = { label: string; groups: NavGroup[] };

export const NAV: NavSection[] = [
  { label: "Panoramica", groups: [{ id: "home", label: "Home", icon: "home", perm: "console.home.view", route: "/", pages: [] }] },
  {
    label: "Clienti e ricavi",
    groups: [
      { id: "users", label: "Utenti", icon: "users", perm: "console.users.view", route: "/users", pages: [] },
      {
        id: "revenue", label: "Ricavi e promozioni", icon: "coins", perm: "console.revenue.view", route: "/revenue",
        pages: [
          { id: "revenue", label: "Ricavi del mese", route: "/revenue" },
          { id: "promotions", label: "Promozioni", route: "/promotions", perm: "console.promotions.view" },
        ],
      },
    ],
  },
  {
    label: "Contenuti e dati",
    groups: [
      {
        id: "news", label: "Notizie", icon: "news", perm: "console.news.view", route: "/news",
        pages: [
          { id: "today", label: "Oggi", route: "/news" },
          { id: "articles", label: "Articoli", route: "/news/articles" },
          { id: "review", label: "Da verificare", route: "/news/review" },
          { id: "taxonomies", label: "Classificazioni", route: "/news/taxonomies" },
        ],
      },
      { id: "stocks", label: "Titoli", icon: "candles", perm: "console.stocks.view", route: "/stocks", pages: [] },
      {
        id: "reports", label: "Report AI", icon: "report", perm: "console.reports.view", route: "/report",
        pages: [
          { id: "reports", label: "Report e copertura", route: "/report" },
          { id: "builder", label: "Portfolio Builder", route: "/portfolio-builder" },
          { id: "consents", label: "Consensi", route: "/consents" },
        ],
      },
      {
        id: "content", label: "Contenuti app", icon: "layers", perm: "console.content.view", route: "/content/lessons",
        pages: [
          { id: "lessons", label: "Lezioni", route: "/content/lessons" },
          { id: "tutorial", label: "Tutorial", route: "/content/tutorial" },
          { id: "avatars", label: "Avatar", route: "/content/avatars" },
          { id: "settings", label: "Impostazioni app", route: "/content/settings" },
        ],
      },
    ],
  },
  {
    label: "Sistema",
    groups: [
      {
        id: "spend", label: "Costi e servizi", icon: "pulse", perm: "console.spend.view", route: "/spend",
        pages: [
          { id: "spend", label: "Spesa AI", route: "/spend" },
          { id: "health", label: "Salute dei servizi", route: "/health" },
        ],
      },
      {
        id: "admin", label: "Amministrazione", icon: "shield", perm: "console.admin.view", route: "/admin/roles",
        pages: [
          { id: "roles", label: "Ruoli e permessi", route: "/admin/roles" },
          { id: "people", label: "Persone con accesso", route: "/admin/people" },
          { id: "log", label: "Registro attività", route: "/admin/audit-log" },
          { id: "tools", label: "Strumenti esterni", route: "/admin/tools", perm: "console.tools.view" },
        ],
      },
    ],
  },
];

export type VisibleGroup = Omit<NavGroup, "pages"> & { pages: NavPage[] };
export type VisibleSection = { label: string; groups: VisibleGroup[] };

const ICON_FOR_PAGE: Record<string, string> = { tools: "external" };

function pagesFor(group: NavGroup, perms: ReadonlySet<string>): NavPage[] {
  return group.pages.filter((p) => perms.has(p.perm ?? group.perm));
}

/** The menu a role sees. */
export function visibleNav(perms: ReadonlySet<string>): VisibleSection[] {
  const out: VisibleSection[] = [];
  for (const section of NAV) {
    const groups: VisibleGroup[] = [];
    for (const g of section.groups) {
      const pages = pagesFor(g, perms);
      if (g.pages.length === 0) {
        if (perms.has(g.perm)) groups.push({ ...g, pages: [] });
        continue;
      }
      if (pages.length === 0) continue;
      if (pages.length === 1 && g.pages.length > 1 && !perms.has(g.perm)) {
        const p = pages[0];
        groups.push({ ...g, label: p.label, route: p.route, icon: ICON_FOR_PAGE[p.id] ?? g.icon, pages: [] });
        continue;
      }
      groups.push({ ...g, route: pages[0].route, pages });
    }
    if (groups.length) out.push({ label: section.label, groups });
  }
  return out;
}

/** The group and page a route belongs to (for the active item). */
export function locate(route: string): { group: string | null; page: string | null } {
  const clean = route.replace(/\?.*$/, "").replace(/\/+$/, "") || "/";
  // The longest route that matches wins («/news/articles» over «/news»).
  let best: { group: string; page: string | null; len: number } | null = null;
  const consider = (r: string, group: string, page: string | null) => {
    const hit = clean === r || (r !== "/" && clean.startsWith(`${r}/`));
    if (hit && (!best || r.length > best.len)) best = { group, page, len: r.length };
  };
  for (const section of NAV) {
    for (const g of section.groups) {
      for (const p of g.pages) consider(p.route, g.id, p.id);
      consider(g.route, g.id, null);
    }
  }
  const found = best as { group: string; page: string | null; len: number } | null;
  return found ? { group: found.group, page: found.page } : { group: null, page: null };
}

/** The permission a route needs (undefined: any signed-in console user). */
export function permissionFor(route: string): string | undefined {
  const { group, page } = locate(route);
  for (const section of NAV) {
    for (const g of section.groups) {
      if (g.id !== group) continue;
      const p = g.pages.find((x) => x.id === page);
      return p?.perm ?? g.perm;
    }
  }
  return undefined;
}

/** Where an admin lands after signing in: Home if the role opens it, else its first page. */
export function firstRoute(perms: ReadonlySet<string>): string {
  const first = visibleNav(perms)[0]?.groups[0];
  return first ? (first.pages[0]?.route ?? first.route) : "/";
}
