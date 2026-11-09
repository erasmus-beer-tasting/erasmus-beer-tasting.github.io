'use strict';
/* Erasmus-Bierverkostung: Alle bewerten auf dem eigenen Handy, die Ergebnisse werden über Links oder live zusammengeführt. */

const C = window.CONFIG || {};
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------- Daten ---------- */

const CATS = [
  { k: 'look', n: 'Farbe & Schaum', s: 'Optik', best: 'Beste Optik', q: 'Farbe, Klarheit und Schaum, gegen das Licht gehalten.' },
  { k: 'aroma', n: 'Geruch', s: 'Geruch', best: 'Bester Geruch', q: 'Leicht schwenken, dann riechen.' },
  { k: 'taste', n: 'Geschmack', s: 'Geschmack', best: 'Bester Geschmack', q: 'Malz, Hopfen, Süße, Bitterkeit, Balance.' },
  { k: 'finish', n: 'Nachgeschmack', s: 'Abgang', best: 'Bester Nachgeschmack', q: 'Was nach dem Schlucken bleibt.' },
  { k: 'drink', n: 'Drinkability', s: 'Trinkbar', best: 'Beste Drinkability', q: 'Wie gut lässt es sich trinken?' },
  { k: 'overall', n: 'Gesamt', s: 'Gesamt', best: 'Bestes Gesamturteil', q: 'Dein Gesamteindruck.' }
];
const DEF_W = { look: 10, aroma: 15, taste: 25, finish: 15, drink: 15, overall: 20 };
const LABELS = [[1.5, 'Schwach'], [2.25, 'Mäßig'], [2.9, 'Ordentlich'], [3.4, 'Solide'], [3.9, 'Gut'], [4.4, 'Sehr gut'], [9, 'Herausragend']];

const SRM = [
  [2, '#FFE699', 'Hellstroh'], [3, '#FFD878', 'Stroh'], [4, '#FFCA5A', 'Hellgold'], [6, '#F8A600', 'Tiefgold'],
  [9, '#E58500', 'Hellbernstein'], [12, '#CF6900', 'Bernstein'], [15, '#BB5100', 'Dunkelbernstein'], [18, '#A63E00', 'Kupfer'],
  [21, '#952D00', 'Braun'], [25, '#7B1A00', 'Rubinbraun'], [30, '#5E0B00', 'Dunkelbraun'], [40, '#36080A', 'Schwarz']
];
// [Schlüssel, Chip, Schaumhöhe im großen Glas, Beschreibung]
const HEAD = [['none', 'Keiner', 0, 'Kein Schaum'], ['thin', 'Dünn', 5, 'Wenig Schaum'], ['medium', 'Mittel', 12, 'Mittlerer Schaum'],
  ['big', 'Viel', 20, 'Viel Schaum'], ['huge', 'Sehr viel', 27, 'Sehr viel Schaum']];
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
const flag = c => hasCountry(c) && /^[A-Z]{2}$/.test(c) ? String.fromCodePoint(...[...c].map(ch => 127397 + ch.charCodeAt(0))) : '';
const tflag = c => hasCountry(c) ? flag(c) + ' ' : '';
const country = c => COUNTRIES.find(x => x[0] === c);
const cName = c => country(c)?.[1] || 'Unbekannt';
const cheers = c => country(c)?.[2] || 'Prost!';
const srmOf = v => SRM.find(x => x[0] === v);
const fmt = x => x == null ? '–' : x.toFixed(1).replace('.', ',');
const pct = x => String(x).replace('.', ',');
const fmtHalf = v => String(v).replace('.', ',');
const pad = n => String(n).padStart(2, '0');
const label = x => LABELS.find(l => x < l[0])[1];
const rid = () => Math.random().toString(36).slice(2, 10);
const mean = a => a.reduce((s, x) => s + x, 0) / a.length;
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const fmtDate = d => new Date(d + 'T12:00').toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
const slug = s => s.toLowerCase().replace(/ß/g, 'ss').replace(/ø/g, 'o').replace(/æ/g, 'ae').replace(/ł/g, 'l').replace(/đ/g, 'd')
  .normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'bier';
// Textfarbe, die auf einer Bierfarbe lesbar bleibt
const textOn = hex => { const n = parseInt(hex.slice(1), 16); return ((n >> 16) * .299 + ((n >> 8) & 255) * .587 + (n & 255) * .114) / 255 > .6 ? '#241a14' : '#f6efe2'; };

const beersList = () => Object.values(S.beers).filter(b => !b.del).sort((a, b) => (a.at || 0) - (b.at || 0) || a.id.localeCompare(b.id));
const numOf = id => beersList().findIndex(b => b.id === id) + 1;
const revealed = b => !S.blind || b.byId === S.me?.id || !!S.ratings[b.id];
const bname = b => revealed(b) ? b.name : `Bier ${pad(numOf(b.id))}`;

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

/* ---------- Grafik ---------- */

const ICONS = {
  beers: '<path d="M6.5 3.5h11l-1.3 16.2a1.5 1.5 0 0 1-1.5 1.3H9.3a1.5 1.5 0 0 1-1.5-1.3z"/><path d="M7 8.5h10"/>',
  rank: '<path d="M3 20.5h18M9 20.5V7.5h6v13M3 20.5v-7h6M15 20.5v-4.5h6"/>',
  group: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.6 2.7-6.2 6-6.2s6 2.6 6 6.2"/><circle cx="17.2" cy="9" r="2.5"/><path d="M15.8 14.1c3 .3 5.2 2.6 5.2 5.9"/>',
  more: '<path d="M4 7h16M4 12h16M4 17h16"/>'
};
const TABS = [['beers', 'Biere'], ['rank', 'Mein Ranking'], ['group', 'Gruppe'], ['more', 'Mehr']];

// Probierglas (wie auf einem Probierbrett)
const GP = 'M8 5h24l-2.6 39.5a3.5 3.5 0 0 1-3.5 3.3H14.1a3.5 3.5 0 0 1-3.5-3.3z';
let GID = 0;
function glass(v, head) {
  const col = v ? srmOf(v)?.[1] : null, id = 'gc' + (++GID), top = 15;
  const fh = !col || head === 'none' ? 0 : ({ thin: 3, medium: 5, big: 7, huge: 9 }[head] ?? 4);
  return `<svg class="g" viewBox="0 0 40 52" aria-hidden="true">
    ${col ? `<defs><clipPath id="${id}"><path d="${GP}"/></clipPath></defs><g clip-path="url(#${id})"><rect y="${top}" width="40" height="40" fill="${col}"/>${fh ? `<rect y="${top - fh}" width="40" height="${fh}" fill="#f6efe2"/>` : ''}</g>` : ''}
    <path d="${GP}" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`;
}

function seal(cls = '') {
  const year = (C.date || '').slice(0, 4) || new Date().getFullYear();
  return `<svg class="seal ${cls}" viewBox="0 0 200 200" aria-hidden="true">
    <defs><path id="seal-top" d="M30 100a70 70 0 0 1 140 0"/><path id="seal-bot" d="M23 100a77 77 0 0 0 154 0"/></defs>
    <circle cx="100" cy="100" r="95" class="s1"/><circle cx="100" cy="100" r="89" class="s2"/><circle cx="100" cy="100" r="55" class="s2"/>
    <text class="st"><textPath href="#seal-top" startOffset="50%" text-anchor="middle">ERASMUS</textPath></text>
    <text class="st sm"><textPath href="#seal-bot" startOffset="50%" text-anchor="middle">BIERVERKOSTUNG</textPath></text>
    <circle cx="22" cy="100" r="2.6" class="dot"/><circle cx="178" cy="100" r="2.6" class="dot"/>
    <g transform="translate(82 62) scale(.9)"><path d="${GP}" class="gl"/><path d="M9.5 17h21" class="gl"/></g>
    <text x="100" y="138" text-anchor="middle" class="sy">${year}</text>
  </svg>`;
}

function bigGlass(d) {
  const col = d.srm ? srmOf(d.srm)[1] : null;
  const fh = (HEAD.find(h => h[0] === d.head) || [0, 0, 8])[2];
  const haze = { hazy: .18, cloudy: .34 }[d.clarity] || 0, top = 44;
  let foam = '';
  if (col && fh) {
    foam = `<rect x="0" y="${top - fh}" width="120" height="${fh + 2}" fill="#f6efe2"/>`;
    for (let x = 24; x <= 96; x += 9) foam += `<circle cx="${x}" cy="${top - fh}" r="${4 + (x % 3)}" fill="#f6efe2"/>`;
  }
  let bubbles = '';
  if (col) [[44, 0], [58, 1.2], [70, .5], [80, 1.9], [52, 2.6], [64, 3.3]].forEach(([x, dl]) => {
    bubbles += `<circle class="bub" cx="${x}" cy="150" r="1.5" style="animation-delay:${dl}s"/>`;
  });
  const path = 'M24 12h72l-8 140a8 8 0 0 1-8 7.5H40a8 8 0 0 1-8-7.5z';
  return `<svg class="bigglass" viewBox="0 0 120 170" aria-hidden="true">
    <defs><clipPath id="bg-clip"><path d="${path}"/></clipPath></defs>
    ${col ? `<g clip-path="url(#bg-clip)">
      <rect x="0" y="${top}" width="120" height="130" fill="${col}"/>
      ${haze ? `<rect x="0" y="${top}" width="120" height="130" fill="#fff6dc" opacity="${haze}"/>` : ''}
      ${bubbles}${foam}
      <rect x="34" y="20" width="7" height="125" fill="#fff" opacity=".18"/>
    </g>` : ''}
    <path d="${path}" fill="none" stroke="#e9dcc6" stroke-width="3" stroke-linejoin="round"/>
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

const shead = (kicker, title) => `<div class="shead">${kicker ? `<p class="kicker">${kicker}</p>` : ''}<h2>${title}</h2></div>`;

/* ---------- Ansichten ---------- */

function render() {
  const app = $('#app');
  document.body.classList.toggle('dark', !S.me);
  if (!S.me) { app.innerHTML = viewWelcome(); return; }
  const view = { beers: viewBeers, rank: viewRank, group: viewGroup, more: viewMore }[ui.tab] || viewBeers;
  app.innerHTML = `${view()}
    <nav class="tabs">${TABS.map(([k, n]) => `<button data-tab="${k}" class="${ui.tab === k ? 'on' : ''}"><svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[k]}</svg><span>${n}</span></button>`).join('')}</nav>`;
}

function viewWelcome() {
  return `<main class="welcome">
    ${seal('big')}
    ${C.date ? `<p class="kicker light">${fmtDate(C.date)}</p>` : ''}
    <h1 class="spaced">${esc(C.title)}</h1>
    ${ui.pending ? '<p class="note">Du hast einen geteilten Link geöffnet. Er wird übernommen, sobald du deinen Namen eingegeben hast.</p>' : ''}
    <div class="form join">
      <label>Dein Name<input id="w-name" maxlength="24" autocomplete="given-name" placeholder="z. B. Sofia"></label>
      <button class="btn primary big" data-act="start">Los geht’s</button>
    </div>
  </main>`;
}

function marquee() {
  const codes = new Set([S.me?.country, ...Object.values(S.others).map(o => o.country), ...beersList().map(b => b.country)].filter(hasCountry));
  let words = [...new Set([...codes].map(c => cheers(c)))];
  if (words.length < 5) words = [...new Set(words.concat(['Prost!', 'Skål!', '¡Salud!', 'Cin cin!', 'Santé!', 'Na zdrowie!', 'Kippis!', 'Şerefe!']))];
  const line = words.map((w, i) => `<span class="c${i % 5}">${esc(w)}</span>`).join('<i>·</i>');
  return `<div class="marquee" aria-hidden="true"><div>${line}<i>·</i>${line}<i>·</i></div></div>`;
}

function boardHTML(L) {
  if (!L.length) return '';
  const size = Math.max(20, Math.min(34, Math.floor(300 / L.length) - 6));
  return `<div class="board" style="--gw:${size}px">
    <div class="glasses">${L.map(b => {
      const r = S.ratings[b.id];
      return `<span class="slot ${r ? 'on' : ''}">${glass(r ? (r.srm || beerSrm(b.id) || 6) : null, r?.head)}<i>${numOf(b.id)}</i></span>`;
    }).join('')}</div>
    <div class="plank"></div>
  </div>`;
}

function viewBeers() {
  const L = beersList(), rated = L.filter(b => S.ratings[b.id]).length;
  const lands = new Set(L.map(b => b.country).filter(hasCountry)).size;
  return `<header class="hero">
      <div class="hero-in">
        ${seal()}
        ${C.date ? `<p class="kicker light">${fmtDate(C.date)}</p>` : ''}
        <h1 class="spaced">${esc(C.title)}</h1>
        ${boardHTML(L)}
        <p class="board-cap">${L.length ? `${rated} von ${L.length} verkostet${S.blind ? ' · blind' : ''}` : `Hallo ${esc(S.me.name)}`}</p>
      </div>
    </header>
    ${marquee()}
    <main>
      ${shead(L.length ? `${plural(L.length, 'Sorte', 'Sorten')}${lands ? ` · ${plural(lands, 'Land', 'Länder')}` : ''}` : '', 'Die Biere')}
      <div class="actions center">
        <button class="btn primary" data-act="add">Bier hinzufügen</button>
        ${L.length > rated ? '<button class="btn" data-act="surprise">Auslosen</button>' : ''}
      </div>
      ${L.length ? `<ul class="beers">${L.map(card).join('')}</ul>` : `<p class="empty">Noch keine Biere eingetragen. Name, Land und ein Foto der Flasche reichen.${C.firebase ? ' Alle anderen sehen neue Biere sofort.' : ' Danach teilst du die Liste unter „Gruppe“.'}</p>`}
    </main>`;
}

function swatch(b, rev) {
  const f = rev && foto(b.id), v = rev ? (S.ratings[b.id]?.srm || beerSrm(b.id)) : S.ratings[b.id]?.srm;
  const col = v ? srmOf(v)[1] : null;
  if (f) return `<div class="swatch photo"><img src="${f}" alt=""><span>${pad(numOf(b.id))}</span></div>`;
  return `<div class="swatch ${col ? '' : 'none'}" ${col ? `style="background:${col};color:${textOn(col)}"` : ''}><span>${pad(numOf(b.id))}</span></div>`;
}

function card(b) {
  const r = S.ratings[b.id], s = score(r), rev = revealed(b);
  const tag = rev ? [cName(b.country), b.style].filter((x, i) => i || hasCountry(b.country)).filter(Boolean).join(' · ') : 'Blind';
  const meta = rev ? [b.abv ? `${pct(b.abv)} %` : '', b.by ? `mitgebracht von ${esc(b.by)}` : ''].filter(Boolean).join(' · ') : 'Wird nach deiner Bewertung aufgedeckt';
  return `<li class="beer ${r ? 'done' : ''}" data-act="open" data-id="${b.id}">
    ${swatch(b, rev)}
    <div class="info">${tag ? `<span class="tag">${esc(tag)}</span>` : ''}<b>${esc(bname(b))}</b><small>${meta}</small></div>
    <div class="sc">${s != null ? `<strong>${fmt(s)}</strong><span>${label(s)}</span>` : '<span class="go">Bewerten</span>'}</div>
  </li>`;
}

function podium(list, kind) {
  const order = [list[1], list[0], list[2]];
  return `<div class="podium">${order.map((x, i) => x ? `
    <button class="pod p${[2, 1, 3][i]}" data-act="open" data-detail="1" data-id="${x.b.id}">
      ${glass(kind === 'mine' ? x.r.srm || 6 : beerSrm(x.b.id) || 6, kind === 'mine' ? x.r.head : null)}
      <b>${esc(bname(x.b))}</b><small>${fmt(x.s)}</small>
      <div class="block">${[2, 1, 3][i]}</div>
    </button>` : '<div class="pod empty"></div>').join('')}</div>`;
}

function rankRow(x, i, extra = '') {
  return `<li data-act="open" data-detail="1" data-id="${x.b.id}">
    <span class="rk">${pad(i + 1)}</span>
    <div class="info"><b>${esc(bname(x.b))}</b><small>${revealed(x.b) ? `${tflag(x.b.country)}${esc(cName(x.b.country))}${x.b.style ? ' · ' + esc(x.b.style) : ''}` : ''}</small>${extra}</div>
    <div class="sc"><strong>${fmt(x.s)}</strong><span>${label(x.s)}</span></div>
    <div class="bar"><i style="width:${Math.max(0, (x.s - 1) / 4 * 100)}%"></i></div>
  </li>`;
}

function champions(items) {
  return `<div class="champs">${CATS.map(c => {
    const best = items.filter(x => x.cat[c.k]).sort((a, b) => b.cat[c.k] - a.cat[c.k])[0];
    return `<div class="champ"><small>${c.best}</small><b>${best ? esc(bname(best.b)) : '–'}</b><span>${best ? fmt(best.cat[c.k]) : ''}</span></div>`;
  }).join('')}</div>`;
}

function weightsPanel() {
  const tot = CATS.reduce((s, c) => s + (S.weights[c.k] || 0), 0) || 1;
  return `<details class="panel weights">
    <summary>So wird der Wert berechnet</summary>
    <p>Dein Wert ist der gewichtete Mittelwert aller Kategorien, die du bewertet hast (1 bis 5). Mit den Reglern legst du fest, wie stark jede Kategorie zählt. Das Ranking aktualisiert sich beim Loslassen.</p>
    ${CATS.map(c => `<label class="wrow"><span>${c.n}</span><input type="range" min="0" max="40" step="5" value="${S.weights[c.k] || 0}" data-in="w" data-k="${c.k}"><em id="wv-${c.k}">${Math.round((S.weights[c.k] || 0) / tot * 100)} %</em></label>`).join('')}
    <button class="btn small" data-act="wReset">Zurück zum Standard</button>
  </details>`;
}

function viewRank() {
  const L = myRanked();
  if (!L.length) return `<main>${shead('', 'Mein Ranking')}<p class="empty">Noch nichts bewertet. Sobald du ein Bier bewertest, erscheint es hier.</p><div class="actions center"><button class="btn primary" data-tab="beers">Zu den Bieren</button></div></main>`;
  return `<main>${shead(`${plural(L.length, 'Bier', 'Biere')} bewertet`, 'Mein Ranking')}
    ${podium(L, 'mine')}
    <ol class="rank">${L.map((x, i) => rankRow(x, i)).join('')}</ol>
    <h3 class="rule">Kategoriesieger</h3>
    ${champions(L.map(x => ({ b: x.b, cat: x.r })))}
    ${weightsPanel()}
    <div class="actions"><button class="btn" data-act="img" data-mode="mine">Als Bild teilen</button></div></main>`;
}

function syncBox() {
  if (C.firebase) {
    const st = live.ok === null ? ['wait', 'Verbinde …'] : live.ok ? ['ok', `Live im Raum „${esc(ROOM)}“`] : ['bad', 'Keine Verbindung, neuer Versuch läuft'];
    return `<div class="panel sync"><p class="live ${st[0]}"><i></i>${st[1]}</p><p>Bewertungen und neue Biere werden alle paar Sekunden abgeglichen.</p>
      <div class="actions"><button class="btn small" data-act="invite">Mit QR-Code einladen</button></div></div>`;
  }
  return `<div class="panel sync">
    <p>Jedes Handy speichert seine eigenen Bewertungen. Zum Vergleichen schickst du deine Bewertungen als Link, zum Beispiel in eure Gruppe. Wer ihn öffnet, sieht dich in der Gruppenwertung. Der Link enthält auch deine Bierliste.</p>
    <div class="actions">
      <button class="btn primary small" data-act="shareMine">Bewertungen teilen</button>
      <button class="btn small" data-act="qrMine">Als QR-Code</button>
    </div>
    <label class="paste">Link bekommen? Hier einfügen<span><input id="paste" placeholder="https://…#d=…" autocomplete="off"><button class="btn small" data-act="importPaste">Übernehmen</button></span></label>
  </div>`;
}

function awards(T, rows) {
  const A = [];
  // Publikumsliebling nur unter Bieren, die mindestens die Hälfte der Personen bewertet hat
  const minVotes = Math.max(1, Math.ceil(Math.max(...rows.map(r => r.n)) / 2));
  const fav = rows.find(r => r.n >= minVotes);
  if (fav) A.push(['Publikumsliebling', bname(fav.b), `${fmt(fav.avg)} von ${plural(fav.n, 'Person', 'Personen')}`]);
  const con = rows.filter(r => r.n >= 2).sort((a, b) => b.sd - a.sd)[0];
  if (con && con.sd >= .25) {
    const v = con.sc.map(x => x.s);
    A.push(['Am umstrittensten', bname(con.b), `Werte von ${fmt(Math.min(...v))} bis ${fmt(Math.max(...v))}`]);
  }
  const love = rows.filter(r => r.n >= 2).sort((a, b) => a.sd - b.sd)[0];
  if (love && rows.length > 2 && love !== con) A.push(['Große Einigkeit', bname(love.b), `alle Werte innerhalb von ${fmt(Math.max(...love.sc.map(x => x.s)) - Math.min(...love.sc.map(x => x.s)))} Punkten`]);

  if (T.length >= 2) {
    const given = T.map(t => ({ t, v: beersList().map(b => score(t.ratings[b.id])).filter(x => x != null) })).filter(x => x.v.length >= 3)
      .map(x => ({ ...x, m: mean(x.v) })).sort((a, b) => a.m - b.m);
    if (given.length >= 2) {
      A.push(['Strengste Wertung', given[0].t.name, `vergibt im Schnitt ${fmt(given[0].m)}`]);
      A.push(['Mildeste Wertung', given[given.length - 1].t.name, `vergibt im Schnitt ${fmt(given[given.length - 1].m)}`]);
    }
    const nose = T.map(t => {
      const e = beersList().filter(b => b.abv && t.ratings[b.id]?.abv).map(b => Math.abs(t.ratings[b.id].abv - b.abv));
      return { t, n: e.length, m: e.length ? mean(e) : 99 };
    }).filter(x => x.n >= 2).sort((a, b) => a.m - b.m)[0];
    if (nose) A.push(['Beste Nase', nose.t.name, `schätzt den Alkohol im Schnitt auf ${fmt(nose.m)} Prozentpunkte genau`]);
    let twins = null;
    for (let i = 0; i < T.length; i++) for (let j = i + 1; j < T.length; j++) {
      const d = beersList().map(b => [score(T[i].ratings[b.id]), score(T[j].ratings[b.id])]).filter(([a, b]) => a != null && b != null).map(([a, b]) => Math.abs(a - b));
      if (d.length >= 3 && (!twins || mean(d) < twins.m)) twins = { a: T[i], b: T[j], m: mean(d) };
    }
    if (twins) A.push(['Geschmackszwillinge', `${twins.a.name} & ${twins.b.name}`, `im Schnitt nur ${twins.m.toFixed(2).replace('.', ',')} Punkte auseinander`]);
    const pat = T.filter(t => hasCountry(t.country)).map(t => {
      const own = [], other = [];
      for (const b of beersList()) { const s = score(t.ratings[b.id]); if (s == null) continue; (b.country === t.country ? own : other).push(s); }
      return own.length && other.length ? { t, d: mean(own) - mean(other) } : null;
    }).filter(Boolean).sort((a, b) => b.d - a.d)[0];
    if (pat && pat.d >= .3) A.push(['Lokalpatriotismus', pat.t.name, `bewertet Biere aus der Heimat ${fmt(pat.d)} Punkte besser`]);
  }
  return A.length ? `<h3 class="rule">Auszeichnungen</h3><div class="awards">${A.map(([t, w, d]) => `<div class="award"><span class="ribbon">${t}</span><b>${esc(w)}</b><small>${esc(d)}</small></div>`).join('')}</div>` : '';
}

function countryCup(rows) {
  const by = {};
  for (const r of rows) if (revealed(r.b)) (by[r.b.country || 'XX'] ||= []).push(r.avg);
  const list = Object.entries(by).map(([c, v]) => ({ c, m: mean(v), n: v.length })).sort((a, b) => b.m - a.m);
  if (list.length < 2) return '';
  return `<h3 class="rule">Länderwertung</h3><ol class="cup">${list.map((x, i) => `<li><span class="rk">${pad(i + 1)}</span><span class="nm">${tflag(x.c)}${esc(cName(x.c))}<small>${plural(x.n, 'Bier', 'Biere')}</small></span><span class="bar"><i style="width:${(x.m - 1) / 4 * 100}%"></i></span><b>${fmt(x.m)}</b></li>`).join('')}</ol>`;
}

function viewGroup() {
  const { T, rows } = groupStats();
  const all = [{ id: S.me.id, name: S.me.name, country: S.me.country, ratings: S.ratings, me: true }, ...Object.values(S.others)];
  const total = T.reduce((s, t) => s + Object.keys(t.ratings || {}).filter(id => S.beers[id] && !S.beers[id].del).length, 0);
  const chips = all.map(t => {
    const n = Object.keys(t.ratings || {}).filter(id => S.beers[id] && !S.beers[id].del).length, off = S.hidden[t.id];
    return `<button class="chip ${off ? '' : 'on'}" ${t.me ? 'disabled' : `data-act="toggleT" data-id="${t.id}"`}>${tflag(t.country)}${esc(t.name)}${t.me ? ' (du)' : ''} · ${n}</button>`;
  }).join('');
  return `<main>${shead(`${plural(T.length, 'Person', 'Personen')} · ${plural(total, 'Bewertung', 'Bewertungen')}`, 'Gruppe')}
    ${syncBox()}
    <h3 class="rule">Dabei${Object.keys(S.others).length ? '<small>Antippen, um jemanden auszublenden</small>' : ''}</h3>
    <div class="chips">${chips}</div>
    ${rows.length ? `
      <h3 class="rule">Gesamtwertung</h3>
      ${podium(rows.map(r => ({ b: r.b, s: r.avg })), 'group')}
      <ol class="rank group">${rows.map((r, i) => rankRow({ b: r.b, s: r.avg }, i, `<div class="spread">${strip(r)}<em>${plural(r.n, 'Stimme', 'Stimmen')}</em></div>`)).join('')}</ol>
      <p class="hint">Punkte: Wert jeder Person, deiner in Kupfer. Strich: Gruppenschnitt.</p>
      ${awards(T, rows)}
      ${countryCup(rows)}
      <h3 class="rule">Kategoriesieger</h3>
      ${champions(rows.map(r => ({ b: r.b, cat: r.cat })))}
      <div class="actions"><button class="btn" data-act="img" data-mode="group">Gruppenranking als Bild</button><button class="btn" data-act="csv">Tabelle (CSV)</button></div>`
    : `<p class="empty">Noch keine Wertungen. Sobald jemand ein Bier bewertet, erscheint hier die Gruppenwertung.</p>`}</main>`;
}

function viewMore() {
  return `<main>${shead('', 'Mehr')}
    <div class="panel form">
      <h3>Dein Profil</h3>
      <label>Name<input id="p-name" maxlength="24" value="${esc(S.me.name)}"></label>
      <label>Herkunftsland (optional)<select id="p-country">${countryOptions(hasCountry(S.me.country) ? S.me.country : '', 'Keine Angabe')}</select></label>
      <button class="btn small" data-act="saveProfile">Profil speichern</button>
    </div>
    <div class="panel">
      <h3>Blindverkostung</h3>
      <label class="switch"><input type="checkbox" id="blind" ${S.blind ? 'checked' : ''}><span></span>Namen, Länder und Fotos verbergen, bis du ein Bier bewertet hast</label>
      <p class="hint">Für nummerierte Gläser: Wer ein Bier mitgebracht hat, schenkt es als „Bier 03“ aus. Im Blindmodus schätzt du außerdem den Alkoholgehalt. Wer am genauesten schätzt, bekommt die Auszeichnung „Beste Nase“.</p>
    </div>
    <div class="panel">
      <h3>Freunde einladen</h3>
      <p>Die anderen scannen den QR-Code und landen auf dieser Seite.</p>
      <div class="actions"><button class="btn small" data-act="invite">QR-Code zeigen</button><button class="btn small" data-act="inviteCopy">Link kopieren</button></div>
    </div>
    <div class="panel">
      <h3>Export und Sicherung</h3>
      <div class="actions col">
        <button class="btn small" data-act="csv">Tabelle mit allen Bewertungen (CSV für Excel)</button>
        <button class="btn small" data-act="img" data-mode="mine">Mein Ranking als Bild</button>
        <button class="btn small" data-act="img" data-mode="group">Gruppenranking als Bild</button>
        <button class="btn small" data-act="backup">Komplette Sicherung mit Fotos (JSON)</button>
        <label class="btn small">Sicherung wiederherstellen<input type="file" id="restore" accept="application/json,.json" hidden></label>
      </div>
    </div>
    <div class="panel">
      <h3>Neu anfangen</h3>
      <p class="hint">Löscht alle Biere, Bewertungen und Fotos auf diesem Handy.</p>
      <button class="btn small danger" data-act="reset">Alles löschen</button>
    </div>
    <p class="foot">${esc(C.title)} · Die Daten bleiben auf deinem Handy${C.firebase ? ' und im gemeinsamen Raum' : ''}</p></main>`;
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
const shHead = (kicker, title, sub = '') => `<div class="sh-head"><div>${kicker ? `<p class="kicker">${kicker}</p>` : ''}<h2>${title}</h2>${sub}</div><button class="x" data-act="close" aria-label="Schließen"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>`;
const beerMeta = (b, by) => `<p class="meta">${[hasCountry(b.country) ? `${flag(b.country)} ${esc(cName(b.country))}` : '', esc(b.style), b.abv ? `${pct(b.abv)} %` : ''].filter(Boolean).join(' · ')}${b.brewery ? '<br>' + esc(b.brewery) : ''}${by && b.by ? `<br>mitgebracht von ${esc(b.by)}` : ''}</p>`;

function sheetBeer() {
  const s = ui.sheet, b = s.id ? S.beers[s.id] : { by: S.me.name, country: hasCountry(S.me.country) ? S.me.country : '' };
  const f = s.photo || (!s.rm && s.id && foto(s.id));
  const names = [...new Set([S.me.name, ...Object.values(S.others).map(o => o.name), ...beersList().map(x => x.by)].filter(Boolean))];
  return `${shHead('', s.id ? 'Bier bearbeiten' : 'Bier hinzufügen')}
    <div class="form pad">
      <div class="photo"><div id="b-prev" class="prev">${f ? `<img src="${f}" alt="">` : glass(null)}</div>
        <div class="col"><label class="btn small">${f ? 'Foto ändern' : 'Foto hinzufügen'}<input type="file" id="b-photo" accept="image/*" hidden></label>
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

function scaleRow(c, d) {
  const v = d[c.k] || 0;
  return `<div class="cat">
    <div class="cat-h"><h4>${c.n}</h4><em>${v ? fmtHalf(v) : ''}</em></div>
    <p class="q">${c.q}</p>
    <div class="scale">${[1, 2, 3, 4, 5].map(i => `<button class="seg ${v >= i ? 'full' : v >= i - .5 ? 'half' : ''}" data-act="mug" data-k="${c.k}" data-v="${i}" aria-label="${i} von 5">${i}</button>`).join('')}</div>
  </div>`;
}

function sheetRate() {
  const s = ui.sheet, b = S.beers[s.id], d = s.draft, rev = revealed(b), sc = score(d);
  const done = CATS.filter(c => d[c.k]).length;
  const cat = k => scaleRow(CATS.find(c => c.k === k), d);
  return `${shHead(`Bier ${pad(numOf(b.id))}`, esc(bname(b)), rev ? beerMeta(b) : '<p class="meta">Blindverkostung: Die Auflösung kommt nach dem Speichern.</p>')}
    <div class="stage">
      <div class="stage-l">${rev && b.abv ? `<strong>${pct(b.abv)}<small>%</small></strong>` : '<strong>?</strong>'}<span>${esc(rev ? cheers(b.country) : 'Prost!')}</span></div>
      ${bigGlass(d)}
    </div>
    <div class="pad">
    <section class="blk">
      <h3 class="rule">Optik</h3>
      <div class="srm">${SRM.map(x => `<button class="sw ${d.srm === x[0] ? 'on' : ''}" style="--c:${x[1]}" data-act="srm" data-v="${x[0]}" aria-label="${x[2]}"></button>`).join('')}</div>
      <p class="srm-name">${d.srm ? `${srmOf(d.srm)[2]} · SRM ${d.srm}` : 'Wähl den Farbton, der deinem Glas am nächsten kommt.'}</p>
      <div class="opt"><span>Schaum</span><div class="chips">${HEAD.map(h => `<button class="chip ${d.head === h[0] ? 'on' : ''}" data-act="head" data-v="${h[0]}">${h[1]}</button>`).join('')}</div></div>
      <div class="opt"><span>Klarheit</span><div class="chips">${CLARITY.map(h => `<button class="chip ${d.clarity === h[0] ? 'on' : ''}" data-act="clarity" data-v="${h[0]}">${h[1]}</button>`).join('')}</div></div>
      ${cat('look')}
      <p class="hint">Zweimal auf dieselbe Zahl tippen gibt einen halben Punkt weniger.</p>
    </section>
    <section class="blk">
      <h3 class="rule">Geruch und Geschmack</h3>
      ${cat('aroma')}${cat('taste')}
      <h4 class="mt">Aromen</h4>
      <div class="chips notes">${NOTES.map((n, i) => `<button class="chip ${d.notes.includes(i) ? 'on' : ''}" data-act="note" data-v="${i}">${n}</button>`).join('')}</div>
    </section>
    <section class="blk">
      <h3 class="rule">Eindruck</h3>
      ${cat('finish')}${cat('drink')}${cat('overall')}
    </section>
    ${!rev ? `<section class="blk"><h3 class="rule">Alkohol schätzen</h3><p class="q">Wer am genauesten schätzt, bekommt die Auszeichnung „Beste Nase“.</p>
      <div class="abvguess"><input type="range" min="0" max="12" step="0.1" value="${d.abv || 5}" data-in="abv"><output id="abv-out">${fmt(d.abv || 5)} %</output></div></section>` : ''}
    <section class="blk"><h3 class="rule">Notizen</h3><textarea data-in="text" maxlength="300" rows="3" placeholder="Was willst du dir merken?">${esc(d.text)}</textarea></section>
    </div>
    <div class="savebar">
      <div class="live-score"><strong>${fmt(sc)}</strong><span>${sc != null ? label(sc) : 'Noch keine Wertung'}<br><small>${done} von 6 Kategorien</small></span></div>
      <button class="btn primary" data-act="saveRating">Speichern</button>
    </div>`;
}

function sheetDetail() {
  const b = S.beers[ui.sheet.id], rev = revealed(b), my = S.ratings[b.id], f = rev && foto(b.id);
  const { rows } = groupStats(), row = rows.find(r => r.b.id === b.id);
  const others = row ? row.sc.filter(x => !x.t.me) : [];
  const ms = score(my);
  const v = rev ? beerSrm(b.id) : my?.srm, col = v ? srmOf(v)[1] : '#3a2b22', ink = textOn(col);
  const noteCount = {};
  if (row) row.sc.forEach(x => (x.r.notes || []).forEach(n => { noteCount[n] = (noteCount[n] || 0) + 1; }));
  const topNotes = Object.entries(noteCount).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const headTag = HEAD.find(h => h[0] === my?.head)?.[3];
  const main = ms != null ? ['Deine Wertung', ms] : row ? ['Gruppe', row.avg] : null;
  return `${shHead(`Bier ${pad(numOf(b.id))}`, esc(bname(b)), rev ? beerMeta(b, true) : '')}
    <div class="pad">
    <div class="tile" style="background:${col};color:${ink}">
      <div class="tile-l"><small>${main ? main[0] : 'Noch nicht bewertet'}</small><strong>${main ? fmt(main[1]) : '–'}</strong><span>${main ? label(main[1]) : ''}</span>
        ${row && ms != null && others.length ? `<em>Gruppe ${fmt(row.avg)} · ${plural(row.n, 'Stimme', 'Stimmen')}</em>` : ''}</div>
      ${f ? `<img src="${f}" alt="">` : ''}
    </div>
    ${my || row ? radar(my, others.length ? row.cat : (!my ? row?.cat : null)) : ''}
    ${my ? `<table class="breakdown">${CATS.map(c => `<tr><th>${c.n}</th><td>${my[c.k] ? fmtHalf(my[c.k]) : '–'}</td>${others.length ? `<td class="g">${fmt(row.cat[c.k])}</td>` : ''}</tr>`).join('')}
      ${others.length ? '<tr class="lg"><th></th><td>du</td><td class="g">Gruppe</td></tr>' : ''}</table>` : ''}
    ${my ? `<div class="mynotes">
      ${my.srm ? `<span class="tagline"><i style="background:${srmOf(my.srm)[1]}"></i>${srmOf(my.srm)[2]}</span>` : ''}
      ${headTag ? `<span class="tagline">${headTag}</span>` : ''}
      ${my.clarity ? `<span class="tagline">${CLARITY.find(h => h[0] === my.clarity)?.[1]}</span>` : ''}
      ${(my.notes || []).map(n => `<span class="tagline">${NOTES[n] || ''}</span>`).join('')}
      ${my.abv && b.abv ? `<span class="tagline">Geschätzt ${fmt(my.abv)} %, tatsächlich ${pct(b.abv)} %</span>` : ''}
      ${my.text ? `<p class="quote">„${esc(my.text)}“</p>` : ''}</div>` : ''}
    ${topNotes.length && others.length ? `<h3 class="rule">Aromen der Gruppe</h3><div class="chips">${topNotes.map(([n, k]) => `<span class="chip on">${NOTES[n]} · ${k}</span>`).join('')}</div>` : ''}
    ${others.length ? `<h3 class="rule">Die anderen</h3><ul class="others">${others.sort((a, b) => b.s - a.s).map(x => `<li><span>${tflag(x.t.country)}${esc(x.t.name)}</span><b>${fmt(x.s)}</b>${rev && x.r.text ? `<p>„${esc(x.r.text)}“</p>` : ''}</li>`).join('')}</ul>` : ''}
    <div class="actions col">
      <button class="btn primary" data-act="rate" data-id="${b.id}">${my ? 'Bewertung ändern' : 'Dieses Bier bewerten'}</button>
      ${rev ? `<button class="btn small" data-act="editBeer" data-id="${b.id}">Angaben zum Bier bearbeiten</button>` : ''}
    </div>
    </div>`;
}

function sheetReveal() {
  const b = S.beers[ui.sheet.id], r = S.ratings[b.id], s = score(r), f = foto(b.id);
  const guess = r.abv && b.abv ? `<p class="guess">Deine Schätzung ${fmt(r.abv)} %, tatsächlich ${pct(b.abv)} %</p>` : '';
  return `<div class="reveal">
    <button class="x" data-act="close" aria-label="Schließen"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
    <p class="kicker light">Bier ${pad(numOf(b.id))} war</p>
    ${f ? `<img src="${f}" alt="">` : glass(r.srm || 6, r.head)}
    <h2 class="spaced">${esc(b.name)}</h2>
    ${beerMeta(b, true)}
    ${guess}
    <p class="you"><strong>${fmt(s)}</strong><span>${label(s)}</span></p>
    <p class="cheers">${esc(cheers(b.country))}</p>
    <div class="actions center">${beersList().some(x => !S.ratings[x.id]) ? '<button class="btn primary" data-act="surprise">Nächstes Bier</button>' : ''}<button class="btn light" data-act="close">Fertig</button></div>
  </div>`;
}

function sheetQR() {
  const s = ui.sheet, code = window.QR ? QR.svg(s.text) : null;
  return `${shHead('', esc(s.title))}
    <div class="pad">
    <div class="qr">${code || '<p>Zu viele Daten für einen QR-Code. Bitte stattdessen „Teilen“ nutzen.</p>'}</div>
    <p class="hint center">${esc(s.hint || '')}</p>
    <div class="actions center"><button class="btn" data-act="copyQR">Link kopieren</button>${navigator.share ? '<button class="btn" data-act="shareQR">Teilen</button>' : ''}</div>
    </div>`;
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
    if (!name) { toast('Bitte gib deinen Namen ein'); $('#w-name').focus(); return; }
    S.me = { id: rid(), name, country: '' };
    save(); render();
    if (ui.pending) { const p = ui.pending; ui.pending = null; importData(p); }
    else toast(`Willkommen, ${name}`);
  },
  add() { openSheet({ type: 'beer' }); },
  open(el) { openBeer(el.dataset.id, el.dataset.detail === '1'); },
  rate(el) { startRate(el.dataset.id); },
  editBeer(el) { openSheet({ type: 'beer', id: el.dataset.id }); },
  close() { closeSheet(); },
  surprise() {
    const open = beersList().filter(b => !S.ratings[b.id]);
    if (!open.length) { toast('Du hast alle Biere bewertet'); return; }
    const b = open[Math.floor(Math.random() * open.length)];
    startRate(b.id);
    toast(`Als Nächstes: Bier ${pad(numOf(b.id))}`);
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
    if (!CATS.some(c => d[c.k])) { toast('Bewerte zuerst mindestens eine Kategorie'); return; }
    const wasRevealed = revealed(b);
    if (!wasRevealed && d.abv == null) d.abv = 5;
    S.ratings[b.id] = { ...d, at: Date.now() };
    save(); render();
    if (!wasRevealed) { openSheet({ type: 'reveal', id: b.id }); return; }
    closeSheet();
    toast(`${cheers(b.country)} Gespeichert.`);
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
  if (t.id === 'blind') { S.blind = t.checked; persist(); render(); toast(S.blind ? 'Blindmodus an' : 'Blindmodus aus'); }
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
  const lines = [['Person', 'Herkunft', 'Bier Nr.', 'Bier', 'Brauerei', 'Land', 'Stil', 'Alkohol %', 'Mitgebracht von', ...CATS.map(c => c.n),
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
  const top = list.slice(0, 10), W = 1080, rowH = 100, H = 420 + top.length * rowH + 130;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d');
  try { await Promise.all(['600 64px Oswald', '400 30px "Source Sans 3"', '700 30px "Source Sans 3"'].map(f => document.fonts.load(f))); } catch (e) { /* Ersatzschriften */ }
  const DISP = 'Oswald, "Arial Narrow", sans-serif', SANS = '"Source Sans 3", Arial, sans-serif';
  const fit = (t, max) => { if (x.measureText(t).width <= max) return t; while (t.length > 1 && x.measureText(t + '…').width > max) t = t.slice(0, -1); return t + '…'; };
  const spaced = (t, px) => { x.letterSpacing = px; };
  // Kopf in dunklem Holz
  const g = x.createLinearGradient(0, 0, 0, 320); g.addColorStop(0, '#2a1d15'); g.addColorStop(1, '#17110d');
  x.fillStyle = g; x.fillRect(0, 0, W, 320);
  x.fillStyle = 'rgba(0,0,0,.25)'; for (let xx = 0; xx < W; xx += 72) x.fillRect(xx, 0, 2, 320);
  const glow = x.createRadialGradient(W / 2, -40, 10, W / 2, -40, 520); glow.addColorStop(0, 'rgba(255,180,90,.35)'); glow.addColorStop(1, 'rgba(255,180,90,0)');
  x.fillStyle = glow; x.fillRect(0, 0, W, 320);
  x.fillStyle = '#efe7da'; x.fillRect(0, 320, W, H - 320);
  x.textAlign = 'center';
  x.fillStyle = '#d08a4a'; x.font = `500 26px ${DISP}`; spaced(0, '6px');
  x.fillText((C.date ? fmtDate(C.date) : '').toUpperCase(), W / 2, 110);
  x.fillStyle = '#f6efe2'; x.font = `500 64px ${DISP}`; spaced(0, '10px');
  x.fillText(fit((C.title || 'Bierverkostung').toUpperCase(), W - 120), W / 2, 195);
  x.fillStyle = '#c9b8a0'; x.font = `400 30px ${SANS}`; spaced(0, '0px');
  x.fillText(group ? `Gruppenranking · ${plural(tasters().length, 'Person', 'Personen')}` : `Ranking von ${S.me.name}`, W / 2, 255);
  x.fillStyle = '#b5652b'; x.fillRect(0, 316, W, 4);
  top.forEach((it, i) => {
    const y = 370 + i * rowH;
    x.textAlign = 'left'; x.fillStyle = i < 3 ? '#b5652b' : '#9a8878'; x.font = `600 46px ${DISP}`;
    x.fillText(pad(i + 1), 70, y + 50);
    const col = it.v ? srmOf(it.v)[1] : '#cdbfa9';
    x.fillStyle = col; x.fillRect(160, y + 4, 54, 62);
    x.textAlign = 'left'; x.fillStyle = '#241a14'; x.font = `500 38px ${DISP}`;
    x.fillText(fit(bname(it.b).toUpperCase(), 600), 240, y + 32);
    x.font = `400 26px ${SANS}`; x.fillStyle = '#7d6b5d';
    const sub = revealed(it.b) ? [hasCountry(it.b.country) ? cName(it.b.country) : '', it.b.style, it.n ? plural(it.n, 'Stimme', 'Stimmen') : ''].filter(Boolean).join(' · ') : '';
    x.fillText(fit(sub, 600), 240, y + 66);
    x.textAlign = 'right'; x.fillStyle = '#241a14'; x.font = `600 54px ${DISP}`; x.fillText(fmt(it.s), W - 70, y + 54);
    x.fillStyle = 'rgba(36,26,20,.15)'; x.fillRect(70, y + 86, W - 140, 1);
  });
  x.textAlign = 'center'; x.font = `500 28px ${DISP}`; spaced(0, '4px');
  const words = [...new Set(top.filter(t => hasCountry(t.b.country)).map(t => cheers(t.b.country)))].slice(0, 4);
  const cols = ['#b5652b', '#ad7a1c', '#9e1b10', '#2f5e2a'];
  const line = words.length ? words : ['Prost!'];
  const widths = line.map(w => x.measureText(w.toUpperCase()).width), gap = 40, total = widths.reduce((a, b) => a + b, 0) + gap * (line.length - 1);
  let cx = (W - total) / 2; x.textAlign = 'left';
  line.forEach((w, i) => { x.fillStyle = cols[i % cols.length]; x.fillText(w.toUpperCase(), cx, H - 60); cx += widths[i] + gap; });
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
