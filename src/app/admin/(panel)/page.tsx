import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ORDER_STATUS_LABEL, PAYMENT_LABEL, som } from "@/lib/format";
import { Flash } from "@/components/Flash";
import { setOrderStatus } from "../actions";

export const metadata: Metadata = { title: "Buyurtmalar" };

type Props = { searchParams: Promise<{ holat?: string; xato?: string; ok?: string }> };

export default async function Orders({ searchParams }: Props) {
  const { holat, xato, ok } = await searchParams;
  const filter = holat && holat in ORDER_STATUS_LABEL ? (holat as keyof typeof ORDER_STATUS_LABEL) : undefined;
  const [orders, total, fresh, revenue] = await Promise.all([
    prisma.order.findMany({ where: filter ? { status: filter } : {}, orderBy: { createdAt: "desc" }, take: 100, include: { items: true } }),
    prisma.order.count(),
    prisma.order.count({ where: { status: "NEW" } }),
    prisma.order.aggregate({ where: { status: { not: "CANCELLED" } }, _sum: { total: true } }),
  ]);
  const here = "/admin" + (filter ? `?holat=${filter}` : "");

  return (
    <>
      <h1 style={{ fontSize: "2rem" }}>Buyurtmalar</h1>
      <Flash xato={xato} ok={ok} />
      <div className="stats">
        <div><b>{total}</b><span>Jami buyurtma</span></div>
        <div><b>{fresh}</b><span>Yangi</span></div>
        <div><b>{som(revenue._sum.total ?? 0)}</b><span>Savdo (bekor qilinganlarsiz)</span></div>
      </div>
      <form className="tools" style={{ margin: "18px 0 0" }}>
        <label className="check">Holat:{" "}
          <select name="holat" defaultValue={filter ?? ""}>
            <option value="">Hammasi</option>
            {Object.entries(ORDER_STATUS_LABEL).map(([k, n]) => <option key={k} value={k}>{n}</option>)}
          </select>
        </label>
        <button className="btn ghost sm" type="submit">Koʻrsatish</button>
      </form>
      {orders.length ? orders.map((o) => (
        <details className="order" key={o.id}>
          <summary>
            <span><b>#{o.number}</b> · {o.name} · {som(o.total)}</span>
            <span className={"st " + (o.status === "NEW" ? "st-new" : o.status === "DELIVERED" ? "st-done" : o.status === "CANCELLED" ? "st-cancel" : "")}>{ORDER_STATUS_LABEL[o.status]}</span>
          </summary>
          <div className="obody">
            <p>
              <b>Sana:</b> {o.createdAt.toLocaleString("uz-UZ", { timeZone: "Asia/Tashkent" })}<br />
              <b>Telefon:</b> <a href={`tel:${o.phone}`}>{o.phone}</a><br />
              <b>Manzil:</b> {o.region}, {o.address}<br />
              <b>Toʻlov:</b> {PAYMENT_LABEL[o.method]} ({o.paymentStatus === "PAID" ? "toʻlangan" : o.method === "CASH" ? "olganda" : "toʻlanmagan"})
              {o.note && <><br /><b>Izoh:</b> {o.note}</>}
            </p>
            <ul>{o.items.map((i) => <li key={i.id}>{i.name} × {i.quantity} = {som(i.price * i.quantity)}</li>)}</ul>
            <p>
              Mahsulotlar: {som(o.subtotal)}{o.discount ? ` · Chegirma (${o.promoCode}): −${som(o.discount)}` : ""} · Yetkazish: {o.shipping ? som(o.shipping) : "bepul"} · <b>Jami: {som(o.total)}</b>
            </p>
            <form action={setOrderStatus} className="check">
              <input type="hidden" name="id" value={o.id} />
              <input type="hidden" name="back" value={here} />
              Holati:{" "}
              <select name="status" defaultValue={o.status}>
                {Object.entries(ORDER_STATUS_LABEL).map(([k, n]) => <option key={k} value={k}>{n}</option>)}
              </select>
              <button className="btn ghost sm" type="submit">Saqlash</button>
            </form>
          </div>
        </details>
      )) : <div className="empty" style={{ marginTop: 14 }}>Hozircha buyurtma yoʻq. Mijoz buyurtma berganda shu yerda paydo boʻladi.</div>}
    </>
  );
}
