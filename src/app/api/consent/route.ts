import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { hashIp } from "@/lib/crypto";
import { getClientIp, getUserAgent } from "@/lib/request";
import { CONSENT_MAX_AGE_DAYS } from "@/lib/consent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Enregistrement de la preuve de consentement aux traceurs.
 *
 * Le RGPD impose de pouvoir démontrer le consentement. On conserve donc
 * l'horodatage, la version de la politique acceptée et les choix effectués,
 * associés à un identifiant de consentement aléatoire. L'adresse IP n'est
 * stockée que sous forme de hash salé, non réversible.
 */
const schema = z.object({
  consentId: z.string().uuid(),
  choices: z.record(z.string().max(40), z.boolean()),
  policyVersion: z.string().max(20),
  origin: z.enum(["BANNER", "PREFERENCES", "WITHDRAWAL"]),
});

export async function POST(request: Request) {
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

  try {
    const [ip, userAgent] = await Promise.all([getClientIp(), getUserAgent()]);
    await prisma.consentRecord.create({
      data: {
        consentId: parsed.data.consentId,
        choices: parsed.data.choices,
        policyVersion: parsed.data.policyVersion,
        origin: parsed.data.origin,
        ipHash: hashIp(ip),
        userAgent: userAgent.slice(0, 300),
        expiresAt: new Date(Date.now() + CONSENT_MAX_AGE_DAYS * 86_400_000),
      },
    });
  } catch (error) {
    console.error("[consent] enregistrement impossible", error);
    // Le choix de l'utilisateur reste appliqué côté navigateur.
  }

  return NextResponse.json({ ok: true });
}
