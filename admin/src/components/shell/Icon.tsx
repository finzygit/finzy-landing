// MOB-1372: the line icons the console uses (the kit's set, 24×24, stroke 2).
const PATHS: Record<string, string> = {
  home: "M4 11.5 12 5l8 6.5V20h-5v-5h-6v5H4z",
  users: "M9 11.7a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4ZM3.5 19c.6-3.1 2.8-5 5.5-5s4.9 1.9 5.5 5M15.5 5.6a3 3 0 0 1 0 5.8M17.5 14.3c1.6.7 2.7 2.4 3 4.7",
  coins: "M9 9.6c3 0 5.5-1.2 5.5-2.6S12 4.4 9 4.4 3.5 5.6 3.5 7 6 9.6 9 9.6ZM3.5 7v4.5c0 1.4 2.5 2.6 5.5 2.6s5.5-1.2 5.5-2.6V7M9.5 16.6c.9.9 2.8 1.5 5 1.5 3 0 5.5-1.2 5.5-2.6v-4.5c0-1.2-1.9-2.2-4.5-2.5",
  news: "M5 5h11v14H5zM16 9h3v8a2 2 0 0 1-2 2M8 9h5M8 12h5M8 15h3",
  candles: "M7 4v16M17 4v16M5 8h4v7H5zM15 6h4v8h-4z",
  report: "M5 19V9M10 19V5M15 19v-7M20 19v-4",
  layers: "m12 3.5 8.5 4.5-8.5 4.5L3.5 8ZM3.5 12l8.5 4.5 8.5-4.5M3.5 16l8.5 4.5 8.5-4.5",
  pulse: "M3 12h4l2.5-6 4 12 2.5-6H21",
  shield: "M12 3.5 5 6.5v5c0 4.4 3 7.9 7 9 4-1.1 7-4.6 7-9v-5ZM9 12l2.2 2.2L15.5 10",
  external: "M14 4h6v6M20 4l-9 9M18 14v5H5V6h5",
  menu: "M4 7h16M4 12h16M4 17h16",
  close: "M6 6l12 12M18 6 6 18",
  chevron: "m9 6 6 6-6 6",
  down: "m6 9 6 6 6-6",
  up: "m6 15 6-6 6 6",
  more: "M6 12h.01M12 12h.01M18 12h.01",
  lock: "M7 11V8a5 5 0 0 1 10 0v3M5 11h14v9H5z",
  eye: "M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12ZM12 14.8a2.8 2.8 0 1 0 0-5.6 2.8 2.8 0 0 0 0 5.6Z",
  edit: "M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4",
  alert: "M12 8v5M12 16.5h.01M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17Z",
  info: "M12 11v5M12 7.5h.01M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17Z",
  check: "m5 12.5 4.5 4.5L19 7.5",
  logout: "M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4.5 20c.8-3.6 3.8-6 7.5-6s6.7 2.4 7.5 6",
  download: "M12 4.5V15M7.5 10.5 12 15l4.5-4.5M5 19.5h14",
  copy: "M9 9h10v11H9zM5 15V4h10",
  search: "M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13ZM15.5 15.5 20 20",
  key: "M8 19a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM11 12l8.5-8.5M16 7l2.5 2.5M14 9l2 2",
  phone: "M6.5 3h11v18h-11zM10.5 18h3",
};

export function Icon({ name, size = 19, label }: { name: string; size?: number; label?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={label ? undefined : true}
      role={label ? "img" : undefined}
      aria-label={label}
      style={{ flex: "none" }}
    >
      <path d={PATHS[name] ?? PATHS.info} />
    </svg>
  );
}
