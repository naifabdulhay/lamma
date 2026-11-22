/* ===== Phone (player) ===== */
const Player = (() => {
  const LSK = 'lamma_me_v1';
  let me = {}; try { me = JSON.parse(localStorage.getItem(LSK) || '{}') } catch (e) { }
  const saveMe = () => { try { localStorage.setItem(LSK, JSON.stringify(me)) } catch (e) { } };
  let isLocal = false, net, root, room, bIdx = 0, st = null, joined = false, joinT = 0, key = '', q = null, qT0 = 0, my = null, raf = 0, preDone = false, orderSel = [], seqSel = [], numVal = '', netState = 'connecting', reflexGreen = false;
  const $ = s => root.querySelector(s);
  const pnow = () => performance.now();

  function boot(code, b) {
    root = document.getElementById('app'); root.className = 'phone';
    room = code; bIdx = b;
    root.addEventListener('click', onClick);
    root.addEventListener('pointerdown', onDown, { passive: false });
    if (me.room === room && me.name && me.id) { startNet(); renderWait() }
    else renderJoin();
  }
  function hostJoin(onDone) {
    root = document.getElementById('app'); root.className = 'phone';
    const av = me.av || U.pick(AVATARS);
    root.innerHTML = `<section class="join"><div class="brand"><span class="logo">لمّة</span><span>تحدّي العائلة</span></div>
      <h1>أنت المضيف</h1><p>ستلعب مع العائلة من هذا الجوال، وتبدأ اللعبة متى اكتمل الجميع.</p>
      <form id="jf"><label>اسمك<input id="nm" maxlength="16" autocomplete="nickname" placeholder="مثلًا: أبو محمد" value="${U.esc(me.name || '')}" required></label>
      <p class="lbl">اختر شخصيتك</p><div class="avpick">${AVATARS.map(a => `<button type="button" class="${a === av ? 'on' : ''}" data-av="${a}">${a}</button>`).join('')}</div>
      <button class="go" type="submit">أنشئ اللعبة</button></form></section>`;
    me.av = av;
    root.querySelectorAll('.avpick button').forEach(b => b.onclick = () => { root.querySelectorAll('.avpick button').forEach(x => x.classList.toggle('on', x === b)); me.av = b.dataset.av });
    $('#jf').addEventListener('submit', e => { e.preventDefault(); AU.init(); const n = $('#nm').value.replace(/\s+/g, ' ').trim(); if (!n) return; me = { ...me, name: n.slice(0, 16), id: me.id || ('p' + U.uid(11)) }; saveMe(); onDone({ id: me.id, name: me.name, av: me.av }) });
  }
  function bootLocal(code, meIn, send) {
    root = document.getElementById('app'); room = code; isLocal = true;
    if (meIn.name) me = { ...me, ...meIn };
    else if (me.id !== meIn.id) me = { id: meIn.id, name: 'المضيف', av: AVATARS[0] };
    me.room = room; saveMe();
    root.addEventListener('click', onClick); root.addEventListener('pointerdown', onDown, { passive: false });
    net = { send }; netState = 'online';
    sendJoin(); clearInterval(joinT);
    joinT = setInterval(() => { if (!joined) sendJoin(); else net.send({ t: 'hi', id: me.id }) }, 2500);
    return onMsg;
  }
  function renderJoin(err) {
    const av = me.av || U.pick(AVATARS);
    root.innerHTML = `<section class="join"><div class="brand"><span class="logo">لمّة</span><span>تحدّي العائلة</span></div>
      <h1>أهلًا بك!</h1><p>رمز الغرفة <b dir="ltr">${U.esc(room)}</b></p>
      <form id="jf"><label>اسمك<input id="nm" maxlength="16" autocomplete="nickname" placeholder="مثلًا: سارة" value="${U.esc(me.name || '')}" required></label>
      <p class="lbl">اختر شخصيتك</p><div class="avpick">${AVATARS.map(a => `<button type="button" class="${a === av ? 'on' : ''}" data-av="${a}">${a}</button>`).join('')}</div>
      ${err ? `<p class="err">${err}</p>` : ''}<button class="go" type="submit">ادخل اللعبة</button></form></section>`;
    me.av = av;
    $('#jf').addEventListener('submit', e => { e.preventDefault(); AU.init(); const n = $('#nm').value.replace(/\s+/g, ' ').trim(); if (!n) return; me = { ...me, name: n.slice(0, 16), room, id: me.id || ('p' + U.uid(11)) }; saveMe(); joined = false; startNet(); renderWait() });
  }
  function startNet() {
    if (net) { sendJoin(); return }
    net = new Net(room, 'player', onMsg, s => { const was = netState; netState = s; const d = $('.dot'); if (d) d.className = 'dot ' + s; if (s === 'fail' && !st) renderFail(); if (s !== was && !joined) { const w = $('.wait p'); if (w) w.textContent = waitText() } });
    net.onLink = sendJoin;
    net.connect(bIdx);
    clearInterval(joinT);
    joinT = setInterval(() => { if (!joined) sendJoin(); else net.send({ t: 'hi', id: me.id }) }, 2500);
  }
  const sendJoin = () => net && net.send({ t: 'join', id: me.id, name: me.name, av: me.av });
  function renderFail() { root.innerHTML = `<section class="center"><h2>تعذّر الاتصال</h2><p>تأكد من اتصال الجوال بالإنترنت ثم أعد المحاولة.</p><button class="go" onclick="location.reload()">إعادة المحاولة</button></section>` }
  function bar() {
    const mine = st && st.ps ? st.ps.findIndex(p => p.id === me.id) : -1; const sc = mine >= 0 ? st.ps[mine].score : 0;
    return `<header class="pbar"><span class="me"><i>${me.av}</i>${U.esc(me.name)}</span><span class="sc">${U.ar(sc)} <small>نقطة</small></span><span class="dot ${netState}"></span></header>`;
  }
  function waitText() { if (joined) return 'بانتظار المضيف ليبدأ. أبقِ الصفحة مفتوحة.'; if (netState === 'searching') return `نبحث عن الشاشة الرئيسية (الرمز ${room})… تأكد أن صفحة المضيف مفتوحة.`; if (netState === 'fail') return 'تعذّر الاتصال. تأكد من الإنترنت.'; return 'جارٍ الاتصال بالشاشة الرئيسية…' }
  function renderWait(msg) {
    const ps = st && st.ps ? st.ps : [];
    root.innerHTML = bar() + `<section class="center wait"><div class="bigav">${me.av}</div><h2>${joined ? 'أنت داخل اللعبة!' : 'جارٍ الدخول…'}</h2><p>${msg || waitText()}</p>${ps.length ? `<div class="mini">${ps.map(p => `<span>${p.av} ${U.esc(p.name)}</span>`).join('')}</div>` : ''}${isLocal ? '' : '<button class="linkbtn" data-act="rename">تغيير الاسم أو الشخصية</button>'}</section>`;
  }

  function onMsg(m) {
    if (m.t !== 'st') return;
    st = m;
    const inList = (m.ps || []).some(p => p.id === me.id);
    if (inList && !joined) { joined = true; AU.sfx('pop') }
    if (!inList && joined && m.ph === 'lobby') { joined = false }
    let k = (joined ? 'J' : 'N') + m.ph;
    if (m.ph === 'ready' || m.ph === 'q') k += m.q.id;
    if (m.ph === 'rev') k += m.rev.qid;
    if (m.ph === 'rend' || m.ph === 'final') k += m.r;
    if (m.ph === 'lobby') k += joined + ':' + (m.ps || []).length;
    if (k !== key) { key = k; draw(m) }
    else if (m.ph === 'q') {
      if (my && !(m.got || []).includes(me.id)) net.send({ t: 'ans', id: me.id, qid: q.id, a: my.a, ms: my.ms });
      const sc = $('.pbar .sc'); if (sc) { const p = m.ps.find(p => p.id === me.id); if (p) sc.innerHTML = `${U.ar(p.score)} <small>نقطة</small>` }
    }
  }
  function draw(m) {
    cancelAnimationFrame(raf);
    const ph = m.ph;
    if (isLocal) { if (ph === 'lobby') return; root.className = 'phone' }
    if (ph === 'lobby') return renderWait();
    if (!joined) return renderWait('اللعبة بدأت، ستدخل مع السؤال القادم…');
    if (ph === 'intro') { root.innerHTML = bar() + `<section class="center intro"><p>استعد لـ</p><h1>الجولة ${U.ar(m.r)}</h1><p>١٠ أسئلة منوعة</p></section>`; return }
    if (ph === 'ready') { root.innerHTML = bar() + `<section class="center ready ${m.q.golden ? 'gold' : ''}"><div class="qnum">${U.ar(m.n)}</div><p>${m.q.golden ? 'السؤال الذهبي، نقاط مضاعفة' : 'السؤال التالي'}</p><div class="badge big">${U.esc(m.q.cat)}</div></section>`; navigator.vibrate && navigator.vibrate(30); return }
    if (ph === 'q') return startQ(m);
    if (ph === 'rev') return renderRev(m);
    if (ph === 'rend' || ph === 'final') return renderBoard(m);
  }

  /* ---------- question ---------- */
  function startQ(m) {
    q = m.q; qT0 = pnow() - (m.el || 0); my = null; preDone = !q.pre; orderSel = []; seqSel = []; numVal = ''; reflexGreen = false;
    const showMedia = q.media && !['sound', 'reflex'].includes(q.media.k);
    let media = '';
    if (showMedia) {
      if (q.media.k === 'diff') media = renderMedia(q.media, { tap: q.input === 'tap' });
      else media = renderMedia(q.media, { tap: q.input === 'tap', player: 1 });
    } else if (q.media && q.media.k === 'sound') media = renderMedia(q.media, { player: 1, snd: q.snd });
    root.innerHTML = bar() + `<section class="pq in-${q.input} m-${q.media ? q.media.k : 'none'}">
      <div class="qhead"><span class="badge">${U.esc(q.cat)}</span>${q.golden ? '<span class="badge gold">×٢</span>' : ''}<span class="qn">${U.ar(m.n)}/${U.ar(m.of)}</span></div>
      <div class="tbar"><i></i></div>
      <h2 class="prompt">${U.esc(q.pre && q.after ? q.preText : q.prompt)}</h2>
      ${media ? `<div class="pmedia">${media}</div>` : ''}
      ${q.pre ? `<p class="prenote">${U.esc(q.preText || '')}</p>` : ''}
      <div class="pin ${q.pre ? 'hide' : ''}">${inputHTML()}</div>
      <div class="sent hide"></div></section>`;
    if (q.input === 'seq') simonShow(root, q, Date.now() - (pnow() - qT0));
    if (q.snd && q.sound) { AU.init(); AU.on = true; AU.play(q.sound, i => { const e = root.querySelector(`.tonelbl [data-t="${i}"]`); if (e) { e.classList.add('on'); setTimeout(() => e.classList.remove('on'), 520) } }, (m.el || 0) / 1000) }
    loop();
  }
  function inputHTML() {
    switch (q.input) {
      case 'choice': return `<div class="popts n${q.opts.length}">${q.opts.map((o, i) => `<button class="popt a${i}" data-ch="${i}"><span class="sh">${SHAPE_SVG[ANS[i].s]}</span><span class="tx">${optHTML(o)}</span></button>`).join('')}</div>`;
      case 'num': return `<div class="numbox"><output id="nv">‎</output><div class="pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button data-num="${n}">${U.ar(n)}</button>`).join('')}<button data-num="del" class="fn">⌫</button><button data-num="0">${U.ar(0)}</button><button data-num="ok" class="fn ok">إرسال</button></div></div>`;
      case 'order': return `<div class="porder">${q.opts.map((o, i) => `<button data-ord="${i}"><b></b>${U.esc(o)}</button>`).join('')}</div><button class="linkbtn" data-act="ordreset">مسح الترتيب</button>`;
      case 'seq': return `<div class="dots">${Array.from({ length: q.n }, () => '<i></i>').join('')}</div><div class="simon pads">${SIMON.map((c, i) => `<button data-pad="${i}" style="--c:${c}"></button>`).join('')}</div>`;
      case 'reflex': return `<button class="rpad" data-rf="1"><span>انتظر الأخضر…</span></button>`;
      case 'tap': return `<p class="taphint">اضغط على الصورة في المكان الصحيح</p>`;
    }
    return '';
  }
  function loop() {
    const el = pnow() - qT0;
    if (!preDone && el >= q.pre) {
      preDone = true;
      if (q.after) { const pm = $('.pmedia'); if (pm) pm.innerHTML = renderMedia(q.after); const pr = $('.pq .prompt'); if (pr) pr.textContent = q.prompt }
      $('.pin')?.classList.remove('hide'); $('.prenote')?.remove();
      if (q.input === 'seq') { const s = $('.pmedia'); if (s) s.remove() }
      navigator.vibrate && navigator.vibrate(25);
    }
    if (q.input === 'reflex' && !reflexGreen && el >= q.d && !my) { reflexGreen = pnow(); const p = $('.rpad'); if (p) { p.classList.add('go'); p.querySelector('span').textContent = 'اضغط الآن!' } }
    const lim = st && st.lim ? st.lim : q.time * 1000;
    const tb = $('.tbar i'); if (tb) tb.style.width = (el < q.pre ? 100 : 100 * U.clamp(1 - (el - q.pre) / lim, 0, 1)) + '%';
    raf = requestAnimationFrame(loop);
  }
  function submit(a, ms) {
    if (my || !q) return;
    my = { a, ms: Math.max(0, Math.round(ms)) };
    net.send({ t: 'ans', id: me.id, qid: q.id, a, ms: my.ms });
    AU.sfx('tock'); navigator.vibrate && navigator.vibrate(15);
    const s = $('.sent'); if (s) { s.classList.remove('hide'); s.innerHTML = q.input === 'reflex' ? (a < 0 ? '<b>ضغطت مبكرًا!</b><span>انتظر النتيجة…</span>' : `<b>${U.ar(a)} ملّي ثانية</b><span>انتظر النتيجة…</span>`) : `<b>تم إرسال إجابتك</b><span>في ${U.ar(U.sec(my.ms))} ثانية، انتظر البقية</span>` }
    root.querySelector('.pq')?.classList.add('done');
  }
  const answerMs = () => pnow() - qT0 - q.pre;
  function onDown(e) {
    const t = e.target.closest('[data-rf],[data-pad],[data-i],[data-ch]');
    if (!t || !q || my || !preDone) return;
    if (t.dataset.rf) { e.preventDefault(); if (!reflexGreen) { submit(-1, 0); t.classList.add('early'); t.querySelector('span').textContent = 'مبكر جدًا!' } else submit(Math.round(pnow() - reflexGreen), answerMs()); return }
    if (t.dataset.pad != null && q.input === 'seq') { e.preventDefault(); const i = +t.dataset.pad; seqSel.push(i); t.classList.add('lit'); setTimeout(() => t.classList.remove('lit'), 180); AU.init(); AU.tone(SIMON_F[i], 0, .18, 'triangle', .2); const d = root.querySelectorAll('.dots i'); if (d[seqSel.length - 1]) { d[seqSel.length - 1].style.background = SIMON[i] } if (seqSel.length >= q.n) submit(seqSel.slice(), answerMs()); return }
    if (t.dataset.i != null && q.input === 'tap') { e.preventDefault(); t.classList.add('tapped'); submit(+t.dataset.i, answerMs()); return }
    if (t.dataset.ch != null && q.input === 'choice') { e.preventDefault(); t.classList.add('picked'); root.querySelectorAll('.popt').forEach(b => b !== t && b.classList.add('dim')); submit(+t.dataset.ch, answerMs()); return }
  }
  function onClick(e) {
    const t = e.target.closest('button'); if (!t) return; AU.init();
    if (t.dataset.av) { root.querySelectorAll('.avpick button').forEach(b => b.classList.toggle('on', b === t)); me.av = t.dataset.av; return }
    if (t.dataset.act === 'rename') { joined = false; renderJoin(); return }
    if (!q || my || !preDone) return;
    if (t.dataset.num) {
      const v = t.dataset.num;
      if (v === 'del') numVal = numVal.slice(0, -1);
      else if (v === 'ok') { if (numVal !== '') submit(+numVal, answerMs()); return }
      else if (numVal.length < 6) numVal = (numVal === '0' ? '' : numVal) + v;
      const o = $('#nv'); if (o) o.textContent = numVal === '' ? '‎' : U.ar(numVal); return;
    }
    if (t.dataset.ord != null) {
      const i = +t.dataset.ord; if (orderSel.includes(i)) return; orderSel.push(i); t.classList.add('on'); t.querySelector('b').textContent = U.ar(orderSel.length);
      if (orderSel.length === q.opts.length) submit(orderSel.slice(), answerMs()); return;
    }
    if (t.dataset.act === 'ordreset') { orderSel = []; root.querySelectorAll('.porder button').forEach(b => { b.classList.remove('on'); b.querySelector('b').textContent = '' }) }
  }

  /* ---------- reveal & boards ---------- */
  function renderRev(m) {
    const R = m.rev, r = R.res[me.id];
    const rank = m.ps.findIndex(p => p.id === me.id) + 1, mine = m.ps[rank - 1];
    let cls = 'na', head = 'لم تُجب', sub = '';
    if (r && r.c) { cls = 'ok'; head = R.input === 'reflex' ? `${U.ar(r.ms)} ملّي ثانية!` : 'إجابة صحيحة!'; AU.sfx('ok'); navigator.vibrate && navigator.vibrate([40, 40, 40]) }
    else if (r) { cls = 'no'; head = R.input === 'reflex' ? 'ضغطت مبكرًا!' : 'إجابة خاطئة'; AU.sfx('bad'); navigator.vibrate && navigator.vibrate(200) }
    let right = '';
    if (q && q.id === R.qid && R.input !== 'reflex') {
      if (R.input === 'choice') right = `<div class="rightans"><span>الإجابة الصحيحة</span><div class="popt a${R.ans} picked"><span class="sh">${SHAPE_SVG[ANS[R.ans].s]}</span><span class="tx">${optHTML(q.opts[R.ans])}</span></div></div>`;
      if (R.input === 'num') right = `<div class="rightans"><span>الإجابة الصحيحة</span><b class="bign">${U.ar(R.ans)}</b></div>`;
      if (R.input === 'order') right = `<div class="rightans"><span>الترتيب الصحيح</span><ol>${R.ans.map(i => `<li>${U.esc(q.opts[i])}</li>`).join('')}</ol></div>`;
      if (R.input === 'seq') right = `<div class="rightans"><span>التسلسل الصحيح</span><div class="seqshow">${R.ans.map(p => `<span style="--c:${SIMON[p]}"></span>`).join('')}</div></div>`;
      if (R.input === 'tap') right = `<div class="rightans"><span>مكان الإجابة</span>${q.media.k === 'diff' ? sceneSVG(q.media.b, { mark: R.ans }) : renderMedia(q.media, { mark: R.ans })}</div>`;
    }
    root.innerHTML = bar() + `<section class="prev ${cls}"><div class="verdict"><h1>${head}</h1>${r && r.p ? `<p class="pts">+${U.ar(r.p)}${R.golden ? ' <small>(ذهبي ×٢)</small>' : ''}</p>` : ''}${r && r.b ? `<p class="streak">سلسلة ${U.ar(r.st)} إجابات! +${U.ar(100)}</p>` : ''}${R.fastest === me.id ? '<p class="fast">أنت الأسرع!</p>' : ''}</div>
      ${right}${R.note ? `<p class="note">${U.esc(R.note)}</p>` : ''}
      <div class="myrank"><span>مركزك</span><b>${U.ar(rank)}</b><span>من ${U.ar(m.ps.length)}، ${U.ar(mine ? mine.score : 0)} نقطة</span></div>
      ${R.fastest && R.fastest !== me.id && m.ps.find(p => p.id === R.fastest) ? `<p class="fastline">الأسرع: ${m.ps.find(p => p.id === R.fastest).av} ${U.esc(m.ps.find(p => p.id === R.fastest).name)}</p>` : ''}
      <ol class="ptable top5">${m.ps.slice(0, 5).map((p, i) => `<li class="${p.id === me.id ? 'me' : ''}"><span>${U.ar(i + 1)}</span><i>${p.av}</i><em>${U.esc(p.name)}</em>${R.res[p.id] && R.res[p.id].p ? `<small>+${U.ar(R.res[p.id].p)}</small>` : ''}<b>${U.ar(p.score)}</b></li>`).join('')}</ol></section>`;
  }
  function renderBoard(m) {
    const b = m.board; const rank = b.all.findIndex(p => p.id === me.id) + 1;
    const fin = m.ph === 'final', w = b.all[0];
    if (fin) { AU.sfx('fanfare'); navigator.vibrate && navigator.vibrate([60, 60, 60, 60, 200]) }
    root.innerHTML = bar() + `<section class="center board ${fin ? 'final' : ''}">
      <p>${fin ? 'انتهت اللعبة' : `انتهت الجولة ${U.ar(b.round)}`}</p>
      ${fin && w ? `<div class="champ"><span>${w.av}</span><h1>${w.id === me.id ? 'أنت البطل!' : U.esc(w.name)}</h1><p>${w.id === me.id ? 'مبروك!' : 'بطل اللعبة'}</p></div>` : `<h1>مركزك ${U.ar(rank)}</h1>`}
      <ol class="ptable">${b.all.slice(0, 8).map((p, i) => `<li class="${p.id === me.id ? 'me' : ''}"><span>${U.ar(i + 1)}</span><i>${p.av}</i><em>${U.esc(p.name)}</em><b>${U.ar(p.score)}</b></li>`).join('')}</ol>
      <p class="sub">${fin ? 'شكرًا للعب!' : 'بانتظار المضيف لبدء الجولة التالية…'}</p></section>`;
  }
  return { boot, bootLocal, hostJoin };
})();
