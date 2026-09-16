import "server-only";
import crypto from "node:crypto";

/**
 * Primitives cryptographiques du site.
 *
 * - Les secrets TOTP sont chiffrés au repos (AES-256-GCM) : une fuite de la
 *   base ne suffit pas à reconstituer les codes de double authentification.
 * - Les adresses IP ne sont jamais stockées en clair ; on conserve un hash
 *   salé, suffisant comme preuve de consentement et pour le comptage
 *   anti-force brute, mais non réversible.
 */

function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "ENCRYPTION_KEY manquante : impossible de chiffrer les secrets 2FA.",
    );
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error("ENCRYPTION_KEY doit faire 32 octets encodés en base64.");
  }
  return key;
}

/** Chiffre une chaîne. Résultat : iv.tag.ciphertext encodés en base64url. */
export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    iv.toString("base64url"),
    tag.toString("base64url"),
    enc.toString("base64url"),
  ].join(".");
}

export function decrypt(payload: string): string {
  const [ivB64, tagB64, dataB64] = payload.split(".");
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error("Charge chiffrée invalide.");
  }
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    getKey(),
    Buffer.from(ivB64, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

/**
 * Hash salé et non réversible d'une adresse IP.
 * Le sel est un secret serveur : sans lui, impossible de retrouver l'IP par
 * force brute sur l'espace des adresses IPv4.
 */
export function hashIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  const salt = process.env.IP_HASH_SALT ?? "";
  if (!salt) return null;
  return crypto.createHmac("sha256", salt).update(ip).digest("hex");
}

/**
 * Hash journalier d'un visiteur : change chaque jour, ce qui empêche tout
 * suivi persistant tout en permettant de compter les visiteurs uniques.
 */
export function dailyVisitorHash(ip: string, userAgent: string): string {
  const salt = process.env.IP_HASH_SALT ?? "";
  const day = new Date().toISOString().slice(0, 10);
  return crypto
    .createHmac("sha256", salt)
    .update(`${day}:${ip}:${userAgent}`)
    .digest("hex");
}

/** Jeton aléatoire pour les liens de confirmation, paniers anonymes, etc. */
export function randomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("base64url");
}

export function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

/** Comparaison à temps constant, pour les jetons et codes de secours. */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}
