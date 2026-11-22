/* ===== Realtime link between the main screen and phones (MQTT over secure WebSocket) ===== */
const QS = new URLSearchParams(location.search);
const BROKERS = QS.get('broker') ? [QS.get('broker')] : [
  'wss://broker.emqx.io:8084/mqtt',
  'wss://broker.hivemq.com:8884/mqtt',
  'wss://test.mosquitto.org:8081/mqtt'
];
const TOPIC = 'lamma-family-quiz/v1/';
class Net {
  constructor(room, side, onMsg, onStatus) { Object.assign(this, { room, side, onMsg, onStatus, c: null, idx: -1, ok: false }) }
  _try(i) {
    return new Promise(res => {
      let done = false; const url = BROKERS[i];
      let c;
      try { c = mqtt.connect(url, { clientId: 'lm_' + this.side[0] + '_' + U.uid(10), clean: true, connectTimeout: 7000, reconnectPeriod: 0, keepalive: 25, protocolVersion: 4 }) } catch (e) { return res(null) }
      const fail = () => { if (done) return; done = true; try { c.end(true) } catch (e) { } res(null) };
      const t = setTimeout(fail, 8000);
      c.on('connect', () => { if (done) return; done = true; clearTimeout(t); res(c) });
      c.on('error', fail);
      c.on('close', () => { if (!done) fail() });
    });
  }
  async connect(pref = 0) {
    const order = [pref, ...BROKERS.map((_, i) => i).filter(i => i !== pref)].filter(i => i < BROKERS.length);
    this.onStatus('connecting');
    for (const i of order) {
      const c = await this._try(i);
      if (c) { this._attach(c, i); return i }
      if (this.side === 'player' && this.lockBroker) break;
    }
    this.onStatus('fail'); return -1;
  }
  _attach(c, i) {
    this.c = c; this.idx = i; this.ok = true;
    c.options.reconnectPeriod = 1500;
    const inTopic = TOPIC + this.room + (this.side === 'host' ? '/p' : '/h');
    c.subscribe(inTopic, { qos: 1 });
    c.on('message', (t, buf) => { let m; try { m = JSON.parse(buf.toString()) } catch (e) { return } if (m && typeof m === 'object') this.onMsg(m) });
    c.on('connect', () => { this.ok = true; c.subscribe(inTopic, { qos: 1 }); this.onStatus('online') });
    c.on('offline', () => { this.ok = false; this.onStatus('offline') });
    c.on('reconnect', () => this.onStatus('connecting'));
    this.onStatus('online');
  }
  send(o) {
    if (!this.c) return;
    try { this.c.publish(TOPIC + this.room + (this.side === 'host' ? '/h' : '/p'), JSON.stringify(o), { qos: 1 }) } catch (e) { }
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
