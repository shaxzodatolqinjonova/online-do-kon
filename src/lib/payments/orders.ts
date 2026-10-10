import type { Prisma } from "@prisma/client";
import { prisma } from "../prisma";

type Tx = Prisma.TransactionClient;

/** Buyurtmani bekor qiladi va mahsulotlarni omborga qaytaradi (agar hali bekor qilinmagan boʻlsa) */
export async function cancelOrderRestoreStock(tx: Tx, orderId: string) {
  const o = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!o || o.status === "CANCELLED") return;
  for (const it of o.items) {
    if (!it.productId) continue;
    await tx.product.update({ where: { id: it.productId }, data: { stock: { increment: it.quantity }, sold: { decrement: it.quantity } } });
  }
  await tx.order.update({ where: { id: orderId }, data: { status: "CANCELLED" } });
}

export const findOrderByNumber = (n: number) => prisma.order.findUnique({ where: { number: n } });
