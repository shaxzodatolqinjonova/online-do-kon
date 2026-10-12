import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Flash } from "@/components/Flash";
import { ConfirmButton } from "@/components/AdminBits";
import { deleteCategory, saveCategory } from "../../actions";

export const metadata: Metadata = { title: "Kategoriyalar" };

export default async function Categories({ searchParams }: { searchParams: Promise<{ xato?: string; ok?: string }> }) {
  const { xato, ok } = await searchParams;
  const cats = await prisma.category.findMany({ orderBy: { position: "asc" }, include: { _count: { select: { products: true } } } });
  return (
    <>
      <h1 style={{ fontSize: "2rem" }}>Kategoriyalar</h1>
      <Flash xato={xato} ok={ok} />
      <p className="note">Yashirilgan kategoriya va undagi mahsulotlar saytda koʻrinmaydi. Raqam kategoriyalar tartibini belgilaydi.</p>
      <div className="alist">
        {cats.map((c) => (
          <div key={c.id} className="arow ed" style={{ gridTemplateColumns: "70px minmax(0,1fr) 80px auto auto auto" }}>
            <form action={saveCategory} style={{ display: "contents" }}>
              <input type="hidden" name="id" value={c.id} />
              <input type="text" name="emoji" className="emo-in" defaultValue={c.emoji} aria-label="Emoji" maxLength={8} />
              <input type="text" name="name" defaultValue={c.name} aria-label="Kategoriya nomi" required maxLength={60} />
              <input type="number" name="position" defaultValue={c.position} aria-label="Tartib raqami" min={0} />
              <label className="check"><input type="checkbox" name="active" defaultChecked={c.active} /> Koʻrinadi</label>
              <button className="btn ghost sm" type="submit">Saqlash</button>
            </form>
            <form action={deleteCategory}>
              <input type="hidden" name="id" value={c.id} />
              <ConfirmButton>Oʻchirish ({c._count.products})</ConfirmButton>
            </form>
          </div>
        ))}
      </div>
      <h2 className="sub">Yangi kategoriya</h2>
      <form action={saveCategory} className="box">
        <div className="fgrid">
          <label className="field"><span>Emoji</span><input type="text" name="emoji" defaultValue="🐾" maxLength={8} /></label>
          <label className="field"><span>Nomi</span><input type="text" name="name" required maxLength={60} /></label>
          <label className="field"><span>Tartib raqami</span><input type="number" name="position" defaultValue={cats.length} min={0} /></label>
        </div>
        <button className="btn" type="submit" style={{ alignSelf: "flex-start" }}>Qoʻshish</button>
      </form>
    </>
  );
}
