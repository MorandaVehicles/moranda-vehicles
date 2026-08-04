"use client";

import { useState } from "react";

const URL_ICV = "https://www.icvnl.gob.mx/EstadodeCuenta";

export function BotonIcv({ placa }: { placa: string | null }) {
  const [copiado, setCopiado] = useState(false);

  if (!placa) {
    return (
      <p className="text-xs text-[var(--muted)] mt-2">
        Agrega la placa para poder consultar adeudos en el ICV.
      </p>
    );
  }

  async function consultarAdeudo() {
    try {
      await navigator.clipboard.writeText(placa as string);
      setCopiado(true);
      window.open(URL_ICV, "_blank");
      setTimeout(() => setCopiado(false), 4000);
    } catch {
      // si el navegador bloquea el clipboard (poco común), igual abrimos el ICV
      window.open(URL_ICV, "_blank");
    }
  }

  return (
    <div className="mt-3">
      <button
        onClick={consultarAdeudo}
        className="text-sm font-medium text-[var(--moranda)] bg-[var(--moranda)]/8 hover:bg-[var(--moranda)]/15 rounded-full px-3.5 py-1.5 transition-colors"
      >
        Consultar adeudo en ICV
      </button>
      {copiado && (
        <p className="text-xs text-[var(--muted)] mt-1">
          Placa "{placa}" copiada — pégala (Ctrl+V) en el buscador que se abrió.
        </p>
      )}
    </div>
  );
}