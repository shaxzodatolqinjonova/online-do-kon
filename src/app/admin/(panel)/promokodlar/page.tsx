import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Flash } from "@/components/Flash";
import { ConfirmButton } from "@/components/AdminBits";
import { deletePromo, savePromo } from "../../actions";

export const metadata: Metadata = { title: "Promokodlar" };

const dateValue = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");

export default async function Promos({ searchParams }: { searchParams: Promise<{ xato?: string; ok?: string }> }) {
  const { xato, ok } = await searchParams;
  const promos = await prisma.promo.findMany({ orderBy: { code: "asc" } });
  return (
    <>
      <h1 style={{ fontSize: "2rem" }}>Promokodlar</h1>
      <Flash xato={xato} ok={ok} />
      <p className="note">Kod katta harflarda saqlanadi. Minimal summa 0 boʻlsa, har qanday buyurtmaga ishlaydi. Muddat boʻsh boʻlsa, cheksiz amal qiladi.</p>
      {promos.map((p) => (
        <div key={p.id} className="box" style={{ marginBottom: 10 }}>
          <form action={savePromo} className="stack">
            <input type="hidden" name="id" value={p.id} />
            <div className="fgrid">
              <label className="field"><span>Kod</span><input type="text" name="code" defaultValue={p.code} required maxLength={20} /></label>
              <label className="field"><span>Chegirma, %</span><input type="number" name="percent" defaultValue={p.percent} min={1} max={90} /></label>
              <label className="field"><span>Minimal summa</span><input type="number" name="minTotal" defaultValue={p.minTotal} min={0} step={1000} /></label>
              <label className="field"><span>Amal qilish muddati</span><input type="date" name="expiresAt" defaultValue={dateValue(p.expiresAt)} /></label>
            </div>
            <div className="acts" style={{ justifyContent: "space-between" }}>
              <label className="check"><input type="checkbox" name="active" defaultChecked={p.active} /> Faol</label>
              <button className="btn ghost sm" type="submit">Saqlash</button>
            </div>
          </form>
          <form action={deletePromo}><input type="hidden" name="id" value={p.id} /><ConfirmButton>Oʻchirish</ConfirmButton></form>
        </div>
      ))}
      {!promos.length && <div className="empty">Promokod yoʻq.</div>}
      <h2 className="sub">Yangi promokod</h2>
      <form action={savePromo} className="box">
        <div className="fgrid">
          <label className="field"><span>Kod</span><input type="text" name="code" required maxLength={20} placeholder="BAHOR15" /></label>
          <label className="field"><span>Chegirma, %</span><input type="number" name="percent" defaultValue={10} min={1} max={90} /></label>
          <label className="field"><span>Minimal summa</span><input type="number" name="minTotal" defaultValue={0} min={0} step={1000} /></label>
          <label className="field"><span>Amal qilish muddati</span><input type="date" name="expiresAt" /></label>
        </div>
        <button className="btn" type="submit" style={{ alignSelf: "flex-start" }}>Qoʻshish</button>
      </form>
    </>
  );
}
