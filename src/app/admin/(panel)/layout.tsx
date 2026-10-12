import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { logout } from "../actions";

export const metadata: Metadata = { title: { default: "Admin panel", template: "%s | Admin" }, robots: { index: false, follow: false } };

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const [newOrders, pendingReviews] = await Promise.all([
    prisma.order.count({ where: { status: "NEW" } }),
    prisma.review.count({ where: { approved: false } }),
  ]);
  const tabs: [string, string, number?][] = [
    ["/admin", "Buyurtmalar", newOrders],
    ["/admin/mahsulotlar", "Mahsulotlar"],
    ["/admin/kategoriyalar", "Kategoriyalar"],
    ["/admin/promokodlar", "Promokodlar"],
    ["/admin/sharhlar", "Sharhlar", pendingReviews],
    ["/admin/maslahatlar", "Maslahatlar"],
    ["/admin/sozlamalar", "Sozlamalar"],
  ];
  return (
    <div className="wrap">
      <div className="admin">
        <nav className="side" aria-label="Admin boʻlimlari">
          <div className="side-title">Admin panel</div>
          {tabs.map(([href, label, n]) => (
            <Link key={href} href={href} style={{ padding: "10px 14px", borderRadius: 14, fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap" }}>
              {label}{n ? <span className="dot">{n}</span> : null}
            </Link>
          ))}
          <Link className="btn ghost sm" href="/" style={{ marginTop: 12 }}>Saytni koʻrish</Link>
          <form action={logout}><button className="btn ghost sm" type="submit" style={{ width: "100%", marginTop: 6 }}>Chiqish</button></form>
        </nav>
        <div className="panel">{children}</div>
      </div>
    </div>
  );
}
