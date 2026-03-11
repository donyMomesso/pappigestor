// src/utils/safePathname.ts
import { usePathname } from "next/navigation";

/**
 * Hook que retorna sempre uma string segura para pathname.
 * Se for null, devolve string vazia.
 */
export function useSafePathname(): string {
  const pathname = usePathname() ?? "";
  return pathname ?? "";
}