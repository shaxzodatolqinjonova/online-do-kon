import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Mushuk parvarishi boʻyicha maslahatlar",
  description: "Mushukni ovqatlantirish, choʻmiltirish, junni tarash va salomatligi haqida qisqa va foydali maslahatlar.",
  alternates: { canonical: "/maslahatlar" },
};

export default async function Articles() {
  const list = await prisma.article.findMany({ where: { published: true }, orderBy: { createdAt: "asc" } });
  return (
    <div className="wrap">
      <h1 className="page-title">Mushuk parvarishi boʻyicha maslahatlar</h1>
      <div className="tips" style={{ marginTop: 18 }}>
        {list.map((a) => (
          <Link key={a.id} href={`/maslahatlar/${a.slug}`} className="summary" style={{ textDecoration: "none", display: "block" }}>
            <h2 style={{ fontSize: "1.15rem", marginBottom: 6 }}>{a.title}</h2>
            <p style={{ margin: 0, color: "var(--muted)" }}>{a.body.slice(0, 140)}…</p>
          </Link>
        ))}
        {!list.length && <div className="empty">Hozircha maqola yoʻq.</div>}
      </div>
    </div>
  );
}
