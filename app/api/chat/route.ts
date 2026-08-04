// app/api/chat/route.ts

import { NextRequest, NextResponse } from "next/server";

const GROQ_API_KEY = process.env.GROQ_API_KEY!;
const GROQ_MODEL = "llama-3.3-70b-versatile";

export async function POST(req: NextRequest) {
  try {
    const { mensaje, contextoCarro, historial } = await req.json();

    const systemPrompt = `Eres el asistente de Moranda Vehicles, un negocio de compra-venta de carros en Monterrey, México. Ayudas a estimar costos aproximados de reparaciones/modificaciones y respondes preguntas rápidas sobre el carro que se está viendo.

Datos del carro actual:
${contextoCarro}

Reglas:
- Responde en español, breve y directo (2-4 líneas normalmente).
- Cuando des un costo estimado, siempre acláralo como aproximado y en pesos mexicanos (MXN), y menciona que puede variar según el taller/refacción.
- Si la pregunta no tiene que ver con el carro o el negocio, responde brevemente igual pero puedes ser más general.
- No inventes datos específicos del carro que no te di — si no sabes algo del carro, dilo.`;

    const mensajes = [
      { role: "system", content: systemPrompt },
      ...(historial ?? []),
      { role: "user", content: mensaje },
    ];

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: mensajes,
        temperature: 0.4,
      }),
    });

    if (!res.ok) {
      const errorTexto = await res.text();
      console.error("Error de Groq:", errorTexto);
      return NextResponse.json({ error: "Error al consultar Groq" }, { status: 500 });
    }

    const data = await res.json();
    const respuesta = data.choices?.[0]?.message?.content ?? "No pude generar una respuesta.";

    return NextResponse.json({ respuesta });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error inesperado" }, { status: 500 });
  }
}