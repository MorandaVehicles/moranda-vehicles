"use client";

type Punto = { fecha: string; saldo: number };

export function GraficoBalance({ puntos }: { puntos: Punto[] }) {
  if (puntos.length < 2) {
    return (
      <div className="h-48 flex items-center justify-center text-sm text-[var(--muted)]">
        Necesitas al menos 2 movimientos para ver la gráfica.
      </div>
    );
  }

  const ancho = 600;
  const alto = 180;
  const margen = 10;

  const saldos = puntos.map((p) => p.saldo);
  const min = Math.min(...saldos, 0);
  const max = Math.max(...saldos);
  const rango = max - min || 1;

  const coords = puntos.map((p, i) => {
    const x = margen + (i / (puntos.length - 1)) * (ancho - margen * 2);
    const y = alto - margen - ((p.saldo - min) / rango) * (alto - margen * 2);
    return { x, y };
  });

  const pathLinea = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");
  const pathArea = `${pathLinea} L ${coords[coords.length - 1].x} ${alto} L ${coords[0].x} ${alto} Z`;

  const yCero = alto - margen - ((0 - min) / rango) * (alto - margen * 2);

  return (
    <svg viewBox={`0 0 ${ancho} ${alto}`} className="w-full h-48">
      <line
        x1={margen}
        y1={yCero}
        x2={ancho - margen}
        y2={yCero}
        stroke="var(--muted)"
        strokeWidth={1}
        strokeDasharray="4 4"
        opacity={0.4}
      />
      <path d={pathArea} fill="var(--moranda)" opacity={0.08} />
      <path d={pathLinea} fill="none" stroke="var(--moranda)" strokeWidth={2} />
      {coords.map((c, i) => (
        <circle key={i} cx={c.x} cy={c.y} r={2.5} fill="var(--moranda)" />
      ))}
    </svg>
  );
}