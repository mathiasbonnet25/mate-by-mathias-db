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

      <motion.div
        style={{ y, opacity }}
        className="container-page relative flex h-full flex-col items-center justify-center text-center text-white"
      >
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="text-[11px] uppercase tracking-[0.42em] text-gold-300"
        >
          {eyebrow}
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="mt-7 max-w-4xl text-balance font-display text-[2.75rem] leading-[1.06] sm:text-6xl lg:text-[5.25rem]"
        >
          {title}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 max-w-xl text-balance text-base leading-relaxed text-white/75"
        >
          {subtitle}
        </motion.p>

        <motion.a
          href="#presentation"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="group mt-14 inline-flex h-14 items-center gap-3 border border-white/35 px-11 text-[11px] uppercase tracking-[0.22em] transition-all duration-500 hover:border-gold-300 hover:bg-gold-300 hover:text-ink-950"
        >
          {cta}
          <ChevronDown
            className="h-4 w-4 transition-transform duration-500 group-hover:translate-y-0.5"
            aria-hidden
          />
        </motion.a>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 1 }}
        className="pointer-events-none absolute inset-x-0 bottom-8 flex justify-center"
        aria-hidden
      >
        <motion.span
          animate={reduceMotion ? {} : { y: [0, 9, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          className="h-12 w-px bg-gradient-to-b from-transparent via-gold-300/70 to-transparent"
        />
      </motion.div>
    </section>
  );
}
