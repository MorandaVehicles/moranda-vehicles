"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function BotonBorrar({ carroId, titulo }: { carroId: string; titulo: string }) {
  const [borrando, setBorrando] = useState(false);
  const router = useRouter();

  async function borrar() {
    const confirmado = confirm(
      `¿Seguro que quieres borrar "${titulo}"? Esto no se puede deshacer.`
    );
    if (!confirmado) return;

    setBorrando(true);
    const supabase = createClient();
    const { error } = await supabase.from("carros").delete().eq("id", carroId);
    setBorrando(false);

    if (error) {
      alert("No se pudo borrar: " + error.message);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <button
      onClick={borrar}
      disabled={borrando}
      className="text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-full px-3.5 py-1.5 transition-colors disabled:opacity-50"
    >
      {borrando ? "Borrando..." : "Borrar carro"}
    </button>
  );
}