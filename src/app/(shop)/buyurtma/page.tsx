import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { CheckoutForm } from "@/components/CheckoutForm";
import { availableMethods } from "@/lib/payments/config";

export const metadata: Metadata = { title: "Buyurtmani rasmiylashtirish", robots: { index: false } };

export default async function CheckoutPage() {
  const s = await getSettings();
  return (
    <div className="wrap">
      <h1 className="page-title">Buyurtmani rasmiylashtirish</h1>
      <CheckoutForm pays={availableMethods(s)} />
    </div>
  );
}
