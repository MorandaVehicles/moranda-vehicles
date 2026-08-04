"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const LINKS = [
  { href: "/dashboard", label: "Tablero" },
  { href: "/dashboard/ganancias", label: "Ganancias" },
];

export function Sidebar({ nombre, avatarUrl }: { nombre: string | null; avatarUrl: string | null }) {
  const [abierto, setAbierto] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  async function cerrarSesion() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const contenido = (
    <div className="flex flex-col h-full">
      <div className="px-5 py-5">
        <Link href="/dashboard" className="font-display text-lg text-[var(--ink)]">
          Moranda Vehicles
        </Link>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {LINKS.map((link) => {
          const activo = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setAbierto(false)}
              className={`block text-sm px-3 py-2 rounded-lg transition-colors ${
                activo
                  ? "bg-[var(--moranda)]/10 text-[var(--moranda)] font-medium"
                  : "text-[var(--muted)] hover:bg-[var(--bg)] hover:text-[var(--ink)]"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-[var(--border)] space-y-1">
        <Link
          href="/dashboard/perfil"
          onClick={() => setAbierto(false)}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[var(--bg)] transition-colors"
        >
          <span className="w-8 h-8 rounded-full overflow-hidden bg-[var(--moranda)]/10 flex items-center justify-center flex-shrink-0">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs text-[var(--moranda)] font-medium">
                {nombre?.charAt(0).toUpperCase() ?? "?"}
              </span>
            )}
          </span>
          <span className="text-sm text-[var(--ink)] truncate">{nombre ?? "Perfil"}</span>
        </Link>
        <button
          onClick={cerrarSesion}
          className="w-full text-left text-sm text-[var(--muted)] hover:text-red-500 px-3 py-1.5 transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* barra superior solo en celular, con botón de hamburguesa */}
      <div className="md:hidden sticky top-0 z-40 bg-[var(--surface)] border-b border-[var(--border)] h-14 flex items-center gap-3 px-4">
        <button
          onClick={() => setAbierto(true)}
          className="w-9 h-9 flex flex-col items-center justify-center gap-1 -ml-2"
          aria-label="Abrir menú"
        >
          <span className="w-5 h-0.5 bg-[var(--ink)] rounded-full" />
          <span className="w-5 h-0.5 bg-[var(--ink)] rounded-full" />
          <span className="w-5 h-0.5 bg-[var(--ink)] rounded-full" />
        </button>
        <Link href="/dashboard" className="font-display text-base text-[var(--ink)]">
          Moranda Vehicles
        </Link>
      </div>

      {/* overlay + drawer en celular */}
      {abierto && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setAbierto(false)}
        />
      )}
      <aside
        className={`md:hidden fixed top-0 left-0 h-full w-64 bg-[var(--surface)] z-50 transition-transform duration-200 ${
          abierto ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {contenido}
      </aside>

      {/* sidebar fija en desktop */}
      <aside className="hidden md:flex md:flex-col md:fixed md:top-0 md:left-0 md:h-full md:w-64 bg-[var(--surface)] border-r border-[var(--border)]">
        {contenido}
      </aside>
    </>
  );
}