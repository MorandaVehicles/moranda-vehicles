// app/dashboard/page.tsx
// Lista de todos los carros, con badge de estatus y filtro opcional

import { createClient } from "@/lib/supabase/server";
import { CarroCard } from "./carrocard";
import { FiltroEstatus } from "./filtroestatus";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tablero",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const { estado } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("carros")
    .select(
      "id, folio, estado, marca, modelo, anio, placa, precio_listado, precio_negociado, precio_venta_final, fotos_urls"
    )
    .order("folio", { ascending: false });

  if (estado) {
    query = query.eq("estado", estado);
  } else {
    query = query.neq("estado", "descartado");
  }

  const { data: carros, error } = await query;

  if (error) {
    return (
      <main className="max-w-6xl mx-auto p-6 md:p-8">
        <p className="text-red-600">No se pudieron cargar los carros: {error.message}</p>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-[var(--muted)]">
          {carros?.length ?? 0} carro{carros?.length === 1 ? "" : "s"}
        </p>
        <FiltroEstatus actual={estado ?? ""} />
      </div>

      {!carros || carros.length === 0 ? (
        <div className="border border-dashed border-[var(--border)] rounded-xl p-10 text-center text-sm text-[var(--muted)]">
          No hay carros en este filtro.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {carros.map((carro) => (
            <CarroCard key={carro.id} carro={carro} />
          ))}
        </div>
      )}
    </main>
  );
}