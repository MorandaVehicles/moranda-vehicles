// app/dashboard/ganancias/page.tsx

import { createClient } from "@/lib/supabase/server";
import { SelectorMes } from "./selectormes";

const BENEFICIARIOS = ["jorge", "rolando", "empresa"] as const;

function inicioDeSemanaISO(fecha: Date) {
  const d = new Date(fecha);
  const dia = d.getDay() || 7; // domingo = 7
  d.setDate(d.getDate() - dia + 1); // lunes de esa semana
  d.setHours(0, 0, 0, 0);
  return d;
}

export default async function GananciasPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes } = await searchParams;
  const supabase = await createClient();

  const hoy = new Date();
  const mesSeleccionado = mes ?? `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;
  const [anioSel, mesSel] = mesSeleccionado.split("-").map(Number);

  const inicioMes = new Date(anioSel, mesSel - 1, 1);
  const finMes = new Date(anioSel, mesSel, 1);

  const { data: repartos } = await supabase
    .from("reparto_utilidades")
    .select("beneficiario, monto, fecha")
    .order("fecha", { ascending: true });

  const todos = repartos ?? [];

  // --- histórico total por beneficiario ---
  const historico: Record<string, number> = { jorge: 0, rolando: 0, empresa: 0 };
  todos.forEach((r) => {
    if (r.beneficiario) historico[r.beneficiario] = (historico[r.beneficiario] ?? 0) + Number(r.monto);
  });

  // --- filtrado del mes elegido ---
  const delMes = todos.filter((r) => {
    const f = new Date(r.fecha);
    return f >= inicioMes && f < finMes;
  });

  const totalesMes: Record<string, number> = { jorge: 0, rolando: 0, empresa: 0 };
  delMes.forEach((r) => {
    if (r.beneficiario) totalesMes[r.beneficiario] = (totalesMes[r.beneficiario] ?? 0) + Number(r.monto);
  });

  // --- desglose semanal dentro del mes ---
  const semanas: Record<string, Record<string, number>> = {};
  delMes.forEach((r) => {
    const inicioSemana = inicioDeSemanaISO(new Date(r.fecha));
    const clave = inicioSemana.toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
    if (!semanas[clave]) semanas[clave] = { jorge: 0, rolando: 0, empresa: 0 };
    if (r.beneficiario) semanas[clave][r.beneficiario] += Number(r.monto);
  });

  const nombreMes = inicioMes.toLocaleDateString("es-MX", { month: "long", year: "numeric" });

  return (
    <main className="max-w-3xl mx-auto p-6 md:p-8">
      <header className="mb-6">
        <h1 className="font-display text-3xl text-[var(--ink)]">Ganancias</h1>
      </header>

      {/* histórico */}
      <section className="bg-[var(--surface)] rounded-xl p-5 border border-[var(--moranda)]/10 mb-6">
        <h2 className="font-medium text-[var(--ink)] mb-3">Histórico total</h2>
        <div className="grid grid-cols-3 gap-4">
          {BENEFICIARIOS.map((b) => (
            <div key={b}>
              <p className="text-xs text-[var(--muted)] capitalize">{b}</p>
              <p className="font-mono text-lg text-[var(--moranda)]">
                ${historico[b].toLocaleString("es-MX")}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* mensual con selector */}
      <section className="bg-[var(--surface)] rounded-xl p-5 border border-[var(--moranda)]/10 mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-medium text-[var(--ink)] capitalize">{nombreMes}</h2>
          <SelectorMes mesActual={mesSeleccionado} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          {BENEFICIARIOS.map((b) => (
            <div key={b}>
              <p className="text-xs text-[var(--muted)] capitalize">{b}</p>
              <p className="font-mono text-lg text-[var(--gold)]">
                ${totalesMes[b].toLocaleString("es-MX")}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* semanal dentro del mes */}
      <section className="bg-[var(--surface)] rounded-xl p-5 border border-[var(--moranda)]/10">
        <h2 className="font-medium text-[var(--ink)] mb-3">Desglose semanal</h2>
        {Object.keys(semanas).length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Sin ventas registradas este mes.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--muted)] text-xs">
                <th className="pb-2">Semana de</th>
                {BENEFICIARIOS.map((b) => (
                  <th key={b} className="pb-2 text-right capitalize">
                    {b}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(semanas).map(([clave, montos]) => (
                <tr key={clave} className="border-t border-[var(--muted)]/10">
                  <td className="py-2">{clave}</td>
                  {BENEFICIARIOS.map((b) => (
                    <td key={b} className="py-2 text-right font-mono">
                      ${montos[b].toLocaleString("es-MX")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}