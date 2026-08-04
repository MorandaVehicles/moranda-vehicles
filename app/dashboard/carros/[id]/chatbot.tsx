"use client";

import { useState, useRef, useEffect } from "react";

type Mensaje = { role: "user" | "assistant"; content: string };

export function Chatbot({
  contextoCarro,
  tituloCarro,
}: {
  contextoCarro: string;
  tituloCarro: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [input, setInput] = useState("");
  const [cargando, setCargando] = useState(false);
  const finRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes, abierto]);

  async function enviar() {
    const texto = input.trim();
    if (!texto || cargando) return;

    const nuevosMensajes: Mensaje[] = [...mensajes, { role: "user", content: texto }];
    setMensajes(nuevosMensajes);
    setInput("");
    setCargando(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mensaje: texto,
          contextoCarro,
          historial: mensajes.slice(-6), // últimos mensajes, para no mandar contexto infinito
        }),
      });

      const data = await res.json();
      const respuesta = data.respuesta ?? "Ocurrió un error, intenta de nuevo.";

      setMensajes([...nuevosMensajes, { role: "assistant", content: respuesta }]);
    } catch {
      setMensajes([
        ...nuevosMensajes,
        { role: "assistant", content: "No se pudo conectar. Intenta de nuevo." },
      ]);
    } finally {
      setCargando(false);
    }
  }

  return (
    <>
      {/* botón flotante */}
      <button
        onClick={() => setAbierto(!abierto)}
        className="fixed bottom-5 right-5 z-40 bg-[var(--moranda)] text-white text-sm font-medium rounded-full px-5 py-3 shadow-lg hover:bg-[var(--moranda-light)] transition-colors"
      >
        {abierto ? "Cerrar" : "Preguntar"}
      </button>

      {/* panel de chat */}
      {abierto && (
        <div className="fixed bottom-20 right-5 z-40 w-[calc(100vw-2.5rem)] max-w-sm h-[28rem] bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-xl flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border)]">
            <p className="text-sm font-medium text-[var(--ink)]">Pregúntale al asistente</p>
            <p className="text-xs text-[var(--muted)]">Costos, refacciones, ideas rápidas</p>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {mensajes.length === 0 && (
              <div className="bg-[var(--bg)] text-[var(--ink)] text-sm rounded-xl px-3 py-2 max-w-[85%]">
                Hola, soy Moranda Bot. ¿Qué quieres cotizar o saber sobre este {tituloCarro}?
              </div>
            )}
            {mensajes.map((m, i) => (
              <div
                key={i}
                className={`text-sm rounded-xl px-3 py-2 max-w-[85%] ${
                  m.role === "user"
                    ? "bg-[var(--moranda)] text-white ml-auto"
                    : "bg-[var(--bg)] text-[var(--ink)]"
                }`}
              >
                {m.content}
              </div>
            ))}
            {cargando && (
              <div className="bg-[var(--bg)] text-[var(--muted)] text-sm rounded-xl px-3 py-2 max-w-[85%]">
                Pensando...
              </div>
            )}
            <div ref={finRef} />
          </div>

          <div className="flex items-center gap-2 p-3 border-t border-[var(--border)]">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && enviar()}
              placeholder="Escribe tu pregunta..."
              className="flex-1 min-w-0 border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
            />
            <button
              onClick={enviar}
              disabled={cargando}
              className="bg-[var(--moranda)] text-white text-sm px-3 py-2 rounded-lg hover:bg-[var(--moranda-light)] disabled:opacity-40 flex-shrink-0"
            >
              Enviar
            </button>
          </div>
        </div>
      )}
    </>
  );
}