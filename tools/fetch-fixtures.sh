#!/usr/bin/env bash
# Fixtures für die Tests laden: drei echte Entscheidseiten und eine
# API-Antwort nach test/fixtures/, dazu das Site-CSS der bger.ch-Seiten für
# den Browser-Smoke-Test. Danach läuft test/test-runner.js vollständig
# (ohne Fixtures wird Block [3] übersprungen) und test/browser-smoke.js kann
# die Seiten lokal ausliefern.
#
# Aufruf (aus dem Repo-Root):   tools/fetch-fixtures.sh
# Erneut laden (überschreiben): tools/fetch-fixtures.sh --force
#
# Bleibt ausser dem Download offline-tauglich: vorhandene Dateien werden
# ohne --force nicht erneut geladen (Cache).

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ZIEL_DIR="$REPO_ROOT/test/fixtures"
mkdir -p "$ZIEL_DIR"

FORCE=0
if [ "${1:-}" = "--force" ]; then FORCE=1; fi

UA="Mozilla/5.0 (Macintosh) bger-reader-addon Test-Fixtures"

# name|url|erwartetes Merkmal (muss im HTML vorkommen, sonst Fehler)
# bvger_test.json: bvger.weblaw.ch ist eine React-App, die Seite selbst ist
# eine leere Hülle. Der Entscheid (B-7296/2025) kommt aus der API der Site
# als JSON mit dem HTML im Feld "content" – genau das, was die App per
# innerHTML in die Seite setzt. Die Suite baut daraus die Seitenstruktur.
FIXTURES=(
  "bger_test.html|https://search.bger.ch/ext/eurospider/live/de/php/clir/http/index.php?highlight_docid=atf%3A%2F%2F152-IV-1%3Ade&lang=de&zoom=&type=show_document|class=\"paraatf\""
  "bger_aza.html|https://search.bger.ch/ext/eurospider/live/de/php/aza/http/index.php?type=show_document&highlight_docid=aza%3A%2F%2F24-09-2012-6F_7-2012|class=\"para\""
  "bger_relevancy.html|http://relevancy.bger.ch/php/clir/http/index.php?highlight_docid=atf%3A%2F%2F152-IV-1%3Ade&lang=de&type=show_document|class=\"paraatf\""
  "bvger_test.json|https://bvger.weblaw.ch/api/.netlify/functions/singleDocQueryService/8cf30437-5df2-4a0f-885e-d44a19472144?guiLanguage=de|\"content\":\"<html"
)

fehler=0
for eintrag in "${FIXTURES[@]}"; do
  name="${eintrag%%|*}"
  rest="${eintrag#*|}"
  url="${rest%%|*}"
  merkmal="${rest#*|}"
  ziel="$ZIEL_DIR/$name"

  if [ "$FORCE" = "0" ] && [ -f "$ziel" ]; then
    echo "  vorhanden, übersprungen: $name (--force zum erneuten Laden)"
    continue
  fi

  echo "  lade: $name"
  tmp="$ziel.tmp"
  if ! curl -sL --max-time 60 -A "$UA" -o "$tmp" "$url"; then
    echo "  FEHLER: Download fehlgeschlagen: $url" >&2
    rm -f "$tmp"
    fehler=1
    continue
  fi

  # Plausibilitätscheck: Error-Pages der Site kommen als 200 zurück,
  # enthalten aber keine Entscheidabsätze.
  if ! grep -q "$merkmal" "$tmp"; then
    echo "  FEHLER: '$merkmal' nicht gefunden in $name (Error-Page? URL geändert?)" >&2
    rm -f "$tmp"
    fehler=1
    continue
  fi

  mv "$tmp" "$ziel"
  echo "  ok: $name ($(du -k "$ziel" | cut -f1) KB)"
done

# Site-CSS der bger.ch-Seiten: test/browser-smoke.js liefert die Seiten lokal
# aus und braucht dazu ihr eigenes CSS (sonst erschienen sie ungestylt und die
# Kaskade Site-CSS gegen Extension-CSS bliebe ungeprüft). master.css importiert
# die vier anderen. Ablage wie bei test/render-check.js:
# test/fixtures/css/<familie>/<datei>.
CSS_FAMILIEN=(
  "clir|https://search.bger.ch/ext/eurospider/live/de/php/clir/http/css/"
  "relevancy|http://relevancy.bger.ch/php/clir/http/css/"
)
CSS_DATEIEN="master.css layout.css typography.css design.css highlight.css print.css"
for eintrag in "${CSS_FAMILIEN[@]}"; do
  familie="${eintrag%%|*}"
  basis="${eintrag#*|}"
  mkdir -p "$ZIEL_DIR/css/$familie"
  for datei in $CSS_DATEIEN; do
    ziel="$ZIEL_DIR/css/$familie/$datei"
    if [ "$FORCE" = "0" ] && [ -f "$ziel" ]; then continue; fi
    tmp="$ziel.tmp"
    # Error-Pages kommen als HTML mit 200 zurück – kein CSS.
    if curl -sL --max-time 60 -A "$UA" -o "$tmp" "$basis$datei" && ! grep -q -i "<html" "$tmp"; then
      mv "$tmp" "$ziel"
      echo "  ok: css/$familie/$datei"
    else
      echo "  FEHLER: CSS nicht ladbar: $basis$datei" >&2
      rm -f "$tmp"
      fehler=1
    fi
  done
done

if [ "$fehler" = "1" ]; then
  echo "" >&2
  echo "Mindestens eine Datei fehlt. Die Suite läuft trotzdem," >&2
  echo "überspringt aber Block [3]; der Smoke-Test braucht die Seiten." >&2
  exit 1
fi

echo ""
echo "Alle Fixtures bereit. Testlauf:  cd test && npm install jsdom@30.1.0 && node test-runner.js"
echo "Browser-Smoke-Test:              node test/browser-smoke.js chromium|firefox"
