# miyov.uz ni oʻz VPS serveringizga joylash (oddiy tilda)

Bu yoʻl **Vercel'ga muqobil**. Afzalligi: oylik toʻlov qiymati belgilangan, rasmlar serverning oʻz
papkasida saqlanadi (Vercel Blob va 4,5 MB cheklov kerak emas), hamma narsa sizning nazoratingizda.
Kamchiligi: serverni (yangilash, zaxira nusxa) oʻzingiz kuzatasiz.

> **Muhim ogohlantirish.** Quyidagi skript Ubuntu uchun yozilgan va sintaksisi tekshirilgan,
> lekin men uni **haqiqiy serverda ishga tushira olmadim** (serveringizga kirish huquqim yoʻq).
> Shuning uchun ishni boshlashdan oldin hosting panelida serverning **"snapshot" (nusxa)** ini oling:
> nimadir xato ketsa, bir tugma bilan avvalgi holatga qaytarasiz.
> Xato chiqsa, terminaldagi matnni menga yuboring, tuzatamiz.
>
> **Parolni, SSH kalitini va `.env` ichidagi kalitlarni hech qachon suhbatga yoki chatga yozmang.**

Matndagi `SERVER_IP` oʻrniga oʻz serveringizning IP manzilini yozasiz.

---

## 0. Nimalar kerak
- Ubuntu 22.04 yoki 24.04 oʻrnatilgan VPS (kamida 1 GB xotira; 2 GB tavsiya etiladi, chunki sayt qurilishi xotira talab qiladi).
- Serverga kirish maʼlumotlari (IP, `root` paroli yoki SSH kalit) — hosting sizga bergan.
- `miyov.uz` domenini boshqarish huquqi (domen sotib olingan joyda).
- Pochta manzilingiz (HTTPS sertifikati uchun, ogohlantirishlar shunga keladi).

Server Ubuntu ekanini tekshirish (serverga kirgach): `lsb_release -a`

---

## 1. Domenni serverga ulang (DNS)
Domen sotib olingan saytga kiring → "DNS" yoki "DNS yozuvlari" boʻlimi → ikkita yozuv qoʻshing:

| Turi | Nomi (Host) | Qiymati |
|---|---|---|
| A | `@` (yoki boʻsh, yoki `miyov.uz`) | `SERVER_IP` |
| A | `www` | `SERVER_IP` |

Eski A yozuvlari boʻlsa, ularni oʻchiring yoki shu qiymatga almashtiring.
**Yangilanishi 5 daqiqadan bir necha soatgacha** olishi mumkin. Tekshirish (oʻz kompyuteringizda):
```
nslookup miyov.uz
```
Javobda `SERVER_IP` chiqsa, tayyor.

---

## 2. Serverga kiring
Windows: "PowerShell" ni oching. Mac: "Terminal".
```
ssh root@SERVER_IP
```
Birinchi marta "Are you sure you want to continue connecting?" deb soʻraydi, `yes` yozing.
Parolni kiritganda ekranda belgilar koʻrinmaydi, bu normal.

Tizimni yangilab oling (bir necha daqiqa):
```
apt-get update && apt-get -y upgrade
```

---

## 3. Kodni serverga joylang
Ikki yoʻldan birini tanlang.

### A) GitHub orqali (repozitoriy ochiq boʻlsa va kod `main` ga qoʻshilgan boʻlsa)
```
apt-get install -y git
git clone -b main https://github.com/shaxzodatolqinjonova/online-do-kon.git /opt/miyov
```
Bu yoʻl keyinchalik yangilashni osonlashtiradi (7-boʻlim).
Repozitoriy yopiq (private) boʻlsa, bu buyruq parol soʻraydi va ishlamasligi mumkin, u holda B yoʻlni tanlang.

### B) ZIP fayl orqali
1. Oʻz kompyuteringizda (serverda emas) ZIP joylashgan papkada terminal oching va yuboring:
   ```
   scp miyov-uz.zip root@SERVER_IP:/root/
   ```
   (Yoki WinSCP / FileZilla dasturi bilan faylni serverning `/root/` papkasiga tashlang.)
2. Serverda:
   ```
   apt-get install -y unzip
   unzip /root/miyov-uz.zip -d /opt
   mv /opt/miyov-uz /opt/miyov
   ```

Tekshirish: `ls /opt/miyov` — ichida `package.json`, `src`, `prisma` va boshqalar koʻrinishi kerak.

---

## 4. Oʻrnatish skriptini ishga tushiring
```
bash /opt/miyov/scripts/vps-setup.sh miyov.uz SIZNING@POCHTANGIZ
```
(`SIZNING@POCHTANGIZ` oʻrniga oʻz pochtangizni yozing.)

Skript sizdan faqat **admin panel parolini** soʻraydi (2 marta). Qolganini oʻzi bajaradi, taxminan 5–10 daqiqa:

1. kerakli dasturlarni oʻrnatadi (Node.js, PostgreSQL, nginx, HTTPS uchun certbot);
2. domen shu serverga qaraganini tekshiradi;
3. baza va alohida foydalanuvchi yaratadi, baza paroli tasodifiy;
4. parolingizni xeshlab saqlaydi;
5. saytni quradi, namunaviy 22 mahsulotni joylaydi;
6. saytni server qayta ishga tushganda ham avtomatik yoqiladigan qiladi;
7. nginx va **HTTPS** (bepul Let's Encrypt sertifikati) ni sozlaydi;
8. xavfsizlik devorini (faqat SSH va veb) yoqadi;
9. har kuni **zaxira nusxa** oladi (baza va rasmlar, 14 kun saqlanadi).

Oxirida "TAYYOR" yozuvi chiqadi.

---

## 5. Tekshiring
- https://miyov.uz — bosh sahifa ochilishi kerak.
- https://miyov.uz/admin — parolingiz bilan kiring.
- README'dagi **"Joylagandan keyin tekshiruv roʻyxati"** ni (6-boʻlim) bajaring.

---

## 6. Telegram va toʻlovlarni ulash
Kalitlar serverdagi `.env` faylida:
```
nano /opt/miyov/.env
```
Kerakli qatorlarni toʻldiring (qanday olish: [TOLOV-VA-TELEGRAM.md](TOLOV-VA-TELEGRAM.md)).
Saqlash: `Ctrl+O`, `Enter`, chiqish: `Ctrl+X`. Soʻng saytni qayta ishga tushiring:
```
systemctl restart miyov
```
Toʻlov kabinetlarida kiritiladigan manzillar:
- Payme "Endpoint URL": `https://miyov.uz/api/payme`
- Click "Prepare URL" va "Complete URL": `https://miyov.uz/api/click`

Google Search Console'da saytni qoʻshib, `https://miyov.uz/sitemap.xml` ni yuboring.

---

## 7. Saytni yangilash
**A yoʻli (git) bilan joylagan boʻlsangiz** (kod `main` ga qoʻshilgandan keyin), serverda bitta buyruq:
```
bash /opt/miyov/scripts/vps-update.sh
```
U avval zaxira oladi, soʻng yangi kodni tortadi, qaytadan quradi va qayta ishga tushiradi.
Admin paneldagi maʼlumotlar, rasmlar va `.env` oʻzgarmaydi.

**B yoʻli (ZIP) bilan boʻlsa:** yangi ZIP'ni serverga yuklab, `unzip` qiling, lekin `.env`,
`uploads` va `node_modules` ga tegmang. Shundan keyin:
```
cd /opt/miyov && sudo -u miyov npm ci && sudo -u miyov npx prisma db push && sudo -u miyov npm run build && systemctl restart miyov
```
(Bunday yangilash murakkabroq, shuning uchun A yoʻlini tavsiya qilaman.)

---

## 8. Zaxira nusxa
Har kuni soat 03:15 da avtomatik, `/var/backups/miyov/` papkaga yoziladi:
- `db-SANA.sql.gz`: butun baza (mahsulotlar, buyurtmalar, sharhlar);
- `uploads-SANA.tar.gz`: admin paneldan yuklangan rasmlar.

Qoʻlda olish: `/usr/local/bin/miyov-backup.sh`

**Muhim:** zaxira shu serverning oʻzida turadi. Server butunlay yoʻqolsa, u ham yoʻqoladi.
Vaqti-vaqti bilan `/var/backups/miyov/` ichidagi eng yangi fayllarni oʻz kompyuteringizga koʻchirib oling
(masalan `scp root@SERVER_IP:/var/backups/miyov/db-*.sql.gz .`) yoki hosting panelida avtomatik snapshot yoqing.

Bazani tiklash (ehtiyotkorlik bilan, hozirgi maʼlumot almashadi):
```
systemctl stop miyov
sudo -u postgres dropdb miyov && sudo -u postgres createdb -O miyov miyov
gunzip -c /var/backups/miyov/db-SANA.sql.gz | sudo -u postgres psql miyov
systemctl start miyov
```

---

## 9. Muammo boʻlsa
| Alomat | Nima qilish |
|---|---|
| Sayt ochilmaydi, "502 Bad Gateway" | `systemctl status miyov` va `journalctl -u miyov -n 50` ni koʻring; xato matnini yuboring |
| HTTPS olinmadi | Domen hali serverga qaramagan boʻlishi mumkin (1-boʻlim). Tayyor boʻlgach: `certbot --nginx -d miyov.uz -d www.miyov.uz -m POCHTA --agree-tos --redirect` |
| Skript "xotira yetishmadi" bilan toʻxtadi | Server xotirasi kam. Hosting panelidan xotirani oshiring yoki `swap` qoʻshing (menga yozing) |
| Rasm yuklanmayapti | nginx cheklovi 30 MB; rasm 5 MB dan kichik va JPG/PNG/WEBP/GIF ekanini tekshiring |
| Telegram xabari kelmayapti | `.env` da token va chat ID toʻgʻriligini, soʻng `systemctl restart miyov` ni tekshiring; `journalctl -u miyov -n 50` da `[telegram]` qatorlariga qarang |
| Parolni unutdim | `cd /opt/miyov && sudo -u miyov node scripts/admin-setup.mjs "YANGI-PAROL" && systemctl restart miyov` |

---

## 10. Server xavfsizligi (tavsiyalar)
- Hosting bergan `root` parolini **darhol almashtiring**: serverda `passwd`.
- Imkon boʻlsa, parol oʻrniga **SSH kalit** bilan kiring va parol bilan kirishni oʻchiring (menga yozing, koʻrsataman).
- Serverni vaqti-vaqti bilan yangilab turing: `apt-get update && apt-get -y upgrade`.
- `.env` faylini (`/opt/miyov/.env`) hech kimga yubormang; unda baza paroli va toʻlov kalitlari bor.
