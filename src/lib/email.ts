import "server-only";
import { Resend } from "resend";

import { siteUrl } from "@/lib/env";
import { formatPrice } from "@/lib/utils";

/**
 * Courriels transactionnels.
 *
 * Si aucune clé Resend n'est configurée (développement local), les messages
 * sont écrits dans la console plutôt qu'envoyés : aucune donnée personnelle
 * ne part vers un service externe par accident.
 */
const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

const FROM =
  process.env.EMAIL_FROM ?? "Mate by Mathias <contact@matebymathias.fr>";
const WORKSHOP = process.env.EMAIL_CONTACT ?? "contact@matebymathias.fr";

async function send(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  if (!resend) {
    console.info(
      `[email] (non envoyé, RESEND_API_KEY absente) → ${params.to} : ${params.subject}`,
    );
    return;
  }
  try {
    await resend.emails.send({
      from: FROM,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
  } catch (error) {
    console.error("[email] envoi impossible", error);
  }
}

/** Gabarit sobre, lisible dans tous les clients de messagerie. */
function layout(title: string, body: string): string {
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:#f7f7f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#1a1a18;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f6;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e6e6e2;">
        <tr><td style="padding:32px 32px 0;border-bottom:1px solid #e6e6e2;">
          <p style="margin:0 0 24px;font-size:12px;letter-spacing:.28em;text-transform:uppercase;color:#a87b2f;">Mate by Mathias</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <h1 style="margin:0 0 20px;font-size:22px;font-weight:400;">${escapeHtml(title)}</h1>
          ${body}
        </td></tr>
        <tr><td style="padding:24px 32px;border-top:1px solid #e6e6e2;font-size:12px;color:#74746c;line-height:1.7;">
          <p style="margin:0 0 8px;">Mate by Mathias — atelier de peinture et de restauration de vélos.</p>
          <p style="margin:0;"><a href="${siteUrl}/confidentialite" style="color:#a87b2f;">Politique de confidentialité</a> · <a href="${siteUrl}/contact" style="color:#a87b2f;">Nous contacter</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.75;color:#4a4a45;">${escapeHtml(text)}</p>`;
}

export async function sendQuoteAcknowledgement(params: {
  to: string;
  firstName: string;
  number: string;
  estimateCents: number;
}): Promise<void> {
  await send({
    to: params.to,
    subject: `Votre demande de devis ${params.number}`,
    html: layout(
      "Votre demande est bien arrivée",
      [
        paragraph(`Bonjour ${params.firstName},`),
        paragraph(
          `J'ai bien reçu votre demande de personnalisation, enregistrée sous la référence ${params.number}.`,
        ),
        paragraph(
          `L'estimation calculée en ligne s'élève à ${formatPrice(params.estimateCents)}. Ce montant est une estimation : un devis personnalisé sera établi après étude de votre projet.`,
        ),
        paragraph(
          "Je reviens vers vous sous trois jours ouvrés. N'hésitez pas à répondre à ce message pour ajouter des photos ou des précisions.",
        ),
        paragraph("Mathias"),
      ].join(""),
    ),
  });
}

export async function sendOrderConfirmation(params: {
  to: string;
  number: string;
  totalCents: number;
}): Promise<void> {
  await send({
    to: params.to,
    subject: `Confirmation de votre commande ${params.number}`,
    html: layout(
      "Merci pour votre commande",
      [
        paragraph(
          `Votre commande ${params.number} est confirmée, pour un montant de ${formatPrice(params.totalCents)} TTC.`,
        ),
        paragraph(
          "Vous recevrez un nouveau message dès l'expédition, avec le numéro de suivi.",
        ),
        `<p style="margin:24px 0 0;"><a href="${siteUrl}/compte/commandes" style="display:inline-block;background:#1a1a18;color:#ffffff;padding:14px 28px;font-size:12px;letter-spacing:.16em;text-transform:uppercase;text-decoration:none;">Suivre ma commande</a></p>`,
      ].join(""),
    ),
  });
}

export async function sendNewsletterConfirmation(params: {
  to: string;
  token: string;
}): Promise<void> {
  const link = `${siteUrl}/newsletter/confirmation?token=${encodeURIComponent(params.token)}`;
  await send({
    to: params.to,
    subject: "Confirmez votre inscription à la newsletter",
    html: layout(
      "Une dernière étape",
      [
        paragraph(
          "Merci de confirmer votre inscription en cliquant sur le bouton ci-dessous. Sans cette confirmation, aucune information ne vous sera envoyée.",
        ),
        `<p style="margin:24px 0;"><a href="${link}" style="display:inline-block;background:#a87b2f;color:#ffffff;padding:14px 28px;font-size:12px;letter-spacing:.16em;text-transform:uppercase;text-decoration:none;">Confirmer mon inscription</a></p>`,
        paragraph(
          "Si vous n'êtes pas à l'origine de cette demande, ignorez simplement ce message : votre adresse sera supprimée automatiquement.",
        ),
      ].join(""),
    ),
  });
}

export async function sendClaimAcknowledgement(params: {
  to: string;
  firstName: string;
  number: string;
}): Promise<void> {
  await send({
    to: params.to,
    subject: `Votre réclamation ${params.number} est enregistrée`,
    html: layout(
      "Nous avons bien reçu votre réclamation",
      [
        paragraph(`Bonjour ${params.firstName},`),
        paragraph(
          `Votre demande est enregistrée sous le numéro de dossier ${params.number}. Conservez-le : il nous permet de retrouver votre dossier à chaque échange.`,
        ),
        paragraph(
          "Nous l'examinons et revenons vers vous sous quinze jours au plus tard. Si nous avons besoin d'un élément complémentaire, nous vous le demanderons directement.",
        ),
        paragraph(
          "Vous pouvez répondre à ce message pour ajouter des photos ou des documents à votre dossier.",
        ),
        paragraph("Mathias"),
      ].join(""),
    ),
  });
}

export async function notifyWorkshop(params: {
  subject: string;
  body: string;
}): Promise<void> {
  await send({
    to: WORKSHOP,
    subject: params.subject,
    html: layout(
      params.subject,
      `<pre style="margin:0;font-family:inherit;font-size:14px;line-height:1.7;white-space:pre-wrap;color:#4a4a45;">${escapeHtml(params.body)}</pre>`,
    ),
  });
}
