#!/usr/bin/env bash
# Baut das Paket für den Web Store aus extension/ und benennt es nach der
# Version im Manifest. Damit trägt jede Datei ihre Version im Namen – im
# Downloadordner, im Backup und im Store ist immer erkennbar, was drin ist.
#
# Aufruf (aus dem Repo-Wurzelverzeichnis):   bash tools/release.sh
#
# Ergebnis:  dist/bger-reader-<version>.zip  plus Prüfsumme
# Läuft auf macOS und Linux.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Grenze, die das Paket nicht überschreiten darf.
LIMIT_KB=1023

VERSION="$(node tools/version.js)"
ZIEL_DIR="$ROOT/dist"
ZIEL="$ZIEL_DIR/bger-reader-$VERSION.zip"

echo "BGer Reader – Paket bauen"
echo "  Version aus extension/manifest.json: $VERSION"
echo ""

# 1. Nichts ausliefern, was nicht geprüft ist.
echo "  [1/4] Test-Suite"
if ! node test/test-runner.js > /tmp/bger-release-tests.log 2>&1; then
  echo "        ABBRUCH: Die Suite ist nicht grün." >&2
  tail -5 /tmp/bger-release-tests.log >&2
  exit 1
fi
tail -1 /tmp/bger-release-tests.log | sed 's/^/        /'

# 2. Syntaxprüfung des ausgelieferten Skripts.
echo "  [2/4] Syntaxprüfung extension/content.js"
node --check extension/content.js
echo "        in Ordnung"

# 3. Paket bauen – ausschliesslich aus extension/.
#    tools/, test/, archiv/ und die Dokumentation kommen NICHT mit.
echo "  [3/4] ZIP bauen"
mkdir -p "$ZIEL_DIR"
rm -f "$ZIEL"
( cd extension && zip -qr "$ZIEL" . -x '.*' -x '__MACOSX/*' -x '*/.DS_Store' )

# 4. Grösse prüfen und Prüfsumme bilden.
echo "  [4/4] Grösse und Prüfsumme"
if stat -f%z "$ZIEL" >/dev/null 2>&1; then
  BYTES=$(stat -f%z "$ZIEL")      # macOS
else
  BYTES=$(stat -c%s "$ZIEL")      # Linux
fi
KB=$(( (BYTES + 1023) / 1024 ))

if command -v shasum >/dev/null 2>&1; then
  SUMME=$(shasum -a 256 "$ZIEL" | cut -c1-16)   # macOS
else
  SUMME=$(sha256sum "$ZIEL" | cut -c1-16)       # Linux
fi

echo ""
echo "  Datei:     dist/bger-reader-$VERSION.zip"
echo "  Grösse:    $KB KB von $LIMIT_KB KB erlaubt"
echo "  Prüfsumme: $SUMME  (SHA-256, gekürzt)"

if [ "$KB" -gt "$LIMIT_KB" ]; then
  echo ""
  echo "  ABBRUCH: Das Paket ist grösser als $LIMIT_KB KB." >&2
  rm -f "$ZIEL"
  exit 1
fi

echo ""
echo "Fertig. Die Prüfsumme identifiziert diese Datei eindeutig:"
echo "zwei Kopien mit gleicher Prüfsumme sind identisch, sonst nicht."
