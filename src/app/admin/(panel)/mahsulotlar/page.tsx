import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { som } from "@/lib/format";
import { Pic } from "@/components/ProductCard";
import { Flash } from "@/components/Flash";

export const metadata: Metadata = { title: "Mahsulotlar" };

export default async function Products({ searchParams }: { searchParams: Promise<{ xato?: string; ok?: string }> }) {
  const { xato, ok } = await searchParams;
  const list = await prisma.product.findMany({
    orderBy: [{ category: { position: "asc" } }, { name: "asc" }],
    include: { category: true, images: { orderBy: { position: "asc" }, take: 1 } },
  });
  return (
    <>
      <div className="phead">
        <h1 style={{ fontSize: "2rem" }}>Mahsulotlar</h1>
        <Link className="btn" href="/admin/mahsulotlar/yangi">Mahsulot qoʻshish</Link>
      </div>
      <Flash xato={xato} ok={ok} />
      <p className="note">{list.length} ta mahsulot. Yashirilgan mahsulot saytda koʻrinmaydi.</p>
      <div className="alist">
        {list.map((p) => (
          <div className="arow" key={p.id}>
            <div className="mini"><Pic image={p.images[0]?.url ?? null} emoji={p.emoji} /></div>
            <div>
              <b>{p.name}</b>
              <small>{p.category.name} · {som(p.price)} · omborda {p.stock} ta{p.active ? "" : " · yashirin"}</small>
            </div>
            <div className="acts"><Link className="btn ghost sm" href={`/admin/mahsulotlar/${p.id}`}>Tahrirlash</Link></div>
          </div>
        ))}
        {!list.length && <div className="empty">Mahsulot yoʻq. “Mahsulot qoʻshish” tugmasini bosing.</div>}
      </div>
    </>
  );
}
