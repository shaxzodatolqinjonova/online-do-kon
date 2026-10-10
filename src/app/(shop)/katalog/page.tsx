import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { cardSelect, getCategories, toCard, visibleWhere } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";
import { SortSelect } from "@/components/SortSelect";

type Props = { searchParams: Promise<{ q?: string; kategoriya?: string; saralash?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { kategoriya, q, saralash } = await searchParams;
  const cat = kategoriya ? await prisma.category.findUnique({ where: { slug: kategoriya } }) : null;
  return {
    title: cat ? cat.name : "Barcha mahsulotlar",
    description: cat ? `${cat.name}: mushukchalar uchun sifatli mahsulotlar. Butun Oʻzbekiston boʻylab yetkazib berish.` : "Mushukchalar uchun taom, dori, aksessuar, kiyimcha va parvarish vositalari katalogi.",
    alternates: { canonical: cat ? `/katalog?kategoriya=${cat.slug}` : "/katalog" },
    // qidiruv natijalari va saralash variantlari Google'ga takroriy sahifa boʻlib koʻrinmasin
    ...(q || saralash ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function Katalog({ searchParams }: Props) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 80);
  const sort = ["pop", "cheap", "exp", "rate"].includes(sp.saralash ?? "") ? sp.saralash! : "pop";
  const [cats, settings] = await Promise.all([getCategories(), getSettings()]);
  const active = cats.find((c) => c.slug === sp.kategoriya);

  const rows = await prisma.product.findMany({
    where: {
      ...visibleWhere,
      ...(active ? { categoryId: active.id } : {}),
      ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }, { category: { name: { contains: q, mode: "insensitive" } } }] } : {}),
    },
    orderBy: sort === "cheap" ? { price: "asc" } : sort === "exp" ? { price: "desc" } : { sold: "desc" },
    select: cardSelect,
  });
  const list = rows.map(toCard);
  if (sort === "rate") list.sort((a, b) => b.rating - a.rating || b.reviews - a.reviews);

  const href = (slug?: string) => {
    const p = new URLSearchParams();
    if (slug) p.set("kategoriya", slug);
    if (q) p.set("q", q);
    if (sort !== "pop") p.set("saralash", sort);
    const s = p.toString();
    return "/katalog" + (s ? `?${s}` : "");
  };

  return (
    <div className="wrap">
      <section className="block" style={{ marginTop: 28 }}>
        <div className="head">
          <div>
            <h1 className="page-title" style={{ margin: 0 }}>{active ? active.name : "Barcha mahsulotlar"}</h1>
            <p>{list.length} ta mahsulot{q ? ` · “${q}” boʻyicha` : ""}</p>
          </div>
        </div>
        {active?.slug === "dorilar" && <p className="notice-warn">⚕️ {settings.drugNote}</p>}
        <div className="tools">
          <div className="chips" role="group" aria-label="Kategoriya boʻyicha saralash">
            <Link className="chip" href={href()} aria-current={!active}>Hammasi</Link>
            {cats.map((c) => (
              <Link key={c.id} className="chip" href={href(c.slug)} aria-current={active?.id === c.id}>{c.name}</Link>
            ))}
          </div>
          <Suspense fallback={null}>
            <SortSelect value={sort} />
          </Suspense>
        </div>
        <div className="grid">
          {list.length ? (
            list.map((p) => <ProductCard key={p.id} p={p} />)
          ) : (
            <div className="empty">Hech narsa topilmadi. Boshqa soʻz bilan qidirib koʻring yoki <Link href="/katalog">barcha mahsulotlarni</Link> koʻring.</div>
          )}
        </div>
      </section>
    </div>
  );
}
