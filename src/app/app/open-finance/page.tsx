"use client";

import dynamic from "next/dynamic";

const OpenFinancePage = dynamic(() => import("./OpenFinanceClient"), {
  ssr: false,
});

export default function Page() {
  return <OpenFinancePage />;
}