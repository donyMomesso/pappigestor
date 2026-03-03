export function buildNeuroCTA(base: string) {
  // Neuro: clareza + urgência leve + baixa fricção
  return `${base}\n\n✅ Se puder, me retorne *hoje* com: preço / prazo / forma de pagamento.\n🙏 Obrigado!`;
}

export function discTone(tone: "D" | "I" | "S" | "C") {
  if (tone === "D") return { style: "direto", extra: "Seja objetivo e rápido." };
  if (tone === "I") return { style: "amigável", extra: "Use tom simpático e positivo." };
  if (tone === "S") return { style: "calmo", extra: "Passe confiança e estabilidade." };
  return { style: "detalhista", extra: "Peça dados completos e confirme tudo." };
}