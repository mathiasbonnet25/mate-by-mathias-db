/**
 * Valeurs par défaut du contenu éditorial.
 *
 * Ce module ne dépend pas du serveur : il est lu aussi bien par le rendu
 * des pages que par le script de peuplement de la base, ce qui garantit
 * qu'un seul jeu de textes fait référence.
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
