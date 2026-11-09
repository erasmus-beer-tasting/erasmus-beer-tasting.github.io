# Erasmus-Bierverkostung

Website für eine Bierverkostung. Alle melden sich mit ihrem Namen an, tragen Biere ein und bewerten sie auf dem eigenen Handy. Die Ergebnisse lassen sich nach Kategorien sortieren und als Bild oder Tabelle herunterladen.

Design nach einer Brauerei-Vorlage (Vintclub): Pergament, Kupfer, Dunkelbraun, Oswald, Kaushan Script, Lora.

## Dateien
- `config.js`: Titel, Datum, Firebase-URL für den Live-Abgleich, Raumname.
- `app.js`: Funktionen und Texte. `style.css`: Design. `index.html`: Gerüst.
- `qr.js`: QR-Code-Generator (nach Project Nayuki, MIT-Lizenz).
- `sw.js`: Offline-Speicher. Nach Änderungen die Versionsnummer in `CACHE` erhöhen.
- `fonts/`: Oswald, Kaushan Script, Lora (SIL Open Font License, über Google Fonts).

## Abgleich
- Mit Firebase-URL in `config.js`: Biere, Bewertungen, Namen und Fotos werden live zwischen allen Handys abgeglichen (Firebase Realtime Database, REST und Server-Sent Events).
- Ohne: Biere und Bewertungen werden über einen Link oder QR-Code geteilt (Menü oben rechts).

## Bewertung
Aussehen, Geruch, Geschmack, Nachgeschmack und Drinkability von 1 bis 5, dazu ein Fazit von 0 Sternen („Nie wieder“) bis 5 Sternen („Wird eins meiner Favoriten“). Der Gesamtwert ist der Schnitt der fünf Kategorien.
