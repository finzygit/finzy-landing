// MOB-1376: the few line icons the News pages need beyond the shell's set
// (same grid: 24×24, stroke 2). Any other name goes to the shell's Icon.
import { Icon } from "@/components/shell/Icon";

const PATHS: Record<string, string> = {
  clock: "M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17ZM12 7.5V12l3 2",
  "thumb-up": "M7 10.5v9H4v-9zM7 10.5l4-6.5c1.4 0 2.3 1.1 2 2.4l-.7 3.1H18a2 2 0 0 1 2 2.3l-1.1 6.3a2 2 0 0 1-2 1.9H7",
  "thumb-down": "M7 13.5v-9H4v9zM7 13.5l4 6.5c1.4 0 2.3-1.1 2-2.4l-.7-3.1H18a2 2 0 0 0 2-2.3l-1.1-6.3a2 2 0 0 0-2-1.9H7",
  plus: "M12 5v14M5 12h14",
  "eye-off": "M3 3l18 18M10.6 6.1c.5-.1.9-.1 1.4-.1 6 0 9.5 6 9.5 6a17 17 0 0 1-3 3.6M6.5 7.6A16 16 0 0 0 2.5 12S6 18.5 12 18.5c1.5 0 2.9-.4 4.1-1M9.9 10a2.8 2.8 0 0 0 4 4",
  image: "M4 5h16v14H4zM4 15l4.5-4.5 4 4 3-3L20 16M15.5 9.5h.01",
};

export function NewsIcon({ name, size = 18 }: { name: string; size?: number }) {
  const d = PATHS[name];
  if (!d) return <Icon name={name} size={size} />;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={d} />
    </svg>
  );
}
