import type { Setting } from "@prisma/client";

export type Method = "CLICK" | "PAYME" | "UZUM" | "CASH";

export const payme = () => ({
  merchantId: process.env.PAYME_MERCHANT_ID ?? "",
  login: process.env.PAYME_LOGIN || "Paycom",
  key: process.env.PAYME_KEY ?? "",
  test: process.env.PAYME_TEST !== "false", // sinov rejimi (standart)
});

export const click = () => ({
  serviceId: process.env.CLICK_SERVICE_ID ?? "",
  merchantId: process.env.CLICK_MERCHANT_ID ?? "",
  secretKey: process.env.CLICK_SECRET_KEY ?? "",
});

/** Kalitlar .env da toʻldirilganmi? Toʻldirilmagan tizim mijozga koʻrsatilmaydi. */
export const configured: Record<Method, () => boolean> = {
  CASH: () => true,
  PAYME: () => !!(payme().merchantId && payme().key),
  CLICK: () => !!(click().serviceId && click().merchantId && click().secretKey),
  UZUM: () => false, // Uzum hujjatlari olinmaguncha ulanmagan
};

/** Admin yoqqan VA kalitlari bor usullar */
export function availableMethods(s: Pick<Setting, "payClick" | "payPayme" | "payUzum" | "payCash">): Record<Method, boolean> {
  return {
    CLICK: s.payClick && configured.CLICK(),
    PAYME: s.payPayme && configured.PAYME(),
    UZUM: s.payUzum && configured.UZUM(),
    CASH: s.payCash,
  };
}

const site = () => process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Mijoz toʻlov tugagach qaytadigan sahifa */
export const returnUrl = (orderId: string) => `${site()}/buyurtma/holat/${orderId}`;

/** Toʻlov sahifasi havolasi. Cash uchun null. */
export function payUrl(order: { id: string; number: number; total: number; method: Method }): string | null {
  if (order.method === "PAYME") {
    const p = payme();
    // m=savdogar id; ac.order_id=buyurtma raqami; a=summa TIYINDA; l=til; c=qaytish havolasi
    const params = `m=${p.merchantId};ac.order_id=${order.number};a=${order.total * 100};l=uz;c=${returnUrl(order.id)}`;
    const base = p.test ? "https://test.paycom.uz" : "https://checkout.paycom.uz";
    return `${base}/${Buffer.from(params).toString("base64")}`;
  }
  if (order.method === "CLICK") {
    const c = click();
    const q = new URLSearchParams({
      service_id: c.serviceId,
      merchant_id: c.merchantId,
      amount: String(order.total),
      transaction_param: String(order.number),
      return_url: returnUrl(order.id),
    });
    return `https://my.click.uz/services/pay?${q}`;
  }
  return null;
}
