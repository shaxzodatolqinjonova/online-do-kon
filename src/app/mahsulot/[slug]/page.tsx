import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { BuyButtons, Gallery, ReviewForm } from "@/components/ProductBuy";
import { discountPercent, som } from "@/lib/format";

type Props = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  return prisma.product.findFirst({
    where: { slug, active: true, category: { active: true } },
    include: { category: true, images: { orderBy: { position: "asc" } }, reviews: { where: { approved: true }, orderBy: { createdAt: "desc" } } },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await load((await params).slug);
  if (!p) return { title: "Mahsulot topilmadi" };
  const description = (p.description || `${p.name} — ${som(p.price)}. Butun Oʻzbekiston boʻylab yetkazib berish.`).slice(0, 160);
  return {
    title: p.name,
    description,
    alternates: { canonical: `/mahsulot/${p.slug}` },
    openGraph: { title: p.name, description, images: p.images[0] ? [p.images[0].url] : [] },
  };
}

export default async function ProductPage({ params }: Props) {
  const p = await load((await params).slug);
  if (!p) notFound();
  const settings = await getSettings();
  const n = p.reviews.length;
  const rating = n ? p.reviews.reduce((a, r) => a + r.rating, 0) / n : 0;
  const disc = discountPercent(p.price, p.oldPrice);
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description,
    image: p.images.map((i) => (i.url.startsWith("http") ? i.url : site + i.url)),
    offers: {
      "@type": "Offer",
      priceCurrency: "UZS",
      price: p.price,
      availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${site}/mahsulot/${p.slug}`,
    },
    ...(n ? { aggregateRating: { "@type": "AggregateRating", ratingValue: rating.toFixed(1), reviewCount: n } } : {}),
  };

  return (
    <div className="wrap">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <nav className="crumbs" aria-label="Yoʻl">
        <Link href="/">Bosh sahifa</Link> › <Link href={`/katalog?kategoriya=${p.category.slug}`}>{p.category.name}</Link> › <span>{p.name}</span>
      </nav>
      <div className="pd">
        <Gallery images={p.images.map((i) => i.url)} emoji={p.emoji} badge={disc ? `−${disc}%` : undefined} />
        <div>
          <h1 style={{ fontSize: "1.8rem", marginBottom: 6 }}>{p.name}</h1>
          <div className="stars">
            {n ? <>{"★".repeat(Math.round(rating))}{"☆".repeat(5 - Math.round(rating))} <span>{rating.toFixed(1)} · {n} ta sharh</span></> : <span>Hali sharh yoʻq</span>}
          </div>
          <p>{p.description}</p>
          {p.category.slug === "dorilar" && settings.drugNote && <p className="warn">⚕️ {settings.drugNote}</p>}
          <p className="stock" style={{ margin: "6px 0", fontWeight: 800, color: p.stock > 0 ? "var(--ok)" : "var(--rose)" }}>
            {p.stock > 0 ? (p.stock <= 5 ? `Omborda bor (${p.stock} ta qoldi)` : "Omborda bor") : "Omborda yoʻq"}
          </p>
          <div className="price" style={{ margin: "12px 0" }}>
            <b style={{ fontSize: "1.5rem" }}>{som(p.price)}</b>
            {disc > 0 && <s>{som(p.oldPrice)}</s>}
          </div>
          <BuyButtons id={p.id} stock={p.stock} />
        </div>
      </div>

      <section className="block" style={{ marginTop: 40, maxWidth: 760 }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: 14 }}>Sharhlar</h2>
        <div className="stack" style={{ marginBottom: 18 }}>
          {n ? (
            p.reviews.map((r) => (
              <div className="rev" key={r.id}>
                <b>{r.name}</b>
                <span className="stars">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                <p>{r.text}</p>
              </div>
            ))
          ) : (
            <p className="note" style={{ margin: 0 }}>Bu mahsulotga hali sharh yozilmagan. Birinchi boʻlib fikr qoldiring.</p>
          )}
        </div>
        <ReviewForm productId={p.id} />
      </section>
    </div>
  );
}
