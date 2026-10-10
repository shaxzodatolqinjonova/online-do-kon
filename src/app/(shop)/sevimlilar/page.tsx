import type { Metadata } from "next";
import { FavView } from "@/components/FavView";

export const metadata: Metadata = { title: "Sevimlilar", robots: { index: false } };

export default function FavPage() {
  return (
    <div className="wrap">
      <h1 className="page-title">Sevimlilar</h1>
      <FavView />
    </div>
  );
}
