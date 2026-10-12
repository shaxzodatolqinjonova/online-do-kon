import { CONTENT_TYPE_BY_EXT, readLocal } from "@/lib/storage";

// Kompyuterda yuklangan rasmlarni beradi
export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const data = await readLocal(file);
  if (!data) return new Response("Topilmadi", { status: 404 });
  return new Response(new Uint8Array(data), {
    headers: { "content-type": CONTENT_TYPE_BY_EXT[file.split(".")[1]], "cache-control": "public, max-age=31536000, immutable" },
  });
}
