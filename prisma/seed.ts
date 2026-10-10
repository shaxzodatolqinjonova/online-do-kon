import { PrismaClient } from "@prisma/client";
import { slugify } from "../src/lib/slug";

const prisma = new PrismaClient();

const CATS: [string, string, string][] = [
  ["taom", "Taomlar", "🐟"],
  ["dori", "Dorilar", "💊"],
  ["boyin", "Boʻyinbogʻlar", "🎀"],
  ["aks", "Aksessuarlar", "🧶"],
  ["kiyim", "Kiyimchalar", "👕"],
  ["divan", "Divanchalar", "🛋️"],
  ["shampun", "Shampunlar", "🧴"],
  ["sovun", "Sovunlar", "🧼"],
  ["jun", "Jun olish", "🪮"],
  ["chom", "Choʻmilish vositalari", "🛁"],
  ["idish", "Idishchalar", "🥣"],
];

// [kategoriya, nom, narx, eski narx, emoji, sotilgan, qoldiq, tavsif]
const PRODUCTS: [string, string, number, number, string, number, number, string][] = [
  ["taom", "Losos baliqli quruq ozuqa, 2 kg", 189000, 219000, "🐟", 320, 40, "Katta yoshli mushuklar uchun toʻyimli quruq ozuqa. Jun yaltiroq boʻlishiga yordam beradi."],
  ["taom", "Tovuqli nam ozuqa, 12 dona", 132000, 0, "🍗", 280, 60, "Sousdagi yumshoq boʻlakchalar. Har bir paket bir mahal ovqat uchun."],
  ["taom", "Mushukchalar uchun ozuqa, 1,5 kg", 158000, 0, "🥫", 210, 35, "Bir yoshgacha boʻlgan mushukchalar uchun maxsus tarkib, mayda donachalar."],
  ["dori", "Gijjaga qarshi tabletka", 45000, 0, "💊", 150, 50, "Qoʻllash tartibi qadoqda koʻrsatilgan."],
  ["dori", "Burga va kanaga qarshi tomchi", 68000, 0, "💧", 175, 45, "Boʻyin terisiga tomiziladigan vosita."],
  ["dori", "Vitaminli pasta", 54000, 0, "🌿", 90, 30, "Ishtahani yaxshilaydi va junni mustahkamlaydi."],
  ["boyin", "Qoʻngʻiroqchali pushti boʻyinbogʻ", 35000, 0, "🎀", 410, 80, "Yumshoq material, xavfsiz qulf. Boʻyin oʻlchamiga moslashtiriladi."],
  ["boyin", "Ism yoziladigan charm boʻyinbogʻ", 59000, 69000, "🔔", 120, 25, "Mushukchangiz ismi va telefon raqamingizni yozdirish mumkin."],
  ["aks", "Patli oʻyinchoq tayoqcha", 29000, 0, "🪶", 260, 90, "Mushukchani harakatga keltiradigan qiziqarli oʻyinchoq."],
  ["aks", "Tirnalgich minora", 349000, 399000, "🐾", 85, 8, "Uch qavatli minora: tirnalgich, yotoqcha va osma oʻyinchoq bilan."],
  ["kiyim", "Yumshoq trikotaj kofta", 79000, 0, "👕", 140, 30, "Sovuq kunlar uchun issiq va yengil kofta. S, M, L oʻlchamlar."],
  ["kiyim", "Qishki kombinezon", 115000, 0, "🧥", 60, 12, "Junsiz va kalta junli mushuklar uchun issiq kiyim."],
  ["divan", "Yurakcha shaklidagi divancha", 249000, 289000, "🛋️", 190, 15, "Yumshoq, yuviladigan gʻilofli divancha. Pushti rangda."],
  ["divan", "Yopiq uy-yostiqcha", 199000, 0, "🏠", 110, 10, "Mushuklar yashirinishni yaxshi koʻradi, bu uycha aynan shuning uchun."],
  ["shampun", "Gipoallergen shampun, 250 ml", 62000, 0, "🧴", 230, 40, "Sezgir teri uchun yumshoq tarkib, hidi yengil."],
  ["shampun", "Quruq shampun-koʻpik", 58000, 0, "🫧", 95, 22, "Suvsiz tozalash uchun. Suvdan qoʻrqadigan mushuklarga qulay."],
  ["sovun", "Moychechakli tabiiy sovun", 25000, 0, "🧼", 130, 70, "Tabiiy tarkibli, terini quritmaydigan sovun."],
  ["jun", "Jun olish taroqi", 89000, 0, "🪮", 300, 55, "Toʻkilayotgan junni oson yigʻib oladi, teriga zarar bermaydi."],
  ["jun", "Silikon massaj qoʻlqopi", 39000, 0, "🧤", 170, 45, "Silash bilan birga junni yigʻadi. Mushuklar buni juda yoqtiradi."],
  ["chom", "Choʻmilish toʻplami: togʻora va sochiq", 139000, 0, "🛁", 75, 14, "Sirpanmaydigan togʻora va tez quriydigan mikrofibra sochiq."],
  ["idish", "Ikkitalik keramik idish", 75000, 0, "🥣", 350, 60, "Ovqat va suv uchun ikki boʻlimli, qiyshiq stendli idish."],
  ["idish", "Avtomatik suv favvorachasi", 229000, 0, "⛲", 140, 0, "Oqib turgan suv mushukni koʻproq suv ichishga undaydi. Filtr bilan."],
];

const TIPS: [string, string][] = [
  ["Mushukni qanchalik tez-tez choʻmiltirish kerak?", "Koʻpchilik mushuklar oʻzini oʻzi tozalaydi, shuning uchun tez-tez choʻmiltirish shart emas. Odatda bir necha oyda bir marta yoki juda iflos boʻlganda yetarli. Iliq suv va faqat mushuklar uchun moʻljallangan shampundan foydalaning, keyin sochiq bilan yaxshilab quriting."],
  ["Junni tarash nima uchun muhim?", "Muntazam tarash toʻkilgan junni kamaytiradi va mushuk oshqozonida jun toʻplanishining oldini oladi. Bahor va kuzda jun koʻproq toʻkiladi, bu paytda har kuni tarash foydali."],
  ["Mushukchani (kitten) qanday ovqatlantirish kerak?", "Taxminan bir yoshgacha mushukchalarga maxsus kitten ozuqasi beriladi. Kun davomida oz-ozdan bir necha marta ovqatlantiring va har doim toza suv qoʻyib qoʻying."],
  ["Burga va gijjadan himoya", "Uyda yashaydigan mushuklarga ham muntazam profilaktika kerak. Qaysi vositani va qancha muddatda qoʻllashni albatta veterinar bilan maslahatlashib belgilang."],
];

async function main() {
  await prisma.setting.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      shopName: "miyov.uz",
      tagline: "Mushukchangiz uchun hamma narsa bir joyda: taom, kiyimcha, choʻmilish va mehr.",
      telegram: "https://t.me/miyovuz",
      instagram: "https://instagram.com/miyovuz",
      whatsapp: "https://wa.me/998901234567",
      phone: "+998 90 123 45 67",
      offer1Emoji: "🎁",
      offer1Title: "MIYOV10 bilan 10% chegirma",
      offer1Text: "Birinchi xaridingiz uchun promokod",
      offer2Emoji: "🚚",
      offer2Title: "300 000 soʻmdan bepul yetkazib berish",
      offer2Text: "Butun Oʻzbekiston boʻylab",
    },
  });

  const catIds: Record<string, string> = {};
  for (const [i, [key, name, emoji]] of CATS.entries()) {
    const c = await prisma.category.upsert({
      where: { slug: slugify(name) },
      update: { name, emoji, position: i },
      create: { slug: slugify(name), name, emoji, position: i },
    });
    catIds[key] = c.id;
  }

  for (const [cat, name, price, oldPrice, emoji, sold, stock, description] of PRODUCTS) {
    const slug = slugify(name);
    await prisma.product.upsert({
      where: { slug },
      update: {},
      create: { slug, name, price, oldPrice, emoji, sold, stock, description, categoryId: catIds[cat] },
    });
  }

  for (const [code, percent, minTotal] of [["MIYOV10", 10, 0], ["MUSHUK20", 20, 400000]] as const) {
    await prisma.promo.upsert({ where: { code }, update: {}, create: { code, percent, minTotal } });
  }

  for (const [title, body] of TIPS) {
    const slug = slugify(title);
    await prisma.article.upsert({ where: { slug }, update: {}, create: { slug, title, body } });
  }
  console.log("Seed tayyor: 11 kategoriya, 22 mahsulot, 2 promokod, 4 maslahat");
}

main().finally(() => prisma.$disconnect());
