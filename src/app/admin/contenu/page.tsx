import { AdminHeader } from "@/components/admin/ui";
import {
  ContentEditor,
  type ContentGroup,
} from "@/components/admin/content-editor";
import { prisma } from "@/lib/prisma";
import { CONTENT_DEFAULTS } from "@/lib/content";

export const dynamic = "force-dynamic";

export const metadata = { title: "Contenu" };

/** Organisation des emplacements éditables, par écran du site. */
const LAYOUT: {
  title: string;
  description?: string;
  fields: {
    key: keyof typeof CONTENT_DEFAULTS;
    label: string;
    hint?: string;
    multiline?: boolean;
  }[];
}[] = [
  {
    title: "Accueil — bandeau d'ouverture",
    description:
      "La vidéo doit être un fichier MP4 optimisé, muet et court. Laissez vide pour afficher le dégradé par défaut.",
    fields: [
      { key: "home.hero.eyebrow", label: "Surtitre" },
      { key: "home.hero.title", label: "Titre principal" },
      { key: "home.hero.subtitle", label: "Sous-titre", multiline: true },
      { key: "home.hero.cta", label: "Libellé du bouton" },
      { key: "home.hero.video", label: "Adresse de la vidéo (MP4)" },
      { key: "home.hero.poster", label: "Image d'attente de la vidéo" },
    ],
  },
  {
    title: "Accueil — présentation",
    fields: [
      { key: "home.intro.eyebrow", label: "Surtitre" },
      { key: "home.intro.title", label: "Titre" },
      { key: "home.intro.body", label: "Texte", multiline: true },
    ],
  },
  {
    title: "Accueil — autres sections",
    fields: [
      { key: "home.categories.title", label: "Titre des catégories" },
      { key: "home.featured.eyebrow", label: "Surtitre sélection" },
      { key: "home.featured.title", label: "Titre sélection" },
      { key: "home.reviews.title", label: "Titre des avis" },
      { key: "home.instagram.title", label: "Titre Instagram" },
      { key: "home.instagram.handle", label: "Compte Instagram" },
    ],
  },
  {
    title: "Page à propos",
    fields: [
      { key: "about.title", label: "Titre" },
      { key: "about.body", label: "Chapô", multiline: true },
    ],
  },
  {
    title: "Coordonnées",
    description:
      "Ces informations alimentent la page de contact, le pied de page et les mentions légales.",
    fields: [
      { key: "contact.email", label: "Adresse électronique" },
      { key: "contact.phone", label: "Téléphone" },
      { key: "contact.address", label: "Adresse de l'atelier", multiline: true },
    ],
  },
  {
    title: "Mentions légales — éditeur",
    description:
      "Champs obligatoires au titre de la loi pour la confiance dans l'économie numérique. À compléter impérativement avant la mise en ligne.",
    fields: [
      { key: "legal.editor.name", label: "Dénomination" },
      { key: "legal.editor.status", label: "Forme juridique" },
      { key: "legal.editor.address", label: "Siège social", multiline: true },
      { key: "legal.editor.siret", label: "Numéro SIRET" },
      { key: "legal.editor.vat", label: "TVA intracommunautaire" },
      { key: "legal.editor.director", label: "Directeur de la publication" },
    ],
  },
  {
    title: "Mentions légales — hébergeur",
    fields: [
      { key: "legal.host.name", label: "Dénomination" },
      { key: "legal.host.address", label: "Adresse", multiline: true },
      { key: "legal.host.contact", label: "Contact" },
    ],
  },
];

export default async function AdminContentPage() {
  const blocks = await prisma.contentBlock.findMany();
  const byKey = new Map(blocks.map((b) => [b.key, b]));

  const groups: ContentGroup[] = LAYOUT.map((group) => ({
    title: group.title,
    description: group.description,
    fields: group.fields.map((field) => {
      const block = byKey.get(field.key);
      return {
        key: field.key,
        label: field.label,
        hint: field.hint,
        multiline: field.multiline,
        value:
          typeof block?.value === "string"
            ? block.value
            : (CONTENT_DEFAULTS[field.key] ?? ""),
        draftValue:
          typeof block?.draftValue === "string" ? block.draftValue : null,
      };
    }),
  }));

  return (
    <>
      <AdminHeader
        title="Contenu"
        description="Modifiez les textes, images et vidéos du site. Enregistrez d'abord en brouillon, vérifiez dans l'aperçu, puis publiez."
      />
      <ContentEditor groups={groups} />
    </>
  );
}
