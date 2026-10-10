import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { login } from "../actions";
import { Flash } from "@/components/Flash";

export const metadata: Metadata = { title: "Admin kirish", robots: { index: false, follow: false } };

export default async function Login({ searchParams }: { searchParams: Promise<{ xato?: string }> }) {
  if (await isAdmin()) redirect("/admin");
  const { xato } = await searchParams;
  return (
    <div className="wrap" style={{ maxWidth: 420, paddingTop: 80 }}>
      <h1 className="page-title">Admin panel</h1>
      <form action={login} className="summary stack">
        <label className="field"><span>Parol</span><input type="password" name="password" required autoFocus autoComplete="current-password" /></label>
        <Flash xato={xato} />
        <button className="btn" type="submit">Kirish</button>
      </form>
    </div>
  );
}
