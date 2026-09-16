import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";
import { storeMedia } from "@/lib/storage";
import { logAudit } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Téléversement d'un média.
 *
 * Le contrôle de rôle est refait ici : une route d'API ne doit jamais se
 * reposer sur le seul middleware. Le type réel du fichier est vérifié par
 * `storeMedia`, qui recompresse l'image — une image forgée pour contenir du
 * code ne survit pas à ce ré-encodage.
 */
export async function POST(request: Request) {
  let staff;
  try {
    staff = await requireStaff();
  } catch {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const limit = await rateLimit(`upload:${staff.id}`, 60, 600);
  if (!limit.success) {
    return NextResponse.json(
      { error: "Trop de téléversements. Patientez quelques minutes." },
      { status: 429 },
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const folder = String(formData.get("folder") ?? "/").slice(0, 100);
    const alt = String(formData.get("alt") ?? "").slice(0, 300);

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Aucun fichier reçu." }, { status: 400 });
    }

    const stored = await storeMedia(file, folder);

    const asset = await prisma.mediaAsset.create({
      data: {
        url: stored.url,
        webpUrl: stored.webpUrl,
        thumbUrl: stored.thumbUrl,
        mimeType: stored.mimeType,
        fileName: stored.fileName,
        sizeBytes: stored.sizeBytes,
        width: stored.width,
        height: stored.height,
        alt: alt || null,
        folder: folder || "/",
        checksum: stored.checksum,
        uploadedBy: staff.email ?? null,
      },
    });

    await logAudit({
      action: "media.upload",
      actorId: staff.id,
      actorEmail: staff.email,
      entity: "MediaAsset",
      entityId: asset.id,
      diff: { fileName: stored.fileName, sizeBytes: stored.sizeBytes },
    });

    return NextResponse.json({ asset });
  } catch (error) {
    console.error("[medias] téléversement impossible", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Téléversement impossible.",
      },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  let staff;
  try {
    staff = await requireStaff();
  } catch {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Identifiant manquant." }, { status: 400 });
  }

  try {
    await prisma.mediaAsset.delete({ where: { id } });
    await logAudit({
      action: "media.delete",
      actorId: staff.id,
      actorEmail: staff.email,
      entity: "MediaAsset",
      entityId: id,
      severity: "WARNING",
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Suppression impossible." }, { status: 400 });
  }
}
