import "server-only";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

import { CONTENT_DEFAULTS, type ContentKey } from "@/lib/content-defaults";

export * from "@/lib/content-defaults";

export const getContent = unstable_cache(
  async (): Promise<Record<string, string>> => {
    try {
      const blocks = await prisma.contentBlock.findMany();
      const overrides: Record<string, string> = {};
      for (const block of blocks) {
        if (typeof block.value === "string") {
          overrides[block.key] = block.value;
        } else if (block.value != null) {
          overrides[block.key] = String(block.value);
        }
      }
      return { ...CONTENT_DEFAULTS, ...overrides };
    } catch {
      // Base indisponible (build sans connexion) : on sert les valeurs
      // par défaut plutôt que de faire échouer le rendu.
      return { ...CONTENT_DEFAULTS };
    }
  },
  ["content-blocks"],
  { tags: ["content"], revalidate: 300 },
);

/** Accès à une clé avec repli sur la valeur par défaut. */
export function text(
  content: Record<string, string>,
  key: ContentKey,
): string {
  return content[key] ?? CONTENT_DEFAULTS[key] ?? "";
}
