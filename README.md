# Erasmus-Bierverkostung

Website für eine Bierverkostung. Alle melden sich mit ihrem Namen an, tragen Biere ein und bewerten sie auf dem eigenen Handy. Die Ergebnisse lassen sich nach Kategorien sortieren und als Bild oder Tabelle herunterladen.

Design nach einer Brauerei-Vorlage (Vintclub): Pergament, Kupfer, Dunkelbraun, Oswald, Kaushan Script, Lora.

## Dateien
- `config.js`: Titel.
- `app.js`: Funktionen und Texte. `style.css`: Design. `index.html`: Gerüst.
- `qr.js`: QR-Code-Generator (nach Project Nayuki, MIT-Lizenz).
- `sw.js`: Offline-Speicher. Nach Änderungen die Versionsnummer in `CACHE` erhöhen.
- `fonts/`: Oswald, Kaushan Script, Lora (SIL Open Font License, über Google Fonts).

## Abgleich
Ohne Server: Unter „Abgleich“ oben rechts zeigt jedes Handy einen QR-Code mit Bieren und Bewertungen. Ein anderes Handy scannt ihn mit der Kamera, der Link führt die Daten zusammen (neuere Einträge gewinnen, nichts wird überschrieben). Alternativ als Link teilen und einfügen. Fotos bleiben auf dem Handy, auf dem sie aufgenommen wurden.

## Bewertung
Aussehen, Geruch, Geschmack, Nachgeschmack und Drinkability von 1 bis 5, dazu ein Fazit von 1 Stern („Nie wieder“) bis 5 Sternen („Wird eins meiner Favoriten“). Der Gesamtwert ist der Schnitt der fünf Kategorien.
