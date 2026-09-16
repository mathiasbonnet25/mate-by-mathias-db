"use client";

import {
  createContext,
  useCallback,
  useContext,
  useOptimistic,
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
};

const CartContext = createContext<CartContextValue>({
  count: 0,
  pending: false,
  lastError: null,
  add: async () => false,
});

export function useCart() {
  return useContext(CartContext);
}

/**
 * Compteur de panier partagé par l'en-tête et les fiches produit.
 * L'incrément est optimiste pour que le retour visuel soit immédiat ; le
 * chiffre est ensuite resynchronisé depuis le serveur, seul à faire foi.
 */
export function CartProvider({
  initialCount,
  children,
}: {
  initialCount: number;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [lastError, setLastError] = useState<string | null>(null);
  const [optimisticCount, addOptimistic] = useOptimistic(
    initialCount,
    (current: number, delta: number) => current + delta,
  );

  const add = useCallback(
    async (variantId: string, quantity = 1) => {
      setLastError(null);
      let success = false;
      await new Promise<void>((resolve) => {
        startTransition(async () => {
          addOptimistic(quantity);
          const result = await addToCartAction(variantId, quantity);
          if (!result.ok) setLastError(result.error ?? "Ajout impossible.");
          success = result.ok;
          router.refresh();
          resolve();
        });
      });
      return success;
    },
    [addOptimistic, router],
  );

  return (
    <CartContext.Provider
      value={{ count: optimisticCount, pending, lastError, add }}
    >
      {children}
    </CartContext.Provider>
  );
}
