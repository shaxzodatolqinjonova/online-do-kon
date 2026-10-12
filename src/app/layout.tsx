import type { Metadata, Viewport } from "next";
import { Fredoka, Nunito } from "next/font/google";
import "./globals.css";
import { SvgDefs } from "@/components/Stickers";
import { getSettings } from "@/lib/settings";

const fredoka = Fredoka({ subsets: ["latin", "latin-ext"], weight: ["500", "600", "700"], variable: "--font-fredoka", display: "swap" });
const nunito = Nunito({ subsets: ["latin", "latin-ext"], weight: ["400", "600", "700", "800"], variable: "--font-nunito", display: "swap" });

export const dynamic = "force-dynamic";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    metadataBase: new URL(siteUrl),
    title: { default: `${s.shopName} — mushukchalar uchun hamma narsa`, template: `%s | ${s.shopName}` },
    description: s.tagline || "Mushukchalar uchun taom, dori, aksessuar, kiyimcha va parvarish vositalari. Butun Oʻzbekiston boʻylab yetkazib berish.",
    openGraph: { type: "website", locale: "uz_UZ", siteName: s.shopName },
  };
}

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

// Sahifa yuklanishidan oldin tanlangan rejimni qo'yadi (miltillashning oldini oladi)
const themeScript = `try{var t=localStorage.getItem("miyov-theme");if(t)document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" className={`${fredoka.variable} ${nunito.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <SvgDefs />
        {children}
      </body>
    </html>
  );
}
