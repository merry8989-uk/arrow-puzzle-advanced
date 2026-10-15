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
APK_NAME="ArrowPuzzleAdvanced-5.5.apk"
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
  --version-code 13 --version-name "5.5" "$OUT/res.zip"

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
# --- signing ---------------------------------------------------------------
# The release keystore is NOT kept in the repo. Supply it one of two ways:
#   local build :  APA_KEYSTORE=/path/to/apa-release.jks
#   CI          :  APA_KEYSTORE_BASE64="$(base64 -w0 apa-release.jks)"
# Credentials come from APA_KEYSTORE_PASSWORD / APA_KEY_PASSWORD / APA_KEY_ALIAS
# (defaults: password "android", alias "apa").
KS="${APA_KEYSTORE:-}"
if [ -z "$KS" ] && [ -n "${APA_KEYSTORE_BASE64:-}" ]; then
  KS="$OUT/apa-release.jks"
  printf '%s' "$APA_KEYSTORE_BASE64" | base64 -d > "$KS"
fi
if [ -z "$KS" ] || [ ! -f "$KS" ]; then
  echo "ERROR: no signing keystore found." >&2
  echo "  Local build: APA_KEYSTORE=/path/to/apa-release.jks bash tools/build-apk.sh" >&2
  echo "  CI:          set APA_KEYSTORE_BASE64 from a secret. See README > Signing." >&2
  exit 1
fi
STOREPASS="${APA_KEYSTORE_PASSWORD:-android}"
KEYPASS="${APA_KEY_PASSWORD:-$STOREPASS}"
KEYALIAS="${APA_KEY_ALIAS:-apa}"
"$BT/apksigner" sign --ks "$KS" --ks-key-alias "$KEYALIAS" \
  --ks-pass "pass:$STOREPASS" --key-pass "pass:$KEYPASS" \
  --out "$OUT/$APK_NAME" "$OUT/aligned.apk"
"$BT/apksigner" verify "$OUT/$APK_NAME"
echo "Built: $OUT/$APK_NAME"
