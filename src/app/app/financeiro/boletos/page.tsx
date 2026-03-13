"use client";

import LegacyBoletosPage from "@/react-app/pages/BoletosDDA";
import { Card, CardContent, CardHeader, CardTitle } from "@/react-app/components/ui/card";

export default function Page() {
  return (
    <Card className="border-zinc-200 shadow-sm">
      <CardHeader>
        <CardTitle>Boletos e contas vinculadas</CardTitle>
        <p className="text-sm text-zinc-500">
          A mesma tela operacional de boletos, agora dentro do ambiente premium do financeiro.
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <LegacyBoletosPage />
      </CardContent>
    </Card>
  );
}
