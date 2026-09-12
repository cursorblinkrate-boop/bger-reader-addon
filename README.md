# BGE-Reader

**Ein Browser-Addon zum Lesen von Bundesgerichtsentscheinden.** 
**Accessibility layer for Swiss Federal Supreme Court decisions**



## Unterstützte Seiten

| Seite | Inhalt | Absatz-Klassen |
|---|---|---|
| `search.bger.ch/…/clir/…` | BGE (amtliche Sammlung) | `div.paraatf` |
| `search.bger.ch/…/aza/…` | Weitere Urteile ab 2000 | `div.para` |
| `relevancy.bger.ch/…/clir/…` | ältere BGE-Ansicht | `div.paraatf` |



--- *work in progress*


## *naked*
<img width="816" height="941" alt="naked" src="https://github.com/user-attachments/assets/4ffec15f-a941-4a63-aa73-fd9b71125062" />

## *view references*
<img width="1332" height="832" alt="3_auf" src="https://github.com/user-attachments/assets/33a28668-8232-40c8-9865-70fe680bb06f" />

## *hide references*
<img width="1334" height="942" alt="1_closed" src="https://github.com/user-attachments/assets/a3585080-3d2f-4302-a2cb-b4f817e4561d" />
<img width="1005" height="684" alt="3_zu" src="https://github.com/user-attachments/assets/5045d4a8-147f-4b56-b79f-3090543b388c" />

## *easy mode*
<img width="1325" height="931" alt="2_zu" src="https://github.com/user-attachments/assets/2c29d089-55d0-45c1-90e7-c712d80a18e7" />
--- *work in progress*


### Anleitung - BROWSER ADDON NEXT!!

Das winzige Skript läuft über die kostenlose Browser-Erweiterung **Tampermonkey**
(Firefox, Chrome, Edge, Brave).


### Variante A: BROWSER ADDON NEXT!!

1. **Tampermonkey installieren:**
   - Firefox: https://addons.mozilla.org/de/firefox/addon/tampermonkey/
   - Chrome/Edge/Brave: https://www.tampermonkey.net/
2. Tampermonkey-Symbol in der Symbolleiste anklicken → **„Neues Skript erstellen“**
3. Vorlage löschen und den Inhalt von [`bger-reader.user.js`](bger-reader.user.js) einfügen
4. **Strg+S** / **Cmd+S** – fertig!






## Features (geplant)
- 🔤 Typografie: Schriftgrösse, Schriftart (Serif/Sans), Schriftstärke, Zeilenabstand, Buchstaben- und Wortabstand, maximale Zeilenlänge
- ↔️ **Spaltenbreite einstellbar** (die Textkolonne zwischen den Haarlinien, Standard 625 px)
- ✂️ Silbentrennung (Sprache der Seite wird respektiert)
- 🎨 Farbschemata: Weiss, Sepia, Dunkel, Hoher Kontrast
- 📚 **Literaturklammern einklappbar** – zwei Modi:
  - wahrscheinliche Literaturhinweise* (Standard, konservative Heuristik: `S. 123`, `Rz. 45`, `in:`, `BGE/ATF …`, Autoren-Mehrfachnennungen, `ff.`)
  - *Alle Klammern ab Mindestlänge* (streng formal, Mindestlänge einstellbar)
- 🔗 **Links und Formatierungen innerhalb der Klammern bleiben erhalten** (Range-basiertes Einklappen, kein `innerHTML`-Parsing)
- ♿ Barrierearm: echte Buttons mit `aria-expanded` und Tastaturbedienung, sichtbarer Fokus, Disclosure-Pattern (W3C APG)
- 🖨️ Beim Drucken wird immer der vollständige Text angezeigt
- 💾 Einstellungen lokal gespeichert (`localStorage`) – kein Server, kein Tracking, keine externen Schriftarten
- 🧩 Panel in einem **Shadow DOM** – das Seiten-CSS kann es nicht zerstören (und umgekehrt)







## Lizenz

[MIT](LICENSE) – frei verwendbar und weitergebbar.
