import { ShopProvider } from "@/components/ShopProvider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getSettings } from "@/lib/settings";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const s = await getSettings();
  return (
    <ShopProvider>
      <Header name={s.shopName} />
      <main>{children}</main>
      <Footer />
    </ShopProvider>
  );
}
