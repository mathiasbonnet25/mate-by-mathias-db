import "server-only";
import { authenticator } from "otplib";
import { encrypt, decrypt, sha256, safeEqual, randomToken } from "@/lib/crypto";

/**
 * Double authentification par code temporel (TOTP, RFC 6238).
 * Obligatoire pour les comptes d'administration.
 */
authenticator.options = {
  // Tolérance d'une fenêtre avant/après pour absorber la dérive d'horloge.
  window: 1,
  step: 30,
};

export function generateTwoFactorSecret(): {
  secret: string;
  encryptedSecret: string;
} {
  const secret = authenticator.generateSecret();
  return { secret, encryptedSecret: encrypt(secret) };
}

/** URI otpauth:// à encoder en QR code dans l'application d'authentification. */
export function buildOtpAuthUrl(email: string, secret: string): string {
  return authenticator.keyuri(email, "Mate by Mathias", secret);
}

export function verifyTotp(encryptedSecret: string, token: string): boolean {
  try {
    const secret = decrypt(encryptedSecret);
    return authenticator.verify({ token: token.replace(/\s/g, ""), secret });
  } catch {
    return false;
  }
}

/**
 * Codes de secours à usage unique, remis à l'utilisateur lors de l'activation.
 * Seuls leurs hashes sont conservés.
 */
export function generateRecoveryCodes(count = 8): {
  codes: string[];
  hashes: string;
} {
  const codes = Array.from({ length: count }, () =>
    randomToken(6).replace(/[^a-zA-Z0-9]/g, "").slice(0, 10).toUpperCase(),
  );
  return { codes, hashes: codes.map(sha256).join(",") };
}

/** Consomme un code de secours ; renvoie la liste restante ou null si invalide. */
export function consumeRecoveryCode(
  storedHashes: string | null,
  candidate: string,
): string | null {
  if (!storedHashes) return null;
  const candidateHash = sha256(candidate.trim().toUpperCase());
  const hashes = storedHashes.split(",").filter(Boolean);
  const index = hashes.findIndex((h) => safeEqual(h, candidateHash));
  if (index === -1) return null;
  hashes.splice(index, 1);
  return hashes.join(",");
}
