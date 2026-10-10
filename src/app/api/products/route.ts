import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cardSelect, toCard, visibleWhere } from "@/lib/catalog";

// Sevimlilar uchun: ?ids=a,b,c
export async function GET(req: Request) {
  const ids = (new URL(req.url).searchParams.get("ids") ?? "").split(",").filter(Boolean).slice(0, 60);
  const rows = await prisma.product.findMany({ where: { ...visibleWhere, id: { in: ids } }, select: cardSelect });
  return NextResponse.json(rows.map(toCard));
}
