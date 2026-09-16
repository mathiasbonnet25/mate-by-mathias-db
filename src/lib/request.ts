import "server-only";
import { headers } from "next/headers";

/**
 * Extraction de l'adresse IP cliente derrière le proxy de Vercel.
 * On ne fait confiance qu'aux en-têtes posés par la plateforme.
 */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return h.get("x-real-ip") ?? "0.0.0.0";
}

export async function getUserAgent(): Promise<string> {
  const h = await headers();
  return h.get("user-agent") ?? "";
}

/** Déduit la famille d'appareil à des fins statistiques agrégées. */
export function deviceFromUserAgent(ua: string): "mobile" | "tablet" | "desktop" {
  if (/iPad|Tablet|PlayBook|Silk/i.test(ua)) return "tablet";
  if (/Mobi|Android|iPhone|iPod/i.test(ua)) return "mobile";
  return "desktop";
}
