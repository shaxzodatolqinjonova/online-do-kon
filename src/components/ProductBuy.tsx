"use client";
import { useState } from "react";
import { useShop } from "./ShopProvider";
import { Pic } from "./ProductCard";

export function Gallery({ images, emoji, badge }: { images: string[]; emoji: string; badge?: string }) {
  const [i, setI] = useState(0);
  return (
    <div>
      <div className="tile" style={{ cursor: "default" }}>
        <Pic image={images[i] ?? null} emoji={emoji} />
        {badge && <span className="badge">{badge}</span>}
      </div>
      {images.length > 1 && (
        <div className="gallery">
          {images.map((u, k) => (
            <button key={u} type="button" aria-current={k === i} aria-label={`${k + 1}-rasm`} onClick={() => setI(k)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function BuyButtons({ id, stock }: { id: string; stock: number }) {
  const { add, toggleFav, fav, ready } = useShop();
  const on = ready && fav.includes(id);
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <button className="btn" disabled={stock <= 0} onClick={() => add(id, stock)} type="button">
        {stock <= 0 ? "Tugagan" : "Savatga qoʻshish"}
      </button>
      <button className="btn ghost" onClick={() => toggleFav(id)} aria-pressed={on} type="button">
        {on ? "Sevimlilarda 💗" : "Sevimlilarga"}
      </button>
    </div>
  );
}

export function ReviewForm({ productId }: { productId: string }) {
  const { toast } = useShop();
  const [rating, setRating] = useState(5);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setErr("");
    const r = await fetch("/api/reviews", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ productId, rating, name: f.get("name"), text: f.get("text"), website: f.get("website") ?? "" }),
    }).catch(() => null);
    setBusy(false);
    if (r?.ok) {
      setSent(true);
      toast("Rahmat! Sharhingiz tekshiruvdan keyin chiqadi 💗");
    } else {
      setErr((await r?.json().catch(() => null))?.error ?? "Sharhni yuborib boʻlmadi. Qayta urinib koʻring.");
    }
  }

  if (sent) return <p className="msg ok">Rahmat! Sharhingiz tekshiruvdan keyin saytda chiqadi 💗</p>;
  return (
    <form onSubmit={submit} className="summary stack">
      <b>Sharh qoldiring</b>
      <div className="rate" role="radiogroup" aria-label="Baho">
        {[1, 2, 3, 4, 5].map((i) => (
          <button key={i} type="button" className={i <= rating ? "on" : ""} role="radio" aria-checked={i === rating} aria-label={`${i} yulduz`} onClick={() => setRating(i)}>★</button>
        ))}
      </div>
      <input type="text" name="name" placeholder="Ismingiz" required minLength={2} maxLength={40} />
      <textarea name="text" rows={3} placeholder="Fikringiz" required minLength={3} maxLength={400} />
      <input className="hp" type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      {err && <p className="msg err" role="alert">{err}</p>}
      <button className="btn" type="submit" disabled={busy} style={{ alignSelf: "flex-start" }}>{busy ? "Yuborilmoqda…" : "Sharhni yuborish"}</button>
    </form>
  );
}
