"use client";
import Link from "next/link";
import { useState } from "react";
import { useShop } from "./ShopProvider";
import { useQuote } from "./useQuote";
import { PAYMENT_LABEL, REGIONS, som } from "@/lib/format";

type Pay = { CLICK: boolean; PAYME: boolean; UZUM: boolean; CASH: boolean };

export function CheckoutForm({ pays }: { pays: Pay }) {
  const { cart, promo, clearCart } = useShop();
  const { quote, loading, items } = useQuote();
  const methods = (Object.keys(PAYMENT_LABEL) as (keyof Pay)[]).filter((k) => pays[k]);
  const [method, setMethod] = useState<keyof Pay>(methods[0] ?? "CASH");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ number: number; total: number; method: keyof Pay; phone: string } | null>(null);

  if (done)
    return (
      <div className="done">
        <div className="em" aria-hidden="true">🐱💗</div>
        <h2>Buyurtma qabul qilindi</h2>
        <p>
          Buyurtma raqami: <b>#{done.number}</b><br />
          Jami: <b>{som(done.total)}</b> · {done.method === "CASH" ? "naqd pul bilan, olganda" : `${PAYMENT_LABEL[done.method]} orqali`}
        </p>
        <p className="note">Tez orada operatorimiz {done.phone} raqamiga qoʻngʻiroq qilib, buyurtmani tasdiqlaydi.</p>
        <Link className="btn" href="/katalog">Xaridni davom ettirish</Link>
      </div>
    );

  if (!items && !loading)
    return (
      <div className="empty">
        Savat boʻsh.
        <p><Link className="btn" href="/katalog" style={{ marginTop: 12 }}>Mahsulotlarga oʻtish</Link></p>
      </div>
    );
  if (!quote) return <div className="empty">Yuklanmoqda…</div>;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setErr("");
    const r = await fetch("/api/orders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: f.get("name"), phone: f.get("phone"), region: f.get("region"), address: f.get("address"), note: f.get("note"),
        website: f.get("website") ?? "", method, promo,
        items: Object.entries(cart).map(([productId, quantity]) => ({ productId, quantity })),
      }),
    }).catch(() => null);
    setBusy(false);
    const data = await r?.json().catch(() => null);
    if (r?.ok && data) {
      if (data.payUrl) {
        // onlayn toʻlov: savatni tozalab, toʻlov sahifasiga oʻtamiz
        clearCart();
        window.location.href = data.payUrl;
        return;
      }
      setDone({ number: data.number, total: data.total, method, phone: String(f.get("phone")) });
      clearCart();
    } else setErr(data?.error ?? "Buyurtmani yuborib boʻlmadi. Internetni tekshirib, qayta urinib koʻring.");
  }

  return (
    <div className="two">
      <form className="stack" onSubmit={submit}>
        <label className="field"><span>Ismingiz</span><input type="text" name="name" required minLength={2} maxLength={80} autoComplete="name" /></label>
        <label className="field"><span>Telefon raqamingiz</span><input type="tel" name="phone" required placeholder="+998 90 123 45 67" autoComplete="tel" inputMode="tel" /></label>
        <label className="field">
          <span>Viloyat</span>
          <select name="region" required defaultValue="">
            <option value="" disabled>Tanlang</option>
            {REGIONS.map((r) => <option key={r}>{r}</option>)}
          </select>
        </label>
        <label className="field"><span>Manzil</span><input type="text" name="address" required minLength={5} maxLength={300} placeholder="Tuman, koʻcha, uy raqami" autoComplete="street-address" /></label>
        <div className="field">
          <span>Toʻlov usuli</span>
          <div className="pay">
            {methods.map((k) => (
              <label key={k}><input type="radio" name="pay" checked={method === k} onChange={() => setMethod(k)} />{PAYMENT_LABEL[k]}</label>
            ))}
          </div>
        </div>
        <label className="field"><span>Izoh (ixtiyoriy)</span><textarea name="note" rows={2} maxLength={500} /></label>
        <input className="hp" type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
        {err && <p className="msg err" role="alert">{err}</p>}
        <button className="btn" type="submit" disabled={busy}>{busy ? "Yuborilmoqda…" : "Buyurtmani tasdiqlash"}</button>
      </form>

      <aside className="summary stack">
        <b>Buyurtmangiz</b>
        {quote.lines.map((l) => (
          <div key={l.productId} style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
            <span>{l.name} × {l.quantity}</span><span>{som(l.price * l.quantity)}</span>
          </div>
        ))}
        <div className="sum">
          {quote.discount > 0 && <div><span>Chegirma ({quote.promoCode})</span><span>−{som(quote.discount)}</span></div>}
          <div><span>Yetkazib berish</span><span>{quote.shipping ? som(quote.shipping) : "Bepul"}</span></div>
          <div className="total"><span>Toʻlov uchun</span><span>{som(quote.total)}</span></div>
        </div>
        <Link href="/savat" className="note">← Savatga qaytish</Link>
      </aside>
    </div>
  );
}
