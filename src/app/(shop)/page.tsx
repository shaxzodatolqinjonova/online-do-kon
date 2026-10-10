import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { cardSelect, getCategories, toCard, visibleWhere } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";
import { HeartSticker, PawSticker } from "@/components/Stickers";
import { som } from "@/lib/format";
import { availableMethods } from "@/lib/payments/config";

export default async function Home() {
  const [s, cats, best, articles] = await Promise.all([
    getSettings(),
    getCategories(),
    prisma.product.findMany({ where: visibleWhere, orderBy: { sold: "desc" }, take: 8, select: cardSelect }),
    prisma.article.findMany({ where: { published: true }, orderBy: { createdAt: "asc" }, take: 4 }),
  ]);
  const offers = [
    { e: s.offer1Emoji, t: s.offer1Title, d: s.offer1Text },
    { e: s.offer2Emoji, t: s.offer2Title, d: s.offer2Text },
  ].filter((o) => o.t);
  const av = availableMethods(s);
  const pays = [av.CLICK && "Click", av.PAYME && "Payme", av.UZUM && "Uzum", av.CASH && "Naqd (olganda)"].filter(Boolean).join(", ");

  return (
    <div className="wrap">
      <section className="hero">
        <div className="logo-big">
          <PawSticker />
          <h1>{s.shopName}</h1>
          <HeartSticker />
        </div>
        <p className="tagline">{s.tagline}</p>
        <div className="cta">
          <Link className="btn" href="/katalog">Xarid qilish</Link>
          <a className="btn ghost" href="#kategoriyalar">Kategoriyalar</a>
        </div>
        {offers.length > 0 && (
          <div className="offers">
            {offers.map((o) => (
              <div className="offer" key={o.t}>
                <span className="em" aria-hidden="true">{o.e}</span>
                <div><b>{o.t}</b><small>{o.d}</small></div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="block" id="kategoriyalar">
        <div className="head"><div><h2>Kategoriyalar</h2><p>Kerakli boʻlimni tanlang</p></div></div>
        <div className="cats">
          {cats.map((c) => (
            <Link key={c.id} className="cat" href={`/katalog?kategoriya=${c.slug}`}>
              <span className="circ" aria-hidden="true">{c.emoji}</span>
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      {best.length > 0 && (
        <section className="block" id="hitlar">
          <div className="head"><div><h2>Eng koʻp sotilganlar</h2><p>Mushuk egalari eng koʻp tanlaganlari</p></div></div>
          <div className="row">{best.map((p) => <ProductCard key={p.id} p={toCard(p)} />)}</div>
        </section>
      )}

      {articles.length > 0 && (
        <section className="block" id="maslahatlar">
          <div className="head">
            <div><h2>Mushuk parvarishi boʻyicha maslahatlar</h2><p>Qisqa va foydali</p></div>
            <Link href="/maslahatlar" style={{ color: "var(--rose)", fontWeight: 700 }}>Hammasi</Link>
          </div>
          <div className="tips">
            {articles.map((a) => (
              <details key={a.id}>
                <summary>{a.title}</summary>
                <p>{a.body}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      <section className="block" id="yetkazish">
        <div className="head"><div><h2>Yetkazib berish va toʻlov</h2></div></div>
        <div className="info">
          <div><span className="em" aria-hidden="true">🚚</span><h3>Butun Oʻzbekiston boʻylab</h3><p>Toshkent shahri ichida {s.timeCity}, viloyatlarga {s.timeRegion} ichida yetkazamiz.</p></div>
          <div>
            <span className="em" aria-hidden="true">💗</span>
            <h3>{s.shippingFee === 0 ? "Yetkazib berish bepul" : s.freeFrom > 0 ? `${som(s.freeFrom)}dan bepul` : `Yetkazib berish ${som(s.shippingFee)}`}</h3>
            <p>{s.shippingFee === 0 ? "Har qanday buyurtma uchun." : s.freeFrom > 0 ? `Undan kam buyurtmalar uchun yetkazib berish ${som(s.shippingFee)}.` : "Barcha buyurtmalar uchun bir xil narx."}</p>
          </div>
          <div><span className="em" aria-hidden="true">💳</span><h3>Qulay toʻlov</h3><p>{pays || "Toʻlov usuli operator bilan kelishiladi."}</p></div>
        </div>
      </section>
    </div>
  );
}
