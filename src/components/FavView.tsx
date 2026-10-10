"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useShop } from "./ShopProvider";
import { ProductCard, type CardProduct } from "./ProductCard";

export function FavView() {
  const { fav, ready } = useShop();
  const [items, setItems] = useState<CardProduct[] | null>(null);
  const key = fav.join(",");

  useEffect(() => {
    if (!ready) return;
    if (!fav.length) return setItems([]);
    fetch(`/api/products?ids=${encodeURIComponent(key)}`).then((r) => r.json()).then(setItems).catch(() => setItems([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ready]);

  if (!ready || items === null) return <div className="empty">Yuklanmoqda…</div>;
  const shown = items.filter((p) => fav.includes(p.id));
  if (!shown.length)
    return (
      <div className="empty">
        Sevimlilar roʻyxati boʻsh. Mahsulot ustidagi yurakchani bosib saqlang.
        <p><Link className="btn" href="/katalog" style={{ marginTop: 12 }}>Katalogga oʻtish</Link></p>
      </div>
    );
  return <div className="grid">{shown.map((p) => <ProductCard key={p.id} p={p} />)}</div>;
}
