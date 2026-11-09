'use strict';
/* Erasmus Beer Tasting: everyone rates on their own phone, results are merged via links or live sync. */

const C = window.CONFIG || {};
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------- Data ---------- */

const CATS = [
  { k: 'look', n: 'Colour & foam', s: 'Look', ic: '👀', q: 'Hold it against the light. Colour, clarity, head.' },
  { k: 'aroma', n: 'Aroma', s: 'Aroma', ic: '👃', q: 'Swirl, sniff, think.' },
  { k: 'taste', n: 'Taste', s: 'Taste', ic: '👅', q: 'First sips: malt, hops, balance?' },
  { k: 'finish', n: 'Aftertaste', s: 'Finish', ic: '⏳', q: 'What stays after you swallow?' },
  { k: 'drink', n: 'Drinkability', s: 'Drink', ic: '🍻', q: 'Would you order a second one?' },
  { k: 'overall', n: 'Overall', s: 'Overall', ic: '⭐', q: 'Your gut feeling.' }
];
const DEF_W = { look: 10, aroma: 15, taste: 25, finish: 15, drink: 15, overall: 20 };
const LABELS = [[1.5, 'Drain pour'], [2.25, 'Meh'], [2.9, 'Okay-ish'], [3.4, 'Solid'], [3.9, 'Tasty'], [4.4, 'Excellent'], [9, 'Legendary']];

const SRM = [
  [2, '#FFE699', 'Pale straw'], [3, '#FFD878', 'Straw'], [4, '#FFCA5A', 'Pale gold'], [6, '#F8A600', 'Deep gold'],
  [9, '#E58500', 'Pale amber'], [12, '#CF6900', 'Amber'], [15, '#BB5100', 'Deep amber'], [18, '#A63E00', 'Copper'],
  [21, '#952D00', 'Brown'], [25, '#7B1A00', 'Ruby brown'], [30, '#5E0B00', 'Deep brown'], [40, '#36080A', 'Black']
];
const HEAD = [['none', 'No head', 0], ['thin', 'Thin', 5], ['medium', 'Medium', 12], ['big', 'Big', 20], ['huge', 'Huge', 27]];
const CLARITY = [['clear', 'Clear'], ['hazy', 'Hazy'], ['cloudy', 'Cloudy']];
const NOTES = ['Malty', 'Bready', 'Caramel', 'Honey', 'Sweet', 'Hoppy', 'Bitter', 'Grassy', 'Herbal', 'Citrus', 'Tropical', 'Fruity',
  'Berry', 'Banana', 'Clove', 'Spicy', 'Sour', 'Funky', 'Roasty', 'Coffee', 'Chocolate', 'Smoky', 'Nutty', 'Vanilla',
  'Crisp', 'Creamy', 'Watery', 'Metallic'];
const STYLES = ['Pilsner', 'Lager / Helles', 'Dunkel', 'Märzen / Festbier', 'Bock / Doppelbock', 'Kölsch', 'Altbier', 'Wheat beer',
  'Witbier', 'Pale Ale', 'IPA', 'Hazy IPA', 'Amber / Red Ale', 'Belgian Blonde', 'Dubbel / Tripel', 'Saison', 'Sour / Gose',
  'Lambic / Fruit beer', 'Porter', 'Stout', 'Smoked beer', 'Radler / Shandy', 'Alcohol-free', 'Other'];
const COUNTRIES = [
  ['AL', 'Albania', 'Gëzuar!'], ['AR', 'Argentina', '¡Salud!'], ['AU', 'Australia', 'Cheers!'], ['AT', 'Austria', 'Prost!'],
  ['BE', 'Belgium', 'Santé! Schol!'], ['BA', 'Bosnia and Herzegovina', 'Živjeli!'], ['BR', 'Brazil', 'Saúde!'], ['BG', 'Bulgaria', 'Nazdrave!'],
  ['CA', 'Canada', 'Cheers! Santé!'], ['CL', 'Chile', '¡Salud!'], ['CN', 'China', 'Gānbēi!'], ['CO', 'Colombia', '¡Salud!'],
  ['HR', 'Croatia', 'Živjeli!'], ['CY', 'Cyprus', 'Yia mas!'], ['CZ', 'Czechia', 'Na zdraví!'], ['DK', 'Denmark', 'Skål!'],
  ['EE', 'Estonia', 'Terviseks!'], ['FI', 'Finland', 'Kippis!'], ['FR', 'France', 'Santé!'], ['DE', 'Germany', 'Prost!'],
  ['GR', 'Greece', 'Yia mas!'], ['HU', 'Hungary', 'Egészségedre!'], ['IS', 'Iceland', 'Skál!'], ['IN', 'India', 'Cheers!'],
  ['ID', 'Indonesia', 'Bersulang!'], ['IE', 'Ireland', 'Sláinte!'], ['IL', 'Israel', 'L’chaim!'], ['IT', 'Italy', 'Cin cin!'],
  ['JP', 'Japan', 'Kanpai!'], ['LV', 'Latvia', 'Priekā!'], ['LT', 'Lithuania', 'Į sveikatą!'], ['LU', 'Luxembourg', 'Prost!'],
  ['MT', 'Malta', 'Saħħa!'], ['MX', 'Mexico', '¡Salud!'], ['ME', 'Montenegro', 'Živjeli!'], ['NL', 'Netherlands', 'Proost!'],
  ['NZ', 'New Zealand', 'Cheers!'], ['MK', 'North Macedonia', 'Na zdravje!'], ['NO', 'Norway', 'Skål!'], ['PH', 'Philippines', 'Tagay!'],
  ['PL', 'Poland', 'Na zdrowie!'], ['PT', 'Portugal', 'Saúde!'], ['RO', 'Romania', 'Noroc!'], ['RS', 'Serbia', 'Živeli!'],
  ['SK', 'Slovakia', 'Na zdravie!'], ['SI', 'Slovenia', 'Na zdravje!'], ['ZA', 'South Africa', 'Gesondheid!'], ['KR', 'South Korea', 'Geonbae!'],
  ['ES', 'Spain', '¡Salud!'], ['SE', 'Sweden', 'Skål!'], ['CH', 'Switzerland', 'Proscht! Santé!'], ['TH', 'Thailand', 'Chon kaew!'],
  ['TR', 'Turkey', 'Şerefe!'], ['UA', 'Ukraine', 'Budmo!'], ['GB', 'United Kingdom', 'Cheers!'], ['US', 'United States', 'Cheers!'],
  ['VN', 'Vietnam', 'Một hai ba, dô!'], ['XX', 'Somewhere else', 'Cheers!']
];

/* ---------- State ---------- */

const KEY = 'beer-tasting-v1', FK = 'beer-tasting-foto-', UK = 'beer-tasting-tab';
const fresh = () => ({ me: null, beers: {}, ratings: {}, others: {}, weights: { ...DEF_W }, blind: false, hidden: {}, myFotos: {} });
let S;
try { S = Object.assign(fresh(), JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) { S = fresh(); }
const ui = { tab: localStorage.getItem(UK) || 'beers', sheet: null, pending: null };

function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); }
  catch (e) { toast('Storage is full. Remove a few photos?'); }
}
function save() { persist(); scheduleSync(); }

const foto = id => localStorage.getItem(FK + id);
function setFoto(id, data) {
  try { localStorage.setItem(FK + id, data); return true; }
  catch (e) { toast('Not enough space for this photo'); return false; }
}

/* ---------- Helpers ---------- */

const flag = c => c && /^[A-Z]{2}$/.test(c) && c !== 'XX' ? String.fromCodePoint(...[...c].map(ch => 127397 + ch.charCodeAt(0))) : '🌍';
const country = c => COUNTRIES.find(x => x[0] === c);
const cName = c => country(c)?.[1] || 'Somewhere';
const cheers = c => country(c)?.[2] || 'Cheers!';
const srmOf = v => SRM.find(x => x[0] === v);
const fmt = x => x == null ? '–' : x.toFixed(1);
const label = x => LABELS.find(l => x < l[0])[1];
const rid = () => Math.random().toString(36).slice(2, 10);
const mean = a => a.reduce((s, x) => s + x, 0) / a.length;
const slug = s => s.toLowerCase().replace(/ß/g, 'ss').replace(/ø/g, 'o').replace(/æ/g, 'ae').replace(/ł/g, 'l').replace(/đ/g, 'd')
  .normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'beer';

const beersList = () => Object.values(S.beers).filter(b => !b.del).sort((a, b) => (a.at || 0) - (b.at || 0) || a.id.localeCompare(b.id));
const numOf = id => beersList().findIndex(b => b.id === id) + 1;
const revealed = b => !S.blind || b.byId === S.me?.id || !!S.ratings[b.id];
const bname = b => revealed(b) ? b.name : `Mystery beer #${numOf(b.id)}`;

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

/* ---------- Icons ---------- */

const MUG = `<svg viewBox="0 0 32 32" aria-hidden="true"><path class="foam" d="M6.5 10.5c-1.5-2.6.6-5.4 3.3-4.6.9-2.2 4.2-2.6 5.6-.6 1.7-1.4 4.6-.6 4.9 1.7 2.2.2 2.6 2.7 1.2 3.5z"/><rect class="liq" x="7" y="10.5" width="14" height="17" rx="1.5"/><path class="out" d="M6 9h16v17.5a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 6 26.5zM22 13h2.5a3 3 0 0 1 3 3v4.5a3 3 0 0 1-3 3H22"/></svg>`;
const ICONS = {
  beers: '<path d="M6 3.5h12l-1.6 17h-8.8z"/><path d="M6.6 9.5h10.8"/>',
  rank: '<path d="M3 20.5h18M9 20.5V7.5h6v13M3 20.5v-7h6M15 20.5v-4.5h6"/>',
  group: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.6 2.7-6.2 6-6.2s6 2.6 6 6.2"/><circle cx="17.2" cy="9" r="2.5"/><path d="M15.8 14.1c3 .3 5.2 2.6 5.2 5.9"/>',
  more: '<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>'
};
const TABS = [['beers', 'Beers'], ['rank', 'My ranking'], ['group', 'Group'], ['more', 'More']];

function badge(cls = '') {
  const year = (C.date || '').slice(0, 4) || new Date().getFullYear();
  return `<svg class="badge ${cls}" viewBox="0 0 200 200" aria-hidden="true">
    <defs><path id="badge-ring" d="M100 100m-75 0a75 75 0 1 1 150 0a75 75 0 1 1-150 0"/></defs>
    <circle cx="100" cy="100" r="96" fill="var(--amber)" stroke="var(--ink)" stroke-width="4"/>
    <circle cx="100" cy="100" r="88" fill="none" stroke="var(--ink)" stroke-width="1.5" stroke-dasharray="3 5"/>
    <g class="ring"><text font-size="15" font-weight="800" fill="var(--ink)" textLength="466" lengthAdjust="spacing"><textPath href="#badge-ring">ERASMUS ✦ BEER TASTING ✦ CHEERS ✦ PROST ✦ SKÅL ✦</textPath></text></g>
    <circle cx="100" cy="100" r="58" fill="var(--paper)" stroke="var(--ink)" stroke-width="3"/>
    <g transform="translate(70 62) scale(1.9)">${MUG.replace('<svg viewBox="0 0 32 32" aria-hidden="true">', '').replace('</svg>', '')}</g>
    <text x="100" y="146" text-anchor="middle" font-size="14" font-weight="800" fill="var(--ink)" letter-spacing="2">EST. ${year}</text>
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
  const fh = (HEAD.find(h => h[0] === d.head) || [0, 0, d.head === 'none' ? 0 : 8])[2];
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
  const R = 70, cx = 120, cy = 104, n = CATS.length;
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
  const legend = mine && group ? `<div class="legend"><span><i class="me"></i>You</span><span><i class="grp"></i>Group average</span></div>` : '';
  return `${legend}<svg class="radar" viewBox="0 0 240 205" role="img" aria-label="Scores per category">${g}${series(group, 'grp')}${series(mine, 'me')}</svg>`;
}

function strip(row) {
  const W = 120, x = v => 7 + (v - 1) / 4 * (W - 14);
  return `<svg class="strip" viewBox="0 0 ${W} 16" aria-hidden="true"><line x1="7" x2="${W - 7}" y1="8" y2="8"/>` +
    row.sc.map(s => `<circle cx="${x(s.s).toFixed(1)}" cy="8" r="4.2" class="${s.t.me ? 'me' : ''}"/>`).join('') +
    `<line class="avg" x1="${x(row.avg).toFixed(1)}" x2="${x(row.avg).toFixed(1)}" y1="1" y2="15"/></svg>`;
}

const countryOptions = sel => COUNTRIES.map(([c, n]) => `<option value="${c}"${c === sel ? ' selected' : ''}>${flag(c)} ${esc(n)}</option>`).join('');

/* ---------- Views ---------- */

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
    <p class="sub hand">${esc(C.subtitle)}</p>
    <p class="lead">Everyone brought beers from home. Rate each one on your phone, then see whose country wins.</p>
    ${ui.pending ? '<p class="note">You opened a shared link. It will be imported as soon as you join.</p>' : ''}
    <div class="card form">
      <label>Your name<input id="w-name" maxlength="24" autocomplete="given-name" placeholder="e.g. Sofia"></label>
      <label>Where are you from?<select id="w-country"><option value="">Choose your country</option>${countryOptions('')}</select></label>
      <button class="btn primary big" data-act="start">Let’s taste</button>
    </div>
  </main>`;
}

function marquee() {
  const codes = new Set([S.me?.country, ...Object.values(S.others).map(o => o.country), ...beersList().map(b => b.country)].filter(Boolean));
  let words = [...new Set([...codes].map(c => cheers(c)))];
  if (words.length < 4) words = [...new Set(words.concat(['Prost!', 'Skål!', '¡Salud!', 'Cin cin!', 'Santé!', 'Na zdrowie!', 'Kippis!', 'Şerefe!']))];
  const line = words.map(w => `<span>${esc(w)}</span>`).join('<i>✦</i>');
  return `<div class="marquee" aria-hidden="true"><div>${line}<i>✦</i>${line}<i>✦</i></div></div>`;
}

function viewBeers() {
  const L = beersList(), rated = L.filter(b => S.ratings[b.id]).length;
  const pct = L.length ? Math.round(rated / L.length * 100) : 0;
  const date = C.date ? new Date(C.date + 'T12:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
  return `<header class="hero">
      ${badge()}
      <div>
        <h1>${esc(C.title)}</h1>
        <p class="sub hand">${esc(C.subtitle)}${date ? ` · ${date}` : ''}</p>
        <p class="hi">Hi ${esc(S.me.name)} ${flag(S.me.country)}</p>
      </div>
    </header>
    ${marquee()}
    <div class="progress card">
      <div class="pg"><div style="width:${pct}%"></div></div>
      <span><b>${rated}</b> of ${L.length} beer${L.length === 1 ? '' : 's'} rated${S.blind ? ' · blind mode' : ''}</span>
    </div>
    <div class="actions">
      <button class="btn primary" data-act="add">＋ Add a beer</button>
      ${L.length > rated ? '<button class="btn" data-act="surprise">🎲 Pick my next beer</button>' : ''}
    </div>
    ${L.length ? `<ul class="beers">${L.map(card).join('')}</ul>` : `<div class="empty card"><p class="hand">The fridge is empty.</p><p>Add the beers you brought. Name, country and a photo of the bottle are enough.${C.firebase ? ' Everyone in the room sees them right away.' : ' Then share the list from the Group tab.'}</p></div>`}`;
}

function card(b) {
  const r = S.ratings[b.id], s = score(r), rev = revealed(b), f = rev && foto(b.id);
  const meta = rev ? [`${flag(b.country)} ${esc(cName(b.country))}`, esc(b.style), b.abv ? `${b.abv} %` : ''].filter(Boolean).join(' · ') : 'Blind mode: rate it to reveal';
  return `<li class="beer ${r ? 'done' : ''}" data-act="open" data-id="${b.id}">
    <div class="thumb">${f ? `<img src="${f}" alt="">` : glass(r?.srm || (rev ? beerSrm(b.id) : null), r?.head)}<span class="num">${numOf(b.id)}</span></div>
    <div class="info"><b>${esc(bname(b))}</b><small>${meta}</small>${rev && b.by ? `<small class="by">brought by ${esc(b.by)}</small>` : ''}</div>
    <div class="sc">${s != null ? `<strong>${fmt(s)}</strong><span>${label(s)}</span>` : '<span class="go">Rate ›</span>'}</div>
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
  // items: [{b, cat:{k:value}}]
  return `<div class="champs">${CATS.map(c => {
    const best = items.filter(x => x.cat[c.k]).sort((a, b) => b.cat[c.k] - a.cat[c.k])[0];
    return `<div class="champ card"><small>${c.ic} Best ${c.n.toLowerCase()}</small><b>${best ? esc(bname(best.b)) : '–'}</b><span>${best ? fmt(best.cat[c.k]) : ''}</span></div>`;
  }).join('')}</div>`;
}

function weightsPanel() {
  const tot = CATS.reduce((s, c) => s + (S.weights[c.k] || 0), 0) || 1;
  return `<details class="card weights">
    <summary>How the score is calculated</summary>
    <p>Your score is the weighted average of all categories you rated (1 to 5). Drag to change how much each category counts. The ranking updates when you let go.</p>
    ${CATS.map(c => `<label class="wrow"><span>${c.n}</span><input type="range" min="0" max="40" step="5" value="${S.weights[c.k] || 0}" data-in="w" data-k="${c.k}"><em id="wv-${c.k}">${Math.round((S.weights[c.k] || 0) / tot * 100)} %</em></label>`).join('')}
    <button class="btn small" data-act="wReset">Back to default</button>
  </details>`;
}

function viewRank() {
  const L = myRanked();
  if (!L.length) return `<h2 class="title">My ranking</h2><div class="empty card"><p class="hand">Nothing rated yet.</p><p>Rate your first beer and it shows up here.</p><button class="btn primary" data-tab="beers">To the beers</button></div>`;
  return `<h2 class="title">My ranking</h2>
    ${podium(L, 'mine')}
    <ol class="rank">${L.map((x, i) => rankRow(x, i)).join('')}</ol>
    <h3 class="sect">Category champions</h3>
    ${champions(L.map(x => ({ b: x.b, cat: x.r })))}
    ${weightsPanel()}
    <div class="actions"><button class="btn" data-act="img" data-mode="mine">📸 Share as image</button></div>`;
}

function syncBox() {
  if (C.firebase) {
    const st = live.ok === null ? ['wait', 'Connecting…'] : live.ok ? ['ok', `Live in room “${esc(ROOM)}”`] : ['bad', 'No connection, retrying'];
    return `<div class="card sync"><p class="live ${st[0]}"><i></i>${st[1]}</p><p>Ratings and new beers sync automatically every few seconds.</p>
      <div class="actions"><button class="btn small" data-act="invite">Invite with QR code</button></div></div>`;
  }
  return `<div class="card sync">
    <p>Each phone keeps its own ratings. To compare, send your ratings as a link (e.g. in your group chat). When friends open it, you appear in their group ranking. The link also carries your beer list.</p>
    <div class="actions">
      <button class="btn primary small" data-act="shareMine">Share my ratings</button>
      <button class="btn small" data-act="qrMine">Show as QR code</button>
    </div>
    <label class="paste">Got a link? Paste it here<span><input id="paste" placeholder="https://…#d=…" autocomplete="off"><button class="btn small" data-act="importPaste">Import</button></span></label>
  </div>`;
}

function awards(T, rows) {
  const A = [];
  // Crowd favourite only counts beers that at least half of the tasters have rated.
  const minVotes = Math.max(1, Math.ceil(Math.max(...rows.map(r => r.n)) / 2));
  const fav = rows.find(r => r.n >= minVotes);
  if (fav) A.push(['🏆', 'Crowd favourite', bname(fav.b), `${fmt(fav.avg)} from ${fav.n} taster${fav.n === 1 ? '' : 's'}`]);
  const con = rows.filter(r => r.n >= 2).sort((a, b) => b.sd - a.sd)[0];
  if (con && con.sd >= .25) {
    const v = con.sc.map(x => x.s);
    A.push(['🌶️', 'Most controversial', bname(con.b), `scores from ${fmt(Math.min(...v))} to ${fmt(Math.max(...v))}`]);
  }
  const love = rows.filter(r => r.n >= 2).sort((a, b) => a.sd - b.sd)[0];
  if (love && rows.length > 2 && love !== con) A.push(['🤝', 'Everyone agrees', bname(love.b), `all within ${fmt(Math.max(...love.sc.map(x => x.s)) - Math.min(...love.sc.map(x => x.s)))} points`]);

  if (T.length >= 2) {
    const given = T.map(t => ({ t, v: beersList().map(b => score(t.ratings[b.id])).filter(x => x != null) })).filter(x => x.v.length >= 3)
      .map(x => ({ ...x, m: mean(x.v) })).sort((a, b) => a.m - b.m);
    if (given.length >= 2) {
      A.push(['🧐', 'Toughest critic', given[0].t.name, `average score ${fmt(given[0].m)}`]);
      A.push(['🥰', 'Most generous', given[given.length - 1].t.name, `average score ${fmt(given[given.length - 1].m)}`]);
    }
    const nose = T.map(t => {
      const e = beersList().filter(b => b.abv && t.ratings[b.id]?.abv).map(b => Math.abs(t.ratings[b.id].abv - b.abv));
      return { t, n: e.length, m: e.length ? mean(e) : 99 };
    }).filter(x => x.n >= 2).sort((a, b) => a.m - b.m)[0];
    if (nose) A.push(['👃', 'Best nose', nose.t.name, `ABV guesses off by ${nose.m.toFixed(1)} % on average`]);
    let twins = null;
    for (let i = 0; i < T.length; i++) for (let j = i + 1; j < T.length; j++) {
      const d = beersList().map(b => [score(T[i].ratings[b.id]), score(T[j].ratings[b.id])]).filter(([a, b]) => a != null && b != null).map(([a, b]) => Math.abs(a - b));
      if (d.length >= 3 && (!twins || mean(d) < twins.m)) twins = { a: T[i], b: T[j], m: mean(d) };
    }
    if (twins) A.push(['👯', 'Taste twins', `${twins.a.name} & ${twins.b.name}`, `only ${twins.m.toFixed(2)} points apart on average`]);
    const pat = T.map(t => {
      const own = [], other = [];
      for (const b of beersList()) { const s = score(t.ratings[b.id]); if (s == null) continue; (b.country === t.country ? own : other).push(s); }
      return own.length && other.length ? { t, d: mean(own) - mean(other) } : null;
    }).filter(Boolean).sort((a, b) => b.d - a.d)[0];
    if (pat && pat.d >= .3) A.push(['🚩', 'Patriot award', pat.t.name, `rates beers from home ${pat.d.toFixed(1)} points higher`]);
  }
  return A.length ? `<div class="awards">${A.map(([ic, t, w, d]) => `<div class="award card"><span class="ic">${ic}</span><small>${t}</small><b>${esc(w)}</b><span>${esc(d)}</span></div>`).join('')}</div>` : '';
}

function countryCup(rows) {
  const by = {};
  for (const r of rows) if (revealed(r.b)) (by[r.b.country || 'XX'] ||= []).push(r.avg);
  const list = Object.entries(by).map(([c, v]) => ({ c, m: mean(v), n: v.length })).sort((a, b) => b.m - a.m);
  if (list.length < 2) return '';
  return `<h3 class="sect">Country cup</h3><ol class="cup card">${list.map((x, i) => `<li><span class="rk">${i + 1}</span><span class="fl">${flag(x.c)}</span><span class="nm">${esc(cName(x.c))}<small>${x.n} beer${x.n === 1 ? '' : 's'}</small></span><span class="bar"><i style="width:${(x.m - 1) / 4 * 100}%"></i></span><b>${fmt(x.m)}</b></li>`).join('')}</ol>`;
}

function viewGroup() {
  const { T, rows } = groupStats();
  const all = [{ id: S.me.id, name: S.me.name, country: S.me.country, ratings: S.ratings, me: true }, ...Object.values(S.others)];
  const chips = all.map(t => {
    const n = Object.keys(t.ratings || {}).filter(id => S.beers[id] && !S.beers[id].del).length, off = S.hidden[t.id];
    return `<button class="chip ${off ? '' : 'on'}" ${t.me ? 'disabled' : `data-act="toggleT" data-id="${t.id}"`}>${flag(t.country)} ${esc(t.name)}${t.me ? ' (you)' : ''} · ${n}</button>`;
  }).join('');
  return `<h2 class="title">Group</h2>
    ${syncBox()}
    <h3 class="sect">Tasters <small>${T.length} counted${Object.keys(S.others).length ? ' · tap to leave someone out' : ''}</small></h3>
    <div class="chips">${chips}</div>
    ${rows.length ? `
      ${podium(rows.map(r => ({ b: r.b, s: r.avg })), 'group')}
      <ol class="rank group">${rows.map((r, i) => rankRow({ b: r.b, s: r.avg }, i, `<div class="spread">${strip(r)}<em>${r.n} vote${r.n === 1 ? '' : 's'}</em></div>`)).join('')}</ol>
      <p class="hint">Dots: each taster’s score, yours in amber. Line: group average.</p>
      ${awards(T, rows)}
      ${countryCup(rows)}
      <h3 class="sect">Category champions</h3>
      ${champions(rows.map(r => ({ b: r.b, cat: r.cat })))}
      <div class="actions"><button class="btn" data-act="img" data-mode="group">📸 Share group ranking</button><button class="btn" data-act="csv">⬇ Download table (CSV)</button></div>`
    : `<div class="empty card"><p class="hand">No scores yet.</p><p>As soon as someone rates a beer, the group ranking appears here.</p></div>`}`;
}

function viewMore() {
  return `<h2 class="title">More</h2>
    <div class="card form">
      <h3>Your profile</h3>
      <label>Name<input id="p-name" maxlength="24" value="${esc(S.me.name)}"></label>
      <label>Country<select id="p-country">${countryOptions(S.me.country)}</select></label>
      <button class="btn small" data-act="saveProfile">Save profile</button>
    </div>
    <div class="card">
      <h3>Blind tasting</h3>
      <label class="switch"><input type="checkbox" id="blind" ${S.blind ? 'checked' : ''}><span></span>Hide names, countries and photos until you have rated a beer</label>
      <p class="hint">Fun with numbered glasses: whoever brought a beer pours it as “Beer #3”. In blind mode you can also guess the alcohol content; the best guesser wins the “Best nose” award.</p>
    </div>
    <div class="card">
      <h3>Invite friends</h3>
      <p>Let the others scan the QR code to open this page.</p>
      <div class="actions"><button class="btn small" data-act="invite">Show QR code</button><button class="btn small" data-act="inviteCopy">Copy link</button></div>
    </div>
    <div class="card">
      <h3>Export and backup</h3>
      <div class="actions col">
        <button class="btn small" data-act="csv">⬇ Table with all ratings (CSV for Excel)</button>
        <button class="btn small" data-act="img" data-mode="mine">📸 My ranking as image</button>
        <button class="btn small" data-act="img" data-mode="group">📸 Group ranking as image</button>
        <button class="btn small" data-act="backup">💾 Full backup incl. photos (JSON)</button>
        <label class="btn small">↩ Restore backup<input type="file" id="restore" accept="application/json,.json" hidden></label>
      </div>
    </div>
    <div class="card">
      <h3>Start over</h3>
      <p class="hint">Deletes all beers, ratings and photos on this phone.</p>
      <button class="btn small danger" data-act="reset">Delete everything</button>
    </div>
    <p class="foot hand">${esc(C.title)} · data stays on your phone${C.firebase ? ' and in the shared room' : ''}</p>`;
}

/* ---------- Sheets ---------- */

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
const shHead = (t, sub = '') => `<div class="sh-head"><div><h2>${t}</h2>${sub}</div><button class="x" data-act="close" aria-label="Close">✕</button></div>`;

function sheetBeer() {
  const s = ui.sheet, b = s.id ? S.beers[s.id] : { by: S.me.name, country: S.me.country };
  const f = s.photo || (!s.rm && s.id && foto(s.id));
  const names = [...new Set([S.me.name, ...Object.values(S.others).map(o => o.name), ...beersList().map(x => x.by)].filter(Boolean))];
  return `${shHead(s.id ? 'Edit beer' : 'Add a beer')}
    <div class="form">
      <div class="photo"><div id="b-prev" class="prev">${f ? `<img src="${f}" alt="">` : glass(null)}</div>
        <div class="col"><label class="btn small">📷 ${f ? 'Change photo' : 'Add photo'}<input type="file" id="b-photo" accept="image/*" hidden></label>
        ${f ? '<button class="btn small ghost" data-act="rmPhoto">Remove photo</button>' : ''}</div></div>
      <label>Name of the beer *<input id="b-name" maxlength="40" value="${esc(b.name)}" placeholder="e.g. Pilsner Urquell" ${s.id ? '' : 'autofocus'}></label>
      <label>Brewery<input id="b-brewery" maxlength="40" value="${esc(b.brewery)}"></label>
      <div class="row">
        <label>Country<select id="b-country">${countryOptions(b.country)}</select></label>
        <label class="abv">ABV %<input id="b-abv" type="number" inputmode="decimal" step="0.1" min="0" max="20" value="${b.abv ?? ''}"></label>
      </div>
      <label>Style<select id="b-style"><option value="">Not sure</option>${STYLES.map(x => `<option${x === b.style ? ' selected' : ''}>${esc(x)}</option>`).join('')}</select></label>
      <label>Brought by<input id="b-by" maxlength="24" list="b-names" value="${esc(b.by)}"><datalist id="b-names">${names.map(n => `<option value="${esc(n)}">`).join('')}</datalist></label>
      <button class="btn primary big" data-act="saveBeer">${s.id ? 'Save changes' : 'Add to the list'}</button>
      ${s.id ? '<button class="btn small danger" data-act="delBeer">Delete this beer</button>' : ''}
    </div>`;
}

function mugRow(c, d) {
  const v = d[c.k] || 0;
  return `<div class="cat">
    <div class="cat-h"><h3>${c.ic} ${c.n}</h3><em>${v ? `${v} / 5` : ''}</em></div>
    <p class="q">${c.q}</p>
    <div class="mugs">${[1, 2, 3, 4, 5].map(i => `<button class="mug ${v >= i ? 'full' : v >= i - .5 ? 'half' : ''}" data-act="mug" data-k="${c.k}" data-v="${i}" aria-label="${i} of 5">${MUG}</button>`).join('')}</div>
  </div>`;
}

function sheetRate() {
  const s = ui.sheet, b = S.beers[s.id], d = s.draft, rev = revealed(b), sc = score(d);
  const done = CATS.filter(c => d[c.k]).length;
  const meta = rev ? `<p class="meta">${flag(b.country)} ${esc(cName(b.country))}${b.style ? ' · ' + esc(b.style) : ''}${b.abv ? ` · ${b.abv} %` : ''}${b.brewery ? '<br>' + esc(b.brewery) : ''}</p>` : '<p class="meta">Blind mode: you’ll find out after saving.</p>';
  const cat = k => mugRow(CATS.find(c => c.k === k), d);
  return `${shHead(`<small>Beer #${numOf(b.id)}</small>${esc(bname(b))}`, meta)}
    <div class="stage">${bigGlass(d)}<div class="cheers hand">${esc(rev ? cheers(b.country) : 'Cheers!')}</div></div>
    <section class="blk">
      <h3>Colour</h3>
      <div class="srm">${SRM.map(x => `<button class="sw ${d.srm === x[0] ? 'on' : ''}" style="--c:${x[1]}" data-act="srm" data-v="${x[0]}" aria-label="${x[2]}"></button>`).join('')}</div>
      <p class="srm-name">${d.srm ? `<b>${srmOf(d.srm)[2]}</b> · SRM ${d.srm}` : 'Pick the shade closest to your glass.'}</p>
      <div class="opt"><span>Head</span><div class="chips">${HEAD.map(h => `<button class="chip ${d.head === h[0] ? 'on' : ''}" data-act="head" data-v="${h[0]}">${h[1]}</button>`).join('')}</div></div>
      <div class="opt"><span>Clarity</span><div class="chips">${CLARITY.map(h => `<button class="chip ${d.clarity === h[0] ? 'on' : ''}" data-act="clarity" data-v="${h[0]}">${h[1]}</button>`).join('')}</div></div>
      ${cat('look')}
    </section>
    <section class="blk">${cat('aroma')}${cat('taste')}
      <h3 class="mt">What do you smell and taste?</h3>
      <div class="chips notes">${NOTES.map((n, i) => `<button class="chip ${d.notes.includes(i) ? 'on' : ''}" data-act="note" data-v="${i}">${n}</button>`).join('')}</div>
    </section>
    <section class="blk">${cat('finish')}${cat('drink')}${cat('overall')}</section>
    ${!rev ? `<section class="blk"><h3>🎯 Guess the ABV</h3><p class="q">How strong is it? Closest guesser wins “Best nose”.</p>
      <div class="abvguess"><input type="range" min="0" max="12" step="0.1" value="${d.abv || 5}" data-in="abv"><output id="abv-out">${(d.abv || 5).toFixed(1)} %</output></div></section>` : ''}
    <section class="blk"><h3>Notes</h3><textarea data-in="text" maxlength="300" rows="3" placeholder="Anything worth remembering?">${esc(d.text)}</textarea></section>
    <div class="savebar">
      <div class="live-score"><strong>${fmt(sc)}</strong><span>${sc != null ? label(sc) : 'Tap the mugs'}<br><small>${done} of 6 categories</small></span></div>
      <button class="btn primary" data-act="saveRating">Save</button>
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
  return `${shHead(`<small>Beer #${numOf(b.id)}</small>${esc(bname(b))}`, rev ? `<p class="meta">${flag(b.country)} ${esc(cName(b.country))}${b.style ? ' · ' + esc(b.style) : ''}${b.abv ? ` · ${b.abv} %` : ''}${b.brewery ? '<br>' + esc(b.brewery) : ''}${b.by ? `<br>brought by ${esc(b.by)}` : ''}</p>` : '')}
    ${f ? `<img class="hero-img" src="${f}" alt="">` : ''}
    <div class="scores">
      <div class="card big-score"><small>You</small><strong>${fmt(ms)}</strong><span>${ms != null ? label(ms) : 'not rated'}</span></div>
      ${row && (others.length || !my) ? `<div class="card big-score"><small>Group · ${row.n}</small><strong>${fmt(row.avg)}</strong><span>${label(row.avg)}</span></div>` : ''}
    </div>
    ${my || row ? radar(my, others.length ? row.cat : (!my ? row?.cat : null)) : ''}
    ${my ? `<table class="breakdown">${CATS.map(c => `<tr><th>${c.n}</th><td>${my[c.k] || '–'}</td>${others.length ? `<td class="g">${fmt(row.cat[c.k])}</td>` : ''}</tr>`).join('')}
      ${others.length ? '<tr class="lg"><th></th><td>you</td><td class="g">group</td></tr>' : ''}</table>` : ''}
    ${my ? `<div class="mynotes">
      ${my.srm ? `<span class="tag"><i style="background:${srmOf(my.srm)[1]}"></i>${srmOf(my.srm)[2]}</span>` : ''}
      ${my.head ? `<span class="tag">${HEAD.find(h => h[0] === my.head)?.[1]} head</span>` : ''}
      ${my.clarity ? `<span class="tag">${CLARITY.find(h => h[0] === my.clarity)?.[1]}</span>` : ''}
      ${(my.notes || []).map(n => `<span class="tag">${NOTES[n] || ''}</span>`).join('')}
      ${my.abv && b.abv ? `<span class="tag">ABV guess ${my.abv.toFixed(1)} % (real ${b.abv} %)</span>` : ''}
      ${my.text ? `<p class="hand quote">“${esc(my.text)}”</p>` : ''}</div>` : ''}
    ${topNotes.length && others.length ? `<h3 class="sect">The group tasted</h3><div class="chips">${topNotes.map(([n, k]) => `<span class="chip on">${NOTES[n]} ×${k}</span>`).join('')}</div>` : ''}
    ${others.length ? `<h3 class="sect">What the others say</h3><ul class="others">${others.sort((a, b) => b.s - a.s).map(x => `<li><span>${flag(x.t.country)} ${esc(x.t.name)}</span><b>${fmt(x.s)}</b>${rev && x.r.text ? `<p class="hand">“${esc(x.r.text)}”</p>` : ''}</li>`).join('')}</ul>` : ''}
    <div class="actions col">
      <button class="btn primary" data-act="rate" data-id="${b.id}">${my ? 'Change my rating' : 'Rate this beer'}</button>
      ${rev ? `<button class="btn small" data-act="editBeer" data-id="${b.id}">Edit beer details</button>` : ''}
    </div>`;
}

function sheetReveal() {
  const b = S.beers[ui.sheet.id], r = S.ratings[b.id], s = score(r), f = foto(b.id);
  const guess = r.abv && b.abv ? `<p class="guess">Your ABV guess: <b>${r.abv.toFixed(1)} %</b>, real: <b>${b.abv} %</b>${Math.abs(r.abv - b.abv) <= .3 ? ' · what a nose!' : ''}</p>` : '';
  return `<div class="reveal">
    <button class="x" data-act="close" aria-label="Close">✕</button>
    <p class="hand">Beer #${numOf(b.id)} was…</p>
    ${f ? `<img src="${f}" alt="">` : glass(r.srm, r.head)}
    <h2>${esc(b.name)}</h2>
    <p class="meta">${flag(b.country)} ${esc(cName(b.country))}${b.style ? ' · ' + esc(b.style) : ''}${b.brewery ? '<br>' + esc(b.brewery) : ''}${b.by ? `<br>brought by ${esc(b.by)}` : ''}</p>
    ${guess}
    <p class="you">You gave it <b>${fmt(s)}</b> · ${label(s)}</p>
    <p class="cheers hand">${esc(cheers(b.country))}</p>
    <div class="actions">${beersList().some(x => !S.ratings[x.id]) ? '<button class="btn primary" data-act="surprise">Next beer</button>' : ''}<button class="btn" data-act="close">Done</button></div>
  </div>`;
}

function sheetQR() {
  const s = ui.sheet, code = window.QR ? QR.svg(s.text) : null;
  return `${shHead(esc(s.title))}
    <div class="qr">${code || '<p>Too much data for a QR code. Please use “Share” instead.</p>'}</div>
    <p class="hint center">${esc(s.hint || '')}</p>
    <div class="actions"><button class="btn" data-act="copyQR">Copy link</button>${navigator.share ? '<button class="btn" data-act="shareQR">Share…</button>' : ''}</div>`;
}

/* ---------- Actions ---------- */

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
    const name = $('#w-name').value.trim(), c = $('#w-country').value;
    if (!name) { toast('Tell us your name'); $('#w-name').focus(); return; }
    S.me = { id: rid(), name, country: c || 'XX' };
    save(); render();
    if (ui.pending) { const p = ui.pending; ui.pending = null; importData(p); }
    else toast(`${cheers(S.me.country)} Welcome, ${name}!`);
  },
  add() { openSheet({ type: 'beer' }); },
  open(el) { openBeer(el.dataset.id, el.dataset.detail === '1'); },
  rate(el) { startRate(el.dataset.id); },
  editBeer(el) { openSheet({ type: 'beer', id: el.dataset.id }); },
  close() { closeSheet(); },
  surprise() {
    const open = beersList().filter(b => !S.ratings[b.id]);
    if (!open.length) { toast('You have rated every beer!'); return; }
    const b = open[Math.floor(Math.random() * open.length)];
    startRate(b.id);
    toast(`🎲 Your next one: Beer #${numOf(b.id)}`);
  },
  saveBeer() {
    const s = ui.sheet, name = $('#b-name').value.trim();
    if (!name) { toast('Give the beer a name'); $('#b-name').focus(); return; }
    let id = s.id;
    if (!id) {
      id = slug(name);
      if (S.beers[id] && !S.beers[id].del) { toast('That beer is already on the list'); return; }
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
    toast(prev ? 'Saved' : `${name} is on the list`);
  },
  delBeer() {
    const b = S.beers[ui.sheet.id];
    if (!confirm(`Delete “${b.name}” from the list? Ratings for it will no longer count.`)) return;
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
    if (!CATS.some(c => d[c.k])) { toast('Tap at least one mug first'); return; }
    const wasRevealed = revealed(b), first = !S.ratings[b.id];
    if (!wasRevealed && d.abv == null) d.abv = 5;
    S.ratings[b.id] = { ...d, at: Date.now() };
    save(); render();
    if (!wasRevealed) { openSheet({ type: 'reveal', id: b.id }); return; }
    closeSheet();
    const n = Object.keys(S.ratings).length;
    toast(`${cheers(b.country)} Saved.${first && n % 4 === 0 ? ' Maybe a glass of water? 💧' : ''}`);
  },
  async shareMine() {
    const url = await encodeLink();
    share(`${S.me.name}’s beer ratings`, `${S.me.name}’s ratings from the ${C.title}. Open to add them to your group ranking:`, url);
  },
  async qrMine() {
    const url = await encodeLink();
    openSheet({ type: 'qr', title: 'My ratings', text: url, hint: 'Let a friend scan this. Your beers and ratings are added on their phone.' });
  },
  importPaste() {
    const v = $('#paste').value.trim(), m = v.match(/#d=([A-Za-z0-9_-]+)/);
    if (!m) { toast('That doesn’t look like a rating link'); return; }
    importData(m[1]);
  },
  toggleT(el) {
    const id = el.dataset.id;
    if (S.hidden[id]) delete S.hidden[id]; else S.hidden[id] = true;
    persist(); render();
  },
  invite() { openSheet({ type: 'qr', title: 'Join the tasting', text: inviteUrl(), hint: 'Scan with the phone camera to open the tasting page.' }); },
  inviteCopy() { copy(inviteUrl()); },
  copyQR() { copy(ui.sheet.text); },
  shareQR() { share(ui.sheet.title, '', ui.sheet.text); },
  csv() { exportCSV(); },
  img(el) { shareImage(el.dataset.mode); },
  backup() {
    const fotos = {};
    for (const b of Object.values(S.beers)) { const f = foto(b.id); if (f) fotos[b.id] = f; }
    download(`beer-tasting-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ app: 'beer-tasting', v: 1, state: S, fotos }), 'application/json');
  },
  saveProfile() {
    const name = $('#p-name').value.trim();
    if (!name) { toast('Name can’t be empty'); return; }
    S.me.name = name; S.me.country = $('#p-country').value;
    save(); render(); toast('Profile saved');
  },
  wReset() { S.weights = { ...DEF_W }; persist(); render(); },
  reset() {
    if (!confirm('Really delete all beers, ratings and photos on this phone?')) return;
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

document.addEventListener('input', e => {
  const t = e.target, d = ui.sheet?.draft;
  if (t.dataset.in === 'text' && d) d.text = t.value;
  if (t.dataset.in === 'abv' && d) { d.abv = +t.value; $('#abv-out').textContent = d.abv.toFixed(1) + ' %'; }
  if (t.dataset.in === 'w') {
    const w = { ...S.weights, [t.dataset.k]: +t.value }, tot = CATS.reduce((s, c) => s + (w[c.k] || 0), 0) || 1;
    CATS.forEach(c => { $('#wv-' + c.k).textContent = Math.round((w[c.k] || 0) / tot * 100) + ' %'; });
  }
});

document.addEventListener('change', async e => {
  const t = e.target;
  if (t.id === 'b-photo' && t.files[0]) {
    try { ui.sheet.photo = await shrink(t.files[0]); ui.sheet.rm = false; renderBeerPreview(); }
    catch (err) { toast('Could not read this photo'); }
  }
  if (t.dataset.in === 'w') { S.weights[t.dataset.k] = +t.value; persist(); render(); }
  if (t.id === 'blind') { S.blind = t.checked; persist(); render(); toast(S.blind ? 'Blind mode on. No peeking!' : 'Blind mode off'); }
  if (t.id === 'restore' && t.files[0]) {
    try {
      const data = JSON.parse(await t.files[0].text());
      if (data.app !== 'beer-tasting' || !data.state) throw new Error('format');
      if (!confirm('Replace everything on this phone with the backup?')) return;
      S = Object.assign(fresh(), data.state);
      for (const [id, f] of Object.entries(data.fotos || {})) setFoto(id, f);
      save(); render(); toast('Backup restored');
    } catch (err) { toast('This is not a valid backup file'); }
    t.value = '';
  }
});

/* ---------- Photos ---------- */

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

/* ---------- Sharing via links ---------- */

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
    if (count || S.others[tid]) S.others[tid] = { id: tid, name: str(tname, 24) || 'Friend', country: str(tc, 2), ratings };
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
  if (window.CompressionStream) { try { bytes = await pipe(bytes, new CompressionStream('deflate-raw')); pre = 'z'; } catch (e) { /* plain */ } }
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
    if (res.self) toast('That’s your own link');
    else toast(`Imported ${res.name}: ${res.count} rating${res.count === 1 ? '' : 's'}${res.newBeers ? `, ${res.newBeers} new beer${res.newBeers === 1 ? '' : 's'}` : ''}`, 3500);
    if (res.count && ui.tab !== 'group' && !res.self) { ui.tab = 'group'; localStorage.setItem(UK, 'group'); render(); }
  } catch (e) { toast('This link could not be read'); }
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
  try { await navigator.clipboard.writeText(t); toast('Link copied'); }
  catch (e) { prompt('Copy this link:', t); }
}

/* ---------- Live sync (optional, Firebase Realtime Database via REST) ---------- */

const FB = (C.firebase || '').trim().replace(/\/+$/, '');
const ROOM = (new URLSearchParams(location.search).get('room') || C.room || 'tasting').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40) || 'tasting';
const live = { ok: null, lastPull: '', lastPush: '', remote: null, tried: {} };
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
  try { await fetch(`${FB}/rooms/${ROOM}/fotos/${id}.json`, { method: 'PUT', body: JSON.stringify(f) }); } catch (e) { /* retried in pull */ }
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
      for (const p of Object.values(data)) { try { merge(p); } catch (e) { /* skip broken entry */ } }
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
  } catch (e) { /* next round */ }
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
  const lines = [['Taster', 'From', 'Beer #', 'Beer', 'Brewery', 'Country', 'Style', 'ABV', 'Brought by', ...CATS.map(c => c.n),
    'Score', 'Colour', 'Head', 'Clarity', 'Notes', 'ABV guess', 'Comment'].map(q).join(';')];
  for (const t of tasters()) for (const b of beersList()) {
    const r = t.ratings[b.id];
    if (!r) continue;
    lines.push([t.name, cName(t.country), numOf(b.id), b.name, b.brewery, cName(b.country), b.style, dec(b.abv), b.by,
      ...CATS.map(c => dec(r[c.k])), dec(score(r)), srmOf(r.srm)?.[2] || '', HEAD.find(h => h[0] === r.head)?.[1] || '',
      CLARITY.find(h => h[0] === r.clarity)?.[1] || '', (r.notes || []).map(n => NOTES[n]).join(', '), dec(r.abv), r.text].map(q).join(';'));
  }
  download(`beer-tasting-${new Date().toISOString().slice(0, 10)}.csv`, '﻿' + lines.join('\r\n'), 'text/csv;charset=utf-8');
}

async function shareImage(mode) {
  const group = mode === 'group';
  const list = group ? groupStats().rows.map(r => ({ b: r.b, s: r.avg, v: beerSrm(r.b.id), n: r.n })) : myRanked().map(x => ({ b: x.b, s: x.s, v: x.r.srm }));
  if (!list.length) { toast('Nothing to show yet'); return; }
  const top = list.slice(0, 10), W = 1080, rowH = 96, H = 400 + top.length * rowH + 150;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d');
  try { await Promise.all(['800 64px Fraunces', '700 36px Nunito', '400 40px Gochi'].map(f => document.fonts.load(f))); } catch (e) { /* fallback fonts */ }
  const SERIF = 'Fraunces, Georgia, serif', SANS = 'Nunito, Arial, sans-serif', HAND = 'Gochi, "Comic Sans MS", cursive';
  x.fillStyle = '#f6ecd9'; x.fillRect(0, 0, W, H);
  x.fillStyle = 'rgba(180,101,10,.13)';
  for (let yy = 12; yy < H; yy += 26) for (let xx = 12; xx < W; xx += 26) { x.beginPath(); x.arc(xx, yy, 1.6, 0, 7); x.fill(); }
  x.strokeStyle = '#2a1708'; x.lineWidth = 6; x.strokeRect(30, 30, W - 60, H - 60);
  x.lineWidth = 2; x.strokeRect(44, 44, W - 88, H - 88);
  x.fillStyle = '#f0a81c'; x.fillRect(44, 44, W - 88, 250);
  x.fillStyle = '#2a1708'; x.textAlign = 'center';
  x.font = `800 74px ${SERIF}`; x.fillText(C.title || 'Beer Tasting', W / 2, 150);
  x.font = `400 42px ${HAND}`;
  x.fillText(group ? `Group ranking · ${tasters().length} taster${tasters().length === 1 ? '' : 's'}` : `${S.me.name}’s ranking`, W / 2, 215);
  x.font = `700 28px ${SANS}`;
  x.fillText(C.date ? new Date(C.date + 'T12:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '', W / 2, 262);
  x.beginPath(); x.moveTo(44, 294); x.lineTo(W - 44, 294); x.stroke();
  const fit = (t, max) => { if (x.measureText(t).width <= max) return t; while (t.length > 1 && x.measureText(t + '…').width > max) t = t.slice(0, -1); return t + '…'; };
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
    const sub = revealed(it.b) ? [`${flag(it.b.country)} ${cName(it.b.country)}`, it.b.style, it.n ? `${it.n} votes` : ''].filter(Boolean).join(' · ') : '';
    x.fillText(fit(sub, 600), 246, y + 70);
    x.textAlign = 'right'; x.fillStyle = '#2a1708'; x.font = `800 52px ${SERIF}`; x.fillText(fmt(it.s), W - 90, y + 54);
  });
  x.textAlign = 'center'; x.font = `400 40px ${HAND}`; x.fillStyle = '#b4650a';
  const words = [...new Set(top.map(t => cheers(t.b.country)))].slice(0, 4).join('  ·  ');
  x.fillText(words || 'Cheers!', W / 2, H - 80);
  const blob = await new Promise(ok => c.toBlob(ok, 'image/png'));
  const file = new File([blob], group ? 'group-ranking.png' : 'my-ranking.png', { type: 'image/png' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: C.title }); return; } catch (e) { if (e.name === 'AbortError') return; }
  }
  download(file.name, blob);
}

/* ---------- Toast ---------- */

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
