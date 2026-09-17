-- Jeton d'accès à la page de confirmation de commande.
--
-- Le numéro de commande est séquentiel, donc énumérable : il ne peut pas
-- servir seul de preuve d'accès pour une commande passée sans compte.
--
-- La colonne est d'abord ajoutée sans contrainte, puis renseignée pour les
-- commandes existantes, et seulement ensuite passée en NOT NULL : une
-- migration ne doit jamais échouer sur une table déjà peuplée.

ALTER TABLE "Order" ADD COLUMN "accessToken" TEXT;

UPDATE "Order"
SET "accessToken" = replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')
WHERE "accessToken" IS NULL;

ALTER TABLE "Order" ALTER COLUMN "accessToken" SET NOT NULL;

CREATE UNIQUE INDEX "Order_accessToken_key" ON "Order"("accessToken");
