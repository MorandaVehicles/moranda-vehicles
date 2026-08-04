"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const TIPOS = [
  { value: "traspaso", label: "Traspaso" },
  { value: "publicidad", label: "Publicidad" },
  { value: "otro", label: "Otro (gasolina, comisión, etc.)" },
];

export function FormGasto({ carroId }: { carroId: string }) {
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");
  const [tipo, setTipo] = useState("otro");
  const [guardando, setGuardando] = useState(false);
  const router = useRouter();

  async function agregar() {
    const numero = parseFloat(monto);
    if (!descripcion.trim() || !monto || isNaN(numero) || numero <= 0) {
      alert("Pon descripción y un monto válido.");
      return;
    }

    setGuardando(true);
    const supabase = createClient();

    const { error } = await supabase.from("gastos").insert({
      carro_id: carroId,
      tipo,
      descripcion: descripcion.trim(),
      monto: numero,
    });

    setGuardando(false);

    if (error) {
      alert("No se pudo agregar: " + error.message);
      return;
    }

    setDescripcion("");
    setMonto("");
    router.refresh();
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2 mt-3">
      <select
        value={tipo}
        onChange={(e) => setTipo(e.target.value)}
        className="border border-[var(--muted)]/30 rounded-lg px-2 py-1.5 text-sm"
      >
        {TIPOS.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
      <input
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        placeholder="Ej. Pago de traspaso"
        className="flex-1 min-w-0 border border-[var(--muted)]/30 rounded-lg px-3 py-1.5 text-sm"
      />
      <div className="flex gap-2">
        <input
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          placeholder="$"
          type="number"
          className="flex-1 sm:w-24 sm:flex-none border border-[var(--muted)]/30 rounded-lg px-3 py-1.5 text-sm font-mono"
        />
        <button
          onClick={agregar}
          disabled={guardando}
          className="bg-[var(--moranda)] text-white text-sm px-3 py-1.5 rounded-lg hover:bg-[var(--moranda-light)] disabled:opacity-40 flex-shrink-0"
        >
          +
        </button>
      </div>
    </div>
  );
}