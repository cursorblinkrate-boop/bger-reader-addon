# Archiv – eingefrorener Stand, nicht mehr gepflegt

Dieses Verzeichnis enthält überholte Vorgängerstände. Sie liegen hier nur zur
Nachvollziehbarkeit. **Fehler werden hier nicht mehr behoben.**

## bger-reader.user.js (Userscript, Version 2.1.0)

Die ursprüngliche Tampermonkey-Fassung des Projekts, bevor daraus eine
Browser-Extension wurde. Abgelöst durch `extension/content.js`.

Der Stand weicht inhaltlich erheblich ab (rund 815 Zeilen Unterschied):

- **andere Einklapp-Heuristik** – Signal-Liste `LITERATUR_SIGNALE` plus
  Modus/Mindestlänge statt des heutigen festen Regelsatzes 1–6
- **kein Farbschema „Nacht"**, kein Seitenrahmen-Theming
- **keine gebündelten Schriften** (die WOFF2-Dateien kamen erst mit der
  Extension, die `runtime.getURL()` braucht)
- **keine Spaltenbreiten-Einstellung**, anderes Panel-Layout
- **kein `chrome.storage.local`** – nur `localStorage` der Seite

### Warum nicht einfach gelöscht?

Damit der Ursprung des Projekts sichtbar bleibt. Die Git-Historie enthält die
Datei ohnehin; dieses Verzeichnis macht sie nur ohne Git-Kenntnisse auffindbar.

### Warum nicht weiterpflegen?

Zwei Kopien derselben Logik laufen zwangsläufig auseinander. Die Gefahr ist
nicht theoretisch: Der Test-Runner fiel früher bei fehlender
`extension/content.js` stillschweigend auf diese Datei zurück und hätte dann
eine grüne Suite gemeldet, obwohl er das falsche Skript geprüft hat. Dieser
Fallback ist entfernt.

**Änderungen gehören ausschliesslich nach `extension/content.js`.**
