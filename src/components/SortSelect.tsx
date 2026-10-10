"use client";
import { useRouter, useSearchParams } from "next/navigation";

export function SortSelect({ value }: { value: string }) {
  const router = useRouter();
  const params = useSearchParams();
  return (
    <label>
      <span className="sr">Tartiblash</span>
      <select
        value={value}
        onChange={(e) => {
          const p = new URLSearchParams(params.toString());
          p.set("saralash", e.target.value);
          router.push(`/katalog?${p.toString()}`);
        }}
      >
        <option value="pop">Ommabop</option>
        <option value="cheap">Avval arzonlari</option>
        <option value="exp">Avval qimmatlari</option>
        <option value="rate">Reyting boʻyicha</option>
      </select>
    </label>
  );
}
