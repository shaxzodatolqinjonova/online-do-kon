// "Boʻyinbogʻ" -> "boyinbog" ko'rinishidagi chiroyli URL
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[ʻʼ’‘`'´]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
