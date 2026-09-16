import "server-only";
import bcrypt from "bcryptjs";

/**
 * Hachage des mots de passe (bcrypt, coût 12).
 * Le mot de passe en clair ne quitte jamais cette fonction et n'est jamais
 * journalisé.
 */
const ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS);
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Politique de mot de passe alignée sur les recommandations de la CNIL pour
 * un compte en ligne : longueur minimale de 12 caractères et diversité, ou
 * bien une phrase de passe longue.
 */
export function assessPassword(password: string): {
  ok: boolean;
  problems: string[];
} {
  const problems: string[] = [];
  if (password.length < 12) {
    problems.push("Le mot de passe doit contenir au moins 12 caractères.");
  }
  if (password.length < 20) {
    if (!/[a-z]/.test(password)) problems.push("Ajoutez une minuscule.");
    if (!/[A-Z]/.test(password)) problems.push("Ajoutez une majuscule.");
    if (!/[0-9]/.test(password)) problems.push("Ajoutez un chiffre.");
    if (!/[^A-Za-z0-9]/.test(password)) {
      problems.push("Ajoutez un caractère spécial.");
    }
  }
  const common = [
    "motdepasse",
    "password",
    "azerty",
    "qwerty",
    "123456",
    "matebymathias",
  ];
  if (common.some((c) => password.toLowerCase().includes(c))) {
    problems.push("Ce mot de passe est trop courant.");
  }
  return { ok: problems.length === 0, problems };
}
