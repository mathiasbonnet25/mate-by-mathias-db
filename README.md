# Mate by Mathias

Site e-commerce et espace d'administration de l'atelier **Mate by Mathias** :
peinture personnalisée, restauration et projets sur mesure pour cadres et
vélos, avec une boutique d'équipement.

---

## Sommaire

1. [Ce que fait le site](#ce-que-fait-le-site)
2. [Technologies](#technologies)
3. [Installation](#installation)
4. [Variables d'environnement](#variables-denvironnement)
5. [Commandes](#commandes)
6. [Architecture](#architecture)
7. [Sécurité](#sécurité)
8. [Conformité française et RGPD](#conformité-française-et-rgpd)
9. [Déploiement](#déploiement)
10. [À faire avant la mise en ligne](#à-faire-avant-la-mise-en-ligne)
11. [Ce qui reste à construire](#ce-qui-reste-à-construire)

---

## Ce que fait le site

### Côté visiteur

- **Accueil** : ouverture plein écran (vidéo ou dégradé), présentation de
  l'atelier, cartes de catégories animées, produits mis en avant, avis
  clients, galerie Instagram, newsletter.
- **Boutique Cadres & Vélos** et **Vêtements & Accessoires** : galerie avec
  filtres marque, type, taille, couleur, prix et disponibilité. L'état des
  filtres vit dans l'URL : un tri est partageable et restauré par le bouton
  « précédent ».
- **Fiche produit** : galerie avec zoom au survol, visionneuse plein écran,
  vue à 360° au glisser. Le choix d'une couleur change l'ensemble des photos,
  le prix et le stock affichés — chaque variante possède les siens.
- **Atelier personnalisation** : configurateur en quatre étapes (pièce,
  peinture, finition, options) avec estimation mise à jour à chaque choix,
  puis envoi de la demande de devis.
- **Panier et commande** : quantités, code promo, estimation des frais de
  port, paiement Stripe (carte, PayPal, Apple Pay, Google Pay).
- **Compte client** : commandes, suivi, factures, devis, favoris, adresses,
  double authentification et exercice des droits sur les données.
- **Réclamations** : dépôt d'un dossier numéroté avec motif, numéro de
  commande et photos, accusé de réception automatique, suivi.
- **Aide et informations légales** : page d'ensemble regroupant tous les
  documents, « Comment ça marche », mentions légales, CGV,
  confidentialité, cookies, rétractation, livraison, retours et
  remboursements, garanties et SAV, FAQ, guide des tailles.

### Côté administration

- **Tableau de bord** : chiffre d'affaires, commandes, devis, visiteurs,
  panier moyen, taux de conversion, courbe des ventes, meilleures ventes,
  planning de production et alertes de stock.
- **Commandes** : recherche, filtres, fiche détaillée, changement de statut
  journalisé, suivi d'expédition, émission de facture.
- **Devis** : suivi, saisie du montant, transformation en commande.
- **Produits** : éditeur complet avec variantes — référence, prix, stock et
  photos propres à chaque couleur.
- **Catégories** : création, modification, suppression protégée et
  réorganisation par glisser-déposer.
- **Contenu** : textes, images et vidéos modifiables sans coder, avec
  brouillon puis publication.
- **Médias** : bibliothèque, conversion WebP, suppression des métadonnées.
- **Statistiques** : audience, pages populaires, appareils, ventes.
- **Aperçu responsive** : rendu en ordinateur, tablette et téléphone avant
  publication.
- **Réclamations** : liste priorisée par ancienneté, fiche avec fil des
  échanges, notes internes distinctes des réponses, statuts, résolution,
  et alerte au-delà des quinze jours d'engagement.
- **Estimateur** : barème de l'atelier réglable, avec aperçu de la
  fourchette recalculé en direct.
- **Conformité** : catégories de traceurs et traceurs éditables,
  coupe-circuit, preuves de consentement, suivi des demandes RGPD,
  journal d'audit.
- **Utilisateurs** : attribution des rôles, avec protection du dernier
  compte administrateur.

---

## Technologies

| Domaine | Choix |
| --- | --- |
| Interface | Next.js 15 (App Router), React 19, TypeScript |
| Styles | Tailwind CSS 4, variables de thème pour le mode sombre |
| Animations | Framer Motion, et CSS pur sur le chemin critique |
| Base de données | PostgreSQL |
| ORM | Prisma 6 |
| Authentification | Auth.js (NextAuth 5) — identifiants + TOTP |
| Paiement | Stripe (webhook signé) |
| Emails | Resend |
| Médias | Cloudflare R2 ou Supabase Storage (compatible S3) |
| Hébergement | Vercel |

---

## Installation

Prérequis : Node.js 20.9 ou plus récent, et une base PostgreSQL.

```bash
npm install
cp .env.example .env.local        # puis compléter les variables
npx prisma migrate deploy         # applique le schéma
npm run db:seed                   # catégories, barème, cookies, contenu
npm run dev                       # http://localhost:3000
```

Pour créer le premier compte administrateur, définissez ces deux variables
avant le peuplement :

```bash
SEED_ADMIN_EMAIL="vous@exemple.fr" \
SEED_ADMIN_PASSWORD="une phrase de passe longue" \
npm run db:seed
```

Aucun mot de passe par défaut n'est inscrit dans le code : un compte à
identifiants connus serait la première porte essayée sur un site en ligne.
**Activez la double authentification dès la première connexion**, dans
*Mon compte → Sécurité*.

---

## Variables d'environnement

Le fichier [`.env.example`](.env.example) liste l'ensemble des variables et
leur rôle. Les plus sensibles :

| Variable | Rôle | Obligatoire |
| --- | --- | --- |
| `DATABASE_URL` | Connexion PostgreSQL | oui |
| `AUTH_SECRET` | Signature des sessions (`openssl rand -base64 32`) | oui |
| `ENCRYPTION_KEY` | Chiffrement des secrets 2FA au repos, 32 octets base64 | pour la 2FA |
| `IP_HASH_SALT` | Sel des condensats d'IP (consentement, audit, audience) | oui en production |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Paiement et vérification du webhook | pour le paiement |
| `RESEND_API_KEY` | Courriels transactionnels | pour les emails |
| `S3_*`, `NEXT_PUBLIC_MEDIA_BASE_URL` | Stockage des médias | recommandé |

Seules les variables préfixées `NEXT_PUBLIC_` atteignent le navigateur.
Aucune clé secrète n'est référencée dans un composant client.

---

## Commandes

```bash
npm run dev             # développement
npm run build           # génère le client Prisma puis compile
npm run start           # serveur de production
npm run typecheck       # vérification TypeScript
npm run lint            # ESLint
npm run prisma:migrate  # crée et applique une migration
npm run prisma:deploy   # applique les migrations existantes
npm run prisma:studio   # explorateur de base
npm run db:seed         # données initiales
```

---

## Architecture

```
prisma/
  schema.prisma          modèle de données commenté
  seed.ts                données initiales
src/
  app/
    (site)/              site public — en-tête, pied de page, panier
    admin/               administration — habillage distinct
    api/                 webhooks, consentement, audience, médias, panier
    actions/             actions serveur (panier, devis, contact, admin)
  components/            interface, par domaine
  lib/                   métier : panier, prix, catalogue, sécurité, SEO
  middleware.ts          protection des zones privées (runtime edge)
```

Quelques principes suivis :

- **Les montants sont en centimes entiers.** Aucun calcul monétaire ne passe
  par un nombre flottant.
- **Le prix vient toujours de la base.** Ce que le navigateur envoie n'est
  jamais repris : prix, quantités et remises sont recalculés côté serveur
  avant chaque paiement.
- **Le site public ne lit aucune donnée personnelle dans le rendu.** Le
  compteur du panier est chargé par une requête dédiée, ce qui permet de
  servir les pages depuis le cache.
- **Chaque barème existe en un seul exemplaire.** L'estimateur de l'atelier
  utilise la même fonction côté navigateur et côté serveur.

---

## Sécurité

Mesures en place :

- HTTPS et `Strict-Transport-Security`, en-têtes `Content-Security-Policy`,
  `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` et
  `Permissions-Policy` sur toutes les réponses.
- Mots de passe hachés (bcrypt, coût 12), politique de longueur minimale
  alignée sur les recommandations de la CNIL.
- Double authentification TOTP, secrets chiffrés au repos en AES-256-GCM,
  codes de secours à usage unique dont seuls les condensats sont conservés.
- Verrouillage temporaire après cinq échecs, limitation de débit persistée
  en base sur la connexion, l'inscription, les formulaires publics, les
  devis et le paiement.
- Rôles `CLIENT`, `GESTIONNAIRE`, `ADMIN`, vérifiés à trois niveaux : le
  middleware, le rendu serveur, et chaque action sensible.
- Protection CSRF native des actions serveur de Next.js ; toutes les entrées
  sont validées et bornées par Zod.
- Requêtes paramétrées via Prisma : pas de SQL concaténé.
- Images ré-encodées à l'import, métadonnées EXIF supprimées, types et
  tailles contrôlés.
- Journal d'audit des actions d'administration, avec niveaux de gravité.
- Aucun numéro de carte bancaire n'est saisi ni conservé : la saisie a lieu
  sur les pages du prestataire de paiement.

Ce niveau d'exigence ne rend aucun site invulnérable. Il demande des mises à
jour régulières des dépendances, une surveillance des journaux et un audit
avant chaque évolution importante.

---

## Conformité française et RGPD

- **Cookies** : aucun traceur soumis à consentement n'est déposé avant un
  acte positif. Refuser est aussi simple qu'accepter — même taille, même
  poids visuel, un seul clic. Le choix est conservé six mois, révocable à
  tout moment depuis le pied de page, et une preuve horodatée est conservée
  sans adresse IP en clair.
- **Contenus externes** : la galerie Instagram n'est chargée qu'après accord,
  avec un substitut explicite à défaut.
- **Mesure d'audience** : interne, sans cookie tiers, visiteurs comptés par
  un condensat journalier salé, conservation limitée à treize mois.
- **Droits des personnes** : accès, portabilité et effacement depuis
  l'espace client ; les autres demandes sont enregistrées avec leur échéance
  légale d'un mois et suivies dans l'administration.
- **Effacement** : le compte est anonymisé, les factures étant conservées dix
  ans au titre de l'obligation comptable.
- **Droit de rétractation** : quatorze jours, avec l'exception des biens
  nettement personnalisés (art. L221-28, 3° du code de la consommation).
  Le client confirme expressément cette renonciation avant de payer.
- **Avis clients** : date de collecte affichée, mention d'achat vérifié, et
  explication de la procédure de contrôle.
- **Facturation** : numérotation chronologique continue, sans rupture.

---

## Déploiement

1. Créer le projet sur Vercel et y connecter ce dépôt.
2. Renseigner les variables d'environnement (voir `.env.example`).
3. Appliquer les migrations : `npx prisma migrate deploy`.
4. Peupler la base : `npm run db:seed`.
5. Déclarer le webhook Stripe sur `https://votre-domaine/api/webhooks/stripe`
   pour les événements `checkout.session.completed`, `charge.refunded` et
   `payment_intent.payment_failed`, puis reporter la clé de signature dans
   `STRIPE_WEBHOOK_SECRET`.
6. Vérifier le domaine dans Stripe pour activer Apple Pay et Google Pay.
7. Configurer le stockage des médias (`S3_*`), sans quoi les fichiers
   téléversés disparaîtront au prochain déploiement.

---

## À faire avant la mise en ligne

Cette liste reprend les vérifications à mener avant l'ouverture au public.

**Informations obligatoires**

- [ ] Compléter les mentions légales dans *Administration → Contenu* :
      dénomination, forme juridique, siège, SIRET, TVA, directeur de la
      publication. Ajouter, le cas échéant, l'immatriculation au registre
      des métiers et l'assurance professionnelle.
- [ ] Faire relire et adapter les CGV, la politique de confidentialité et la
      politique de cookies par un professionnel du droit.
- [ ] Renseigner les coordonnées du médiateur de la consommation à
      l'article 11 des CGV.

**Sécurité**

- [ ] Générer `AUTH_SECRET`, `ENCRYPTION_KEY` et `IP_HASH_SALT` propres à la
      production, différents de ceux du développement.
- [ ] Activer la double authentification sur tous les comptes disposant d'un
      accès à l'administration.
- [ ] Vérifier que les rôles correspondent aux besoins réels.
- [ ] Mettre en place des sauvegardes automatiques chiffrées et **tester une
      restauration**.
- [ ] Planifier la purge des compteurs de limitation et des vues de page
      au-delà de treize mois.

**Cookies et données**

- [ ] Inspecter les cookies déposés avant et après consentement, avec les
      outils de développement du navigateur.
- [ ] Déclarer dans *Administration → Conformité* chaque outil tiers réellement
      utilisé, avec sa finalité et sa durée de conservation.
- [ ] Vérifier que le retrait du consentement est aussi simple que son
      acceptation.

**Paiement et commandes**

- [ ] Passer une commande de test de bout en bout en mode réel.
- [ ] Vérifier la réception du webhook, la décrémentation du stock et
      l'émission de la facture.
- [ ] Tester un remboursement partiel et un remboursement total.

**Parcours et rendu**

- [ ] Vérifier l'ensemble des formulaires et des messages d'erreur.
- [ ] Tester les droits d'accès : un client ne doit voir que ses commandes.
- [ ] Contrôler le rendu sur ordinateur, tablette et téléphone, en thème
      clair et en thème sombre.
- [ ] Relancer un audit Lighthouse sur le domaine de production.

---

## Ce qui reste à construire

Pour rester exact sur l'état du projet :

- **Réinitialisation du mot de passe par courriel** : la page existe et
  oriente vers le contact ; le lien à usage unique reste à brancher.
- **Vidéos produit** : le modèle existe en base, l'éditeur produit ne les
  gère pas encore.
- **ESLint** : aucune configuration n'est présente dans le projet. Les
  contrôles en place sont TypeScript en mode strict et la compilation de
  production, tous deux verts.
- **PayPal** : le paiement passe par Stripe, qui propose PayPal comme moyen
  de paiement. Une intégration directe à l'API PayPal n'est pas en place.
- **Génération des PDF** de factures et de devis : les documents sont
  enregistrés et numérotés, le rendu PDF reste à produire.
- **Import automatique des publications Instagram** : les publications sont
  saisies en base, la synchronisation avec l'API Meta n'est pas faite.
- **Éditeur de FAQ, de menus et de bannières** dans l'administration : les
  modèles existent en base, l'écran d'édition reste à écrire.
- **Corps des pages juridiques** : rédigé dans le code, non modifiable
  depuis l'administration — choix assumé, les textes devant être figés
  par un juriste avant mise en ligne.
- **Tests automatisés** : les parcours ont été vérifiés manuellement au
  navigateur ; aucune suite de tests n'est versionnée.
