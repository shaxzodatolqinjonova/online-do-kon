export function som(n: number): string {
  return String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " soʻm";
}

export function discountPercent(price: number, oldPrice: number): number {
  return oldPrice > price ? Math.round((1 - price / oldPrice) * 100) : 0;
}

export const REGIONS = [
  "Toshkent shahri",
  "Toshkent viloyati",
  "Andijon",
  "Buxoro",
  "Fargʻona",
  "Jizzax",
  "Xorazm",
  "Namangan",
  "Navoiy",
  "Qashqadaryo",
  "Qoraqalpogʻiston Respublikasi",
  "Samarqand",
  "Sirdaryo",
  "Surxondaryo",
] as const;

export const ORDER_STATUS_LABEL = {
  NEW: "Yangi",
  CONFIRMED: "Tasdiqlandi",
  SHIPPING: "Yoʻlda",
  DELIVERED: "Yetkazildi",
  CANCELLED: "Bekor qilindi",
} as const;

export const PAYMENT_LABEL = {
  CLICK: "Click",
  PAYME: "Payme",
  UZUM: "Uzum",
  CASH: "Naqd (olganda)",
} as const;
