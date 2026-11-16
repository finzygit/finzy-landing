// MOB-1380: the shapes of /api/admin «Contenuti app» (finzy-backend routes/admin/content.php).

export type Lang = "it" | "en";
export const LANGS: Lang[] = ["it", "en"];
export type PerLang<T> = Record<Lang, T>;

export type LastChange = { who: string | null; at: string } | null;

export type LessonRow = {
  id: number;
  title: string;
  sort_order: number;
  active: boolean;
  videos: PerLang<{ duration: number | null } | null>;
  thumbnail_url: string | null;
  updated_at: string | null;
};

export type LessonSection = { key: string; title: string; legacy: boolean; lessons: LessonRow[] };

export type Library = { sections: LessonSection[]; counts: { all: number; visible: number; no_it: number; no_en: number } };

export type LessonVideo = { name: string; duration: number | null; size: number | null; uploaded_at: string | null };

export type LessonDetail = {
  id: number;
  title: PerLang<string>;
  summary: PerLang<string>;
  objectives: PerLang<string[]>;
  hashtags: string[];
  category: string;
  section_title: string;
  legacy: boolean;
  active: boolean;
  videos: PerLang<LessonVideo | null>;
  thumbnail_url: string | null;
  position: { index: number; count: number };
  last_change: LastChange;
  updated_at: string | null;
};

export type TutorialStep = {
  id: number;
  step_key: string;
  page: string;
  order: number;
  feature: string | null;
  title_it: string | null;
  title_en: string | null;
  body_it: string | null;
  body_en: string | null;
  images: { it: string | null; en: string | null; legacy: string | null };
  updated_at: string | null;
};

export type Tutorials = { pages: { key: string; steps: TutorialStep[] }[]; features: string[]; last_change: LastChange };

export type AvatarItem = { id: number; slug: string; name_it: string; name_en: string; sort: number; active: boolean; image_url: string | null };

export type Avatars = { avatars: AvatarItem[]; last_change: LastChange };

export type LegalLink = { value: string | null; default: string | null; custom: boolean };

export type AppSettings = {
  maintenance: { on: boolean; since: string | null; by: string | null };
  legal: { key: string; version: string | null; links: PerLang<LegalLink> }[];
  ask_review: boolean;
  ask_review_android: boolean;
  min_version: number;
  last_change: LastChange;
};
