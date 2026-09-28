#!/usr/bin/env bash
# SPDX-License-Identifier: GPL-3.0-only
# Copyright (C) 2026 Stephanie Blaettler

# Fixtures für die Tests laden: echte Entscheidseiten und eine API-Antwort
# nach test/fixtures/, dazu das Site-CSS der bger.ch-Seiten für den
# Browser-Smoke-Test und die Screenshots. Danach läuft test/test-runner.js vollständig
# (ohne Fixtures wird Block [3] übersprungen) und test/browser-smoke.js kann
# die Seiten lokal ausliefern.
#
# Aufruf (aus dem Repo-Root):   tools/fetch-fixtures.sh
# Erneut laden (überschreiben): tools/fetch-fixtures.sh --force
#
# Bleibt ausser dem Download offline-tauglich: vorhandene Dateien werden
# ohne --force nicht erneut geladen (Cache). In der CI lädt nur der Job
# "fixtures" (einmal je Lauf), alle anderen bekommen die Dateien von ihm –
# die Site wird geschont, und ein Aussetzer trifft nicht sieben Jobs zugleich.
#
# Pflicht und optional: die drei BGE-Seiten (Suite, Smoke-Test, Screenshots)
# und die BVGer-Antwort sind Pflicht – fehlen sie, endet das Skript mit 1.
# bger_aza.html ist optional: search.bger.ch steht hinter einem Bot-Schutz
# (Imperva), der für den aza-Pfad auch einem ehrlichen curl mit Pause
# wiederholt eine Schutzseite statt des Entscheids liefert (CI-Lauf 94 vom
# 28.09.2026: sechs von sieben Jobs; von Hand geprüft: dreimal in Folge).
# Fehlt sie, laufen Suite und Baseline ohne die aza-Prüfung (Hinweis im
# Log), der nächste Lauf versucht es erneut.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ZIEL_DIR="$REPO_ROOT/test/fixtures"
mkdir -p "$ZIEL_DIR"

FORCE=0
if [ "${1:-}" = "--force" ]; then FORCE=1; fi

UA="Mozilla/5.0 (Macintosh) bger-reader-addon Test-Fixtures"

# Eine Datei holen: bis zu drei Anläufe mit Pause. curl wiederholt darin
# selbst bei Netzfehlern (--retry); die Schleife fängt den anderen Fall: die
# Site antwortet mit 200, aber mit einer Fehler- oder Schutzseite statt des
# Entscheids. Die Prüfung übergibt der Aufrufer als Funktionsname; schlägt
# sie fehl, zeigt das Log den Anfang der Antwort, damit erkennbar ist, was
# die Site geschickt hat.
GELADEN=0
lade() {
  local url="$1" tmp="$2" pruefung="$3" versuch
  for versuch in 1 2 3; do
    if curl -sL --max-time 60 --retry 3 --retry-delay 5 --retry-all-errors -A "$UA" -o "$tmp" "$url" && "$pruefung" "$tmp"; then
      GELADEN=1
      return 0
    fi
    echo "  Versuch $versuch fehlgeschlagen: $url" >&2
    if [ -s "$tmp" ]; then
      echo "  Antwort beginnt mit: $(head -c 200 "$tmp" | tr -d '\r\n' | tr -s ' ')" >&2
    fi
    rm -f "$tmp"
    if [ "$versuch" -lt 3 ]; then sleep 10; fi
  done
  return 1
}
# Plausibilität: Error-Pages der Site kommen als 200 zurück, enthalten aber
# keine Entscheidabsätze (MERKMAL je Eintrag unten); CSS darf kein HTML sein.
MERKMAL=""
pruefe_merkmal() { grep -q "$MERKMAL" "$1"; }
pruefe_css() { ! grep -q -i "<html" "$1"; }

# name|url|erwartetes Merkmal (muss im HTML vorkommen, sonst Fehler)|pflicht oder optional
# bvger_test.json: bvger.weblaw.ch ist eine React-App, die Seite selbst ist
# eine leere Hülle. Der Entscheid (B-7296/2025) kommt aus der API der Site
# als JSON mit dem HTML im Feld "content" – genau das, was die App per
# innerHTML in die Seite setzt. Die Suite baut daraus die Seitenstruktur.
FIXTURES=(
  "bger_aza.html|https://search.bger.ch/ext/eurospider/live/de/php/aza/http/index.php?type=show_document&highlight_docid=aza%3A%2F%2F24-09-2012-6F_7-2012|class=\"para\"|optional"
  # BGE 116 Ia 359 (Frauenstimmrecht Appenzell Innerrhoden, 1990): der
  # Beispiel-Entscheid für die Suite, Smoke-Test-Bilder und Screenshots (Store, Doku).
  "bger_frauenstimmrecht.html|https://search.bger.ch/ext/eurospider/live/de/php/clir/http/index.php?highlight_docid=atf%3A%2F%2F116-IA-359%3Ade&lang=de&type=show_document|class=\"paraatf\"|pflicht"
  "bger_frauenstimmrecht_relevancy.html|http://relevancy.bger.ch/php/clir/http/index.php?highlight_docid=atf%3A%2F%2F116-IA-359%3Ade&lang=de&type=show_document|class=\"paraatf\"|pflicht"
  # BGE 145 I 207 (Aufhebung der Abstimmung über die Heiratsstrafe-Initiative,
  # 2019): französischsprachiger Entscheid auf der französischen Oberfläche
  # (Pfad live/fr, docid :fr) – Screenshots einer französischen Seite.
  "bger_heiratsstrafe_fr.html|https://search.bger.ch/ext/eurospider/live/fr/php/clir/http/index.php?highlight_docid=atf%3A%2F%2F145-I-207%3Afr&lang=fr&type=show_document|class=\"paraatf\"|pflicht"
  "bvger_test.json|https://bvger.weblaw.ch/api/.netlify/functions/singleDocQueryService/8cf30437-5df2-4a0f-885e-d44a19472144?guiLanguage=de|\"content\":\"<html|pflicht"
)

fehler=0
fehlend_optional=""
for eintrag in "${FIXTURES[@]}"; do
  name="${eintrag%%|*}"
  rest="${eintrag#*|}"
  url="${rest%%|*}"
  rest="${rest#*|}"
  MERKMAL="${rest%%|*}"
  art="${rest#*|}"
  ziel="$ZIEL_DIR/$name"

  if [ "$FORCE" = "0" ] && [ -f "$ziel" ]; then
    echo "  vorhanden, übersprungen: $name (--force zum erneuten Laden)"
    continue
  fi

  echo "  lade: $name"
  tmp="$ziel.tmp"
  if ! lade "$url" "$tmp" pruefe_merkmal; then
    if [ "$art" = "optional" ]; then
      echo "  HINWEIS: $name nicht geladen (optional; Suite und Baseline überspringen sie, nächster Lauf versucht es erneut)" >&2
      fehlend_optional="$fehlend_optional $name"
    else
      echo "  FEHLER: $name nicht geladen oder '$MERKMAL' nicht darin (Error-Page? URL geändert?)" >&2
      fehler=1
    fi
    continue
  fi

  mv "$tmp" "$ziel"
  echo "  ok: $name ($(du -k "$ziel" | cut -f1) KB)"
done

# Site-CSS der bger.ch-Seiten: test/browser-smoke.js liefert die Seiten lokal
# aus und braucht dazu ihr eigenes CSS (sonst erschienen sie ungestylt und die
# Kaskade Site-CSS gegen Extension-CSS bliebe ungeprüft). master.css importiert
# die vier anderen. Ablage:
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
    if lade "$basis$datei" "$tmp" pruefe_css; then
      mv "$tmp" "$ziel"
      echo "  ok: css/$familie/$datei"
    else
      echo "  FEHLER: CSS nicht ladbar: $basis$datei" >&2
      fehler=1
    fi
  done
done

# Für die CI (release.yml, Job "fixtures"): ob etwas neu geladen wurde – nur
# dann lohnt ein neuer Cache-Stand.
if [ -n "${GITHUB_OUTPUT:-}" ]; then
  echo "geladen=$([ "$GELADEN" = "1" ] && echo true || echo false)" >> "$GITHUB_OUTPUT"
fi

if [ "$fehler" = "1" ]; then
  echo "" >&2
  echo "Mindestens eine Pflichtdatei fehlt. Die Suite läuft trotzdem," >&2
  echo "überspringt aber Block [3]; der Smoke-Test braucht die Seiten." >&2
  exit 1
fi

echo ""
if [ -n "$fehlend_optional" ]; then
  echo "Pflicht-Fixtures bereit; optional fehlt:$fehlend_optional (die Suite überspringt die betroffene Prüfung)."
else
  echo "Alle Fixtures bereit."
fi
echo "Testlauf:            (cd test && npm ci) && node test/test-runner.js"
echo "Browser-Smoke-Test:  node test/browser-smoke.js chromium|firefox"
