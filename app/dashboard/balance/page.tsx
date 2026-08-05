// app/dashboard/balance/page.tsx

import { createClient } from "@/lib/supabase/server";
import { FormCapital } from "./formcapital";
import { GraficoBalance } from "./graficobalance";
import { ExportarCsv } from "./exportarcsv";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Balance",
};

type Evento = { fecha: string; concepto: string; monto: number };

export default async function BalancePage() {
  const supabase = await createClient();

  const [
    { data: movimientosCapital },
    { data: historial },
    { data: gastos },
    { data: itemsRecon },
  ] = await Promise.all([
    supabase.from("capital_movimientos").select("*").order("fecha", { ascending: true }),
    supabase
      .from("historial_estado")
      .select("carro_id, estado_nuevo, created_at, carros(marca, modelo, anio, precio_negociado, precio_venta_final)")
      .in("estado_nuevo", ["comprado", "vendido"])
      .order("created_at", { ascending: true }),
    supabase.from("gastos").select("*").order("fecha", { ascending: true }),
    supabase
      .from("items_recon")
      .select("*")
      .eq("atendido", true)
      .order("created_at", { ascending: true }),
  ]);

  const eventos: Evento[] = [];

  (movimientosCapital ?? []).forEach((m) => {
    eventos.push({
      fecha: m.fecha,
      concepto: m.motivo || (m.tipo === "aporte" ? "Aporte de capital" : "Retiro de capital"),
      monto: m.tipo === "aporte" ? Number(m.monto) : -Number(m.monto),
    });
  });

  (historial ?? []).forEach((h: any) => {
    const carro = h.carros;
    if (!carro) return;
    const titulo = `${carro.marca ?? ""} ${carro.modelo ?? ""} ${carro.anio ?? ""}`.trim();
    const fecha = h.created_at.slice(0, 10);

    if (h.estado_nuevo === "comprado" && carro.precio_negociado) {
      eventos.push({ fecha, concepto: `Compra: ${titulo}`, monto: -Number(carro.precio_negociado) });
    }
    if (h.estado_nuevo === "vendido" && carro.precio_venta_final) {
      eventos.push({ fecha, concepto: `Venta: ${titulo}`, monto: Number(carro.precio_venta_final) });
    }
  });

  (gastos ?? []).forEach((g) => {
    eventos.push({ fecha: g.fecha, concepto: `Gasto: ${g.descripcion ?? g.tipo}`, monto: -Number(g.monto) });
  });

  (itemsRecon ?? []).forEach((i) => {
    if (i.costo_real) {
      eventos.push({
        fecha: i.created_at.slice(0, 10),
        concepto: `Recon: ${i.descripcion}`,
        monto: -Number(i.costo_real),
      });
    }
  });

  eventos.sort((a, b) => a.fecha.localeCompare(b.fecha));

  let acumulado = 0;
  const movimientos = eventos.map((e) => {
    acumulado += e.monto;
    return { ...e, saldo: acumulado };
  });

  const saldoActual = acumulado;
  const puntosGrafica = movimientos.map((m) => ({ fecha: m.fecha, saldo: m.saldo }));

  return (
    <main className="max-w-3xl mx-auto p-6 md:p-8">
      <header className="mb-6">
        <h1 className="font-display text-3xl text-[var(--ink)]">Balance</h1>
      </header>

      <section className="bg-[var(--surface)] rounded-2xl p-5 border border-[var(--border)] mb-6">
        <p className="text-xs text-[var(--muted)] mb-1">Saldo actual</p>
        <p className="font-mono text-3xl text-[var(--moranda)] mb-4">
          ${saldoActual.toLocaleString("es-MX")}
        </p>
        <GraficoBalance puntos={puntosGrafica} />
      </section>

      <div className="mb-6">
        <FormCapital />
      </div>

      <section className="bg-[var(--surface)] rounded-2xl p-5 border border-[var(--border)]">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-medium text-[var(--ink)]">Movimientos</h2>
          <ExportarCsv movimientos={movimientos} />
        </div>

        {movimientos.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Sin movimientos todavía.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[var(--muted)] text-xs">
                  <th className="pb-2 pr-3">Fecha</th>
                  <th className="pb-2 pr-3">Concepto</th>
                  <th className="pb-2 pr-3 text-right">Monto</th>
                  <th className="pb-2 text-right">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {[...movimientos].reverse().map((m, i) => (
                  <tr key={i} className="border-t border-[var(--border)]">
                    <td className="py-2 pr-3 font-mono text-xs text-[var(--muted)] whitespace-nowrap">
                      {m.fecha}
                    </td>
                    <td className="py-2 pr-3 truncate max-w-[180px]">{m.concepto}</td>
                    <td
                      className={`py-2 pr-3 text-right font-mono whitespace-nowrap ${
                        m.monto >= 0 ? "text-[var(--st-vendido)]" : "text-[var(--st-descartado)]"
                      }`}
                    >
                      {m.monto >= 0 ? "+" : ""}
                      {m.monto.toLocaleString("es-MX")}
                    </td>
                    <td className="py-2 text-right font-mono whitespace-nowrap">
                      ${m.saldo.toLocaleString("es-MX")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}