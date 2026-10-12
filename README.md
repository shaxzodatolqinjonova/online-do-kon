# miyov.uz — mushukchalar uchun onlayn doʻkon

Roʻyxatdan oʻtmasdan xarid qilinadigan, oʻzbek tilidagi onlayn doʻkon: katalog, savat, buyurtma,
promokodlar, sharhlar, parol bilan himoyalangan admin panel, Telegram xabari va Payme/Click toʻlovlari.

> Bu qoʻllanma dasturchi boʻlmaganlar uchun yozilgan. Har bir qadamni ketma-ket bajaring.
> Tushunmagan joyingiz boʻlsa, shu qadamning raqamini yozib menga yuboring.

---

## Mundarija
1. [Loyihada nimalar bor](#1-loyihada-nimalar-bor)
2. [Kompyuterda ishga tushirish](#2-kompyuterda-ishga-tushirish)
3. [Internetga (serverga) joylash: Vercel + Neon](#3-internetga-serverga-joylash-vercel--neon)
4. [Toʻldirishingiz kerak boʻlgan barcha sozlamalar](#4-toʻldirishingiz-kerak-boʻlgan-barcha-sozlamalar)
5. [Admin paneldan nimalarni oʻzgartirish mumkin](#5-admin-paneldan-nimalarni-oʻzgartirish-mumkin)
6. [Joylagandan keyin tekshiruv roʻyxati](#6-joylagandan-keyin-tekshiruv-roʻyxati)
7. [Xavfsizlik](#7-xavfsizlik)
8. [Hozircha yoʻq narsalar va bilishingiz kerak boʻlganlar](#8-hozircha-yoʻq-narsalar-va-bilishingiz-kerak-boʻlganlar)
9. [Loyiha tuzilishi va foydali buyruqlar](#9-loyiha-tuzilishi-va-foydali-buyruqlar)

Qoʻshimcha qoʻllanmalar: **[Telegram bot va toʻlov tizimlarini ulash](docs/TOLOV-VA-TELEGRAM.md)** va **[VPS serverga joylash](docs/VPS-JOYLASH.md)**.

---

## 1. Loyihada nimalar bor

**Mijoz uchun:** bosh sahifa (banner, aksiyalar, kategoriyalar, eng koʻp sotilganlar), katalog
(qidiruv, kategoriya, saralash), mahsulot sahifasi (bir nechta rasm, narx, eski narx va chegirma foizi,
ombor holati, sharhlar), sevimlilar (brauzerda saqlanadi), savat, buyurtma, promokod, maslahatlar,
qorongʻi rejim, telefon uchun toʻliq moslashuv. Sayt faqat oʻzbek tilida.

**Siz uchun (admin panel, `/admin`):** mahsulotlar (rasm yuklash bilan), buyurtmalar va ularning holati,
kategoriyalar, promokodlar, sharhlarni tasdiqlash, maslahat maqolalari, yetkazib berish va toʻlov
sozlamalari, aloqa maʼlumotlari.

**Texnologiyalar** (bilishingiz shart emas, shunchaki maʼlumot uchun): Next.js + TypeScript + Tailwind
(sayt), PostgreSQL + Prisma (maʼlumotlar bazasi), Vercel (joylash).

---

## 2. Kompyuterda ishga tushirish

Bu sayt qanday koʻrinishini oʻz kompyuteringizda koʻrish va sinash uchun. Internetga chiqarish uchun
[3-boʻlim](#3-internetga-serverga-joylash-vercel--neon) ga oʻting.

### 2.1. Kerakli dasturlarni oʻrnating (bir marta)

| Dastur | Nima uchun | Qayerdan |
|---|---|---|
| **Node.js** (LTS versiya, 20 yoki yuqori) | saytni ishga tushiradi | https://nodejs.org |
| **PostgreSQL** (16) | maʼlumotlar bazasi | https://www.postgresql.org/download/ |

O'rnatgach tekshirish: terminal (Windows'da "PowerShell", Mac'da "Terminal") oching va yozing:
```
node -v
```
`v20...` yoki undan yuqori raqam chiqsa, tayyor.

> **Docker bilan osonroq:** agar kompyuteringizda Docker Desktop oʻrnatilgan boʻlsa, PostgreSQL'ni
> oʻrnatish oʻrniga loyiha papkasida `docker compose up -d` buyrugʻini bering. Baza avtomatik yaratiladi
> (foydalanuvchi `miyov`, parol `miyov_dev`, baza `miyov`). *(Men bu buyruqni oʻz muhitimda ishga
> tushira olmadim, shuning uchun u sinalmagan.)*

### 2.2. Bazani yarating
PostgreSQL oʻrnatganingizda "pgAdmin" dasturi ham oʻrnatiladi. Unda "Query Tool" ni oching va quyidagini
ishga tushiring (parolni oʻzingiznikiga almashtiring):
```sql
CREATE USER miyov WITH PASSWORD 'miyov_dev' CREATEDB;
CREATE DATABASE miyov OWNER miyov;
```

### 2.3. Loyiha papkasini tayyorlang
1. Siz olgan `miyov-uz.zip` faylini oching (Extract). `miyov-uz` papkasi hosil boʻladi.
2. Terminalda shu papkaga kiring: `cd yoʻl/miyov-uz` (Windows'da papkani Explorer'da ochib, manzil
   satriga `powershell` deb yozsangiz ham boʻladi).
3. Kutubxonalarni oʻrnating (bir necha daqiqa oladi):
   ```
   npm install
   ```

### 2.4. Sozlamalar faylini yarating
1. `.env.example` faylidan nusxa olib, nomini `.env` qiling.
   (Mac/Linux: `cp .env.example .env`; Windows: `copy .env.example .env`)
2. `.env` faylini oddiy matn muharririda (Bloknot) oching va birinchi qatorni 2.2 dagi maʼlumotga mos qiling:
   ```
   DATABASE_URL="postgresql://miyov:miyov_dev@localhost:5432/miyov"
   ```
   Qolgan qatorlar hozircha boʻsh qolishi mumkin.

### 2.5. Bazani tayyorlang va namunaviy maʼlumotlarni joylang
```
npm run setup
```
Bu jadvallarni yaratadi va 11 kategoriya, 22 mahsulot, 2 promokod (`MIYOV10`, `MUSHUK20`), 4 maslahatni
joylaydi.

### 2.6. Admin parolini belgilang
```
npm run admin:setup -- "OzingizTanlagan-Parol-2026"
```
Parol kamida 8 belgi. Bu buyruq parolni **xeshlab** (oʻqib boʻlmaydigan koʻrinishda) `.env` fayliga yozadi.
Parolning oʻzi hech qayerda saqlanmaydi, uni yoddan chiqarmang.

### 2.7. Ishga tushiring
```
npm run dev
```
- Doʻkon: http://localhost:3000
- Admin panel: http://localhost:3000/admin

Toʻxtatish: terminalda `Ctrl + C`.

Admin panelda yuklangan rasmlar loyiha ichidagi `uploads` papkaga yoziladi.

---

## 3. Internetga (serverga) joylash: Vercel + Neon

> **Oʻz VPS serveringiz boʻlsa** (Vercel kerak emas): **[docs/VPS-JOYLASH.md](docs/VPS-JOYLASH.md)** — tayyor skript
> bilan Node.js, baza, nginx, HTTPS va zaxira nusxani avtomatik sozlaydi. Quyida Vercel yoʻli.

**Reja:** kod GitHub'da turadi → **Neon** (bepul bulutdagi PostgreSQL) maʼlumotlarni saqlaydi →
**Vercel** saytni internetda koʻrsatadi. Rasmlar uchun **Vercel Blob** ishlatiladi.

> Muhim: Vercel'da oddiy papkaga yozilgan rasm saqlanib qolmaydi. Shuning uchun serverda rasmlar
> Vercel Blob'ga yoziladi (kod buni avtomatik qiladi, faqat 3.5-qadamni bajaring).

### 3.1. Hisoblar oching (hammasi bepul boshlanadi)
- GitHub: https://github.com (kod allaqachon shu yerda: `shaxzodatolqinjonova/online-do-kon`)
- Vercel: https://vercel.com ("Continue with GitHub" bilan kiring)
- Neon: https://neon.tech

### 3.2. Kodni asosiy (main) branch'ga chiqaring
Kod hozir `claude/shahi-cat-online-store-o6lfkv` branch'ida. Vercel odatda `main` branch'ni joylaydi, u esa
hozircha boʻsh. Ikki yoʻl bor:
- **Oson:** GitHub'da repozitoriyni oching, "Pull requests" → "New pull request", branch'ni `main` ga
  qoʻshing va "Merge" bosing. *(Buni men oʻzim qilmadim, chunki siz soʻramagansiz. Istasangiz ayting.)*
- Yoki Vercel'da loyiha sozlamalarida "Production Branch" ni shu branch nomiga oʻzgartiring.

### 3.3. Neon'da baza yarating
1. Neon'da "New Project" bosing, nom bering (masalan `miyov`), mintaqa: Frankfurt yoki yaqinroq.
2. Loyiha ochilgach "Connection string" ni nusxalang. U shunday koʻrinadi:
   `postgresql://foydalanuvchi:parol@ep-xxx.neon.tech/neondb?sslmode=require`
   Bu sizning **DATABASE_URL** ingiz. **Hech kimga bermang.**

### 3.4. Neon bazasini tayyorlang (kompyuteringizdan, bir marta)
Loyiha papkasida terminal oching va (qoʻshtirnoq ichiga oʻz manzilingizni qoʻying):

Windows (PowerShell):
```
$env:DATABASE_URL="postgresql://...neon.tech/neondb?sslmode=require"; npm run setup
```
Mac / Linux:
```
DATABASE_URL="postgresql://...neon.tech/neondb?sslmode=require" npm run setup
```
Bu Neon bazasida jadvallarni yaratadi va namunaviy mahsulotlarni joylaydi. Keyin admin paneldan
ularni oʻzingizniki bilan almashtirasiz.

### 3.5. Vercel'da loyihani yarating
1. Vercel → "Add New…" → "Project" → GitHub'dan `online-do-kon` ni tanlang → "Import".
2. **Environment Variables** boʻlimida [4-boʻlim](#4-toʻldirishingiz-kerak-boʻlgan-barcha-sozlamalar)
   jadvalidagi qiymatlarni kiriting. Kamida shular: `DATABASE_URL`, `NEXT_PUBLIC_SITE_URL`,
   `ADMIN_PASSWORD_HASH`, `SESSION_SECRET`.
   - `ADMIN_PASSWORD_HASH` va `SESSION_SECRET` ni kompyuteringizda `npm run admin:setup -- "parolingiz"`
     buyrugʻi tayyorlaydi: oxirida ikki qatorni chiqarib beradi, ularni shundayligicha nusxalang.
3. "Deploy" bosing. 1–3 daqiqada sayt tayyor boʻladi.
4. **Rasmlar uchun:** loyihada "Storage" yorligʻi → "Create Database" → **Blob** → yarating va loyihaga
   ulang. `BLOB_READ_WRITE_TOKEN` avtomatik qoʻshiladi. Soʻng "Deployments" → oxirgisi → "Redeploy".

### 3.6. Oʻz domeningiz (masalan miyov.uz)
Vercel → loyiha → "Settings" → "Domains" → domenni qoʻshing. Vercel koʻrsatgan DNS yozuvlarini domen
sotib olgan joyingizda (registrator) kiriting. Tayyor boʻlgach `NEXT_PUBLIC_SITE_URL` ni
`https://miyov.uz` ga oʻzgartirib, qayta joylang (Redeploy). Bu qidiruv tizimlari (SEO) va toʻlov
havolalari uchun muhim.

### 3.7. Keyin
- Telegram: [qoʻllanma](docs/TOLOV-VA-TELEGRAM.md) 1-boʻlim.
- Payme/Click: shartnoma tuzgach, [qoʻllanma](docs/TOLOV-VA-TELEGRAM.md) 3–4 boʻlimlari.
- Google Search Console'da (https://search.google.com/search-console) saytni qoʻshib,
  `https://SIZNING-SAYT/sitemap.xml` manzilini yuboring.

---

## 4. Toʻldirishingiz kerak boʻlgan barcha sozlamalar

Hammasi `.env` faylida (kompyuterda) yoki Vercel → Settings → Environment Variables (serverda).

| Nomi | Majburiy? | Nima uchun | Qayerdan olinadi |
|---|---|---|---|
| `DATABASE_URL` | **Ha** | Maʼlumotlar bazasi manzili | Neon (3.3) yoki oʻz PostgreSQL'ingiz |
| `NEXT_PUBLIC_SITE_URL` | **Ha** | Saytning toʻliq manzili (SEO, sitemap, toʻlov qaytish havolasi) | Oʻz domeningiz, masalan `https://miyov.uz` |
| `ADMIN_PASSWORD_HASH` | **Ha** | Admin parolining xeshi | `npm run admin:setup -- "parol"` |
| `SESSION_SECRET` | **Ha** | Admin kirishini imzolash kaliti (32+ belgi) | Xuddi shu buyruq yaratadi |
| `BLOB_READ_WRITE_TOKEN` | Serverda **ha** | Rasmlarni saqlash | Vercel → Storage → Blob (avtomatik) |
| `TELEGRAM_BOT_TOKEN` | Tavsiya | Buyurtma xabari | @BotFather ([qoʻllanma](docs/TOLOV-VA-TELEGRAM.md)) |
| `TELEGRAM_CHAT_ID` | Tavsiya | Xabar qayerga kelishi | `getUpdates` ([qoʻllanma](docs/TOLOV-VA-TELEGRAM.md)) |
| `PAYME_MERCHANT_ID` | Payme uchun | Payme kassa raqami | Payme Business kabineti |
| `PAYME_KEY` | Payme uchun | Payme kaliti | Payme Business kabineti |
| `PAYME_LOGIN` | Yoʻq | Odatda `Paycom`, oʻzgartirmang | — |
| `PAYME_TEST` | Payme uchun | `true` = sinov, `false` = haqiqiy toʻlov | Oʻzingiz belgilaysiz |
| `CLICK_SERVICE_ID` | Click uchun | Click xizmat raqami | Click Merchant kabineti |
| `CLICK_MERCHANT_ID` | Click uchun | Click savdogar raqami | Click Merchant kabineti |
| `CLICK_SECRET_KEY` | Click uchun | Click maxfiy kaliti | Click Merchant kabineti |

Toʻlov kalitlari kiritilmagan boʻlsa, oʻsha toʻlov usuli mijozga **koʻrinmaydi**, sayt esa naqd pul bilan
ishlayveradi.

**Toʻlov kabinetlarida kiritiladigan manzillar** (sayt internetda boʻlgach):
- Payme "Endpoint URL": `https://SIZNING-SAYT/api/payme`
- Click "Prepare URL" va "Complete URL": `https://SIZNING-SAYT/api/click`

---

## 5. Admin paneldan nimalarni oʻzgartirish mumkin

`https://SIZNING-SAYT/admin` → parol bilan kiring.

| Boʻlim | Nimalar |
|---|---|
| Buyurtmalar | roʻyxat, tafsilot, holatni oʻzgartirish: Yangi → Tasdiqlandi → Yoʻlda → Yetkazildi / Bekor qilindi. Bekor qilinsa, mahsulotlar omborga qaytadi. |
| Mahsulotlar | qoʻshish, tahrirlash, oʻchirish, bir nechta rasm, kategoriya, narx, eski narx (chegirma foizi avtomatik), ombor qoldigʻi, "saytda koʻrsatilsin" |
| Kategoriyalar | nom, emoji, tartib, koʻrinishi |
| Promokodlar | kod, foiz, minimal summa, amal qilish muddati, faol/nofaol |
| Sharhlar | yangi sharhlarni tasdiqlash, yashirish, oʻchirish |
| Maslahatlar | maqola qoʻshish, tahrirlash |
| Sozlamalar | doʻkon nomi va shior, banner takliflari, yetkazib berish narxi va bepul chegarasi, yetkazib berish muddati, toʻlov usullari, Telegram/Instagram/WhatsApp/telefon, dorilar ogohlantirishi |

---

## 6. Joylagandan keyin tekshiruv roʻyxati

Telefoningizdan ham ochib koʻring.

- [ ] Bosh sahifa ochiladi, rasm va matnlar toʻgʻri
- [ ] Admin panelga kirildi, noto'g'ri parol bilan kirib boʻlmaydi
- [ ] Admin paneldan 1 ta sinov mahsulot qoʻshildi, **rasmi yuklandi** va saytda koʻrindi
- [ ] Sinov buyurtma (naqd pul) berildi: admin panelda paydo boʻldi, **Telegram xabari keldi**
- [ ] Promokod ishladi, bepul yetkazish chegarasi toʻgʻri hisoblandi
- [ ] Dorilar kategoriyasida "Veterinar maslahati bilan qoʻllang" ogohlantirishi bor
- [ ] Sharh yozildi, admin tasdiqlagach saytda chiqdi
- [ ] Payme/Click: **sinov rejimida** 1 ta toʻlov oxirigacha bajarildi, buyurtma "toʻlangan" boʻldi
- [ ] `https://SIZNING-SAYT/sitemap.xml` ochiladi va manzillar toʻgʻri domen bilan chiqadi
- [ ] Namunaviy 22 ta mahsulot oʻzingizniki bilan almashtirildi (yoki oʻchirildi)

---

## 7. Xavfsizlik

Nima qilingan:
- Admin parol xeshlangan (scrypt), kirish cookie imzolangan va `httpOnly`; 15 daqiqada 5 ta notoʻgʻri
  urinishdan keyin bloklanadi.
- Narx, chegirma, yetkazib berish narxi faqat serverda hisoblanadi, brauzerdan kelgan narxga ishonilmaydi.
- Barcha formalar serverda tekshiriladi (ism, +998 telefon, viloyat roʻyxati, uzunliklar).
- Spamdan himoya: yashirin maydon (botlar toʻldiradi) va IP boʻyicha tezlik chegarasi (buyurtma 10 daqiqada 5 ta,
  sharh 3 ta).
- Rasm yuklashda fayl turi va ichki tuzilishi tekshiriladi (faqat JPG/PNG/WEBP/GIF, 5 MB gacha).
- Toʻlov tizimlaridan kelgan soʻrovlar imzo/kalit bilan tekshiriladi.
- Himoya sarlavhalari (boshqa saytga joylashni taqiqlash, kontent xavfsizligi siyosiyati va boshqalar).

Sizdan talab qilinadi:
- `.env` faylini va kalitlarni **hech qachon** GitHub'ga yoki boshqalarga yubormang (`.gitignore` buni
  oldini oladi, lekin ehtiyot boʻling).
- Admin parolini murakkab qiling va hech kim bilan ulashmang.
- Kalit tasodifan oshkor boʻlsa, uni toʻlov kabinetida/BotFather'da darhol yangilang.

---

## 8. Hozircha yoʻq narsalar va bilishingiz kerak boʻlganlar

- **Uzum toʻlovi ulanmagan.** Rasmiy hujjat topilmadi, oʻylab topib yozmadim. Uzum mijozga koʻrinmaydi.
  Shartnomadan keyin hujjatni yuboring, ulab beraman.
- **Toʻlov havolalari va fiskal chek:** Payme/Click havolasi formati va soliq (fiskal) maʼlumotlari
  boʻyicha talablarni ularning menejeri bilan tekshiring. Birinchi toʻlovni albatta sinov rejimida qoʻlda
  sinang.
- **Toʻlanmagan onlayn buyurtma mahsulotni omborda ushlab turadi.** Mijoz toʻlamasa, admin panelda
  buyurtmani "Bekor qilindi" qiling (ombor qaytadi). Avtomatik bekor qilish hozircha yoʻq.
- **Rasm hajmi:** Vercel bir soʻrovda taxminan 4,5 MB gacha qabul qiladi. Bir saqlashda jami rasm hajmi
  shundan oshmasin; katta rasmlarni bittadan yuklang. Kompyuterda bu cheklov yoʻq.
- **Elektron pochta xabarlari, mijoz kabineti, buyurtmani kuzatish** hozircha yoʻq (talab qilinmagan).
- **Zaxira nusxa:** Neon bazani oʻzi saqlaydi, lekin muhim maʼlumotlar uchun zaxira rejasini Neon sozlamalarida
  tekshiring.
- **Kutubxonalardagi ogohlantirishlar (`npm audit`):** qolgan 5 ta ogohlantirish faqat qurish
  (build) vositalarida; mijoz soʻrovlari ishlaydigan kodga taʼsir qilmaydi. Ularni bartaraf etish
  Next.js'ni 16-versiyaga koʻtarishni talab qiladi (katta oʻzgarish), shuning uchun alohida, sinab koʻrib qilinadi.

---

## 9. Loyiha tuzilishi va foydali buyruqlar

```
src/app/(shop)/      mijoz sahifalari (bosh, katalog, mahsulot, savat, buyurtma, maslahatlar)
src/app/admin/       admin panel
src/app/api/         buyurtma, sharh, narx hisobi, Payme va Click qabul qiluvchilari
src/lib/             narx hisobi, toʻlovlar, Telegram, rasm saqlash, himoya
src/components/      umumiy qismlar (sarlavha, mahsulot kartochkasi, savat...)
prisma/              baza sxemasi (schema.prisma) va namunaviy maʼlumot (seed.ts)
docs/                qoʻshimcha qoʻllanmalar
scripts/             admin parolini sozlash
```

| Buyruq | Nima qiladi |
|---|---|
| `npm install` | kutubxonalarni oʻrnatadi |
| `npm run setup` | jadvallarni yaratadi va namunaviy maʼlumotlarni joylaydi |
| `npm run admin:setup -- "parol"` | admin parolini va sessiya kalitini `.env` ga yozadi |
| `npm run dev` | sayt kompyuterda ishlaydi (http://localhost:3000) |
| `npm run build` va `npm start` | ishlab chiqarish (production) rejimida tekshirish |
| `npm run lint` | kod tozaligini tekshiradi |
