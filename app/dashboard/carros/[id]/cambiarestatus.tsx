"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CONFIG_ESTATUS } from "../../badgeestatus";

const FLUJO = [
  "prospecto",
  "negociacion_compra",
  "comprado",
  "en_recon",
  "publicado",
  "negociacion_venta",
  "vendido",
];

const CAMPO_REQUERIDO: Record<string, { campo: string; pregunta: string }> = {
  comprado: { campo: "precio_negociado", pregunta: "¿Por cuánto lo compraste?" },
};

const COLORES_BENEFICIARIO: Record<string, string> = {
  jorge: "#5c2a52",
  rolando: "#a87c2e",
  empresa: "#6b7280",
};

function siguientesPasos(estadoActual: string): string[] {
  if (estadoActual === "negociacion_compra") return ["comprado", "descartado"];
  const idx = FLUJO.indexOf(estadoActual);
  if (idx === -1 || idx === FLUJO.length - 1) return [];
  return [FLUJO[idx + 1]];
}

export function CambiarEstatus({
  carroId,
  estadoActual,
  precioNegociado,
}: {
  carroId: string;
  estadoActual: string;
  precioNegociado: number | null;
}) {
  const [guardando, setGuardando] = useState(false);
  const [pidiendoDato, setPidiendoDato] = useState<string | null>(null);
  const [valorInput, setValorInput] = useState("");

  const [pidiendoReparto, setPidiendoReparto] = useState(false);
  const [ganancia, setGanancia] = useState(0);
  const [precioVentaTemp, setPrecioVentaTemp] = useState(0);
  const [porcentajes, setPorcentajes] = useState({ jorge: 34, rolando: 33, empresa: 33 });

  const router = useRouter();
  const opciones = siguientesPasos(estadoActual);
  const sumaPorcentajes = porcentajes.jorge + porcentajes.rolando + porcentajes.empresa;
  const configActual = CONFIG_ESTATUS[estadoActual] ?? { color: "var(--muted)", label: estadoActual };
  const siguientePrincipal = opciones.find((o) => o !== "descartado");
  const configSiguiente = siguientePrincipal ? CONFIG_ESTATUS[siguientePrincipal] : null;

  function iniciarAvance(nuevoEstado: string) {
    if (nuevoEstado === "vendido") {
      setPidiendoDato("vendido");
      setValorInput("");
      return;
    }
    if (CAMPO_REQUERIDO[nuevoEstado]) {
      setPidiendoDato(nuevoEstado);
      setValorInput("");
      return;
    }
    avanzarA(nuevoEstado, {});
  }

  async function avanzarA(nuevoEstado: string, extra: Record<string, unknown>) {
    setGuardando(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("carros")
      .update({ estado: nuevoEstado, ...extra })
      .eq("id", carroId);
    setGuardando(false);
    setPidiendoDato(null);

    if (error) {
      alert("No se pudo cambiar el estatus: " + error.message);
      return;
    }
    router.refresh();
  }

  async function confirmarPrecio() {
    const numero = parseFloat(valorInput);
    if (!valorInput || isNaN(numero) || numero <= 0) {
      alert("Pon un monto válido.");
      return;
    }

    if (pidiendoDato === "vendido") {
      setGuardando(true);
      const supabase = createClient();

      const [{ data: gastos }, { data: items }] = await Promise.all([
        supabase.from("gastos").select("monto").eq("carro_id", carroId),
        supabase
          .from("items_recon")
          .select("costo_real")
          .eq("carro_id", carroId)
          .eq("atendido", true),
      ]);

      const totalGastos = (gastos ?? []).reduce((s, g) => s + Number(g.monto), 0);
      const totalRecon = (items ?? []).reduce((s, i) => s + Number(i.costo_real ?? 0), 0);
      const gananciaCalculada = numero - (precioNegociado ?? 0) - totalGastos - totalRecon;

      setGuardando(false);
      setPrecioVentaTemp(numero);
      setGanancia(gananciaCalculada);
      setPidiendoDato(null);
      setPidiendoReparto(true);
      return;
    }

    const config = CAMPO_REQUERIDO[pidiendoDato!];
    avanzarA(pidiendoDato!, { [config.campo]: numero });
  }

  async function confirmarVentaYReparto() {
    if (Math.round(sumaPorcentajes) !== 100) {
      alert("Los porcentajes deben sumar 100%.");
      return;
    }

    setGuardando(true);
    const supabase = createClient();

    const { error: errorCarro } = await supabase
      .from("carros")
      .update({ estado: "vendido", precio_venta_final: precioVentaTemp })
      .eq("id", carroId);

    if (errorCarro) {
      setGuardando(false);
      alert("No se pudo guardar la venta: " + errorCarro.message);
      return;
    }

    const filas = (["jorge", "rolando", "empresa"] as const).map((b) => ({
      carro_id: carroId,
      beneficiario: b,
      porcentaje: porcentajes[b],
      monto: Math.round((ganancia * porcentajes[b]) / 100),
    }));

    const { error: errorReparto } = await supabase.from("reparto_utilidades").insert(filas);

    setGuardando(false);
    setPidiendoReparto(false);

    if (errorReparto) {
      alert("La venta se guardó pero falló el reparto: " + errorReparto.message);
    }

    router.refresh();
  }

  const gradiente = (() => {
    let acumulado = 0;
    const partes = (["jorge", "rolando", "empresa"] as const).map((b) => {
      const inicio = (acumulado / 100) * 360;
      acumulado += porcentajes[b];
      const fin = (acumulado / 100) * 360;
      return `${COLORES_BENEFICIARIO[b]} ${inicio}deg ${fin}deg`;
    });
    return `conic-gradient(${partes.join(", ")})`;
  })();

  // --- estado terminal: solo muestra el badge, sin botón ---
  if (estadoActual === "descartado" || opciones.length === 0) {
    return (
      <div
        className="rounded-2xl p-5 text-center"
        style={{ backgroundColor: `${configActual.color}12` }}
      >
        <p className="text-lg font-display" style={{ color: configActual.color }}>
          {configActual.label}
        </p>
        <p className="text-xs text-[var(--muted)] mt-1">
          {estadoActual === "descartado" ? "Sin más pasos." : "Llegó al final del flujo 🎉"}
        </p>
      </div>
    );
  }

  // --- paso de reparto (al vender) ---
  if (pidiendoReparto) {
    return (
      <div className="bg-[var(--surface)] rounded-2xl p-5 border border-[var(--border)]">
        <p className="text-sm text-[var(--ink)] mb-3">
          Ganancia calculada:{" "}
          <strong className="font-mono text-[var(--moranda)]">
            ${ganancia.toLocaleString("es-MX")}
          </strong>{" "}
          <span className="text-xs text-[var(--muted)]">
            (venta ${precioVentaTemp.toLocaleString("es-MX")} − compra $
            {(precioNegociado ?? 0).toLocaleString("es-MX")} − gastos y recon)
          </span>
        </p>

        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full flex-shrink-0" style={{ background: gradiente }} />
          <div className="space-y-2 flex-1">
            {(["jorge", "rolando", "empresa"] as const).map((b) => (
              <div key={b} className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ background: COLORES_BENEFICIARIO[b] }}
                />
                <span className="text-sm capitalize w-16">{b}</span>
                <input
                  type="number"
                  value={porcentajes[b]}
                  onChange={(e) => setPorcentajes((p) => ({ ...p, [b]: Number(e.target.value) }))}
                  className="w-16 border border-[var(--border)] rounded px-2 py-1 text-sm font-mono"
                />
                <span className="text-xs text-[var(--muted)]">%</span>
                <span className="text-xs font-mono text-[var(--muted)] ml-auto">
                  ${Math.round((ganancia * porcentajes[b]) / 100).toLocaleString("es-MX")}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p
          className={`text-xs mt-2 ${
            Math.round(sumaPorcentajes) === 100 ? "text-[var(--muted)]" : "text-red-500"
          }`}
        >
          Suma: {sumaPorcentajes}% {Math.round(sumaPorcentajes) !== 100 && "(debe ser 100%)"}
        </p>

        <div className="flex gap-2 mt-3">
          <button
            onClick={confirmarVentaYReparto}
            disabled={guardando}
            className="bg-[var(--moranda)] text-white text-sm px-4 py-2 rounded-lg hover:bg-[var(--moranda-light)] disabled:opacity-40"
          >
            {guardando ? "Guardando..." : "Confirmar venta y reparto"}
          </button>
          <button onClick={() => setPidiendoReparto(false)} className="text-sm text-[var(--muted)] px-2">
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  // --- pidiendo un monto antes de avanzar ---
  if (pidiendoDato) {
    return (
      <div className="bg-[var(--surface)] rounded-2xl p-5 border border-[var(--border)] flex items-center gap-2 flex-wrap">
        <span className="text-sm text-[var(--ink)] whitespace-nowrap">
          {pidiendoDato === "vendido" ? "¿Por cuánto lo vendiste?" : CAMPO_REQUERIDO[pidiendoDato].pregunta}
        </span>
        <input
          type="number"
          autoFocus
          value={valorInput}
          onChange={(e) => setValorInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && confirmarPrecio()}
          placeholder="$"
          className="border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm w-28 font-mono"
        />
        <button
          onClick={confirmarPrecio}
          disabled={guardando}
          className="bg-[var(--moranda)] text-white text-sm px-3 py-1.5 rounded-lg hover:bg-[var(--moranda-light)] disabled:opacity-40"
        >
          {guardando ? "..." : "Siguiente"}
        </button>
        <button onClick={() => setPidiendoDato(null)} className="text-sm text-[var(--muted)] px-2">
          Cancelar
        </button>
      </div>
    );
  }

  // --- botón grande principal: estatus actual -> siguiente ---
  return (
    <div>
      <button
        onClick={() => siguientePrincipal && iniciarAvance(siguientePrincipal)}
        disabled={guardando || !siguientePrincipal}
        className="w-full rounded-2xl px-6 py-5 flex items-center justify-between transition-transform active:scale-[0.99] disabled:opacity-50"
        style={{ backgroundColor: configActual.color }}
      >
        <span className="font-display text-white text-lg tracking-wide uppercase">
          {configActual.label}
        </span>
        <span className="flex items-center gap-2 text-white/90 text-sm">
          {guardando ? "..." : configSiguiente?.label}
          <span className="text-xl">→</span>
        </span>
      </button>

      {opciones.includes("descartado") && (
        <button
          onClick={() => iniciarAvance("descartado")}
          disabled={guardando}
          className="w-full text-center text-xs text-[var(--muted)] hover:text-red-500 mt-2 py-1"
        >
          Descartar este carro
        </button>
      )}
    </div>
  );
}