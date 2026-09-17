"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, ShieldCheck, ShieldAlert } from "lucide-react";

import { updateUserRole } from "@/app/actions/admin-content";
import { formatDate } from "@/lib/utils";

export type UserRow = {
  id: string;
  email: string;
  name: string | null;
  role: "CLIENT" | "GESTIONNAIRE" | "ADMIN";
  twoFactorEnabled: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  orderCount: number;
  isSelf: boolean;
};

const ROLE_LABELS = {
  CLIENT: "Client",
  GESTIONNAIRE: "Gestionnaire",
  ADMIN: "Administrateur",
} as const;

/**
 * Attribution des rôles. Seul un administrateur peut modifier un rôle, et
 * le dernier compte administrateur ne peut pas être rétrogradé : le contrôle
 * est refait côté serveur.
 */
export function UserRoles({ users }: { users: UserRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {users.map((user) => (
        <div
          key={user.id}
          className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-line p-4"
        >
          <div className="min-w-56 flex-1">
            <p className="text-sm">
              {user.name ?? "Sans nom"}
              {user.isSelf && (
                <span className="ml-2 text-[10px] uppercase tracking-[0.14em] text-accent">
                  vous
                </span>
              )}
            </p>
            <p className="mt-0.5 text-[11px] text-foreground-muted">
              {user.email} · inscrit le {formatDate(user.createdAt)}
              {user.orderCount > 0 ? ` · ${user.orderCount} commande(s)` : ""}
            </p>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 text-[11px] ${
              user.twoFactorEnabled ? "text-accent" : "text-foreground-muted"
            }`}
            title={
              user.twoFactorEnabled
                ? "Double authentification active"
                : "Double authentification inactive"
            }
          >
            {user.twoFactorEnabled ? (
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <ShieldAlert className="h-3.5 w-3.5" aria-hidden />
            )}
            2FA
          </span>

          <label className="shrink-0">
            <span className="sr-only">Rôle de {user.email}</span>
            <select
              value={user.role}
              disabled={pending || user.isSelf}
              onChange={(e) =>
                startTransition(async () => {
                  setError(null);
                  const result = await updateUserRole(
                    user.id,
                    e.target.value as UserRow["role"],
                  );
                  if (!result.ok) {
                    setError(result.error ?? "Modification impossible.");
                    return;
                  }
                  router.refresh();
                })
              }
              className="h-10 rounded-sm border border-line bg-transparent px-3 text-[12px] outline-none focus:border-accent disabled:opacity-50"
            >
              {Object.entries(ROLE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      ))}

      {pending && (
        <p className="flex items-center gap-2 text-[12px] text-foreground-muted">
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          Enregistrement…
        </p>
      )}
      {error && (
        <p className="text-[12px] text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
