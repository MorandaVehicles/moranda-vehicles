export const CONFIG_ESTATUS: Record<string, { color: string; label: string }> = {
  prospecto: { color: "var(--st-prospecto)", label: "Prospecto" },
  negociacion_compra: { color: "var(--st-negociacion)", label: "Negociando compra" },
  comprado: { color: "var(--st-comprado)", label: "Comprado" },
  en_recon: { color: "var(--st-recon)", label: "En recon" },
  publicado: { color: "var(--st-publicado)", label: "Publicado" },
  negociacion_venta: { color: "var(--st-negociacion)", label: "Negociando venta" },
  vendido: { color: "var(--st-vendido)", label: "Vendido" },
  descartado: { color: "var(--st-descartado)", label: "Descartado" },
};

export function BadgeEstatus({ estado }: { estado: string }) {
  const config = CONFIG_ESTATUS[estado] ?? { color: "var(--muted)", label: estado };

  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0"
      style={{ backgroundColor: `${config.color}15`, color: config.color }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: config.color }}
      />
      {config.label}
    </span>
  );
}