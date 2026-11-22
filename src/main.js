/* ===== Entry ===== */
const HOST_PIN = '1234'; // رمز المضيف — غيّره هنا إن أردت
const pinOK = () => { try { return sessionStorage.getItem('lamma_pin') === HOST_PIN } catch (e) { return false } };
function askPin(then) {
  const root = document.getElementById('app');
  const box = document.createElement('div'); box.className = 'pinwrap';
  box.innerHTML = `<form class="pinbox pop"><b>رمز المضيف</b><span>شاشة المضيف للمسؤول عن اللعبة فقط</span><input inputmode="numeric" pattern="[0-9]*" maxlength="8" autocomplete="off" dir="ltr" aria-label="رمز المضيف"><p class="err"></p><div class="row"><button class="go sm" type="submit">دخول</button><button class="linkbtn" type="button" data-x>إلغاء</button></div></form>`;
  root.appendChild(box);
  const inp = box.querySelector('input'); setTimeout(() => inp.focus(), 50);
  box.querySelector('[data-x]').onclick = () => box.remove();
  box.querySelector('form').onsubmit = e => {
    e.preventDefault();
    if (inp.value.trim() === HOST_PIN) { try { sessionStorage.setItem('lamma_pin', HOST_PIN) } catch (er) { } box.remove(); then() }
    else { box.querySelector('.err').textContent = 'الرمز غير صحيح'; inp.value = ''; box.querySelector('form').classList.remove('shake'); void box.offsetWidth; box.querySelector('form').classList.add('shake') }
  };
}
function Landing() {
  const root = document.getElementById('app'); root.className = 'landing';
  const sv = Host.saved();
  root.innerHTML = `<section class="land">
    <div class="hero"><span class="logo big">لمّة</span><h1>تحدّي اللمّة</h1><p>لعبة أسئلة عائلية: شاشة واحدة تعرض الأسئلة، وكل واحد يجيب من جواله. ثقافة وألغاز وشعر وأعلام وخرائط وأصوات وسرعة بديهة، في جولات من عشرة أسئلة.</p>
      <ul class="how"><li><b>١</b>افتح «ابدأ لعبة» على التلفاز أو اللابتوب</li><li><b>٢</b>يمسح الجميع الباركود ويكتبون أسماءهم</li><li><b>٣</b>الأسرع في الإجابة الصحيحة يكسب نقاطًا أكثر</li></ul></div>
    <div class="cards">
      <button class="card hostc" data-go="host"><b>ابدأ لعبة جديدة (المضيف)</b><span>على الشاشة التي سيراها الجميع، وتحتاج رمز المضيف</span></button>
      ${sv ? `<button class="card" data-go="resume"><b>أكمل اللعبة السابقة</b><span>الرمز ${U.esc(sv.room)}، ${U.ar(Object.keys(sv.players).length)} لاعبين، بعد الجولة ${U.ar(sv.round)}</span></button>` : ''}
      <form class="card joinf"><b>انضم كلاعب</b><span>اكتب رمز الغرفة الظاهر على الشاشة</span><div class="row"><input id="code" maxlength="5" autocomplete="off" autocapitalize="characters" dir="ltr" placeholder="ABCDE"><button class="go sm">دخول</button></div></form>
    </div></section>`;
  const gate = f => () => { AU.init(); pinOK() ? f() : askPin(f) };
  root.querySelector('[data-go="host"]').onclick = gate(() => { history.replaceState(null, '', location.pathname + '?host' + (QS.get('broker') ? '&broker=' + encodeURIComponent(QS.get('broker')) : '')); Host.boot(false) });
  const r = root.querySelector('[data-go="resume"]'); if (r) r.onclick = gate(() => { history.replaceState(null, '', location.pathname + '?host' + (QS.get('broker') ? '&broker=' + encodeURIComponent(QS.get('broker')) : '')); Host.boot(true) });
  root.querySelector('.joinf').onsubmit = e => { e.preventDefault(); const c = root.querySelector('#code').value.trim().toUpperCase(); if (c.length >= 4) location.href = location.pathname + '?join=' + encodeURIComponent(c) + (QS.get('broker') ? '&broker=' + encodeURIComponent(QS.get('broker')) : '') };
}
(function () {
  const j = QS.get('join');
  if (j) Player.boot(j.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6), +QS.get('b') || 0);
  else if (QS.has('host') && pinOK()) Host.boot(!!Host.saved() && QS.has('resume'));
  else Landing();
})();
