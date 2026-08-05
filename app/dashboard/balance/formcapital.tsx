"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function FormCapital() {
  const [tipo, setTipo] = useState<"aporte" | "retiro">("aporte");
  const [monto, setMonto] = useState("");
  const [motivo, setMotivo] = useState("");
  const [guardando, setGuardando] = useState(false);
  const router = useRouter();

  async function agregar() {
    const numero = parseFloat(monto);
    if (!monto || isNaN(numero) || numero <= 0) {
      alert("Pon un monto válido.");
      return;
    }

    setGuardando(true);
    const supabase = createClient();

    const { error } = await supabase.from("capital_movimientos").insert({
      tipo,
      monto: numero,
      motivo: motivo.trim() || null,
    });

    setGuardando(false);

    if (error) {
      alert("No se pudo guardar: " + error.message);
      return;
    }

    setMonto("");
    setMotivo("");
    router.refresh();
  }

  return (
    <div className="bg-[var(--surface)] rounded-2xl p-5 border border-[var(--border)]">
      <p className="text-sm font-medium text-[var(--ink)] mb-3">Registrar movimiento</p>
      <div className="flex flex-col sm:flex-row gap-2">
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value as "aporte" | "retiro")}
          className="border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm"
        >
          <option value="aporte">Aporte (+)</option>
          <option value="retiro">Retiro (−)</option>
        </select>
        <input
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Motivo (ej. Capital inicial)"
          className="flex-1 min-w-0 border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm"
        />
        <div className="flex gap-2">
          <input
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            placeholder="$"
            type="number"
            className="flex-1 sm:w-28 sm:flex-none border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm font-mono"
          />
          <button
            onClick={agregar}
            disabled={guardando}
            className="bg-[var(--moranda)] text-white text-sm px-4 py-1.5 rounded-lg hover:bg-[var(--moranda-light)] disabled:opacity-40 flex-shrink-0"
          >
            {guardando ? "..." : "Agregar"}
          </button>
        </div>
      </div>
    </div>
  );
}