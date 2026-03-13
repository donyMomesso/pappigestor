"use client";

import LegacyOpenFinancePage from "@/react-app/pages/OpenFinance";
import { Card, CardContent, CardHeader, CardTitle } from "@/react-app/components/ui/card";

export default function Page() {
  return (
    <Card className="border-zinc-200 shadow-sm">
      <CardHeader>
        <CardTitle>Conexões e Open Finance</CardTitle>
        <p className="text-sm text-zinc-500">
          Gestão de conexões bancárias e sincronização financeira em uma área dedicada.
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <LegacyOpenFinancePage />
      </CardContent>
    </Card>
  );
}
