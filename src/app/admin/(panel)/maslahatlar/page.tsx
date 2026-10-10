import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Flash } from "@/components/Flash";
import { ConfirmButton } from "@/components/AdminBits";
import { deleteArticle, saveArticle } from "../../actions";

export const metadata: Metadata = { title: "Maslahatlar" };

export default async function Articles({ searchParams }: { searchParams: Promise<{ xato?: string; ok?: string }> }) {
  const { xato, ok } = await searchParams;
  const list = await prisma.article.findMany({ orderBy: { createdAt: "asc" } });
  return (
    <>
      <h1 style={{ fontSize: "2rem" }}>Maslahatlar</h1>
      <Flash xato={xato} ok={ok} />
      <p className="note">Bosh sahifadagi va /maslahatlar sahifasidagi “Mushuk parvarishi boʻyicha maslahatlar” boʻlimi.</p>
      {list.map((a) => (
        <div className="box" key={a.id} style={{ marginBottom: 10 }}>
          <form action={saveArticle} className="stack">
            <input type="hidden" name="id" value={a.id} />
            <label className="field"><span>Sarlavha</span><input type="text" name="title" defaultValue={a.title} required maxLength={150} /></label>
            <label className="field"><span>Matn</span><textarea name="body" rows={4} defaultValue={a.body} required maxLength={10000} /></label>
            <div className="acts" style={{ justifyContent: "space-between" }}>
              <label className="check"><input type="checkbox" name="published" defaultChecked={a.published} /> Saytda koʻrinadi</label>
              <button className="btn ghost sm" type="submit">Saqlash</button>
            </div>
          </form>
          <form action={deleteArticle}><input type="hidden" name="id" value={a.id} /><ConfirmButton>Oʻchirish</ConfirmButton></form>
        </div>
      ))}
      <h2 className="sub">Yangi maslahat</h2>
      <form action={saveArticle} className="box">
        <label className="field"><span>Sarlavha</span><input type="text" name="title" required maxLength={150} /></label>
        <label className="field"><span>Matn</span><textarea name="body" rows={5} required maxLength={10000} /></label>
        <button className="btn" type="submit" style={{ alignSelf: "flex-start" }}>Qoʻshish</button>
      </form>
    </>
  );
}
