import { prisma } from "./prisma";
import { ORDER_STATUS_LABEL, PAYMENT_LABEL, som } from "./format";

/** Telegram HTML rejimida xavfli belgilarni zararsizlantiradi */
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

async function send(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) {
    console.warn("[telegram] TELEGRAM_BOT_TOKEN yoki TELEGRAM_CHAT_ID yoʻq, xabar yuborilmadi");
    return;
  }
  const base = process.env.TELEGRAM_API_URL ?? "https://api.telegram.org";
  try {
    const r = await fetch(`${base}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text, parse_mode: "HTML", disable_web_page_preview: true }),
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) console.error("[telegram] xato:", r.status, (await r.text()).slice(0, 200));
  } catch (e) {
    // Telegram ishlamasa ham buyurtma buzilmasin
    console.error("[telegram] yuborib boʻlmadi:", e instanceof Error ? e.message : e);
  }
}

async function load(orderId: string) {
  return prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
}

function body(o: NonNullable<Awaited<ReturnType<typeof load>>>) {
  const pay =
    o.method === "CASH" ? "naqd (olganda)" : `${PAYMENT_LABEL[o.method]}, ${o.paymentStatus === "PAID" ? "✅ toʻlangan" : "⏳ toʻlov kutilmoqda"}`;
  return [
    `🛒 <b>Buyurtma #${o.number}</b>`,
    ``,
    `👤 ${esc(o.name)}`,
    `📞 ${esc(o.phone)}`,
    `📍 ${esc(o.region)}, ${esc(o.address)}`,
    o.note ? `💬 ${esc(o.note)}` : "",
    ``,
    ...o.items.map((i) => `• ${esc(i.name)} × ${i.quantity} = ${som(i.price * i.quantity)}`),
    ``,
    o.discount ? `Chegirma (${esc(o.promoCode ?? "")}): −${som(o.discount)}` : "",
    `Yetkazib berish: ${o.shipping ? som(o.shipping) : "bepul"}`,
    `💰 <b>Jami: ${som(o.total)}</b>`,
    `💳 Toʻlov: ${pay}`,
    `📌 Holat: ${ORDER_STATUS_LABEL[o.status]}`,
  ]
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
}

export async function notifyNewOrder(orderId: string) {
  const o = await load(orderId);
  if (o) await send(body(o));
}

export async function notifyPaid(orderId: string) {
  const o = await load(orderId);
  if (o) await send(`✅ <b>Toʻlov qabul qilindi</b>\n\n` + body(o));
}

export async function notifyCancelled(orderId: string, why: string) {
  const o = await load(orderId);
  if (o) await send(`❌ <b>Toʻlov bekor qilindi</b> (${esc(why)})\n\n` + body(o));
}
