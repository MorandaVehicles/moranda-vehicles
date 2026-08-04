"use client";

import { useRouter } from "next/navigation";

const OPCIONES = [
  { value: "", label: "Todos (activos)" },
  { value: "prospecto", label: "Prospecto" },
  { value: "negociacion_compra", label: "Negociando compra" },
  { value: "comprado", label: "Comprado" },
  { value: "en_recon", label: "En recon" },
  { value: "publicado", label: "Publicado" },
  { value: "negociacion_venta", label: "Negociando venta" },
  { value: "vendido", label: "Vendido" },
  { value: "descartado", label: "Descartado" },
];

export function FiltroEstatus({ actual }: { actual: string }) {
  const router = useRouter();

  return (
    <select
      value={actual}
      onChange={(e) => {
        const val = e.target.value;
        router.push(val ? `/dashboard?estado=${val}` : "/dashboard");
      }}
      className="text-sm border border-[var(--border)] rounded-lg px-3 py-1.5 bg-[var(--surface)] text-[var(--ink)]"
    >
      {OPCIONES.map((op) => (
        <option key={op.value} value={op.value}>
          {op.label}
        </option>
      ))}
    </select>
  );
}