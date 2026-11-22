/* ===== Question generators (host only) ===== */
const QG = (() => {
  const LS = 'lamma_used_v1';
  let used = new Set();
  try { used = new Set(JSON.parse(localStorage.getItem(LS) || '[]')) } catch (e) { }
  const save = () => { try { localStorage.setItem(LS, JSON.stringify([...used].slice(-4000))) } catch (e) { } };
  const cache = {};
  const L = k => cache[k] || (cache[k] = BANK[k].trim().split('\n').map(x => x.trim()).filter(Boolean));
  // pick an unused item from a pool of keys
  function take(pool, keys) {
    let av = keys.filter(k => !used.has(pool + ':' + k));
    if (!av.length) { keys.forEach(k => used.delete(pool + ':' + k)); av = keys.slice() }
    const k = U.pick(av); used.add(pool + ':' + k); return k;
  }
  const takeLine = key => L(key)[take(key, L(key).map((_, i) => i))];
  const split = line => { const p = line.split('|'); let note = null; if (p[p.length - 1].startsWith('~')) note = p.pop().slice(1); return { p, note } };
  const FSI = w => '⁨' + w + '⁩';
  let seq = 0;
  const base = (type, cat, fam, prompt, extra) => Object.assign({ id: 'q' + Date.now().toString(36) + (++seq), type, cat, fam, prompt, time: 20, pre: 0 }, extra);
  function mcq(type, cat, fam, prompt, correct, wrong, extra = {}) {
    const opts = U.shuffle([correct, ...wrong.slice(0, 3)]);
    return base(type, cat, fam, prompt, Object.assign({ input: 'choice', opts, ans: opts.indexOf(correct) }, extra));
  }
  const fromBank = (key, cat, fam, prompt, extra = {}) => () => { const { p, note } = split(takeLine(key)); return mcq(key, cat, fam, prompt || p[0], p[1], p.slice(2), Object.assign({ note, media: prompt ? { k: 'quote', t: p[0] } : null }, extra)) };

  /* ---------- knowledge ---------- */
  const G = {};
  G.sci = fromBank('sci', 'علوم', 'info');
  G.geo = fromBank('geo', 'جغرافيا', 'info');
  G.hist = fromBank('hist', 'تاريخ', 'info');
  G.gen = fromBank('gen', 'ثقافة عامة', 'info');
  G.awwal = fromBank('awwal', 'أول من…؟', 'info');
  G.battles = fromBank('battles', 'معارك إسلامية', 'deen');
  G.seerah = fromBank('seerah', 'السيرة النبوية', 'deen');
  G.deen = fromBank('deen', 'دين', 'deen');
  G.fiqh = fromBank('fiqh', 'حكم فقهي', 'deen');
  G.quranOpen = fromBank('quranOpen', 'مطلع سورة', 'deen', 'من أي سورة هذا المطلع؟');
  G.quranWord = fromBank('quranWord', 'مفردة قرآنية', 'deen', 'ما معنى المفردة القرآنية؟');
  G.lang = fromBank('lang', 'لغة عربية', 'adab');
  G.inventors = fromBank('inventors', 'مخترعون وعلماء', 'info');
  G.prophets = fromBank('prophets', 'قصص الأنبياء', 'deen');
  G.sahaba = fromBank('sahaba', 'صحابة وتابعون', 'deen');
  G.novels = fromBank('novels', 'روايات وكتب شهيرة', 'adab');
  G.riddles = fromBank('riddles', 'ألغاز', 'logic');
  G.capitals = () => {
    const rows = L('capitals').map(l => l.split('|'));
    const r = rows[take('capitals', rows.map((_, i) => i))];
    const [country, cap, trap] = r;
    if (Math.random() < .3 && cap !== country && !/^مدينة/.test(cap)) {
      const others = U.sample(rows.filter(x => x[0] !== country), 3).map(x => x[0]);
      return mcq('capitals', 'ما عاصمة…؟', 'info', `«${cap}» عاصمة أي دولة؟`, country, others);
    }
    const pool = rows.filter(x => x[1] !== cap).map(x => x[1]);
    const wrong = (trap ? [trap] : []).concat(U.sample(pool.filter(x => x !== trap), 3));
    return mcq('capitals', 'ما عاصمة…؟', 'info', `ما عاصمة ${country}؟`, cap, wrong, { time: 15 });
  };
  G.currency = () => {
    const rows = L('currency').map(l => l.split('|'));
    const r = rows[take('currency', rows.map((_, i) => i))];
    const [country, cur] = r;
    const uniq = rows.filter(x => x[1] === cur).length === 1;
    if (uniq && Math.random() < .35) return mcq('currency', 'عملات الدول', 'info', `«${cur}» عملة أي دولة؟`, country, U.sample(rows.filter(x => x[1] !== cur), 3).map(x => x[0]), { time: 15 });
    const names = [...new Set(rows.map(x => x[1]).filter(x => x !== cur))];
    return mcq('currency', 'عملات الدول', 'info', `ما عملة ${country}؟`, cur, U.sample(names, 3), { time: 15 });
  };
  G.english = () => {
    const rows = L('english').map(l => l.split('|'));
    const r = rows[take('english', rows.map((_, i) => i))];
    if (Math.random() < .3) return mcq('english', 'English', 'adab', `ما الكلمة الإنجليزية التي تعني «${r[1]}»؟`, r[0], U.sample(rows.filter(x => x[0] !== r[0]), 3).map(x => x[0]), { time: 15, ltr: true });
    return mcq('english', 'English', 'adab', `ما معنى كلمة ${FSI('«' + r[0] + '»')} بالعربية؟`, r[1], U.sample(rows.filter(x => x[1] !== r[1]), 3).map(x => x[1]), { time: 15, media: { k: 'big', t: r[0], ltr: 1 } });
  };
  G.poetry = () => {
    const line = takeLine('poetry'); const p = line.split('|');
    const m = p[2].match(/\{(.+?)\}/); const word = m[1];
    return mcq('poetry', 'أكمل البيت', 'adab', 'أكمل البيت بالكلمة الصحيحة', word, p.slice(3), { media: { k: 'verse', s: p[1] + ' ', e: p[2].replace(/\{.+?\}/, '……') }, note: 'القائل: ' + p[0], time: 20 });
  };
  const POETS = ['المتنبي', 'الإمام الشافعي', 'أبو تمام', 'زهير بن أبي سلمى', 'طرفة بن العبد', 'امرؤ القيس', 'أبو العلاء المعري', 'أبو العتاهية', 'صفي الدين الحلي', 'عنترة بن شداد', 'أحمد شوقي', 'حافظ إبراهيم', 'البحتري', 'جرير'];
  G.qael = () => {
    if (Math.random() < .3) { const { p } = split(takeLine('quotes')); return mcq('qael', 'من القائل؟', 'adab', 'من القائل؟', p[1], p.slice(2), { media: { k: 'quote', t: p[0] } }) }
    const line = L('poetry')[take('qael', L('poetry').map((_, i) => i))]; const p = line.split('|');
    return mcq('qael', 'من القائل؟', 'adab', 'من قائل هذا البيت؟', p[0], U.sample(POETS.filter(x => x !== p[0]), 3), { media: { k: 'verse', s: p[1] + ' ', e: p[2].replace(/[{}]/g, '') } });
  };
  G.proverbs = () => {
    const p = takeLine('proverbs').split('|'); const m = p[0].match(/\{(.+?)\}/);
    return mcq('proverbs', 'أمثال عربية', 'adab', 'أكمل المثل', m[1], p.slice(1), { media: { k: 'verse', s: '', e: p[0].replace(/\{.+?\}/, '……') }, time: 15 });
  };
  G.story = () => {
    const p = takeLine('story').split('|'); const steps = p[0].split(';');
    return mcq('story', 'القصة الناقصة', 'logic', 'ما الحدث الناقص في القصة؟', p[1], p.slice(2), { media: { k: 'story', steps }, time: 22 });
  };
  G.tf = () => {
    const { p, note } = split(takeLine('tf'));
    return base('tf', 'صح أم خطأ؟', 'logic', 'صح أم خطأ؟', { input: 'choice', opts: ['صح', 'خطأ'], ans: p[1] === 'ص' ? 0 : 1, media: { k: 'big', t: p[0] }, time: 10, note });
  };
  G.emoji = () => { const { p } = split(takeLine('emoji')); return mcq('emoji', 'خمّن من الرموز', 'logic', 'ماذا تعني هذه الرموز؟', p[1], p.slice(2), { media: { k: 'emoji', e: p[0] } }) };
  G.odd = () => { const { p, note } = split(takeLine('odd')); return mcq('odd', 'الكلمة الدخيلة', 'logic', 'أي كلمة دخيلة على المجموعة؟', p[0], p.slice(1), { note, time: 15 }) };
  G.order = () => {
    const p = takeLine('order').split('|'); const items = p.slice(1); const opts = U.shuffle(items);
    if (opts.every((o, i) => o === items[i])) opts.reverse();
    return base('order', 'رتّب', 'logic', p[0], { input: 'order', opts, ans: items.map(x => opts.indexOf(x)), note: 'الترتيب: ' + items.join(' ← '), time: 25 });
  };
  G.math = () => { const p = takeLine('math').split('|'); return base('math', 'رياضيات', 'math', p[0], { input: 'num', ans: +p[1], time: 30 }) };
  G.mental = r => {
    const f = U.rint(0, 4); let t, a;
    if (f === 0) { const x = U.rint(12, 19 + r * 3), y = U.rint(3, 9); t = `${x} × ${y}`; a = x * y }
    else if (f === 1) { const x = U.rint(40, 99), y = U.rint(15, 60), z = U.rint(10, 40); t = `${x} + ${y} − ${z}`; a = x + y - z }
    else if (f === 2) { const x = U.rint(11, 25); t = `${x}²`; a = x * x }
    else if (f === 3) { const pc = U.pick([10, 20, 25, 50, 75]), y = U.pick([40, 60, 80, 120, 160, 200, 240, 360, 400]); t = `${pc}٪ من ${y}`; a = pc * y / 100; if (a % 1) { t = `10٪ من ${y}`; a = y / 10 } }
    else { const y = U.rint(4, 12), a0 = U.rint(6, 15); t = `${y * a0} ÷ ${y}`; a = a0 }
    return base('mental', 'حساب ذهني', 'math', 'احسب بسرعة', { input: 'num', ans: a, media: { k: 'big', t: U.ar(t) + (f === 3 ? ' = ؟' : ' = ؟'), ltr: f !== 3 ? 1 : 0 }, time: 20 });
  };
  G.seqnum = () => {
    const k = U.rint(0, 8); let s = [];
    if (k === 0) { const a = U.rint(2, 20), d = U.rint(3, 13); for (let i = 0; i < 6; i++) s.push(a + i * d) }
    if (k === 1) { const a = U.rint(1, 4), m = U.pick([2, 3]); for (let i = 0; i < 6; i++) s.push(a * m ** i) }
    if (k === 2) { const o = U.rint(1, 5); for (let i = 0; i < 6; i++) s.push((i + o) ** 2) }
    if (k === 3) { for (let i = 1; i <= 6; i++) s.push(i * (i + 1) / 2) }
    if (k === 4) { const a = U.rint(20, 40), u = U.rint(5, 9), d = U.rint(2, 4); let x = a; for (let i = 0; i < 6; i++) { s.push(x); x += i % 2 ? -d : u } }
    if (k === 5) { let a = U.rint(1, 3), b = U.rint(2, 5); s = [a, b]; while (s.length < 6) s.push(s[s.length - 1] + s[s.length - 2]) }
    if (k === 6) { s = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29].slice(U.rint(0, 4)).slice(0, 6) }
    if (k === 7) { let x = 1; for (let i = 0; i < 6; i++) { s.push(x); x = x * 2 + 1 } }
    if (k === 8) { const a = U.rint(1, 10); let x = a; for (let i = 0; i < 6; i++) { s.push(x); x += i + 2 } }
    const ans = s.pop();
    return base('seqnum', 'أكمل المتتابعة', 'math', 'ما العدد التالي؟', { input: 'num', ans, media: { k: 'nums', n: [...s.map(U.ar), '؟'] }, time: 25 });
  };
  const AW = ['حديقة|مكان', 'مستشفى|مكان', 'طائرة|وسيلة نقل', 'مدرسة|مكان', 'سيارة|وسيلة نقل', 'برتقال|فاكهة', 'مكتبة|مكان', 'حاسوب|جهاز', 'نخلة|نبات', 'قهوة|مشروب', 'مسجد|مكان', 'صحراء|طبيعة', 'سفينة|وسيلة نقل', 'نافذة|في البيت', 'مفتاح|أداة', 'مطبخ|في البيت', 'ملعب|مكان', 'حصان|حيوان', 'غزال|حيوان', 'زرافة|حيوان', 'فراشة|حشرة', 'عصفور|طائر', 'دلفين|حيوان بحري', 'تمساح|حيوان', 'بطيخ|فاكهة', 'رمان|فاكهة', 'ليمون|فاكهة', 'طماطم|خضار', 'مهندس|مهنة', 'طبيب|مهنة', 'معلم|مهنة', 'خباز|مهنة', 'نجار|مهنة', 'رسام|مهنة', 'طيار|مهنة', 'شاعر|مهنة', 'جزيرة|طبيعة', 'بركان|طبيعة', 'شلال|طبيعة', 'قمر|في السماء', 'نجمة|في السماء', 'سحابة|في السماء', 'مظلة|أداة', 'مقص|أداة', 'مسطرة|أداة مدرسية', 'دفتر|أداة مدرسية', 'حقيبة|أداة', 'سجادة|في البيت', 'وسادة|في البيت', 'ثلاجة|جهاز', 'مروحة|جهاز', 'كاميرا|جهاز', 'صقر|طائر', 'حمامة|طائر', 'بومة|طائر', 'ببغاء|طائر', 'أرنب|حيوان', 'سلحفاة|حيوان', 'نحلة|حشرة', 'نملة|حشرة', 'شتاء|فصل', 'ربيع|فصل', 'خريف|فصل', 'رياضة|نشاط', 'سباحة|رياضة', 'قراءة|هواية', 'كتابة|مهارة', 'شجاعة|صفة', 'أمانة|صفة', 'كرم|صفة', 'صداقة|علاقة', 'جامعة|مكان', 'متحف|مكان', 'مطار|مكان', 'فندق|مكان', 'خيمة|مكان', 'لؤلؤ|من البحر', 'مرجان|من البحر', 'تمر|طعام', 'خبز|طعام', 'عسل|طعام', 'زعفران|توابل'];
  G.anagram = () => {
    const k = take('anagram', AW.map((_, i) => i)); const [w, c] = AW[k].split('|');
    const chars = [...w]; let sh; let tries = 0; do { sh = U.shuffle(chars); tries++ } while (sh.join('') === w && tries < 20);
    const same = AW.map(x => x.split('|')[0]).filter(x => x !== w && [...x].length === chars.length);
    const other = AW.map(x => x.split('|')[0]).filter(x => x !== w && !same.includes(x));
    const wrong = U.sample(same, 3); while (wrong.length < 3) wrong.push(U.pick(other));
    return mcq('anagram', 'الكلمة المبعثرة', 'adab', `رتّب الحروف لتكوّن كلمة (التلميح: ${c})`, w, wrong, { media: { k: 'letters', l: sh }, time: 15 });
  };

  /* ---------- pictures ---------- */
  G.inst = () => {
    const keys = Object.keys(INST); const k = take('inst', keys); const g = INST[k].g;
    const same = keys.filter(x => x !== k && INST[x].g === g), rest = keys.filter(x => x !== k && INST[x].g !== g);
    const wrong = U.sample(same, 2).concat(U.sample(rest, 3)).slice(0, 3).map(x => INST[x].ar);
    return mcq('inst', 'ما اسم هذا الجهاز؟', 'pics', 'ما اسم هذا الجهاز أو الأداة؟', INST[k].ar, wrong, { media: { k: 'inst', n: k }, time: 15 });
  };
  const US_FAM = ['Texas', 'California', 'Florida', 'Alaska', 'New York', 'Hawaii', 'Washington', 'Nevada', 'Arizona', 'Utah', 'Colorado', 'Michigan', 'Ohio', 'Georgia', 'Louisiana', 'Illinois', 'Montana', 'Oregon', 'New Mexico', 'Oklahoma', 'Kansas', 'Pennsylvania', 'Virginia', 'Tennessee', 'Maine', 'Minnesota', 'Idaho', 'Wyoming'];
  const ARAB_Q = ['Saudi Arabia', 'Yemen', 'Oman', 'United Arab Emirates', 'Qatar', 'Kuwait', 'Iraq', 'Syria', 'Jordan', 'Lebanon', 'Egypt', 'Sudan', 'Libya', 'Tunisia', 'Algeria', 'Morocco', 'Mauritania', 'Somalia', 'Djibouti', 'Turkey', 'Iran', 'Ethiopia'];
  G.map = () => {
    const m = U.pick(['sa', 'sa', 'sa', 'sy', 'sy', 'us', 'arab', 'arab']);
    const M = MAPS[m];
    let pool = M.r.filter(r => r.ar);
    if (m === 'sy') pool = pool.filter(r => r.k !== 'SY-DI');
    if (m === 'us') pool = pool.filter(r => US_FAM.includes(r.k));
    if (m === 'arab') pool = pool.filter(r => ARAB_Q.includes(r.k));
    const k = take('map_' + m, pool.map(r => r.k)); const r = pool.find(x => x.k === k);
    const P = { sa: 'ما اسم المنطقة السعودية المظللة؟', sy: 'ما اسم المحافظة السورية المظللة؟', us: 'ما اسم الولاية الأمريكية المظللة؟', arab: 'ما اسم الدولة المظللة؟' }[m];
    return mcq('map', 'الجزء المظلل', 'pics', P, r.ar, U.sample(pool.filter(x => x.k !== k), 3).map(x => x.ar), { media: { k: 'map', m, hl: k }, time: 15 });
  };
  G.flag = () => { const k = take('flag', FLAG_KEYS); return mcq('flag', 'أعلام الدول', 'pics', 'علم أي دولة هذا؟', FLAGS[k].ar, U.sample(FLAG_KEYS.filter(x => x !== k), 3).map(x => FLAGS[x].ar), { media: { k: 'flag', f: k }, time: 12 }) };
  G.land = () => { const k = take('land', LAND_KEYS); return mcq('land', 'معالم سعودية', 'pics', 'ما هذا المَعلم؟', LAND[k].ar, U.sample(LAND_KEYS.filter(x => x !== k), 3).map(x => LAND[x].ar), { media: { k: 'land', l: k }, time: 15 }) };

  /* ---------- eyes / speed ---------- */
  const PAIRS = [['ب', 'ت'], ['ح', 'خ'], ['ع', 'غ'], ['ص', 'ض'], ['ط', 'ظ'], ['ر', 'ز'], ['س', 'ش'], ['د', 'ذ'], ['ف', 'ق'], ['ى', 'ي'], ['ه', 'ة'], ['6', '9'], ['٦', '٧'], ['E', 'F'], ['O', 'Q'], ['M', 'N'], ['b', 'd'], ['p', 'q'], ['8', 'B'], ['٣', '٢']];
  G.gridodd = r => {
    const cols = 6 + Math.min(r - 1, 2), rows = 6 + Math.min(r - 1, 2), n = cols * rows, oi = U.rint(0, n - 1);
    let m;
    if (Math.random() < .6) { const pr = U.pick(PAIRS); const sw = Math.random() < .5; m = { k: 'grid', kind: 'text', cols, rows, base: pr[sw ? 1 : 0], odd: pr[sw ? 0 : 1], oi, font: /[A-Za-z0-9]/.test(pr[0]) ? 'Arial' : '' } }
    else {
      const sh = U.pick(['circle', 'square', 'tri', 'star', 'hex', 'diamond']); const c = U.pick(['red', 'blue', 'green', 'violet', 'orange']);
      const v = U.pick(sh === 'circle' ? ['size', 'shade'] : ['size', 'shade', 'rot']);
      const shade = { red: '#F57A7F', blue: '#5A9BF0', green: '#4CC27F', violet: '#A383F8', orange: '#FFA466' }[c];
      m = { k: 'grid', kind: 'shape', cols, rows, oi, sh, z: 18, zo: v === 'size' ? 21.5 : 18, rb: 0, ro: v === 'rot' ? (sh === 'hex' ? 15 : sh === 'square' ? 12 : 18) : 0, cb: COL[c], co: v === 'shade' ? shade : COL[c] };
    }
    return base('gridodd', 'اكتشف المختلف', 'eyes', 'اضغط على المختلف بسرعة!', { input: 'tap', ans: oi, media: m, time: 25 });
  };
  const ASYM = ['fish', 'palm', 'dallah', 'key', 'cup', 'boat', 'moon', 'kite', 'umbrella', 'tent'];
  function scene(cols, rows, nItems, icons) {
    const cells = U.sample(Array.from({ length: cols * rows }, (_, i) => i), nItems);
    const ic = icons || U.sample(Object.keys(ICON), 7);
    return { cols, rows, items: cells.map(i => ({ i, s: U.pick(ic), c: U.pick(['red', 'blue', 'green', 'yellow', 'violet', 'orange', 'teal', 'pink']), r: 0, z: .8 })) };
  }
  function mutate(sc, b, used) {
    const filled = sc.items.map(x => x.i), empty = Array.from({ length: sc.cols * sc.rows }, (_, i) => i).filter(i => !filled.includes(i) && !used.includes(i));
    const t = U.pick(['color', 'color', 'swap', 'gone', 'add', 'flip', 'size']);
    if (t === 'add' && empty.length) { const i = U.pick(empty); b.items.push({ i, s: U.pick(Object.keys(ICON)), c: U.pick(['red', 'blue', 'green', 'violet']), r: 0, z: .8 }); return i }
    const cand = b.items.filter(x => !used.includes(x.i) && !x.gone); const it = U.pick(cand);
    if (t === 'gone') it.gone = 1;
    else if (t === 'swap') it.s = U.pick(Object.keys(ICON).filter(s => s !== it.s));
    else if (t === 'flip' && ASYM.includes(it.s)) it.f = 1;
    else if (t === 'size') it.z = .52;
    else it.c = U.pick(['red', 'blue', 'green', 'yellow', 'violet', 'orange', 'teal', 'pink'].filter(c => c !== it.c));
    return it.i;
  }
  G.diff = r => {
    const a = scene(4, 3, U.rint(9, 11)); const b = JSON.parse(JSON.stringify(a));
    if (r >= 2 && Math.random() < .35) {
      const k = U.rint(2, 4), used = []; for (let i = 0; i < k; i++) used.push(mutate(a, b, used));
      const opts = U.shuffle([k, k - 1, k + 1, k + 2].map(U.ar));
      return base('diff', 'الفرق بين الصورتين', 'eyes', 'كم فرقًا بين الصورتين؟', { input: 'choice', opts, ans: opts.indexOf(U.ar(k)), media: { k: 'diff', a, b, cnt: 1 }, time: 25, marks: used });
    }
    const i = mutate(a, b, []);
    return base('diff', 'الفرق بين الصورتين', 'eyes', 'اكتشف الفرق واضغط مكانه في الصورة المعدّلة', { input: 'tap', ans: i, media: { k: 'diff', a, b }, time: 30 });
  };
  G.pattern = r => {
    const shapes = U.sample(['circle', 'square', 'tri', 'diamond', 'star', 'hex'], 3), cols = U.sample(['red', 'blue', 'green', 'violet', 'orange'], 3), fills = ['solid', 'outline', 'dot'];
    const rule = U.rint(0, 2); const cells = [];
    for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) {
      let t;
      if (rule === 0) t = { sh: shapes[y], n: x + 1, c: cols[(x + y) % 3], f: 'solid', rot: 0 };
      else if (rule === 1) t = { sh: shapes[(x + y) % 3], n: 1 + ((x + 2 * y) % 3), c: cols[y], f: fills[x], rot: 0 };
      else t = { sh: 'tri', n: y + 1, c: cols[x], f: 'solid', rot: [0, 90, 180][(x + y) % 3] };
      cells.push(t);
    }
    const mi = r >= 2 && Math.random() < .4 ? U.rint(0, 8) : 8;
    const correct = cells[mi]; const seen = new Set([JSON.stringify(correct)]); const opts = [correct];
    const muts = [t => ({ ...t, n: t.n % 3 + 1 }), t => ({ ...t, sh: U.pick(['circle', 'square', 'tri', 'diamond', 'star', 'hex'].filter(s => s !== t.sh)) }), t => ({ ...t, c: U.pick(['red', 'blue', 'green', 'violet', 'orange'].filter(c => c !== t.c)) }), t => ({ ...t, f: U.pick(fills.filter(f => f !== t.f)) }), t => ({ ...t, rot: (t.rot + 90) % 360 })];
    let g = 0; while (opts.length < 4 && g++ < 60) { const o = U.pick(muts)(correct); const s = JSON.stringify(o); if (!seen.has(s) && !(o.sh === 'circle' && o.rot !== correct.rot) && !(o.sh === 'square' && Math.abs(o.rot - correct.rot) === 180)) { seen.add(s); opts.push(o) } }
    const sh = U.shuffle(opts);
    const shown = cells.slice(); shown[mi] = null;
    return base('pattern', 'القطعة الناقصة', 'eyes', 'ما القطعة الناقصة في الشبكة؟', { input: 'choice', opts: sh.map(t => ({ tile: t })), ans: sh.indexOf(correct), media: { k: 'matrix', cells: shown }, time: 30 });
  };
  G.memory = r => {
    const icons = U.sample(Object.keys(ICON), 5); const sc = scene(4, 3, U.rint(7, 9), icons); sc.items.slice(0, 4).forEach((it, i) => it.s = icons[i]);
    const counts = {}; sc.items.forEach(x => counts[x.s] = (counts[x.s] || 0) + 1);
    const kind = U.rint(0, 3); let q;
    if (kind === 0) { const s = U.pick(Object.keys(counts)); const n = counts[s]; const o = U.shuffle([...new Set([n, n + 1, Math.max(0, n - 1), n + 2, n + 3])].slice(0, 4).map(U.ar)); q = { prompt: `كم كان عدد الـ${ICON_PL[s]}؟`, opts: o, ans: o.indexOf(U.ar(n)) } }
    else if (kind === 1) { const once = Object.keys(counts).filter(s => counts[s] === 1); if (once.length) { const s = U.pick(once); const it = sc.items.find(x => x.s === s); const o = U.shuffle([CNAME[it.c], ...U.sample(['red', 'blue', 'green', 'yellow', 'violet', 'orange', 'teal', 'pink'].filter(c => c !== it.c), 3).map(c => CNAME[c])]); q = { prompt: `ما لون الـ${ICON_NAMES[s]}؟`, opts: o, ans: o.indexOf(CNAME[it.c]) } } }
    if (!q && kind <= 2) { const absent = U.pick(Object.keys(ICON).filter(s => !counts[s])); const o = U.shuffle([ICON_NAMES[absent], ...U.sample(Object.keys(counts), 3).map(s => ICON_NAMES[s])]); q = { prompt: 'أي هذه لم يكن في الصورة؟', opts: o, ans: o.indexOf(ICON_NAMES[absent]) } }
    const corner = !q && (sc.items.find(x => x.i === sc.cols - 1) || sc.items.find(x => x.i === 0));
    if (!q && !corner) { const absent = U.pick(Object.keys(ICON).filter(s => !counts[s])); const o = U.shuffle([ICON_NAMES[absent], ...U.sample(Object.keys(counts), 3).map(s => ICON_NAMES[s])]); q = { prompt: 'أي هذه لم يكن في الصورة؟', opts: o, ans: o.indexOf(ICON_NAMES[absent]) } }
    if (!q) { const lbl = corner.i === 0 ? 'الزاوية العليا اليسرى' : 'الزاوية العليا اليمنى'; const o = U.shuffle([ICON_NAMES[corner.s], ...U.sample(Object.keys(ICON).filter(s => s !== corner.s), 3).map(s => ICON_NAMES[s])]); q = { prompt: `ماذا كان في ${lbl}؟`, opts: o, ans: o.indexOf(ICON_NAMES[corner.s]) } }
    const show = Math.max(4000, 6500 - r * 500);
    return base('memory', 'ذاكرة الصورة', 'eyes', q.prompt, { input: 'choice', opts: q.opts, ans: q.ans, media: { k: 'scene', sc }, pre: show, preText: 'احفظوا الصورة جيدًا!', after: { k: 'cover' }, time: 12 });
  };
  const SC = ['red', 'blue', 'green', 'yellow', 'violet', 'orange'];
  G.stroop = () => {
    if (Math.random() < .3) {
      const ws = Array.from({ length: 8 }, () => { const w = U.pick(SC); return { w, c: Math.random() < .4 ? w : U.pick(SC.filter(x => x !== w)) } });
      const n = ws.filter(x => x.w === x.c).length; const o = U.shuffle([...new Set([n, n + 1, Math.max(0, n - 1), n + 2, n + 3])].slice(0, 4).map(U.ar));
      return base('stroop', 'لون الكلمة', 'eyes', 'كم كلمة مكتوبة بلونها الصحيح؟', { input: 'choice', opts: o, ans: o.indexOf(U.ar(n)), media: { k: 'stroopmany', ws }, time: 14 });
    }
    const w = U.pick(SC), c = U.pick(SC.filter(x => x !== w));
    const names = U.shuffle([c, w, ...U.sample(SC.filter(x => x !== w && x !== c), 2)]);
    const opts = names.map(n => ({ t: CNAME[n], ink: U.pick(SC.filter(x => x !== n)) }));
    return base('stroop', 'لون الكلمة', 'eyes', 'ما لون الحبر؟ (لا تقرأ الكلمة!)', { input: 'choice', opts, ans: names.indexOf(c), media: { k: 'stroop', w: CNAME[w], c }, time: 7 });
  };
  const CF = { red: 'الحمراء', blue: 'الزرقاء', green: 'الخضراء', yellow: 'الصفراء', violet: 'البنفسجية' };
  const SHD = { circle: 'الدوائر', square: 'المربعات', tri: 'المثلثات', star: 'النجوم', diamond: 'المعيّنات' };
  G.count = r => {
    const W = 600, H = 360, shs = U.sample(Object.keys(SHD), 3), cs = U.sample(Object.keys(CF), 3);
    const target = { sh: shs[0], c: cs[0] }, n = U.rint(3, 8 + r);
    const items = []; const place = (sh, c) => { for (let g = 0; g < 300; g++) { const z = U.rint(16, 24), x = U.rint(z + 6, W - z - 6), y = U.rint(z + 6, H - z - 6); if (items.every(o => Math.hypot(o.x - x, o.y - y) > o.z + z + 6)) { items.push({ sh, c, x, y, z, r: U.rint(-20, 20) }); return } } };
    for (let i = 0; i < n; i++) place(target.sh, target.c);
    const others = U.rint(14, 20 + r * 2);
    for (let i = 0; i < others; i++) { let sh = U.pick(shs), c = U.pick(cs); if (sh === target.sh && c === target.c) c = cs[1]; place(sh, c) }
    const real = items.filter(o => o.sh === target.sh && o.c === target.c).length;
    return base('count', 'عُدّ بسرعة', 'eyes', `كم عدد ${SHD[target.sh]} ${CF[target.c]}؟`, { input: 'num', ans: real, media: { k: 'scatter', w: W, h: H, items: U.shuffle(items) }, time: 20 });
  };

  /* ---------- ears / reflex ---------- */
  G.beeps = r => {
    const long = r >= 2 && Math.random() < .4; const n = U.rint(6, 10 + r * 2); let t = 0; const s = [];
    for (let i = 0; i < n; i++) { const L = long ? Math.random() < .45 : false; s.push({ t, d: L ? .42 : .09, f: 880 }); t += (L ? .42 : .09) + (Math.random() < .25 ? .07 : U.rint(14, 42) / 100) }
    const ans = long ? s.filter(x => x.d > .2).length : n;
    if (long && ans === 0) { s[0].d = .42 }
    return base('beeps', 'كم صفارة؟', 'ears', long ? 'كم صفارة طويلة سمعت؟' : 'كم صفارة سمعت؟', { input: 'num', ans: long ? s.filter(x => x.d > .2).length : n, media: { k: 'sound' }, pre: Math.round((t + 1.1) * 1000), preText: 'ركّزوا… واستمعوا', sound: { k: 'beeps', s }, time: 12 });
  };
  G.tone = r => {
    const kind = U.rint(0, 1), bf = U.rint(420, 600), gap = .34, dur = .55; const s = []; let ans;
    const step = Math.max(.035, .09 - r * .012);
    if (kind === 0) { const fs = U.shuffle([bf, bf * (1 + step), bf * (1 - step), bf * (1 + step * 2)]); ans = fs.indexOf(Math.max(...fs)); fs.forEach((f, i) => s.push({ t: i * (dur + gap), d: dur, f, lbl: i })) }
    else { ans = U.rint(0, 3); const df = Math.random() < .5 ? 1 + step : 1 - step; for (let i = 0; i < 4; i++) s.push({ t: i * (dur + gap), d: dur, f: i === ans ? bf * df : bf, lbl: i }) }
    const opts = ['النغمة ١', 'النغمة ٢', 'النغمة ٣', 'النغمة ٤'];
    return base('tone', 'أذن ذهبية', 'ears', kind === 0 ? 'أي نغمة كانت الأعلى؟' : 'أي نغمة مختلفة عن البقية؟', { input: 'choice', opts, ans, media: { k: 'sound', labels: ['١', '٢', '٣', '٤'] }, pre: Math.round((4 * (dur + gap) + .9) * 1000), preText: 'استمعوا للنغمات الأربع', sound: { k: 'tones', s }, time: 10 });
  };
  G.simon = r => {
    const n = 4 + Math.min(r, 3); const s = []; while (s.length < n) { const p = U.rint(0, 3); if (s.length >= 2 && s[s.length - 1] === p && s[s.length - 2] === p) continue; s.push(p) }
    const step = 640;
    return base('simon', 'تسلسل الألوان', 'ears', 'أعيدوا تسلسل الألوان بالترتيب', { input: 'seq', n, ans: s, media: { k: 'simon', seq: s, step }, pre: 900 + n * step + 300, preText: 'راقبوا الألوان واحفظوا ترتيبها', sound: { k: 'simon', s, step }, time: 12 + n });
  };
  G.reflex = () => {
    const d = U.rint(2200, 6500);
    return base('reflex', 'رد الفعل', 'ears', 'اضغط فور تحوّل اللون إلى الأخضر!', { input: 'reflex', d, ans: null, media: { k: 'reflex' }, time: Math.ceil(d / 1000) + 3 });
  };

  /* ---------- round builder ---------- */
  const FAMS = {
    info: { ar: 'معلومات عامة', g: ['sci', 'geo', 'hist', 'gen', 'capitals', 'currency', 'awwal', 'inventors'] },
    deen: { ar: 'دين وسيرة', g: ['deen', 'fiqh', 'seerah', 'battles', 'quranOpen', 'quranWord', 'prophets', 'sahaba'] },
    adab: { ar: 'لغة وأدب', g: ['lang', 'poetry', 'qael', 'proverbs', 'english', 'anagram', 'novels'] },
    logic: { ar: 'ألغاز ومنطق', g: ['riddles', 'story', 'odd', 'order', 'tf', 'emoji'] },
    math: { ar: 'رياضيات', g: ['math', 'mental', 'seqnum'] },
    pics: { ar: 'صور وخرائط وأعلام', g: ['inst', 'map', 'flag', 'land'] },
    eyes: { ar: 'سرعة ونظر', g: ['gridodd', 'diff', 'pattern', 'memory', 'stroop', 'count'] },
    ears: { ar: 'أصوات ورد فعل', g: ['beeps', 'tone', 'simon', 'reflex'] }
  };
  const RECIPE = ['info', 'deen', 'adab', 'logic', 'math', 'pics', 'pics', 'eyes', 'eyes', 'ears'];
  let lastTypes = [];
  function round(r, fams) {
    const on = Object.keys(FAMS).filter(f => fams[f] !== false);
    if (!on.length) on.push('info');
    let slots = RECIPE.map(f => on.includes(f) ? f : U.pick(on));
    if (Math.random() < .5 && on.includes('info')) slots[6] = 'info';
    if (Math.random() < .4 && on.includes('logic')) slots[3] = U.pick(['logic', 'adab'].filter(x => on.includes(x)));
    // arrange: avoid same family adjacent
    let best = null;
    for (let t = 0; t < 80; t++) { const s = U.shuffle(slots); let bad = 0; for (let i = 1; i < s.length; i++) if (s[i] === s[i - 1]) bad++; if (!best || bad < best.bad) best = { s, bad }; if (!bad) break }
    slots = best.s;
    const qs = []; const typesUsed = {};
    const force = typeof QS !== 'undefined' && QS.get('force');
    if (force) { const ts = force.split(',').filter(t => G[t]); const out = ts.slice((r - 1) * 10, r * 10).map(t => G[t](r)); if (out.length) { out[out.length - 1].golden = true; return out } }
    for (const f of slots) {
      let g = FAMS[f].g.filter(x => (typesUsed[x] || 0) < 1 && !lastTypes.slice(-3).includes(x));
      if (!g.length) g = FAMS[f].g;
      const t = U.pick(g); typesUsed[t] = (typesUsed[t] || 0) + 1;
      let q; try { q = G[t](r) } catch (e) { console.error(t, e); q = G.sci() }
      qs.push(q); lastTypes.push(t);
    }
    qs[qs.length - 1].golden = true;
    save();
    return qs;
  }
  function resetUsed() { used = new Set(); save() }
  return { round, FAMS, G, resetUsed, usedCount: () => used.size };
})();
