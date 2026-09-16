import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { z } from "zod";
import type { Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";
import { verifyPassword } from "@/lib/password";
import { verifyTotp, consumeRecoveryCode } from "@/lib/two-factor";
import { rateLimit } from "@/lib/rate-limit";
import { hashIp } from "@/lib/crypto";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      twoFactorEnabled: boolean;
    } & DefaultSession["user"];
  }
  interface User {
    role: Role;
    twoFactorEnabled: boolean;
  }
}

/** Nombre d'échecs consécutifs avant verrouillage temporaire du compte. */
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 15;

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  totp: z.string().optional(),
  recoveryCode: z.string().optional(),
  ip: z.string().optional(),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      name: "Email et mot de passe",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
        totp: { label: "Code de vérification", type: "text" },
        recoveryCode: { label: "Code de secours", type: "text" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { email, password, totp, recoveryCode, ip } = parsed.data;
        const normalizedEmail = email.toLowerCase().trim();

        // Deux limites complémentaires : par compte visé et par origine
        // réseau, afin de contrer aussi bien le bourrage d'identifiants
        // que l'attaque ciblée sur un compte.
        const perAccount = await rateLimit(
          `login:email:${normalizedEmail}`,
          10,
          15 * 60,
        );
        const ipKey = hashIp(ip ?? null) ?? "unknown";
        const perIp = await rateLimit(`login:ip:${ipKey}`, 30, 15 * 60);
        if (!perAccount.success || !perIp.success) {
          throw new Error("RATE_LIMITED");
        }

        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });

        // Même message et coût comparable dans tous les cas d'échec : on
        // n'indique jamais si l'adresse existe.
        if (!user?.passwordHash) {
          await verifyPassword(
            password,
            "$2a$12$abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQ",
          ).catch(() => false);
          return null;
        }

        if (user.lockedUntil && user.lockedUntil > new Date()) {
          throw new Error("ACCOUNT_LOCKED");
        }
        if (user.anonymizedAt) return null;

        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) {
          const attempts = user.failedLoginAttempts + 1;
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: attempts,
              lockedUntil:
                attempts >= MAX_FAILED_ATTEMPTS
                  ? new Date(Date.now() + LOCK_DURATION_MINUTES * 60_000)
                  : null,
            },
          });
          return null;
        }

        if (user.twoFactorEnabled) {
          let secondFactorOk = false;

          if (totp && user.twoFactorSecret) {
            secondFactorOk = verifyTotp(user.twoFactorSecret, totp);
          }
          if (!secondFactorOk && recoveryCode) {
            const remaining = consumeRecoveryCode(
              user.twoFactorRecoveryCodes,
              recoveryCode,
            );
            if (remaining !== null) {
              secondFactorOk = true;
              await prisma.user.update({
                where: { id: user.id },
                data: { twoFactorRecoveryCodes: remaining },
              });
            }
          }

          if (!secondFactorOk) {
            throw new Error(totp || recoveryCode ? "INVALID_2FA" : "2FA_REQUIRED");
          }
        }

        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: 0,
            lockedUntil: null,
            lastLoginAt: new Date(),
          },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          twoFactorEnabled: user.twoFactorEnabled,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.twoFactorEnabled = user.twoFactorEnabled;
      }
      // Une élévation ou une révocation de rôle doit prendre effet sans
      // attendre l'expiration du jeton.
      if (trigger === "update" && token.id) {
        const fresh = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, twoFactorEnabled: true },
        });
        if (fresh) {
          token.role = fresh.role;
          token.twoFactorEnabled = fresh.twoFactorEnabled;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.twoFactorEnabled = Boolean(token.twoFactorEnabled);
      }
      return session;
    },
  },
});

/** Renvoie la session ou lève une erreur : à utiliser dans les zones protégées. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");
  return session.user;
}

export async function requireStaff() {
  const user = await requireUser();
  if (user.role !== "ADMIN" && user.role !== "GESTIONNAIRE") {
    throw new Error("FORBIDDEN");
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new Error("FORBIDDEN");
  return user;
}
