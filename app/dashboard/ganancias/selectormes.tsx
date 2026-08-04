"use client";

import { useRouter } from "next/navigation";

export function SelectorMes({ mesActual }: { mesActual: string }) {
  const router = useRouter();

  return (
    <input
      type="month"
      value={mesActual}
      onChange={(e) => router.push(`/dashboard/ganancias?mes=${e.target.value}`)}
      className="border border-[var(--muted)]/30 rounded-lg px-3 py-1.5 text-sm"
    />
  );
}