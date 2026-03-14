import { getSupabaseAdmin as getAdminFromPappiServer } from "@/lib/pappi-server";

export function getSupabaseAdmin() {
  try {
    return getAdminFromPappiServer();
  } catch {
    return null;
  }
}
