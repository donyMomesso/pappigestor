import type { ReactNode } from "react";
import FinanceiroShell from "@/components/financeiro/FinanceiroShell";

export default function Layout({ children }: { children: ReactNode }) {
  return <FinanceiroShell>{children}</FinanceiroShell>;
}
