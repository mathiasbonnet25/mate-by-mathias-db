"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireStaff, requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { CONTENT_DEFAULTS } from "@/lib/content";

export type ContentResult = { ok: boolean; error?: string };

const blockSchema = z.object({
  key: z.string().trim().min(1).max(120),
  value: z.string().max(20_000),
  /** Enregistrement en brouillon : prévisualisable sans publier. */
  asDraft: z.boolean().default(false),
});

const batchSchema = z.object({
  blocks: z.array(blockSchema).max(200),
  publish: z.boolean().default(false),
});

/**
 * Enregistrement du contenu éditorial.
 *
 * Deux modes : brouillon (visible uniquement dans l'aperçu) et publication
 * (visible par tous). Un brouillon publié écrase la valeur en ligne et vide
 * le brouillon.
 */
export async function saveContentBlocks(input: unknown): Promise<ContentResult> {
  const staff = await requireStaff();
  const parsed = batchSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Requête invalide." };

  const { blocks, publish } = parsed.data;

  // Seules les clés connues sont acceptées : on n'ouvre pas la base à des
  // écritures arbitraires depuis le navigateur.
  const allowed = new Set(Object.keys(CONTENT_DEFAULTS));
  const invalid = blocks.find((b) => !allowed.has(b.key));
  if (invalid) {
    return { ok: false, error: `Emplacement inconnu : ${invalid.key}.` };
  }

  try {
    await prisma.$transaction(
      blocks.map((block) =>
        prisma.contentBlock.upsert({
          where: { key: block.key },
          create: {
            key: block.key,
            group: block.key.split(".")[0] ?? "general",
            label: block.key,
            type: "TEXT",
            value: publish ? block.value : "",
            draftValue: publish ? undefined : block.value,
            updatedBy: staff.email ?? null,
          },
          update: publish
            ? { value: block.value, draftValue: undefined, updatedBy: staff.email ?? null }
            : { draftValue: block.value, updatedBy: staff.email ?? null },
        }),
      ),
    );

    await logAudit({
      action: publish ? "content.publish" : "content.draft",
      actorId: staff.id,
      actorEmail: staff.email,
      entity: "ContentBlock",
      diff: { keys: blocks.map((b) => b.key) },
    });

    if (publish) {
      revalidateTag("content");
      revalidatePath("/", "layout");
    }

    return { ok: true };
  } catch (error) {
    console.error("[admin] enregistrement du contenu impossible", error);
    return { ok: false, error: "Enregistrement impossible." };
  }
}

// ---------------------------------------------------------------------------
// Barème de l'atelier de personnalisation
// ---------------------------------------------------------------------------

const optionSchema = z.object({
  id: z.string().max(60).optional(),
  step: z.enum(["SUPPORT", "PAINT", "FINISH", "EXTRA"]),
  slug: z.string().trim().min(1).max(60),
  label: z.string().trim().min(1).max(160),
  description: z.string().trim().max(600).optional(),
  priceEuros: z.number().min(0).max(1_000_000),
  /** Multiplicateur exprimé en valeur décimale (1,2 pour +20 %). */
  multiplier: z.number().min(0).max(20),
  isMultiple: z.boolean(),
  isActive: z.boolean(),
  position: z.number().int().min(0).max(999),
});

export async function saveCustomizationOptions(
  input: unknown,
): Promise<ContentResult> {
  const staff = await requireStaff();
  const parsed = z
    .object({ options: z.array(optionSchema).max(100) })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "Requête invalide." };

  try {
    for (const option of parsed.data.options) {
      const data = {
        step: option.step,
        slug: option.slug,
        label: option.label,
        description: option.description || null,
        priceCents: Math.round(option.priceEuros * 100),
        priceMultiplier: Math.round(option.multiplier * 1000),
        isMultiple: option.isMultiple,
        isActive: option.isActive,
        position: option.position,
      };

      await prisma.customizationOption.upsert({
        where: { step_slug: { step: option.step, slug: option.slug } },
        create: data,
        update: data,
      });
    }

    await logAudit({
      action: "customization.update",
      actorId: staff.id,
      actorEmail: staff.email,
      entity: "CustomizationOption",
    });

    revalidateTag("customization");
    revalidatePath("/personnalisation");
    return { ok: true };
  } catch (error) {
    console.error("[admin] barème non enregistré", error);
    return { ok: false, error: "Enregistrement impossible." };
  }
}

// ---------------------------------------------------------------------------
// Conformité : traceurs et demandes RGPD
// ---------------------------------------------------------------------------

const categorieSchema = z.object({
  id: z.string().max(60).optional(),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/, "Identifiant en minuscules, sans espace.")
    .max(40),
  name: z.string().trim().min(1, "Le nom est obligatoire.").max(120),
  description: z
    .string()
    .trim()
    .min(20, "Décrivez la finalité de façon compréhensible.")
    .max(2000),
  position: z.number().int().min(0).max(99),
  isActive: z.boolean(),
});

/**
 * Catégories de traceurs.
 *
 * La CNIL impose d'expliquer la finalité de chaque catégorie en termes
 * compréhensibles : ces descriptions sont reprises telles quelles dans le
 * bandeau de consentement et la politique de cookies.
 *
 * Le caractère « strictement nécessaire » n'est volontairement pas
 * modifiable depuis cet écran : c'est lui qui détermine si une catégorie
 * échappe au consentement. Le basculer par erreur reviendrait à déposer
 * des traceurs sans accord.
 */
export async function saveCookieCategory(input: unknown): Promise<ContentResult> {
  const staff = await requireStaff();
  const parsed = categorieSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Formulaire invalide.",
    };
  }

  const data = parsed.data;

  try {
    const conflit = await prisma.cookieCategory.findFirst({
      where: { slug: data.slug, ...(data.id ? { id: { not: data.id } } : {}) },
      select: { id: true },
    });
    if (conflit) {
      return { ok: false, error: "Cet identifiant est déjà utilisé." };
    }

    const base = {
      slug: data.slug,
      name: data.name,
      description: data.description,
      position: data.position,
      isActive: data.isActive,
    };

    const categorie = data.id
      ? await prisma.cookieCategory.update({ where: { id: data.id }, data: base })
      : await prisma.cookieCategory.create({
          data: { ...base, isEssential: false },
        });

    await logAudit({
      action: data.id ? "cookie_category.update" : "cookie_category.create",
      actorId: staff.id,
      actorEmail: staff.email,
      entity: "CookieCategory",
      entityId: categorie.id,
      severity: "WARNING",
    });

    revalidatePath("/cookies");
    revalidatePath("/admin/conformite");
    return { ok: true };
  } catch (error) {
    console.error("[conformité] catégorie non enregistrée", error);
    return { ok: false, error: "Enregistrement impossible." };
  }
}

const traceurSchema = z.object({
  id: z.string().max(60).optional(),
  categoryId: z.string().min(1).max(60),
  name: z.string().trim().min(1, "Le nom du traceur est obligatoire.").max(120),
  vendor: z.string().trim().min(1, "L'émetteur est obligatoire.").max(120),
  purpose: z
    .string()
    .trim()
    .min(10, "Décrivez la finalité du traceur.")
    .max(1000),
  retention: z.string().trim().max(120).optional(),
  recipientCountry: z.string().trim().max(120).optional(),
  isActive: z.boolean(),
});

/** Déclaration ou mise à jour d'un traceur. */
export async function saveTracker(input: unknown): Promise<ContentResult> {
  const staff = await requireStaff();
  const parsed = traceurSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Formulaire invalide.",
    };
  }

  const data = parsed.data;

  try {
    const base = {
      categoryId: data.categoryId,
      name: data.name,
      vendor: data.vendor,
      purpose: data.purpose,
      retention: data.retention || null,
      recipientCountry: data.recipientCountry || null,
      isActive: data.isActive,
    };

    const traceur = data.id
      ? await prisma.cookieTracker.update({ where: { id: data.id }, data: base })
      : await prisma.cookieTracker.create({ data: base });

    await logAudit({
      action: data.id ? "tracker.update" : "tracker.create",
      actorId: staff.id,
      actorEmail: staff.email,
      entity: "CookieTracker",
      entityId: traceur.id,
      severity: "WARNING",
    });

    revalidatePath("/cookies");
    revalidatePath("/admin/conformite");
    return { ok: true };
  } catch (error) {
    console.error("[conformité] traceur non enregistré", error);
    return { ok: false, error: "Enregistrement impossible." };
  }
}

export async function deleteTracker(trackerId: string): Promise<ContentResult> {
  const staff = await requireStaff();
  if (typeof trackerId !== "string") {
    return { ok: false, error: "Requête invalide." };
  }

  try {
    await prisma.cookieTracker.delete({ where: { id: trackerId } });
    await logAudit({
      action: "tracker.delete",
      actorId: staff.id,
      actorEmail: staff.email,
      entity: "CookieTracker",
      entityId: trackerId,
      severity: "WARNING",
    });
    revalidatePath("/cookies");
    revalidatePath("/admin/conformite");
    return { ok: true };
  } catch {
    return { ok: false, error: "Suppression impossible." };
  }
}

/**
 * Coupe-circuit d'un traceur : permet de désactiver immédiatement un outil
 * tiers jugé non conforme, sans attendre une mise en production.
 */
export async function toggleTracker(
  trackerId: string,
  isActive: boolean,
): Promise<ContentResult> {
  const staff = await requireStaff();
  if (typeof trackerId !== "string") {
    return { ok: false, error: "Requête invalide." };
  }

  try {
    await prisma.cookieTracker.update({
      where: { id: trackerId },
      data: { isActive },
    });

    await logAudit({
      action: isActive ? "tracker.enable" : "tracker.disable",
      actorId: staff.id,
      actorEmail: staff.email,
      entity: "CookieTracker",
      entityId: trackerId,
      severity: "WARNING",
    });

    revalidatePath("/cookies");
    revalidatePath("/admin/conformite");
    return { ok: true };
  } catch {
    return { ok: false, error: "Modification impossible." };
  }
}

const dataRequestSchema = z.object({
  requestId: z.string().min(1).max(60),
  status: z.enum([
    "RECEIVED",
    "IDENTITY_PENDING",
    "IN_PROGRESS",
    "COMPLETED",
    "REJECTED",
  ]),
  resolution: z.string().trim().max(3000).optional(),
  internalNote: z.string().trim().max(3000).optional(),
});

export async function updateDataRequest(input: unknown): Promise<ContentResult> {
  const staff = await requireStaff();
  const parsed = dataRequestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Requête invalide." };

  try {
    await prisma.dataRequest.update({
      where: { id: parsed.data.requestId },
      data: {
        status: parsed.data.status,
        resolution: parsed.data.resolution || null,
        internalNote: parsed.data.internalNote || null,
        resolvedAt:
          parsed.data.status === "COMPLETED" || parsed.data.status === "REJECTED"
            ? new Date()
            : null,
      },
    });

    await logAudit({
      action: "data_request.update",
      actorId: staff.id,
      actorEmail: staff.email,
      entity: "DataRequest",
      entityId: parsed.data.requestId,
      diff: { status: parsed.data.status },
      severity: "WARNING",
    });

    revalidatePath("/admin/conformite");
    return { ok: true };
  } catch {
    return { ok: false, error: "Enregistrement impossible." };
  }
}

/** Changement de rôle : réservé aux administrateurs. */
export async function updateUserRole(
  userId: string,
  role: "CLIENT" | "GESTIONNAIRE" | "ADMIN",
): Promise<ContentResult> {
  const admin = await requireAdmin();

  if (userId === admin.id) {
    return {
      ok: false,
      error: "Vous ne pouvez pas modifier votre propre rôle.",
    };
  }

  try {
    const before = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, email: true },
    });
    if (!before) return { ok: false, error: "Compte introuvable." };

    // On ne retire jamais le dernier administrateur : sans lui,
    // l'administration deviendrait définitivement inaccessible.
    if (before.role === "ADMIN" && role !== "ADMIN") {
      const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
      if (adminCount <= 1) {
        return {
          ok: false,
          error: "Impossible de retirer le dernier compte administrateur.",
        };
      }
    }

    await prisma.user.update({ where: { id: userId }, data: { role } });

    await logAudit({
      action: "user.role_change",
      actorId: admin.id,
      actorEmail: admin.email,
      entity: "User",
      entityId: userId,
      diff: { email: before.email, from: before.role, to: role },
      severity: "CRITICAL",
    });

    revalidatePath("/admin/utilisateurs");
    return { ok: true };
  } catch {
    return { ok: false, error: "Modification impossible." };
  }
}
