"use client";

import dynamic from "next/dynamic";

const CompradorPage = dynamic(() => import("@/pages/Comprador"), {
  ssr: false,
});

export default function Page() {
  return <CompradorPage />;
}
