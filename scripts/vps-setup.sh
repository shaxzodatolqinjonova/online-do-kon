#!/usr/bin/env bash
# miyov.uz ni Ubuntu VPS'ga bir marta oʻrnatadi: Node.js, PostgreSQL, nginx, HTTPS, avtomatik ishga tushish, zaxira nusxa.
#
# Ishlatish (serverda, root sifatida):
#   bash vps-setup.sh miyov.uz sizning@pochtangiz.uz
#
# Talab: Ubuntu 22.04 yoki 24.04; domen A yozuvi shu serverga qaragan; kod /opt/miyov papkada turibdi
# (qoʻllanmaga qarang: docs/VPS-JOYLASH.md).
set -euo pipefail

DOMAIN="${1:-}"
EMAIL="${2:-}"
APP_DIR="/opt/miyov"
APP_USER="miyov"
DB_NAME="miyov"
DB_USER="miyov"

[ "$(id -u)" -eq 0 ] || { echo "XATO: root sifatida ishga tushiring (sudo bash $0 ...)"; exit 1; }
[ -n "$DOMAIN" ] && [ -n "$EMAIL" ] || { echo "Ishlatish: bash $0 DOMEN POCHTA   (masalan: bash $0 miyov.uz men@mail.uz)"; exit 1; }
[ -f "$APP_DIR/package.json" ] || { echo "XATO: $APP_DIR ichida loyiha yoʻq. Avval kodni shu papkaga joylang (docs/VPS-JOYLASH.md, 3-qadam)."; exit 1; }
grep -qi "ubuntu" /etc/os-release || { echo "XATO: bu skript Ubuntu uchun yozilgan."; exit 1; }

say() { printf '\n\033[1;35m== %s\033[0m\n' "$*"; }

say "1/9 Tizim paketlari"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y curl ca-certificates gnupg git nginx postgresql ufw certbot python3-certbot-nginx dnsutils openssl

say "2/9 Node.js 22"
if ! command -v node >/dev/null || [ "$(node -v | cut -d. -f1 | tr -d v)" -lt 20 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
node -v

say "3/9 Domen shu serverga qaraganmi?"
SERVER_IP="$(curl -fsS https://api.ipify.org || true)"
DOMAIN_IP="$(dig +short "$DOMAIN" A | tail -n1 || true)"
echo "Server IP: ${SERVER_IP:-nomaʼlum}   |   $DOMAIN -> ${DOMAIN_IP:-topilmadi}"
if [ -n "$SERVER_IP" ] && [ "$SERVER_IP" != "$DOMAIN_IP" ]; then
  echo "OGOHLANTIRISH: domen hali bu serverga qaramaydi. HTTPS olish (9-qadam) xato berishi mumkin."
  echo "Domen sozlamalarida A yozuvini $SERVER_IP ga qoʻying va bir necha daqiqa kuting."
  read -r -p "Baribir davom etaymi? [y/N] " yn; [[ "$yn" =~ ^[Yy]$ ]] || exit 1
fi

say "4/9 Foydalanuvchi va baza"
id "$APP_USER" >/dev/null 2>&1 || useradd --system --create-home --home-dir "/home/$APP_USER" --shell /bin/bash "$APP_USER"
chown -R "$APP_USER:$APP_USER" "$APP_DIR"
ENV_FILE="$APP_DIR/.env"
if [ ! -f "$ENV_FILE" ]; then
  DB_PASS="$(openssl rand -hex 16)"
  sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL
DO \$\$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '$DB_USER') THEN CREATE ROLE $DB_USER LOGIN PASSWORD '$DB_PASS'; END IF;
END \$\$;
SQL
  sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1 || sudo -u postgres createdb -O "$DB_USER" "$DB_NAME"
  cat > "$ENV_FILE" <<ENV
DATABASE_URL="postgresql://$DB_USER:$DB_PASS@127.0.0.1:5432/$DB_NAME"
NEXT_PUBLIC_SITE_URL="https://$DOMAIN"
TELEGRAM_BOT_TOKEN=""
TELEGRAM_CHAT_ID=""
PAYME_MERCHANT_ID=""
PAYME_KEY=""
PAYME_LOGIN="Paycom"
PAYME_TEST="true"
CLICK_SERVICE_ID=""
CLICK_MERCHANT_ID=""
CLICK_SECRET_KEY=""
ENV
  chown "$APP_USER:$APP_USER" "$ENV_FILE"; chmod 600 "$ENV_FILE"
  echo ".env yaratildi (baza paroli tasodifiy, faqat shu faylda)."
else
  echo ".env allaqachon bor, tegmayman."
fi

say "5/9 Admin paroli"
if ! grep -q '^ADMIN_PASSWORD_HASH="s1\.' "$ENV_FILE"; then
  while true; do
    read -r -s -p "Admin panel uchun parol tanlang (kamida 8 belgi): " P1; echo
    read -r -s -p "Parolni takrorlang: " P2; echo
    [ "$P1" = "$P2" ] && [ "${#P1}" -ge 8 ] && break
    echo "Parollar mos kelmadi yoki juda qisqa. Qayta urining."
  done
  (cd "$APP_DIR" && sudo -u "$APP_USER" env ADMIN_PASSWORD="$P1" node scripts/admin-setup.mjs >/dev/null)
  unset P1 P2
  echo "Parol xeshlanib .env ga yozildi."
else
  echo "Admin paroli allaqachon sozlangan."
fi

say "6/9 Kutubxonalar, baza jadvallari va qurish (bir necha daqiqa)"
cd "$APP_DIR"
sudo -u "$APP_USER" npm ci
if [ "$(sudo -u postgres psql -d "$DB_NAME" -Atc "select to_regclass('public.\"Product\"') is not null")" = "t" ]; then
  sudo -u "$APP_USER" npx prisma db push            # baza bor: faqat sxemani yangilaydi
else
  sudo -u "$APP_USER" npm run setup                  # birinchi marta: jadvallar + namunaviy maʼlumot
fi
sudo -u "$APP_USER" npm run build

say "7/9 Avtomatik ishga tushish (systemd)"
cat > /etc/systemd/system/miyov.service <<UNIT
[Unit]
Description=miyov.uz
After=network.target postgresql.service

[Service]
User=$APP_USER
WorkingDirectory=$APP_DIR
Environment=NODE_ENV=production
ExecStart=$(command -v npm) run start -- -p 3000 -H 127.0.0.1
Restart=always
RestartSec=3
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl enable --now miyov
systemctl restart miyov

say "8/9 nginx"
cat > /etc/nginx/sites-available/miyov <<NGINX
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;

    client_max_body_size 30m;   # admin paneldan rasm yuklash uchun

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        # mijoz oʻzi yuborgan X-Forwarded-For ni oʻchirib, haqiqiy IP ni yozamiz (spamdan himoya aldanmasligi uchun)
        proxy_set_header X-Forwarded-For \$remote_addr;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
NGINX
ln -sf /etc/nginx/sites-available/miyov /etc/nginx/sites-enabled/miyov
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

ufw allow OpenSSH >/dev/null
ufw allow "Nginx Full" >/dev/null
ufw --force enable >/dev/null

say "9/9 HTTPS (Let's Encrypt) va zaxira nusxa"
if certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos -m "$EMAIL" --redirect; then
  echo "HTTPS yoqildi."
else
  echo "OGOHLANTIRISH: HTTPS olinmadi (odatda domen hali serverga qaramaydi). Keyin qayta urining:"
  echo "  certbot --nginx -d $DOMAIN -d www.$DOMAIN -m $EMAIL --agree-tos --redirect"
fi

cat > /usr/local/bin/miyov-backup.sh <<BACKUP
#!/usr/bin/env bash
# Har kuni baza va yuklangan rasmlarning zaxira nusxasini oladi, 14 kundan eskisini oʻchiradi
set -euo pipefail
D=/var/backups/miyov; mkdir -p "\$D"; chmod 700 "\$D"
STAMP=\$(date +%Y%m%d-%H%M)
sudo -u postgres pg_dump $DB_NAME | gzip > "\$D/db-\$STAMP.sql.gz"
[ -d $APP_DIR/uploads ] && tar -czf "\$D/uploads-\$STAMP.tar.gz" -C $APP_DIR uploads || true
find "\$D" -type f -mtime +14 -delete
BACKUP
chmod +x /usr/local/bin/miyov-backup.sh
echo "15 3 * * * root /usr/local/bin/miyov-backup.sh" > /etc/cron.d/miyov-backup

say "TAYYOR"
echo "Sayt:   https://$DOMAIN"
echo "Admin:  https://$DOMAIN/admin"
echo "Sozlamalar fayli: $ENV_FILE  (oʻzgartirgach: systemctl restart miyov)"
echo "Holatni koʻrish: systemctl status miyov   |   Jurnal: journalctl -u miyov -n 50"
