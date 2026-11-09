# Erasmus-Bierverkostung

Statische Website für eine Bierverkostung: Alle bewerten die Biere auf dem eigenen Handy, die Ergebnisse werden zu einer Gruppenwertung zusammengeführt. Kein Server nötig, funktioniert offline (Web-App mit Service Worker).

## Dateien
- `config.js`: Titel, Datum, optionaler Live-Modus (Firebase-URL, Raumname).
- `app.js`: alle Texte und Funktionen. `index.html`: Design.
- `qr.js`: QR-Code-Generator (nach Project Nayuki, MIT-Lizenz).
- `sw.js`: Offline-Speicher. Nach Änderungen die Versionsnummer in `CACHE` erhöhen.
- `fonts/`: Oswald, Source Sans 3 (SIL Open Font License, über Google Fonts).

## Funktionen
- Biere eintragen mit Land, Stil, Alkoholgehalt, „mitgebracht von“ und Foto.
- Bewertung: Farbe auf der SRM-Farbskala, Schaum, Klarheit, sechs Kategorien mit 1 bis 5 Krügen (zweimal tippen für halbe Punkte), Aromen, Notiz. Gewichteter Gesamtwert.
- Blindmodus: Namen verdeckt bis zur Bewertung, Alkohol schätzen.
- Eigenes Ranking mit Podest, Kategoriesiegern und verstellbarer Gewichtung.
- Gruppenwertung über Teilen-Links und QR-Codes oder live über Firebase. Auszeichnungen und Länderwertung.
- Export: CSV für Excel, Ranking als Bild, JSON-Sicherung.

## Daten
Alles wird im Browser gespeichert (localStorage). Im Live-Modus zusätzlich im Firebase-Raum.
