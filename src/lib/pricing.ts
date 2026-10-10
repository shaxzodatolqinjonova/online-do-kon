import { prisma } from "./prisma";
import { getSettings } from "./settings";
import { som } from "./format";

export type CartInput = { productId: string; quantity: number }[];

export type Quote = {
  /** Soʻralgandan kam berilgan yoki topilmagan mahsulotlar bor (savat eskirgan) */
  adjusted: boolean;
  lines: { productId: string; slug: string; name: string; emoji: string; image: string | null; price: number; quantity: number; stock: number }[];
  subtotal: number;
  discount: number;
  promoCode: string | null;
  promoMessage: { ok: boolean; text: string } | null;
  shipping: number;
  total: number;
  freeFrom: number;
  shippingFee: number;
};

/**
 * Hamma narx shu yerda, serverda hisoblanadi.
 * Brauzerdan faqat "qaysi mahsulot, nechta" va promokod keladi; narx hech qachon.
 */
export async function quoteCart(rawInput: CartInput, promoInput?: string | null): Promise<Quote> {
  // bir mahsulot ikki marta kelsa, soni qo'shiladi
  const merged = new Map<string, number>();
  for (const i of rawInput) merged.set(i.productId, (merged.get(i.productId) ?? 0) + i.quantity);
  const input = [...merged].map(([productId, quantity]) => ({ productId, quantity }));
  const ids = [...merged.keys()];
  const [products, settings] = await Promise.all([
    prisma.product.findMany({
      where: { id: { in: ids }, active: true, category: { active: true } },
      include: { images: { orderBy: { position: "asc" }, take: 1 } },
    }),
    getSettings(),
  ]);
  const byId = new Map(products.map((p) => [p.id, p]));

  const lines: Quote["lines"] = [];
  for (const it of input) {
    const p = byId.get(it.productId);
    if (!p || p.stock <= 0) continue;
    const quantity = Math.min(Math.max(1, Math.floor(it.quantity)), p.stock);
    lines.push({
      productId: p.id,
      slug: p.slug,
      name: p.name,
      emoji: p.emoji,
      image: p.images[0]?.url ?? null,
      price: p.price,
      quantity,
      stock: p.stock,
    });
  }
  const subtotal = lines.reduce((a, l) => a + l.price * l.quantity, 0);

  let discount = 0;
  let promoCode: string | null = null;
  let promoMessage: Quote["promoMessage"] = null;
  const code = (promoInput ?? "").trim().toUpperCase();
  if (code) {
    const promo = await prisma.promo.findUnique({ where: { code } });
    if (!promo || !promo.active || (promo.expiresAt && promo.expiresAt < new Date())) {
      promoMessage = { ok: false, text: "Bunday promokod yoʻq yoki muddati tugagan." };
    } else if (subtotal < promo.minTotal) {
      promoMessage = { ok: false, text: `${code} kodi ${som(promo.minTotal)}dan ortiq buyurtmaga ishlaydi.` };
    } else {
      discount = Math.round((subtotal * promo.percent) / 100);
      promoCode = code;
      promoMessage = { ok: true, text: `${code} qoʻllandi: −${promo.percent}%` };
    }
  }

  const after = subtotal - discount;
  const free = settings.freeFrom > 0 && after >= settings.freeFrom;
  const shipping = lines.length === 0 || free ? 0 : settings.shippingFee;

  const adjusted = lines.length !== input.length || lines.some((l) => l.quantity !== merged.get(l.productId));

  return {
    adjusted,
    lines,
    subtotal,
    discount,
    promoCode,
    promoMessage,
    shipping,
    total: after + shipping,
    freeFrom: settings.freeFrom,
    shippingFee: settings.shippingFee,
  };
}
