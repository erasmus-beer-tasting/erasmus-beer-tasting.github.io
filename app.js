'use strict';
/* Erasmus-Bierverkostung
   Anmelden mit Namen, Biere eintragen, bewerten, Ergebnisse vergleichen.
   Abgleich zwischen den Handys live über Firebase (falls eingerichtet) oder per Link. */

const C = window.CONFIG || {};
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------- Inhalte ---------- */

const ASPECTS = [
  { k: 'a', n: 'Aussehen', best: 'Bestes Aussehen', q: 'Farbe, Klarheit und Schaum.' },
  { k: 'r', n: 'Geruch', best: 'Bester Geruch', q: 'Leicht schwenken, dann riechen.' },
  { k: 'g', n: 'Geschmack', best: 'Bester Geschmack', q: 'Malz, Hopfen, Süße, Bitterkeit.' },
  { k: 'n', n: 'Nachgeschmack', best: 'Bester Nachgeschmack', q: 'Was bleibt nach dem Schlucken?' },
  { k: 'd', n: 'Drinkability', best: 'Beste Drinkability', q: 'Wie leicht trinkt es sich?' }
];
// Index = Anzahl Sterne (1 bis 5)
const FAZIT = ['Nie wieder', 'Nie wieder', 'Eher nicht', 'Kann man trinken', 'Richtig gut', 'Wird eins meiner Favoriten'];
const FILTERS = [['total', 'Gesamt'], ...ASPECTS.map(a => [a.k, a.n]), ['f', 'Fazit']];
const STYLES = ['Pils', 'Helles', 'Lager', 'Weizen', 'Dunkel', 'Bock', 'Märzen', 'Kölsch', 'Altbier', 'Pale Ale', 'IPA', 'Stout', 'Porter',
  'Witbier', 'Tripel', 'Dubbel', 'Saison', 'Sauerbier', 'Fruchtbier', 'Radler', 'Alkoholfrei'];
const CHEERS = [['Prost!', 'Deutsch'], ['Skål!', 'Schwedisch'], ['¡Salud!', 'Spanisch'], ['Santé!', 'Französisch'], ['Cin cin!', 'Italienisch'],
  ['Na zdrowie!', 'Polnisch'], ['Na zdraví!', 'Tschechisch'], ['Proost!', 'Niederländisch'], ['Kippis!', 'Finnisch'], ['Saúde!', 'Portugiesisch'],
  ['Şerefe!', 'Türkisch'], ['Yamas!', 'Griechisch'], ['Sláinte!', 'Irisch'], ['Egészségedre!', 'Ungarisch'], ['Cheers!', 'Englisch'],
  ['Kanpai!', 'Japanisch'], ['Terviseks!', 'Estnisch'], ['Noroc!', 'Rumänisch'], ['Živjeli!', 'Kroatisch'], ['Skál!', 'Isländisch']];

/* ---------- Zustand ---------- */

const KEY = 'bv-state-1', PK = 'bv-photo-', TK = 'bv-tab';
const emptyDb = () => ({ beers: {}, ratings: {}, users: {} });
let S;
try { S = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { S = {}; }
S = { me: S.me || null, db: Object.assign(emptyDb(), S.db || {}) };
const ui = { tab: localStorage.getItem(TK) || 'beers', sel: null, draft: null, mode: 'all', filter: 'total', sheet: null, pending: null, cheer: 0, dirty: false };

function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('Der Speicher ist voll'); }
}

/* ---------- Hilfsfunktionen ---------- */

const rid = () => Math.random().toString(36).slice(2, 10);
const mean = a => a.reduce((s, x) => s + x, 0) / a.length;
const fmt = x => x == null || isNaN(x) ? '–' : x.toFixed(1).replace('.', ',');
const pct = x => String(x).replace('.', ',');
const pad = n => String(n).padStart(2, '0');
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const cheer = () => CHEERS[ui.cheer][0];

const beers = () => Object.entries(S.db.beers || {}).filter(([, b]) => b && !b.del && b.name)
  .map(([id, b]) => ({ ...b, id })).sort((a, b) => (a.at || 0) - (b.at || 0) || a.id.localeCompare(b.id));
const beer = id => { const b = S.db.beers?.[id]; return b && !b.del ? { ...b, id } : null; };
const numOf = id => beers().findIndex(b => b.id === id) + 1;
const mine = id => S.me ? S.db.ratings?.[id]?.[S.me.id] || null : null;
const userName = uid => S.db.users?.[uid]?.name || 'Gast';
const isNum = v => typeof v === 'number' && !isNaN(v);
const aspAvg = r => { const v = ASPECTS.map(a => r?.[a.k]).filter(isNum); return v.length ? mean(v) : null; };
const val = (r, f) => f === 'total' ? aspAvg(r) : isNum(r?.[f]) ? r[f] : null;

function ratingsOf(id, mode = 'all') {
  const all = Object.entries(S.db.ratings?.[id] || {}).filter(([, r]) => r && typeof r === 'object');
  return mode === 'me' ? all.filter(([u]) => u === S.me?.id) : all;
}

function rows(filter, mode) {
  return beers().map(b => {
    const vals = ratingsOf(b.id, mode).map(([, r]) => val(r, filter)).filter(isNum);
    if (!vals.length) return null;
    const v = mean(vals);
    return { b, v, n: vals.length, vals, sd: Math.sqrt(mean(vals.map(x => (x - v) ** 2))) };
  }).filter(Boolean).sort((x, y) => y.v - x.v || y.n - x.n);
}

/* ---------- Grafik ---------- */

const ICON = {
  list: '<path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
  glass: '<path d="M7 3h10c0 7-1.6 10.5-5 12-3.4-1.5-5-5-5-12z"/><path d="M12 15v5M8.5 21h7M7.3 6.5h9.4"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8.5 20h7M10 17h4v3h-4z"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  sync: '<path d="M4.5 11a7.5 7.5 0 0 1 13-4.2L19.5 9M19.5 4.5V9H15M19.5 13a7.5 7.5 0 0 1-13 4.2L4.5 15M4.5 19.5V15H9"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>'
};
const svgIcon = (k, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICON[k]}</svg>`;
const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4L2.8 9.5l6.4-.8z"/></svg>';
const GOBLET = '<svg class="goblet" viewBox="0 0 60 72" aria-hidden="true"><path d="M14 8H46C46 30 41 40 30 44C19 40 14 30 14 8Z" fill="#dc9a45"/><path d="M14 8H46C46 11.5 45.9 14.5 45.6 17H14.4C14.1 14.5 14 11.5 14 8Z" fill="#f6efe2"/><path d="M14 8H46C46 30 41 40 30 44C19 40 14 30 14 8ZM30 44V64M19 66H41" fill="none" stroke="#291c15" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/></svg>';
const CUP = '<svg class="cup-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h11v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z"/><path d="M16 10h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2M5 7c0-2 1.5-3 3-2.5C9 3 11.5 3 12.5 4.5 14 4 16 5 16 7"/></svg>';

const WHEAT = (() => {
  let s = '<path d="M30 196C30 150 30 90 30 26"/>';
  for (let i = 0; i < 8; i++) {
    const y = 40 + i * 19;
    s += `<ellipse cx="21" cy="${y}" rx="5" ry="11" transform="rotate(-30 21 ${y})"/><ellipse cx="39" cy="${y}" rx="5" ry="11" transform="rotate(30 39 ${y})"/>`;
  }
  return s + '<ellipse cx="30" cy="20" rx="5" ry="12"/>';
})();
const wheat = () => `<svg class="wheat l" viewBox="0 0 60 200" aria-hidden="true">${WHEAT}</svg><svg class="wheat r" viewBox="0 0 60 200" aria-hidden="true">${WHEAT}</svg>`;

function sprig(x, y, flip) {
  const f = flip ? -1 : 1;
  let s = `<path class="wh" d="M${x} ${y + 44}C${x} ${y + 28} ${x + 4 * f} ${y + 12} ${x + 8 * f} ${y}"/>`;
  for (let i = 0; i < 4; i++) {
    const cy = y + 8 + i * 9, cx = x + (6 - i * 1.5) * f;
    s += `<ellipse class="wh" cx="${cx - 5 * f}" cy="${cy}" rx="2.6" ry="5.5" transform="rotate(${-35 * f} ${cx - 5 * f} ${cy})"/><ellipse class="wh" cx="${cx + 5 * f}" cy="${cy}" rx="2.6" ry="5.5" transform="rotate(${35 * f} ${cx + 5 * f} ${cy})"/>`;
  }
  return s;
}

function seal() {
  const star = (x, y, r) => `<path class="star" transform="translate(${x - 12 * r} ${y - 12 * r}) scale(${r})" d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4L2.8 9.5l6.4-.8z"/>`;
  return `<svg class="seal" viewBox="0 0 480 300" aria-hidden="true">
    <defs><path id="sa-top" d="M150 150a90 90 0 0 1 180 0"/><path id="sa-bot" d="M146 150a94 94 0 0 0 188 0"/></defs>
    <circle class="ring" cx="240" cy="150" r="124" stroke-width="3"/>
    <circle class="ring" cx="240" cy="150" r="116" stroke-width="1.2"/>
    <circle class="ring" cx="240" cy="150" r="74" stroke-width="1.2"/>
    <text class="tx"><textPath href="#sa-top" startOffset="50%" text-anchor="middle">ERASMUS</textPath></text>
    <text class="tx sm fade" data-ch="W"><textPath href="#sa-bot" startOffset="50%" text-anchor="middle">${esc(CHEERS[ui.cheer][0].toUpperCase())}</textPath></text>
    ${star(165, 104, .55)}${star(315, 104, .55)}
    ${sprig(200, 78, true)}${sprig(280, 78, false)}
    <g transform="translate(217.5 70) scale(.75)"><path class="ico f" d="M14 8H46C46 30 41 40 30 44C19 40 14 30 14 8Z"/><path d="M14 8H46C46 11.5 45.9 14.5 45.6 17H14.4C14.1 14.5 14 11.5 14 8Z" fill="#ebe2d1"/><path class="ico" d="M14 8H46C46 30 41 40 30 44C19 40 14 30 14 8ZM30 44V64M19 66H41"/></g>
    <polygon class="tail" points="74,146 120,146 120,190 74,190 88,168"/>
    <polygon class="tail" points="406,146 360,146 360,190 406,190 392,168"/>
    <rect class="ban" x="104" y="132" width="272" height="44"/>
    <text class="bt" x="240" y="165" text-anchor="middle">BIERVERKOSTUNG</text>
    ${star(222, 196, .5)}${star(240, 198, .62)}${star(258, 196, .5)}
    <circle class="mini" cx="36" cy="160" r="27"/>${star(36, 160, .8)}
    <circle class="mini" cx="444" cy="160" r="27"/>${star(444, 160, .8)}
  </svg>`;
}

function stamp(n) {
  return `<svg class="stamp" viewBox="0 0 200 200" aria-hidden="true"><defs><path id="st-ring" d="M100 100m-72 0a72 72 0 1 1 144 0a72 72 0 1 1-144 0"/></defs>
    <circle cx="100" cy="100" r="92"/><circle cx="100" cy="100" r="58"/>
    <text><textPath href="#st-ring">• ERASMUS • BIERVERKOSTUNG • WELTWEIT</textPath></text>
    <text class="n" x="100" y="108" text-anchor="middle">${n}</text><text x="100" y="128" text-anchor="middle">SORTEN</text></svg>`;
}

/* ---------- Fotos ---------- */

function photo(b) {
  if (!b.photo) return null;
  return localStorage.getItem(PK + b.id);
}
function storePhoto(id, d) {
  try { localStorage.setItem(PK + id, d); return true; }
  catch (e) { toast('Nicht genug Speicher für das Foto'); return false; }
}
async function shrink(file, max = 520) {
  const src = URL.createObjectURL(file);
  try {
    const img = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; });
    const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', .72);
  } finally { URL.revokeObjectURL(src); }
}

function circle(b, opt = {}) {
  const src = b ? photo(b) : null;
  return `<div class="circle"${opt.id ? ` id="${opt.id}"` : ''}>${src ? `<img src="${src}" alt="">` : GOBLET}${opt.no ? `<span class="no">${pad(numOf(b.id))}</span>` : ''}${opt.ok ? `<span class="ok">${svgIcon('check')}</span>` : ''}${opt.medal ? `<span class="medal">${opt.medal}</span>` : ''}</div>`;
}

/* ---------- Abgleich ohne Server: per Link oder QR-Code ---------- */

const BAD = new Set(['__proto__', 'constructor', 'prototype']);
function setAt(root, segs, value) {
  if (segs.some(s => BAD.has(s))) return;
  let o = root;
  for (let i = 0; i < segs.length - 1; i++) {
    if (typeof o[segs[i]] !== 'object' || o[segs[i]] === null) o[segs[i]] = {};
    o = o[segs[i]];
  }
  const last = segs[segs.length - 1];
  if (value === null || value === undefined) delete o[last]; else o[last] = value;
}
// Schreibt in den lokalen Datenbestand dieses Handys
function write(path, value) {
  const segs = path.split('/');
  if (segs[0] === 'data') setAt(S.db, segs.slice(1), value);
  persist();
}

const b64u = bytes => { let s = ''; for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const unb64u = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
const pipe = async (bytes, stream) => new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());
const baseUrl = () => location.origin + location.pathname;
const t36 = ms => Math.round((ms || 0) / 1000).toString(36);
const f36 = s => (parseInt(s, 36) || 0) * 1000;

// Kompaktes Format, damit auch viele Bewertungen in einen QR-Code passen
function pack(mineOnly) {
  const B = Object.entries(S.db.beers || {}), U = new Map();
  const uIdx = id => { if (!U.has(id)) U.set(id, U.size); return U.get(id); };
  Object.keys(S.db.users || {}).forEach(uIdx);
  const bIdx = new Map(B.map(([id], i) => [id, i]));
  const r = [];
  for (const [bid, per] of Object.entries(S.db.ratings || {})) {
    if (!bIdx.has(bid)) continue;
    for (const [uid, x] of Object.entries(per || {})) {
      if (mineOnly && uid !== S.me?.id) continue;
      if (!x) continue;
      const row = [bIdx.get(bid), uIdx(uid), ...ASPECTS.map(a => x[a.k] || 0), isNum(x.f) ? x.f : -1, t36(x.at)];
      if (x.t) row.push(x.t);
      r.push(row);
    }
  }
  return {
    v: 2,
    u: [...U.keys()].map(id => [id, S.db.users[id]?.name || '', t36(S.db.users[id]?.at)]),
    b: B.map(([id, b]) => [id, b.name, b.style || '', b.abv ?? '', b.region || '', b.brewery || '', b.by || '', b.byId || '', t36(b.at), t36(b.upd), b.del ? 1 : 0]),
    r
  };
}
function unpack(p) {
  if (p.db) return p.db;
  const db = emptyDb(), U = p.u || [], B = p.b || [];
  for (const [id, name, at] of U) if (name) db.users[id] = { name, at: f36(at) };
  for (const [id, name, style, abv, region, brewery, by, byId, at, upd, del] of B)
    db.beers[id] = { name, style, abv: abv === '' ? null : abv, region, brewery, by, byId, at: f36(at), upd: f36(upd), del: !!del };
  for (const row of p.r || []) {
    const b = B[row[0]], u = U[row[1]];
    if (!b || !u) continue;
    const x = { at: f36(row[8]), t: row[9] || '', f: row[7] >= 0 ? row[7] : null };
    ASPECTS.forEach((a, i) => { if (row[2 + i]) x[a.k] = row[2 + i]; });
    (db.ratings[b[0]] ||= {})[u[0]] = x;
  }
  return db;
}

async function shareLink(mineOnly) {
  let bytes = new TextEncoder().encode(JSON.stringify(pack(mineOnly))), pre = 'j';
  if (window.CompressionStream) { try { bytes = await pipe(bytes, new CompressionStream('deflate-raw')); pre = 'z'; } catch (e) { /* unkomprimiert */ } }
  return baseUrl() + '#d=' + pre + b64u(bytes);
}
async function importLink(s) {
  try {
    let bytes = unb64u(s.slice(1));
    if (s[0] === 'z') bytes = await pipe(bytes, new DecompressionStream('deflate-raw'));
    const n = merge(unpack(JSON.parse(new TextDecoder().decode(bytes))));
    persist(); render();
    toast(n.beers || n.ratings ? `Übernommen: ${plural(n.beers, 'neues Bier', 'neue Biere')}, ${plural(n.ratings, 'neue Bewertung', 'neue Bewertungen')}` : 'Alles schon auf dem neuesten Stand', 3500);
  } catch (e) { toast('Dieser Link konnte nicht gelesen werden'); }
}

const ID = /^[a-z0-9]{3,16}$/;
const str = (v, n) => String(v ?? '').slice(0, n);
const numIn = (v, lo, hi) => { v = +v; return isNum(v) && v >= lo && v <= hi ? v : null; };
function merge(db) {
  const n = { beers: 0, ratings: 0 };
  const newer = (a, b) => !b || (a.upd || a.at || 0) > (b.upd || b.at || 0);
  for (const [id, b] of Object.entries(db.beers || {})) {
    if (!ID.test(id) || !b || typeof b !== 'object') continue;
    const clean = { name: str(b.name, 60), style: str(b.style, 40), abv: numIn(b.abv, 0, 30), region: str(b.region, 40), brewery: str(b.brewery, 50),
      by: str(b.by, 30), byId: str(b.byId, 16), at: numIn(b.at, 0, 9e15) || 0, upd: numIn(b.upd, 0, 9e15) || 0, del: !!b.del, photo: false };
    if (newer(clean, S.db.beers[id])) { if (!S.db.beers[id] && !clean.del) n.beers++; S.db.beers[id] = { ...clean, photo: !!S.db.beers[id]?.photo, photoAt: S.db.beers[id]?.photoAt || 0 }; }
  }
  for (const [id, u] of Object.entries(db.users || {})) {
    if (ID.test(id) && u && newer(u, S.db.users[id])) S.db.users[id] = { name: str(u.name, 30), at: numIn(u.at, 0, 9e15) || 0 };
  }
  for (const [bid, per] of Object.entries(db.ratings || {})) {
    if (!ID.test(bid) || !per || typeof per !== 'object') continue;
    for (const [uid, r] of Object.entries(per)) {
      if (!ID.test(uid) || !r || typeof r !== 'object') continue;
      const clean = { at: numIn(r.at, 0, 9e15) || 0, t: str(r.t, 300), f: numIn(r.f, 0, 5) };
      ASPECTS.forEach(a => { clean[a.k] = numIn(r[a.k], 1, 5); });
      const cur = S.db.ratings[bid]?.[uid];
      if (!cur || clean.at > (cur.at || 0)) { n.ratings++; (S.db.ratings[bid] ||= {})[uid] = clean; }
    }
  }
  return n;
}

/* ---------- Ansichten ---------- */

function topbar() {
  return `<header class="topbar">
    <div class="logo"><i>Erasmus</i><b>EB</b></div>
    <div class="t"><b>Bierverkostung</b><small>${S.me ? esc(S.me.name) : 'Erasmus'}</small></div>
    ${S.me ? `<button class="sync-btn" data-act="menu">${svgIcon('sync')}<span>Abgleich</span></button>` : ''}
  </header>`;
}

function tabbar() {
  const t = ui.tab;
  return `<nav class="tabbar">
    <button data-tab="beers" class="${t === 'beers' ? 'on' : ''}">${svgIcon('list')}<span>Biere</span></button>
    <button data-tab="rate" class="mid ${t === 'rate' ? 'on' : ''}"><div class="disc">${svgIcon('glass')}</div><span>Bewerten</span></button>
    <button data-tab="results" class="${t === 'results' ? 'on' : ''}">${svgIcon('trophy')}<span>Ergebnisse</span></button>
  </nav>`;
}

function cheersSection() {
  const [w, l] = CHEERS[ui.cheer];
  const line = CHEERS.map(c => `<span>${esc(c[0])}</span>`).join('<i>•</i>');
  return `<section class="sec copper">
    ${stamp(beers().length)}
    <p class="kick">Prost auf</p>
    <p class="cheers-lang"><span class="hl fade" data-ch="l">${esc(l)}</span></p>
    <div class="cheers-big fade" data-ch="w">${esc(w)}</div>
    <div class="ticker" aria-hidden="true"><div>${line}<i>•</i>${line}<i>•</i></div></div>
    <p class="ticker-sub">Erasmus · weltweit</p>
  </section>`;
}

function footer() {
  return `<footer class="foot"><p class="script fade" data-ch="w">${esc(cheer())}</p><small>${esc(C.title)}</small></footer>`;
}

function render() {
  const app = $('#app');
  if (!S.me) { app.innerHTML = topbar() + viewWelcome() + footer(); return; }
  const v = { beers: viewBeers, rate: viewRate, results: viewResults }[ui.tab] || viewBeers;
  app.innerHTML = topbar() + `<main>${v()}</main>` + footer() + tabbar();
}

function viewWelcome() {
  return `<section class="hero">${seal()}</section>
    <section class="sec paper center">${wheat()}
      <p class="kick">Willkommen zur</p>${CUP}
      <h1 class="big">Bierverkostung</h1>
      <span class="sribbon">Erasmus</span>
      <div class="form" style="max-width:360px;margin:24px auto 0;text-align:left">
        <label>Dein Name<input id="w-name" maxlength="30" autocomplete="given-name" placeholder="z. B. Dino"></label>
        <button class="btn wide" data-act="login" style="margin-top:18px">Anmelden</button>
      </div>
      ${ui.pending ? '<p class="info-box">Du hast einen geteilten Link geöffnet. Biere und Bewertungen werden nach dem Anmelden übernommen.</p>' : ''}
    </section>
    ${cheersSection()}`;
}

function viewBeers() {
  const L = beers(), done = L.filter(b => mine(b.id)).length;
  const regions = new Set(L.map(b => (b.region || '').trim().toLowerCase()).filter(Boolean)).size;
  return `<section class="hero">${seal()}</section>
    <section class="sec paper center">${wheat()}
      <p class="kick">Willkommen, ${esc(S.me.name)}</p>${CUP}
      <h1 class="big">Bierverkostung</h1>
      <span class="sribbon">Erasmus</span>
      <div class="stats">
        <div><b>${L.length}</b><span>Biere</span></div>
        <div><b>${regions}</b><span>Herkünfte</span></div>
        <div><b>${done}</b><span>Bewertet</span></div>
      </div>
    </section>
    ${cheersSection()}
    <section class="sec paper center">${wheat()}
      <p class="kick">Auf dem Tisch</p>${CUP}
      <h2 class="big">Unsere Biere</h2>
      ${L.length ? '<p class="info-box">Biere und Bewertungen gleicht ihr über „Abgleich“ oben rechts aus: per QR-Code oder Link von Handy zu Handy.</p>' : ''}
      <div class="grid">${L.map(card).join('')}<button class="add-tile" data-act="add"><span>+</span><b>Bier hinzufügen</b></button></div>
    </section>`;
}

function card(b) {
  const r = mine(b.id);
  const meta = [b.region ? esc(b.style) : '', b.abv != null ? `${pct(b.abv)} %` : ''].filter(Boolean).join(' · ');
  return `<article class="bcard" data-act="detail" data-id="${b.id}">
    <span class="ribbon">${esc(b.name)}</span>
    ${circle(b, { no: true, ok: !!r })}
    <p class="script">${b.region ? 'aus ' + esc(b.region) : esc(b.style || 'Bier')}</p>
    ${meta ? `<p class="small">${meta}</p>` : ''}
    ${b.by ? `<p class="small"><i>mitgebracht von ${esc(b.by)}</i></p>` : ''}
    ${r ? `<p class="score">${fmt(aspAvg(r))}<small>dein Schnitt</small></p>` : `<button class="more" data-act="rateThis" data-id="${b.id}">Bewerten</button>`}
  </article>`;
}

/* Bewerten */
function aspectRow(a, d, first) {
  const v = d[a.k];
  return `<div class="aspect">
    <div class="aspect-h"><h3>${a.n}</h3><em>${v || ''}</em></div>
    <p class="q">${a.q}</p>
    <div class="dots">${[1, 2, 3, 4, 5].map(i => `<button class="dot ${v === i ? 'on' : v > i ? 'low' : ''}" data-act="dot" data-k="${a.k}" data-v="${i}" aria-label="${a.n} ${i} von 5">${i}</button>`).join('')}</div>
    ${first ? '<div class="ends"><span>schwach</span><span>hervorragend</span></div>' : ''}
  </div>`;
}

function viewRate() {
  const L = beers();
  if (!L.length) return `<section class="sec paper center">${wheat()}<p class="kick">Noch leer</p>${CUP}<h1 class="big">Bewerten</h1>
    <p class="empty">Es sind noch keine Biere eingetragen.</p><div class="btns"><button class="btn" data-act="add">Bier hinzufügen</button></div></section>`;
  if (!ui.sel || !beer(ui.sel)) { ui.sel = (L.find(b => !mine(b.id)) || L[0]).id; ui.draft = null; }
  if (!ui.draft) ui.draft = JSON.parse(JSON.stringify(mine(ui.sel) || {}));
  const b = beer(ui.sel), d = ui.draft, saved = !!mine(b.id), done = L.filter(x => mine(x.id)).length;
  const meta = [b.style, b.abv != null ? `${pct(b.abv)} %` : '', b.brewery].filter(Boolean).map(esc).join(' · ');
  return `<section class="sec paper center">${wheat()}
    <p class="kick">${done} von ${L.length} bewertet</p>${CUP}
    <h1 class="big">Bewerten</h1>
    <div class="picker" id="picker">${L.map(x => `<button class="pick ${x.id === b.id ? 'on' : ''} ${mine(x.id) ? 'done' : ''}" data-act="pick" data-id="${x.id}"><em>${mine(x.id) ? svgIcon('check').replace('<svg', '<svg width="12" height="12" stroke="currentColor" stroke-width="3" fill="none"') : pad(numOf(x.id))}</em><span>${esc(x.name)}</span></button>`).join('')}</div>
    <div class="rcard">
      <span class="ribbon">${esc(b.name)}</span>
      <div style="margin-top:14px">${circle(b, { no: true })}</div>
      ${b.region ? `<p class="script" style="margin-top:10px">aus ${esc(b.region)}</p>` : ''}
      ${meta ? `<p class="small meta">${meta}</p>` : ''}
      ${ASPECTS.map((a, i) => aspectRow(a, d, i === 0)).join('')}
      <div class="fazit">
        <p class="kick">Am Ende</p>
        <h3>Fazit</h3>
        <div class="stars">${[1, 2, 3, 4, 5].map(i => `<button class="star-b ${d.f >= i ? 'on' : ''}" data-act="fazit" data-v="${i}" aria-label="${i} Sterne">${STAR}</button>`).join('')}</div>
        <p class="fazit-l">${isNum(d.f) ? FAZIT[d.f] : '&nbsp;'}</p>
        <div class="fazit-scale"><span>1 · nie wieder</span><span>5 · wird ein Favorit</span></div>
      </div>
      <label class="note-l" for="note">Notiz <i style="font:italic .78rem var(--serif);text-transform:none;letter-spacing:0">(freiwillig)</i></label>
      <textarea id="note" data-in="note" rows="3" maxlength="300" placeholder="Was willst du dir merken?">${esc(d.t)}</textarea>
      <p class="avg-now">Dein Schnitt<b>${fmt(aspAvg(d))}</b></p>
      <button class="btn wide" data-act="saveRating">${saved ? 'Bewertung aktualisieren' : 'Bewertung speichern'}</button>
    </div>
  </section>`;
}

/* Ergebnisse */
function miniStars(v) {
  const n = Math.round(v);
  return `<span class="mini-stars">${[1, 2, 3, 4, 5].map(i => STAR.replace('<svg', `<svg style="fill:${i <= n ? 'var(--copper)' : 'transparent'};stroke:var(--copperd);stroke-width:1.6"`)).join('')}</span>`;
}

function viewResults() {
  const R = rows(ui.filter, ui.mode), fname = FILTERS.find(f => f[0] === ui.filter)[1];
  const valHTML = r => ui.filter === 'f' ? `${fmt(r.v)}<br>${miniStars(r.v)}` : `${fmt(r.v)}`;
  const top = [R[1], R[0], R[2]];
  return `<section class="sec dark center">
      <p class="kick">Die Ergebnisse</p>${CUP}
      <h1 class="big">Rangliste</h1>
      <div class="seg2"><button data-act="mode" data-v="all" class="${ui.mode === 'all' ? 'on' : ''}">Alle</button><button data-act="mode" data-v="me" class="${ui.mode === 'me' ? 'on' : ''}">Nur ich</button></div>
    </section>
    <section class="sec paper">
      <p class="kick">Sortiert nach</p>
      <div class="filters">${FILTERS.map(([k, n]) => `<button class="fchip ${ui.filter === k ? 'on' : ''}" data-act="filter" data-v="${k}">${n}</button>`).join('')}</div>
      ${R.length ? `
        <div class="podium">${top.map((r, i) => r ? `<div class="pod p${[2, 1, 3][i]}" data-act="detail" data-id="${r.b.id}">
          ${circle(r.b, { medal: [2, 1, 3][i] })}
          <span class="ribbon">${esc(r.b.name)}</span>
          <p class="val">${fmt(r.v)}</p><small>${plural(r.n, 'Stimme', 'Stimmen')}</small>
        </div>` : '<div></div>').join('')}</div>
        <ol class="rlist">${R.map((r, i) => `<li data-act="detail" data-id="${r.b.id}">
          <span class="rk">${pad(i + 1)}</span>
          <div><b>${esc(r.b.name)}</b><small>${[r.b.region, r.b.style].filter(Boolean).map(esc).join(' · ') || '&nbsp;'}</small></div>
          <div class="v">${valHTML(r)}<br><small>${plural(r.n, 'Stimme', 'Stimmen')}</small></div>
          <div class="bar"><i style="width:${Math.max(0, r.v / 5 * 100)}%"></i></div>
        </li>`).join('')}</ol>
        <p class="small center" style="margin-top:12px"><i>${fname}: ${ui.filter === 'f' ? 'Sterne von 1 bis 5' : ui.filter === 'total' ? 'Schnitt aus allen fünf Kategorien' : 'Schnitt von 1 bis 5'}${ui.mode === 'all' ? ', gemittelt über alle' : ', nur deine Wertung'}.</i></p>`
      : `<p class="empty">Noch keine Bewertungen${ui.mode === 'me' ? ' von dir' : ''}.</p>`}
    </section>
    ${R.length ? awardsSection() : ''}
    <section class="sec paper center">${wheat()}
      <p class="kick">Wer war dabei</p>${CUP}
      <h2 class="big">Die Runde</h2>
      <div class="people">${people()}</div>
      <div class="btns"><button class="btn" data-act="img">Ergebnisse als Bild</button><button class="btn line" data-act="csv">Tabelle (CSV)</button></div>
    </section>`;
}

function people() {
  const count = {};
  for (const b of beers()) for (const [u] of ratingsOf(b.id)) count[u] = (count[u] || 0) + 1;
  const ids = new Set([...Object.keys(S.db.users || {}), ...Object.keys(count)]);
  return [...ids].map(id => `<span class="person ${id === S.me.id ? 'me' : ''}">${esc(userName(id))}<small>${plural(count[id] || 0, 'Bier', 'Biere')}</small></span>`).join('');
}

function awardsSection() {
  const mode = ui.mode, A = [];
  for (const a of ASPECTS) { const r = rows(a.k, mode)[0]; if (r) A.push([a.best, r.b.name, `${fmt(r.v)} von 5`]); }
  const F = rows('f', mode);
  if (F.length) {
    const minN = mode === 'all' ? Math.max(1, Math.ceil(Math.max(...F.map(r => r.n)) / 2)) : 1;
    const fav = F.find(r => r.n >= minN);
    if (fav) A.push(['Favorit der Runde', fav.b.name, `${fmt(fav.v)} Sterne im Fazit`]);
    const worst = F[F.length - 1];
    if (F.length > 1 && worst.v <= 2 && worst !== fav) A.push(['Lieber nicht nochmal', worst.b.name, `${fmt(worst.v)} Sterne im Fazit`]);
  }
  if (mode === 'all') {
    const con = rows('total', 'all').filter(r => r.n >= 2).sort((x, y) => y.sd - x.sd)[0];
    if (con && con.sd >= .3) A.push(['Am umstrittensten', con.b.name, `Werte von ${fmt(Math.min(...con.vals))} bis ${fmt(Math.max(...con.vals))}`]);
  }
  return `<section class="sec copper center">
    <p class="kick">Ausgezeichnet</p>${CUP}
    <h2 class="big">Die Sieger</h2>
    <div class="awards">${A.map(([t, n, d]) => `<div class="award"><p class="kick">${t}</p><b>${esc(n)}</b><span>${d}</span></div>`).join('')}</div>
  </section>`;
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
  if (!ui.sheet) return;
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
  setTimeout(() => { if (!ui.sheet) { el.hidden = true; el.innerHTML = ''; } }, 220);
  if (!fromPop && history.state?.sheet) history.back();
}
window.addEventListener('popstate', () => { if (ui.sheet) closeSheet(true); });
const shHead = t => `<div class="sh-head"><h2>${t}</h2><button class="x" data-act="close" aria-label="Schließen">${svgIcon('close')}</button></div>`;
function sheetHTML() {
  return ({ beer: sheetBeer, detail: sheetDetail, menu: sheetMenu, qr: sheetQR })[ui.sheet.type]();
}

function sheetBeer() {
  const s = ui.sheet, b = s.id ? beer(s.id) : { by: S.me.name };
  const cur = s.photo || (!s.rm && s.id ? photo(b) : null);
  const regions = [...new Set(beers().map(x => x.region).filter(Boolean))];
  const names = [...new Set([S.me.name, ...Object.values(S.db.users || {}).map(u => u?.name)].filter(Boolean))];
  return `${shHead(s.id ? 'Bier bearbeiten' : 'Bier hinzufügen')}
    <div class="sh-body form">
      <label>Name des Biers<i>Pflichtfeld</i><input id="f-name" maxlength="60" value="${esc(b.name)}" placeholder="z. B. Pilsner Urquell"></label>
      <label>Bierart<i>freiwillig</i><input id="f-style" maxlength="40" list="dl-styles" value="${esc(b.style)}" placeholder="z. B. Pils, IPA, Stout"></label>
      <div class="row">
        <label>Herkunft / Region<i>freiwillig</i><input id="f-region" maxlength="40" list="dl-regions" value="${esc(b.region)}" placeholder="z. B. Bayern"></label>
        <label class="abv">Alkohol %<input id="f-abv" type="text" inputmode="decimal" maxlength="5" placeholder="5,0" value="${b.abv != null ? pct(b.abv) : ''}"></label>
      </div>
      <label>Brauerei<i>freiwillig</i><input id="f-brewery" maxlength="50" value="${esc(b.brewery)}"></label>
      <label>Mitgebracht von<i>freiwillig</i><input id="f-by" maxlength="30" list="dl-names" value="${esc(b.by)}"></label>
      <label>Foto<i>freiwillig</i></label>
      <div class="photo-row"><div class="circle" id="f-prev">${cur ? `<img src="${cur}" alt="">` : GOBLET}</div>
        <div class="col"><label class="btn small line">Foto wählen<input type="file" id="f-photo" accept="image/*" hidden></label>
        ${cur ? '<button class="more" data-act="rmPhoto">Foto entfernen</button>' : ''}</div></div>
      <datalist id="dl-styles">${STYLES.map(x => `<option value="${esc(x)}">`).join('')}</datalist>
      <datalist id="dl-regions">${regions.map(x => `<option value="${esc(x)}">`).join('')}</datalist>
      <datalist id="dl-names">${names.map(x => `<option value="${esc(x)}">`).join('')}</datalist>
      <div class="btns col"><button class="btn" data-act="saveBeer">${s.id ? 'Änderungen speichern' : 'Bier hinzufügen'}</button>
      ${s.id ? '<button class="btn danger" data-act="delBeer">Bier löschen</button>' : ''}</div>
    </div>`;
}

function sheetDetail() {
  const b = beer(ui.sheet.id);
  if (!b) return `${shHead('Bier')}<div class="sh-body"><p class="empty">Dieses Bier wurde gelöscht.</p></div>`;
  const all = ratingsOf(b.id), my = mine(b.id);
  const meta = [b.style, b.abv != null ? `${pct(b.abv)} %` : '', b.brewery].filter(Boolean).map(esc).join(' · ');
  const statRow = (label, key, max) => {
    const vals = all.map(([, r]) => val(r, key)).filter(isNum);
    if (!vals.length) return '';
    const m = mean(vals), me = my ? val(my, key) : null;
    return `<div class="dstat"><span>${label}</span><div class="bar"><i style="width:${m / max * 100}%"></i>${isNum(me) ? `<u style="left:${me / max * 100}%"></u>` : ''}</div><b>${fmt(m)}</b></div>`;
  };
  const notes = all.filter(([, r]) => r.t || isNum(r.f));
  return `${shHead(`Bier ${pad(numOf(b.id))}`)}
    <div class="sh-body detail">
      ${circle(b)}
      <span class="ribbon">${esc(b.name)}</span>
      ${b.region ? `<p class="script" style="margin-top:10px">aus ${esc(b.region)}</p>` : ''}
      ${meta ? `<p class="small">${meta}</p>` : ''}
      ${b.by ? `<p class="small"><i>mitgebracht von ${esc(b.by)}</i></p>` : ''}
      <div class="btns"><button class="btn" data-act="rateThis" data-id="${b.id}">${my ? 'Bewertung ändern' : 'Jetzt bewerten'}</button><button class="btn line" data-act="editBeer" data-id="${b.id}">Bearbeiten</button></div>
      ${all.length ? `<div class="dstats">
        <h3 class="sub-h">Bewertungen · ${plural(all.length, 'Stimme', 'Stimmen')}</h3>
        ${statRow('Gesamt', 'total', 5)}${ASPECTS.map(a => statRow(a.n, a.k, 5)).join('')}${statRow('Fazit', 'f', 5)}
        <p class="legend"><i></i>Schnitt aller${my ? '<u></u>deine Wertung' : ''}</p>
      </div>` : '<p class="empty">Noch nicht bewertet.</p>'}
      ${notes.length ? `<h3 class="sub-h">Fazit und Notizen</h3><ul class="comments">${notes.map(([u, r]) => `<li><b>${esc(userName(u))}</b>${isNum(r.f) ? ` · ${miniStars(r.f)} <i>${FAZIT[r.f]}</i>` : ''}${r.t ? `<p>„${esc(r.t)}“</p>` : ''}</li>`).join('')}</ul>` : ''}
    </div>`;
}

function sheetMenu() {
  const nR = Object.values(S.db.ratings || {}).reduce((s, per) => s + Object.keys(per || {}).length, 0);
  const nU = new Set(Object.values(S.db.ratings || {}).flatMap(per => Object.keys(per || {}))).size;
  return `${shHead('Abgleich')}
    <div class="sh-body">
      <p class="small">Biere und Bewertungen wandern von Handy zu Handy. Ein Handy zeigt seinen Code, das andere scannt ihn mit der Kamera. Dabei wird alles zusammengeführt, nichts geht verloren.</p>
      <p class="small"><i>Auf diesem Handy: ${plural(beers().length, 'Bier', 'Biere')}, ${plural(nR, 'Bewertung', 'Bewertungen')} von ${plural(nU, 'Person', 'Personen')}.</i></p>
      <h3 class="sub-h">Senden</h3>
      <div class="qr" id="m-qr"><p class="small center">Code wird erstellt …</p></div>
      <p class="small center" id="m-qr-note"></p>
      <div class="btns"><button class="btn small" data-act="shareLink">Als Link teilen</button></div>
      <h3 class="sub-h">Empfangen</h3>
      <p class="small">Den Code eines anderen Handys mit der Kamera scannen und den Link öffnen. Oder einen geschickten Link hier einfügen:</p>
      <div class="form paste"><input id="m-paste" placeholder="Link einfügen" autocomplete="off"><button class="btn small line" data-act="importPaste">Übernehmen</button></div>
      <h3 class="sub-h">Dein Name</h3>
      <div class="form paste"><input id="m-name" maxlength="30" value="${esc(S.me.name)}"><button class="btn small line" data-act="rename">Ändern</button></div>
      <h3 class="sub-h">Herunterladen</h3>
      <div class="btns col"><button class="btn small" data-act="img">Ergebnisse als Bild</button><button class="btn small line" data-act="csv">Alle Bewertungen als Tabelle (CSV)</button><button class="btn small line" data-act="backup">Sicherung (JSON)</button></div>
      <h3 class="sub-h">Abmelden</h3>
      <p class="small">Deine Bewertungen bleiben auf diesem Handy gespeichert. Mit demselben Namen meldest du dich wieder an.</p>
      <div class="btns col"><button class="btn small line" data-act="logout">Abmelden</button>
      <button class="btn small danger" data-act="wipe">Alle Daten auf diesem Handy löschen</button></div>
    </div>`;
}
async function fillQR() {
  const el = $('#m-qr');
  if (!el) return;
  // Erst alles versuchen; ist das zu viel für einen Code, nur Biere und eigene Bewertungen
  // (über etwa 1200 Zeichen wird der Code zu fein, um ihn sicher vom Bildschirm zu scannen)
  const MAX = 1200;
  let u = await shareLink(false), note = 'Enthält alle Biere und alle Bewertungen auf diesem Handy.';
  if (u.length > MAX) { u = await shareLink(true); note = 'Enthält alle Biere und deine eigenen Bewertungen. Für alles zusammen „Als Link teilen“ nutzen.'; }
  const code = u.length <= MAX * 1.6 ? QR.svg(u) : null;
  el.innerHTML = code ? code : '<p class="small center">Zu viele Daten für einen QR-Code. Bitte „Als Link teilen“ nutzen.</p>';
  const n = $('#m-qr-note');
  if (n && code) n.textContent = note;
}

function sheetQR() {
  const s = ui.sheet, code = QR.svg(s.text);
  return `${shHead(esc(s.title))}<div class="sh-body center">
    <div class="qr">${code || '<p>Zu viele Daten für einen QR-Code. Bitte den Link teilen.</p>'}</div>
    <p class="small">${esc(s.hint)}</p></div>`;
}

/* ---------- Aktionen ---------- */

function goRate(id) {
  ui.sel = id; ui.draft = null; ui.tab = 'rate'; localStorage.setItem(TK, 'rate');
  if (ui.sheet) closeSheet();
  render(); window.scrollTo(0, 0);
}

const ACTIONS = {
  login() {
    const name = $('#w-name').value.trim();
    if (!name) { toast('Bitte gib deinen Namen ein'); $('#w-name').focus(); return; }
    const ex = Object.entries(S.db.users || {}).find(([, u]) => (u?.name || '').trim().toLowerCase() === name.toLowerCase());
    let id = rid();
    if (ex && confirm(`„${ex[1].name}“ ist schon angemeldet. Bist du das? Dann geht es mit deinen bisherigen Bewertungen weiter.`)) id = ex[0];
    S.me = { id, name };
    write(`data/users/${id}`, { name, at: Date.now() });
    ui.tab = 'beers'; render(); window.scrollTo(0, 0);
    toast(`Willkommen, ${name}`);
    if (ui.pending) { const p = ui.pending; ui.pending = null; importLink(p); }
  },
  add() { openSheet({ type: 'beer' }); },
  detail(el) { openSheet({ type: 'detail', id: el.dataset.id }); },
  editBeer(el) { openSheet({ type: 'beer', id: el.dataset.id }); },
  rateThis(el) { goRate(el.dataset.id); },
  close() { closeSheet(); },
  menu() { openSheet({ type: 'menu' }); fillQR(); },
  pick(el) { ui.sel = el.dataset.id; ui.draft = null; render(); },
  dot(el) {
    const d = ui.draft, k = el.dataset.k, v = +el.dataset.v;
    if (d[k] === v) delete d[k]; else d[k] = v;
    if (navigator.vibrate) navigator.vibrate(8);
    render();
  },
  fazit(el) {
    const d = ui.draft, v = +el.dataset.v;
    d.f = d.f === v ? null : v;
    render();
  },
  saveRating() {
    const d = ui.draft, b = beer(ui.sel);
    const missing = ASPECTS.filter(a => !isNum(d[a.k])).map(a => a.n);
    if (!isNum(d.f)) missing.push('Fazit');
    if (missing.length) { toast(`Noch offen: ${missing.join(', ')}`, 3000); return; }
    const r = { at: Date.now(), f: d.f, t: (d.t || '').trim().slice(0, 300) };
    ASPECTS.forEach(a => { r[a.k] = d[a.k]; });
    write(`data/ratings/${b.id}/${S.me.id}`, r);
    toast(`${cheer()} Bewertung gespeichert`);
    const next = beers().find(x => !mine(x.id));
    ui.sel = next ? next.id : b.id; ui.draft = null;
    render();
    $('#picker')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },
  async saveBeer() {
    const s = ui.sheet, name = $('#f-name').value.trim();
    if (!name) { toast('Der Name ist ein Pflichtfeld'); $('#f-name').focus(); return; }
    const id = s.id || rid(), prev = s.id ? S.db.beers[id] : null, now = Date.now();
    const abv = parseFloat(String($('#f-abv').value).replace(',', '.'));
    const b = {
      name, style: $('#f-style').value.trim(), region: $('#f-region').value.trim(), brewery: $('#f-brewery').value.trim(),
      by: $('#f-by').value.trim(), abv: abv >= 0 && abv < 30 ? Math.round(abv * 10) / 10 : null,
      byId: prev?.byId || S.me.id, at: prev?.at || now, upd: now, del: false,
      photo: !!prev?.photo, photoAt: prev?.photoAt || 0
    };
    if (s.photo) { b.photo = true; b.photoAt = now; storePhoto(id, s.photo); }
    else if (s.rm) { b.photo = false; b.photoAt = now; localStorage.removeItem(PK + id); }
    write(`data/beers/${id}`, b);
    closeSheet(); render();
    toast(prev ? 'Gespeichert' : `${name} steht auf der Liste`);
  },
  delBeer() {
    const id = ui.sheet.id, b = S.db.beers[id];
    if (!confirm(`„${b.name}“ löschen? Beim nächsten Abgleich verschwindet es auch bei den anderen.`)) return;
    write(`data/beers/${id}`, { ...b, del: true, upd: Date.now() });
    closeSheet(); render();
  },
  rmPhoto() { ui.sheet.photo = null; ui.sheet.rm = true; $('#f-prev').innerHTML = GOBLET; },
  mode(el) { ui.mode = el.dataset.v; render(); },
  filter(el) { ui.filter = el.dataset.v; const x = window.scrollY; render(); window.scrollTo(0, x); },
  rename() {
    const name = $('#m-name').value.trim();
    if (!name) { toast('Der Name darf nicht leer sein'); return; }
    S.me.name = name; write(`data/users/${S.me.id}`, { name, at: Date.now() });
    render(); renderSheet(); toast('Name geändert');
  },
  async shareLink() {
    const u = await shareLink();
    if (navigator.share) { try { await navigator.share({ title: C.title, text: 'Biere und Bewertungen von der Bierverkostung:', url: u }); return; } catch (e) { if (e.name === 'AbortError') return; } }
    copy(u);
  },
  importPaste() {
    const m = $('#m-paste').value.match(/#d=([A-Za-z0-9_-]+)/);
    if (!m) { toast('Das ist kein gültiger Link'); return; }
    closeSheet(); importLink(m[1]);
  },
  img() { exportImage(); },
  csv() { exportCSV(); },
  backup() { download(`bierverkostung-sicherung-${today()}.json`, JSON.stringify({ app: 'bierverkostung', v: 1, db: S.db }), 'application/json'); },
  logout() { S.me = null; persist(); closeSheet(); render(); window.scrollTo(0, 0); },
  wipe() {
    if (!confirm('Wirklich alle Biere, Bewertungen und Fotos auf diesem Handy löschen?')) return;
    for (const k of Object.keys(localStorage)) if (k.startsWith('bv-')) localStorage.removeItem(k);
    location.reload();
  }
};

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act],[data-tab]');
  if (!el) return;
  if (el.dataset.tab) {
    ui.tab = el.dataset.tab; localStorage.setItem(TK, ui.tab);
    if (ui.tab === 'rate') ui.draft = null;
    render(); window.scrollTo(0, 0); return;
  }
  const f = ACTIONS[el.dataset.act];
  if (f) { e.preventDefault(); e.stopPropagation(); f(el); }
});
document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'w-name') ACTIONS.login(); });
document.addEventListener('input', e => { if (e.target.dataset.in === 'note' && ui.draft) ui.draft.t = e.target.value; });
document.addEventListener('change', async e => {
  if (e.target.id === 'f-photo' && e.target.files[0]) {
    try { ui.sheet.photo = await shrink(e.target.files[0]); ui.sheet.rm = false; $('#f-prev').innerHTML = `<img src="${ui.sheet.photo}" alt="">`; }
    catch (err) { toast('Das Foto konnte nicht gelesen werden'); }
  }
});

/* ---------- Export ---------- */

const today = () => new Date().toISOString().slice(0, 10);
function download(name, content, type) {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}
async function copy(t) {
  try { await navigator.clipboard.writeText(t); toast('Link kopiert'); } catch (e) { prompt('Link kopieren:', t); }
}

function exportCSV() {
  const q = v => { const s = String(v ?? ''); return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const dec = v => isNum(v) ? String(Math.round(v * 100) / 100).replace('.', ',') : '';
  const lines = [['Person', 'Nr.', 'Bier', 'Bierart', 'Alkohol %', 'Herkunft', 'Brauerei', 'Mitgebracht von', ...ASPECTS.map(a => a.n), 'Schnitt', 'Fazit (Sterne)', 'Fazit', 'Notiz'].map(q).join(';')];
  for (const b of beers()) for (const [u, r] of ratingsOf(b.id)) {
    lines.push([userName(u), numOf(b.id), b.name, b.style, dec(b.abv), b.region, b.brewery, b.by, ...ASPECTS.map(a => dec(r[a.k])), dec(aspAvg(r)),
      dec(r.f), isNum(r.f) ? FAZIT[r.f] : '', r.t].map(q).join(';'));
  }
  download(`bierverkostung-${today()}.csv`, '﻿' + lines.join('\r\n'), 'text/csv;charset=utf-8');
}

async function exportImage() {
  const R = rows(ui.filter, ui.mode).slice(0, 10);
  if (!R.length) { toast('Noch keine Ergebnisse'); return; }
  const fname = FILTERS.find(f => f[0] === ui.filter)[1];
  const W = 1080, rowH = 118, top = 470, H = top + R.length * rowH + 230;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d');
  try { await Promise.all(['700 60px Oswald', '600 30px Oswald', '400 30px Lora', 'italic 400 26px Lora', '400 40px Kaushan'].map(f => document.fonts.load(f))); } catch (e) { /* Ersatzschriften */ }
  const HEAD = 'Oswald, "Arial Narrow", sans-serif', SER = 'Lora, Georgia, serif', SCR = 'Kaushan, cursive';
  const imgs = await Promise.all(R.map(r => new Promise(ok => {
    const src = photo(r.b); if (!src) return ok(null);
    const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src;
  })));
  const fit = (t, max) => { if (x.measureText(t).width <= max) return t; while (t.length > 1 && x.measureText(t + '…').width > max) t = t.slice(0, -1); return t + '…'; };
  // Hintergrund
  x.fillStyle = '#ebe2d1'; x.fillRect(0, 0, W, H);
  const g = x.createRadialGradient(W / 2, 160, 40, W / 2, 160, 620); g.addColorStop(0, '#4b4331'); g.addColorStop(.55, '#2a251c'); g.addColorStop(1, '#13110d');
  x.fillStyle = g; x.fillRect(0, 0, W, 330);
  x.strokeStyle = 'rgba(0,0,0,.22)'; x.lineWidth = 2;
  for (let i = -330; i < W; i += 7) { x.beginPath(); x.moveTo(i, 330); x.lineTo(i + 330, 0); x.stroke(); }
  x.fillStyle = '#c0703a'; x.fillRect(0, 326, W, 6);
  x.textAlign = 'center';
  x.fillStyle = '#ce9b76'; x.font = `600 28px ${HEAD}`; x.letterSpacing = '6px';
  x.fillText('ERASMUS', W / 2, 110);
  x.fillStyle = '#ebe2d1'; x.font = `700 110px ${HEAD}`; x.letterSpacing = '2px';
  x.fillText('RANGLISTE', W / 2, 232);
  x.letterSpacing = '0px';
  // Band mit Pinselschrift
  const label = `nach ${fname}${ui.mode === 'me' ? ` · ${S.me.name}` : ' · alle'}`;
  x.font = `400 40px ${SCR}`;
  const lw = x.measureText(label).width + 80, lx = (W - lw) / 2, ly = 372;
  x.fillStyle = '#c0703a'; x.beginPath(); x.moveTo(lx, ly); x.lineTo(lx + lw, ly); x.lineTo(lx + lw - 18, ly + 31); x.lineTo(lx + lw, ly + 62); x.lineTo(lx, ly + 62); x.lineTo(lx + 18, ly + 31); x.closePath(); x.fill();
  x.fillStyle = '#ebe2d1'; x.fillText(label, W / 2, ly + 45);
  // Liste
  R.forEach((r, i) => {
    const y = top + i * rowH;
    x.textAlign = 'left'; x.fillStyle = '#c0703a'; x.font = `700 54px ${HEAD}`; x.fillText(pad(i + 1), 70, y + 70);
    const cx = 232, cy = y + 52, rad = 46;
    x.fillStyle = '#ce9b76'; x.beginPath(); x.arc(cx, cy, rad, 0, 7); x.fill();
    if (imgs[i]) { x.save(); x.beginPath(); x.arc(cx, cy, rad, 0, 7); x.clip(); const im = imgs[i], k = Math.max(2 * rad / im.width, 2 * rad / im.height); x.drawImage(im, cx - im.width * k / 2, cy - im.height * k / 2, im.width * k, im.height * k); x.restore(); }
    else { x.fillStyle = '#dc9a45'; x.beginPath(); x.moveTo(cx - 18, cy - 24); x.lineTo(cx + 18, cy - 24); x.quadraticCurveTo(cx + 18, cy + 10, cx, cy + 14); x.quadraticCurveTo(cx - 18, cy + 10, cx - 18, cy - 24); x.fill();
      x.strokeStyle = '#291c15'; x.lineWidth = 3; x.stroke(); x.beginPath(); x.moveTo(cx, cy + 14); x.lineTo(cx, cy + 30); x.moveTo(cx - 12, cy + 31); x.lineTo(cx + 12, cy + 31); x.stroke(); }
    x.fillStyle = '#291c15'; x.font = `600 40px ${HEAD}`; x.fillText(fit(r.b.name.toUpperCase(), 520), 310, y + 48);
    x.fillStyle = '#5a4636'; x.font = `italic 400 27px ${SER}`;
    x.fillText(fit([r.b.region ? 'aus ' + r.b.region : '', r.b.style, plural(r.n, 'Stimme', 'Stimmen')].filter(Boolean).join(' · '), 520), 310, y + 88);
    x.textAlign = 'right'; x.fillStyle = '#291c15'; x.font = `700 64px ${HEAD}`; x.fillText(fmt(r.v), W - 70, y + 74);
    x.strokeStyle = 'rgba(41,28,21,.3)'; x.lineWidth = 2; x.setLineDash([8, 6]); x.beginPath(); x.moveTo(70, y + rowH - 8); x.lineTo(W - 70, y + rowH - 8); x.stroke(); x.setLineDash([]);
  });
  // Fuß mit Trinksprüchen
  const fy = H - 150;
  x.fillStyle = '#c0703a'; x.fillRect(0, fy, W, 150);
  x.strokeStyle = 'rgba(41,28,21,.4)'; x.setLineDash([6, 5]); x.strokeRect(12, fy + 12, W - 24, 126); x.setLineDash([]);
  x.textAlign = 'center'; x.fillStyle = '#291c15'; x.font = `700 34px ${HEAD}`; x.letterSpacing = '3px';
  let words = '';
  for (const [w] of CHEERS) { const next = words ? `${words}  •  ${w.toUpperCase()}` : w.toUpperCase(); if (x.measureText(next).width > W - 120) break; words = next; }
  x.fillText(words, W / 2, fy + 70);
  x.font = `600 20px ${HEAD}`; x.letterSpacing = '8px'; x.fillText(`${C.title.toUpperCase()}`, W / 2, fy + 110);
  x.letterSpacing = '0px';
  const blob = await new Promise(ok => c.toBlob(ok, 'image/png'));
  const file = new File([blob], `bierverkostung-rangliste.png`, { type: 'image/png' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: C.title }); return; } catch (e) { if (e.name === 'AbortError') return; }
  }
  download(file.name, blob);
}

/* ---------- Bewegung: Prost in vielen Sprachen ---------- */

setInterval(() => {
  const els = document.querySelectorAll('[data-ch]');
  els.forEach(e => e.classList.add('out'));
  setTimeout(() => {
    ui.cheer = (ui.cheer + 1) % CHEERS.length;
    const [w, l] = CHEERS[ui.cheer];
    els.forEach(e => {
      const t = e.querySelector('textPath') || e;
      t.textContent = e.dataset.ch === 'l' ? l : e.dataset.ch === 'W' ? w.toUpperCase() : w;
      e.classList.remove('out');
    });
  }, 450);
}, 2800);

/* ---------- Hinweis ---------- */

let toastTimer;
function toast(msg, ms = 2400) {
  const t = $('#toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), ms);
}

/* ---------- Start ---------- */

(function start() {
  const m = location.hash.match(/^#d=([A-Za-z0-9_-]+)$/);
  if (m) { history.replaceState(null, '', location.pathname + location.search); if (S.me) setTimeout(() => importLink(m[1]), 0); else ui.pending = m[1]; }
  render();
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
})();
