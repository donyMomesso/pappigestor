const PRIMARY_KEY = "empresa_id";

const LEGACY_KEYS = [
  "empresaId",
  "companyId",
  "empresa_id",
  "company_id",
];

export function getEmpresaId(): string {
  if (typeof window === "undefined") return "";

  for (const key of LEGACY_KEYS) {
    const value = localStorage.getItem(key);
    if (value) {
      // normaliza tudo para chave principal
      if (key !== PRIMARY_KEY) {
        localStorage.setItem(PRIMARY_KEY, value);
      }
      return value;
    }
  }

  return "";
}

export function setEmpresaId(id: string) {
  if (typeof window === "undefined") return;
  if (!id) return;

  // grava chave oficial
  localStorage.setItem(PRIMARY_KEY, id);

  // mantém compatibilidade com versões antigas
  for (const key of LEGACY_KEYS) {
    localStorage.setItem(key, id);
  }
}

export function clearEmpresaId() {
  if (typeof window === "undefined") return;

  for (const key of LEGACY_KEYS) {
    localStorage.removeItem(key);
  }
}
