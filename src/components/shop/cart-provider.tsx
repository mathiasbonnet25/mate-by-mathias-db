"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";

import { addToCartAction } from "@/app/actions/cart";

type CartContextValue = {
  count: number;
  pending: boolean;
  lastError: string | null;
  add: (variantId: string, quantity?: number) => Promise<boolean>;
  refresh: () => void;
};

const CartContext = createContext<CartContextValue>({
  count: 0,
  pending: false,
  lastError: null,
  add: async () => false,
  refresh: () => {},
});

export function useCart() {
  return useContext(CartContext);
}

/**
 * Compteur de panier partagé par l'en-tête et les fiches produit.
 *
 * Le chiffre est récupéré par une requête dédiée plutôt que calculé dans le
 * rendu de chaque page : c'est la seule donnée personnelle de l'en-tête, et
 * l'isoler ainsi permet de servir les pages publiques depuis le cache.
 * L'incrément est optimiste pour un retour visuel immédiat, puis
 * resynchronisé sur la valeur du serveur, seule à faire foi.
 */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [count, setCount] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    fetch("/api/cart/count", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : { count: 0 }))
      .then((data: { count?: number }) => setCount(data.count ?? 0))
      .catch(() => {
        // Réseau indisponible : on conserve la dernière valeur connue.
      });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const add = useCallback(
    async (variantId: string, quantity = 1) => {
      setLastError(null);
      setCount((c) => c + quantity);

      const result = await addToCartAction(variantId, quantity);
      if (!result.ok) {
        setLastError(result.error ?? "Ajout impossible.");
      }

      refresh();
      startTransition(() => router.refresh());
      return result.ok;
    },
    [refresh, router],
  );

  return (
    <CartContext.Provider value={{ count, pending, lastError, add, refresh }}>
      {children}
    </CartContext.Provider>
  );
}
