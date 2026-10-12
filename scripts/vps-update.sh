#!/usr/bin/env bash
# Saytni yangi koddan yangilaydi (git orqali joylagan boʻlsangiz).
# Ishlatish (serverda, root sifatida):  bash /opt/miyov/scripts/vps-update.sh
set -euo pipefail
APP_DIR="/opt/miyov"; APP_USER="miyov"
cd "$APP_DIR"
/usr/local/bin/miyov-backup.sh                      # yangilashdan oldin zaxira
sudo -u "$APP_USER" git pull --ff-only origin main
sudo -u "$APP_USER" npm ci
sudo -u "$APP_USER" npx prisma db push              # faqat sxemani yangilaydi; namunaviy maʼlumot qayta joylanmaydi
sudo -u "$APP_USER" npm run build
systemctl restart miyov
echo "Yangilandi. Holat:"; systemctl --no-pager status miyov | head -n 5
