export const HOME_PAGE_KEY = "app_home";

export type HomePreferencesRecord = {
  id?: string;
  user_id: string;
  empresa_id?: string | null;
  page_key: string;
  quick_shortcuts: string[];
  created_at?: string;
  updated_at?: string;
};

export function normalizeShortcutIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .slice(0, 4);
}