#!/usr/bin/env bash
# Pakai: ./tools/set-instagram.sh username_baru   (tanpa @)
set -e; NEW="$1"; OLD="rekaloka.id"
[ -z "$NEW" ] && { echo "Pakai: $0 username_instagram"; exit 1; }
for f in index.html faq-data.js js/faq-i18n.js; do
  sed -i "s#instagram\.com/$OLD/#instagram.com/$NEW/#g; s#@$OLD\([^@A-Za-z0-9._]\|\$\)#@$NEW\1#g" "$f"
done
echo "Instagram diubah ke @$NEW"
