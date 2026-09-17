"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, RotateCcw, ZoomIn, X } from "lucide-react";

export type GalleryImage = {
  id: string;
  url: string;
  alt: string;
  isSpin: boolean;
};

/**
 * Galerie de la fiche produit.
 *
 * - les photos changent intégralement lorsque la variante sélectionnée change ;
 * - le survol active une loupe (zoom 2,2×) suivant le pointeur ;
 * - si le produit dispose d'une séquence 360°, un mode rotation permet de
 *   faire tourner la pièce au glisser.
 */
export function ProductGallery({
  images,
  spinImages,
  productName,
}: {
  images: GalleryImage[];
  spinImages: GalleryImage[];
  productName: string;
}) {
  const [index, setIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const [lightbox, setLightbox] = useState(false);
  const [spinMode, setSpinMode] = useState(false);
  const [spinFrame, setSpinFrame] = useState(0);
  const dragRef = useRef<{ startX: number; startFrame: number } | null>(null);

  // La variante a changé : on revient à la première photo de la nouvelle série.
  useEffect(() => {
    setIndex(0);
    setSpinMode(false);
  }, [images]);

  // Navigation au clavier dans la visionneuse plein écran.
  useEffect(() => {
    if (!lightbox) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % images.length);
      if (e.key === "ArrowLeft")
        setIndex((i) => (i - 1 + images.length) % images.length);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, images.length]);

  if (images.length === 0) {
    return (
      <div className="grid aspect-square place-items-center bg-surface-muted text-[11px] uppercase tracking-[0.2em] text-foreground-muted">
        Visuel à venir
      </div>
    );
  }

  const current = images[index]!;

  function onPointerMove(event: React.MouseEvent<HTMLDivElement>) {
    if (!zoomed) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setOrigin({
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    });
  }

  function startSpinDrag(clientX: number) {
    dragRef.current = { startX: clientX, startFrame: spinFrame };
  }

  function moveSpinDrag(clientX: number) {
    if (!dragRef.current || spinImages.length === 0) return;
    const delta = clientX - dragRef.current.startX;
    // Un balayage complet de 320 px fait faire un tour complet à la pièce.
    const frames = Math.round((delta / 320) * spinImages.length);
    const next =
      (dragRef.current.startFrame + frames + spinImages.length * 10) %
      spinImages.length;
    setSpinFrame(next);
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row-reverse lg:gap-6">
      {/* Visuel principal */}
      <div className="relative flex-1">
        <div
          className="group relative aspect-square cursor-zoom-in overflow-hidden rounded-xl bg-surface-muted shadow-[var(--shadow-soft)]"
          onMouseEnter={() => !spinMode && setZoomed(true)}
          onMouseLeave={() => setZoomed(false)}
          onMouseMove={onPointerMove}
          onClick={() => !spinMode && setLightbox(true)}
          onMouseDown={(e) => spinMode && startSpinDrag(e.clientX)}
          onMouseUp={() => (dragRef.current = null)}
          onTouchStart={(e) => spinMode && startSpinDrag(e.touches[0]!.clientX)}
          onTouchMove={(e) => spinMode && moveSpinDrag(e.touches[0]!.clientX)}
          onTouchEnd={() => (dragRef.current = null)}
          role="button"
          tabIndex={0}
          aria-label={`Agrandir la photo de ${productName}`}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setLightbox(true);
          }}
        >
          {spinMode && spinImages.length > 0 ? (
            <Image
              src={spinImages[spinFrame]!.url}
              alt={`${productName} — vue à 360°`}
              fill
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="select-none object-cover"
              draggable={false}
              priority
            />
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, scale: 1.045 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.985 }}
                transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
                className="absolute inset-0"
              >
                <Image
                  src={current.url}
                  alt={current.alt || productName}
                  fill
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  priority={index === 0}
                  className="object-cover transition-transform duration-500 ease-out"
                  style={
                    zoomed
                      ? {
                          transform: "scale(2.2)",
                          transformOrigin: `${origin.x}% ${origin.y}%`,
                        }
                      : undefined
                  }
                />
              </motion.div>
            </AnimatePresence>
          )}

          <div className="pointer-events-none absolute bottom-4 right-4 flex items-center gap-2 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-surface/90 text-foreground shadow-[var(--shadow-soft)] backdrop-blur-sm">
              <ZoomIn className="h-4 w-4" aria-hidden />
            </span>
          </div>
        </div>

        {spinImages.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setSpinMode((v) => !v);
              setZoomed(false);
            }}
            aria-pressed={spinMode}
            className={`mt-3 inline-flex items-center gap-2 border px-4 py-2 text-[11px] uppercase tracking-[0.16em] transition-colors ${
              spinMode
                ? "border-accent bg-accent text-accent-contrast"
                : "border-line hover:border-accent hover:text-accent"
            }`}
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
            {spinMode ? "Quitter la rotation" : "Vue à 360°"}
          </button>
        )}
        {spinMode && (
          <p className="mt-2 text-[11px] text-foreground-muted">
            Faites glisser horizontalement pour faire tourner la pièce.
          </p>
        )}
      </div>

      {/* Vignettes */}
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto lg:w-24 lg:flex-col lg:overflow-visible">
          {images.map((image, i) => (
            <button
              key={image.id}
              type="button"
              onClick={() => {
                setIndex(i);
                setSpinMode(false);
              }}
              aria-label={`Voir la photo ${i + 1} sur ${images.length}`}
              aria-current={i === index}
              className={`relative aspect-square w-20 shrink-0 overflow-hidden rounded-md border-2 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] lg:w-full ${
                i === index
                  ? "border-accent opacity-100"
                  : "border-transparent opacity-60 hover:scale-[1.04] hover:opacity-100"
              }`}
            >
              <Image
                src={image.url}
                alt=""
                fill
                sizes="96px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Visionneuse plein écran */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] grid place-items-center bg-black/95 p-4"
            role="dialog"
            aria-modal="true"
            aria-label={`Photos de ${productName}`}
            onClick={() => setLightbox(false)}
          >
            <button
              type="button"
              onClick={() => setLightbox(false)}
              aria-label="Fermer"
              className="absolute right-5 top-5 grid h-11 w-11 place-items-center text-white/80 hover:text-white"
            >
              <X className="h-6 w-6" aria-hidden />
            </button>

            <div
              className="relative h-[82vh] w-full max-w-5xl"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={current.url}
                alt={current.alt || productName}
                fill
                sizes="90vw"
                className="object-contain"
              />
            </div>

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Photo précédente"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIndex((i) => (i - 1 + images.length) % images.length);
                  }}
                  className="absolute left-5 grid h-12 w-12 place-items-center text-white/80 hover:text-white"
                >
                  <ChevronLeft className="h-7 w-7" aria-hidden />
                </button>
                <button
                  type="button"
                  aria-label="Photo suivante"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIndex((i) => (i + 1) % images.length);
                  }}
                  className="absolute right-5 grid h-12 w-12 place-items-center text-white/80 hover:text-white"
                >
                  <ChevronRight className="h-7 w-7" aria-hidden />
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
