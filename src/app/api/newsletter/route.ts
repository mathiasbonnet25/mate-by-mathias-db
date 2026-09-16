import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { randomToken, hashIp } from "@/lib/crypto";
import { getClientIp, getUserAgent } from "@/lib/request";
import { rateLimit } from "@/lib/rate-limit";
import { sendNewsletterConfirmation } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Inscription à la newsletter, en double opt-in.
 *
 * Aucune information n'est envoyée tant que l'adresse n'a pas été confirmée.
 * La preuve du consentement (horodatage, IP hachée, agent utilisateur) est
 * conservée conformément au RGPD.
 */
const schema = z.object({
  email: z.string().trim().email().max(160),
  consent: z.literal(true),
  /// Champ leurre : rempli uniquement par les robots.
  website: z.string().max(0).optional(),
});

export async function POST(request: Request) {
  const ip = await getClientIp();
  const limit = await rateLimit(`newsletter:${hashIp(ip) ?? "unknown"}`, 5, 3600);
  if (!limit.success) {
    return NextResponse.json(
      { error: "Trop de tentatives. Merci de réessayer plus tard." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Adresse électronique invalide ou consentement manquant." },
      { status: 400 },
    );
  }

  const email = parsed.data.email.toLowerCase();

  try {
    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email },
    });

    // Réponse identique que l'adresse existe ou non : on n'expose pas
    // l'appartenance d'une personne à la liste de diffusion.
    if (existing?.isConfirmed && !existing.unsubscribedAt) {
      return NextResponse.json({ ok: true });
    }

    const token = randomToken(24);
    const userAgent = await getUserAgent();

    await prisma.newsletterSubscriber.upsert({
      where: { email },
      create: {
        email,
        confirmToken: token,
        consentIpHash: hashIp(ip),
        consentUserAgent: userAgent.slice(0, 300),
        source: "footer",
      },
      update: {
        confirmToken: token,
        unsubscribedAt: null,
        consentIpHash: hashIp(ip),
        consentUserAgent: userAgent.slice(0, 300),
      },
    });

    await sendNewsletterConfirmation({ to: email, token });
  } catch (error) {
    console.error("[newsletter] inscription impossible", error);
    return NextResponse.json(
      { error: "Inscription impossible pour le moment." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
