"use client";
import Link from "next/link";
import { useState } from "react";
import { useShop } from "./ShopProvider";
import { useQuote } from "./useQuote";
import { Pic } from "./ProductCard";
import { som } from "@/lib/format";

export function CartView() {
  const { cart, setQty, remove, promo, setPromo } = useShop();
  const { quote, loading, items } = useQuote();
  const [code, setCode] = useState(promo ?? "");

  if (!items && !loading)
    return (
      <div className="empty">
        Savat hozircha boʻsh. Mahsulotlarni koʻrib chiqing va yoqqanini qoʻshing.
        <p><Link className="btn" href="/katalog" style={{ marginTop: 12 }}>Xaridni boshlash</Link></p>
      </div>
    );
  if (!quote) return <div className="empty">Yuklanmoqda…</div>;

  const left = Math.max(0, quote.freeFrom - (quote.subtotal - quote.discount));
  const pct = quote.freeFrom ? Math.min(100, ((quote.subtotal - quote.discount) / quote.freeFrom) * 100) : 100;

  return (
    <div className="two">
      <div className="stack">
        {quote.lines.map((l) => (
          <div className="line" key={l.productId}>
            <div className="mini"><Pic image={l.image} emoji={l.emoji} /></div>
            <div>
              <Link href={`/mahsulot/${l.slug}`}><b>{l.name}</b></Link>
              <small>{som(l.price)}</small>
              <div className="qty">
                <button type="button" onClick={() => setQty(l.productId, (cart[l.productId] ?? 1) - 1)} aria-label="Kamaytirish">−</button>
                <span>{cart[l.productId]}</span>
                <button type="button" disabled={(cart[l.productId] ?? 0) >= l.stock} onClick={() => setQty(l.productId, (cart[l.productId] ?? 0) + 1)} aria-label="Koʻpaytirish">+</button>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <b>{som(l.price * l.quantity)}</b>
              <button className="rm" type="button" onClick={() => remove(l.productId)}>Oʻchirish</button>
            </div>
          </div>
        ))}
      </div>

      <aside className="summary stack">
        {quote.freeFrom > 0 && quote.shippingFee > 0 && (
          <div className="stack" style={{ gap: 8 }}>
            <p className="note" style={{ margin: 0 }}>{left ? <>Bepul yetkazib berishga yana <b>{som(left)}</b> qoldi</> : "Yetkazib berish bepul 🎉"}</p>
            <div className="progress"><i style={{ width: `${pct}%` }} /></div>
          </div>
        )}
        <form
          className="promo"
          onSubmit={(e) => {
            e.preventDefault();
            setPromo(code.trim().toUpperCase() || null);
          }}
        >
          <label className="sr" htmlFor="promoIn">Promokod</label>
          <input id="promoIn" type="text" placeholder="Promokod" value={code} onChange={(e) => setCode(e.target.value)} maxLength={30} />
          <button className="btn ghost" type="submit">Qoʻllash</button>
        </form>
        {quote.promoMessage && <p className={"msg " + (quote.promoMessage.ok ? "ok" : "err")}>{quote.promoMessage.text}</p>}
        <div className="sum">
          <div><span>Mahsulotlar</span><span>{som(quote.subtotal)}</span></div>
          {quote.discount > 0 && <div><span>Chegirma</span><span>−{som(quote.discount)}</span></div>}
          <div><span>Yetkazib berish</span><span>{quote.shipping ? som(quote.shipping) : "Bepul"}</span></div>
          <div className="total"><span>Jami</span><span>{som(quote.total)}</span></div>
        </div>
        <Link className="btn" href="/buyurtma">Buyurtma berish</Link>
      </aside>
    </div>
  );
}
