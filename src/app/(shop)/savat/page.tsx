import type { Metadata } from "next";
import { CartView } from "@/components/CartView";

export const metadata: Metadata = { title: "Savat", robots: { index: false } };

export default function CartPage() {
  return (
    <div className="wrap">
      <h1 className="page-title">Savat</h1>
      <CartView />
    </div>
  );
}
