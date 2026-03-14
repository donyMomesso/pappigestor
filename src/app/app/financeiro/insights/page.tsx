"use client";

import FinanceiroOverview from "@/components/financeiro/FinanceiroOverview";
import { Card, CardContent, CardHeader, CardTitle } from "@/react-app/components/ui/card";

export default function Page() {
  return (
    <div className="space-y-4">
      <FinanceiroOverview />
      <Card>
        <CardHeader>
          <CardTitle>Insights Financeiros</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-600">
            Este espaço está pronto para receber alertas de vencimento, conciliação e análises por IA.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
