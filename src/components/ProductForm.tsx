import { prisma } from "@/lib/prisma";
import { Pic } from "./ProductCard";
import { ConfirmButton } from "./AdminBits";
import { deleteProduct, removeProductImage, saveProduct } from "@/app/admin/actions";

type P = { id: string; name: string; categoryId: string; price: number; oldPrice: number; stock: number; sold: number; emoji: string; description: string; active: boolean; slug: string; images: { id: string; url: string }[] };

export async function ProductForm({ p }: { p?: P }) {
  const cats = await prisma.category.findMany({ orderBy: { position: "asc" } });
  return (
    <>
      <form action={saveProduct} className="eform" encType="multipart/form-data">
        {p && <input type="hidden" name="id" value={p.id} />}
        <label className="field"><span>Nomi</span><input type="text" name="name" required maxLength={120} defaultValue={p?.name} /></label>
        <div className="fgrid">
          <label className="field">
            <span>Kategoriya</span>
            <select name="categoryId" defaultValue={p?.categoryId ?? cats[0]?.id} required>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="field"><span>Narxi (soʻm)</span><input type="number" name="price" min={0} step={1000} defaultValue={p?.price ?? 0} /></label>
          <label className="field"><span>Eski narxi (chegirma uchun, 0 = yoʻq)</span><input type="number" name="oldPrice" min={0} step={1000} defaultValue={p?.oldPrice ?? 0} /></label>
          <label className="field"><span>Omborda (dona)</span><input type="number" name="stock" min={0} defaultValue={p?.stock ?? 10} /></label>
          <label className="field"><span>Sotilgan (hitlar tartibi)</span><input type="number" name="sold" min={0} defaultValue={p?.sold ?? 0} /></label>
          <label className="field"><span>Emoji (rasm boʻlmasa)</span><input type="text" name="emoji" maxLength={8} defaultValue={p?.emoji ?? "🐾"} /></label>
        </div>
        <label className="field"><span>Tavsif</span><textarea name="description" rows={4} maxLength={2000} defaultValue={p?.description} /></label>

        <div className="field">
          <span>Rasmlar</span>
          {p && p.images.length > 0 && (
            <div className="imgrow">
              {p.images.map((i) => (
                <div key={i.id} style={{ textAlign: "center" }}>
                  <div className="mini big"><Pic image={i.url} emoji={p.emoji} /></div>
                  <button className="rm" type="submit" formAction={removeProductImage} formNoValidate name="imageId" value={i.id}>Oʻchirish</button>
                </div>
              ))}
            </div>
          )}
          <input type="file" name="images" accept="image/jpeg,image/png,image/webp,image/gif" multiple />
          <small className="note">JPG, PNG, WEBP yoki GIF, har biri 5 MB gacha. Birinchisi asosiy rasm boʻladi. Internetdagi saytda bir saqlashda jami taxminan 4 MB dan oshmasin, kattalarini bittadan yuklang.</small>
        </div>
        {p && <input type="hidden" name="productId" value={p.id} />}
        <label className="check"><input type="checkbox" name="active" defaultChecked={p ? p.active : true} /> Saytda koʻrsatilsin</label>
        <button className="btn" type="submit" style={{ alignSelf: "flex-start" }}>Saqlash</button>
      </form>
      {p && (
        <form action={deleteProduct} style={{ marginTop: 22 }}>
          <input type="hidden" name="id" value={p.id} />
          <ConfirmButton message="Mahsulotni butunlay oʻchirasizmi? Buni qaytarib boʻlmaydi.">Mahsulotni oʻchirish</ConfirmButton>
        </form>
      )}
    </>
  );
}
