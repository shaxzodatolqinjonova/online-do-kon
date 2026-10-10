import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { quoteCart } from "@/lib/pricing";
import { getSettings } from "@/lib/settings";
import { normalizePhone } from "@/lib/phone";
import { REGIONS } from "@/lib/format";
import { allow, clientIp } from "@/lib/ratelimit";

const schema = z.object({
  name: z.string().trim().min(2, "Ismingizni kiriting.").max(80),
  phone: z.string().trim().max(30),
  region: z.enum(REGIONS, { message: "Viloyatni tanlang." }),
  address: z.string().trim().min(5, "Manzilni toʻliqroq kiriting.").max(300),
  note: z.string().trim().max(500).optional().default(""),
  method: z.enum(["CLICK", "PAYME", "UZUM", "CASH"]),
  promo: z.string().max(30).optional().nullable(),
  items: z.array(z.object({ productId: z.string().max(40), quantity: z.number().int().min(1).max(99) })).min(1, "Savat boʻsh.").max(50),
  website: z.string().max(200).optional().default(""), // yashirin maydon: faqat botlar to'ldiradi
});

const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Maʼlumotlar notoʻgʻri.");
  const data = parsed.data;
  if (data.website) return NextResponse.json({ number: 0, total: 0, method: data.method }); // bot: saqlamaymiz

  if (!(await allow(`order:${await clientIp()}`, 5, 600))) return fail("Juda koʻp urinish. Birozdan keyin qayta urinib koʻring.", 429);

  const phone = normalizePhone(data.phone);
  if (!phone) return fail("Telefon raqamini +998 90 123 45 67 koʻrinishida kiriting.");

  const settings = await getSettings();
  const enabled = { CLICK: settings.payClick, PAYME: settings.payPayme, UZUM: settings.payUzum, CASH: settings.payCash };
  if (!enabled[data.method]) return fail("Bu toʻlov usuli hozir mavjud emas.");

  const quote = await quoteCart(data.items, data.promo);
  if (quote.lines.length === 0) return fail("Savatdagi mahsulotlar omborda qolmagan.");
  if (quote.adjusted) return fail("Ayrim mahsulotlar omborda yetarli emas. Savatni yangilang.", 409);

  try {
    const order = await prisma.$transaction(async (tx) => {
      for (const l of quote.lines) {
        // ombordagi qoldiqni atomik kamaytirish: yetmasa, buyurtma bekor
        const r = await tx.product.updateMany({
          where: { id: l.productId, stock: { gte: l.quantity } },
          data: { stock: { decrement: l.quantity }, sold: { increment: l.quantity } },
        });
        if (r.count !== 1) throw new Error("STOCK:" + l.name);
      }
      return tx.order.create({
        data: {
          name: data.name,
          phone,
          region: data.region,
          address: data.address,
          note: data.note,
          subtotal: quote.subtotal,
          discount: quote.discount,
          promoCode: quote.promoCode,
          shipping: quote.shipping,
          total: quote.total,
          method: data.method,
          items: { create: quote.lines.map((l) => ({ productId: l.productId, name: l.name, price: l.price, quantity: l.quantity })) },
        },
      });
    });
    return NextResponse.json({ number: order.number, total: order.total, method: order.method });
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("STOCK:")) return fail(`«${e.message.slice(6)}» omborda yetarli emas. Savatni yangilang.`, 409);
    console.error(e);
    return fail("Buyurtmani saqlab boʻlmadi. Qayta urinib koʻring.", 500);
  }
}
