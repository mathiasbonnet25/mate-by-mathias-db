"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useRef } from "react";

type HeroProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  cta: string;
  videoUrl?: string;
  posterUrl?: string;
};

/**
 * Ouverture plein écran. La vidéo est décorative : muette, sans contrôle,
 * et remplacée par un dégradé si aucune source n'est configurée. Le
 * parallaxe est désactivé si l'utilisateur a demandé moins d'animations.
 */
export function Hero({
  eyebrow,
  title,
  subtitle,
  cta,
  videoUrl,
  posterUrl,
}: HeroProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", reduceMotion ? "0%" : "18%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, reduceMotion ? 1 : 1.12]);

  return (
    <section
      ref={ref}
      className="relative h-[100svh] min-h-[560px] w-full overflow-hidden bg-ink-950"
      aria-label="Présentation"
    >
      {/* Arc de raccord avec la section suivante, dessiné dans la couleur
          de fond du site. Purement décoratif. */}
      <div
        className="pointer-events-none absolute inset-x-[-6%] bottom-[-1px] z-10 h-16 rounded-[50%_50%_0_0/100%_100%_0_0] bg-surface md:h-24"
        aria-hidden
      />
      <motion.div style={{ scale }} className="absolute inset-0">
        {videoUrl ? (
          <video
            className="h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            poster={posterUrl || undefined}
            aria-hidden
          >
            <source src={videoUrl} type="video/mp4" />
          </video>
        ) : (
          <div
            className="h-full w-full"
            style={{
              background:
                "radial-gradient(120% 90% at 50% 10%, #2a2a27 0%, #131312 45%, #0a0a09 100%)",
            }}
            aria-hidden
          />
        )}
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/25 to-black/80"
          aria-hidden
        />
      </motion.div>

      {/* L'entrée reste échelonnée, mais resserrée : le titre est le plus
          grand élément de la page, donc celui que le navigateur retient
          comme mesure de vitesse perçue. Une ouverture trop lente le
          retarde d'autant, pour le visiteur comme pour les moteurs. */}
      <motion.div
        style={{ y, opacity }}
        className="container-page relative flex h-full flex-col items-center justify-center text-center text-white"
      >
        <p className="hero-rise hero-delay-1 text-[11px] uppercase tracking-[0.42em] text-gold-300">
          {eyebrow}
        </p>

        <h1 className="hero-rise hero-delay-2 mt-7 max-w-4xl text-balance font-display text-[2.75rem] leading-[1.06] sm:text-6xl lg:text-[5.25rem]">
          {title}
        </h1>

        <p className="hero-rise hero-delay-3 mt-8 max-w-xl text-balance text-base leading-relaxed text-white/75">
          {subtitle}
        </p>

        <a
          href="#presentation"
          className="hero-rise hero-delay-4 group mt-14 inline-flex h-14 items-center gap-3 rounded-full border border-white/35 px-12 text-[11px] uppercase tracking-[0.22em] backdrop-blur-sm transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-gold-300 hover:bg-gold-300 hover:text-ink-950 active:scale-[0.97]"
        >
          {cta}
          <ChevronDown
            className="h-4 w-4 transition-transform duration-500 group-hover:translate-y-0.5"
            aria-hidden
          />
        </a>
      </motion.div>

      <div
        className="hero-fade pointer-events-none absolute inset-x-0 bottom-8 flex justify-center"
        aria-hidden
      >
        <span
          className={`h-12 w-px bg-gradient-to-b from-transparent via-gold-300/70 to-transparent ${
            reduceMotion ? "" : "hero-pulse"
          }`}
        />
      </div>
    </section>
  );
}
