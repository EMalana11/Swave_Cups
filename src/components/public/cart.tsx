import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export interface CartItem { id: string; name: string; price: number; image: string | null; qty: number }

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  add: (product: Omit<CartItem, "qty">, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "swave-cart-v1";
const MAX_QTY = 99;
const MAX_LINES = 30;

function loadCart(): CartItem[] {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    if (!Array.isArray(raw)) return [];
    return raw.filter((i): i is CartItem => i && typeof i.id === "string" && i.qty >= 1).slice(0, MAX_LINES);
  } catch {
    return []; // storage unavailable or corrupt: start with an empty cart
  }
}

/** The cart remembers products and quantities in this browser. Prices shown here are for display only: the database re-prices every order. */
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* storage full or blocked: the cart still works for this visit */ }
  }, [items]);

  const add = useCallback((product: Omit<CartItem, "qty">, qty = 1) =>
    setItems((current) => {
      const existing = current.find((i) => i.id === product.id);
      if (existing) return current.map((i) => (i.id === product.id ? { ...i, ...product, qty: Math.min(MAX_QTY, i.qty + qty) } : i));
      return [...current, { ...product, qty: Math.min(MAX_QTY, qty) }].slice(0, MAX_LINES);
    }), []);

  const setQty = useCallback((id: string, qty: number) =>
    setItems((current) => (qty < 1 ? current.filter((i) => i.id !== id) : current.map((i) => (i.id === id ? { ...i, qty: Math.min(MAX_QTY, qty) } : i)))), []);

  const remove = useCallback((id: string) => setItems((current) => current.filter((i) => i.id !== id)), []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => ({
    items, add, setQty, remove, clear,
    count: items.reduce((n, i) => n + i.qty, 0),
    subtotal: items.reduce((n, i) => n + i.price * i.qty, 0),
  }), [items, add, setQty, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
