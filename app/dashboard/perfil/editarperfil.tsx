"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function EditarPerfil({
  userId,
  nombre: nombreInicial,
  avatarUrl: avatarInicial,
  emailOptIn: optInInicial,
  beneficiarioKey: beneficiarioInicial,
}: {
  userId: string;
  nombre: string;
  avatarUrl: string | null;
  emailOptIn: boolean;
  beneficiarioKey: string | null;
}) {
  const [nombre, setNombre] = useState(nombreInicial);
  const [avatarUrl, setAvatarUrl] = useState(avatarInicial);
  const [emailOptIn, setEmailOptIn] = useState(optInInicial);
  const [beneficiario, setBeneficiario] = useState(beneficiarioInicial ?? "");
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const inputFotoRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function subirFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setSubiendoFoto(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const nombreArchivo = `${userId}-${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from("avatars").upload(nombreArchivo, file, {
      upsert: true,
    });

    if (error) {
      setSubiendoFoto(false);
      alert("No se pudo subir la foto: " + error.message);
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(nombreArchivo);
    setAvatarUrl(data.publicUrl);
    setSubiendoFoto(false);
  }

  async function guardar() {
    setGuardando(true);
    const supabase = createClient();

    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: userId,
        nombre,
        avatar_url: avatarUrl,
        email_opt_in: emailOptIn,
        beneficiario_key: beneficiario || null,
      });

    setGuardando(false);

    if (error) {
      alert("No se pudo guardar: " + error.message);
      return;
    }

    setGuardado(true);
    router.refresh();
    setTimeout(() => setGuardado(false), 2500);
  }

  return (
    <div className="bg-[var(--surface)] rounded-xl p-5 border border-[var(--moranda)]/10 space-y-4">
      <div className="flex items-center gap-4">
        <button
          onClick={() => inputFotoRef.current?.click()}
          className="relative w-16 h-16 rounded-full overflow-hidden bg-[var(--moranda)]/10 flex-shrink-0 hover:opacity-80"
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="Foto de perfil" className="w-full h-full object-cover" />
          ) : (
            <span className="w-full h-full flex items-center justify-center text-[var(--moranda)] text-xl font-medium">
              {nombre.charAt(0).toUpperCase() || "?"}
            </span>
          )}
          {subiendoFoto && (
            <span className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs">
              ...
            </span>
          )}
        </button>
        <input
          ref={inputFotoRef}
          type="file"
          accept="image/*"
          onChange={subirFoto}
          className="hidden"
        />
        <div className="flex-1">
          <label className="text-xs text-[var(--muted)]">Nombre</label>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full border border-[var(--muted)]/30 rounded-lg px-3 py-1.5 text-sm mt-1"
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <label className="text-sm text-[var(--ink)]">Recibir notificaciones por correo</label>
        <input
          type="checkbox"
          checked={emailOptIn}
          onChange={(e) => setEmailOptIn(e.target.checked)}
          className="accent-[var(--moranda)] w-4 h-4"
        />
      </div>

      <div>
        <label className="text-xs text-[var(--muted)]">Este perfil corresponde a</label>
        <select
          value={beneficiario}
          onChange={(e) => setBeneficiario(e.target.value)}
          className="w-full border border-[var(--muted)]/30 rounded-lg px-3 py-1.5 text-sm mt-1"
        >
          <option value="">Sin asignar</option>
          <option value="jorge">Jorge</option>
          <option value="rolando">Rolando</option>
        </select>
        <p className="text-xs text-[var(--muted)] mt-1">
          Esto conecta tu perfil con tu parte del reparto de ganancias.
        </p>
      </div>

      <button
        onClick={guardar}
        disabled={guardando}
        className="w-full bg-[var(--moranda)] text-white text-sm py-2 rounded-lg hover:bg-[var(--moranda-light)] disabled:opacity-40"
      >
        {guardando ? "Guardando..." : guardado ? "✓ Guardado" : "Guardar cambios"}
      </button>
    </div>
  );
}