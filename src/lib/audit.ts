import "server-only";
import { prisma } from "@/lib/prisma";
import { hashIp } from "@/lib/crypto";
import { getClientIp, getUserAgent } from "@/lib/request";

export type AuditSeverity = "INFO" | "WARNING" | "CRITICAL";

/**
 * Journalise une action d'administration.
 *
 * Le journal est consultable depuis l'administration et sert à la fois de
 * piste d'audit interne et d'élément de preuve en cas d'incident. Il ne doit
 * jamais contenir de secret (mot de passe, jeton, clé API) ni de donnée
 * bancaire : `diff` est destiné aux libellés métier uniquement.
 */
export async function logAudit(params: {
  action: string;
  actorId?: string | null;
  actorEmail?: string | null;
  entity?: string;
  entityId?: string;
  diff?: unknown;
  severity?: AuditSeverity;
}): Promise<void> {
  try {
    const [ip, userAgent] = await Promise.all([getClientIp(), getUserAgent()]);
    await prisma.auditLog.create({
      data: {
        action: params.action,
        userId: params.actorId ?? null,
        actorEmail: params.actorEmail ?? null,
        entity: params.entity ?? null,
        entityId: params.entityId ?? null,
        diff: (params.diff ?? undefined) as never,
        severity: params.severity ?? "INFO",
        ipHash: hashIp(ip),
        userAgent: userAgent.slice(0, 500),
      },
    });
  } catch (error) {
    // La journalisation ne doit jamais faire échouer l'action métier.
    console.error("[audit] écriture impossible", error);
  }
}
