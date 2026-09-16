import { NextResponse } from "next/server";
import { z } from "zod";

import { recordPageView } from "@/lib/analytics";
import { dailyVisitorHash } from "@/lib/crypto";
import { getClientIp, getUserAgent, deviceFromUserAgent } from "@/lib/request";
import { parseConsentCookie, CONSENT_COOKIE } from "@/lib/consent";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Mesure d'audience interne.
 *
 * La vue n'est enregistrée que si le visiteur a accepté la catégorie
 * « mesure d'audience ». L'identifiant de visiteur est un condensat salé
 * renouvelé chaque jour : il permet de compter des visiteurs uniques
 * quotidiens sans constituer de suivi persistant.
 */
const schema = z.object({
  path: z.string().max(500),
  referrer: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  const store = await cookies();
  const consent = parseConsentCookie(store.get(CONSENT_COOKIE)?.value);

  if (!consent?.choices.analytics) {
    // Refus ou absence de choix : rien n'est enregistré.
    return NextResponse.json({ recorded: false });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const [ip, userAgent] = await Promise.all([getClientIp(), getUserAgent()]);

  await recordPageView({
    path: parsed.data.path.slice(0, 300),
    referrer: parsed.data.referrer?.slice(0, 300) ?? null,
    visitorHash: dailyVisitorHash(ip, userAgent),
    device: deviceFromUserAgent(userAgent),
  });

  return NextResponse.json({ recorded: true });
}
