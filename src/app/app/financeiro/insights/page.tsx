"use client";

import FinanceiroOverview from "@/components/financeiro/FinanceiroOverview";
import { Card, CardContent, CardHeader, CardTitle } from "@/react-app/components/ui/card";

export default function Page() {
  return (
    <div className="space-y-6">
      <Card className="border-zinc-200 shadow-sm">
        <CardHeader>
          <CardTitle>Central de insights</CardTitle>
          <p className="text-sm text-zinc-500">
            Resumo executivo, alertas e próximas ações recomendadas com base nos dados do financeiro.
          </p>
        </CardHeader>
      </Card>
      <FinanceiroOverview />
    </div>
  );
}
