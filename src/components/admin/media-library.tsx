"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Check, Copy, Loader2, Trash2, Upload } from "lucide-react";

import { formatDate } from "@/lib/utils";

export type MediaItem = {
  id: string;
  url: string;
  thumbUrl: string | null;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  alt: string | null;
  folder: string;
  createdAt: string;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

/**
 * Bibliothèque de médias : téléversement, aperçu et copie de l'adresse à
 * coller dans une fiche produit. Les images sont converties en WebP et
 * débarrassées de leurs métadonnées côté serveur.
 */
export function MediaLibrary({
  items,
  remoteStorage,
}: {
  items: MediaItem[];
  remoteStorage: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [folder, setFolder] = useState("/");

  async function upload(files: FileList) {
    setError(null);
    setUploading(true);

    let done = 0;
    for (const file of Array.from(files)) {
      setProgress(`${file.name} (${done + 1}/${files.length})`);
      const body = new FormData();
      body.append("file", file);
      body.append("folder", folder);

      try {
        const res = await fetch("/api/admin/medias", { method: "POST", body });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Téléversement refusé.");
        done += 1;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Téléversement impossible.",
        );
        break;
      }
    }

    setUploading(false);
    setProgress(null);
    router.refresh();
  }

  function remove(id: string) {
    startTransition(async () => {
      const res = await fetch(`/api/admin/medias?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        setError("Suppression impossible.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      {!remoteStorage && (
        <p className="border border-accent/50 p-4 text-[12px] leading-relaxed">
          Aucun stockage externe n&apos;est configuré : les fichiers sont écrits
          dans le dossier public de l&apos;application. C&apos;est suffisant en
          développement, mais sur un hébergement sans disque persistant, ils
          disparaîtront au prochain déploiement. Renseignez les variables
          <code className="mx-1 font-mono">S3_*</code> pour utiliser Cloudflare
          R2 ou Supabase Storage.
        </p>
      )}

      <div className="flex flex-wrap items-end gap-4 rounded-lg border border-line bg-surface p-6">
        <label className="w-48">
          <span className="eyebrow">Dossier</span>
          <input
            value={folder}
            onChange={(e) => setFolder(e.target.value)}
            placeholder="/atelier"
            className="mt-2 h-11 w-full rounded-sm border border-line bg-transparent px-3 text-sm outline-none focus:border-accent"
          />
        </label>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm"
          className="sr-only"
          onChange={(e) => {
            if (e.target.files?.length) upload(e.target.files);
            e.target.value = "";
          }}
        />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="rounded-full inline-flex h-11 items-center gap-2 bg-foreground px-6 text-[11px] uppercase tracking-[0.16em] text-surface transition-colors hover:bg-accent hover:text-accent-contrast disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : (
            <Upload className="h-3.5 w-3.5" aria-hidden />
          )}
          Téléverser
        </button>

        <p className="text-[11px] text-foreground-muted">
          {progress ??
            "JPEG, PNG, WebP, AVIF, MP4, WebM — 12 Mo maximum. Les images sont converties en WebP et leurs métadonnées supprimées."}
        </p>
      </div>

      {error && (
        <p className="text-[12px] text-red-500" role="alert">
          {error}
        </p>
      )}

      {items.length === 0 ? (
        <p className="border border-dashed border-line p-12 text-center text-sm text-foreground-muted">
          Aucun média pour le moment.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {items.map((item) => (
            <li key={item.id} className="card-soft overflow-hidden">
              <div className="relative aspect-square bg-surface-muted">
                {item.mimeType.startsWith("video/") ? (
                  <video
                    src={item.url}
                    muted
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Image
                    src={item.thumbUrl ?? item.url}
                    alt={item.alt ?? item.fileName}
                    fill
                    sizes="(max-width: 640px) 50vw, 20vw"
                    className="object-cover"
                    unoptimized
                  />
                )}
              </div>

              <div className="p-3">
                <p className="truncate text-[12px]" title={item.fileName}>
                  {item.fileName}
                </p>
                <p className="mt-1 text-[10px] text-foreground-muted">
                  {formatBytes(item.sizeBytes)}
                  {item.width && item.height
                    ? ` · ${item.width}×${item.height}`
                    : ""}
                  <br />
                  {formatDate(item.createdAt)}
                </p>

                <div className="mt-3 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(item.url);
                      setCopied(item.id);
                      setTimeout(() => setCopied(null), 2000);
                    }}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-line py-2 text-[10px] uppercase tracking-[0.12em] transition-colors hover:border-accent hover:text-accent"
                  >
                    {copied === item.id ? (
                      <Check className="h-3 w-3" aria-hidden />
                    ) : (
                      <Copy className="h-3 w-3" aria-hidden />
                    )}
                    {copied === item.id ? "Copiée" : "Adresse"}
                  </button>

                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => remove(item.id)}
                    aria-label={`Supprimer ${item.fileName}`}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line transition-colors hover:border-red-500 hover:text-red-500"
                  >
                    <Trash2 className="h-3 w-3" aria-hidden />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
