"use client";

import dynamic from "next/dynamic";

const ClientLobeToastHost = dynamic(
  () =>
    import("@/components/client-lobe-toast-host").then(
      (mod) => mod.ClientLobeToastHost,
    ),
  { ssr: false },
);

export function LobeToastProvider() {
  return <ClientLobeToastHost />;
}
