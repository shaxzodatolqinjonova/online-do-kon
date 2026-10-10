import { createHash, timingSafeEqual } from "node:crypto";
import { after } from "next/server";
import { prisma } from "../prisma";
import { notifyPaid } from "../telegram";
import { click } from "./config";

/**
 * Click Shop API (Prepare / Complete). Click bizning serverimizga soʻrov yuboradi.
 * Imzo formulasi va xato kodlari Click rasmiy PHP namunasi asosida: github.com/click-llc/click-integration-php
 */
const md5 = (s: string) => createHash("md5").update(s).digest("hex");
const same = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

const STATE = { PREPARED: 1, COMPLETED: 2, CANCELLED: -1 } as const;

type Fields = Record<string, string>;
const REQUIRED = ["click_trans_id", "service_id", "merchant_trans_id", "amount", "action", "error", "error_note", "sign_time", "sign_string", "click_paydoc_id"];

async function readFields(req: Request): Promise<Fields> {
  const ct = req.headers.get("content-type") ?? "";
  const out: Fields = {};
  if (ct.includes("application/json")) {
    const j = await req.json().catch(() => ({}));
    for (const [k, v] of Object.entries(j ?? {})) out[k] = String(v ?? "");
  } else {
    const fd = await req.formData().catch(() => null);
    fd?.forEach((v, k) => (out[k] = String(v)));
  }
  return out;
}

export async function handleClick(req: Request): Promise<Response> {
  const f = await readFields(req);
  const base = { click_trans_id: f.click_trans_id ?? null, merchant_trans_id: f.merchant_trans_id ?? null };
  const done = (error: number, error_note: string, extra: Record<string, unknown> = {}) =>
    Response.json({ ...base, merchant_prepare_id: 0, merchant_confirm_id: 0, ...extra, error, error_note });

  try {
    const cfg = click();
    if (!cfg.secretKey) return done(-8, "Error in request from click");
    const action = f.action;
    if (REQUIRED.some((k) => f[k] === undefined) || (action === "1" && f.merchant_prepare_id === undefined)) return done(-8, "Error in request from click");

    // imzo tekshiruvi
    const expected = md5(f.click_trans_id + f.service_id + cfg.secretKey + f.merchant_trans_id + (action === "1" ? f.merchant_prepare_id : "") + f.amount + f.action + f.sign_time);
    if (!same(expected, f.sign_string.toLowerCase()) || f.service_id !== cfg.serviceId) return done(-1, "SIGN CHECK FAILED!");
    if (action !== "0" && action !== "1") return done(-3, "Action not found");

    const num = Number(f.merchant_trans_id);
    const order = Number.isInteger(num) && num > 0 ? await prisma.order.findUnique({ where: { number: num } }) : null;
    if (!order || order.method !== "CLICK") return done(-5, "User does not exist");

    let payment = null;
    if (action === "1") {
      const seq = Number(f.merchant_prepare_id);
      payment = Number.isInteger(seq) ? await prisma.payment.findUnique({ where: { seq } }) : null;
      if (!payment || payment.provider !== "click" || payment.orderId !== order.id || payment.externalId !== f.click_trans_id) return done(-6, "Transaction does not exist");
    } else {
      payment = await prisma.payment.findUnique({ where: { provider_externalId: { provider: "click", externalId: f.click_trans_id } } });
    }

    const ids = payment ? { merchant_prepare_id: payment.seq, merchant_confirm_id: payment.seq } : {};
    if (order.paymentStatus === "PAID" || payment?.state === STATE.COMPLETED) return done(-4, "Already paid", ids);
    if (Math.abs(order.total - Number(f.amount)) > 0.01) return done(-2, "Incorrect parameter amount", ids);
    if (order.status === "CANCELLED" || payment?.state === STATE.CANCELLED) return done(-9, "Transaction cancelled", ids);

    if (action === "0") {
      // PREPARE: toʻlovni boshlaymiz (Click qayta yuborsa, mavjudini qaytaramiz)
      payment ??= await prisma.payment.create({
        data: { orderId: order.id, provider: "click", externalId: f.click_trans_id, amount: order.total, state: STATE.PREPARED, createdAtMs: BigInt(Date.now()) },
      });
      return done(0, "Success", { merchant_prepare_id: payment.seq, merchant_confirm_id: payment.seq });
    }

    // COMPLETE
    if (Number(f.error) < 0) {
      await prisma.payment.update({ where: { id: payment!.id }, data: { state: STATE.CANCELLED, cancelledAtMs: BigInt(Date.now()), reason: Number(f.error) } });
      return done(-9, "Transaction cancelled", ids);
    }
    const ok = await prisma.$transaction(async (tx) => {
      const r = await tx.payment.updateMany({ where: { id: payment!.id, state: STATE.PREPARED }, data: { state: STATE.COMPLETED, performedAtMs: BigInt(Date.now()) } });
      if (r.count !== 1) return false;
      await tx.order.update({ where: { id: order.id }, data: { paymentStatus: "PAID" } });
      return true;
    });
    if (!ok) return done(-4, "Already paid", ids);
    after(() => notifyPaid(order.id));
    return done(0, "Success", ids);
  } catch (e) {
    console.error("[click]", e);
    return done(-7, "Failed to update user");
  }
}
