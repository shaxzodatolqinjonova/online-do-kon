import { headers } from "next/headers";
import { prisma } from "./prisma";

export async function clientIp(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "unknown").trim();
}

/** `limit` ta so'rovga `windowSec` soniyada ruxsat. true = ruxsat bor. */
export async function allow(key: string, limit: number, windowSec: number): Promise<boolean> {
  const now = new Date();
  const row = await prisma.rateLimit.findUnique({ where: { key } });
  if (!row || row.resetAt < now) {
    await prisma.rateLimit.upsert({
      where: { key },
      update: { count: 1, resetAt: new Date(now.getTime() + windowSec * 1000) },
      create: { key, count: 1, resetAt: new Date(now.getTime() + windowSec * 1000) },
    });
    return true;
  }
  if (row.count >= limit) return false;
  await prisma.rateLimit.update({ where: { key }, data: { count: { increment: 1 } } });
  return true;
}
