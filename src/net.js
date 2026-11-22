/* ===== Realtime link between the main screen and phones (MQTT over secure WebSocket) ===== */
const QS = new URLSearchParams(location.search);
const BROKERS = QS.get('broker') ? QS.get('broker').split(',') : [
  'wss://mqtt.eclipseprojects.io:443/mqtt',
  'wss://broker.emqx.io:8084/mqtt',
  'wss://broker.hivemq.com:8884/mqtt',
  'wss://test.mosquitto.org:8081/mqtt'
];
const TOPIC = 'lamma-family-quiz/v1/';
/* Host listens and speaks on every relay it can reach; a phone uses one relay and
   moves to the next one if it does not hear the main screen. */
class Net {
  constructor(room, side, onMsg, onStatus) { Object.assign(this, { room, side, onMsg, onStatus, links: [], cur: null, heard: 0, since: 0, k: 0, busy: false }) }
  get inT() { return TOPIC + this.room + (this.side === 'host' ? '/p' : '/h') }
  get outT() { return TOPIC + this.room + (this.side === 'host' ? '/h' : '/p') }
  _try(i) {
    return new Promise(res => {
      let done = false, c;
      try { c = mqtt.connect(BROKERS[i], { clientId: 'lm_' + this.side[0] + '_' + U.uid(10), clean: true, connectTimeout: 7000, reconnectPeriod: 0, keepalive: 25, protocolVersion: 4 }) } catch (e) { return res(null) }
      const fail = () => { if (done) return; done = true; try { c.end(true) } catch (e) { } res(null) };
      const t = setTimeout(fail, 8000);
      c.on('connect', () => { if (done) return; done = true; clearTimeout(t); res(c) });
      c.on('error', fail);
      c.on('close', () => { if (!done) fail() });
    });
  }
  _wire(c) {
    c.options.reconnectPeriod = 2000;
    c.subscribe(this.inT, { qos: 1 });
    c.on('message', (t, buf) => { let m; try { m = JSON.parse(buf.toString()) } catch (e) { return } if (m && typeof m === 'object') { const first = Date.now() - this.heard > 15000; this.heard = Date.now(); if (first) this._st(); this.onMsg(m) } });
    c.on('connect', () => { c.subscribe(this.inT, { qos: 1 }); this._st() });
    c.on('offline', () => this._st()); c.on('close', () => this._st());
  }
  _st() {
    if (this.side === 'host') { const n = this.links.filter(l => l.c.connected).length; this.onStatus(n ? 'online' : 'offline', n); return }
    const ok = this.cur && this.cur.c.connected;
    this.onStatus(!ok ? 'connecting' : Date.now() - this.heard < 15000 ? 'online' : 'searching');
  }
  /* host: every relay in parallel; resolves with the first one that answers */
  connectAll() {
    this.onStatus('connecting', 0);
    return new Promise(res => {
      let left = BROKERS.length, first = -1;
      BROKERS.forEach((_, i) => this._try(i).then(c => {
        left--;
        if (c) { this.links.push({ c, i }); this._wire(c); this._st(); if (first < 0) { first = i; res(i) } }
        if (!left && first < 0) { this.onStatus('fail', 0); res(-1) }
      }));
      setInterval(() => this._st(), 4000);
    });
  }
  /* phone: one relay at a time, rotate while the main screen is silent */
  async connect(pref = 0) {
    this.order = [pref, ...BROKERS.map((_, i) => i).filter(i => i !== pref)].filter(i => i < BROKERS.length);
    this.k = 0; await this._next();
    setInterval(() => this._watch(), 1500);
  }
  async _next() {
    if (this.busy) return; this.busy = true;
    if (this.cur) { try { this.cur.c.end(true) } catch (e) { } this.cur = null }
    this.onStatus('connecting');
    for (let n = 0; n < this.order.length; n++) {
      const i = this.order[this.k % this.order.length];
      const c = await this._try(i);
      if (c) { this.cur = { c, i }; this.since = Date.now(); this._wire(c); this.busy = false; this._st(); this.onLink && this.onLink(); return }
      this.k++;
    }
    this.busy = false; this.onStatus('fail');
    setTimeout(() => this._next(), 4000);
  }
  _watch() {
    this._st();
    if (!this.cur || this.busy) return;
    const quiet = Date.now() - Math.max(this.heard, this.since);
    if (quiet > (this.heard ? 16000 : 7000)) { this.k++; this.heard = 0; this._next() }
  }
  send(o) {
    const s = JSON.stringify(o);
    if (this.side === 'host') { this.links.forEach(l => { if (l.c.connected) try { l.c.publish(this.outT, s, { qos: 1 }) } catch (e) { } }); return }
    if (this.cur && this.cur.c.connected) try { this.cur.c.publish(this.outT, s, { qos: 1 }) } catch (e) { }
  }
}

/* ===== Sound: game effects, beeps, tones ===== */
const AU = {
  ctx: null, on: true,
  init() { try { if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)(); if (this.ctx.state === 'suspended') this.ctx.resume() } catch (e) { } },
  tone(f, t0, d, type = 'sine', v = .22, f2) {
    if (!this.ctx) return; const c = this.ctx, o = c.createOscillator(), g = c.createGain(), t = c.currentTime + t0;
    o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + .012); g.gain.setValueAtTime(v, t + Math.max(.013, d - .03)); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + d + .02);
  },
  sfx(n) {
    if (!this.on || !this.ctx) return;
    const T = (...a) => this.tone(...a);
    switch (n) {
      case 'pop': T(660, 0, .08, 'triangle', .2); T(990, .07, .1, 'triangle', .18); break;
      case 'tick': T(1200, 0, .04, 'square', .05); break;
      case 'tock': T(700, 0, .06, 'square', .08); break;
      case 'go': T(523, 0, .1, 'triangle'); T(784, .1, .16, 'triangle'); break;
      case 'ok': [523, 659, 784, 1046].forEach((f, i) => T(f, i * .07, .14, 'triangle', .2)); break;
      case 'bad': T(220, 0, .28, 'sawtooth', .12, 150); break;
      case 'reveal': T(392, 0, .1, 'triangle'); T(523, .09, .1, 'triangle'); T(659, .18, .22, 'triangle'); break;
      case 'fanfare': [392, 523, 659, 784, 659, 784, 1046].forEach((f, i) => T(f, i * .12, .2, 'triangle', .2)); break;
      case 'gold': [784, 988, 1175, 1568].forEach((f, i) => T(f, i * .09, .25, 'sine', .18)); break;
      case 'whoosh': T(300, 0, .3, 'sawtooth', .05, 1400); break;
    }
  },
  play(sound, onLabel) {
    if (!this.ctx || !sound) return;
    if (sound.k === 'beeps') sound.s.forEach(b => this.tone(b.f, .5 + b.t, b.d, 'square', .13));
    if (sound.k === 'tones') sound.s.forEach(b => { this.tone(b.f, .5 + b.t, b.d, 'sine', .3); setTimeout(() => onLabel && onLabel(b.lbl), (500 + b.t * 1000)) });
    if (sound.k === 'simon') sound.s.forEach((p, i) => { const at = .9 + i * sound.step / 1000; this.tone(SIMON_F[p], at, .42, 'triangle', .26) });
  }
};
