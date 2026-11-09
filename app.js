'use strict';
/* Erasmus-Bierverkostung: Alle bewerten auf dem eigenen Handy, die Ergebnisse werden über Links oder live zusammengeführt. */

const C = window.CONFIG || {};
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------- Daten ---------- */

const CATS = [
  { k: 'look', n: 'Farbe & Schaum', s: 'Optik', best: 'Beste Optik', ic: '👀', q: 'Gegen das Licht halten: Farbe, Klarheit, Schaum.' },
  { k: 'aroma', n: 'Geruch', s: 'Geruch', best: 'Bester Geruch', ic: '👃', q: 'Schwenken, riechen, nachdenken.' },
  { k: 'taste', n: 'Geschmack', s: 'Geschmack', best: 'Bester Geschmack', ic: '👅', q: 'Die ersten Schlucke: Malz, Hopfen, Balance?' },
  { k: 'finish', n: 'Nachgeschmack', s: 'Abgang', best: 'Bester Nachgeschmack', ic: '⏳', q: 'Was bleibt nach dem Schlucken?' },
  { k: 'drink', n: 'Drinkability', s: 'Trinkbar', best: 'Beste Drinkability', ic: '🍻', q: 'Würdest du noch eins bestellen?' },
  { k: 'overall', n: 'Gesamt', s: 'Gesamt', best: 'Bestes Gesamturteil', ic: '⭐', q: 'Dein Bauchgefühl.' }
];
const DEF_W = { look: 10, aroma: 15, taste: 25, finish: 15, drink: 15, overall: 20 };
const LABELS = [[1.5, 'Ab in den Ausguss'], [2.25, 'Naja'], [2.9, 'Geht so'], [3.4, 'Solide'], [3.9, 'Lecker'], [4.4, 'Hervorragend'], [9, 'Legendär']];

const SRM = [
  [2, '#FFE699', 'Hellstroh'], [3, '#FFD878', 'Stroh'], [4, '#FFCA5A', 'Hellgold'], [6, '#F8A600', 'Tiefgold'],
  [9, '#E58500', 'Hellbernstein'], [12, '#CF6900', 'Bernstein'], [15, '#BB5100', 'Dunkelbernstein'], [18, '#A63E00', 'Kupfer'],
  [21, '#952D00', 'Braun'], [25, '#7B1A00', 'Rubinbraun'], [30, '#5E0B00', 'Dunkelbraun'], [40, '#36080A', 'Schwarz']
];
// [Schlüssel, Chip, Schaumhöhe im Glas, Beschreibung]
const HEAD = [['none', 'Keiner', 0, 'Kein Schaum'], ['thin', 'Dünn', 5, 'Wenig Schaum'], ['medium', 'Mittel', 12, 'Mittlerer Schaum'],
  ['big', 'Viel', 20, 'Viel Schaum'], ['huge', 'Riesig', 27, 'Riesige Schaumkrone']];
const CLARITY = [['clear', 'Klar'], ['hazy', 'Leicht trüb'], ['cloudy', 'Trüb']];
const NOTES = ['Malzig', 'Brotig', 'Karamell', 'Honig', 'Süß', 'Hopfig', 'Bitter', 'Grasig', 'Kräuter', 'Zitrus', 'Tropisch', 'Fruchtig',
  'Beeren', 'Banane', 'Nelke', 'Würzig', 'Sauer', 'Wild', 'Röstig', 'Kaffee', 'Schokolade', 'Rauchig', 'Nussig', 'Vanille',
  'Spritzig', 'Cremig', 'Wässrig', 'Metallisch'];
const STYLES = ['Pils', 'Lager / Helles', 'Dunkel', 'Märzen / Festbier', 'Bock / Doppelbock', 'Kölsch', 'Altbier', 'Weizen',
  'Witbier', 'Pale Ale', 'IPA', 'Hazy IPA', 'Amber / Red Ale', 'Belgisches Blonde', 'Dubbel / Tripel', 'Saison', 'Sauerbier / Gose',
  'Lambic / Fruchtbier', 'Porter', 'Stout', 'Rauchbier', 'Radler', 'Alkoholfrei', 'Sonstiges'];
const COUNTRIES = [
  ['AL', 'Albanien', 'Gëzuar!'], ['AR', 'Argentinien', '¡Salud!'], ['AU', 'Australien', 'Cheers!'], ['BE', 'Belgien', 'Santé! Schol!'],
  ['BA', 'Bosnien und Herzegowina', 'Živjeli!'], ['BR', 'Brasilien', 'Saúde!'], ['BG', 'Bulgarien', 'Nazdrave!'], ['CL', 'Chile', '¡Salud!'],
  ['CN', 'China', 'Gānbēi!'], ['DK', 'Dänemark', 'Skål!'], ['DE', 'Deutschland', 'Prost!'], ['EE', 'Estland', 'Terviseks!'],
  ['FI', 'Finnland', 'Kippis!'], ['FR', 'Frankreich', 'Santé!'], ['GR', 'Griechenland', 'Yia mas!'], ['IN', 'Indien', 'Cheers!'],
  ['ID', 'Indonesien', 'Bersulang!'], ['IE', 'Irland', 'Sláinte!'], ['IS', 'Island', 'Skál!'], ['IL', 'Israel', 'L’chaim!'],
  ['IT', 'Italien', 'Cin cin!'], ['JP', 'Japan', 'Kanpai!'], ['CA', 'Kanada', 'Cheers! Santé!'], ['CO', 'Kolumbien', '¡Salud!'],
  ['HR', 'Kroatien', 'Živjeli!'], ['LV', 'Lettland', 'Priekā!'], ['LT', 'Litauen', 'Į sveikatą!'], ['LU', 'Luxemburg', 'Prost!'],
  ['MT', 'Malta', 'Saħħa!'], ['MX', 'Mexiko', '¡Salud!'], ['ME', 'Montenegro', 'Živjeli!'], ['NZ', 'Neuseeland', 'Cheers!'],
  ['NL', 'Niederlande', 'Proost!'], ['MK', 'Nordmazedonien', 'Na zdravje!'], ['NO', 'Norwegen', 'Skål!'], ['AT', 'Österreich', 'Prost!'],
  ['PH', 'Philippinen', 'Tagay!'], ['PL', 'Polen', 'Na zdrowie!'], ['PT', 'Portugal', 'Saúde!'], ['RO', 'Rumänien', 'Noroc!'],
  ['SE', 'Schweden', 'Skål!'], ['CH', 'Schweiz', 'Proscht! Santé!'], ['RS', 'Serbien', 'Živeli!'], ['SK', 'Slowakei', 'Na zdravie!'],
  ['SI', 'Slowenien', 'Na zdravje!'], ['ES', 'Spanien', '¡Salud!'], ['ZA', 'Südafrika', 'Gesondheid!'], ['KR', 'Südkorea', 'Geonbae!'],
  ['TH', 'Thailand', 'Chon kaew!'], ['CZ', 'Tschechien', 'Na zdraví!'], ['TR', 'Türkei', 'Şerefe!'], ['UA', 'Ukraine', 'Budmo!'],
  ['HU', 'Ungarn', 'Egészségedre!'], ['US', 'USA', 'Cheers!'], ['GB', 'Vereinigtes Königreich', 'Cheers!'], ['VN', 'Vietnam', 'Một hai ba, dô!'],
  ['CY', 'Zypern', 'Yia mas!'], ['XX', 'Anderes Land', 'Prost!']
];

/* ---------- Zustand ---------- */

const KEY = 'beer-tasting-v1', FK = 'beer-tasting-foto-', UK = 'beer-tasting-tab';
const fresh = () => ({ me: null, beers: {}, ratings: {}, others: {}, weights: { ...DEF_W }, blind: false, hidden: {}, myFotos: {} });
let S;
try { S = Object.assign(fresh(), JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) { S = fresh(); }
const ui = { tab: localStorage.getItem(UK) || 'beers', sheet: null, pending: null };

function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); }
  catch (e) { toast('Speicher voll. Ein paar Fotos entfernen?'); }
}
function save() { persist(); scheduleSync(); }

const foto = id => localStorage.getItem(FK + id);
function setFoto(id, data) {
  try { localStorage.setItem(FK + id, data); return true; }
  catch (e) { toast('Nicht genug Platz für dieses Foto'); return false; }
}

/* ---------- Hilfsfunktionen ---------- */

const hasCountry = c => !!c && c !== 'XX';
const flag = c => hasCountry(c) && /^[A-Z]{2}$/.test(c) ? String.fromCodePoint(...[...c].map(ch => 127397 + ch.charCodeAt(0))) : '🌍';
const tflag = c => hasCountry(c) ? flag(c) + ' ' : '';
const country = c => COUNTRIES.find(x => x[0] === c);
const cName = c => country(c)?.[1] || 'Unbekannt';
const cheers = c => country(c)?.[2] || 'Prost!';
const srmOf = v => SRM.find(x => x[0] === v);
const fmt = x => x == null ? '–' : x.toFixed(1).replace('.', ',');
const pct = x => String(x).replace('.', ',');
const label = x => LABELS.find(l => x < l[0])[1];
const rid = () => Math.random().toString(36).slice(2, 10);
const mean = a => a.reduce((s, x) => s + x, 0) / a.length;
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const fmtDate = d => new Date(d + 'T12:00').toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
const slug = s => s.toLowerCase().replace(/ß/g, 'ss').replace(/ø/g, 'o').replace(/æ/g, 'ae').replace(/ł/g, 'l').replace(/đ/g, 'd')
  .normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'bier';

const beersList = () => Object.values(S.beers).filter(b => !b.del).sort((a, b) => (a.at || 0) - (b.at || 0) || a.id.localeCompare(b.id));
const numOf = id => beersList().findIndex(b => b.id === id) + 1;
const revealed = b => !S.blind || b.byId === S.me?.id || !!S.ratings[b.id];
const bname = b => revealed(b) ? b.name : `Geheimbier #${numOf(b.id)}`;

function score(r, w = S.weights) {
  if (!r) return null;
  let s = 0, t = 0;
  for (const c of CATS) { const v = r[c.k]; if (v) { s += v * (w[c.k] || 0); t += w[c.k] || 0; } }
  return t ? s / t : null;
}

function beerSrm(id) {
  const mine = S.ratings[id]?.srm;
  if (mine) return mine;
  const cnt = {};
  for (const o of Object.values(S.others)) { const v = o.ratings?.[id]?.srm; if (v) cnt[v] = (cnt[v] || 0) + 1; }
  const top = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0];
  return top ? +top[0] : null;
}

function tasters() {
  const me = { id: S.me.id, name: S.me.name, country: S.me.country, ratings: S.ratings, me: true };
  return [me, ...Object.values(S.others).filter(o => !S.hidden[o.id])];
}

function myRanked() {
  return beersList().map(b => ({ b, s: score(S.ratings[b.id]), r: S.ratings[b.id] }))
    .filter(x => x.s != null).sort((x, y) => y.s - x.s);
}

function groupStats() {
  const T = tasters(), rows = [];
  for (const b of beersList()) {
    const sc = [];
    for (const t of T) { const r = t.ratings[b.id], s = score(r); if (s != null) sc.push({ t, s, r }); }
    if (!sc.length) continue;
    const avg = mean(sc.map(x => x.s));
    const sd = Math.sqrt(mean(sc.map(x => (x.s - avg) ** 2)));
    const cat = {};
    for (const c of CATS) { const v = sc.map(x => x.r[c.k]).filter(Boolean); cat[c.k] = v.length ? mean(v) : null; }
    rows.push({ b, avg, sd, n: sc.length, sc, cat });
  }
  rows.sort((a, b) => b.avg - a.avg || b.n - a.n);
  return { T, rows };
}

/* ---------- Symbole ---------- */

const MUG = `<svg viewBox="0 0 32 32" aria-hidden="true"><path class="foam" d="M6.5 10.5c-1.5-2.6.6-5.4 3.3-4.6.9-2.2 4.2-2.6 5.6-.6 1.7-1.4 4.6-.6 4.9 1.7 2.2.2 2.6 2.7 1.2 3.5z"/><rect class="liq" x="7" y="10.5" width="14" height="17" rx="1.5"/><path class="out" d="M6 9h16v17.5a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 6 26.5zM22 13h2.5a3 3 0 0 1 3 3v4.5a3 3 0 0 1-3 3H22"/></svg>`;
const ICONS = {
  beers: '<path d="M6 3.5h12l-1.6 17h-8.8z"/><path d="M6.6 9.5h10.8"/>',
  rank: '<path d="M3 20.5h18M9 20.5V7.5h6v13M3 20.5v-7h6M15 20.5v-4.5h6"/>',
  group: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.6 2.7-6.2 6-6.2s6 2.6 6 6.2"/><circle cx="17.2" cy="9" r="2.5"/><path d="M15.8 14.1c3 .3 5.2 2.6 5.2 5.9"/>',
  more: '<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>'
};
const TABS = [['beers', 'Biere'], ['rank', 'Mein Ranking'], ['group', 'Gruppe'], ['more', 'Mehr']];

function badge(cls = '') {
  const year = (C.date || '').slice(0, 4) || new Date().getFullYear();
  return `<svg class="badge ${cls}" viewBox="0 0 200 200" aria-hidden="true">
    <defs><path id="badge-ring" d="M100 100m-75 0a75 75 0 1 1 150 0a75 75 0 1 1-150 0"/></defs>
    <circle cx="100" cy="100" r="96" fill="var(--amber)" stroke="var(--ink)" stroke-width="4"/>
    <circle cx="100" cy="100" r="88" fill="none" stroke="var(--ink)" stroke-width="1.5" stroke-dasharray="3 5"/>
    <g class="ring"><text font-size="14" font-weight="800" fill="var(--ink)" textLength="466" lengthAdjust="spacing"><textPath href="#badge-ring">ERASMUS ✦ BIERVERKOSTUNG ✦ PROST ✦ SKÅL ✦ SALUD ✦</textPath></text></g>
    <circle cx="100" cy="100" r="58" fill="var(--paper)" stroke="var(--ink)" stroke-width="3"/>
    <g transform="translate(73 57) scale(1.75)">${MUG.replace('<svg viewBox="0 0 32 32" aria-hidden="true">', '').replace('</svg>', '')}</g>
    <text x="100" y="134" text-anchor="middle" font-size="15" font-weight="800" fill="var(--ink)" letter-spacing="2">${year}</text>
  </svg>`;
}

const gx = y => 8 + (y - 4) * 4 / 44, gxr = y => 32 - (y - 4) * 4 / 44;
function glass(v, head) {
  const col = v ? srmOf(v)?.[1] : null, top = 16;
  const fh = head === 'none' ? 0 : ({ thin: 3, medium: 5, big: 7, huge: 9 }[head] ?? 4);
  const fill = col
    ? `<polygon points="${gx(top)},${top} ${gxr(top)},${top} 28,48 12,48" fill="${col}"/>` +
      (fh ? `<rect x="${gx(top - fh)}" y="${top - fh}" width="${gxr(top - fh) - gx(top - fh)}" height="${fh + 1}" rx="2" fill="#fffdf6"/>` : '')
    : `<text x="20" y="35" text-anchor="middle" class="gq">?</text>`;
  return `<svg class="g" viewBox="0 0 40 52" aria-hidden="true">${fill}<path d="M8 4h24l-4 44H12z" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/></svg>`;
}

function bigGlass(d) {
  const col = d.srm ? srmOf(d.srm)[1] : '#efe2c6';
  const fh = (HEAD.find(h => h[0] === d.head) || [0, 0, 8])[2];
  const haze = { hazy: .18, cloudy: .34 }[d.clarity] || 0, top = 42;
  let foam = '';
  if (fh) {
    foam = `<rect x="0" y="${top - fh}" width="120" height="${fh + 3}" fill="#fffdf6"/>`;
    for (let x = 22; x <= 98; x += 9) foam += `<circle cx="${x}" cy="${top - fh}" r="${5 + (x % 3)}" fill="#fffdf6"/>`;
  }
  let bubbles = '';
  if (d.srm) [[44, 0], [58, 1.2], [70, .5], [80, 1.9], [52, 2.6], [64, 3.3]].forEach(([x, dl]) => {
    bubbles += `<circle class="bub" cx="${x}" cy="152" r="1.7" style="animation-delay:${dl}s"/>`;
  });
  return `<svg class="bigglass" viewBox="0 0 120 170" aria-hidden="true">
    <defs><clipPath id="bg-clip"><path d="M22 14h76l-12 146H34z"/></clipPath>
    <linearGradient id="bg-shine" x1="0" x2="1"><stop offset=".12" stop-color="#fff" stop-opacity="0"/><stop offset=".22" stop-color="#fff" stop-opacity=".45"/><stop offset=".32" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
    <g clip-path="url(#bg-clip)">
      <rect x="0" y="${top}" width="120" height="130" fill="${col}"/>
      ${haze ? `<rect x="0" y="${top}" width="120" height="130" fill="#fff6dc" opacity="${haze}"/>` : ''}
      ${bubbles}${foam}
      ${d.srm ? '' : `<text x="60" y="112" text-anchor="middle" class="bq">?</text>`}
      <rect width="120" height="170" fill="url(#bg-shine)"/>
    </g>
    <path d="M22 14h76l-12 146H34z" fill="none" stroke="var(--ink)" stroke-width="3.5" stroke-linejoin="round"/>
  </svg>`;
}

function radar(mine, group) {
  const R = 70, cx = 140, cy = 104, n = CATS.length;
  const pt = (i, v) => { const a = -Math.PI / 2 + i * 2 * Math.PI / n; return [cx + Math.cos(a) * R * v / 5, cy + Math.sin(a) * R * v / 5]; };
  const poly = vals => CATS.map((c, i) => pt(i, vals[c.k] || 0).map(z => z.toFixed(1)).join(',')).join(' ');
  let g = '';
  for (let v = 1; v <= 5; v++) g += `<polygon class="ring${v === 5 ? ' outer' : ''}" points="${CATS.map((c, i) => pt(i, v).join(',')).join(' ')}"/>`;
  CATS.forEach((c, i) => {
    const [x, y] = pt(i, 5), [lx, ly] = pt(i, 6.15);
    const anchor = Math.abs(lx - cx) < 4 ? 'middle' : lx > cx ? 'start' : 'end';
    g += `<line class="axis" x1="${cx}" y1="${cy}" x2="${x}" y2="${y}"/><text x="${lx}" y="${ly + 4}" text-anchor="${anchor}">${c.s}</text>`;
  });
  const series = (vals, cls) => vals ? `<polygon class="${cls}" points="${poly(vals)}"/>` +
    CATS.map((c, i) => vals[c.k] ? `<circle class="${cls}" cx="${pt(i, vals[c.k])[0].toFixed(1)}" cy="${pt(i, vals[c.k])[1].toFixed(1)}" r="4"/>` : '').join('') : '';
  const legend = mine && group ? `<div class="legend"><span><i class="me"></i>Du</span><span><i class="grp"></i>Gruppenschnitt</span></div>` : '';
  return `${legend}<svg class="radar" viewBox="0 0 280 205" role="img" aria-label="Werte pro Kategorie">${g}${series(group, 'grp')}${series(mine, 'me')}</svg>`;
}

function strip(row) {
  const W = 120, x = v => 7 + (v - 1) / 4 * (W - 14);
  return `<svg class="strip" viewBox="0 0 ${W} 16" aria-hidden="true"><line x1="7" x2="${W - 7}" y1="8" y2="8"/>` +
    row.sc.map(s => `<circle cx="${x(s.s).toFixed(1)}" cy="8" r="4.2" class="${s.t.me ? 'me' : ''}"/>`).join('') +
    `<line class="avg" x1="${x(row.avg).toFixed(1)}" x2="${x(row.avg).toFixed(1)}" y1="1" y2="15"/></svg>`;
}

const countryOptions = (sel, empty) => (empty ? `<option value="">${empty}</option>` : '') +
  COUNTRIES.map(([c, n]) => `<option value="${c}"${c === sel ? ' selected' : ''}>${hasCountry(c) ? flag(c) + ' ' : ''}${esc(n)}</option>`).join('');

/* ---------- Ansichten ---------- */

function render() {
  const app = $('#app');
  if (!S.me) { app.innerHTML = viewWelcome(); return; }
  const view = { beers: viewBeers, rank: viewRank, group: viewGroup, more: viewMore }[ui.tab] || viewBeers;
  app.innerHTML = `<main id="view">${view()}</main>
    <nav class="tabs">${TABS.map(([k, n]) => `<button data-tab="${k}" class="${ui.tab === k ? 'on' : ''}"><svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[k]}</svg><span>${n}</span></button>`).join('')}</nav>`;
}

function viewWelcome() {
  return `<main class="welcome">
    ${badge('big')}
    <h1>${esc(C.title)}</h1>
    ${C.date ? `<p class="sub hand">${fmtDate(C.date)}</p>` : ''}
    ${ui.pending ? '<p class="note">Du hast einen geteilten Link geöffnet. Er wird übernommen, sobald du deinen Namen eingegeben hast.</p>' : ''}
    <div class="card form">
      <label>Dein Name<input id="w-name" maxlength="24" autocomplete="given-name" placeholder="z. B. Sofia"></label>
      <button class="btn primary big" data-act="start">Los geht’s</button>
    </div>
  </main>`;
}

function marquee() {
  const codes = new Set([S.me?.country, ...Object.values(S.others).map(o => o.country), ...beersList().map(b => b.country)].filter(hasCountry));
  let words = [...new Set([...codes].map(c => cheers(c)))];
  if (words.length < 4) words = [...new Set(words.concat(['Prost!', 'Skål!', '¡Salud!', 'Cin cin!', 'Santé!', 'Na zdrowie!', 'Kippis!', 'Şerefe!']))];
  const line = words.map(w => `<span>${esc(w)}</span>`).join('<i>✦</i>');
  return `<div class="marquee" aria-hidden="true"><div>${line}<i>✦</i>${line}<i>✦</i></div></div>`;
}

function viewBeers() {
  const L = beersList(), rated = L.filter(b => S.ratings[b.id]).length;
  const p = L.length ? Math.round(rated / L.length * 100) : 0;
  return `<header class="hero">
      ${badge()}
      <div>
        <h1>${esc(C.title)}</h1>
        ${C.date ? `<p class="sub hand">${fmtDate(C.date)}</p>` : ''}
        <p class="hi">Hallo ${esc(S.me.name)} ${tflag(S.me.country)}</p>
      </div>
    </header>
    ${marquee()}
    <div class="progress card">
      <div class="pg"><div style="width:${p}%"></div></div>
      <span><b>${rated}</b> von ${L.length} bewertet${S.blind ? ' · blind' : ''}</span>
    </div>
    <div class="actions">
      <button class="btn primary" data-act="add">＋ Bier hinzufügen</button>
      ${L.length > rated ? '<button class="btn" data-act="surprise">🎲 Auslosen</button>' : ''}
    </div>
    ${L.length ? `<ul class="beers">${L.map(card).join('')}</ul>` : `<div class="empty card"><p class="hand">Der Kühlschrank ist noch leer.</p><p>Trag die Biere ein, die du mitgebracht hast. Name, Land und ein Foto der Flasche reichen.${C.firebase ? ' Alle anderen sehen sie sofort.' : ' Danach teilst du die Liste im Bereich „Gruppe“.'}</p></div>`}`;
}

function card(b) {
  const r = S.ratings[b.id], s = score(r), rev = revealed(b), f = rev && foto(b.id);
  const meta = rev ? [`${flag(b.country)} ${esc(cName(b.country))}`, esc(b.style), b.abv ? `${pct(b.abv)} %` : ''].filter(Boolean).join(' · ') : 'Blind: erst bewerten, dann aufdecken';
  return `<li class="beer ${r ? 'done' : ''}" data-act="open" data-id="${b.id}">
    <div class="thumb">${f ? `<img src="${f}" alt="">` : glass(r?.srm || (rev ? beerSrm(b.id) : null), r?.head)}<span class="num">${numOf(b.id)}</span></div>
    <div class="info"><b>${esc(bname(b))}</b><small>${meta}</small>${rev && b.by ? `<small class="by">mitgebracht von ${esc(b.by)}</small>` : ''}</div>
    <div class="sc">${s != null ? `<strong>${fmt(s)}</strong><span>${label(s)}</span>` : '<span class="go">Bewerten ›</span>'}</div>
  </li>`;
}

function podium(list, kind) {
  const order = [list[1], list[0], list[2]];
  return `<div class="podium">${order.map((x, i) => x ? `
    <button class="pod p${[2, 1, 3][i]}" data-act="open" data-detail="1" data-id="${x.b.id}">
      ${glass(kind === 'mine' ? x.r.srm : beerSrm(x.b.id), kind === 'mine' ? x.r.head : null)}
      <b>${esc(bname(x.b))}</b><small>${revealed(x.b) ? flag(x.b.country) : ''} ${fmt(x.s)}</small>
      <div class="block">${[2, 1, 3][i]}</div>
    </button>` : '<div class="pod empty"></div>').join('')}</div>`;
}

function rankRow(x, i, extra = '') {
  return `<li data-act="open" data-detail="1" data-id="${x.b.id}">
    <span class="rk">${i + 1}</span>
    <div class="info"><b>${esc(bname(x.b))}</b><small>${revealed(x.b) ? `${flag(x.b.country)} ${esc(cName(x.b.country))}${x.b.style ? ' · ' + esc(x.b.style) : ''}` : ''}</small>${extra}</div>
    <div class="sc"><strong>${fmt(x.s)}</strong><span>${label(x.s)}</span></div>
    <div class="bar"><i style="width:${Math.max(0, (x.s - 1) / 4 * 100)}%"></i></div>
  </li>`;
}

function champions(items) {
  return `<div class="champs">${CATS.map(c => {
    const best = items.filter(x => x.cat[c.k]).sort((a, b) => b.cat[c.k] - a.cat[c.k])[0];
    return `<div class="champ card"><small>${c.ic} ${c.best}</small><b>${best ? esc(bname(best.b)) : '–'}</b><span>${best ? fmt(best.cat[c.k]) : ''}</span></div>`;
  }).join('')}</div>`;
}

function weightsPanel() {
  const tot = CATS.reduce((s, c) => s + (S.weights[c.k] || 0), 0) || 1;
  return `<details class="card weights">
    <summary>So wird der Wert berechnet</summary>
    <p>Dein Wert ist der gewichtete Mittelwert aller Kategorien, die du bewertet hast (1 bis 5). Mit den Reglern legst du fest, wie stark jede Kategorie zählt. Das Ranking aktualisiert sich beim Loslassen.</p>
    ${CATS.map(c => `<label class="wrow"><span>${c.n}</span><input type="range" min="0" max="40" step="5" value="${S.weights[c.k] || 0}" data-in="w" data-k="${c.k}"><em id="wv-${c.k}">${Math.round((S.weights[c.k] || 0) / tot * 100)} %</em></label>`).join('')}
    <button class="btn small" data-act="wReset">Zurück zum Standard</button>
  </details>`;
}

function viewRank() {
  const L = myRanked();
  if (!L.length) return `<h2 class="title">Mein Ranking</h2><div class="empty card"><p class="hand">Noch nichts bewertet.</p><p>Bewerte dein erstes Bier, dann erscheint es hier.</p><button class="btn primary" data-tab="beers">Zu den Bieren</button></div>`;
  return `<h2 class="title">Mein Ranking</h2>
    ${podium(L, 'mine')}
    <ol class="rank">${L.map((x, i) => rankRow(x, i)).join('')}</ol>
    <h3 class="sect">Kategoriesieger</h3>
    ${champions(L.map(x => ({ b: x.b, cat: x.r })))}
    ${weightsPanel()}
    <div class="actions"><button class="btn" data-act="img" data-mode="mine">📸 Als Bild teilen</button></div>`;
}

function syncBox() {
  if (C.firebase) {
    const st = live.ok === null ? ['wait', 'Verbinde …'] : live.ok ? ['ok', `Live im Raum „${esc(ROOM)}“`] : ['bad', 'Keine Verbindung, neuer Versuch läuft'];
    return `<div class="card sync"><p class="live ${st[0]}"><i></i>${st[1]}</p><p>Bewertungen und neue Biere werden alle paar Sekunden abgeglichen.</p>
      <div class="actions"><button class="btn small" data-act="invite">Mit QR-Code einladen</button></div></div>`;
  }
  return `<div class="card sync">
    <p>Jedes Handy speichert seine eigenen Bewertungen. Zum Vergleichen schickst du deine Bewertungen als Link, zum Beispiel in eure Gruppe. Wer ihn öffnet, sieht dich in der Gruppenwertung. Der Link enthält auch deine Bierliste.</p>
    <div class="actions">
      <button class="btn primary small" data-act="shareMine">Meine Bewertungen teilen</button>
      <button class="btn small" data-act="qrMine">Als QR-Code zeigen</button>
    </div>
    <label class="paste">Link bekommen? Hier einfügen<span><input id="paste" placeholder="https://…#d=…" autocomplete="off"><button class="btn small" data-act="importPaste">Übernehmen</button></span></label>
  </div>`;
}

function awards(T, rows) {
  const A = [];
  // Publikumsliebling nur unter Bieren, die mindestens die Hälfte der Personen bewertet hat
  const minVotes = Math.max(1, Math.ceil(Math.max(...rows.map(r => r.n)) / 2));
  const fav = rows.find(r => r.n >= minVotes);
  if (fav) A.push(['🏆', 'Publikumsliebling', bname(fav.b), `${fmt(fav.avg)} von ${plural(fav.n, 'Person', 'Personen')}`]);
  const con = rows.filter(r => r.n >= 2).sort((a, b) => b.sd - a.sd)[0];
  if (con && con.sd >= .25) {
    const v = con.sc.map(x => x.s);
    A.push(['🌶️', 'Am umstrittensten', bname(con.b), `Werte von ${fmt(Math.min(...v))} bis ${fmt(Math.max(...v))}`]);
  }
  const love = rows.filter(r => r.n >= 2).sort((a, b) => a.sd - b.sd)[0];
  if (love && rows.length > 2 && love !== con) A.push(['🤝', 'Große Einigkeit', bname(love.b), `alle innerhalb von ${fmt(Math.max(...love.sc.map(x => x.s)) - Math.min(...love.sc.map(x => x.s)))} Punkten`]);

  if (T.length >= 2) {
    const given = T.map(t => ({ t, v: beersList().map(b => score(t.ratings[b.id])).filter(x => x != null) })).filter(x => x.v.length >= 3)
      .map(x => ({ ...x, m: mean(x.v) })).sort((a, b) => a.m - b.m);
    if (given.length >= 2) {
      A.push(['🧐', 'Strengster Gaumen', given[0].t.name, `vergibt im Schnitt ${fmt(given[0].m)}`]);
      A.push(['🥰', 'Großzügigster Gaumen', given[given.length - 1].t.name, `vergibt im Schnitt ${fmt(given[given.length - 1].m)}`]);
    }
    const nose = T.map(t => {
      const e = beersList().filter(b => b.abv && t.ratings[b.id]?.abv).map(b => Math.abs(t.ratings[b.id].abv - b.abv));
      return { t, n: e.length, m: e.length ? mean(e) : 99 };
    }).filter(x => x.n >= 2).sort((a, b) => a.m - b.m)[0];
    if (nose) A.push(['👃', 'Beste Nase', nose.t.name, `schätzt den Alkohol im Schnitt auf ${fmt(nose.m)} Prozentpunkte genau`]);
    let twins = null;
    for (let i = 0; i < T.length; i++) for (let j = i + 1; j < T.length; j++) {
      const d = beersList().map(b => [score(T[i].ratings[b.id]), score(T[j].ratings[b.id])]).filter(([a, b]) => a != null && b != null).map(([a, b]) => Math.abs(a - b));
      if (d.length >= 3 && (!twins || mean(d) < twins.m)) twins = { a: T[i], b: T[j], m: mean(d) };
    }
    if (twins) A.push(['👯', 'Geschmackszwillinge', `${twins.a.name} & ${twins.b.name}`, `im Schnitt nur ${twins.m.toFixed(2).replace('.', ',')} Punkte auseinander`]);
    const pat = T.filter(t => hasCountry(t.country)).map(t => {
      const own = [], other = [];
      for (const b of beersList()) { const s = score(t.ratings[b.id]); if (s == null) continue; (b.country === t.country ? own : other).push(s); }
      return own.length && other.length ? { t, d: mean(own) - mean(other) } : null;
    }).filter(Boolean).sort((a, b) => b.d - a.d)[0];
    if (pat && pat.d >= .3) A.push(['🚩', 'Lokalpatriotismus', pat.t.name, `bewertet Biere aus der Heimat ${fmt(pat.d)} Punkte besser`]);
  }
  return A.length ? `<div class="awards">${A.map(([ic, t, w, d]) => `<div class="award card"><span class="ic">${ic}</span><small>${t}</small><b>${esc(w)}</b><span>${esc(d)}</span></div>`).join('')}</div>` : '';
}

function countryCup(rows) {
  const by = {};
  for (const r of rows) if (revealed(r.b)) (by[r.b.country || 'XX'] ||= []).push(r.avg);
  const list = Object.entries(by).map(([c, v]) => ({ c, m: mean(v), n: v.length })).sort((a, b) => b.m - a.m);
  if (list.length < 2) return '';
  return `<h3 class="sect">Länderwertung</h3><ol class="cup card">${list.map((x, i) => `<li><span class="rk">${i + 1}</span><span class="fl">${flag(x.c)}</span><span class="nm">${esc(cName(x.c))}<small>${plural(x.n, 'Bier', 'Biere')}</small></span><span class="bar"><i style="width:${(x.m - 1) / 4 * 100}%"></i></span><b>${fmt(x.m)}</b></li>`).join('')}</ol>`;
}

function viewGroup() {
  const { T, rows } = groupStats();
  const all = [{ id: S.me.id, name: S.me.name, country: S.me.country, ratings: S.ratings, me: true }, ...Object.values(S.others)];
  const chips = all.map(t => {
    const n = Object.keys(t.ratings || {}).filter(id => S.beers[id] && !S.beers[id].del).length, off = S.hidden[t.id];
    return `<button class="chip ${off ? '' : 'on'}" ${t.me ? 'disabled' : `data-act="toggleT" data-id="${t.id}"`}>${tflag(t.country)}${esc(t.name)}${t.me ? ' (du)' : ''} · ${n}</button>`;
  }).join('');
  return `<h2 class="title">Gruppe</h2>
    ${syncBox()}
    <h3 class="sect">Dabei <small>${T.length} gezählt${Object.keys(S.others).length ? ' · antippen, um jemanden auszublenden' : ''}</small></h3>
    <div class="chips">${chips}</div>
    ${rows.length ? `
      ${podium(rows.map(r => ({ b: r.b, s: r.avg })), 'group')}
      <ol class="rank group">${rows.map((r, i) => rankRow({ b: r.b, s: r.avg }, i, `<div class="spread">${strip(r)}<em>${plural(r.n, 'Stimme', 'Stimmen')}</em></div>`)).join('')}</ol>
      <p class="hint">Punkte: Wert jeder Person, deiner in Bernstein. Strich: Gruppenschnitt.</p>
      ${awards(T, rows)}
      ${countryCup(rows)}
      <h3 class="sect">Kategoriesieger</h3>
      ${champions(rows.map(r => ({ b: r.b, cat: r.cat })))}
      <div class="actions"><button class="btn" data-act="img" data-mode="group">📸 Gruppenranking teilen</button><button class="btn" data-act="csv">⬇ Tabelle herunterladen</button></div>`
    : `<div class="empty card"><p class="hand">Noch keine Wertungen.</p><p>Sobald jemand ein Bier bewertet, erscheint hier die Gruppenwertung.</p></div>`}`;
}

function viewMore() {
  return `<h2 class="title">Mehr</h2>
    <div class="card form">
      <h3>Dein Profil</h3>
      <label>Name<input id="p-name" maxlength="24" value="${esc(S.me.name)}"></label>
      <label>Herkunftsland (optional)<select id="p-country">${countryOptions(hasCountry(S.me.country) ? S.me.country : '', 'Keine Angabe')}</select></label>
      <button class="btn small" data-act="saveProfile">Profil speichern</button>
    </div>
    <div class="card">
      <h3>Blindverkostung</h3>
      <label class="switch"><input type="checkbox" id="blind" ${S.blind ? 'checked' : ''}><span></span>Namen, Länder und Fotos verbergen, bis du ein Bier bewertet hast</label>
      <p class="hint">Für nummerierte Gläser: Wer ein Bier mitgebracht hat, schenkt es als „Bier #3“ aus. Im Blindmodus schätzt du außerdem den Alkoholgehalt. Wer am genauesten schätzt, bekommt die Auszeichnung „Beste Nase“.</p>
    </div>
    <div class="card">
      <h3>Freunde einladen</h3>
      <p>Die anderen scannen den QR-Code und landen auf dieser Seite.</p>
      <div class="actions"><button class="btn small" data-act="invite">QR-Code zeigen</button><button class="btn small" data-act="inviteCopy">Link kopieren</button></div>
    </div>
    <div class="card">
      <h3>Export und Sicherung</h3>
      <div class="actions col">
        <button class="btn small" data-act="csv">⬇ Tabelle mit allen Bewertungen (CSV für Excel)</button>
        <button class="btn small" data-act="img" data-mode="mine">📸 Mein Ranking als Bild</button>
        <button class="btn small" data-act="img" data-mode="group">📸 Gruppenranking als Bild</button>
        <button class="btn small" data-act="backup">💾 Komplette Sicherung mit Fotos (JSON)</button>
        <label class="btn small">↩ Sicherung wiederherstellen<input type="file" id="restore" accept="application/json,.json" hidden></label>
      </div>
    </div>
    <div class="card">
      <h3>Neu anfangen</h3>
      <p class="hint">Löscht alle Biere, Bewertungen und Fotos auf diesem Handy.</p>
      <button class="btn small danger" data-act="reset">Alles löschen</button>
    </div>
    <p class="foot hand">${esc(C.title)} · Die Daten bleiben auf deinem Handy${C.firebase ? ' und im gemeinsamen Raum' : ''}</p>`;
}

/* ---------- Overlays ---------- */

const sheetEl = () => $('#sheet');

function openSheet(s) {
  const was = !!ui.sheet;
  ui.sheet = s;
  const el = sheetEl();
  el.hidden = false;
  el.innerHTML = `<div class="sh">${sheetHTML()}</div>`;
  el.scrollTop = 0;
  requestAnimationFrame(() => el.classList.add('open'));
  document.body.classList.add('locked');
  if (!was) history.pushState({ sheet: 1 }, '');
}
function renderSheet() {
  const el = sheetEl(), top = el.scrollTop;
  el.innerHTML = `<div class="sh">${sheetHTML()}</div>`;
  el.scrollTop = top;
}
function closeSheet(fromPop) {
  if (!ui.sheet) return;
  ui.sheet = null;
  const el = sheetEl();
  el.classList.remove('open');
  document.body.classList.remove('locked');
  setTimeout(() => { if (!ui.sheet) { el.hidden = true; el.innerHTML = ''; } }, 260);
  if (!fromPop && history.state?.sheet) history.back();
}
window.addEventListener('popstate', () => { if (ui.sheet) closeSheet(true); });

function sheetHTML() {
  const s = ui.sheet;
  return ({ beer: sheetBeer, rate: sheetRate, detail: sheetDetail, reveal: sheetReveal, qr: sheetQR })[s.type]();
}
const shHead = (t, sub = '') => `<div class="sh-head"><div><h2>${t}</h2>${sub}</div><button class="x" data-act="close" aria-label="Schließen">✕</button></div>`;
const beerMeta = b => `<p class="meta">${flag(b.country)} ${esc(cName(b.country))}${b.style ? ' · ' + esc(b.style) : ''}${b.abv ? ` · ${pct(b.abv)} %` : ''}${b.brewery ? '<br>' + esc(b.brewery) : ''}`;

function sheetBeer() {
  const s = ui.sheet, b = s.id ? S.beers[s.id] : { by: S.me.name, country: hasCountry(S.me.country) ? S.me.country : '' };
  const f = s.photo || (!s.rm && s.id && foto(s.id));
  const names = [...new Set([S.me.name, ...Object.values(S.others).map(o => o.name), ...beersList().map(x => x.by)].filter(Boolean))];
  return `${shHead(s.id ? 'Bier bearbeiten' : 'Bier hinzufügen')}
    <div class="form">
      <div class="photo"><div id="b-prev" class="prev">${f ? `<img src="${f}" alt="">` : glass(null)}</div>
        <div class="col"><label class="btn small">📷 ${f ? 'Foto ändern' : 'Foto hinzufügen'}<input type="file" id="b-photo" accept="image/*" hidden></label>
        ${f ? '<button class="btn small ghost" data-act="rmPhoto">Foto entfernen</button>' : ''}</div></div>
      <label>Name des Biers *<input id="b-name" maxlength="40" value="${esc(b.name)}" placeholder="z. B. Pilsner Urquell"></label>
      <label>Brauerei<input id="b-brewery" maxlength="40" value="${esc(b.brewery)}"></label>
      <div class="row">
        <label>Land<select id="b-country">${countryOptions(b.country, 'Land wählen')}</select></label>
        <label class="abv">Alkohol %<input id="b-abv" type="number" inputmode="decimal" step="0.1" min="0" max="20" value="${b.abv ?? ''}"></label>
      </div>
      <label>Stil<select id="b-style"><option value="">Weiß nicht</option>${STYLES.map(x => `<option${x === b.style ? ' selected' : ''}>${esc(x)}</option>`).join('')}</select></label>
      <label>Mitgebracht von<input id="b-by" maxlength="24" list="b-names" value="${esc(b.by)}"><datalist id="b-names">${names.map(n => `<option value="${esc(n)}">`).join('')}</datalist></label>
      <button class="btn primary big" data-act="saveBeer">${s.id ? 'Änderungen speichern' : 'Zur Liste hinzufügen'}</button>
      ${s.id ? '<button class="btn small danger" data-act="delBeer">Bier löschen</button>' : ''}
    </div>`;
}

function mugRow(c, d) {
  const v = d[c.k] || 0;
  return `<div class="cat">
    <div class="cat-h"><h3>${c.ic} ${c.n}</h3><em>${v ? `${fmtHalf(v)} / 5` : ''}</em></div>
    <p class="q">${c.q}</p>
    <div class="mugs">${[1, 2, 3, 4, 5].map(i => `<button class="mug ${v >= i ? 'full' : v >= i - .5 ? 'half' : ''}" data-act="mug" data-k="${c.k}" data-v="${i}" aria-label="${i} von 5">${MUG}</button>`).join('')}</div>
  </div>`;
}
const fmtHalf = v => String(v).replace('.', ',');

function sheetRate() {
  const s = ui.sheet, b = S.beers[s.id], d = s.draft, rev = revealed(b), sc = score(d);
  const done = CATS.filter(c => d[c.k]).length;
  const meta = rev ? beerMeta(b) + '</p>' : '<p class="meta">Blindverkostung: Die Auflösung kommt nach dem Speichern.</p>';
  const cat = k => mugRow(CATS.find(c => c.k === k), d);
  return `${shHead(`<small>Bier #${numOf(b.id)}</small>${esc(bname(b))}`, meta)}
    <div class="stage">${bigGlass(d)}<div class="cheers hand">${esc(rev ? cheers(b.country) : 'Prost!')}</div></div>
    <section class="blk">
      <h3>Farbe</h3>
      <div class="srm">${SRM.map(x => `<button class="sw ${d.srm === x[0] ? 'on' : ''}" style="--c:${x[1]}" data-act="srm" data-v="${x[0]}" aria-label="${x[2]}"></button>`).join('')}</div>
      <p class="srm-name">${d.srm ? `<b>${srmOf(d.srm)[2]}</b> · SRM ${d.srm}` : 'Wähl den Farbton, der deinem Glas am nächsten kommt.'}</p>
      <div class="opt"><span>Schaum</span><div class="chips">${HEAD.map(h => `<button class="chip ${d.head === h[0] ? 'on' : ''}" data-act="head" data-v="${h[0]}">${h[1]}</button>`).join('')}</div></div>
      <div class="opt"><span>Klarheit</span><div class="chips">${CLARITY.map(h => `<button class="chip ${d.clarity === h[0] ? 'on' : ''}" data-act="clarity" data-v="${h[0]}">${h[1]}</button>`).join('')}</div></div>
      ${cat('look')}
    </section>
    <section class="blk">${cat('aroma')}${cat('taste')}
      <h3 class="mt">Was riechst und schmeckst du?</h3>
      <div class="chips notes">${NOTES.map((n, i) => `<button class="chip ${d.notes.includes(i) ? 'on' : ''}" data-act="note" data-v="${i}">${n}</button>`).join('')}</div>
    </section>
    <section class="blk">${cat('finish')}${cat('drink')}${cat('overall')}</section>
    ${!rev ? `<section class="blk"><h3>🎯 Alkohol schätzen</h3><p class="q">Wie stark ist es? Wer am genauesten schätzt, bekommt die „Beste Nase“.</p>
      <div class="abvguess"><input type="range" min="0" max="12" step="0.1" value="${d.abv || 5}" data-in="abv"><output id="abv-out">${fmt(d.abv || 5)} %</output></div></section>` : ''}
    <section class="blk"><h3>Notizen</h3><textarea data-in="text" maxlength="300" rows="3" placeholder="Was willst du dir merken?">${esc(d.text)}</textarea></section>
    <div class="savebar">
      <div class="live-score"><strong>${fmt(sc)}</strong><span>${sc != null ? label(sc) : 'Krüge antippen'}<br><small>${done} von 6 Kategorien</small></span></div>
      <button class="btn primary" data-act="saveRating">Speichern</button>
    </div>`;
}

function sheetDetail() {
  const b = S.beers[ui.sheet.id], rev = revealed(b), my = S.ratings[b.id], f = rev && foto(b.id);
  const { rows } = groupStats(), row = rows.find(r => r.b.id === b.id);
  const others = row ? row.sc.filter(x => !x.t.me) : [];
  const ms = score(my);
  const noteCount = {};
  if (row) row.sc.forEach(x => (x.r.notes || []).forEach(n => { noteCount[n] = (noteCount[n] || 0) + 1; }));
  const topNotes = Object.entries(noteCount).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const headTag = HEAD.find(h => h[0] === my?.head)?.[3];
  return `${shHead(`<small>Bier #${numOf(b.id)}</small>${esc(bname(b))}`, rev ? beerMeta(b) + `${b.by ? `<br>mitgebracht von ${esc(b.by)}` : ''}</p>` : '')}
    ${f ? `<img class="hero-img" src="${f}" alt="">` : ''}
    <div class="scores">
      <div class="card big-score"><small>Du</small><strong>${fmt(ms)}</strong><span>${ms != null ? label(ms) : 'nicht bewertet'}</span></div>
      ${row && (others.length || !my) ? `<div class="card big-score"><small>Gruppe · ${row.n}</small><strong>${fmt(row.avg)}</strong><span>${label(row.avg)}</span></div>` : ''}
    </div>
    ${my || row ? radar(my, others.length ? row.cat : (!my ? row?.cat : null)) : ''}
    ${my ? `<table class="breakdown">${CATS.map(c => `<tr><th>${c.n}</th><td>${my[c.k] ? fmtHalf(my[c.k]) : '–'}</td>${others.length ? `<td class="g">${fmt(row.cat[c.k])}</td>` : ''}</tr>`).join('')}
      ${others.length ? '<tr class="lg"><th></th><td>du</td><td class="g">Gruppe</td></tr>' : ''}</table>` : ''}
    ${my ? `<div class="mynotes">
      ${my.srm ? `<span class="tag"><i style="background:${srmOf(my.srm)[1]}"></i>${srmOf(my.srm)[2]}</span>` : ''}
      ${headTag ? `<span class="tag">${headTag}</span>` : ''}
      ${my.clarity ? `<span class="tag">${CLARITY.find(h => h[0] === my.clarity)?.[1]}</span>` : ''}
      ${(my.notes || []).map(n => `<span class="tag">${NOTES[n] || ''}</span>`).join('')}
      ${my.abv && b.abv ? `<span class="tag">Geschätzt ${fmt(my.abv)} %, tatsächlich ${pct(b.abv)} %</span>` : ''}
      ${my.text ? `<p class="hand quote">„${esc(my.text)}“</p>` : ''}</div>` : ''}
    ${topNotes.length && others.length ? `<h3 class="sect">Das hat die Gruppe geschmeckt</h3><div class="chips">${topNotes.map(([n, k]) => `<span class="chip on">${NOTES[n]} ×${k}</span>`).join('')}</div>` : ''}
    ${others.length ? `<h3 class="sect">Das sagen die anderen</h3><ul class="others">${others.sort((a, b) => b.s - a.s).map(x => `<li><span>${tflag(x.t.country)}${esc(x.t.name)}</span><b>${fmt(x.s)}</b>${rev && x.r.text ? `<p class="hand">„${esc(x.r.text)}“</p>` : ''}</li>`).join('')}</ul>` : ''}
    <div class="actions col">
      <button class="btn primary" data-act="rate" data-id="${b.id}">${my ? 'Bewertung ändern' : 'Dieses Bier bewerten'}</button>
      ${rev ? `<button class="btn small" data-act="editBeer" data-id="${b.id}">Angaben zum Bier bearbeiten</button>` : ''}
    </div>`;
}

function sheetReveal() {
  const b = S.beers[ui.sheet.id], r = S.ratings[b.id], s = score(r), f = foto(b.id);
  const guess = r.abv && b.abv ? `<p class="guess">Deine Schätzung: <b>${fmt(r.abv)} %</b>, tatsächlich: <b>${pct(b.abv)} %</b>${Math.abs(r.abv - b.abv) <= .3 ? '. Gute Nase!' : ''}</p>` : '';
  return `<div class="reveal">
    <button class="x" data-act="close" aria-label="Schließen">✕</button>
    <p class="hand">Bier #${numOf(b.id)} war …</p>
    ${f ? `<img src="${f}" alt="">` : glass(r.srm, r.head)}
    <h2>${esc(b.name)}</h2>
    ${beerMeta(b)}${b.by ? `<br>mitgebracht von ${esc(b.by)}` : ''}</p>
    ${guess}
    <p class="you">Deine Wertung: <b>${fmt(s)}</b> · ${label(s)}</p>
    <p class="cheers hand">${esc(cheers(b.country))}</p>
    <div class="actions">${beersList().some(x => !S.ratings[x.id]) ? '<button class="btn primary" data-act="surprise">Nächstes Bier</button>' : ''}<button class="btn" data-act="close">Fertig</button></div>
  </div>`;
}

function sheetQR() {
  const s = ui.sheet, code = window.QR ? QR.svg(s.text) : null;
  return `${shHead(esc(s.title))}
    <div class="qr">${code || '<p>Zu viele Daten für einen QR-Code. Bitte stattdessen „Teilen“ nutzen.</p>'}</div>
    <p class="hint center">${esc(s.hint || '')}</p>
    <div class="actions"><button class="btn" data-act="copyQR">Link kopieren</button>${navigator.share ? '<button class="btn" data-act="shareQR">Teilen …</button>' : ''}</div>`;
}

/* ---------- Aktionen ---------- */

function startRate(id) {
  const r = S.ratings[id];
  const draft = r ? JSON.parse(JSON.stringify(r)) : { notes: [] };
  draft.notes ||= [];
  openSheet({ type: 'rate', id, draft });
}

function openBeer(id, detail) {
  if (!S.beers[id]) return;
  if (S.ratings[id] || detail) openSheet({ type: 'detail', id });
  else startRate(id);
}

const ACTIONS = {
  start() {
    const name = $('#w-name').value.trim();
    if (!name) { toast('Wie heißt du?'); $('#w-name').focus(); return; }
    S.me = { id: rid(), name, country: '' };
    save(); render();
    if (ui.pending) { const p = ui.pending; ui.pending = null; importData(p); }
    else toast(`Willkommen, ${name}!`);
  },
  add() { openSheet({ type: 'beer' }); },
  open(el) { openBeer(el.dataset.id, el.dataset.detail === '1'); },
  rate(el) { startRate(el.dataset.id); },
  editBeer(el) { openSheet({ type: 'beer', id: el.dataset.id }); },
  close() { closeSheet(); },
  surprise() {
    const open = beersList().filter(b => !S.ratings[b.id]);
    if (!open.length) { toast('Du hast alle Biere bewertet!'); return; }
    const b = open[Math.floor(Math.random() * open.length)];
    startRate(b.id);
    toast(`🎲 Als Nächstes: Bier #${numOf(b.id)}`);
  },
  saveBeer() {
    const s = ui.sheet, name = $('#b-name').value.trim();
    if (!name) { toast('Gib dem Bier einen Namen'); $('#b-name').focus(); return; }
    let id = s.id;
    if (!id) {
      id = slug(name);
      if (S.beers[id] && !S.beers[id].del) { toast('Dieses Bier steht schon auf der Liste'); return; }
    }
    const prev = s.id ? S.beers[id] : null, abv = parseFloat(String($('#b-abv').value).replace(',', '.'));
    S.beers[id] = {
      id, name, brewery: $('#b-brewery').value.trim(), country: $('#b-country').value, style: $('#b-style').value,
      abv: abv > 0 && abv < 30 ? Math.round(abv * 10) / 10 : null, by: $('#b-by').value.trim(),
      byId: prev?.byId || S.me.id, at: prev?.at || Date.now(), upd: Date.now(), del: false
    };
    if (s.photo && setFoto(id, s.photo)) { S.myFotos[id] = 1; uploadFoto(id); }
    else if (s.rm) { localStorage.removeItem(FK + id); delete S.myFotos[id]; }
    save(); closeSheet(); render();
    toast(prev ? 'Gespeichert' : `${name} steht auf der Liste`);
  },
  delBeer() {
    const b = S.beers[ui.sheet.id];
    if (!confirm(`„${b.name}“ von der Liste löschen? Die Bewertungen dafür zählen dann nicht mehr.`)) return;
    S.beers[b.id] = { ...b, del: true, upd: Date.now() };
    localStorage.removeItem(FK + b.id);
    save(); closeSheet(); render();
  },
  rmPhoto() { ui.sheet.photo = null; ui.sheet.rm = true; renderBeerPreview(); },
  mug(el) {
    const d = ui.sheet.draft, k = el.dataset.k, v = +el.dataset.v, cur = d[k] || 0;
    if (cur === v) d[k] = v === 1 ? 0 : v - .5; else d[k] = v;
    if (!d[k]) delete d[k];
    if (navigator.vibrate) navigator.vibrate(8);
    renderSheet();
  },
  srm(el) { const d = ui.sheet.draft, v = +el.dataset.v; d.srm = d.srm === v ? null : v; renderSheet(); },
  head(el) { const d = ui.sheet.draft; d.head = d.head === el.dataset.v ? '' : el.dataset.v; renderSheet(); },
  clarity(el) { const d = ui.sheet.draft; d.clarity = d.clarity === el.dataset.v ? '' : el.dataset.v; renderSheet(); },
  note(el) {
    const d = ui.sheet.draft, v = +el.dataset.v;
    d.notes = d.notes.includes(v) ? d.notes.filter(x => x !== v) : [...d.notes, v];
    el.classList.toggle('on');
  },
  saveRating() {
    const s = ui.sheet, b = S.beers[s.id], d = s.draft;
    if (!CATS.some(c => d[c.k])) { toast('Tipp zuerst mindestens einen Krug an'); return; }
    const wasRevealed = revealed(b), first = !S.ratings[b.id];
    if (!wasRevealed && d.abv == null) d.abv = 5;
    S.ratings[b.id] = { ...d, at: Date.now() };
    save(); render();
    if (!wasRevealed) { openSheet({ type: 'reveal', id: b.id }); return; }
    closeSheet();
    const n = Object.keys(S.ratings).length;
    toast(`${cheers(b.country)} Gespeichert.${first && n % 4 === 0 ? ' Zeit für ein Glas Wasser? 💧' : ''}`);
  },
  async shareMine() {
    const url = await encodeLink();
    share(`Bierbewertungen von ${S.me.name}`, `Meine Bewertungen von der ${C.title}. Öffnen, um sie in deine Gruppenwertung zu übernehmen:`, url);
  },
  async qrMine() {
    const url = await encodeLink();
    openSheet({ type: 'qr', title: 'Meine Bewertungen', text: url, hint: 'Lass jemanden scannen. Deine Biere und Bewertungen landen dann auf dem anderen Handy.' });
  },
  importPaste() {
    const v = $('#paste').value.trim(), m = v.match(/#d=([A-Za-z0-9_-]+)/);
    if (!m) { toast('Das sieht nicht nach einem Bewertungslink aus'); return; }
    importData(m[1]);
  },
  toggleT(el) {
    const id = el.dataset.id;
    if (S.hidden[id]) delete S.hidden[id]; else S.hidden[id] = true;
    persist(); render();
  },
  invite() { openSheet({ type: 'qr', title: 'Zur Verkostung', text: inviteUrl(), hint: 'Mit der Handykamera scannen, um die Seite zu öffnen.' }); },
  inviteCopy() { copy(inviteUrl()); },
  copyQR() { copy(ui.sheet.text); },
  shareQR() { share(ui.sheet.title, '', ui.sheet.text); },
  csv() { exportCSV(); },
  img(el) { shareImage(el.dataset.mode); },
  backup() {
    const fotos = {};
    for (const b of Object.values(S.beers)) { const f = foto(b.id); if (f) fotos[b.id] = f; }
    download(`bierverkostung-sicherung-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ app: 'beer-tasting', v: 1, state: S, fotos }), 'application/json');
  },
  saveProfile() {
    const name = $('#p-name').value.trim();
    if (!name) { toast('Der Name darf nicht leer sein'); return; }
    S.me.name = name; S.me.country = $('#p-country').value;
    save(); render(); toast('Profil gespeichert');
  },
  wReset() { S.weights = { ...DEF_W }; persist(); render(); },
  reset() {
    if (!confirm('Wirklich alle Biere, Bewertungen und Fotos auf diesem Handy löschen?')) return;
    for (const k of Object.keys(localStorage)) if (k.startsWith(FK)) localStorage.removeItem(k);
    localStorage.removeItem(KEY);
    S = fresh(); render();
  }
};

function renderBeerPreview() {
  const s = ui.sheet, f = s.photo || (!s.rm && s.id && foto(s.id));
  $('#b-prev').innerHTML = f ? `<img src="${f}" alt="">` : glass(null);
}

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act],[data-tab]');
  if (!el || el.disabled) return;
  if (el.dataset.tab) {
    ui.tab = el.dataset.tab; localStorage.setItem(UK, ui.tab);
    if (ui.sheet) closeSheet();
    render(); window.scrollTo(0, 0); return;
  }
  const f = ACTIONS[el.dataset.act];
  if (f) { e.preventDefault(); f(el); }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.id === 'w-name') ACTIONS.start();
});

document.addEventListener('input', e => {
  const t = e.target, d = ui.sheet?.draft;
  if (t.dataset.in === 'text' && d) d.text = t.value;
  if (t.dataset.in === 'abv' && d) { d.abv = +t.value; $('#abv-out').textContent = fmt(d.abv) + ' %'; }
  if (t.dataset.in === 'w') {
    const w = { ...S.weights, [t.dataset.k]: +t.value }, tot = CATS.reduce((s, c) => s + (w[c.k] || 0), 0) || 1;
    CATS.forEach(c => { $('#wv-' + c.k).textContent = Math.round((w[c.k] || 0) / tot * 100) + ' %'; });
  }
});

document.addEventListener('change', async e => {
  const t = e.target;
  if (t.id === 'b-photo' && t.files[0]) {
    try { ui.sheet.photo = await shrink(t.files[0]); ui.sheet.rm = false; renderBeerPreview(); }
    catch (err) { toast('Das Foto konnte nicht gelesen werden'); }
  }
  if (t.dataset.in === 'w') { S.weights[t.dataset.k] = +t.value; persist(); render(); }
  if (t.id === 'blind') { S.blind = t.checked; persist(); render(); toast(S.blind ? 'Blindmodus an. Nicht schummeln!' : 'Blindmodus aus'); }
  if (t.id === 'restore' && t.files[0]) {
    try {
      const data = JSON.parse(await t.files[0].text());
      if (data.app !== 'beer-tasting' || !data.state) throw new Error('format');
      if (!confirm('Alles auf diesem Handy durch die Sicherung ersetzen?')) return;
      S = Object.assign(fresh(), data.state);
      for (const [id, f] of Object.entries(data.fotos || {})) setFoto(id, f);
      save(); render(); toast('Sicherung wiederhergestellt');
    } catch (err) { toast('Das ist keine gültige Sicherungsdatei'); }
    t.value = '';
  }
});

/* ---------- Fotos ---------- */

async function shrink(file, max = 560) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = url; });
    const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', .72);
  } finally { URL.revokeObjectURL(url); }
}

/* ---------- Teilen über Links ---------- */

const NUM = v => (v == null || v === '' || isNaN(v)) ? 0 : +v;
function pack() {
  return {
    v: 1, t: [S.me.id, S.me.name, S.me.country || ''],
    b: Object.values(S.beers).map(b => [b.id, b.name, b.brewery || '', b.country || '', b.style || '', NUM(b.abv), b.by || '', b.byId || '', b.at || 0, b.upd || 0, b.del ? 1 : 0]),
    r: Object.entries(S.ratings).filter(([id]) => S.beers[id]).map(([id, r]) => [id, ...CATS.map(c => NUM(r[c.k])), NUM(r.srm), r.head || '', r.clarity || '',
      (r.notes || []).map(n => n.toString(36)).join(''), NUM(r.abv), r.text || ''])
  };
}

const ID_RE = /^[a-z0-9-]{1,48}$/, TID_RE = /^[a-z0-9]{3,16}$/;
const str = (v, n) => String(v ?? '').slice(0, n);
const num = (v, lo, hi) => { v = +v; return v >= lo && v <= hi ? v : 0; };

function merge(p) {
  if (!p || !Array.isArray(p.t) || !TID_RE.test(p.t[0])) throw new Error('format');
  let newBeers = 0;
  for (const a of p.b || []) {
    if (!Array.isArray(a) || !ID_RE.test(a[0])) continue;
    const b = {
      id: a[0], name: str(a[1], 40), brewery: str(a[2], 40), country: str(a[3], 2), style: str(a[4], 30),
      abv: num(a[5], 0, 30) || null, by: str(a[6], 24), byId: str(a[7], 16), at: num(a[8], 0, 9e15), upd: num(a[9], 0, 9e15), del: !!a[10]
    };
    const ex = S.beers[b.id];
    if (!ex || b.upd > (ex.upd || 0)) { if (!ex && !b.del) newBeers++; S.beers[b.id] = b; }
  }
  const [tid, tname, tc] = p.t;
  let count = 0;
  if (tid !== S.me.id) {
    const ratings = {};
    for (const a of p.r || []) {
      if (!Array.isArray(a) || !ID_RE.test(a[0])) continue;
      const r = {};
      CATS.forEach((c, i) => { const v = num(a[1 + i], 0, 5); if (v) r[c.k] = v; });
      r.srm = num(a[7], 0, 40) || null; r.head = str(a[8], 8); r.clarity = str(a[9], 8);
      r.notes = [...str(a[10], 36)].map(ch => parseInt(ch, 36)).filter(n => n >= 0 && n < NOTES.length);
      r.abv = num(a[11], 0, 30) || null; r.text = str(a[12], 300);
      ratings[a[0]] = r; count++;
    }
    if (count || S.others[tid]) S.others[tid] = { id: tid, name: str(tname, 24) || 'Gast', country: str(tc, 2), ratings };
  }
  return { name: str(tname, 24), newBeers, count, self: tid === S.me.id };
}

const b64u = bytes => { let s = ''; for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const unb64u = s => { const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(bin, c => c.charCodeAt(0)); };
const pipe = async (bytes, stream) => new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());
const baseUrl = () => location.origin + location.pathname;
const inviteUrl = () => baseUrl() + (new URLSearchParams(location.search).get('room') ? `?room=${encodeURIComponent(ROOM)}` : '');

async function encodeLink() {
  let bytes = new TextEncoder().encode(JSON.stringify(pack())), pre = 'j';
  if (window.CompressionStream) { try { bytes = await pipe(bytes, new CompressionStream('deflate-raw')); pre = 'z'; } catch (e) { /* unkomprimiert */ } }
  return inviteUrl() + '#d=' + pre + b64u(bytes);
}
async function decodeData(s) {
  let bytes = unb64u(s.slice(1));
  if (s[0] === 'z') bytes = await pipe(bytes, new DecompressionStream('deflate-raw'));
  return JSON.parse(new TextDecoder().decode(bytes));
}

async function importData(s) {
  try {
    const res = merge(await decodeData(s));
    save(); render();
    if (res.self) toast('Das ist dein eigener Link');
    else toast(`${res.name} übernommen: ${plural(res.count, 'Bewertung', 'Bewertungen')}${res.newBeers ? `, ${plural(res.newBeers, 'neues Bier', 'neue Biere')}` : ''}`, 3500);
    if (res.count && ui.tab !== 'group' && !res.self) { ui.tab = 'group'; localStorage.setItem(UK, 'group'); render(); }
  } catch (e) { toast('Dieser Link konnte nicht gelesen werden'); }
}

function checkHash() {
  const m = location.hash.match(/^#d=([A-Za-z0-9_-]+)$/);
  if (!m) return;
  history.replaceState(null, '', location.pathname + location.search);
  if (!S.me) { ui.pending = m[1]; render(); return; }
  importData(m[1]);
}
window.addEventListener('hashchange', checkHash);

async function share(title, text, url) {
  if (navigator.share) {
    try { await navigator.share({ title, text, url }); return; }
    catch (e) { if (e.name === 'AbortError') return; }
  }
  copy(url);
}
async function copy(t) {
  try { await navigator.clipboard.writeText(t); toast('Link kopiert'); }
  catch (e) { prompt('Link kopieren:', t); }
}

/* ---------- Live-Abgleich (optional, Firebase Realtime Database über REST) ---------- */

const FB = (C.firebase || '').trim().replace(/\/+$/, '');
const ROOM = (new URLSearchParams(location.search).get('room') || C.room || 'tasting').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40) || 'tasting';
const live = { ok: null, lastPull: '', lastPush: '', tried: {} };
let pushTimer = null;

function scheduleSync() {
  if (!FB || !S.me) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(push, 700);
}
async function push() {
  const body = JSON.stringify(pack());
  if (body === live.lastPush) return;
  try {
    const r = await fetch(`${FB}/rooms/${ROOM}/tasters/${S.me.id}.json`, { method: 'PUT', body });
    if (!r.ok) throw new Error(r.status);
    live.lastPush = body; setLive(true);
  } catch (e) { setLive(false); }
}
async function uploadFoto(id) {
  if (!FB) return;
  const f = foto(id);
  if (!f) return;
  try { await fetch(`${FB}/rooms/${ROOM}/fotos/${id}.json`, { method: 'PUT', body: JSON.stringify(f) }); } catch (e) { /* nächster Versuch in pull */ }
}
async function pull() {
  if (!FB || !S.me || document.hidden) return;
  try {
    const r = await fetch(`${FB}/rooms/${ROOM}/tasters.json`);
    if (!r.ok) throw new Error(r.status);
    const text = await r.text();
    setLive(true);
    if (text !== live.lastPull) {
      live.lastPull = text;
      const data = JSON.parse(text) || {};
      for (const p of Object.values(data)) { try { merge(p); } catch (e) { /* fehlerhaften Eintrag überspringen */ } }
      save();
      if (!ui.sheet || ui.sheet.type !== 'beer') render();
      if (ui.sheet && ui.sheet.type === 'detail') renderSheet();
    }
    pullFotos();
  } catch (e) { setLive(false); }
}
async function pullFotos() {
  try {
    const r = await fetch(`${FB}/rooms/${ROOM}/fotos.json?shallow=true`);
    const have = (await r.json()) || {};
    let changed = false;
    for (const id of Object.keys(S.myFotos)) if (!have[id] && foto(id)) uploadFoto(id);
    for (const id of Object.keys(have)) {
      if (foto(id) || live.tried[id] || !S.beers[id]) continue;
      live.tried[id] = 1;
      const f = await (await fetch(`${FB}/rooms/${ROOM}/fotos/${id}.json`)).json();
      if (typeof f === 'string' && f.startsWith('data:image/') && setFoto(id, f)) changed = true;
    }
    if (changed && !ui.sheet) render();
  } catch (e) { /* nächste Runde */ }
}
function setLive(ok) {
  if (live.ok === ok) return;
  live.ok = ok;
  if (ui.tab === 'group' && !ui.sheet) render();
}
if (FB) {
  setInterval(pull, 4000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) pull(); });
}

/* ---------- Export ---------- */

function download(name, content, type) {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

function exportCSV() {
  const q = v => { const s = String(v ?? ''); return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const dec = v => v == null || v === '' ? '' : String(Math.round(v * 100) / 100).replace('.', ',');
  const lines = [['Person', 'Herkunft', 'Bier #', 'Bier', 'Brauerei', 'Land', 'Stil', 'Alkohol %', 'Mitgebracht von', ...CATS.map(c => c.n),
    'Wert', 'Farbe', 'Schaum', 'Klarheit', 'Aromen', 'Alkohol geschätzt', 'Notiz'].map(q).join(';')];
  for (const t of tasters()) for (const b of beersList()) {
    const r = t.ratings[b.id];
    if (!r) continue;
    lines.push([t.name, hasCountry(t.country) ? cName(t.country) : '', numOf(b.id), b.name, b.brewery, b.country ? cName(b.country) : '', b.style, dec(b.abv), b.by,
      ...CATS.map(c => dec(r[c.k])), dec(score(r)), srmOf(r.srm)?.[2] || '', HEAD.find(h => h[0] === r.head)?.[3] || '',
      CLARITY.find(h => h[0] === r.clarity)?.[1] || '', (r.notes || []).map(n => NOTES[n]).join(', '), dec(r.abv), r.text].map(q).join(';'));
  }
  download(`bierverkostung-${new Date().toISOString().slice(0, 10)}.csv`, '﻿' + lines.join('\r\n'), 'text/csv;charset=utf-8');
}

async function shareImage(mode) {
  const group = mode === 'group';
  const list = group ? groupStats().rows.map(r => ({ b: r.b, s: r.avg, v: beerSrm(r.b.id), n: r.n })) : myRanked().map(x => ({ b: x.b, s: x.s, v: x.r.srm }));
  if (!list.length) { toast('Noch nichts zum Anzeigen'); return; }
  const top = list.slice(0, 10), W = 1080, rowH = 96, H = 400 + top.length * rowH + 150;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d');
  try { await Promise.all(['800 64px Fraunces', '700 36px Nunito', '400 40px Gochi'].map(f => document.fonts.load(f))); } catch (e) { /* Ersatzschriften */ }
  const SERIF = 'Fraunces, Georgia, serif', SANS = 'Nunito, Arial, sans-serif', HAND = 'Gochi, "Comic Sans MS", cursive';
  const fit = (t, max) => { if (x.measureText(t).width <= max) return t; while (t.length > 1 && x.measureText(t + '…').width > max) t = t.slice(0, -1); return t + '…'; };
  x.fillStyle = '#f6ecd9'; x.fillRect(0, 0, W, H);
  x.fillStyle = 'rgba(180,101,10,.13)';
  for (let yy = 12; yy < H; yy += 26) for (let xx = 12; xx < W; xx += 26) { x.beginPath(); x.arc(xx, yy, 1.6, 0, 7); x.fill(); }
  x.strokeStyle = '#2a1708'; x.lineWidth = 6; x.strokeRect(30, 30, W - 60, H - 60);
  x.lineWidth = 2; x.strokeRect(44, 44, W - 88, H - 88);
  x.fillStyle = '#f0a81c'; x.fillRect(44, 44, W - 88, 250);
  x.fillStyle = '#2a1708'; x.textAlign = 'center';
  x.font = `800 70px ${SERIF}`; x.fillText(fit(C.title || 'Bierverkostung', W - 160), W / 2, 150);
  x.font = `400 42px ${HAND}`;
  x.fillText(group ? `Gruppenranking · ${plural(tasters().length, 'Person', 'Personen')}` : `Ranking von ${S.me.name}`, W / 2, 215);
  x.font = `700 28px ${SANS}`;
  x.fillText(C.date ? fmtDate(C.date) : '', W / 2, 262);
  x.beginPath(); x.moveTo(44, 294); x.lineTo(W - 44, 294); x.stroke();
  top.forEach((it, i) => {
    const y = 340 + i * rowH, medal = ['#f0a81c', '#c9ced6', '#d08a52'][i];
    x.fillStyle = medal || 'rgba(42,23,8,.08)';
    x.beginPath(); x.arc(110, y + 36, 32, 0, 7); x.fill();
    x.fillStyle = '#2a1708'; x.textAlign = 'center'; x.font = `800 34px ${SERIF}`; x.fillText(String(i + 1), 110, y + 48);
    const col = it.v ? srmOf(it.v)[1] : '#efe2c6';
    x.fillStyle = col; x.beginPath(); x.moveTo(170, y + 14); x.lineTo(214, y + 14); x.lineTo(208, y + 70); x.lineTo(176, y + 70); x.closePath(); x.fill();
    x.fillStyle = '#fffdf6'; x.fillRect(170, y + 4, 44, 12);
    x.strokeStyle = '#2a1708'; x.lineWidth = 3; x.beginPath(); x.moveTo(168, y); x.lineTo(216, y); x.lineTo(209, y + 72); x.lineTo(175, y + 72); x.closePath(); x.stroke();
    x.textAlign = 'left'; x.fillStyle = '#2a1708'; x.font = `800 38px ${SANS}`;
    x.fillText(fit(bname(it.b), 600), 246, y + 32);
    x.font = `600 27px ${SANS}`; x.fillStyle = '#7a6047';
    const sub = revealed(it.b) ? [`${flag(it.b.country)} ${cName(it.b.country)}`, it.b.style, it.n ? plural(it.n, 'Stimme', 'Stimmen') : ''].filter(Boolean).join(' · ') : '';
    x.fillText(fit(sub, 600), 246, y + 70);
    x.textAlign = 'right'; x.fillStyle = '#2a1708'; x.font = `800 52px ${SERIF}`; x.fillText(fmt(it.s), W - 90, y + 54);
  });
  x.textAlign = 'center'; x.font = `400 40px ${HAND}`; x.fillStyle = '#b4650a';
  const words = [...new Set(top.filter(t => hasCountry(t.b.country)).map(t => cheers(t.b.country)))].slice(0, 4).join('  ·  ');
  x.fillText(words || 'Prost!', W / 2, H - 80);
  const blob = await new Promise(ok => c.toBlob(ok, 'image/png'));
  const file = new File([blob], group ? 'gruppenranking.png' : 'mein-ranking.png', { type: 'image/png' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: C.title }); return; } catch (e) { if (e.name === 'AbortError') return; }
  }
  download(file.name, blob);
}

/* ---------- Hinweis ---------- */

let toastTimer;
function toast(msg, ms = 2400) {
  const t = $('#toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), ms);
}

/* ---------- Start ---------- */

render();
checkHash();
if (FB && S.me) { push(); pull(); }
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
