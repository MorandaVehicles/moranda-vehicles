// app/dashboard/carros/[id]/page.tsx

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { CambiarEstatus } from "./cambiarestatus";
import { GaleriaFotos } from "./galeriafotos";
import { CampoEditable } from "./campoeditable";
import { Chatbot } from "./chatbot";
import { BotonIcv } from "./botonicv";
import { ItemsRecon } from "./itemsrecon";
import { FormGasto } from "./formgasto";
import { BotonBorrar } from "./botonborrar";

export default async function DetalleCarroPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: carro, error } = await supabase
    .from("carros")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !carro) {
    notFound();
  }

  const [{ data: gastos }, { data: itemsRecon }] = await Promise.all([
    supabase.from("gastos").select("*").eq("carro_id", id).order("fecha", { ascending: false }),
    supabase.from("items_recon").select("*").eq("carro_id", id).order("created_at", { ascending: true }),
  ]);

  const totalGastos = (gastos ?? []).reduce((sum, g) => sum + Number(g.monto), 0);
  const titulo = `${carro.marca ?? "Sin marca"} ${carro.modelo ?? ""} ${carro.anio ?? ""}`.trim();

  return (
    <main className="max-w-3xl mx-auto p-6 md:p-8">
      <div className="flex justify-between items-center">
        <a
          href="/dashboard"
          className="inline-flex items-center text-sm font-medium text-[var(--moranda)] bg-[var(--moranda)]/8 hover:bg-[var(--moranda)]/15 rounded-full px-3.5 py-1.5 transition-colors"
        >
          Tablero
        </a>
        <BotonBorrar carroId={carro.id} titulo={titulo} />
      </div>

      <header className="mt-4 mb-6">
        <h1 className="font-display text-3xl text-[var(--ink)]">
          <span className="text-[var(--muted)] font-mono text-xl align-middle">#{carro.folio}</span>{" "}
          {titulo}
        </h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          Estatus actual: <strong className="text-[var(--moranda)]">{carro.estado}</strong>
        </p>
      </header>

      <CambiarEstatus
        carroId={carro.id}
        estadoActual={carro.estado}
        precioNegociado={carro.precio_negociado}
      />

      <GaleriaFotos
        fotos={carro.fotos_urls ?? []}
        titulo={`${carro.marca ?? ""} ${carro.modelo ?? ""}`.trim()}
      />

      <section className="mt-8 bg-[var(--surface)] rounded-xl p-5 border border-[var(--moranda)]/10">
        <h2 className="font-medium text-[var(--ink)] mb-3">Datos</h2>
        <dl className="grid grid-cols-2 gap-y-3 text-sm">
          <CampoEditable carroId={carro.id} campo="motor" label="Motor" valor={carro.motor} />
          <CampoEditable
            carroId={carro.id}
            campo="kilometraje"
            label="Kilometraje"
            valor={carro.kilometraje}
            tipo="number"
          />
          <CampoEditable carroId={carro.id} campo="placa" label="Placa" valor={carro.placa} />
          <CampoEditable
            carroId={carro.id}
            campo="precio_listado"
            label="Precio listado"
            valor={carro.precio_listado}
            tipo="money"
          />
          <CampoEditable
            carroId={carro.id}
            campo="precio_negociado"
            label="Precio negociado"
            valor={carro.precio_negociado}
            tipo="money"
          />
          <CampoEditable
            carroId={carro.id}
            campo="precio_venta_final"
            label="Precio de venta"
            valor={carro.precio_venta_final}
            tipo="money"
          />
          <CampoEditable
            carroId={carro.id}
            campo="adeudo_monto"
            label="Adeudo"
            valor={carro.adeudo_monto}
            tipo="money"
          />
          <CampoEditable
            carroId={carro.id}
            campo="transmision"
            label="Transmisión"
            valor={carro.transmision}
          />
          <CampoEditable
            carroId={carro.id}
            campo="clima"
            label="Clima"
            valor={carro.clima}
            tipo="boolean"
          />
        </dl>
        {carro.caracteristicas && carro.caracteristicas.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {carro.caracteristicas.map((c: string, i: number) => (
              <span
                key={i}
                className="text-xs bg-[var(--moranda)]/8 text-[var(--moranda)] rounded-full px-3 py-1"
              >
                {c}
              </span>
            ))}
          </div>
        )}

        <BotonIcv placa={carro.placa} />

        {carro.url_marketplace && (
          <a
            href={carro.url_marketplace}
            target="_blank"
            className="inline-block mt-4 text-sm text-[var(--moranda)] hover:underline"
          >
            Ver anuncio original →
          </a>
        )}
      </section>

      <ItemsRecon carroId={carro.id} items={itemsRecon ?? []} />

      <section className="mt-6 bg-[var(--surface)] rounded-xl p-5 border border-[var(--moranda)]/10">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-medium text-[var(--ink)]">Gastos</h2>
          <span className="font-mono text-sm text-[var(--gold)]">
            Total: ${totalGastos.toLocaleString("es-MX")}
          </span>
        </div>
        {gastos && gastos.length > 0 ? (
          <ul className="space-y-2">
            {gastos.map((g) => (
              <li key={g.id} className="flex justify-between gap-2 text-sm">
                <span className="truncate min-w-0">
                  {g.tipo} — {g.descripcion ?? "sin descripción"}
                </span>
                <span className="font-mono flex-shrink-0">${Number(g.monto).toLocaleString("es-MX")}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[var(--muted)]">Sin gastos registrados aún</p>
        )}
        <FormGasto carroId={carro.id} />
      </section>

      <Chatbot
        tituloCarro={titulo}
        contextoCarro={`
Título: ${titulo}
Motor: ${carro.motor ?? "no especificado"}
Kilometraje: ${carro.kilometraje ?? "no especificado"}
Transmisión: ${carro.transmision ?? "no especificada"}
Clima: ${carro.clima === true ? "sí tiene" : carro.clima === false ? "no tiene" : "no especificado"}
Características: ${carro.caracteristicas?.join(", ") || "ninguna registrada"}
Precio de compra: ${carro.precio_negociado ? `$${carro.precio_negociado}` : "no especificado"}
Precio listado originalmente: ${carro.precio_listado ? `$${carro.precio_listado}` : "no especificado"}
Estatus actual: ${carro.estado}
        `.trim()}
      />
    </main>
  );
}