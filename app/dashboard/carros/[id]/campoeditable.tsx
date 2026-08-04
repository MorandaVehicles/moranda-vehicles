"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Tipo = "text" | "number" | "money" | "boolean";

export function CampoEditable({
  carroId,
  campo,
  label,
  valor,
  tipo = "text",
}: {
  carroId: string;
  campo: string;
  label: string;
  valor: string | number | boolean | null;
  tipo?: Tipo;
}) {
  const [editando, setEditando] = useState(false);
  const [valorTemp, setValorTemp] = useState(valor?.toString() ?? "");
  const [guardando, setGuardando] = useState(false);
  const router = useRouter();

  async function guardar(nuevoValor: string | boolean) {
    setGuardando(true);
    const supabase = createClient();

    let valorFinal: string | number | boolean | null = nuevoValor;
    if (tipo === "number" || tipo === "money") {
      valorFinal = nuevoValor === "" ? null : parseFloat(nuevoValor as string);
    } else if (tipo === "text" && nuevoValor === "") {
      valorFinal = null;
    }

    const { error } = await supabase
      .from("carros")
      .update({ [campo]: valorFinal })
      .eq("id", carroId);

    setGuardando(false);
    setEditando(false);

    if (error) {
      alert("No se pudo guardar: " + error.message);
      return;
    }
    router.refresh();
  }

  // --- booleano (ej. clima): selector de 3 opciones, sin modo edición aparte ---
  if (tipo === "boolean") {
    const actual = valor === true ? "si" : valor === false ? "no" : "";
    return (
      <>
        <dt className="text-[var(--muted)]">{label}</dt>
        <dd>
          <select
            value={actual}
            onChange={(e) =>
              guardar(e.target.value === "si" ? true : e.target.value === "no" ? false : "")
            }
            disabled={guardando}
            className="font-mono text-sm bg-transparent border-b border-dashed border-[var(--muted)]/40 hover:border-[var(--moranda)] focus:border-[var(--moranda)] focus:outline-none cursor-pointer"
          >
            <option value="">—</option>
            <option value="si">Sí</option>
            <option value="no">No</option>
          </select>
        </dd>
      </>
    );
  }

  if (editando) {
    return (
      <>
        <dt className="text-[var(--muted)]">{label}</dt>
        <dd>
          <input
            autoFocus
            type={tipo === "number" || tipo === "money" ? "number" : "text"}
            value={valorTemp}
            onChange={(e) => setValorTemp(e.target.value)}
            onBlur={() => guardar(valorTemp)}
            onKeyDown={(e) => {
              if (e.key === "Enter") guardar(valorTemp);
              if (e.key === "Escape") setEditando(false);
            }}
            disabled={guardando}
            className="font-mono text-sm border border-[var(--moranda)] rounded px-1.5 py-0.5 w-full max-w-[140px]"
          />
        </dd>
      </>
    );
  }

  const vacio = valor === null || valor === undefined || valor === "" || valor === 0;
  const textoMostrar = vacio
    ? "—"
    : tipo === "money"
    ? `$${Number(valor).toLocaleString("es-MX")}`
    : String(valor);

  return (
    <>
      <dt className="text-[var(--muted)]">{label}</dt>
      <dd>
        <button
          onClick={() => {
            setValorTemp(valor?.toString() ?? "");
            setEditando(true);
          }}
          className={`font-mono text-sm text-left border-b border-dashed hover:border-[var(--moranda)] hover:text-[var(--moranda)] transition-colors ${
            vacio ? "border-[var(--muted)]/40 text-[var(--muted)]" : "border-transparent text-[var(--ink)]"
          }`}
        >
          {textoMostrar}
        </button>
      </dd>
    </>
  );
}