"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { useConsent } from "@/components/legal/cookie-consent";

/**
 * Déclenche la mesure d'audience, et uniquement après consentement.
 *
 * Le composant n'émet aucune requête tant que la catégorie « mesure
 * d'audience » n'a pas été acceptée : c'est l'exigence d'un dépôt
 * postérieur au consentement.
 */
export function AudienceTracker() {
  const pathname = usePathname();
  const { choices } = useConsent();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (!choices.analytics) return;
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;

    const controller = new AbortController();
    fetch("/api/audience", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: pathname,
        referrer: document.referrer || undefined,
      }),
      signal: controller.signal,
      keepalive: true,
    }).catch(() => {
      // La mesure est accessoire : un échec ne doit rien perturber.
    });

    return () => controller.abort();
  }, [pathname, choices.analytics]);

  return null;
}
