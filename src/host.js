/* ===== Main screen (host) ===== */
const Host = (() => {
  const SAVE = 'lamma_host_v1';
  const S = { room: null, b: 0, players: {}, phase: 'lobby', round: 0, qn: 0, qs: [], q: null, qStart: 0, ans: {}, rev: null, board: null, limitMs: 0, ver: 0, net: 'connecting',
    settings: { fams: {}, speed: 1, sfx: true, tts: false, auto: true }, mode: 'board', me: null };
  let net, root, bar = null, local = null, timers = [], raf = 0, pubT = 0, preDone = false, lastTick = -1;
  const play = () => S.mode === 'play';
  const sfx = n => { if (play() && n !== 'pop') return; AU.sfx(n) };
  const $ = s => root.querySelector(s);
  const now = () => Date.now();
  const plist = () => Object.values(S.players);
  const ranked = () => plist().sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, 'ar'));
  const alive = p => p.bot || now() - p.seen < 20000;
  const later = (ms, f) => timers.push(setTimeout(f, ms));
  const clearT = () => { timers.forEach(clearTimeout); timers = [] };
  const joinURL = () => location.origin + location.pathname + '?join=' + S.room + '&b=' + S.b + (QS.get('broker') ? '&broker=' + encodeURIComponent(QS.get('broker')) : '');

  function save() { try { localStorage.setItem(SAVE, JSON.stringify({ at: now(), room: S.room, b: S.b, players: S.players, round: S.round, settings: S.settings, mode: S.mode, me: S.me })) } catch (e) { } }
  function saved() { try { const s = JSON.parse(localStorage.getItem(SAVE) || 'null'); if (s && now() - s.at < 8 * 3600e3 && Object.keys(s.players || {}).length) return s } catch (e) { } return null }

  /* ---------- network ---------- */
  function publish() {
    const o = { t: 'st', ph: S.phase, room: S.room, r: S.round, n: S.qn, of: S.qs.length || 10, v: S.ver, ps: ranked().filter(p => !p.bot).map(p => ({ id: p.id, name: p.name, av: p.av, score: p.score })) };
    if (S.phase === 'ready' && S.q) o.q = { id: S.q.id, cat: S.q.cat, golden: !!S.q.golden };
    if (S.phase === 'q') { const { ans, note, sound, marks, ...pub } = S.q; o.q = pub; if (play() && sound) { o.q.sound = sound; o.q.snd = 1 } o.el = now() - S.qStart; o.got = Object.keys(S.ans); o.lim = S.limitMs }
    o.host = S.me || null;
    if (S.phase === 'rev') o.rev = S.rev;
    if (S.phase === 'rend' || S.phase === 'final') o.board = S.board;
    net && net.send(o);
    if (local) { const c = JSON.parse(JSON.stringify(o)); setTimeout(() => local(c)) }
  }
  const publishSoon = () => { clearTimeout(pubT); pubT = setTimeout(publish, 120) };
  function onMsg(m) {
    if (!m || typeof m.id !== 'string' || m.id.length > 40) return;
    let p = S.players[m.id];
    if (m.t === 'join') {
      const name = String(m.name || '').replace(/\s+/g, ' ').trim().slice(0, 16) || 'لاعب';
      const av = AVATARS.includes(m.av) ? m.av : AVATARS[0];
      if (!p) {
        if (plist().length >= 40) return;
        S.players[m.id] = p = { id: m.id, name, av, score: 0, streak: 0, best: 0, correct: 0, answered: 0, fast: 0, rs: 0, seen: now() };
        sfx('pop'); if (!play()) toast(`${av} ${name} دخل اللعبة`);
      } else { p.name = name; p.av = av; p.seen = now() }
      S.ver++; publish(); refreshPlayers(); save(); return;
    }
    if (!p) return;
    p.seen = now();
    if (m.t === 'ans') onAns(p, m);
  }
  function onAns(p, m) {
    if (S.phase !== 'q' || m.qid !== S.q.id) return;
    if (S.ans[p.id]) { publishSoon(); return }
    let a = m.a;
    if (S.q.input === 'reflex') a = typeof a === 'number' ? a : -1;
    S.ans[p.id] = { a, ms: U.clamp(+m.ms || 0, 0, S.limitMs) };
    markIn(p.id); publishSoon();
    const live = plist().filter(alive);
    if (live.length && live.every(x => S.ans[x.id])) later(600, endQ);
  }

  /* ---------- game flow ---------- */
  function startGame() {
    AU.init(); AU.on = S.settings.sfx;
    if (!plist().length) return;
    S.round = 0; plist().forEach(p => Object.assign(p, { score: 0, streak: 0, best: 0, correct: 0, answered: 0, fast: 0, rs: 0 }));
    nextRound();
  }
  function nextRound() {
    clearT(); AU.init();
    S.round++; S.qn = 0; S.qs = QG.round(S.round, S.settings.fams); plist().forEach(p => p.rs = 0);
    S.phase = 'intro'; S.ver++; render(); publish(); sfx('fanfare');
    later(3400, nextQ);
  }
  function nextQ() {
    clearT(); stopLoop();
    if (S.qn >= S.qs.length) return roundEnd();
    S.q = S.qs[S.qn]; S.qn++;
    S.phase = 'ready'; S.ver++; render(); publish();
    sfx(S.q.golden ? 'gold' : 'whoosh');
    later(S.q.golden ? 3300 : 2400, startQ);
  }
  function startQ() {
    clearT();
    const q = S.q;
    S.phase = 'q'; S.ans = {}; S.qStart = now(); preDone = !q.pre; lastTick = -1;
    S.limitMs = Math.round(q.time * 1000 * (q.input === 'reflex' ? 1 : S.settings.speed));
    S.ver++; render(); publish();
    if (q.sound && !play()) AU.play(q.sound, i => { const e = root.querySelector(`.tonelbl [data-t="${i}"]`); if (e) { e.classList.add('on'); setTimeout(() => e.classList.remove('on'), 520) } });
    if (q.input === 'seq' && !play()) simonShow(root, q, S.qStart);
    if (S.settings.tts && !play() && 'speechSynthesis' in window && !q.sound) { try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(q.prompt.replace(/[()]/g, '')); u.lang = 'ar-SA'; u.rate = 1.02; speechSynthesis.speak(u) } catch (e) { } }
    later(q.pre + S.limitMs + 900, endQ);
    if (!play()) loop();
    plist().filter(p => p.bot).forEach(p => botPlay(p, q));
  }
  function botPlay(p, q) {
    const t0 = q.pre + U.rint(1200, Math.min(S.limitMs - 500, 9000));
    later(t0, () => {
      if (S.phase !== 'q' || S.q !== q) return;
      const good = Math.random() < .62; let a;
      if (q.input === 'choice') a = good ? q.ans : U.rint(0, q.opts.length - 1);
      else if (q.input === 'tap') a = good ? q.ans : U.rint(0, 20);
      else if (q.input === 'num') a = good ? q.ans : q.ans + U.pick([-1, 1, 2]);
      else if (q.input === 'order' || q.input === 'seq') a = good ? q.ans.slice() : U.shuffle(q.ans);
      else if (q.input === 'reflex') { const r = U.rint(240, 520); later(Math.max(0, q.d + r - t0), () => onAns(p, { qid: q.id, a: Math.random() < .1 ? -1 : r, ms: r })); return }
      onAns(p, { qid: q.id, a, ms: t0 - q.pre });
    });
  }
  function grade(q, a) {
    switch (q.input) {
      case 'choice': case 'tap': return a === q.ans;
      case 'num': return a !== '' && a !== null && Number(a) === q.ans;
      case 'order': case 'seq': return Array.isArray(a) && a.length === q.ans.length && a.every((v, i) => v === q.ans[i]);
    }
    return false;
  }
  function endQ() {
    if (S.phase !== 'q') return;
    clearT(); stopLoop(); try { speechSynthesis.cancel() } catch (e) { }
    const q = S.q, res = {};
    const before = ranked().map(p => p.id);
    if (q.input === 'reflex') {
      const valid = Object.entries(S.ans).filter(([, x]) => typeof x.a === 'number' && x.a >= 0).sort((a, b) => a[1].a - b[1].a);
      const pts = [1000, 820, 680, 560, 460, 380, 320, 270, 230, 200];
      valid.forEach(([id, x], i) => res[id] = { c: true, p: pts[i] || 180, ms: x.a });
      Object.entries(S.ans).forEach(([id, x]) => { if (!res[id]) res[id] = { c: false, p: 0, ms: null, fs: 1 } });
    } else for (const [id, x] of Object.entries(S.ans)) {
      const c = grade(q, x.a);
      res[id] = { c, p: c ? Math.round((1000 - 500 * x.ms / S.limitMs) / 10) * 10 : 0, ms: x.ms, a: x.a };
    }
    let fastest = null;
    for (const p of plist()) {
      const r = res[p.id];
      if (!r) { p.streak = 0; continue }
      p.answered++;
      if (r.c) {
        p.correct++; p.streak++; p.best = Math.max(p.best, p.streak);
        if (q.golden) r.p *= 2;
        if (p.streak >= 3) { r.b = 100; r.p += 100; r.st = p.streak }
        if (!fastest || r.ms < res[fastest].ms) fastest = p.id;
      } else p.streak = 0;
      p.score += r.p; p.rs += r.p;
    }
    if (fastest) S.players[fastest].fast++;
    const after = ranked().map(p => p.id);
    after.forEach((id, i) => { if (res[id]) res[id].mv = before.indexOf(id) - i });
    let counts = null;
    if (q.input === 'choice') { counts = q.opts.map(() => 0); Object.values(S.ans).forEach(x => { if (typeof x.a === 'number' && counts[x.a] != null) counts[x.a]++ }) }
    S.rev = { qid: q.id, input: q.input, ans: q.ans, note: q.note || null, res, fastest, counts, marks: q.marks || null, golden: !!q.golden };
    S.phase = 'rev'; S.ver++; render(); publish(); sfx('reveal');
    if (S.settings.auto) later(q.note ? 9000 : 7500, nextQ);
    save();
  }
  function boardData(final) {
    const r = ranked();
    const b = { round: S.round, all: r.map(p => ({ id: p.id, name: p.name, av: p.av, score: p.score, rs: p.rs })), rtop: plist().slice().sort((a, b) => b.rs - a.rs).slice(0, 3).map(p => ({ id: p.id, name: p.name, av: p.av, rs: p.rs })) };
    if (final) {
      const best = (f, ok = () => true) => { const c = plist().filter(ok).sort((a, b) => f(b) - f(a))[0]; return c ? { id: c.id, name: c.name, av: c.av } : null };
      b.aw = [
        { t: 'الأسرع', d: 'أكثر من كان أول المجيبين صوابًا', p: best(p => p.fast, p => p.fast > 0), v: p => U.ar(p.fast) + ' مرة' },
        { t: 'أطول سلسلة', d: 'أكثر إجابات صحيحة متتالية', p: best(p => p.best, p => p.best > 1) },
        { t: 'الأدق', d: 'أعلى نسبة إجابات صحيحة', p: best(p => p.answered ? p.correct / p.answered : 0, p => p.answered >= 3) }
      ].map(a => ({ t: a.t, d: a.d, p: a.p, v: a.p ? (a.t === 'الأسرع' ? times(S.players[a.p.id].fast) : a.t === 'أطول سلسلة' ? U.ar(S.players[a.p.id].best) + ' إجابات متتالية' : U.ar(Math.round(100 * S.players[a.p.id].correct / S.players[a.p.id].answered)) + '٪') : '' }));
    }
    return b;
  }
  function times(n) { return n === 1 ? 'مرة واحدة' : n === 2 ? 'مرتان' : U.ar(n) + (n <= 10 ? ' مرات' : ' مرة') }
  function roundEnd() { clearT(); S.phase = 'rend'; S.board = boardData(false); S.ver++; render(); publish(); sfx('fanfare'); save() }
  function finish() { clearT(); stopLoop(); S.phase = 'final'; S.board = boardData(true); S.ver++; render(); publish(); sfx('fanfare'); if (!play()) confetti(); save() }
  function toLobby() { clearT(); stopLoop(); S.phase = 'lobby'; S.round = 0; S.qn = 0; S.qs = []; plist().forEach(p => Object.assign(p, { score: 0, streak: 0, best: 0, correct: 0, answered: 0, fast: 0, rs: 0 })); S.ver++; render(); publish() }

  /* ---------- timer loop ---------- */
  function loop() {
    const q = S.q; const el = now() - S.qStart;
    if (!preDone && el >= q.pre) { preDone = true; afterPre() }
    if (q.input === 'reflex') { const pad = $('.reflex'); if (pad && el >= q.d && !pad.classList.contains('go')) { pad.classList.add('go'); pad.querySelector('span').textContent = 'الآن!'; AU.sfx('go') } }
    const left = q.pre + S.limitMs - el, frac = U.clamp(left / S.limitMs, 0, 1);
    const ring = $('.ring .fg'); if (ring) ring.style.strokeDashoffset = String(283 * (1 - (el < q.pre ? 1 : frac)));
    const tn = $('.ring b'); if (tn) { const s = Math.max(0, Math.ceil(left / 1000)); tn.textContent = el < q.pre ? '…' : U.ar(s); if (el >= q.pre && s <= 5 && s !== lastTick && s > 0 && q.input !== 'reflex') { lastTick = s; sfx('tick') } $('.ring')?.classList.toggle('hot', el >= q.pre && s <= 5) }
    const pb = $('.prebar i'); if (pb) pb.style.width = (100 * U.clamp(1 - el / q.pre, 0, 1)) + '%';
    raf = requestAnimationFrame(loop);
  }
  const stopLoop = () => cancelAnimationFrame(raf);
  function afterPre() {
    const q = S.q;
    if (q.after) { const m = $('.media'); if (m) m.innerHTML = renderMedia(q.after); const pr = $('.prompt'); if (pr) { pr.textContent = q.prompt; pr.classList.add('pop') } }
    const pb = $('.prebar'); if (pb) pb.remove();
    const o = $('.opts'); if (o) o.classList.remove('hide');
    const h = $('.hint'); if (h) h.classList.remove('hide');
    sfx('go');
  }

  /* ---------- rendering ---------- */
  const avatar = (p, cls = '') => `<span class="av ${cls}" data-id="${p.id}"><i>${p.av}</i><em>${U.esc(p.name)}</em></span>`;
  function header() {
    const ph = S.phase;
    const mid = ph === 'lobby' ? '' : ph === 'final' ? 'النتيجة النهائية' : `الجولة ${U.ar(S.round)}${S.qn && ph !== 'intro' && ph !== 'rend' ? ` — السؤال ${U.ar(S.qn)} من ${U.ar(S.qs.length)}` : ''}`;
    return `<header class="hbar"><div class="brand"><span class="logo">لمّة</span><span>تحدّي العائلة</span></div><div class="mid">${mid}</div><div class="tools">
      ${ph !== 'lobby' ? `<span class="codechip" title="رابط الدخول">الرمز <b>${S.room}</b></span>` : ''}
      <button class="tb" data-act="sfx" title="المؤثرات الصوتية">${S.settings.sfx ? 'صوت: يعمل' : 'صوت: مغلق'}</button>
      ${['rev', 'q', 'ready'].includes(ph) ? `<button class="tb" data-act="auto">${S.settings.auto ? 'انتقال تلقائي' : 'انتقال يدوي'}</button>` : ''}
      ${ph === 'q' ? `<button class="tb" data-act="skip">إنهاء السؤال</button>` : ''}
      ${ph === 'rev' ? `<button class="tb pri" data-act="next">التالي ←</button>` : ''}
      ${['rev', 'q', 'ready', 'rend', 'intro'].includes(ph) ? `<button class="tb" data-act="end">إنهاء اللعبة</button>` : ''}
      <button class="tb" data-act="fs" title="ملء الشاشة">⛶</button>
      <span class="net ${S.net}" title="الاتصال"></span></div></header>`;
  }
  function render() {
    const ph = S.phase; let body = '';
    if (play()) { renderBar(); if (ph !== 'lobby') return; root.className = 'host play'; root.innerHTML = `<main class="stage ph-lobby">${lobby()}</main><div id="toasts"></div>`; return }
    if (ph === 'lobby') body = lobby();
    else if (ph === 'intro') body = `<section class="intro pop"><p>استعدوا لـ</p><h1>الجولة ${U.ar(S.round)}</h1><div class="introtypes">${S.qs.map(q => `<span>${U.esc(q.cat)}</span>`).join('')}</div><p class="sub">١٠ أسئلة، السؤال الأخير ذهبي بضعف النقاط</p></section>`;
    else if (ph === 'ready') body = `<section class="ready pop ${S.q.golden ? 'gold' : ''}"><div class="qnum">${U.ar(S.qn)}</div><h2>${S.q.golden ? 'السؤال الذهبي، النقاط مضاعفة' : 'السؤال التالي'}</h2><div class="badge big">${U.esc(S.q.cat)}</div></section>`;
    else if (ph === 'q') body = qScreen(false);
    else if (ph === 'rev') body = qScreen(true);
    else if (ph === 'rend') body = roundEndHTML();
    else if (ph === 'final') body = finalHTML();
    root.innerHTML = header() + `<main class="stage ph-${ph}">${body}</main><div id="toasts"></div>`;
    if (ph === 'lobby') wireLobby();
    if (ph === 'rev') requestAnimationFrame(() => root.querySelectorAll('.lb li').forEach((li, i) => li.style.setProperty('--d', i * 60 + 'ms')));
  }
  function lobby() {
    let qr = '';
    try { const g = qrcode(0, 'M'); g.addData(joinURL()); g.make(); qr = g.createSvgTag({ cellSize: 6, margin: 2, scalable: true }) } catch (e) { qr = '<p>تعذّر إنشاء الباركود</p>' }
    const fams = QG.FAMS;
    return `<section class="lobby">
      <div class="joincard"><h2>امسحوا الباركود بكاميرا الجوال</h2><div class="qr">${qr}</div>
        <div class="code"><span>أو ادخلوا بالرمز</span><b>${S.room}</b></div>
        <p class="url" dir="ltr">${U.esc(joinURL().replace(/^https?:\/\//, ''))}</p><button class="ghost sm" data-act="share">مشاركة رابط الدخول</button>
        ${location.protocol === 'file:' ? '<p class="warn">الملف مفتوح من جهازك، لذا لن تفتح الجوالات الرابط. ارفعه على رابط إنترنت أولًا (الطريقة في رسالة التسليم).</p>' : ''}
        <p class="netline ${S.net}">${netText()}</p></div>
      <div class="side">${play() ? '<h1 class="title sm">أنت المضيف</h1><p class="lead">انتظر حتى يدخل الجميع ثم اضغط «انطلق». ستلعب معهم من هذا الجوال.</p>' : '<h1 class="title">تحدّي<br>اللمّة</h1><p class="lead">كل واحد يجيب من جواله. جولات من ١٠ أسئلة منوعة، والأسرع يكسب نقاطًا أكثر.</p>'}
        <div class="plist" id="plist">${playersHTML()}</div>
        <details class="settings"><summary>إعدادات اللعبة</summary>
          <p class="lbl">أنواع الأسئلة</p><div class="chips">${Object.entries(fams).map(([k, f]) => `<button class="chip ${S.settings.fams[k] === false ? '' : 'on'}" data-fam="${k}">${f.ar}</button>`).join('')}</div>
          <p class="lbl">وقت الإجابة</p><div class="seg">${[[.75, 'سريع'], [1, 'عادي'], [1.5, 'مريح']].map(([v, l]) => `<button class="${S.settings.speed === v ? 'on' : ''}" data-speed="${v}">${l}</button>`).join('')}</div>
          <label class="tog"><input type="checkbox" data-set="sfx" ${S.settings.sfx ? 'checked' : ''}> المؤثرات الصوتية</label>
          <label class="tog"><input type="checkbox" data-set="tts" ${S.settings.tts ? 'checked' : ''}> قراءة الأسئلة بصوت (إن توفّر صوت عربي)</label>
          <label class="tog"><input type="checkbox" data-set="auto" ${S.settings.auto ? 'checked' : ''}> الانتقال التلقائي بين الأسئلة</label>
          <button class="linkbtn" data-act="resetused">تصفير الأسئلة المستخدمة (${U.ar(QG.usedCount())})</button>
        </details>
        <div class="golist"><button class="go" data-act="start" ${plist().length ? '' : 'disabled'}>${play() ? 'انطلق' : 'ابدأ اللعب'}</button><button class="linkbtn" data-act="bot">+ لاعب تجريبي (للتجربة)</button></div>
      </div></section>`;
  }
  function netText() { return ({ online: `متصل وجاهز لاستقبال اللاعبين (${S.nl > 2 ? 'عبر ' + U.ar(S.nl) + ' خوادم ربط' : S.nl === 2 ? 'عبر خادمَي ربط' : 'عبر خادم ربط واحد'})`, connecting: 'جارٍ الاتصال…', offline: 'انقطع الاتصال، نعيد المحاولة…', fail: 'تعذّر الاتصال بخوادم الربط. تأكد من الإنترنت ثم حدّث الصفحة.' })[S.net] || '' }
  function playersHTML() {
    const ps = plist();
    if (!ps.length) return `<p class="empty">بانتظار أول لاعب… كل من يمسح الباركود يظهر اسمه هنا.</p>`;
    return `<p class="count">${U.ar(ps.length)} ${ps.length === 1 ? 'لاعب' : ps.length === 2 ? 'لاعبان' : ps.length <= 10 ? 'لاعبين' : 'لاعبًا'} — اضغط على اسم لإزالته</p><div class="avs">${ps.map(p => p.id === S.me ? `<span class="pchip me"><i>${p.av}</i>${U.esc(p.name)} <small>المضيف</small></span>` : `<button class="pchip ${alive(p) ? '' : 'off'}" data-kick="${p.id}"><i>${p.av}</i>${U.esc(p.name)}${p.bot ? ' <small>تجريبي</small>' : ''}</button>`).join('')}</div>`;
  }
  function refreshPlayers() { const e = $('#plist'); if (e) e.innerHTML = playersHTML(); const g = $('[data-act="start"]'); if (g) g.disabled = !plist().length; if (S.phase === 'q') { const st = $('.strip'); if (st) st.innerHTML = stripHTML() } }
  function wireLobby() { }
  const stripHTML = () => { const ps = plist(); const n = Object.keys(S.ans).length; return `<span class="cnt">${U.ar(n)}/${U.ar(ps.length)} أجابوا</span>${ps.map(p => avatar(p, S.ans[p.id] ? 'in' : '')).join('')}` };
  function markIn(id) { if (bar) { const c = bar.querySelector('.cnt'); if (c) c.textContent = `أجاب ${U.ar(Object.keys(S.ans).length)} من ${U.ar(plist().length)}` } if (play()) return; const e = root.querySelector(`.strip .av[data-id="${id}"]`); if (e) e.classList.add('in'); const c = $('.strip .cnt'); if (c) c.textContent = `${U.ar(Object.keys(S.ans).length)}/${U.ar(plist().length)} أجابوا`; AU.sfx('tock') }

  function qScreen(rev) {
    const q = S.q, R = S.rev;
    const pre = !rev && q.pre > 0;
    let media = '';
    const mopt = {};
    if (rev && (q.input === 'tap')) mopt.mark = q.ans;
    if (q.media) {
      if (rev && q.after) media = renderMedia(q.media, mopt);
      else if (rev && q.media.k === 'diff' && q.input === 'tap') media = `<div class="diff"><figure><figcaption>الأصلية</figcaption>${sceneSVG(q.media.a)}</figure><figure><figcaption>المعدّلة</figcaption>${sceneSVG(q.media.b, { mark: q.ans })}</figure></div>`;
      else if (rev && q.media.k === 'diff' && q.marks) media = `<div class="diff"><figure><figcaption>الأصلية</figcaption>${sceneSVG(q.media.a)}</figure><figure><figcaption>المعدّلة</figcaption>${sceneSVG(q.media.b).replace('</svg>', q.marks.map(i => `<circle cx="${(i % 4) * 100 + 50}" cy="${Math.floor(i / 4) * 100 + 50}" r="46" fill="none" stroke="#F2545B" stroke-width="7"/>`).join('') + '</svg>')}</figure></div>`;
      else if (q.media.k === 'sound' && rev) media = '';
      else if (q.media.k === 'reflex' && rev) media = '';
      else media = renderMedia(q.media, mopt);
    }
    let answer = '';
    if (q.input === 'choice') answer = `<div class="opts n${q.opts.length} ${q.opts[0] && q.opts[0].tile ? 'tiles' : ''} ${pre ? 'hide' : ''} ${rev ? 'rev' : ''}">${q.opts.map((o, i) => `<div class="opt a${i} ${rev ? (i === q.ans ? 'right' : 'wrong') : ''}"><span class="sh">${SHAPE_SVG[ANS[i].s]}</span><span class="tx">${optHTML(o)}</span>${rev && R.counts ? `<b class="ct">${U.ar(R.counts[i])}</b>` : ''}</div>`).join('')}</div>`;
    else if (!rev) {
      const H = { num: 'اكتبوا الرقم في جوالاتكم', tap: 'اضغطوا على الجواب في صورة الجوال', order: 'رتّبوا العناصر في جوالاتكم بالضغط عليها بالترتيب', seq: 'أعيدوا التسلسل في جوالاتكم', reflex: 'جاهزين؟ اضغطوا في الجوال فور ظهور الأخضر' }[q.input];
      answer = `<p class="hint ${pre ? 'hide' : ''}">${H}</p>`;
      if (q.input === 'order') answer = `<div class="orderlist ${pre ? 'hide' : ''}">${q.opts.map(o => `<span>${U.esc(o)}</span>`).join('')}</div>` + answer;
    } else {
      if (q.input === 'num') answer = `<div class="bignum">${U.ar(q.ans)}</div><div class="guesses">${plist().filter(p => R.res[p.id]).map(p => `<span class="${R.res[p.id].c ? 'ok' : 'no'}">${p.av} ${U.esc(p.name)}: <b>${U.ar(R.res[p.id].a ?? '—')}</b></span>`).join('')}</div>`;
      if (q.input === 'order') answer = `<ol class="orderlist right">${q.ans.map(i => `<li>${U.esc(q.opts[i])}</li>`).join('')}</ol>`;
      if (q.input === 'seq') answer = `<div class="seqshow">${q.ans.map(p => `<span style="--c:${SIMON[p]}"></span>`).join('')}</div>`;
      if (q.input === 'reflex') { const rs = plist().filter(p => R.res[p.id]).sort((a, b) => (R.res[a.id].ms ?? 1e9) - (R.res[b.id].ms ?? 1e9)); answer = `<ol class="reflexrank">${rs.map(p => `<li>${p.av} ${U.esc(p.name)} <b>${R.res[p.id].c ? U.ar(R.res[p.id].ms) + ' ملّي ثانية' : 'ضغط مبكرًا!'}</b></li>`).join('') || '<li>لم يضغط أحد</li>'}</ol>` }
    }
    const top = `<div class="qtop"><span class="badge">${U.esc(q.cat)}</span>${q.golden ? '<span class="badge gold">×٢ ذهبي</span>' : ''}<h2 class="prompt">${U.esc(pre && q.after ? q.preText : q.prompt)}</h2>${!rev ? `<div class="ring"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" class="bg"/><circle cx="50" cy="50" r="45" class="fg"/></svg><b>${U.ar(Math.round(S.limitMs / 1000))}</b></div>` : ''}</div>`;
    const preBar = pre ? `<div class="prebar"><span>${U.esc(q.preText || '')}</span><i></i></div>` : '';
    const left = `<div class="qmain ${media ? 'hasmedia' : 'nomedia'} m-${q.media ? q.media.k : 'none'} in-${q.input}">${media ? `<div class="media">${media}</div>` : ''}<div class="ans">${preBar}${answer}</div></div>`;
    if (!rev) return `<section class="qs">${top}${left}<div class="strip">${stripHTML()}</div></section>`;
    const f = R.fastest && S.players[R.fastest];
    const banner = `<div class="fastbar">${f ? `<span class="bolt">الأسرع</span> ${f.av} <b>${U.esc(f.name)}</b> في ${U.ar(U.sec(R.res[f.id].ms))} ث` : Object.keys(R.res).length ? 'لم يُصب أحد هذه المرة!' : 'لم يُجب أحد'}${R.note ? `<span class="note">${U.esc(R.note)}</span>` : ''}</div>`;
    return `<section class="qs rev">${top}<div class="revgrid">${left}${leaderboard()}</div>${banner}</section>`;
  }
  function leaderboard() {
    const R = S.rev;
    return `<aside class="lb"><h3>الترتيب</h3><ol>${ranked().slice(0, 10).map((p, i) => { const r = R.res[p.id]; return `<li class="${r ? (r.c ? 'ok' : 'no') : 'na'}"><span class="rk">${U.ar(i + 1)}</span><i>${p.av}</i><span class="nm">${U.esc(p.name)}${r && r.mv > 0 ? '<s class="up">▲</s>' : ''}</span>${r && r.p ? `<span class="dl">+${U.ar(r.p)}${r.b ? ' 🔥' : ''}</span>` : ''}<b>${U.ar(p.score)}</b></li>` }).join('')}</ol></aside>`;
  }
  function podium(list, key) {
    const order = [1, 0, 2].filter(i => list[i]);
    return `<div class="podium">${order.map(i => `<div class="pod p${i + 1}"><div class="pav">${list[i].av}</div><div class="pnm">${U.esc(list[i].name)}</div><div class="block"><b>${U.ar(i + 1)}</b><span>${U.ar(list[i][key])}</span></div></div>`).join('')}</div>`;
  }
  function roundEndHTML() {
    const b = S.board;
    return `<section class="rend"><div class="rhead"><h1>انتهت الجولة ${U.ar(b.round)}</h1><p>أبطال هذه الجولة</p></div>${podium(b.rtop, 'rs')}
      <div class="rtable"><h3>المجموع العام</h3><ol>${b.all.map((p, i) => `<li><span class="rk">${U.ar(i + 1)}</span><i>${p.av}</i><span class="nm">${U.esc(p.name)}</span><span class="dl">+${U.ar(p.rs)}</span><b>${U.ar(p.score)}</b></li>`).join('')}</ol></div>
      <div class="actions"><button class="go" data-act="nextround">الجولة ${U.ar(b.round + 1)} ←</button><button class="ghost" data-act="end">إنهاء اللعبة وإعلان الفائز</button></div></section>`;
  }
  function finalHTML() {
    const b = S.board, w = b.all[0];
    return `<section class="final"><div class="crown">البطل</div>${w ? `<div class="champ"><span>${w.av}</span><h1>${U.esc(w.name)}</h1><p>${U.ar(w.score)} نقطة</p></div>` : ''}
      ${podium(b.all, 'score')}
      <div class="awards">${b.aw.filter(a => a.p).map(a => `<div class="aw"><h4>${a.t}</h4><p class="who">${a.p.av} ${U.esc(a.p.name)}</p><p class="v">${a.v}</p><small>${a.d}</small></div>`).join('')}</div>
      <div class="actions"><button class="go" data-act="again">لعبة جديدة بنفس اللاعبين</button></div></section>`;
  }
  function toast(t) { const box = $('#toasts'); if (!box) return; const e = document.createElement('div'); e.className = 'toast'; e.textContent = t; box.appendChild(e); setTimeout(() => e.remove(), 2600) }
  function confetti() {
    const c = document.createElement('div'); c.className = 'confetti'; const cols = ['#F2545B', '#2F80ED', '#27AE60', '#F7B500', '#8B5CF6'];
    c.innerHTML = Array.from({ length: 90 }, () => `<i style="left:${Math.random() * 100}%;background:${U.pick(cols)};animation-delay:${Math.random() * 1.6}s;animation-duration:${2.4 + Math.random() * 2}s;transform:rotate(${U.rint(0, 360)}deg)"></i>`).join('');
    document.body.appendChild(c); setTimeout(() => c.remove(), 6000);
  }

  /* ---------- controls ---------- */
  function onClick(e) {
    const t = e.target.closest('button,[data-kick]'); if (!t) return; AU.init();
    const a = t.dataset.act;
    if (t.dataset.kick) { const p = S.players[t.dataset.kick]; if (p && t.classList.contains('confirm')) { delete S.players[p.id]; S.ver++; publish(); refreshPlayers(); save() } else { root.querySelectorAll('.pchip.confirm').forEach(x => x.classList.remove('confirm')); t.classList.add('confirm'); t.dataset.label = t.innerHTML; t.innerHTML = 'إزالة ' + U.esc(p.name) + '؟' ; setTimeout(() => { if (t.isConnected && t.classList.contains('confirm')) { t.classList.remove('confirm'); t.innerHTML = t.dataset.label } }, 2500) } return }
    if (t.dataset.fam) { const k = t.dataset.fam; const on = S.settings.fams[k] !== false; const count = Object.keys(QG.FAMS).filter(f => S.settings.fams[f] !== false).length; if (on && count <= 1) return; S.settings.fams[k] = !on; t.classList.toggle('on', !on); save(); return }
    if (t.dataset.speed) { S.settings.speed = +t.dataset.speed; root.querySelectorAll('[data-speed]').forEach(b => b.classList.toggle('on', b === t)); save(); return }
    switch (a) {
      case 'start': startGame(); break;
      case 'bot': { const names = ['نورة', 'فيصل', 'ريم', 'عبدالله', 'لمى', 'سعود', 'جود', 'تركي']; const id = 'bot_' + U.uid(5); S.players[id] = { id, bot: true, name: U.pick(names), av: U.pick(AVATARS), score: 0, streak: 0, best: 0, correct: 0, answered: 0, fast: 0, rs: 0, seen: now() }; refreshPlayers(); AU.sfx('pop'); break }
      case 'next': nextQ(); break;
      case 'skip': endQ(); break;
      case 'nextround': nextRound(); break;
      case 'end': if (t.classList.contains('confirm')) finish(); else { t.classList.add('confirm'); t.textContent = 'متأكد؟ اضغط مرة أخرى'; setTimeout(() => { if (t.isConnected) { t.classList.remove('confirm'); t.textContent = t.dataset.act === 'end' && S.phase === 'rend' ? 'إنهاء اللعبة وإعلان الفائز' : 'إنهاء اللعبة' } }, 3000) } break;
      case 'again': toLobby(); break;
      case 'sfx': S.settings.sfx = !S.settings.sfx; AU.on = S.settings.sfx; t.textContent = S.settings.sfx ? 'صوت: يعمل' : 'صوت: مغلق'; save(); break;
      case 'auto': S.settings.auto = !S.settings.auto; t.textContent = S.settings.auto ? 'انتقال تلقائي' : 'انتقال يدوي'; if (S.settings.auto && S.phase === 'rev') later(2500, nextQ); save(); break;
      case 'fs': try { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen() } catch (e) { } break;
      case 'resetused': QG.resetUsed(); t.textContent = 'تم تصفير الأسئلة المستخدمة'; break;
      case 'share': { const u = joinURL(); if (navigator.share) navigator.share({ title: 'تحدّي اللمّة', text: 'ادخل لعبة تحدّي اللمّة (الرمز ' + S.room + ')', url: u }).catch(() => { }); else if (navigator.clipboard) navigator.clipboard.writeText(u).then(() => toast('تم نسخ رابط الدخول'), () => { }); break }
    }
  }
  function onChange(e) { const k = e.target.dataset.set; if (!k) return; S.settings[k] = e.target.checked; if (k === 'sfx') AU.on = e.target.checked; save() }
  function onKey(e) {
    if (e.target.tagName === 'INPUT') return;
    if (e.key === ' ' || e.key === 'Enter') { if (S.phase === 'rev') { e.preventDefault(); nextQ() } else if (S.phase === 'rend') { e.preventDefault(); nextRound() } }
    if (e.key === 'f' || e.key === 'F') onClick({ target: Object.assign(document.createElement('button'), { dataset: { act: 'fs' } }) });
  }

  function renderBar() {
    if (!bar) return; const ph = S.phase; let h = '';
    const end = `<button class="tb" data-act="end">إنهاء اللعبة</button>`;
    if (ph === 'lobby') h = '';
    else if (ph === 'intro' || ph === 'ready') h = `<span class="lbl">المضيف</span>${end}`;
    else if (ph === 'q') h = `<span class="cnt">أجاب ${U.ar(Object.keys(S.ans).length)} من ${U.ar(plist().length)}</span><button class="tb" data-act="skip">إنهاء السؤال</button>`;
    else if (ph === 'rev') h = `<button class="tb pri" data-act="next">التالي ←</button><button class="tb" data-act="auto">${S.settings.auto ? 'انتقال تلقائي' : 'انتقال يدوي'}</button>${end}`;
    else if (ph === 'rend') h = `<button class="tb pri" data-act="nextround">الجولة ${U.ar(S.round + 1)} ←</button>${end}`;
    else if (ph === 'final') h = `<button class="tb pri" data-act="again">لعبة جديدة</button>`;
    bar.innerHTML = h; bar.classList.toggle('hide', !h); document.body.classList.toggle('hasbar', !!h);
  }
  async function boot(resume, mode = 'board', me = null) {
    root = document.getElementById('app'); root.className = 'host';
    S.mode = mode;
    if (play()) { bar = document.createElement('div'); bar.id = 'hostbar'; bar.className = 'hostbar hide'; document.body.appendChild(bar); bar.addEventListener('click', onClick) }
    let tab = null; try { tab = sessionStorage.getItem('lamma_tab') } catch (e) { }
    const sv = (resume || tab) ? saved() : null;
    try { sessionStorage.setItem('lamma_tab', '1') } catch (e) { }
    if (sv && (sv.mode || 'board') !== mode) { /* different mode: start fresh */ }
    if (sv && (sv.mode || 'board') === mode) { S.room = sv.room; S.b = sv.b; S.players = sv.players; S.round = sv.round; S.settings = Object.assign(S.settings, sv.settings); if (play() && sv.me) me = me || { id: sv.me }; plist().forEach(p => p.seen = now()) }
    else S.room = U.uid(5).toUpperCase().replace(/[^A-Z0-9]/g, 'X');
    AU.on = S.settings.sfx;
    root.addEventListener('click', onClick); root.addEventListener('change', onChange); document.addEventListener('keydown', onKey);
    const wake = () => { try { navigator.wakeLock && document.visibilityState === 'visible' && navigator.wakeLock.request('screen').catch(() => { }) } catch (e) { } };
    wake(); document.addEventListener('visibilitychange', wake);
    S.phase = S.round ? 'rend' : 'lobby';
    if (S.phase === 'rend') S.board = boardData(false);
    if (play() && me) { S.me = me.id; const recv = Player.bootLocal(S.room, me, o => setTimeout(() => onMsg(o))); local = recv }
    render();
    net = new Net(S.room, 'host', onMsg, (st, n) => { const ch = st !== S.net || n !== S.nl; S.net = st; S.nl = n; const d = $('.net'); if (d) d.className = 'net ' + st; if (ch && S.phase === 'lobby') { const l = $('.netline'); if (l) { l.className = 'netline ' + st; l.textContent = netText() } } });
    const i = await net.connectAll();
    if (i >= 0) { const changed = i !== S.b; S.b = i; save(); if (S.phase === 'lobby' || changed) render() }
    let sig = '';
    setInterval(() => { publish(); if (S.phase === 'lobby') { const n = plist().map(p => p.id + alive(p)).join(); if (n !== sig) { sig = n; const e = $('#plist'); if (e) e.innerHTML = playersHTML() } } }, 3000);
  }
  return { boot, saved };
})();

/* Simon pads animation (host & phone) */
function simonShow(root, q, t0, local) {
  const step = q.media.step;
  q.media.seq.forEach((p, i) => {
    const at = 900 + i * step - (Date.now() - t0);
    if (at < -200) return;
    setTimeout(() => { const e = root.querySelector(`.simon [data-p="${p}"]`); if (e) { e.classList.add('lit'); setTimeout(() => e.classList.remove('lit'), 430) } }, Math.max(0, at));
  });
}
