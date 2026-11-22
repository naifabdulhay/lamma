/* ===== Shared helpers, colours, icons, instruments, renderers (host + phone) ===== */
const U = {
  rint: (a, b) => a + Math.floor(Math.random() * (b - a + 1)),
  pick: a => a[Math.floor(Math.random() * a.length)],
  shuffle: a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] } return a },
  sample: (a, n) => U.shuffle(a).slice(0, n),
  uid: (n = 8) => { const s = 'abcdefghijkmnpqrstuvwxyz23456789'; let o = ''; for (let i = 0; i < n; i++) o += s[Math.floor(Math.random() * s.length)]; return o },
  esc: s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])),
  ar: n => String(n).replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[d]),
  clamp: (x, a, b) => Math.max(a, Math.min(b, x)),
  sec: ms => (ms / 1000).toFixed(1)
};
const INK = '#1D1A2B';
const COL = { red: '#F2545B', blue: '#2F80ED', green: '#27AE60', yellow: '#F7B500', violet: '#8B5CF6', orange: '#FF8A3D', pink: '#EC5FA8', teal: '#14B8A6', brown: '#9A6332', black: '#2B2838', white: '#FFFFFF', grey: '#9AA0AE' };
const CNAME = { red: 'أحمر', blue: 'أزرق', green: 'أخضر', yellow: 'أصفر', violet: 'بنفسجي', orange: 'برتقالي', pink: 'وردي', teal: 'فيروزي', brown: 'بني', black: 'أسود', white: 'أبيض', grey: 'رمادي' };
const ANS = [{ c: '#F2545B', s: 'tri' }, { c: '#2F80ED', s: 'dia' }, { c: '#F7B500', s: 'cir' }, { c: '#27AE60', s: 'sq' }];
const SHAPE_SVG = {
  tri: '<svg viewBox="0 0 20 20"><path d="M10 2 19 18H1z" fill="#fff"/></svg>',
  dia: '<svg viewBox="0 0 20 20"><path d="M10 1 19 10 10 19 1 10z" fill="#fff"/></svg>',
  cir: '<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="8.5" fill="#fff"/></svg>',
  sq: '<svg viewBox="0 0 20 20"><rect x="2" y="2" width="16" height="16" rx="2" fill="#fff"/></svg>'
};
const AVATARS = ['🦁', '🐪', '🦅', '🐎', '🐬', '🦊', '🐼', '🐢', '🐯', '🦉', '🐝', '🐙', '🦒', '🐧', '🦜', '🐳'];

/* ---------- small scene icons (0..100 box) ---------- */
const ICON = {
  palm: c => `<path d="M50 92 C47 70 52 52 50 38" stroke="${COL.brown}" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M50 38 C38 26 22 28 12 40 C26 34 38 36 50 40Z M50 38 C62 26 78 28 88 40 C74 34 62 36 50 40Z M50 38 C44 22 30 14 20 14 C32 20 42 28 50 40Z M50 38 C56 22 70 14 80 14 C68 20 58 28 50 40Z" fill="${c}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`,
  house: c => `<path d="M18 48 50 20 82 48V88H18Z" fill="${c}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="M12 50 50 16 88 50" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><rect x="42" y="62" width="16" height="26" fill="#fff" stroke="${INK}" stroke-width="3"/>`,
  sun: c => `<g stroke="${INK}" stroke-width="4" stroke-linecap="round">${[0, 45, 90, 135, 180, 225, 270, 315].map(a => `<line x1="50" y1="12" x2="50" y2="22" transform="rotate(${a} 50 50)"/>`).join('')}</g><circle cx="50" cy="50" r="22" fill="${c}" stroke="${INK}" stroke-width="4"/>`,
  moon: c => `<path d="M62 14 A36 36 0 1 0 86 66 A28 28 0 1 1 62 14Z" fill="${c}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`,
  star: c => `<path d="M50 10 61 37 90 38 67 56 75 85 50 68 25 85 33 56 10 38 39 37Z" fill="${c}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`,
  cloud: c => `<path d="M26 74 C10 74 8 52 24 50 C22 34 42 28 50 40 C56 26 80 28 78 48 C94 48 94 74 76 74Z" fill="${c}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`,
  fish: c => `<path d="M14 50 C30 26 62 26 76 50 C62 74 30 74 14 50Z" fill="${c}" stroke="${INK}" stroke-width="4"/><path d="M74 50 92 34 92 66Z" fill="${c}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><circle cx="30" cy="46" r="4" fill="${INK}"/>`,
  flower: c => `<path d="M50 60 V94" stroke="${COL.green}" stroke-width="6"/>${[0, 72, 144, 216, 288].map(a => `<ellipse cx="50" cy="24" rx="11" ry="16" transform="rotate(${a} 50 42)" fill="${c}" stroke="${INK}" stroke-width="3"/>`).join('')}<circle cx="50" cy="42" r="9" fill="#FFD93D" stroke="${INK}" stroke-width="3"/>`,
  dallah: c => `<path d="M34 84 C24 70 30 56 40 52 L38 40 C38 32 62 32 62 40 L60 52 C70 56 76 70 66 84Z" fill="${c}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="M40 54 C28 50 20 40 12 28 L18 26 C26 36 32 44 42 46" fill="${c}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/><path d="M42 34 50 14 58 34" fill="${c}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/><path d="M64 46 C80 46 82 66 68 72" fill="none" stroke="${INK}" stroke-width="4"/><rect x="30" y="82" width="40" height="7" rx="3" fill="${INK}"/>`,
  lantern: c => `<path d="M50 6 V16" stroke="${INK}" stroke-width="4"/><circle cx="50" cy="12" r="6" fill="none" stroke="${INK}" stroke-width="3"/><path d="M36 22 H64 L70 34 V72 L62 88 H38 L30 72 V34Z" fill="${c}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="M40 38 H60 V70 H40Z" fill="#FFE9A8" stroke="${INK}" stroke-width="3"/><path d="M50 38 V70" stroke="${INK}" stroke-width="2"/>`,
  boat: c => `<path d="M10 64 H90 L76 84 H24Z" fill="${c}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="M48 64 V12" stroke="${INK}" stroke-width="4"/><path d="M50 14 L84 56 H50Z" fill="#fff" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/><path d="M46 20 L22 56 H46Z" fill="#fff" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>`,
  ball: c => `<circle cx="50" cy="52" r="34" fill="${c}" stroke="${INK}" stroke-width="4"/><path d="M18 46 C36 56 64 56 82 46 M50 18 C38 36 38 68 50 86" stroke="${INK}" stroke-width="3.5" fill="none"/>`,
  tent: c => `<path d="M8 86 50 16 92 86Z" fill="${c}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="M50 30 40 86 H60Z" fill="${INK}" opacity=".85"/><path d="M50 16 V6 L62 10 50 14" fill="#F2545B" stroke="${INK}" stroke-width="2.5"/>`,
  tree: c => `<rect x="44" y="58" width="12" height="32" fill="${COL.brown}" stroke="${INK}" stroke-width="3.5"/><circle cx="50" cy="42" r="28" fill="${c}" stroke="${INK}" stroke-width="4"/>`,
  key: c => `<circle cx="30" cy="50" r="16" fill="${c}" stroke="${INK}" stroke-width="4"/><circle cx="30" cy="50" r="6" fill="#fff" stroke="${INK}" stroke-width="3"/><path d="M46 46 H88 V54 H80 V64 H72 V54 H64 V62 H56 V54 H46Z" fill="${c}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>`,
  cup: c => `<path d="M22 30 H70 V70 C70 82 60 88 46 88 C32 88 22 82 22 70Z" fill="${c}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="M70 40 C88 40 88 66 70 66" fill="none" stroke="${INK}" stroke-width="5"/><path d="M36 22 C32 16 40 12 36 6 M50 22 C46 16 54 12 50 6" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  kite: c => `<path d="M50 8 78 40 50 78 22 40Z" fill="${c}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="M50 8V78M22 40H78" stroke="${INK}" stroke-width="2.5"/><path d="M50 78 C40 86 60 88 48 96" stroke="${INK}" stroke-width="3" fill="none"/>`,
  heart: c => `<path d="M50 86 C20 64 10 48 14 32 C18 16 40 12 50 30 C60 12 82 16 86 32 C90 48 80 64 50 86Z" fill="${c}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`,
  umbrella: c => `<path d="M10 50 C14 20 86 20 90 50 C82 44 74 44 70 50 C64 44 56 44 50 50 C44 44 36 44 30 50 C24 44 16 44 10 50Z" fill="${c}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="M50 50 V80 C50 90 38 90 38 82" stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round"/>`
};
const ICON_NAMES = { palm: 'نخلة', house: 'بيت', sun: 'شمس', moon: 'هلال', star: 'نجمة', cloud: 'غيمة', fish: 'سمكة', flower: 'وردة', dallah: 'دلّة', lantern: 'فانوس', boat: 'سفينة', ball: 'كرة', tent: 'خيمة', tree: 'شجرة', key: 'مفتاح', cup: 'كوب', kite: 'طائرة ورقية', heart: 'قلب', umbrella: 'مظلة' };
const ICON_PL = { palm: 'نخلات', house: 'بيوت', sun: 'شموس', moon: 'أهلّة', star: 'نجوم', cloud: 'غيوم', fish: 'أسماك', flower: 'ورود', dallah: 'دلال', lantern: 'فوانيس', boat: 'سفن', ball: 'كرات', tent: 'خيام', tree: 'أشجار', key: 'مفاتيح', cup: 'أكواب', kite: 'طائرات ورقية', heart: 'قلوب', umbrella: 'مظلات' };

/* ---------- geometric shapes for patterns / counting ---------- */
function shapePath(sh, cx, cy, r) {
  const P = (n, rot = -90, rr = r) => Array.from({ length: n }, (_, i) => { const a = (rot + i * 360 / n) * Math.PI / 180; return [cx + rr * Math.cos(a), cy + rr * Math.sin(a)] });
  const poly = pts => 'M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L') + 'Z';
  switch (sh) {
    case 'circle': return `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
    case 'square': return poly(P(4, -45, r * 1.05));
    case 'tri': return poly(P(3, -90, r * 1.15).map(p => [p[0], p[1] + r * .15]));
    case 'diamond': return poly(P(4, -90, r * 1.1));
    case 'hex': return poly(P(6, 0, r));
    case 'star': { const o = P(5, -90, r * 1.15), i = P(5, -54, r * .5); return poly(o.flatMap((p, k) => [p, i[k]])) }
    case 'cross': { const a = r * .38; return `M${cx - a} ${cy - r}H${cx + a}V${cy - a}H${cx + r}V${cy + a}H${cx + a}V${cy + r}H${cx - a}V${cy + a}H${cx - r}V${cy - a}H${cx - a}Z` }
  }
}
const SH_NAMES = { circle: 'دائرة', square: 'مربع', tri: 'مثلث', diamond: 'معيّن', hex: 'سداسي', star: 'نجمة', cross: 'زائد' };
const SH_PL = { circle: 'دوائر', square: 'مربعات', tri: 'مثلثات', diamond: 'معيّنات', hex: 'أشكال سداسية', star: 'نجوم', cross: 'علامات زائد' };

/* tile = {sh,n,c,f,rot} rendered in 100x100 */
function tileSVG(t, size = 100) {
  if (!t) return `<svg viewBox="0 0 100 100" width="${size}" height="${size}"><rect x="3" y="3" width="94" height="94" rx="12" fill="#FFF3C4" stroke="${INK}" stroke-width="3" stroke-dasharray="7 6"/><text x="50" y="66" text-anchor="middle" font-size="48" font-weight="800" fill="${INK}">؟</text></svg>`;
  const pos = { 1: [[50, 50]], 2: [[31, 50], [69, 50]], 3: [[50, 29], [29, 69], [71, 69]], 4: [[31, 31], [69, 31], [31, 69], [69, 69]] }[t.n];
  const r = { 1: 26, 2: 16, 3: 15, 4: 14 }[t.n];
  const col = COL[t.c];
  const fill = t.f === 'outline' ? '#fff' : t.f === 'dot' ? '#fff' : col;
  const body = pos.map(([x, y]) => `<g transform="rotate(${t.rot || 0} ${x} ${y})"><path d="${shapePath(t.sh, x, y, r)}" fill="${fill}" stroke="${t.f === 'outline' || t.f === 'dot' ? col : INK}" stroke-width="${t.f === 'outline' || t.f === 'dot' ? 5 : 3}" stroke-linejoin="round"/>${t.f === 'dot' ? `<circle cx="${x}" cy="${y}" r="${r * .3}" fill="${col}"/>` : ''}</g>`).join('');
  return `<svg viewBox="0 0 100 100" width="${size}" height="${size}"><rect x="3" y="3" width="94" height="94" rx="12" fill="#fff" stroke="${INK}" stroke-width="3"/>${body}</svg>`;
}

/* ---------- scientific instruments (0..200 box) ---------- */
const GL = '#E3F2FF', LQ = '#4FB3F6', S4 = `stroke="${INK}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"`;
const marks = (x, y0, y1, step, len = 10) => { let o = ''; for (let y = y0; y <= y1; y += step) o += `<line x1="${x}" y1="${y}" x2="${x + len}" y2="${y}" stroke="${INK}" stroke-width="2"/>`; return o };
const INST = {
  microscope: { ar: 'المجهر', g: 'dev', d: `<rect x="40" y="166" width="124" height="20" rx="8" fill="#5B6B8C" ${S4}/><path d="M128 166 C128 140 150 128 150 100 C150 74 132 60 118 54" fill="none" stroke="${INK}" stroke-width="20" stroke-linecap="round"/><path d="M128 166 C128 140 150 128 150 100 C150 74 132 60 118 54" fill="none" stroke="#8A9BBE" stroke-width="12" stroke-linecap="round"/><rect x="56" y="124" width="92" height="12" rx="4" fill="#B9C6DE" ${S4}/><g transform="rotate(-22 96 74)"><rect x="82" y="44" width="30" height="66" rx="4" fill="#DDE5F2" ${S4}/><rect x="86" y="20" width="22" height="26" rx="3" fill="#2B2838" ${S4}/><rect x="88" y="108" width="18" height="16" rx="3" fill="#8A9BBE" ${S4}/></g><circle cx="150" cy="104" r="11" fill="#2B2838" ${S4}/><path d="M74 136 V150 H104 V136" fill="none" ${S4}/>` },
  testtube: { ar: 'أنبوب الاختبار', g: 'glass', d: `<g transform="rotate(18 100 100)"><path d="M84 18 V150 A16 16 0 0 0 116 150 V18" fill="${GL}" ${S4}/><path d="M86 104 H114 V150 A14 14 0 0 1 86 150Z" fill="#7BD389"/><path d="M84 18 V150 A16 16 0 0 0 116 150 V18" fill="none" ${S4}/><rect x="78" y="12" width="44" height="10" rx="4" fill="#fff" ${S4}/><circle cx="96" cy="130" r="3" fill="#fff"/><circle cx="104" cy="118" r="2" fill="#fff"/></g>` },
  beaker: { ar: 'الكأس الزجاجية (البيكر)', g: 'glass', d: `<path d="M46 36 H150 V168 A10 10 0 0 1 140 178 H60 A10 10 0 0 1 50 168 V46 L40 36Z" fill="${GL}" ${S4}/><path d="M53 104 H147 V166 A8 8 0 0 1 139 174 H61 A8 8 0 0 1 53 166Z" fill="${LQ}"/><path d="M46 36 H150 V168 A10 10 0 0 1 140 178 H60 A10 10 0 0 1 50 168 V46 L40 36Z" fill="none" ${S4}/>${marks(62, 66, 156, 18, 16)}` },
  erlenmeyer: { ar: 'الدورق المخروطي', g: 'glass', d: `<path d="M84 20 H116 M88 20 V70 L40 166 A8 8 0 0 0 48 178 H152 A8 8 0 0 0 160 166 L112 70 V20" fill="${GL}" ${S4}/><path d="M62 124 H138 L156 164 A8 8 0 0 1 150 174 H50 A8 8 0 0 1 44 164Z" fill="#F98EB5"/><path d="M88 20 V70 L40 166 A8 8 0 0 0 48 178 H152 A8 8 0 0 0 160 166 L112 70 V20" fill="none" ${S4}/><path d="M82 20 H118" ${S4}/>` },
  roundflask: { ar: 'الدورق الدائري', g: 'glass', d: `<path d="M86 18 V82 A50 50 0 1 0 114 82 V18" fill="${GL}" ${S4}/><path d="M54 140 H146 A50 50 0 0 1 54 140Z" fill="#B48CF2"/><path d="M86 18 V82 A50 50 0 1 0 114 82 V18" fill="none" ${S4}/><path d="M80 18 H120" ${S4}/>` },
  cylinder: { ar: 'المِخبار المدرّج', g: 'glass', d: `<path d="M50 176 H150 L136 162 H64Z" fill="#B9C6DE" ${S4}/><path d="M80 14 H122 M84 14 V162 H116 V14" fill="${GL}" ${S4}/><rect x="86" y="96" width="28" height="64" fill="${LQ}"/><path d="M84 14 V162 H116 V14" fill="none" ${S4}/><path d="M76 14 H120 L126 8" ${S4} fill="none"/>${marks(86, 30, 150, 12, 12)}` },
  bunsen: { ar: 'موقد بنسن', g: 'dev', d: `<path d="M100 22 C82 48 86 70 100 82 C114 70 118 48 100 22Z" fill="#FFB547" ${S4}/><path d="M100 46 C92 60 94 72 100 78 C106 72 108 60 100 46Z" fill="#4D8DF7"/><rect x="88" y="82" width="24" height="76" rx="3" fill="#C9CFD9" ${S4}/><rect x="84" y="128" width="32" height="12" rx="3" fill="#8A9BBE" ${S4}/><path d="M56 168 Q56 156 72 156 H128 Q144 156 144 168 V176 H56Z" fill="#5B6B8C" ${S4}/><path d="M144 168 C164 168 170 150 186 150" stroke="#F2545B" stroke-width="10" fill="none" stroke-linecap="round"/>` },
  thermometer: { ar: 'ميزان الحرارة (الترمومتر)', g: 'dev', d: `<path d="M90 26 A10 10 0 0 1 110 26 V140 A20 20 0 1 1 90 140Z" fill="#fff" ${S4}/><rect x="96" y="70" width="8" height="84" fill="#F2545B"/><circle cx="100" cy="158" r="14" fill="#F2545B"/>${marks(110, 40, 136, 12, 12)}<path d="M90 26 A10 10 0 0 1 110 26 V140 A20 20 0 1 1 90 140Z" fill="none" ${S4}/>` },
  balance: { ar: 'الميزان ذو الكفّتين', g: 'dev', d: `<path d="M70 178 H130 L120 164 H80Z" fill="#9A6332" ${S4}/><rect x="96" y="44" width="8" height="122" fill="#C79A5A" ${S4}/><path d="M30 58 H170" ${S4} stroke-width="7"/><circle cx="100" cy="44" r="9" fill="#F7B500" ${S4}/><path d="M36 58 L22 118 M36 58 L50 118 M164 58 L150 118 M164 58 L178 118" stroke="${INK}" stroke-width="2.5"/><path d="M12 118 H60 C56 134 16 134 12 118Z M140 118 H188 C184 134 144 134 140 118Z" fill="#F7B500" ${S4}/>` },
  magnet: { ar: 'المغناطيس', g: 'dev', d: `<path d="M44 40 V110 A56 56 0 0 0 156 110 V40 H120 V110 A20 20 0 0 1 80 110 V40Z" fill="#F2545B" ${S4}/><rect x="44" y="24" width="36" height="34" fill="#DDE5F2" ${S4}/><rect x="120" y="24" width="36" height="34" fill="#DDE5F2" ${S4}/><text x="62" y="50" font-size="22" font-weight="800" text-anchor="middle" fill="${INK}" font-family="Arial">N</text><text x="138" y="50" font-size="22" font-weight="800" text-anchor="middle" fill="${INK}" font-family="Arial">S</text>` },
  compass: { ar: 'البوصلة', g: 'dev', d: `<circle cx="100" cy="104" r="76" fill="#C79A5A" ${S4}/><circle cx="100" cy="104" r="60" fill="#FFF9EC" ${S4}/>${[0, 90, 180, 270].map(a => `<line x1="100" y1="48" x2="100" y2="60" transform="rotate(${a} 100 104)" stroke="${INK}" stroke-width="4"/>`).join('')}<path d="M100 54 112 104 H88Z" fill="#F2545B" ${S4}/><path d="M100 154 112 104 H88Z" fill="#DDE5F2" ${S4}/><circle cx="100" cy="104" r="6" fill="${INK}"/><rect x="92" y="18" width="16" height="12" rx="3" fill="#C79A5A" ${S4}/>` },
  magnifier: { ar: 'العدسة المكبّرة', g: 'dev', d: `<path d="M126 126 L176 176" stroke="${INK}" stroke-width="22" stroke-linecap="round"/><path d="M126 126 L176 176" stroke="#9A6332" stroke-width="14" stroke-linecap="round"/><circle cx="86" cy="86" r="58" fill="#CFEAFF" stroke="${INK}" stroke-width="14"/><circle cx="86" cy="86" r="58" fill="none" stroke="#8A9BBE" stroke-width="7"/><path d="M58 64 A36 36 0 0 1 82 48" stroke="#fff" stroke-width="8" fill="none" stroke-linecap="round"/>` },
  telescope: { ar: 'المِقراب (التلسكوب)', g: 'dev', d: `<path d="M100 112 L56 186 M100 112 L144 186 M100 112 V186" ${S4} stroke-width="6"/><g transform="rotate(-28 100 100)"><rect x="28" y="84" width="124" height="34" rx="6" fill="#2F80ED" ${S4}/><rect x="150" y="78" width="22" height="46" rx="5" fill="#2B2838" ${S4}/><rect x="10" y="92" width="20" height="18" rx="3" fill="#2B2838" ${S4}/><rect x="70" y="84" width="10" height="34" fill="#F7B500" ${S4}/></g><circle cx="100" cy="112" r="7" fill="${INK}"/>` },
  funnel: { ar: 'القِمع', g: 'glass', d: `<path d="M30 30 H170 L112 104 V176 H88 V104Z" fill="${GL}" ${S4}/><path d="M30 30 H170" ${S4}/><path d="M56 52 H144" stroke="#fff" stroke-width="6" stroke-linecap="round"/>` },
  dropper: { ar: 'القطّارة', g: 'glass', d: `<path d="M84 20 C84 6 116 6 116 20 V70 H84Z" fill="#F2545B" ${S4}/><rect x="80" y="68" width="40" height="10" rx="3" fill="#C9302C" ${S4}/><path d="M88 78 H112 V146 L102 176 H98 L88 146Z" fill="${GL}" ${S4}/><path d="M90 120 H110 V146 L101 170 H99 L90 146Z" fill="#7BD389"/><path d="M100 184 C94 194 106 194 100 184Z" fill="#7BD389" ${S4} stroke-width="3"/>` },
  burette: { ar: 'السحّاحة', g: 'glass', d: `<rect x="34" y="176" width="80" height="12" rx="3" fill="#5B6B8C" ${S4}/><rect x="40" y="14" width="8" height="164" fill="#8A9BBE" ${S4}/><path d="M44 70 H92" ${S4} stroke-width="6"/><rect x="88" y="10" width="20" height="132" rx="3" fill="${GL}" ${S4}/><rect x="91" y="52" width="14" height="88" fill="#F7B500" opacity=".85"/>${marks(108, 24, 132, 10, 8)}<rect x="80" y="142" width="36" height="10" rx="3" fill="#2B2838" ${S4}/><path d="M98 152 V172" ${S4}/><path d="M96 172 L100 182 104 172" fill="${GL}" ${S4}/>` },
  prism: { ar: 'المنشور الزجاجي', g: 'dev', d: `<path d="M8 110 L84 98" stroke="${INK}" stroke-width="10" stroke-linecap="round"/><path d="M8 110 L84 98" stroke="#FFFDE8" stroke-width="5" stroke-linecap="round"/><path d="M100 30 L160 150 H40Z" fill="#E3F2FF" ${S4}/>${['#F2545B', '#FF8A3D', '#F7B500', '#27AE60', '#2F80ED', '#8B5CF6'].map((c, i) => `<path d="M124 96 L196 ${110 + i * 12}" stroke="${c}" stroke-width="6"/>`).join('')}<path d="M100 30 L160 150 H40Z" fill="none" ${S4}/>` },
  stethoscope: { ar: 'سمّاعة الطبيب', g: 'dev', d: `<path d="M60 30 C56 70 66 96 100 104 C134 96 144 70 140 30" fill="none" stroke="${INK}" stroke-width="10" stroke-linecap="round"/><path d="M60 30 C56 70 66 96 100 104 C134 96 144 70 140 30" fill="none" stroke="#8A9BBE" stroke-width="5" stroke-linecap="round"/><circle cx="60" cy="24" r="8" fill="${INK}"/><circle cx="140" cy="24" r="8" fill="${INK}"/><path d="M100 104 C100 140 70 150 70 170" fill="none" stroke="${INK}" stroke-width="10" stroke-linecap="round"/><path d="M100 104 C100 140 70 150 70 170" fill="none" stroke="#2F80ED" stroke-width="5" stroke-linecap="round"/><circle cx="70" cy="174" r="18" fill="#C9CFD9" ${S4}/><circle cx="70" cy="174" r="9" fill="#fff" ${S4} stroke-width="3"/>` },
  protractor: { ar: 'المنقلة', g: 'math', d: `<path d="M16 150 A84 84 0 0 1 184 150Z" fill="#E3F2FF" ${S4}/><path d="M52 150 A48 48 0 0 1 148 150" fill="none" ${S4} stroke-width="3"/>${Array.from({ length: 19 }, (_, i) => { const a = Math.PI - i * Math.PI / 18, l = i % 9 === 0 ? 18 : i % 3 === 0 ? 14 : 9; return `<line x1="${(100 + 84 * Math.cos(a)).toFixed(1)}" y1="${(150 - 84 * Math.sin(a)).toFixed(1)}" x2="${(100 + (84 - l) * Math.cos(a)).toFixed(1)}" y2="${(150 - (84 - l) * Math.sin(a)).toFixed(1)}" stroke="${INK}" stroke-width="2.5"/>` }).join('')}<circle cx="100" cy="150" r="5" fill="${INK}"/><line x1="100" y1="150" x2="100" y2="104" stroke="${INK}" stroke-width="2"/>` },
  divider: { ar: 'الفرجار', g: 'math', d: `<circle cx="100" cy="30" r="12" fill="#C9CFD9" ${S4}/><rect x="96" y="6" width="8" height="14" rx="3" fill="${INK}"/><path d="M94 40 L54 176 M106 40 L142 158" stroke="${INK}" stroke-width="12" stroke-linecap="round"/><path d="M94 40 L54 176 M106 40 L142 158" stroke="#B9C6DE" stroke-width="6" stroke-linecap="round"/><path d="M136 150 L152 186 L148 150Z" fill="#F7B500" ${S4} stroke-width="3"/><path d="M74 108 L124 100" ${S4} stroke-width="3"/>` },
  ammeter: { ar: 'الأميتر (مقياس التيار)', g: 'dev', d: `<rect x="26" y="40" width="148" height="128" rx="14" fill="#2B2838" ${S4}/><path d="M44 120 A56 56 0 0 1 156 120" fill="#FFF9EC" stroke="${INK}" stroke-width="3"/><path d="M44 120 H156 V128 H44Z" fill="#FFF9EC"/>${Array.from({ length: 11 }, (_, i) => { const a = Math.PI - i * Math.PI / 10; return `<line x1="${(100 + 50 * Math.cos(a)).toFixed(1)}" y1="${(120 - 50 * Math.sin(a)).toFixed(1)}" x2="${(100 + 42 * Math.cos(a)).toFixed(1)}" y2="${(120 - 42 * Math.sin(a)).toFixed(1)}" stroke="${INK}" stroke-width="2.5"/>` }).join('')}<path d="M100 120 L130 82" stroke="#F2545B" stroke-width="4" stroke-linecap="round"/><text x="100" y="114" font-size="22" font-weight="800" text-anchor="middle" fill="${INK}" font-family="Arial">A</text><circle cx="64" cy="150" r="9" fill="#F2545B" ${S4} stroke-width="3"/><circle cx="136" cy="150" r="9" fill="${INK}" stroke="#fff" stroke-width="3"/>` },
  mortar: { ar: 'الهاون والمِدقّة', g: 'glass', d: `<path d="M120 100 L168 24" stroke="${INK}" stroke-width="22" stroke-linecap="round"/><path d="M120 100 L168 24" stroke="#EDE6D6" stroke-width="14" stroke-linecap="round"/><path d="M28 96 H172 C172 146 140 170 100 170 C60 170 28 146 28 96Z" fill="#EDE6D6" ${S4}/><path d="M70 170 L64 184 H136 L130 170" fill="#EDE6D6" ${S4}/><path d="M28 96 H172" ${S4} stroke-width="6"/>` },
  petri: { ar: 'طبق بِتري', g: 'glass', d: `<ellipse cx="100" cy="118" rx="84" ry="38" fill="${GL}" ${S4}/><path d="M16 118 V132 A84 38 0 0 0 184 132 V118" fill="${GL}" ${S4}/><ellipse cx="100" cy="118" rx="70" ry="28" fill="#FFE9A8" stroke="${INK}" stroke-width="2"/><circle cx="78" cy="112" r="7" fill="#F2545B"/><circle cx="116" cy="124" r="9" fill="#27AE60"/><circle cx="124" cy="106" r="5" fill="#8B5CF6"/><circle cx="90" cy="128" r="4" fill="#FF8A3D"/><circle cx="62" cy="122" r="4" fill="#27AE60"/>` },
  anemometer: { ar: 'مقياس سرعة الرياح (الأنيمومتر)', g: 'dev', d: `<rect x="94" y="80" width="12" height="104" fill="#8A9BBE" ${S4}/><rect x="70" y="178" width="60" height="10" rx="3" fill="#5B6B8C" ${S4}/>${[[100, 70, 30, 46], [100, 70, 166, 52], [100, 70, 104, 22]].map(([x, y, ex, ey]) => `<path d="M${x} ${y} L${ex} ${ey}" ${S4}/><path d="M${ex - 16} ${ey} A16 16 0 0 0 ${ex + 16} ${ey}Z" fill="#F2545B" ${S4}/>`).join('')}<circle cx="100" cy="72" r="9" fill="${INK}"/>` },
  astrolabe: { ar: 'الأسطرلاب', g: 'dev', d: `<circle cx="100" cy="30" r="12" fill="none" stroke="${INK}" stroke-width="5"/><path d="M86 48 H114 L108 36 H92Z" fill="#C79A5A" ${S4}/><circle cx="100" cy="112" r="72" fill="#E8B04B" ${S4}/><circle cx="100" cy="112" r="56" fill="#F6D58D" ${S4} stroke-width="3"/>${Array.from({ length: 24 }, (_, i) => `<line x1="100" y1="42" x2="100" y2="${i % 6 ? 50 : 56}" transform="rotate(${i * 15} 100 112)" stroke="${INK}" stroke-width="2"/>`).join('')}<circle cx="100" cy="102" r="30" fill="none" stroke="${INK}" stroke-width="2.5"/><path d="M60 128 C80 108 120 108 140 128" fill="none" stroke="${INK}" stroke-width="2.5"/><path d="M40 112 L160 112" stroke="#9A6332" stroke-width="7" stroke-linecap="round"/><circle cx="100" cy="112" r="6" fill="${INK}"/>` },
  springscale: { ar: 'الميزان النابضي', g: 'dev', d: `<path d="M100 8 V22" ${S4}/><circle cx="100" cy="10" r="6" fill="none" ${S4} stroke-width="3"/><rect x="74" y="22" width="52" height="122" rx="10" fill="#F7B500" ${S4}/><rect x="86" y="32" width="28" height="100" rx="4" fill="#FFF9EC" ${S4} stroke-width="3"/><path d="M100 36 ${Array.from({ length: 8 }, (_, i) => `L${i % 2 ? 90 : 110} ${44 + i * 8}`).join(' ')} L100 108" fill="none" stroke="${INK}" stroke-width="2.5"/>${marks(86, 40, 126, 10, 6)}<path d="M100 144 V166 C100 182 82 182 84 170" fill="none" ${S4}/><rect x="70" y="174" width="26" height="18" rx="3" fill="#5B6B8C" ${S4}/>` },
  rack: { ar: 'حامل أنابيب الاختبار', g: 'glass', d: `<rect x="20" y="84" width="160" height="16" rx="3" fill="#C79A5A" ${S4}/><rect x="20" y="164" width="160" height="14" rx="3" fill="#C79A5A" ${S4}/><path d="M30 100 V164 M170 100 V164" ${S4} stroke-width="6"/>${[[56, '#F2545B'], [100, '#27AE60'], [144, '#2F80ED']].map(([x, c]) => `<path d="M${x - 12} 40 V150 A12 12 0 0 0 ${x + 12} 150 V40" fill="${GL}" ${S4}/><path d="M${x - 10} 120 H${x + 10} V150 A10 10 0 0 1 ${x - 10} 150Z" fill="${c}"/>`).join('')}` }
};

/* ---------- media renderer ---------- */
function sceneSVG(sc, opt = {}) {
  const cw = 100, ch = 100, W = sc.cols * cw, H = sc.rows * ch;
  let s = `<svg viewBox="0 0 ${W} ${H}" class="scene" preserveAspectRatio="xMidYMid meet"><rect width="${W}" height="${H}" rx="14" fill="#FFF9EC"/>`;
  for (const it of sc.items) {
    if (it.gone) continue;
    const x = (it.i % sc.cols) * cw + 50, y = Math.floor(it.i / sc.cols) * ch + 50, z = it.z || 0.8;
    s += `<g transform="translate(${x} ${y}) rotate(${it.r || 0}) scale(${(it.f ? -1 : 1) * z} ${z}) translate(-50 -50)">${ICON[it.s](COL[it.c])}</g>`;
  }
  if (opt.tap) for (let i = 0; i < sc.cols * sc.rows; i++) s += `<rect data-i="${i}" x="${(i % sc.cols) * cw}" y="${Math.floor(i / sc.cols) * ch}" width="${cw}" height="${ch}" fill="transparent" class="tapcell"/>`;
  if (opt.mark != null) { const i = opt.mark; s += `<circle cx="${(i % sc.cols) * cw + 50}" cy="${Math.floor(i / sc.cols) * ch + 50}" r="46" fill="none" stroke="#F2545B" stroke-width="7" class="markring"/>` }
  return s + '</svg>';
}
function scatterSVG(m, opt = {}) {
  let s = `<svg viewBox="0 0 ${m.w} ${m.h}" class="scene"><rect width="${m.w}" height="${m.h}" rx="14" fill="#FFF9EC"/>`;
  for (const it of m.items) s += `<g transform="rotate(${it.r || 0} ${it.x} ${it.y})"><path d="${shapePath(it.sh, it.x, it.y, it.z)}" fill="${COL[it.c]}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/></g>`;
  return s + '</svg>';
}
function gridSVG(m, opt = {}) {
  const cs = 60, W = m.cols * cs, H = m.rows * cs;
  let s = `<svg viewBox="0 0 ${W} ${H}" class="scene grid"><rect width="${W}" height="${H}" rx="12" fill="#FFF9EC"/>`;
  for (let i = 0; i < m.cols * m.rows; i++) {
    const x = (i % m.cols) * cs + cs / 2, y = Math.floor(i / m.cols) * cs + cs / 2;
    const g = i === m.oi ? m.odd : m.base;
    if (m.kind === 'shape') s += `<path d="${shapePath(m.sh, x, y, i === m.oi ? m.zo : m.z)}" transform="rotate(${i === m.oi ? m.ro : m.rb} ${x} ${y})" fill="${i === m.oi ? m.co : m.cb}" stroke="${INK}" stroke-width="2.5"/>`;
    else s += `<text x="${x}" y="${y}" dy=".35em" text-anchor="middle" font-size="${m.fs || 38}" font-weight="700" fill="${INK}" ${m.font ? `font-family="${m.font}"` : ''}>${U.esc(g)}</text>`;
    if (opt.tap) s += `<rect data-i="${i}" x="${x - cs / 2}" y="${y - cs / 2}" width="${cs}" height="${cs}" fill="transparent" class="tapcell"/>`;
  }
  if (opt.mark != null) { const i = opt.mark; s += `<circle cx="${(i % m.cols) * cs + cs / 2}" cy="${Math.floor(i / m.cols) * cs + cs / 2}" r="28" fill="none" stroke="#F2545B" stroke-width="6" class="markring"/>` }
  return s + '</svg>';
}
function mapSVG(m) {
  const M = MAPS[m.m];
  let s = `<svg viewBox="-6 -6 ${M.w + 12} ${M.h + 12}" class="scene map"><rect x="-6" y="-6" width="${M.w + 12}" height="${M.h + 12}" rx="14" fill="#D9EEF7"/>`;
  let hl = null;
  for (const r of M.r) { const on = r.k === m.hl; if (on) hl = r; s += `<path d="${r.d}" fill="${on ? '#F2545B' : '#FFF4DC'}" stroke="${INK}" stroke-width="${m.m === 'arab' ? 0.9 : 1.4}" stroke-linejoin="round"/>` }
  if (hl) { s += `<path d="${hl.d}" fill="#F2545B" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>`; if (hl.a < 420) s += `<circle cx="${hl.cx}" cy="${hl.cy}" r="22" fill="none" stroke="#F2545B" stroke-width="5" class="pulse"/>` }
  return s + '</svg>';
}
const SIMON = ['#F2545B', '#2F80ED', '#27AE60', '#F7B500'];
const SIMON_F = [329.6, 392, 523.3, 659.3];

function renderMedia(m, opt = {}) {
  if (!m) return '';
  switch (m.k) {
    case 'scene': return sceneSVG(m.sc, opt);
    case 'diff': return `<div class="diff"><figure><figcaption>الصورة الأصلية</figcaption>${sceneSVG(m.a)}</figure><figure><figcaption>${opt.tap ? 'اضغط على الفرق هنا' : 'الصورة المعدّلة'}</figcaption>${sceneSVG(m.b, opt)}</figure></div>`;
    case 'grid': return gridSVG(m, opt);
    case 'scatter': return scatterSVG(m);
    case 'matrix': return `<div class="matrix">${m.cells.map(t => tileSVG(t)).join('')}</div>`;
    case 'map': return mapSVG(m);
    case 'inst': return `<svg viewBox="0 0 200 200" class="scene inst"><rect width="200" height="200" rx="16" fill="#FFF9EC"/>${INST[m.n].d}</svg>`;
    case 'stroop': return `<div class="stroop" style="color:${COL[m.c]}">${U.esc(m.w)}</div>`;
    case 'stroopmany': return `<div class="stroopmany">${m.ws.map(w => `<span style="color:${COL[w.c]}">${U.esc(CNAME[w.w])}</span>`).join('')}</div>`;
    case 'emoji': return `<div class="emoji" dir="ltr">${U.esc(m.e)}</div>`;
    case 'letters': return `<div class="letters">${m.l.map(x => `<span>${U.esc(x)}</span>`).join('')}</div>`;
    case 'nums': return `<div class="nums" dir="ltr">${m.n.map(x => `<span class="${x === '؟' ? 'q' : ''}">${U.esc(x)}</span>`).join('')}</div>`;
    case 'verse': return `<div class="verse"><span>${U.esc(m.s)}</span><span>${U.esc(m.e).replace('……', '<b class="gap">……</b>')}</span></div>`;
    case 'quote': return `<div class="quote">${U.esc(m.t)}</div>`;
    case 'story': return `<ol class="story">${m.steps.map(s => `<li class="${s === '؟' ? 'q' : ''}">${U.esc(s)}</li>`).join('')}</ol>`;
    case 'sound': return `<div class="sound"><div class="eq">${'<i></i>'.repeat(7)}</div><p>${opt.player ? 'استمعوا للشاشة الرئيسية' : 'استمعوا جيدًا…'}</p>${m.labels ? `<div class="tonelbl">${m.labels.map((l, i) => `<span data-t="${i}">${l}</span>`).join('')}</div>` : ''}</div>`;
    case 'simon': return `<div class="simon show">${SIMON.map((c, i) => `<span data-p="${i}" style="--c:${c}"></span>`).join('')}</div>`;
    case 'reflex': return `<div class="reflex"><span>انتظر حتى يصبح أخضر…</span></div>`;
    case 'cover': return `<div class="cover">؟</div>`;
    case 'big': return `<div class="bigtxt" ${m.ltr ? 'dir="ltr"' : ''}>${U.esc(m.t)}</div>`;
    case 'flag': return flagSVG(m.f);
    case 'land': return landSVG(m.l);
  }
  return '';
}

/* scoring helper shared */
function optHTML(o) {
  if (o && typeof o === 'object') {
    if (o.tile) return tileSVG(o.tile, 84);
    if (o.ink) return `<span class="inkpill" style="color:${COL[o.ink]}">${U.esc(o.t)}</span>`;
    return U.esc(o.t);
  }
  return U.esc(o);
}
