"use client";

type Movimiento = { fecha: string; concepto: string; monto: number; saldo: number };

export function ExportarCsv({ movimientos }: { movimientos: Movimiento[] }) {
  function exportar() {
    const encabezado = "Fecha,Concepto,Monto,Saldo acumulado\n";
    const filas = movimientos
      .map((m) => `${m.fecha},"${m.concepto.replace(/"/g, '""')}",${m.monto},${m.saldo}`)
      .join("\n");

    const csv = encabezado + filas;
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `balance-moranda-vehicles-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={exportar}
      className="text-sm font-medium text-[var(--moranda)] bg-[var(--moranda)]/8 hover:bg-[var(--moranda)]/15 rounded-full px-3.5 py-1.5 transition-colors"
    >
      Exportar CSV
    </button>
  );
}