// app/dashboard/carrocard.tsx

import { CONFIG_ESTATUS } from "./badgeestatus";

type Carro = {
  id: string;
  folio: number;
  estado: string;
  marca: string | null;
  modelo: string | null;
  anio: number | null;
  placa: string | null;
  precio_listado: number | null;
  precio_negociado: number | null;
  precio_venta_final: number | null;
  fotos_urls: string[] | null;
};

const formatoMoneda = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
});

export function CarroCard({ carro }: { carro: Carro }) {
  const titulo =
    carro.marca || carro.modelo
      ? `${carro.marca ?? ""} ${carro.modelo ?? ""} ${carro.anio ?? ""}`.trim()
      : "Sin datos aún";

  const precioMostrar =
    carro.precio_venta_final ?? carro.precio_negociado ?? carro.precio_listado;

  const foto = carro.fotos_urls?.[0];
  const config = CONFIG_ESTATUS[carro.estado] ?? { color: "var(--muted)", label: carro.estado };

  return (
    <a
      href={`/dashboard/carros/${carro.id}`}
      className="group block bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className="relative aspect-[4/3] bg-[var(--bg)]">
        {foto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={foto}
            alt={titulo}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--muted)] text-xs">
            Sin foto
          </div>
        )}

        <span
          className="absolute top-2.5 left-2.5 text-xs font-medium px-2.5 py-1 rounded-full"
          style={{ backgroundColor: config.color, color: "white" }}
        >
          {config.label}
        </span>

        <span className="absolute top-2.5 right-2.5 text-xs font-mono text-white bg-black/50 px-2 py-1 rounded-full">
          #{carro.folio}
        </span>
      </div>

      <div className="p-3">
        <p className="font-medium text-[var(--ink)] text-sm truncate">{titulo}</p>
        {carro.placa && (
          <p className="font-mono text-xs text-[var(--muted)] mt-0.5">{carro.placa}</p>
        )}
        {precioMostrar != null && (
          <p className="font-mono text-[var(--moranda)] text-sm mt-0.5">
            {formatoMoneda.format(precioMostrar)}
          </p>
        )}
      </div>
    </a>
  );
}