"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession, requireAdmin, verifyPassword } from "@/lib/auth";
import { allow, clientIp } from "@/lib/ratelimit";
import { deleteImage, saveImage, UploadError } from "@/lib/storage";
import { slugify } from "@/lib/slug";

/** Xato bo'lsa oldingi sahifaga xabar bilan qaytadi, yaxshi bo'lsa "saqlandi" bilan */
const back = (to: string, kind: "xato" | "ok", text = "1"): never => redirect(`${to}${to.includes("?") ? "&" : "?"}${kind}=${encodeURIComponent(text)}`);

const int = (min = 0, max = 100_000_000) => z.coerce.number().int().min(min).max(max);
const bool = (v: FormDataEntryValue | null) => v === "on";
const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

/* ---------- Kirish / chiqish ---------- */
export async function login(f: FormData) {
  if (!(await allow(`login:${await clientIp()}`, 5, 900))) return back("/admin/login", "xato", "Juda koʻp urinish. 15 daqiqadan keyin qayta urinib koʻring.");
  if (!verifyPassword(str(f, "password"), process.env.ADMIN_PASSWORD_HASH)) return back("/admin/login", "xato", "Parol notoʻgʻri.");
  await createSession();
  redirect("/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}

/* ---------- Buyurtmalar ---------- */
const STATUSES = ["NEW", "CONFIRMED", "SHIPPING", "DELIVERED", "CANCELLED"] as const;

export async function setOrderStatus(f: FormData) {
  await requireAdmin();
  const id = str(f, "id");
  const status = z.enum(STATUSES).parse(str(f, "status"));
  const to = str(f, "back") || "/admin";
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) return back(to, "xato", "Buyurtma topilmadi.");
  if (order.status === status) return back(to, "ok", "Holat oʻzgarmadi.");

  try {
    await prisma.$transaction(async (tx) => {
      const cancelling = status === "CANCELLED" && order.status !== "CANCELLED";
      const restoring = order.status === "CANCELLED" && status !== "CANCELLED";
      for (const it of order.items) {
        if (!it.productId) continue;
        if (cancelling) {
          // bekor qilinsa, mahsulot omborga qaytadi
          await tx.product.update({ where: { id: it.productId }, data: { stock: { increment: it.quantity }, sold: { decrement: it.quantity } } });
        } else if (restoring) {
          const r = await tx.product.updateMany({ where: { id: it.productId, stock: { gte: it.quantity } }, data: { stock: { decrement: it.quantity }, sold: { increment: it.quantity } } });
          if (r.count !== 1) throw new Error("STOCK:" + it.name);
        }
      }
      await tx.order.update({ where: { id }, data: { status } });
    });
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("STOCK:")) return back(to, "xato", `«${e.message.slice(6)}» omborda yetarli emas, buyurtmani qayta tiklab boʻlmadi.`);
    throw e;
  }
  back(to, "ok", "Holat yangilandi");
}

/* ---------- Mahsulotlar ---------- */
const productSchema = z.object({
  name: z.string().min(2, "Mahsulot nomini kiriting.").max(120),
  categoryId: z.string().min(1, "Kategoriyani tanlang."),
  price: int(0),
  oldPrice: int(0),
  stock: int(0, 100000),
  sold: int(0, 10_000_000),
  emoji: z.string().max(8),
  description: z.string().max(2000),
});

async function uniqueSlug(base: string, exceptId?: string) {
  const root = slugify(base) || "mahsulot";
  for (let i = 1; ; i++) {
    const slug = i === 1 ? root : `${root}-${i}`;
    const found = await prisma.product.findUnique({ where: { slug } });
    if (!found || found.id === exceptId) return slug;
  }
}

export async function saveProduct(f: FormData) {
  await requireAdmin();
  const id = str(f, "id");
  const page = id ? `/admin/mahsulotlar/${id}` : "/admin/mahsulotlar/yangi";
  const parsed = productSchema.safeParse({
    name: str(f, "name"), categoryId: str(f, "categoryId"), price: str(f, "price") || 0, oldPrice: str(f, "oldPrice") || 0,
    stock: str(f, "stock") || 0, sold: str(f, "sold") || 0, emoji: str(f, "emoji") || "🐾", description: str(f, "description"),
  });
  if (!parsed.success) return back(page, "xato", parsed.error.issues[0]?.message ?? "Maʼlumotlar notoʻgʻri.");
  const d = parsed.data;
  if (d.oldPrice && d.oldPrice <= d.price) return back(page, "xato", "Eski narx yangi narxdan katta boʻlishi kerak (yoki 0 qoldiring).");
  if (!(await prisma.category.findUnique({ where: { id: d.categoryId } }))) return back(page, "xato", "Kategoriya topilmadi.");

  const files = f.getAll("images").filter((x): x is File => x instanceof File && x.size > 0);
  const urls: string[] = [];
  try {
    for (const file of files) urls.push(await saveImage(file));
  } catch (e) {
    for (const u of urls) await deleteImage(u);
    return back(page, "xato", e instanceof UploadError ? e.message : "Rasmni yuklab boʻlmadi.");
  }

  const active = bool(f.get("active"));
  let productId = id;
  if (id) {
    const old = await prisma.product.findUnique({ where: { id }, include: { images: true } });
    if (!old) return back("/admin/mahsulotlar", "xato", "Mahsulot topilmadi.");
    await prisma.product.update({ where: { id }, data: { ...d, active } });
    const start = old.images.length;
    if (urls.length) await prisma.productImage.createMany({ data: urls.map((url, i) => ({ productId: id, url, position: start + i })) });
  } else {
    const slug = await uniqueSlug(d.name);
    const p = await prisma.product.create({ data: { ...d, slug, active, images: { create: urls.map((url, i) => ({ url, position: i })) } } });
    productId = p.id;
  }
  back(`/admin/mahsulotlar/${productId}`, "ok", "Saqlandi");
}

export async function removeProductImage(f: FormData) {
  await requireAdmin();
  const img = await prisma.productImage.findUnique({ where: { id: str(f, "imageId") } });
  if (img) {
    await prisma.productImage.delete({ where: { id: img.id } });
    await deleteImage(img.url);
  }
  back(`/admin/mahsulotlar/${str(f, "productId")}`, "ok", "Rasm oʻchirildi");
}

export async function deleteProduct(f: FormData) {
  await requireAdmin();
  const id = str(f, "id");
  const p = await prisma.product.findUnique({ where: { id }, include: { images: true } });
  if (p) {
    await prisma.product.delete({ where: { id } });
    for (const i of p.images) await deleteImage(i.url);
  }
  back("/admin/mahsulotlar", "ok", "Mahsulot oʻchirildi");
}

/* ---------- Kategoriyalar ---------- */
export async function saveCategory(f: FormData) {
  await requireAdmin();
  const id = str(f, "id");
  const parsed = z.object({ name: z.string().min(2, "Kategoriya nomini kiriting.").max(60), emoji: z.string().max(8), position: int(0, 1000) }).safeParse({
    name: str(f, "name"), emoji: str(f, "emoji") || "🐾", position: str(f, "position") || 0,
  });
  if (!parsed.success) return back("/admin/kategoriyalar", "xato", parsed.error.issues[0]?.message ?? "Maʼlumotlar notoʻgʻri.");
  if (id) {
    await prisma.category.update({ where: { id }, data: { ...parsed.data, active: bool(f.get("active")) } });
  } else {
    let slug = slugify(parsed.data.name) || "kategoriya";
    while (await prisma.category.findUnique({ where: { slug } })) slug += "-2";
    await prisma.category.create({ data: { ...parsed.data, slug, active: true } });
  }
  back("/admin/kategoriyalar", "ok", "Saqlandi");
}

export async function deleteCategory(f: FormData) {
  await requireAdmin();
  const id = str(f, "id");
  if (await prisma.product.count({ where: { categoryId: id } })) return back("/admin/kategoriyalar", "xato", "Avval bu kategoriyadagi mahsulotlarni boshqasiga oʻtkazing.");
  await prisma.category.delete({ where: { id } });
  back("/admin/kategoriyalar", "ok", "Oʻchirildi");
}

/* ---------- Promokodlar ---------- */
export async function savePromo(f: FormData) {
  await requireAdmin();
  const id = str(f, "id");
  const parsed = z.object({
    code: z.string().regex(/^[A-Z0-9_-]{3,20}$/, "Kod 3–20 ta lotin harfi yoki raqamdan iborat boʻlsin."),
    percent: int(1, 90),
    minTotal: int(0),
  }).safeParse({ code: str(f, "code").toUpperCase(), percent: str(f, "percent"), minTotal: str(f, "minTotal") || 0 });
  if (!parsed.success) return back("/admin/promokodlar", "xato", parsed.error.issues[0]?.message ?? "Chegirma 1 dan 90 gacha boʻlsin.");
  const exp = str(f, "expiresAt");
  const expiresAt = exp ? new Date(exp + "T23:59:59") : null;
  if (expiresAt && Number.isNaN(expiresAt.getTime())) return back("/admin/promokodlar", "xato", "Sana notoʻgʻri.");
  const data = { ...parsed.data, expiresAt, active: id ? bool(f.get("active")) : true };
  try {
    if (id) await prisma.promo.update({ where: { id }, data });
    else await prisma.promo.create({ data });
  } catch {
    return back("/admin/promokodlar", "xato", "Bu kod allaqachon bor.");
  }
  back("/admin/promokodlar", "ok", "Saqlandi");
}

export async function deletePromo(f: FormData) {
  await requireAdmin();
  await prisma.promo.delete({ where: { id: str(f, "id") } }).catch(() => {});
  back("/admin/promokodlar", "ok", "Oʻchirildi");
}

/* ---------- Sharhlar ---------- */
export async function setReview(f: FormData) {
  await requireAdmin();
  const id = str(f, "id");
  const op = str(f, "op");
  if (op === "delete") await prisma.review.delete({ where: { id } }).catch(() => {});
  else await prisma.review.update({ where: { id }, data: { approved: op === "approve" } }).catch(() => {});
  back("/admin/sharhlar", "ok", op === "approve" ? "Sharh saytga chiqdi" : op === "hide" ? "Sharh yashirildi" : "Sharh oʻchirildi");
}

/* ---------- Maslahat maqolalari ---------- */
export async function saveArticle(f: FormData) {
  await requireAdmin();
  const id = str(f, "id");
  const parsed = z.object({ title: z.string().min(3, "Sarlavhani kiriting.").max(150), body: z.string().min(10, "Matn juda qisqa.").max(10000) }).safeParse({ title: str(f, "title"), body: str(f, "body") });
  if (!parsed.success) return back("/admin/maslahatlar", "xato", parsed.error.issues[0]?.message ?? "Maʼlumotlar notoʻgʻri.");
  if (id) {
    await prisma.article.update({ where: { id }, data: { ...parsed.data, published: bool(f.get("published")) } });
  } else {
    let slug = slugify(parsed.data.title) || "maqola";
    while (await prisma.article.findUnique({ where: { slug } })) slug += "-2";
    await prisma.article.create({ data: { ...parsed.data, slug, published: true } });
  }
  back("/admin/maslahatlar", "ok", "Saqlandi");
}

export async function deleteArticle(f: FormData) {
  await requireAdmin();
  await prisma.article.delete({ where: { id: str(f, "id") } }).catch(() => {});
  back("/admin/maslahatlar", "ok", "Oʻchirildi");
}

/* ---------- Sozlamalar ---------- */
const url = z.string().max(200).refine((v) => v === "" || /^https?:\/\//i.test(v), "Havola https:// bilan boshlansin.");

export async function saveSettings(f: FormData) {
  await requireAdmin();
  const parsed = z.object({
    shopName: z.string().min(2, "Doʻkon nomini kiriting.").max(40),
    tagline: z.string().max(200),
    freeFrom: int(0), shippingFee: int(0),
    timeCity: z.string().max(40), timeRegion: z.string().max(40),
    telegram: url, instagram: url, whatsapp: url, phone: z.string().max(30),
    drugNote: z.string().max(200),
    offer1Emoji: z.string().max(8), offer1Title: z.string().max(80), offer1Text: z.string().max(120),
    offer2Emoji: z.string().max(8), offer2Title: z.string().max(80), offer2Text: z.string().max(120),
  }).safeParse({
    shopName: str(f, "shopName"), tagline: str(f, "tagline"), freeFrom: str(f, "freeFrom") || 0, shippingFee: str(f, "shippingFee") || 0,
    timeCity: str(f, "timeCity"), timeRegion: str(f, "timeRegion"), telegram: str(f, "telegram"), instagram: str(f, "instagram"),
    whatsapp: str(f, "whatsapp"), phone: str(f, "phone"), drugNote: str(f, "drugNote"),
    offer1Emoji: str(f, "offer1Emoji"), offer1Title: str(f, "offer1Title"), offer1Text: str(f, "offer1Text"),
    offer2Emoji: str(f, "offer2Emoji"), offer2Title: str(f, "offer2Title"), offer2Text: str(f, "offer2Text"),
  });
  if (!parsed.success) return back("/admin/sozlamalar", "xato", parsed.error.issues[0]?.message ?? "Maʼlumotlar notoʻgʻri.");
  const data = { ...parsed.data, payClick: bool(f.get("payClick")), payPayme: bool(f.get("payPayme")), payUzum: bool(f.get("payUzum")), payCash: bool(f.get("payCash")) };
  if (!data.payClick && !data.payPayme && !data.payUzum && !data.payCash) return back("/admin/sozlamalar", "xato", "Kamida bitta toʻlov usuli yoqilgan boʻlsin.");
  await prisma.setting.upsert({ where: { id: 1 }, update: data, create: { id: 1, ...data } });
  back("/admin/sozlamalar", "ok", "Saqlandi");
}
