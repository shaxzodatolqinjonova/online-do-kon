# Telegram bot va toʻlov tizimlarini ulash (oddiy tilda)

Bu qoʻllanma kod yozishni bilmaydiganlar uchun. Hamma kalitlar `.env` fayliga yoziladi
(serverda, masalan Vercel'da, "Environment Variables" boʻlimiga). Kalitlarni **hech kimga
yubormang va GitHub'ga joylamang**.

---

## 1. Telegram bot: yangi buyurtma sizning Telegram'ingizga kelishi uchun

Bu 5 daqiqalik ish va bepul.

### A) Bot yaratish va token olish
1. Telegram'da **@BotFather** ni qidirib toping (yonida koʻk galochka boʻladi) va oching.
2. `/newbot` deb yozing.
3. Bot nomini yozing (masalan: `miyov.uz buyurtmalar`).
4. Bot uchun foydalanuvchi nomi yozing. U `bot` bilan tugashi kerak (masalan: `miyovuz_buyurtma_bot`).
5. BotFather sizga uzun matn yuboradi. Ichidagi **token** (masalan `123456789:AAH...`) bu sizning kalitingiz.
   → `.env` faylida: `TELEGRAM_BOT_TOKEN="shu-yerga-token"`

### B) Chat ID ni topish (xabar qayerga kelishini bilish uchun)
1. Oʻzingiz yaratgan botni Telegram'da oching va **Start** bosing, unga istalgan soʻz yozing (masalan "salom").
2. Brauzerda quyidagi manzilni oching (`TOKEN` oʻrniga oʻz tokeningizni qoʻying):
   `https://api.telegram.org/botTOKEN/getUpdates`
3. Chiqqan matndan `"chat":{"id":123456789` qismini toping. Shu raqam **chat ID**.
   → `.env` faylida: `TELEGRAM_CHAT_ID="123456789"`

**Xabar guruhga kelsin desangiz:** botni guruhga qoʻshing, guruhda biror xabar yozing, yuqoridagi `getUpdates` ni qayta oching. Guruh ID si manfiy raqam boʻladi (masalan `-1001234567890`), shuni yozing.

### Tekshirish
Saytdan sinov buyurtma bering. Telegram'ga raqam, mijoz, telefon, manzil, mahsulotlar, summa, toʻlov usuli va holat bilan xabar kelishi kerak. Onlayn toʻlov muvaffaqiyatli boʻlsa, ikkinchi xabar ("✅ Toʻlov qabul qilindi") keladi.

---

## 2. Muhim: toʻlov tizimlari sizning saytingizga "qoʻngʻiroq qiladi"

Payme va Click toʻlov tugagach **sizning serveringizga** xabar yuboradi. Shuning uchun:
- sayt internetda, **https://** bilan ochiq boʻlishi kerak (Vercel'ga joylagandan keyin shunday boʻladi);
- `localhost` (oʻz kompyuteringiz) ga ular yeta olmaydi. Kompyuterda sinash uchun vaqtinchalik tunnel (masalan ngrok yoki Cloudflare Tunnel) kerak boʻladi, bu murakkabroq, shuning uchun toʻlovlarni birinchi navbatda serverga joylagandan keyin sinashni tavsiya qilaman.

`NEXT_PUBLIC_SITE_URL` ga saytingizning toʻliq manzilini yozing (masalan `https://miyov.uz`).

---

## 3. Payme

### Sizga kerak boʻladi
- Payme Business'da (business.payme.uz) **savdogar sifatida roʻyxatdan oʻtish** va shartnoma.
- Kabinetda **kassa (Merchant)** yaratish. U yerdan ikki narsa olasiz:
  - **Merchant ID** → `PAYME_MERCHANT_ID`
  - **Key (parol)** → `PAYME_KEY` (sinov uchun alohida **test kalit** beriladi)
- Kabinetda kassa sozlamalarida quyidagilarni kiriting:
  - **Endpoint URL:** `https://SIZNING-SAYT/api/payme`
  - **Hisob (account) maydoni:** nomi aynan `order_id`, turi raqam. Bizning kod buyurtma raqamini shu nom bilan kutadi.
- `PAYME_TEST="true"` sinov paytida (test.paycom.uz), haqiqiy pul olishda `"false"`.

### Kod nima qiladi
Payme 6 ta metodni chaqiradi (summani tekshirish, tranzaksiya yaratish, toʻlash, bekor qilish, holatni tekshirish, hisobot). Hammasi `/api/payme` da tayyor. Summani Payme **tiyinda** yuboradi, kod buni oʻzi soʻmga aylantiradi va buyurtma summasi bilan solishtiradi.

---

## 4. Click

### Sizga kerak boʻladi
- Click Merchant'da (merchant.click.uz) **savdogar sifatida roʻyxatdan oʻtish** va shartnoma, ulanish turi: **Shop API**.
- Kabinetdan quyidagilarni olasiz:
  - **service_id** → `CLICK_SERVICE_ID`
  - **merchant_id** → `CLICK_MERCHANT_ID`
  - **secret_key** → `CLICK_SECRET_KEY`
- Kabinetda **Prepare URL** va **Complete URL** ga ikkalasiga ham bir xil manzil yozing:
  `https://SIZNING-SAYT/api/click`
- Sinov rejimi qanday yoqilishini Click menejeridan soʻrang (men buni tasdiqlay olmadim).

### Kod nima qiladi
Click ikki bosqichda soʻrov yuboradi (Prepare va Complete). Kod imzoni (md5) tekshiradi, summani solishtiradi, bir buyurtma ikki marta toʻlanmasligini taʼminlaydi.

---

## 5. Uzum — hozircha ULANMAGAN

Uzum hujjatlarini men rasmiy manbadan topa olmadim (ular odatda shartnomadan keyin menejer orqali beriladi). Taxmin qilib yozsam, pulga tegishli xato chiqishi mumkin, shuning uchun oʻylab topmadim.

Sayt Uzum'siz toʻliq ishlaydi: Uzum tanlovi mijozga **koʻrinmaydi**.

**Uzum bilan shartnoma qilganingizda menejerdan soʻrang:**
1. Merchant API (toʻlovni qabul qilish) toʻliq hujjati.
2. Sinov (sandbox) muhiti manzili va test kalitlari.
3. Siz bergan "callback" manzilga qanday soʻrovlar yuborilishi (imzo qanday tekshiriladi).

Hujjat qoʻlingizga tushgach, uni menga yuboring, 15–20 daqiqada ulab beraman.

---

## 6. Qaysi usul mijozga koʻrinadi?

Onlayn toʻlov usuli mijozga **faqat ikki shart bajarilsa** koʻrinadi:
1. Admin panel → Sozlamalar → "Toʻlov usullari" da yoqilgan;
2. Kalitlari `.env` faylida toʻldirilgan.

Naqd pul (olganda) doim ishlaydi.

---

## 7. Bilib qoʻying

- **Toʻlanmagan onlayn buyurtma mahsulotni omborda ushlab turadi.** Mijoz toʻlamasa, Admin panelda buyurtmani "Bekor qilindi" qiling: mahsulot omborga qaytadi.
- Payme "toʻlovni qaytarish" soʻrasa va buyurtma hali joʻnatilmagan boʻlsa, kod buyurtmani avtomatik bekor qiladi va omborni qaytaradi. Buyurtma "Yoʻlda" yoki "Yetkazildi" boʻlsa, qaytarishni rad etadi (Payme'ga xato kodi -31007 beradi).
- **Soliq/fiskal chek:** Oʻzbekistonda onlayn toʻlovlarda fiskal maʼlumot yuborish talablari boʻlishi mumkin. Bu haqda Payme/Click menejeri va buxgalteringiz bilan maslahatlashing; hozirgi kodda fiskal maʼlumot yuborilmaydi.
- Toʻlov havolalari formati (Payme: `https://checkout.paycom.uz/<base64>`, Click: `https://my.click.uz/services/pay?...`) va Payme "vaqt" tekshiruvi menga rasmiy namunalar va xotiradan maʼlum. Rasmiy hujjat saytlari menga ochilmadi, shuning uchun **sinov rejimida birinchi toʻlovni albatta qoʻlda tekshiring**.
