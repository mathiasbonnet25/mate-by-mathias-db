import { AdminHeader } from "@/components/admin/ui";
import { MediaLibrary, type MediaItem } from "@/components/admin/media-library";
import { prisma } from "@/lib/prisma";
import { hasRemoteStorage } from "@/lib/storage";

export const dynamic = "force-dynamic";

export const metadata = { title: "Médias" };

export default async function AdminMediaPage() {
  const assets = await prisma.mediaAsset.findMany({
    orderBy: { createdAt: "desc" },
    take: 120,
  });

  const items: MediaItem[] = assets.map((asset) => ({
    id: asset.id,
    url: asset.url,
    thumbUrl: asset.thumbUrl,
    fileName: asset.fileName,
    mimeType: asset.mimeType,
    sizeBytes: asset.sizeBytes,
    width: asset.width,
    height: asset.height,
    alt: asset.alt,
    folder: asset.folder,
    createdAt: asset.createdAt.toISOString(),
  }));

  return (
    <>
      <AdminHeader
        title="Médias"
        description="Bibliothèque d'images et de vidéos. Copiez l'adresse d'un fichier pour l'utiliser dans une fiche produit ou un bloc de contenu."
      />
      <MediaLibrary items={items} remoteStorage={hasRemoteStorage()} />
    </>
  );
}
