import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/ProductForm";
import { Flash } from "@/components/Flash";

export const metadata: Metadata = { title: "Mahsulotni tahrirlash" };

export default async function EditProduct({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ xato?: string; ok?: string }> }) {
  const [{ id }, { xato, ok }] = await Promise.all([params, searchParams]);
  const p = await prisma.product.findUnique({ where: { id }, include: { images: { orderBy: { position: "asc" } } } });
  if (!p) notFound();
  return (
    <>
      <Link href="/admin/mahsulotlar" className="note">← Mahsulotlar</Link>
      <h1 style={{ fontSize: "2rem", marginBottom: 4 }}>{p.name}</h1>
      <p className="note"><Link href={`/mahsulot/${p.slug}`} target="_blank">Saytda koʻrish ↗</Link></p>
      <Flash xato={xato} ok={ok} />
      <ProductForm p={p} />
    </>
  );
}
