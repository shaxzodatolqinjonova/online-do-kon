import type { Metadata } from "next";
import Link from "next/link";
import { ProductForm } from "@/components/ProductForm";
import { Flash } from "@/components/Flash";

export const metadata: Metadata = { title: "Yangi mahsulot" };

export default async function NewProduct({ searchParams }: { searchParams: Promise<{ xato?: string }> }) {
  const { xato } = await searchParams;
  return (
    <>
      <Link href="/admin/mahsulotlar" className="note">← Mahsulotlar</Link>
      <h1 style={{ fontSize: "2rem", marginBottom: 8 }}>Yangi mahsulot</h1>
      <Flash xato={xato} />
      <ProductForm />
    </>
  );
}
