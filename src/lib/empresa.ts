export function getEmpresaId(): string {
  if (typeof window === "undefined") return "";

  // tenta todas as chaves possíveis (você já migrou várias vezes)
  const fromStorage =
    localStorage.getItem("empresaId") ||
    localStorage.getItem("companyId") ||
    localStorage.getItem("empresa_id") ||
    localStorage.getItem("company_id") ||
    "";

  return fromStorage;
}

export function setEmpresaId(id: string) {
  if (typeof window === "undefined") return;
  if (!id) return;

  // grava em todas pra nunca mais quebrar
  localStorage.setItem("empresaId", id);
  localStorage.setItem("companyId", id);
  localStorage.setItem("empresa_id", id);
  localStorage.setItem("company_id", id);
}
