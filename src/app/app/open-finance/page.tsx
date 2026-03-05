"use client";

import dynamic from "next/dynamic";

// 🔥 A MÁGICA AQUI: Apontamos diretamente para o seu ficheiro real do Pluggy!
const OpenFinancePage = dynamic(() => import("@/react-app/pages/OpenFinance"), {
  ssr: false,
});

export default function Page() {
  return <OpenFinancePage />;
}