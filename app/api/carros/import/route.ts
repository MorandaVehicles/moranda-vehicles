// app/api/carros/import/route.ts
//
// Recibe lo que manda la extensión de Marketplace:
// { url_marketplace, descripcion_original, fotos_urls[], precio_listado }
//
// 1. Descarga cada foto y la sube a Supabase Storage (bucket "carros-fotos")
// 2. Manda la descripción a Groq para extraer marca/modelo/año/motor/km
// 3. Inserta el carro en estado "prospecto"
// 4. Regresa el id del carro creado

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // service role: este endpoint corre en servidor, nunca en el navegador
);

const GROQ_API_KEY = process.env.GROQ_API_KEY!;
const GROQ_MODEL = "llama-3.3-70b-versatile"; // rápido y gratis dentro del límite de Groq

// cabeceras CORS: necesarias porque la extensión llama a este endpoint desde
// otro origen (chrome-extension://... o moz-extension://...), y el navegador
// bloquea esas peticiones por default a menos que el servidor las autorice
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// el navegador manda esta petición "de prueba" (preflight) antes del POST real
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

interface ImportPayload {
  url_marketplace: string;
  descripcion_original: string;
  fotos_urls: string[];
  precio_listado?: number;
  placa?: string;
}

interface DatosParsed {
  marca: string | null;
  modelo: string | null;
  anio: number | null;
  motor: string | null;
  kilometraje: number | null;
  transmision: string | null;
  clima: boolean | null;
  caracteristicas: string[];
  precio: number | null;
}

export async function POST(req: NextRequest) {
  try {
    const body: ImportPayload = await req.json();

    if (!body.url_marketplace || !body.descripcion_original) {
      return NextResponse.json(
        { error: "Faltan url_marketplace o descripcion_original" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // 1. Subir fotos a Supabase Storage
    const fotosSubidas = await subirFotos(body.fotos_urls ?? []);

    // 2. Parsear la descripción con Groq
    const datosParsed = await parsearConGroq(body.descripcion_original);

    // 3. Insertar el carro
    const { data, error } = await supabase
      .from("carros")
      .insert({
        estado: "prospecto",
        url_marketplace: body.url_marketplace,
        descripcion_original: body.descripcion_original,
        fotos_urls: fotosSubidas,
        precio_listado: datosParsed.precio ?? body.precio_listado ?? null,
        placa: body.placa ?? null,
        marca: datosParsed.marca,
        modelo: datosParsed.modelo,
        anio: datosParsed.anio,
        motor: datosParsed.motor,
        kilometraje: datosParsed.kilometraje,
        transmision: datosParsed.transmision,
        clima: datosParsed.clima,
        caracteristicas: datosParsed.caracteristicas,
      })
      .select("id")
      .single();

    if (error) throw error;

    return NextResponse.json(
      { id: data.id, parsed: datosParsed },
      { status: 201, headers: CORS_HEADERS }
    );
  } catch (err) {
    console.error("Error en /api/carros/import:", err);
    return NextResponse.json(
      { error: "No se pudo importar el carro" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

// ---------------------------------------------
// Sube cada foto (descargada desde su URL original) a Supabase Storage
// y regresa las URLs públicas permanentes
// ---------------------------------------------
async function subirFotos(urls: string[]): Promise<string[]> {
  const urlsFinal: string[] = [];

  for (let i = 0; i < urls.length; i++) {
    try {
      const res = await fetch(urls[i]);
      if (!res.ok) continue;

      const blob = await res.arrayBuffer();

      // sacamos el content-type real del header de la respuesta,
      // en vez de adivinarlo por la URL (las URLs no siempre traen extensión confiable)
      const contentType = res.headers.get("content-type") || "image/jpeg";
      const ext = contentType.split("/").pop()?.split(";")[0] || "jpg";
      const nombreArchivo = `${crypto.randomUUID()}.${ext}`;

      const { error } = await supabase.storage
        .from("carros-fotos")
        .upload(nombreArchivo, blob, {
          contentType,
          upsert: false,
        });

      if (error) {
        console.error(`Error subiendo foto ${i}:`, error);
        continue;
      }

      const { data: publicUrl } = supabase.storage
        .from("carros-fotos")
        .getPublicUrl(nombreArchivo);

      urlsFinal.push(publicUrl.publicUrl);
    } catch (e) {
      console.error(`No se pudo procesar foto ${i}:`, e);
      // si una foto falla, seguimos con las demás en vez de tronar todo el import
    }
  }

  return urlsFinal;
}

// ---------------------------------------------
// Manda la descripción del listing a Groq y pide JSON estructurado
// ---------------------------------------------
async function parsearConGroq(descripcion: string): Promise<DatosParsed> {
  const prompt = `Extrae los siguientes datos de esta descripción de un anuncio de auto usado. Responde ÚNICAMENTE con un JSON válido, sin texto adicional, sin markdown, con esta forma exacta:
{"marca": string|null, "modelo": string|null, "anio": number|null, "motor": string|null, "kilometraje": number|null, "transmision": string|null, "clima": boolean|null, "caracteristicas": string[], "precio": number|null}

Reglas:
- Si un dato no aparece en el texto, usa null (para transmision/clima/etc) o array vacío (para caracteristicas). Nunca inventes datos que no estén en el texto.
- El kilometraje debe ser un número entero (convierte "18 mil km" a 18000, por ejemplo).
- "transmision" debe ser "manual", "automática", o null si no se menciona.
- "clima" es true si el anuncio menciona que tiene aire acondicionado/clima funcionando, false si menciona explícitamente que NO tiene o está descompuesto, null si no se menciona el tema.
- "caracteristicas" es una lista corta de extras relevantes mencionados que no entran en los otros campos (ej: "asientos en tela", "vidrios eléctricos", "llantas nuevas", "papelería en regla", "único dueño"). Máximo 8 elementos, cada uno breve (2-4 palabras).
- "precio" es el precio de venta de contado del vehículo, como número entero sin comas ni símbolos. Si el anuncio menciona varias cifras de dinero (ej. "Contado $110,000" y "Enganche $66,000" por ser un esquema de financiamiento), usa el precio de CONTADO (el precio total del vehículo), no el enganche/anticipo/mensualidad. Si no hay ninguna cifra clara de precio en el texto, usa null.

Descripción del anuncio:
"""
${descripcion}
"""`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    console.error("Groq respondió con error:", await res.text());
    return { marca: null, modelo: null, anio: null, motor: null, kilometraje: null, transmision: null, clima: null, caracteristicas: [], precio: null };
  }

  const data = await res.json();
  const contenido = data.choices?.[0]?.message?.content;

  try {
    return JSON.parse(contenido);
  } catch {
    console.error("No se pudo parsear la respuesta de Groq:", contenido);
    return { marca: null, modelo: null, anio: null, motor: null, kilometraje: null, transmision: null, clima: null, caracteristicas: [], precio: null };
  }
}