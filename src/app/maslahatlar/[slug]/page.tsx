import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ slug: string }> };

const load = (slug: string) => prisma.article.findFirst({ where: { slug, published: true } });

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const a = await load((await params).slug);
  if (!a) return { title: "Maqola topilmadi" };
  return { title: a.title, description: a.body.slice(0, 160), alternates: { canonical: `/maslahatlar/${a.slug}` } };
}

export default async function Article({ params }: Props) {
  const a = await load((await params).slug);
  if (!a) notFound();
  return (
    <div className="wrap prose" style={{ maxWidth: 760 }}>
      <nav className="crumbs"><Link href="/">Bosh sahifa</Link> › <Link href="/maslahatlar">Maslahatlar</Link></nav>
      <h1 className="page-title">{a.title}</h1>
      <p>{a.body}</p>
    </div>
  );
}
