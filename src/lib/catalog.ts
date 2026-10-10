import { prisma } from "./prisma";
import type { CardProduct } from "@/components/ProductCard";

export const cardSelect = {
  id: true, slug: true, name: true, price: true, oldPrice: true, stock: true, emoji: true, sold: true,
  images: { orderBy: { position: "asc" as const }, take: 1, select: { url: true } },
  reviews: { where: { approved: true }, select: { rating: true } },
};

type Row = {
  id: string; slug: string; name: string; price: number; oldPrice: number; stock: number; emoji: string; sold: number;
  images: { url: string }[]; reviews: { rating: number }[];
};

export function toCard(p: Row): CardProduct & { sold: number } {
  const n = p.reviews.length;
  return {
    id: p.id, slug: p.slug, name: p.name, price: p.price, oldPrice: p.oldPrice, stock: p.stock, emoji: p.emoji,
    image: p.images[0]?.url ?? null, sold: p.sold, reviews: n,
    rating: n ? p.reviews.reduce((a, r) => a + r.rating, 0) / n : 0,
  };
}

export const visibleWhere = { active: true, category: { active: true } };

export function getCategories() {
  return prisma.category.findMany({ where: { active: true }, orderBy: { position: "asc" } });
}
