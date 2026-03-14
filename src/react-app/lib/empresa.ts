const PRIMARY_KEY = "empresa_id";

const LEGACY_KEYS = [
  "empresaId",
  "companyId",
  "empresa_id",
  "company_id",
  "pId",
  "pizzariaId",
];

export function getEmpresaId(): string {
  if (typeof window === "undefined") return "";

  for (const key of LEGACY_KEYS) {
    const value = localStorage.getItem(key);
    if (value) {
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

  localStorage.setItem(PRIMARY_KEY, id);

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
