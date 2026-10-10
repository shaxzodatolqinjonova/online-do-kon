"use client";
import { useEffect, useState } from "react";
import { useShop } from "./ShopProvider";
import type { Quote } from "@/lib/pricing";

/** Savatdagi mahsulotlarni serverga yuborib, haqiqiy narxlarni oladi. */
export function useQuote() {
  const { cart, promo, ready, setQty } = useShop();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const key = JSON.stringify([cart, promo]);

  useEffect(() => {
    if (!ready) return;
    const items = Object.entries(cart).map(([productId, quantity]) => ({ productId, quantity }));
    if (!items.length) {
      setQuote(null);
      setLoading(false);
      return;
    }
    let stop = false;
    setLoading(true);
    fetch("/api/quote", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ items, promo }) })
      .then((r) => r.json())
      .then((q: Quote) => {
        if (stop) return;
        setQuote(q);
        // savatdan eskirgan/qolmagan mahsulotlarni tozalash
        const ids = new Set(q.lines.map((l) => l.productId));
        for (const id of Object.keys(cart)) if (!ids.has(id)) setQty(id, 0);
      })
      .catch(() => {})
      .finally(() => !stop && setLoading(false));
    return () => {
      stop = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ready]);

  return { quote, loading, items: Object.keys(cart).length };
}
