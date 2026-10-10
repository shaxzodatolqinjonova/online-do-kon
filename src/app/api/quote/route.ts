import { NextResponse } from "next/server";
import { z } from "zod";
import { quoteCart } from "@/lib/pricing";

const schema = z.object({
  items: z.array(z.object({ productId: z.string().max(40), quantity: z.number().int().min(1).max(99) })).max(50),
  promo: z.string().max(30).optional().nullable(),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Notoʻgʻri soʻrov" }, { status: 400 });
  return NextResponse.json(await quoteCart(parsed.data.items, parsed.data.promo));
}
