import { timingSafeEqual } from "node:crypto";
import { after } from "next/server";
import { prisma } from "../prisma";
import { notifyCancelled, notifyPaid } from "../telegram";
import { payme } from "./config";
import { cancelOrderRestoreStock } from "./orders";

/**
 * Payme Merchant API (JSON-RPC 2.0). Payme bizning serverimizga soʻrov yuboradi.
 * Mantiq Payme (Paycom) rasmiy PHP namunasi asosida: github.com/PaycomUZ/paycom-integration-php-template
 */
const TIMEOUT = 43_200_000; // 12 soat (ms)
const STATE = { CREATED: 1, COMPLETED: 2, CANCELLED: -1, CANCELLED_AFTER_COMPLETE: -2 } as const;
const E = {
  INTERNAL: -32400, NO_PRIVILEGE: -32504, BAD_JSON: -32600, NO_METHOD: -32601,
  BAD_AMOUNT: -31001, NO_TX: -31003, BAD_ACCOUNT: -31050, CANT_CANCEL: -31007, CANT_PERFORM: -31008,
} as const;

type Msg = string | { ru: string; uz: string; en: string };
class PaymeError extends Error {
  constructor(public code: number, public msg: Msg, public data?: string) {
    super(typeof msg === "string" ? msg : msg.en);
  }
}

const BAD_ORDER: Msg = { ru: "Неверный код заказа.", uz: "Harid kodida xatolik.", en: "Incorrect order code." };
const now = () => Date.now();
const n = (v: bigint | null | undefined) => (v == null ? 0 : Number(v));

function authorized(req: Request): boolean {
  const h = req.headers.get("authorization") ?? "";
  const m = /^\s*Basic\s+(\S+)\s*$/i.exec(h);
  if (!m) return false;
  const { login, key } = payme();
  if (!key) return false;
  const given = Buffer.from(m[1], "base64");
  const want = Buffer.from(`${login}:${key}`);
  return given.length === want.length && timingSafeEqual(given, want);
}

type Params = Record<string, unknown> & { account?: { order_id?: unknown }; amount?: unknown; id?: string; time?: number; reason?: number; from?: number; to?: number };

async function getOrder(params: Params) {
  const raw = params.account?.order_id;
  const num = Number(raw);
  if (!raw || !Number.isInteger(num) || num <= 0) throw new PaymeError(E.BAD_ACCOUNT, BAD_ORDER, "order_id");
  const order = await prisma.order.findUnique({ where: { number: num } });
  if (!order) throw new PaymeError(E.BAD_ACCOUNT, BAD_ORDER, "order_id");
  return order;
}

async function validate(params: Params) {
  if (typeof params.amount !== "number" || !Number.isFinite(params.amount)) throw new PaymeError(E.BAD_AMOUNT, "Incorrect amount.");
  const order = await getOrder(params);
  if (order.total * 100 !== params.amount) throw new PaymeError(E.BAD_AMOUNT, "Incorrect amount.");
  if (order.method !== "PAYME" || order.status === "CANCELLED" || order.paymentStatus !== "UNPAID") throw new PaymeError(E.CANT_PERFORM, "Order state is invalid.");
  return order;
}

const findTx = (id: unknown) => (typeof id === "string" && id ? prisma.payment.findUnique({ where: { provider_externalId: { provider: "payme", externalId: id } } }) : null);
const expired = (p: { state: number; createdAtMs: bigint }) => p.state === STATE.CREATED && Math.abs(now() - Number(p.createdAtMs)) > TIMEOUT;

async function cancelCreated(paymentId: string, orderId: string, reason: number) {
  await prisma.$transaction(async (tx) => {
    await tx.payment.update({ where: { id: paymentId }, data: { state: STATE.CANCELLED, reason, cancelledAtMs: BigInt(now()) } });
    await cancelOrderRestoreStock(tx, orderId);
  });
  after(() => notifyCancelled(orderId, "Payme: muddati tugadi"));
}

export async function handlePayme(req: Request): Promise<Response> {
  let id: unknown = null;
  const reply = (result: unknown) => Response.json({ jsonrpc: "2.0", id, result, error: null });
  const fail = (e: PaymeError) => Response.json({ jsonrpc: "2.0", id, result: null, error: { code: e.code, message: e.msg, ...(e.data ? { data: e.data } : {}) } });

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") throw new PaymeError(E.BAD_JSON, "Invalid JSON-RPC object.");
    id = body.id ?? null;
    if (!authorized(req)) throw new PaymeError(E.NO_PRIVILEGE, "Insufficient privilege to perform this method.");

    const params: Params = body.params ?? {};
    switch (body.method) {
      case "CheckPerformTransaction": {
        const order = await validate(params);
        const other = await prisma.payment.findFirst({ where: { orderId: order.id, provider: "payme", state: { in: [STATE.CREATED, STATE.COMPLETED] } } });
        if (other) throw new PaymeError(E.CANT_PERFORM, "There is other active/completed transaction for this order.");
        return reply({ allow: true });
      }

      case "CreateTransaction": {
        const order = await validate(params);
        const txId = params.id;
        if (typeof txId !== "string" || !txId || typeof params.time !== "number") throw new PaymeError(E.BAD_JSON, "Invalid JSON-RPC object.");

        const other = await prisma.payment.findFirst({ where: { orderId: order.id, provider: "payme", state: { in: [STATE.CREATED, STATE.COMPLETED] }, NOT: { externalId: txId } } });
        if (other) throw new PaymeError(E.BAD_ACCOUNT, "There is other active/completed transaction for this order.");

        const found = await findTx(txId);
        if (found) {
          if (found.state !== STATE.CREATED) throw new PaymeError(E.CANT_PERFORM, "Transaction found, but is not active.");
          if (expired(found)) {
            await cancelCreated(found.id, found.orderId, 4);
            throw new PaymeError(E.CANT_PERFORM, "Transaction is expired.");
          }
          return reply({ create_time: n(found.createdAtMs), transaction: found.id, state: found.state, receivers: null });
        }

        if (params.time - now() >= TIMEOUT)
          throw new PaymeError(E.BAD_ACCOUNT, { ru: "Время создания транзакции вне допустимого диапазона", uz: "Tranzaksiya yaratilgan vaqt notoʻgʻri", en: "Invalid transaction time" }, "time");

        const created = now();
        try {
          const p = await prisma.payment.create({
            data: { orderId: order.id, provider: "payme", externalId: txId, amount: order.total, state: STATE.CREATED, providerTime: BigInt(params.time), createdAtMs: BigInt(created) },
          });
          return reply({ create_time: created, transaction: p.id, state: p.state, receivers: null });
        } catch {
          // bir vaqtda ikki xil soʻrov kelsa: mavjudini qaytaramiz
          const again = await findTx(txId);
          if (!again) throw new PaymeError(E.INTERNAL, "Internal System Error.");
          return reply({ create_time: n(again.createdAtMs), transaction: again.id, state: again.state, receivers: null });
        }
      }

      case "PerformTransaction": {
        const found = await findTx(params.id);
        if (!found) throw new PaymeError(E.NO_TX, "Transaction not found.");
        if (found.state === STATE.COMPLETED) return reply({ transaction: found.id, perform_time: n(found.performedAtMs), state: found.state });
        if (found.state !== STATE.CREATED) throw new PaymeError(E.CANT_PERFORM, "Could not perform this operation.");
        if (expired(found)) {
          await cancelCreated(found.id, found.orderId, 4);
          throw new PaymeError(E.CANT_PERFORM, "Transaction is expired.");
        }
        const t = now();
        const ok = await prisma.$transaction(async (tx) => {
          const r = await tx.payment.updateMany({ where: { id: found.id, state: STATE.CREATED }, data: { state: STATE.COMPLETED, performedAtMs: BigInt(t) } });
          if (r.count !== 1) return false;
          await tx.order.update({ where: { id: found.orderId }, data: { paymentStatus: "PAID" } });
          return true;
        });
        if (ok) after(() => notifyPaid(found.orderId));
        const cur = await prisma.payment.findUnique({ where: { id: found.id } });
        return reply({ transaction: found.id, perform_time: n(cur?.performedAtMs ?? BigInt(t)), state: cur?.state ?? STATE.COMPLETED });
      }

      case "CancelTransaction": {
        const found = await findTx(params.id);
        if (!found) throw new PaymeError(E.NO_TX, "Transaction not found.");
        const reason = Number.isInteger(params.reason) ? (params.reason as number) : 10;
        const out = (p: { id: string; state: number; cancelledAtMs: bigint | null }) => reply({ transaction: p.id, cancel_time: n(p.cancelledAtMs), state: p.state });

        if (found.state === STATE.CANCELLED || found.state === STATE.CANCELLED_AFTER_COMPLETE) return out(found);

        if (found.state === STATE.CREATED) {
          const p = await prisma.$transaction(async (tx) => {
            const u = await tx.payment.update({ where: { id: found.id }, data: { state: STATE.CANCELLED, reason, cancelledAtMs: BigInt(now()) } });
            await cancelOrderRestoreStock(tx, found.orderId);
            return u;
          });
          after(() => notifyCancelled(found.orderId, "Payme"));
          return out(p);
        }

        // toʻlangan tranzaksiyani qaytarish: faqat buyurtma hali joʻnatilmagan boʻlsa
        const order = await prisma.order.findUnique({ where: { id: found.orderId } });
        if (!order || (order.status !== "NEW" && order.status !== "CONFIRMED")) throw new PaymeError(E.CANT_CANCEL, "Could not cancel transaction. Order is delivered/Service is completed.");
        const p = await prisma.$transaction(async (tx) => {
          const u = await tx.payment.update({ where: { id: found.id }, data: { state: STATE.CANCELLED_AFTER_COMPLETE, reason, cancelledAtMs: BigInt(now()) } });
          await cancelOrderRestoreStock(tx, found.orderId);
          await tx.order.update({ where: { id: found.orderId }, data: { paymentStatus: "REFUNDED" } });
          return u;
        });
        after(() => notifyCancelled(found.orderId, "Payme: pul qaytarildi"));
        return out(p);
      }

      case "CheckTransaction": {
        const found = await findTx(params.id);
        if (!found) throw new PaymeError(E.NO_TX, "Transaction not found.");
        return reply({ create_time: n(found.createdAtMs), perform_time: n(found.performedAtMs), cancel_time: n(found.cancelledAtMs), transaction: found.id, state: found.state, reason: found.reason ?? null });
      }

      case "GetStatement": {
        const { from, to } = params;
        if (typeof from !== "number" || typeof to !== "number" || from >= to) throw new PaymeError(E.BAD_ACCOUNT, "Incorrect period.", "from");
        const rows = await prisma.payment.findMany({
          where: { provider: "payme", providerTime: { gte: BigInt(from), lte: BigInt(to) } },
          orderBy: { providerTime: "asc" },
          include: { order: { select: { number: true } } },
        });
        return reply({
          transactions: rows.map((p) => ({
            id: p.externalId, time: n(p.providerTime), amount: p.amount * 100, account: { order_id: p.order.number },
            create_time: n(p.createdAtMs), perform_time: n(p.performedAtMs), cancel_time: n(p.cancelledAtMs),
            transaction: p.id, state: p.state, reason: p.reason ?? null, receivers: null,
          })),
        });
      }

      default:
        throw new PaymeError(E.NO_METHOD, "Method not found.", String(body.method));
    }
  } catch (e) {
    if (e instanceof PaymeError) return fail(e);
    console.error("[payme]", e);
    return fail(new PaymeError(E.INTERNAL, "Internal System Error."));
  }
}
