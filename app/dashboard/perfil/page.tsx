// app/dashboard/perfil/page.tsx

import { createClient } from "@/lib/supabase/server";
import { EditarPerfil } from "./editarperfil";

const COLORES_BENEFICIARIO: Record<string, string> = {
  jorge: "#7c2855",
  rolando: "#b8862f",
  empresa: "#8a7690",
};

export default async function PerfilPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: perfil } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // ganancias por beneficiario (para el pie chart y el total del perfil)
  const { data: repartos } = await supabase.from("reparto_utilidades").select("beneficiario, monto");

  const totales: Record<string, number> = { jorge: 0, rolando: 0, empresa: 0 };
  (repartos ?? []).forEach((r) => {
    if (r.beneficiario) totales[r.beneficiario] = (totales[r.beneficiario] ?? 0) + Number(r.monto);
  });

  const totalGeneral = totales.jorge + totales.rolando + totales.empresa;
  const miBeneficiario = perfil?.beneficiario_key as string | undefined;
  const miTotal = miBeneficiario ? totales[miBeneficiario] ?? 0 : 0;

  const gradiente = (() => {
    let acumulado = 0;
    const partes = (["jorge", "rolando", "empresa"] as const).map((b) => {
      const pct = totalGeneral > 0 ? (totales[b] / totalGeneral) * 100 : 33.33;
      const inicio = (acumulado / 100) * 360;
      acumulado += pct;
      const fin = (acumulado / 100) * 360;
      return `${COLORES_BENEFICIARIO[b]} ${inicio}deg ${fin}deg`;
    });
    return `conic-gradient(${partes.join(", ")})`;
  })();

  return (
    <main className="max-w-lg mx-auto p-6 md:p-8">
      <header className="mb-6">
        <h1 className="font-display text-3xl text-[var(--ink)]">Mi perfil</h1>
      </header>

      <EditarPerfil
        userId={user.id}
        nombre={perfil?.nombre ?? ""}
        avatarUrl={perfil?.avatar_url ?? null}
        emailOptIn={perfil?.email_opt_in ?? false}
        beneficiarioKey={miBeneficiario ?? null}
      />

      {miBeneficiario && (
        <section className="mt-6 bg-[var(--surface)] rounded-xl p-5 border border-[var(--moranda)]/10">
          <h2 className="font-medium text-[var(--ink)] mb-3">Mis ganancias</h2>
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full flex-shrink-0" style={{ background: gradiente }} />
            <div>
              <p className="text-xs text-[var(--muted)]">Total histórico</p>
              <p className="font-mono text-2xl text-[var(--moranda)]">
                ${miTotal.toLocaleString("es-MX")}
              </p>
              <p className="text-xs text-[var(--muted)] mt-1">
                {totalGeneral > 0 ? ((miTotal / totalGeneral) * 100).toFixed(1) : "0"}% del total
                repartido entre todos
              </p>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}