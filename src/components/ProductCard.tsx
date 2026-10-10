"use client";
import Link from "next/link";
import { useShop } from "./ShopProvider";
import { HeartIcon } from "./Stickers";
import { discountPercent, som } from "@/lib/format";

export type CardProduct = {
  id: string;
  slug: string;
  name: string;
  price: number;
  oldPrice: number;
  stock: number;
  emoji: string;
  image: string | null;
  rating: number;
  reviews: number;
};

export function Pic({ image, emoji }: { image: string | null; emoji: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return image ? <img src={image} alt="" loading="lazy" /> : <span className="emo" aria-hidden="true">{emoji}</span>;
}

export function ProductCard({ p }: { p: CardProduct }) {
  const { fav, toggleFav, add, ready } = useShop();
  const on = ready && fav.includes(p.id);
  const disc = discountPercent(p.price, p.oldPrice);
  const out = p.stock <= 0;
  return (
    <article className="card">
      <Link className="tile" href={`/mahsulot/${p.slug}`} aria-label={`${p.name} haqida batafsil`}>
        <Pic image={p.image} emoji={p.emoji} />
        {disc > 0 && <span className="badge">−{disc}%</span>}
      </Link>
      <button className={"fav" + (on ? " on" : "")} onClick={() => toggleFav(p.id)} aria-pressed={on} aria-label="Sevimlilarga" type="button">
        <HeartIcon />
      </button>
      <div className="cbody">
        <h3>
          <Link className="link" href={`/mahsulot/${p.slug}`}>{p.name}</Link>
        </h3>
        <div className="stars">
          {p.reviews > 0 ? (
            <>
              {"★".repeat(Math.round(p.rating))}
              {"☆".repeat(5 - Math.round(p.rating))} <span>{p.rating.toFixed(1)} · {p.reviews} ta sharh</span>
            </>
          ) : (
            <span>Hali sharh yoʻq</span>
          )}
        </div>
        <div className="price">
          <b>{som(p.price)}</b>
          {disc > 0 && <s>{som(p.oldPrice)}</s>}
        </div>
        <button className="btn add" disabled={out} onClick={() => add(p.id, p.stock)} type="button">
          {out ? "Tugagan" : "Savatga qoʻshish"}
        </button>
      </div>
    </article>
  );
}
