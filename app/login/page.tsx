"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [modo, setModo] = useState<"login" | "registro">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [registroExitoso, setRegistroExitoso] = useState(false);
  const router = useRouter();

  async function iniciarSesion(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setCargando(false);

    if (error) {
      setError("Correo o contraseña incorrectos.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function registrarse(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });

    setCargando(false);

    if (error) {
      setError("No se pudo crear la cuenta: " + error.message);
      return;
    }

    // creamos el perfil asociado (nombre, email_opt_in) si el usuario quedó creado
    if (data.user) {
      await supabase.from("profiles").insert({
        id: data.user.id,
        nombre: nombre || email.split("@")[0],
        email_opt_in: false,
      });
    }

    setRegistroExitoso(true);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-6">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl text-[var(--ink)] mb-1">
          Moranda Vehicles
        </h1>
        <p className="text-sm text-[var(--muted)] mb-8">
          Acceso solo para socios
        </p>

        {registroExitoso ? (
          <div className="border border-[var(--moranda)]/20 bg-[var(--moranda)]/5 rounded-lg p-5">
            <p className="text-sm text-[var(--ink)]">
              Cuenta creada. Revisa <strong>{email}</strong> y confirma tu correo con el
              enlace que te mandamos — después de eso ya puedes entrar con tu contraseña
              desde cualquier dispositivo.
            </p>
          </div>
        ) : (
          <>
            <div className="flex gap-1 mb-6 bg-[var(--moranda)]/5 rounded-lg p-1">
              <button
                onClick={() => setModo("login")}
                className={`flex-1 text-sm py-2 rounded-md transition-colors ${
                  modo === "login"
                    ? "bg-[var(--surface)] text-[var(--ink)] shadow-sm"
                    : "text-[var(--muted)]"
                }`}
              >
                Iniciar sesión
              </button>
              <button
                onClick={() => setModo("registro")}
                className={`flex-1 text-sm py-2 rounded-md transition-colors ${
                  modo === "registro"
                    ? "bg-[var(--surface)] text-[var(--ink)] shadow-sm"
                    : "text-[var(--muted)]"
                }`}
              >
                Crear cuenta
              </button>
            </div>

            <form
              onSubmit={modo === "login" ? iniciarSesion : registrarse}
              className="space-y-4"
            >
              {modo === "registro" && (
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Tu nombre"
                  className="w-full rounded-lg border border-[var(--muted)]/30 bg-[var(--surface)] px-4 py-3 text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--moranda)]"
                />
              )}

              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                className="w-full rounded-lg border border-[var(--muted)]/30 bg-[var(--surface)] px-4 py-3 text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--moranda)]"
              />

              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
                className="w-full rounded-lg border border-[var(--muted)]/30 bg-[var(--surface)] px-4 py-3 text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--moranda)]"
              />

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={cargando}
                className="w-full rounded-lg bg-[var(--moranda)] text-white py-3 font-medium hover:bg-[var(--moranda-light)] transition-colors disabled:opacity-50"
              >
                {cargando
                  ? "Un momento..."
                  : modo === "login"
                  ? "Entrar"
                  : "Crear cuenta"}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}