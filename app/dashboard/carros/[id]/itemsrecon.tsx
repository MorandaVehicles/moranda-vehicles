"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Item = {
  id: string;
  descripcion: string;
  presupuesto: number | null;
  costo_real: number | null;
  atendido: boolean;
};

export function ItemsRecon({ carroId, items }: { carroId: string; items: Item[] }) {
  const [nuevaDescripcion, setNuevaDescripcion] = useState("");
  const [nuevoPresupuesto, setNuevoPresupuesto] = useState("");
  const [agregando, setAgregando] = useState(false);
  const router = useRouter();

  const totalPresupuestado = items.reduce((s, i) => s + (i.presupuesto ?? 0), 0);
  const totalReal = items
    .filter((i) => i.atendido)
    .reduce((s, i) => s + (i.costo_real ?? 0), 0);

  async function agregarItem() {
    if (!nuevaDescripcion.trim()) return;

    setAgregando(true);
    const supabase = createClient();

    const { error } = await supabase.from("items_recon").insert({
      carro_id: carroId,
      descripcion: nuevaDescripcion.trim(),
      presupuesto: nuevoPresupuesto ? parseFloat(nuevoPresupuesto) : null,
      atendido: false,
    });

    setAgregando(false);

    if (error) {
      alert("No se pudo agregar: " + error.message);
      return;
    }

    setNuevaDescripcion("");
    setNuevoPresupuesto("");
    router.refresh();
  }

  async function marcarAtendido(item: Item, atendido: boolean) {
    const supabase = createClient();
    let costoReal = item.costo_real;

    if (atendido && costoReal == null) {
      const input = prompt(`¿En cuánto salió "${item.descripcion}"?`);
      if (!input) return;
      costoReal = parseFloat(input);
      if (isNaN(costoReal)) return;
    }

    const { error } = await supabase
      .from("items_recon")
      .update({ atendido, costo_real: costoReal })
      .eq("id", item.id);

    if (error) {
      alert("No se pudo actualizar: " + error.message);
      return;
    }
    router.refresh();
  }

  async function borrarItem(id: string) {
    const supabase = createClient();
    await supabase.from("items_recon").delete().eq("id", id);
    router.refresh();
  }

  return (
    <section className="mt-6 bg-[var(--surface)] rounded-xl p-5 border border-[var(--moranda)]/10">
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-medium text-[var(--ink)]">Valoración / Recon</h2>
        <span className="font-mono text-xs text-[var(--muted)]">
          Presupuestado: ${totalPresupuestado.toLocaleString("es-MX")} · Real: $
          {totalReal.toLocaleString("es-MX")}
        </span>
      </div>

      {items.length > 0 && (
        <ul className="space-y-2 mb-4">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-2 flex-wrap text-sm border-b border-[var(--muted)]/10 pb-2"
            >
              <input
                type="checkbox"
                checked={item.atendido}
                onChange={(e) => marcarAtendido(item, e.target.checked)}
                className="accent-[var(--moranda)] flex-shrink-0"
              />
              <span
                className={`flex-1 min-w-[120px] ${
                  item.atendido ? "line-through text-[var(--muted)]" : "text-[var(--ink)]"
                }`}
              >
                {item.descripcion}
              </span>
              <span className="font-mono text-xs text-[var(--muted)] whitespace-nowrap">
                {item.presupuesto != null && `presup. $${item.presupuesto.toLocaleString("es-MX")}`}
                {item.atendido && item.costo_real != null && (
                  <> · real ${item.costo_real.toLocaleString("es-MX")}</>
                )}
              </span>
              <button
                onClick={() => borrarItem(item.id)}
                className="text-[var(--muted)] hover:text-red-500 text-xs flex-shrink-0"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          value={nuevaDescripcion}
          onChange={(e) => setNuevaDescripcion(e.target.value)}
          placeholder="Ej. Cambiar balatas traseras"
          className="flex-1 min-w-0 border border-[var(--muted)]/30 rounded-lg px-3 py-1.5 text-sm"
        />
        <div className="flex gap-2">
          <input
            value={nuevoPresupuesto}
            onChange={(e) => setNuevoPresupuesto(e.target.value)}
            placeholder="$ presup."
            type="number"
            className="flex-1 sm:w-24 sm:flex-none border border-[var(--muted)]/30 rounded-lg px-3 py-1.5 text-sm font-mono"
          />
          <button
            onClick={agregarItem}
            disabled={agregando}
            className="bg-[var(--moranda)] text-white text-sm px-3 py-1.5 rounded-lg hover:bg-[var(--moranda-light)] disabled:opacity-40 flex-shrink-0"
          >
            +
          </button>
        </div>
      </div>
    </section>
  );
}