import { randomBytes } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { del, put } from "@vercel/blob";

/**
 * Rasm saqlash. Ikki rejim:
 *  - BLOB_READ_WRITE_TOKEN bor bo'lsa: Vercel Blob (serverda)
 *  - yo'q bo'lsa: loyiha ichidagi "uploads" papka (kompyuterda)
 * Boshqa bulutga o'tish uchun faqat shu fayl o'zgaradi.
 */
const DIR = path.join(process.cwd(), "uploads");
const MAX_BYTES = 5 * 1024 * 1024;

const TYPES: Record<string, { ext: string; magic: (b: Buffer) => boolean }> = {
  "image/jpeg": { ext: "jpg", magic: (b) => b[0] === 0xff && b[1] === 0xd8 },
  "image/png": { ext: "png", magic: (b) => b.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47])) },
  "image/webp": { ext: "webp", magic: (b) => b.subarray(0, 4).toString() === "RIFF" && b.subarray(8, 12).toString() === "WEBP" },
  "image/gif": { ext: "gif", magic: (b) => b.subarray(0, 3).toString() === "GIF" },
};

export const CONTENT_TYPE_BY_EXT: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif" };

export class UploadError extends Error {}

export async function saveImage(file: File): Promise<string> {
  const t = TYPES[file.type];
  if (!t) throw new UploadError("Faqat JPG, PNG, WEBP yoki GIF rasm yuklash mumkin.");
  if (file.size > MAX_BYTES) throw new UploadError("Rasm 5 MB dan kichik boʻlishi kerak.");
  const buf = Buffer.from(await file.arrayBuffer());
  if (!t.magic(buf)) throw new UploadError("Fayl rasm emas yoki buzilgan.");
  const name = `${randomBytes(12).toString("hex")}.${t.ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const r = await put(`products/${name}`, buf, { access: "public", contentType: file.type });
    return r.url;
  }
  await mkdir(DIR, { recursive: true });
  await writeFile(path.join(DIR, name), buf);
  return `/uploads/${name}`;
}

export async function deleteImage(url: string) {
  try {
    if (url.startsWith("/uploads/")) await unlink(path.join(DIR, path.basename(url)));
    else if (process.env.BLOB_READ_WRITE_TOKEN) await del(url);
  } catch {}
}

export async function readLocal(name: string): Promise<Buffer | null> {
  if (!/^[a-f0-9]{24}\.(jpg|png|webp|gif)$/.test(name)) return null; // yo'l buzish (../) mumkin emas
  try {
    return await readFile(path.join(DIR, name));
  } catch {
    return null;
  }
}
