#!/bin/bash
# 상자 앞면 그림을 png 로 굽는다 (검사 서버 3200 이 떠 있어야 한다)
#   bash roach/scripts/bake.sh
set -e
DIR="$(cd "$(dirname "$0")/.." && pwd)"
cp "$DIR/scripts/box.html" "$DIR/public/_box.html"
python - "$DIR/public/_box.html" <<'PY'
import io, sys
p = sys.argv[1]
t = io.open(p, encoding='utf-8').read()
t = t.replace('src="../public/shared/roach.js"', 'src="shared/roach.js"').replace('src="../public/js/cards.js"', 'src="js/cards.js"')
io.open(p, 'w', encoding='utf-8', newline='\n').write(t)
PY
"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --user-data-dir="$TEMP/bake$RANDOM" \
  --hide-scrollbars --window-size=900,900 --force-device-scale-factor=2 --virtual-time-budget=9000 \
  --screenshot="$(cygpath -w "$DIR/public/assets/box.png")" "http://127.0.0.1:3200/roach/_box.html" 2>/dev/null
rm -f "$DIR/public/_box.html"
echo "구웠습니다: public/assets/box.png"
