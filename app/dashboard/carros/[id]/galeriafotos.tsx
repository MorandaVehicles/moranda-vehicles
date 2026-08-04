"use client";

import { useState, useEffect, useRef } from "react";

export function GaleriaFotos({ fotos, titulo }: { fotos: string[]; titulo: string }) {
  const [indiceAbierto, setIndiceAbierto] = useState<number | null>(null);
  const touchInicio = useRef<number | null>(null);

  function siguiente() {
    setIndiceAbierto((i) => (i === null ? null : (i + 1) % fotos.length));
  }

  function anterior() {
    setIndiceAbierto((i) => (i === null ? null : (i - 1 + fotos.length) % fotos.length));
  }

  // navegación por teclado en desktop
  useEffect(() => {
    if (indiceAbierto === null) return;

    function manejarTecla(e: KeyboardEvent) {
      if (e.key === "ArrowRight") siguiente();
      if (e.key === "ArrowLeft") anterior();
      if (e.key === "Escape") setIndiceAbierto(null);
    }

    window.addEventListener("keydown", manejarTecla);
    return () => window.removeEventListener("keydown", manejarTecla);
  }, [indiceAbierto, fotos.length]);

  function onTouchStart(e: React.TouchEvent) {
    touchInicio.current = e.touches[0].clientX;
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchInicio.current === null) return;
    const distancia = e.changedTouches[0].clientX - touchInicio.current;

    if (Math.abs(distancia) > 50) {
      if (distancia < 0) siguiente();
      else anterior();
    }
    touchInicio.current = null;
  }

  if (!fotos || fotos.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-3 gap-2 mt-6">
        {fotos.map((foto, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={foto}
            alt={`Foto ${i + 1}`}
            onClick={() => setIndiceAbierto(i)}
            className="rounded-lg aspect-square object-cover cursor-pointer hover:opacity-80 transition-opacity"
          />
        ))}
      </div>

      {indiceAbierto !== null && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
          onClick={() => setIndiceAbierto(null)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <button
            onClick={() => setIndiceAbierto(null)}
            className="absolute top-4 right-4 text-white text-2xl w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full"
          >
            ✕
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              anterior();
            }}
            className="hidden md:flex absolute left-2 md:left-6 text-white text-3xl w-12 h-12 items-center justify-center hover:bg-white/10 rounded-full"
          >
            ‹
          </button>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={fotos[indiceAbierto]}
            alt={`${titulo} — foto ${indiceAbierto + 1}`}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] max-w-[85vw] object-contain rounded-lg select-none"
            draggable={false}
          />

          <button
            onClick={(e) => {
              e.stopPropagation();
              siguiente();
            }}
            className="hidden md:flex absolute right-2 md:right-6 text-white text-3xl w-12 h-12 items-center justify-center hover:bg-white/10 rounded-full"
          >
            ›
          </button>

          <span className="absolute bottom-4 text-white/60 text-sm font-mono">
            {indiceAbierto + 1} / {fotos.length}
          </span>
        </div>
      )}
    </>
  );
}