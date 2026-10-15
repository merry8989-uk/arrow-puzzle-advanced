#!/usr/bin/env bash
# Gradle-less APK build using only the Android SDK build-tools.
# Requires: JDK 17 on PATH, ANDROID_HOME pointing at an SDK with
# platform android-34 + build-tools 34.0.0 + platform-tools.
#
#   ANDROID_HOME=/path/to/sdk bash tools/build-apk.sh
#
set -euo pipefail

: "${ANDROID_HOME:?set ANDROID_HOME to your Android SDK path}"
BT="${ANDROID_BUILD_TOOLS:-$ANDROID_HOME/build-tools/34.0.0}"
AJAR="$ANDROID_HOME/platforms/android-34/android.jar"
REPO="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$REPO/build-manual"
APK_NAME="ArrowPuzzleAdvanced-5.6.apk"
rm -rf "$OUT"; mkdir -p "$OUT/gen" "$OUT/classes" "$OUT/dex"

echo "[1/6] aapt2 compile"
"$BT/aapt2" compile --dir "$REPO/app/src/main/res" -o "$OUT/res.zip"

echo "[2/6] aapt2 link"
# aapt2 standalone needs a package= attribute (AGP supplies it via namespace),
# so build from a patched copy of the manifest.
python3 - "$REPO/app/src/main/AndroidManifest.xml" "$OUT/AndroidManifest.xml" <<'PY'
import sys, re
t = open(sys.argv[1], encoding="utf-8").read()
t = re.sub(r'<manifest\b', '<manifest package="com.arrowpuzzle.advanced"', t, count=1)
open(sys.argv[2], "w", encoding="utf-8").write(t)
PY
"$BT/aapt2" link -o "$OUT/base.apk" -I "$AJAR" \
  --manifest "$OUT/AndroidManifest.xml" \
  -A "$REPO/app/src/main/assets" --java "$OUT/gen" \
  --min-sdk-version 24 --target-sdk-version 34 \
  --version-code 14 --version-name "5.6" "$OUT/res.zip"

echo "[3/6] javac"
javac -source 17 -target 17 -encoding UTF-8 -nowarn -Xlint:-options \
  -classpath "$AJAR" -d "$OUT/classes" \
  $(find "$REPO/app/src/main/java" -name '*.java') $(find "$OUT/gen" -name '*.java')

echo "[4/6] d8"
"$BT/d8" --lib "$AJAR" --min-api 24 --output "$OUT/dex" $(find "$OUT/classes" -name '*.class')

echo "[5/6] package classes.dex"
python3 - "$OUT" <<'PY'
import sys, os, zipfile
out = sys.argv[1]
with zipfile.ZipFile(os.path.join(out, "base.apk"), "a", zipfile.ZIP_DEFLATED) as z:
    z.write(os.path.join(out, "dex", "classes.dex"), "classes.dex")
PY

echo "[6/6] zipalign + sign"
"$BT/zipalign" -f -p 4 "$OUT/base.apk" "$OUT/aligned.apk"
KS="${APA_KEYSTORE:-$OUT/apa-release.jks}"
if [ ! -f "$KS" ]; then
  keytool -genkeypair -keystore "$KS" -alias apa -keyalg RSA -keysize 2048 \
    -validity 10000 -storepass android -keypass android \
    -dname "CN=Arrow Puzzle Advanced,O=Arrow Puzzle Advanced,C=IN"
fi
"$BT/apksigner" sign --ks "$KS" --ks-pass pass:android --key-pass pass:android \
  --out "$OUT/$APK_NAME" "$OUT/aligned.apk"
"$BT/apksigner" verify "$OUT/$APK_NAME"
echo "Built: $OUT/$APK_NAME"
