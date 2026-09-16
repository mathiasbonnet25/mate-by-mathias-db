import "server-only";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { sha256 } from "@/lib/crypto";

/**
 * Stockage des médias.
 *
 * Les images sont recompressées en WebP avant d'être stockées : le fichier
 * d'origine, souvent un JPEG de plusieurs mégaoctets sorti d'un appareil
 * photo, n'est jamais servi tel quel. Les métadonnées EXIF — qui peuvent
 * contenir la position GPS de l'atelier — sont supprimées au passage.
 *
 * Deux destinations possibles : un stockage compatible S3 (Cloudflare R2,
 * Supabase Storage) lorsqu'il est configuré, sinon le dossier public local,
 * utile en développement.
 */

const MAX_BYTES = 12 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

const ALLOWED_VIDEO_TYPES = new Set(["video/mp4", "video/webm"]);

export type StoredMedia = {
  url: string;
  webpUrl: string | null;
  thumbUrl: string | null;
  mimeType: string;
  fileName: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  checksum: string;
};

function s3Client(): S3Client | null {
  const endpoint = process.env.S3_ENDPOINT;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  if (!endpoint || !accessKeyId || !secretAccessKey) return null;

  return new S3Client({
    region: process.env.S3_REGION ?? "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });
}

async function put(key: string, body: Buffer, contentType: string): Promise<string> {
  const client = s3Client();
  const bucket = process.env.S3_BUCKET;

  if (client && bucket) {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        // Les médias sont publics par nature ; ils sont servis via CDN.
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
    const base = process.env.NEXT_PUBLIC_MEDIA_BASE_URL;
    return base ? `${base.replace(/\/$/, "")}/${key}` : `/${key}`;
  }

  // Repli local : uniquement adapté au développement. Sur un hébergement
  // sans disque persistant, ces fichiers disparaissent au redéploiement.
  const target = path.join(process.cwd(), "public", key);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, body);
  return `/${key}`;
}

/** Vrai si un stockage externe est configuré. */
export function hasRemoteStorage(): boolean {
  return Boolean(s3Client() && process.env.S3_BUCKET);
}

export async function storeMedia(
  file: File,
  folder = "/",
): Promise<StoredMedia> {
  if (file.size > MAX_BYTES) {
    throw new Error("Fichier trop volumineux (12 Mo maximum).");
  }

  const isImage = ALLOWED_IMAGE_TYPES.has(file.type);
  const isVideo = ALLOWED_VIDEO_TYPES.has(file.type);

  if (!isImage && !isVideo) {
    throw new Error(
      "Format non autorisé. Images : JPEG, PNG, WebP, AVIF. Vidéos : MP4, WebM.",
    );
  }

  const input = Buffer.from(await file.arrayBuffer());
  const checksum = sha256(input.toString("base64").slice(0, 4096) + file.size);
  const cleanFolder = folder.replace(/[^a-zA-Z0-9/_-]/g, "").replace(/^\//, "");
  const base = `uploads/${cleanFolder ? `${cleanFolder}/` : ""}${checksum.slice(0, 16)}`;

  if (isVideo) {
    const url = await put(
      `${base}.${file.type === "video/webm" ? "webm" : "mp4"}`,
      input,
      file.type,
    );
    return {
      url,
      webpUrl: null,
      thumbUrl: null,
      mimeType: file.type,
      fileName: file.name.slice(0, 200),
      sizeBytes: input.byteLength,
      width: null,
      height: null,
      checksum,
    };
  }

  // Le pipeline sharp : rotation d'après l'EXIF puis suppression de toutes
  // les métadonnées, redimensionnement au format d'affichage maximal, et
  // conversion en WebP.
  const pipeline = sharp(input, { failOn: "error" }).rotate();
  const metadata = await pipeline.metadata();

  const full = await pipeline
    .clone()
    .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();

  const thumb = await pipeline
    .clone()
    .resize({ width: 400, height: 400, fit: "cover" })
    .webp({ quality: 72 })
    .toBuffer();

  const [url, thumbUrl] = await Promise.all([
    put(`${base}.webp`, full, "image/webp"),
    put(`${base}-thumb.webp`, thumb, "image/webp"),
  ]);

  return {
    url,
    webpUrl: url,
    thumbUrl,
    mimeType: "image/webp",
    fileName: file.name.slice(0, 200),
    sizeBytes: full.byteLength,
    width: metadata.width ?? null,
    height: metadata.height ?? null,
    checksum,
  };
}
