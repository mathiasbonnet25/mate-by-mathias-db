import "server-only";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

/**
 * Contenu éditorial modifiable depuis l'administration.
 *
 * Chaque emplacement possède une valeur par défaut : le site reste lisible
 * même sur une base vierge, et une clé supprimée ne casse jamais une page.
 * Le résultat est mis en cache et invalidé par l'administration à
 * l'enregistrement (tag « content »).
 */
export const CONTENT_DEFAULTS = {
  "home.hero.eyebrow": "Atelier français",
  "home.hero.title": "L'excellence, cadre par cadre",
  "home.hero.subtitle":
    "Peinture personnalisée, restauration et projets sur mesure. Chaque vélo qui passe à l'atelier repart unique.",
  "home.hero.cta": "Découvrir",
  "home.hero.video": "",
  "home.hero.poster": "",

  "home.intro.eyebrow": "L'atelier",
  "home.intro.title": "Un artisan, un atelier, une obsession",
  "home.intro.body":
    "Je m'appelle Mathias. Je prépare, peins et vernis des cadres de vélo à la main, un par un. Décapage, redressage, apprêt, mise en peinture, vernis : chaque étape est faite à l'atelier, sans sous-traitance. Je restaure des cadres anciens, je crée des peintures personnalisées et j'accompagne des projets sur mesure, du simple changement de teinte au montage complet.",

  "home.categories.title": "Explorer",
  "home.featured.eyebrow": "Sélection",
  "home.featured.title": "Pièces du moment",
  "home.reviews.title": "Ils nous ont fait confiance",
  "home.instagram.title": "L'atelier au quotidien",
  "home.instagram.handle": "@matebymathias",

  "about.title": "L'histoire",
  "about.body":
    "Mate by Mathias est né d'une passion pour le vélo et d'un goût pour le travail bien fait.",

  "contact.email": "contact@matebymathias.fr",
  "contact.phone": "",
  "contact.address": "",

  "legal.editor.name": "",
  "legal.editor.status": "",
  "legal.editor.siret": "",
  "legal.editor.vat": "",
  "legal.editor.address": "",
  "legal.editor.director": "",
  "legal.host.name": "Vercel Inc.",
  "legal.host.address": "440 N Barranca Ave #4133, Covina, CA 91723, États-Unis",
  "legal.host.contact": "https://vercel.com",
} as const;

export type ContentKey = keyof typeof CONTENT_DEFAULTS;

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
