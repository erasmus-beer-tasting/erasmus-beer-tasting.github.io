# Erasmus Beer Tasting

Static website for a beer tasting: everyone rates the beers on their own phone, the results are merged into a group ranking. No server needed, works offline (web app with service worker).

## Files
- `config.js`: title, subtitle, date, optional live sync (Firebase URL, room name).
- `app.js`: all functions. `index.html`: design.
- `qr.js`: QR code generator (after Project Nayuki, MIT).
- `sw.js`: offline cache. Increase the version in `CACHE` after changes.
- `fonts/`: Fraunces, Gochi Hand, Nunito (SIL Open Font License, via Google Fonts).

## Features
- Add beers with country, style, ABV, "brought by" and photo.
- Rating: colour from an SRM colour scale, head, clarity, six categories with 1 to 5 mugs (tap twice for half points), flavour notes, comment. Live score with weighting.
- Blind mode: names hidden until rated, ABV guessing game.
- My ranking with podium, category champions and adjustable weights.
- Group ranking: via share links / QR codes or live via Firebase. Awards (crowd favourite, most controversial, toughest critic, best nose, taste twins, patriot award), country cup.
- Export: CSV for Excel, ranking as image, full JSON backup.

## Data
Everything is stored in the browser (localStorage). In live mode ratings and photos are also stored in the Firebase room.
