"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type Cart = Record<string, number>;
type Ctx = {
  ready: boolean;
  cart: Cart;
  cartCount: number;
  fav: string[];
  promo: string | null;
  add: (id: string, max?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clearCart: () => void;
  toggleFav: (id: string) => boolean;
  setPromo: (code: string | null) => void;
  toast: (text: string) => void;
};

const ShopCtx = createContext<Ctx | null>(null);

function read<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [cart, setCart] = useState<Cart>({});
  const [fav, setFav] = useState<string[]>([]);
  const [promo, setPromoState] = useState<string | null>(null);
  const [toastText, setToastText] = useState("");

  useEffect(() => {
    setCart(read<Cart>("miyov-cart", {}));
    setFav(read<string[]>("miyov-fav", []));
    setPromoState(read<string | null>("miyov-promo", null));
    setReady(true);
  }, []);

  const toast = useCallback((text: string) => {
    setToastText(text);
    window.clearTimeout((toast as unknown as { t?: number }).t);
    (toast as unknown as { t?: number }).t = window.setTimeout(() => setToastText(""), 2400);
  }, []);

  const saveCart = (c: Cart) => {
    setCart(c);
    write("miyov-cart", c);
  };

  const value = useMemo<Ctx>(
    () => ({
      ready,
      cart,
      cartCount: Object.values(cart).reduce((a, b) => a + b, 0),
      fav,
      promo,
      toast,
      add(id, max = 99) {
        const have = cart[id] ?? 0;
        if (have >= max) return toast("Omborda boshqa qolmadi");
        saveCart({ ...cart, [id]: have + 1 });
        toast("Savatga qoʻshildi 🐾");
      },
      setQty(id, qty) {
        const next = { ...cart };
        if (qty <= 0) delete next[id];
        else next[id] = Math.min(qty, 99);
        saveCart(next);
      },
      remove(id) {
        const next = { ...cart };
        delete next[id];
        saveCart(next);
      },
      clearCart() {
        saveCart({});
        setPromoState(null);
        write("miyov-promo", null);
      },
      toggleFav(id) {
        const on = !fav.includes(id);
        const next = on ? [...fav, id] : fav.filter((x) => x !== id);
        setFav(next);
        write("miyov-fav", next);
        toast(on ? "Sevimlilarga qoʻshildi 💗" : "Sevimlilardan olib tashlandi");
        return on;
      },
      setPromo(code) {
        setPromoState(code);
        write("miyov-promo", code);
      },
    }),
    [ready, cart, fav, promo, toast],
  );

  return (
    <ShopCtx.Provider value={value}>
      {children}
      <div className={"toast" + (toastText ? " show" : "")} role="status" aria-live="polite">
        {toastText}
      </div>
    </ShopCtx.Provider>
  );
}

export function useShop() {
  const c = useContext(ShopCtx);
  if (!c) throw new Error("ShopProvider topilmadi");
  return c;
}
