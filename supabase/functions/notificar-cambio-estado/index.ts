// supabase/functions/notificar-cambio-estado/index.ts
//
// Se dispara vía Database Webhook cada vez que se inserta una fila en
// historial_estado (o sea, cada vez que cambia el estatus de un carro).
// Manda un correo por Brevo a los socios con email_opt_in = true.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY")!;

const LABELS: Record<string, string> = {
  prospecto: "Prospecto",
  negociacion_compra: "Negociando compra",
  comprado: "Comprado",
  descartado: "Descartado",
  en_recon: "En recon",
  publicado: "Publicado",
  negociacion_venta: "Negociando venta",
  vendido: "Vendido",
};

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const record = payload.record;

    if (!record) {
      return new Response(JSON.stringify({ ok: false, error: "Sin record" }), { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // 1. Traemos el carro para saber de qué estamos hablando
    const { data: carro } = await supabase
      .from("carros")
      .select("marca, modelo, anio")
      .eq("id", record.carro_id)
      .single();

    const nombreCarro = carro
      ? `${carro.marca ?? ""} ${carro.modelo ?? ""} ${carro.anio ?? ""}`.trim()
      : "un carro";

    // 2. Traemos los perfiles con email_opt_in = true
    const { data: perfiles } = await supabase
      .from("profiles")
      .select("id, nombre, email_opt_in")
      .eq("email_opt_in", true);

    if (!perfiles || perfiles.length === 0) {
      return new Response(JSON.stringify({ ok: true, mensaje: "Nadie con opt-in activo" }));
    }

    // 3. Sacamos los correos reales desde auth.users (profiles no guarda el email)
    const { data: usuarios } = await supabase.auth.admin.listUsers();
    const idsConOptIn = new Set(perfiles.map((p) => p.id));
    const destinatarios = (usuarios?.users ?? [])
      .filter((u) => idsConOptIn.has(u.id) && u.email)
      .map((u) => ({ email: u.email as string }));

    if (destinatarios.length === 0) {
      return new Response(JSON.stringify({ ok: true, mensaje: "Sin correos válidos" }));
    }

    // 4. Armamos y mandamos el correo por Brevo
    const estadoAnterior = LABELS[record.estado_anterior] ?? record.estado_anterior ?? "—";
    const estadoNuevo = LABELS[record.estado_nuevo] ?? record.estado_nuevo;

    const resBrevo = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { name: "Notificaciones Moranda", email: "notificaciones@morandagroup.com" },
        to: destinatarios,
        subject: `${nombreCarro}: ${estadoAnterior} → ${estadoNuevo}`,
        htmlContent: `
          <p><strong>${nombreCarro}</strong> cambió de estatus:</p>
          <p>${estadoAnterior} → <strong>${estadoNuevo}</strong></p>
          <p><a href="https://TU-DOMINIO-DE-PRODUCCION.com/dashboard/carros/${record.carro_id}">Ver carro →</a></p>
        `,
      }),
    });

    if (!resBrevo.ok) {
      const errorTexto = await resBrevo.text();
      console.error("Error de Brevo:", errorTexto);
      return new Response(JSON.stringify({ ok: false, error: errorTexto }), { status: 500 });
    }

    return new Response(JSON.stringify({ ok: true, enviados: destinatarios.length }));
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500 });
  }
});