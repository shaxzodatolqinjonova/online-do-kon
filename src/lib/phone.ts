// O'zbekiston raqami: +998 XX XXX XX XX. Qaytadi: "+998901234567" yoki null
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  let d = digits;
  if (d.length === 9) d = "998" + d; // 90 123 45 67
  if (d.length !== 12 || !d.startsWith("998")) return null;
  const operator = d.slice(3, 5);
  // 2 xonali kod 3 ta raqam bilan boshlanmaydi (0/1 emas)
  if (!/^[3-9]\d$/.test(operator)) return null;
  return "+" + d;
}
