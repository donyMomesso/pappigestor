"use client";
import { useEffect } from "react";

export function PwaRegistry() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => console.log('Pappi PWA Registrado com sucesso!', reg.scope))
        .catch((err) => console.error('Erro ao registrar PWA:', err));
    }
  }, []);
  return null;
}