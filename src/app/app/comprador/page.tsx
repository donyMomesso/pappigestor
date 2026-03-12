"use client";

import dynamic from "next/dynamic";

const CompradorPage = dynamic(() => import("@/react-app/pages/Comprador"), {
  ssr: false,
});

export default function Page() {
  return <CompradorPage />;
}