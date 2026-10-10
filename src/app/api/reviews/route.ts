import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { allow, clientIp } from "@/lib/ratelimit";

const schema = z.object({
  productId: z.string().max(40),
  name: z.string().trim().min(2, "Ismingizni kiriting.").max(40),
  rating: z.number().int().min(1).max(5),
  text: z.string().trim().min(3, "Fikringizni yozing.").max(400),
  website: z.string().max(200).optional().default(""),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Maʼlumotlar notoʻgʻri." }, { status: 400 });
  if (parsed.data.website) return NextResponse.json({ ok: true }); // bot: saqlamaymiz
  if (!(await allow(`review:${await clientIp()}`, 3, 600)))
    return NextResponse.json({ error: "Juda koʻp urinish. Birozdan keyin qayta urinib koʻring." }, { status: 429 });
  const { productId, name, rating, text } = parsed.data;
  const exists = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
  if (!exists) return NextResponse.json({ error: "Mahsulot topilmadi." }, { status: 404 });
  await prisma.review.create({ data: { productId, name, rating, text, approved: false } });
  return NextResponse.json({ ok: true });
}
