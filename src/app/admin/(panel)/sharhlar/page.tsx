import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Flash } from "@/components/Flash";
import { ConfirmButton } from "@/components/AdminBits";
import { setReview } from "../../actions";

export const metadata: Metadata = { title: "Sharhlar" };

export default async function Reviews({ searchParams }: { searchParams: Promise<{ xato?: string; ok?: string }> }) {
  const { xato, ok } = await searchParams;
  const list = await prisma.review.findMany({ orderBy: [{ approved: "asc" }, { createdAt: "desc" }], include: { product: { select: { name: true } } }, take: 200 });
  return (
    <>
      <h1 style={{ fontSize: "2rem" }}>Sharhlar</h1>
      <Flash xato={xato} ok={ok} />
      <p className="note">Yangi sharhlar siz tasdiqlaganingizdan keyin saytda chiqadi.</p>
      {list.map((r) => (
        <div key={r.id} className="box rv" style={{ marginBottom: 10 }}>
          <div>
            <b>{r.name}</b> <span className="stars">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>{" "}
            <span className={"st " + (r.approved ? "st-done" : "st-new")}>{r.approved ? "Saytda" : "Tekshiruvda"}</span>
            <p>{r.text}</p>
            <small className="note">{r.product.name} · {r.createdAt.toLocaleDateString("uz-UZ")}</small>
          </div>
          <div className="acts">
            <form action={setReview}>
              <input type="hidden" name="id" value={r.id} />
              <input type="hidden" name="op" value={r.approved ? "hide" : "approve"} />
              <button className="btn ghost sm" type="submit">{r.approved ? "Yashirish" : "Tasdiqlash"}</button>
            </form>
            <form action={setReview}>
              <input type="hidden" name="id" value={r.id} />
              <input type="hidden" name="op" value="delete" />
              <ConfirmButton>Oʻchirish</ConfirmButton>
            </form>
          </div>
        </div>
      ))}
      {!list.length && <div className="empty">Hozircha sharh yoʻq.</div>}
    </>
  );
}
