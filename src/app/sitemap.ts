import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, cats, articles] = await Promise.all([
    prisma.product.findMany({ where: { active: true, category: { active: true } }, select: { slug: true } }),
    prisma.category.findMany({ where: { active: true }, select: { slug: true } }),
    prisma.article.findMany({ where: { published: true }, select: { slug: true } }),
  ]);
  return [
    { url: site, changeFrequency: "daily", priority: 1 },
    { url: `${site}/katalog`, changeFrequency: "daily", priority: 0.9 },
    { url: `${site}/maslahatlar`, changeFrequency: "weekly", priority: 0.6 },
    ...cats.map((c) => ({ url: `${site}/katalog?kategoriya=${c.slug}`, changeFrequency: "daily" as const, priority: 0.8 })),
    ...products.map((p) => ({ url: `${site}/mahsulot/${p.slug}`, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...articles.map((a) => ({ url: `${site}/maslahatlar/${a.slug}`, changeFrequency: "monthly" as const, priority: 0.5 })),
  ];
}
