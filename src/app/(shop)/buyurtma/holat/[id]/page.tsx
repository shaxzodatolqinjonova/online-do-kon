import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PAYMENT_LABEL, som } from "@/lib/format";

export const metadata: Metadata = { title: "Buyurtma holati", robots: { index: false } };

// Toʻlovdan keyin mijoz shu sahifaga qaytadi. Havoladagi id taxmin qilib boʻlmaydigan uzun kod.
export default async function OrderStatus({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const o = await prisma.order.findUnique({ where: { id }, select: { number: true, total: true, method: true, paymentStatus: true, status: true } });
  if (!o) notFound();
  const paid = o.paymentStatus === "PAID";
  const cancelled = o.status === "CANCELLED";
  return (
    <div className="wrap">
      <div className="done">
        <div className="em" aria-hidden="true">{cancelled ? "😿" : paid || o.method === "CASH" ? "🐱💗" : "⏳"}</div>
        <h1 style={{ fontSize: "1.8rem" }}>
          {cancelled ? "Buyurtma bekor qilindi" : paid ? "Toʻlov qabul qilindi" : o.method === "CASH" ? "Buyurtma qabul qilindi" : "Toʻlov tekshirilmoqda"}
        </h1>
        <p>
          Buyurtma raqami: <b>#{o.number}</b><br />
          Jami: <b>{som(o.total)}</b> · {PAYMENT_LABEL[o.method]}
        </p>
        {!paid && !cancelled && o.method !== "CASH" && (
          <p className="note">Toʻlov tizimidan tasdiq hali kelmadi. Pul yechilgan boʻlsa, bir necha daqiqadan keyin bu sahifani yangilang.</p>
        )}
        <p className="note">Savollar boʻlsa, operatorimiz buyurtma raqami bilan yordam beradi.</p>
        <Link className="btn" href="/katalog">Xaridni davom ettirish</Link>
      </div>
    </div>
  );
}
