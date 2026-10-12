'use strict';

/* ============================================================
   JIKA KITA TAK PERNAH JATUH CINTA 💔 — Game Engine 12 Babak
   Vintage Romantic Night · pola sama dgn samudra-rasa/rahasia-hati
   ============================================================ */

const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => a + Math.random() * (b - a);
const SCENE_KEY = 'jkjtc-scene';
const LETTER_KEY = 'jkjtc-letter';

/* ---------------- STATE ---------------- */
function defaultState() {
  return {
    currentScene: 1,
    totalScenes: 12,
    musicMuted: false,
    audioUnlocked: false,
    /* 1 */ envelopeOpen: false,
    /* 2 */ clockTaps: 0,
    /* 3 */ chatShown: 0,
    /* 4 */ holdProgress: 0,
    /* 5 */ rainCaught: 0,
    /* 6 */ trashCount: 0,
    /* 7 */ heartTaps: 0,
    /* 8 */ flowerTaps: 0,
    /* 9 */ starStep: 0,
    /* 10 */ umbrellaDone: false,
    /* 11 */ letterDone: false,
    /* 12 */ finaleLaunched: false
  };
}
let STATE = defaultState();

/* ---------------- Toast & haptic & floaters ---------------- */
let toastTimer = null;
function showToast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
}
function vibrate(p) { if (navigator.vibrate) { try { navigator.vibrate(p); } catch (e) {} } }

function spawnFloaters(n, chars) {
  const pool = chars || ['💔', '🌹', '✨', '💌', '💛'];
  for (let i = 0; i < n; i++) {
    const el = document.createElement('div');
    el.className = 'float-heart';
    el.textContent = pool[Math.floor(Math.random() * pool.length)];
    el.style.left = rand(8, 88) + 'vw';
    el.style.top = rand(55, 88) + 'vh';
    el.style.animationDelay = (i * 90) + 'ms';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3200);
  }
}

/* ============================================================
   SOUND ENGINE — Web Audio API (musik mp3 + sfx sintetis)
   ============================================================ */
const A = {
  ctx: null, master: null, noiseBuf: null,
  synthOn: false, schedTimer: null, step: 0, nextTime: 0,
  bg: null, mp3Ok: false, mp3Failed: false
};

function ensureAudio() {
  if (A.ctx) { if (A.ctx.state === 'suspended') A.ctx.resume(); return A.ctx; }
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  A.ctx = new Ctx();
  A.master = A.ctx.createGain();
  A.master.gain.value = 0.7;
  /* gentle high-shelf biar jernih, bukan “becek” */
  A.tone = A.ctx.createBiquadFilter();
  A.tone.type = 'highshelf';
  A.tone.frequency.value = 1800;
  A.tone.gain.value = 4;
  A.master.connect(A.tone);
  A.tone.connect(A.ctx.destination);
  const len = A.ctx.sampleRate * 1.2;
  A.noiseBuf = A.ctx.createBuffer(1, len, A.ctx.sampleRate);
  const d = A.noiseBuf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return A.ctx;
}

/* ---- SFX ---- */
function sfxChime() {
  const ctx = ensureAudio(); if (!ctx) return;
  const t = ctx.currentTime;
  [1318.5, 1661.2, 1975.5].forEach((f, i) => {
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t + i * 0.07);
    g.gain.exponentialRampToValueAtTime(0.18, t + i * 0.07 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.07 + 0.5);
    o.connect(g); g.connect(A.master);
    o.start(t + i * 0.07); o.stop(t + i * 0.07 + 0.55);
  });
}
function sfxTap() {
  const ctx = ensureAudio(); if (!ctx) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator(); o.type = 'triangle';
  o.frequency.setValueAtTime(520, t);
  o.frequency.exponentialRampToValueAtTime(340, t + 0.08);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.14, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
  o.connect(g); g.connect(A.master);
  o.start(t); o.stop(t + 0.12);
}
function sfxPop() {
  const ctx = ensureAudio(); if (!ctx) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator(); o.type = 'sine';
  o.frequency.setValueAtTime(300, t);
  o.frequency.exponentialRampToValueAtTime(720, t + 0.09);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.2, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
  o.connect(g); g.connect(A.master);
  o.start(t); o.stop(t + 0.16);
}
function sfxSoftRain() {
  const ctx = ensureAudio(); if (!ctx || !A.noiseBuf) return;
  const t = ctx.currentTime;
  const src = ctx.createBufferSource(); src.buffer = A.noiseBuf; src.loop = true;
  const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1600; f.Q.value = 0.6;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.07, t + 0.3);
  g.gain.linearRampToValueAtTime(0.0001, t + 1.1);
  src.connect(f); f.connect(g); g.connect(A.master);
  src.start(t); src.stop(t + 1.2);
}
function sfxBell() {
  const ctx = ensureAudio(); if (!ctx) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = 880;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.22, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
  o.connect(g); g.connect(A.master);
  o.start(t); o.stop(t + 1);
}

/* ---- Loop synth piano romantis: bass + arpeggio + melody ---- */
/* Progression: C – Am – F – G  (I–vi–IV–V, klasik romantis) */
const PROG = [
  { root: 130.81, triad: [261.63, 329.63, 392.0],   mel: [523.25, 587.33, 659.25, 523.25] },
  { root: 110.0,  triad: [220.0,  261.63, 329.63],  mel: [440.0,  523.25, 440.0,  392.0 ] },
  { root: 87.31,  triad: [174.61, 220.0,  261.63],  mel: [349.23, 440.0,  349.23, 329.63] },
  { root: 98.0,   triad: [196.0,  246.94, 293.66],  mel: [392.0,  493.88, 392.0,  440.0 ] }
];

/* piano-like note: sine utama + triangle anasik halus + decay panjang */
function playPiano(freq, time, dur, vol) {
  const ctx = A.ctx;
  vol = vol || 0.16;

  const o1 = ctx.createOscillator();
  o1.type = 'sine';
  o1.frequency.value = freq;
  const o2 = ctx.createOscillator();
  o2.type = 'triangle';
  o2.frequency.value = freq;
  o2.detune.value = 4;

  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, time);
  g.gain.linearRampToValueAtTime(vol, time + 0.02);
  g.gain.exponentialRampToValueAtTime(vol * 0.35, time + dur * 0.35);
  g.gain.exponentialRampToValueAtTime(0.0001, time + dur);

  const g2 = ctx.createGain();
  g2.gain.value = 0.35;

  o1.connect(g);
  o2.connect(g2);
  g2.connect(g);
  g.connect(A.master);

  o1.start(time); o1.stop(time + dur + 0.05);
  o2.start(time); o2.stop(time + dur + 0.05);
}

function playBass(freq, time, dur) {
  const ctx = A.ctx;
  const o = ctx.createOscillator();
  o.type = 'sine';
  o.frequency.value = freq;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, time);
  g.gain.linearRampToValueAtTime(0.2, time + 0.04);
  g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
  o.connect(g); g.connect(A.master);
  o.start(time); o.stop(time + dur + 0.05);
}

/* soft “pad” chord under the arpeggio */
function playPad(freqs, time, dur) {
  const ctx = A.ctx;
  freqs.forEach((f) => {
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.value = f;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, time);
    g.gain.linearRampToValueAtTime(0.035, time + 0.4);
    g.gain.setValueAtTime(0.035, time + dur * 0.65);
    g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    o.connect(g); g.connect(A.master);
    o.start(time); o.stop(time + dur + 0.05);
  });
}

function musicTick() {
  if (!A.synthOn || !A.ctx) return;
  const ctx = A.ctx;
  const beat = 0.55;               /* 8th-note feel, lebih hidup */
  const bar = beat * 8;            /* 1 bar = 8 ketukan */
  while (A.nextTime < ctx.currentTime + 0.3) {
    const ch = PROG[A.step % PROG.length];
    const t0 = A.nextTime;

    /* bass tiap bar (root + fifth) */
    playBass(ch.root, t0, bar * 0.95);
    playBass(ch.root * 1.5, t0 + beat * 4, bar * 0.4);

    /* pad lembut */
    playPad(ch.triad, t0, bar);

    /* arpeggio 8 note: up-down triad */
    const arp = [ch.triad[0], ch.triad[1], ch.triad[2], ch.triad[1],
                 ch.triad[0], ch.triad[1], ch.triad[2], ch.triad[1] * 1.5];
    for (let i = 0; i < 8; i++) {
      playPiano(arp[i], t0 + i * beat, beat * 1.6, 0.1);
    }

    /* melody 4 note (lebih nyaring di atas) */
    for (let i = 0; i < 4; i++) {
      playPiano(ch.mel[i], t0 + i * beat * 2, beat * 2.4, 0.14);
    }

    A.nextTime += bar;
    A.step++;
  }
}
function startMusic() {
  const ctx = ensureAudio(); if (!ctx) return;
  const bg = $('bg-audio');
  /* coba putar mp3 vokal dulu */
  if (bg && !A.mp3Failed) {
    if (!A.bg) {
      try {
        A.bg = ctx.createMediaElementSource(bg);
        A.bg.connect(A.master);
        A.mp3Ok = true;
      } catch (e) {
        A.mp3Failed = true;
      }
    }
    bg.volume = 0.55;
    const p = bg.play();
    if (p && p.catch) {
      p.catch(() => { A.mp3Failed = true; startSynth(); });
    }
    A.synthOn = true;
    return;
  }
  startSynth();
}
function startSynth() {
  const ctx = ensureAudio(); if (!ctx) return;
  A.synthOn = true;
  A.step = 0;
  A.nextTime = ctx.currentTime + 0.05;
  clearInterval(A.schedTimer);
  A.schedTimer = setInterval(musicTick, 80);
  musicTick();
}
function stopMusic() {
  A.synthOn = false;
  clearInterval(A.schedTimer);
  A.schedTimer = null;
  const bg = $('bg-audio');
  if (bg) bg.pause();
}

/* music pill UI */
function syncMusicUI() {
  const pill = $('music-pill');
  const label = $('music-label');
  if (STATE.musicMuted) {
    pill.classList.remove('playing');
    label.textContent = 'Musik Off';
    stopMusic();
  } else {
    pill.classList.add('playing');
    label.textContent = 'Musik On';
    if (STATE.audioUnlocked) startMusic();
  }
}
function unlockAudio() {
  if (!STATE.audioUnlocked) {
    STATE.audioUnlocked = true;
    ensureAudio();
    if (!STATE.musicMuted) startMusic();
    syncMusicUI();
  }
}

/* ============================================================
   NAVIGATION — nextScene / onSceneEnter / progress
   ============================================================ */
function buildDots() {
  const wrap = $('step-dots');
  wrap.innerHTML = '';
  for (let i = 1; i <= STATE.totalScenes; i++) {
    const d = document.createElement('span');
    d.className = 'dot';
    wrap.appendChild(d);
  }
}
function updateProgress(n) {
  document.querySelectorAll('#step-dots .dot').forEach((d, i) => {
    d.classList.toggle('done', i < n);
    d.classList.toggle('active', i === n);
  });
  $('step-label').textContent = n + '/' + STATE.totalScenes;
}

function nextScene() {
  const next = STATE.currentScene + 1;
  if (next > STATE.totalScenes) return;
  const cur = $('scene-' + STATE.currentScene);
  cur.style.animation = 'sceneOut .38s var(--ease-out) both';
  sfxPop();
  setTimeout(() => {
    cur.classList.remove('active');
    cur.style.animation = '';
    STATE.currentScene = next;
    try { localStorage.setItem(SCENE_KEY, String(next)); } catch (e) {}
    const el = $('scene-' + next);
    el.classList.add('active');
    $('stage').scrollTop = 0;
    updateProgress(next);
    onSceneEnter(next);
    spawnFloaters(3);
  }, 370);
}

function onSceneEnter(n) {
  if (n === 2) resetClock();
  if (n === 3) resetChat();
  if (n === 4) resetHold();
  if (n === 5) startRain();
  if (n === 6) resetTrash();
  if (n === 7) resetHeart();
  if (n === 8) resetFlower();
  if (n === 9) resetConstellation();
  if (n === 10) resetUmbrella();
  if (n === 11) resetLetter();
  if (n === 12) launchFinale();
}

function wireNext(btnId, fromScene) {
  $(btnId).addEventListener('click', () => {
    if (STATE.currentScene === fromScene) nextScene();
  });
}

/* ============================================================
   SCENE 1 — AMPLOP SEGEL LILIN
   ============================================================ */
function initScene1() {
  const env = $('envelope');
  const open = () => {
    if (STATE.envelopeOpen) return;
    STATE.envelopeOpen = true;
    env.classList.add('open');
    $('env-seal').textContent = '💔';
    sfxChime();
    vibrate(25);
    $('st-1').textContent = 'Surat terbuka ✨';
    $('btn-1-next').classList.remove('hidden');
    spawnFloaters(4);
  };
  env.addEventListener('click', open);
  env.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  wireNext('btn-1-next', 1);
}

/* ============================================================
   SCENE 2 — JAM 18 TAHUN
   ============================================================ */
let clockHour = 300, clockMin = 0;
function resetClock() {
  $('st-2').textContent = 'Tap: ' + STATE.clockTaps + '/8';
  $('btn-2-next').classList.toggle('hidden', STATE.clockTaps < 8);
  $('clock-quote').classList.toggle('hidden', STATE.clockTaps < 8);
  $('clock').classList.toggle('lit', STATE.clockTaps >= 8);
}
function initScene2() {
  const clock = $('clock');
  const tap = () => {
    if (STATE.clockTaps >= 8) return;
    STATE.clockTaps++;
    clockHour += 22.5;
    clockMin += 45;
    $('hand-hour').style.transform = 'rotate(' + clockHour + 'deg)';
    $('hand-minute').style.transform = 'rotate(' + clockMin + 'deg)';
    sfxTap();
    vibrate(12);
    resetClock();
    if (STATE.clockTaps === 8) {
      sfxChime();
      showToast('Waktunya tiba ⏰✨');
      spawnFloaters(4);
    }
  };
  clock.addEventListener('click', tap);
  clock.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tap(); } });
  wireNext('btn-2-next', 2);
}

/* ============================================================
   SCENE 3 — NOTIFIKASI MALAM
   ============================================================ */
const CHAT_MSGS = [
  { from: 'them', text: 'Kamu sudah makan belum?' },
  { from: 'me',   text: 'Belum… sibuk 😅' },
  { from: 'them', text: 'Jangan lupa istirahat ya.' },
  { from: 'me',   text: 'Iya… thanks 🥺' },
  { from: 'them', text: 'Aku selalu doakan kamu, walau diam-diam.' }
];
function resetChat() {
  $('chat-screen').innerHTML = '';
  STATE.chatShown = 0;
  $('st-3').textContent = 'Pesan masuk: 0/5 · tap layar';
  $('btn-3-next').classList.remove('hidden');
}
function initScene3() {
  const phone = $('chat-phone');
  phone.addEventListener('click', () => {
    if (STATE.chatShown >= CHAT_MSGS.length) return;
    const m = CHAT_MSGS[STATE.chatShown];
    const b = document.createElement('div');
    b.className = 'chat-bubble ' + m.from;
    b.textContent = m.text;
    $('chat-screen').appendChild(b);
    STATE.chatShown++;
    sfxPop();
    vibrate(10);
    $('st-3').textContent = 'Pesan masuk: ' + STATE.chatShown + '/5';
    if (STATE.chatShown === CHAT_MSGS.length) {
      sfxChime();
      showToast('Pesan kecil yang terasa magis 📱');
      spawnFloaters(4);
    }
  });
  wireNext('btn-3-next', 3);
}

/* ============================================================
   SCENE 4 — MERCUSUAR FRIENDZONE (tahan 2 detik)
   ============================================================ */
const HOLD_MS = 2000;
let holdRaf = null, holdStart = 0;
const CIRC = 339.3;
function resetHold() {
  cancelAnimationFrame(holdRaf);
  holdRaf = null;
  STATE.holdProgress = 0;
  $('hold-fill').style.strokeDashoffset = CIRC;
  $('st-4').textContent = 'Cahaya 0%';
  $('lighthouse').classList.remove('lit');
  $('btn-4-next').classList.toggle('hidden', STATE.holdProgress < 1);
}
function holdLoop(ts) {
  if (!holdStart) holdStart = ts;
  const pct = clamp((ts - holdStart) / HOLD_MS, 0, 1);
  STATE.holdProgress = pct;
  $('hold-fill').style.strokeDashoffset = CIRC * (1 - pct);
  $('st-4').textContent = 'Cahaya ' + Math.round(pct * 100) + '%';
  if (pct >= 1) {
    holdRaf = null;
    $('lighthouse').classList.add('lit');
    sfxChime();
    vibrate(30);
    showToast('Mercusuar menyala meski lautnya sepi 🗼');
    spawnFloaters(4);
    $('btn-4-next').classList.remove('hidden');
    return;
  }
  holdRaf = requestAnimationFrame(holdLoop);
}
function initScene4() {
  const btn = $('btn-hold');
  const startHold = (e) => {
    e.preventDefault();
    if (STATE.holdProgress >= 1) return;
    holdStart = 0;
    cancelAnimationFrame(holdRaf);
    holdRaf = requestAnimationFrame(holdLoop);
  };
  const endHold = () => {
    if (STATE.holdProgress >= 1) return;
    cancelAnimationFrame(holdRaf);
    holdRaf = null;
    holdStart = 0;
    STATE.holdProgress = 0;
    $('hold-fill').style.strokeDashoffset = CIRC;
    $('st-4').textContent = 'Cahaya 0% · tahan lagi';
  };
  btn.addEventListener('pointerdown', startHold);
  btn.addEventListener('pointerup', endHold);
  btn.addEventListener('pointerleave', endHold);
  btn.addEventListener('pointercancel', endHold);
  wireNext('btn-4-next', 4);
}

/* ============================================================
   SCENE 5 — HUJAN PATAH HATI (canvas)
   ============================================================ */
let rainRaf = null, rainDrops = [], rainParticles = [];
function startRain() {
  const cv = $('rain-canvas');
  const ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  rainDrops = [];
  rainParticles = [];
  const TARGET = 8;

  function spawnDrop() {
    if (rainDrops.length + STATE.rainCaught >= TARGET + 4) return;
    rainDrops.push({
      x: rand(30, W - 30), y: -16,
      r: 11, speed: rand(1.6, 2.6), wob: rand(0, Math.PI * 2)
    });
  }
  let spawnTimer = setInterval(spawnDrop, 480);
  for (let i = 0; i < 3; i++) setTimeout(spawnDrop, i * 200);

  function draw() {
    ctx.clearRect(0, 0, W, H);
    /* bg rain streaks */
    ctx.strokeStyle = 'rgba(180,200,230,.12)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 14; i++) {
      const x = (i * 47 + Date.now() * 0.04) % W;
      const y = (Date.now() * 0.12 + i * 80) % H;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 3, y + 14); ctx.stroke();
    }
    /* drops */
    rainDrops.forEach((d) => {
      d.y += d.speed;
      d.wob += 0.04;
      const dx = Math.sin(d.wob) * 1.2;
      ctx.save();
      ctx.translate(d.x + dx, d.y);
      ctx.beginPath();
      ctx.moveTo(0, -d.r);
      ctx.quadraticCurveTo(d.r, 0, 0, d.r);
      ctx.quadraticCurveTo(-d.r, 0, 0, -d.r);
      const grad = ctx.createLinearGradient(0, -d.r, 0, d.r);
      grad.addColorStop(0, 'rgba(190,210,240,.85)');
      grad.addColorStop(1, 'rgba(120,150,200,.55)');
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();
    });
    /* particles */
    rainParticles = rainParticles.filter((p) => p.life > 0);
    rainParticles.forEach((p) => {
      p.x += p.vx; p.y += p.vy; p.vy += 0.12; p.life -= 0.03;
      ctx.globalAlpha = Math.max(p.life, 0);
      ctx.fillStyle = p.c;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    });
    /* remove offscreen */
    rainDrops = rainDrops.filter((d) => d.y < H + 20);
    if (STATE.rainCaught >= TARGET) {
      clearInterval(spawnTimer);
      cancelAnimationFrame(rainRaf);
      rainRaf = null;
      /* clear remaining */
      rainDrops = [];
      setTimeout(() => {
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = 'rgba(230,195,92,.9)';
        ctx.font = '600 18px "Playfair Display", Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText('Air mata mengalir… lalu mereda 🌧', W / 2, H / 2);
      }, 400);
      return;
    }
    rainRaf = requestAnimationFrame(draw);
  }
  rainRaf = requestAnimationFrame(draw);

  function catchAt(e) {
    if (STATE.rainCaught >= TARGET) return;
    const rect = cv.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    for (let i = 0; i < rainDrops.length; i++) {
      const d = rainDrops[i];
      const dx = d.x - x, dy = d.y - y;
      if (dx * dx + dy * dy < (d.r + 18) * (d.r + 18)) {
        rainDrops.splice(i, 1);
        STATE.rainCaught++;
        sfxSoftRain();
        vibrate(10);
        for (let j = 0; j < 8; j++) {
          rainParticles.push({
            x: d.x, y: d.y,
            vx: rand(-2.5, 2.5), vy: rand(-3, 0.5),
            r: rand(1.5, 3.5), life: 1,
            c: Math.random() < 0.5 ? '#d47b85' : '#e6c35c'
          });
        }
        $('st-5').textContent = 'Tertangkap: ' + STATE.rainCaught + '/' + TARGET;
        if (STATE.rainCaught === TARGET) {
          sfxChime();
          showToast('Kamu mengizinkan air mata mengalir 🌧');
          spawnFloaters(4);
          $('btn-5-next').classList.remove('hidden');
        }
        break;
      }
    }
  }
  cv.addEventListener('pointerdown', catchAt);
  $('st-5').textContent = 'Tertangkap: ' + STATE.rainCaught + '/' + TARGET;
  if (STATE.rainCaught >= TARGET) $('btn-5-next').classList.remove('hidden');
}
function initScene5() {
  wireNext('btn-5-next', 5);
}

/* ============================================================
   SCENE 6 — HAPUS JEJAK SOSMED (drag to trash)
   ============================================================ */
function resetTrash() {
  document.querySelectorAll('.mem-card').forEach((c) => {
    c.classList.remove('gone', 'dragging');
    c.style.display = '';
  });
  $('st-6').textContent = 'Dihapus: ' + STATE.trashCount + '/3';
  $('btn-6-next').classList.toggle('hidden', STATE.trashCount < 3);
}
function initScene6() {
  const bin = $('trash-bin');
  let dragEl = null;

  function removeCard(card) {
    if (card.classList.contains('gone')) return;
    card.classList.add('gone');
    STATE.trashCount++;
    sfxPop();
    vibrate(18);
    bin.classList.add('hot');
    setTimeout(() => bin.classList.remove('hot'), 250);
    $('st-6').textContent = 'Dihapus: ' + STATE.trashCount + '/3';
    if (STATE.trashCount >= 3) {
      sfxChime();
      showToast('Jejak terhapus. Jiwamu bernapas 🗑');
      spawnFloaters(4);
      $('btn-6-next').classList.remove('hidden');
    }
    setTimeout(() => { card.style.display = 'none'; }, 350);
  }

  document.querySelectorAll('.mem-card').forEach((card) => {
    card.addEventListener('dragstart', (e) => {
      dragEl = card;
      card.classList.add('dragging');
      try { e.dataTransfer.setData('text/plain', card.dataset.i); e.dataTransfer.effectAllowed = 'move'; } catch (err) {}
    });
    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      dragEl = null;
    });
    /* pointer fallback (mobile drag) */
    let px = 0, py = 0, dragging = false;
    card.addEventListener('pointerdown', (e) => {
      if (card.classList.contains('gone')) return;
      dragging = true;
      dragEl = card;
      px = e.clientX; py = e.clientY;
      card.classList.add('dragging');
      card.setPointerCapture(e.pointerId);
    });
    card.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - px, dy = e.clientY - py;
      card.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(1.06) rotate(-3deg)';
      const br = bin.getBoundingClientRect();
      const cr = card.getBoundingClientRect();
      const cx = cr.left + cr.width / 2, cy = cr.top + cr.height / 2;
      if (cx > br.left && cx < br.right && cy > br.top && cy < br.bottom) {
        bin.classList.add('hot');
      } else {
        bin.classList.remove('hot');
      }
    });
    card.addEventListener('pointerup', (e) => {
      if (!dragging) return;
      dragging = false;
      card.classList.remove('dragging');
      card.style.transform = '';
      const br = bin.getBoundingClientRect();
      const cr = card.getBoundingClientRect();
      const cx = cr.left + cr.width / 2, cy = cr.top + cr.height / 2;
      if (cx > br.left && cx < br.right && cy > br.top && cy < br.bottom) {
        removeCard(card);
      }
      bin.classList.remove('hot');
      dragEl = null;
    });
    card.addEventListener('pointercancel', () => {
      dragging = false;
      card.classList.remove('dragging');
      card.style.transform = '';
    });
  });

  bin.addEventListener('dragover', (e) => { e.preventDefault(); bin.classList.add('hot'); });
  bin.addEventListener('dragleave', () => bin.classList.remove('hot'));
  bin.addEventListener('drop', (e) => {
    e.preventDefault();
    bin.classList.remove('hot');
    if (dragEl) removeCard(dragEl);
    dragEl = null;
  });

  wireNext('btn-6-next', 6);
}

/* ============================================================
   SCENE 7 — PELUKAN DIRI SENDIRI (tap 25×)
   ============================================================ */
const HEART_MAX = 25;
const HEART_CIRC = 389.6;
function resetHeart() {
  $('st-7').textContent = 'Tap: ' + STATE.heartTaps + '/' + HEART_MAX;
  $('hr-fill').style.strokeDashoffset = HEART_CIRC * (1 - STATE.heartTaps / HEART_MAX);
  $('btn-7-next').classList.toggle('hidden', STATE.heartTaps < HEART_MAX);
  $('self-love-msg').classList.toggle('hidden', STATE.heartTaps < HEART_MAX);
}
function initScene7() {
  const btn = $('btn-heart');
  btn.addEventListener('click', () => {
    if (STATE.heartTaps >= HEART_MAX) return;
    STATE.heartTaps++;
    sfxTap();
    vibrate(8);
    resetHeart();
    if (STATE.heartTaps % 5 === 0) spawnFloaters(1, ['💗']);
    if (STATE.heartTaps === HEART_MAX) {
      sfxChime();
      showToast('Cintai dirimu lebih dulu 🫂');
      spawnFloaters(6);
      btn.classList.add('full');
    }
  });
  wireNext('btn-7-next', 7);
}

/* ============================================================
   SCENE 8 — BUNGA MEKAR TAKDIR (tap 6×)
   ============================================================ */
const FLOWER_MAX = 6;
function resetFlower() {
  document.querySelectorAll('.petal').forEach((p, i) => {
    p.classList.toggle('bloomed', i < STATE.flowerTaps);
  });
  $('st-8').textContent = 'Tap kuncup: ' + STATE.flowerTaps + '/' + FLOWER_MAX;
  $('btn-8-next').classList.toggle('hidden', STATE.flowerTaps < FLOWER_MAX);
  $('flower-quote').classList.toggle('hidden', STATE.flowerTaps < FLOWER_MAX);
  const core = $('flower-core');
  core.textContent = STATE.flowerTaps >= FLOWER_MAX ? '🌸' : '🌱';
  core.classList.toggle('full', STATE.flowerTaps >= FLOWER_MAX);
}
function initScene8() {
  const core = $('flower-core');
  const tap = () => {
    if (STATE.flowerTaps >= FLOWER_MAX) return;
    STATE.flowerTaps++;
    sfxTap();
    vibrate(10);
    resetFlower();
    if (STATE.flowerTaps === FLOWER_MAX) {
      sfxChime();
      showToast('Bunga mekar pada musimnya 🌸');
      spawnFloaters(5, ['🌸', '🌺', '✨']);
    }
  };
  core.addEventListener('click', tap);
  core.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tap(); } });
  wireNext('btn-8-next', 8);
}

/* ============================================================
   SCENE 9 — KONSTELASI HATI (tap 5 bintang berurutan)
   ============================================================ */
function resetConstellation() {
  document.querySelectorAll('.star').forEach((s, i) => {
    s.classList.toggle('lit', i < STATE.starStep);
    s.classList.remove('wrong');
  });
  for (let i = 0; i < 4; i++) {
    $('cl-' + (i + 1)).classList.toggle('on', i < STATE.starStep - 1);
  }
  $('st-9').textContent = 'Bintang: ' + STATE.starStep + '/5';
  $('btn-9-next').classList.toggle('hidden', STATE.starStep < 5);
  $('constellation-quote').classList.toggle('hidden', STATE.starStep < 5);
}
function initScene9() {
  document.querySelectorAll('.star').forEach((star) => {
    const tap = () => {
      const i = +star.dataset.i;
      if (i === STATE.starStep) {
        STATE.starStep++;
        sfxBell();
        vibrate(12);
        resetConstellation();
        if (STATE.starStep === 5) {
          sfxChime();
          showToast('Segala sesuatu indah pada waktunya ✨');
          spawnFloaters(5, ['✨', '🌟', '💫']);
        }
      } else if (i > STATE.starStep) {
        star.classList.add('wrong');
        setTimeout(() => star.classList.remove('wrong'), 420);
        sfxTap();
      }
    };
    star.addEventListener('click', tap);
    star.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tap(); } });
  });
  wireNext('btn-9-next', 9);
}

/* ============================================================
   SCENE 10 — PAYUNG BERDUA (drag umbrella ke couple)
   ============================================================ */
function resetUmbrella() {
  const u = $('umbrella');
  u.style.left = '18px';
  u.style.top = '18px';
  u.classList.remove('dragging', 'snapped');
  $('couple').classList.remove('sheltered');
  $('rain-lines').classList.remove('raining');
  $('rain-lines').innerHTML = '';
  $('st-10').textContent = STATE.umbrellaDone
    ? 'Mereka berteduh bersama ☂️'
    : 'Seret payung ke pasangan…';
  $('btn-10-next').classList.toggle('hidden', !STATE.umbrellaDone);
}
function initScene10() {
  const stage = $('umbrella-stage');
  const u = $('umbrella');
  const couple = $('couple');
  let dragging = false, ox = 0, oy = 0;

  /* rain lines generator */
  function startRainLines() {
    const box = $('rain-lines');
    box.classList.add('raining');
    box.innerHTML = '';
    for (let i = 0; i < 22; i++) {
      const rl = document.createElement('span');
      rl.className = 'rl';
      rl.style.left = rand(2, 96) + '%';
      rl.style.animationDuration = rand(0.5, 0.9) + 's';
      rl.style.animationDelay = rand(0, 0.6) + 's';
      box.appendChild(rl);
    }
  }

  function trySnap() {
    const ur = u.getBoundingClientRect();
    const cr = couple.getBoundingClientRect();
    const ucx = ur.left + ur.width / 2;
    const ucy = ur.top + ur.height / 2;
    const ccx = cr.left + cr.width / 2;
    const ccy = cr.top + cr.height / 2;
    if (Math.abs(ucx - ccx) < 60 && ucy < ccy + 20 && ucy > ccy - 120) {
      /* snap above couple */
      const sr = stage.getBoundingClientRect();
      u.style.left = (ccx - sr.left - ur.width / 2) + 'px';
      u.style.top = (cr.top - sr.top - ur.height + 8) + 'px';
      u.classList.add('snapped');
      couple.classList.add('sheltered');
      if (!STATE.umbrellaDone) {
        STATE.umbrellaDone = true;
        sfxChime();
        vibrate(28);
        showToast('Cinta menjadi tempat berlindung ☂️');
        spawnFloaters(4);
        startRainLines();
        $('st-10').textContent = 'Mereka berteduh bersama ☂️';
        $('btn-10-next').classList.remove('hidden');
      }
      return true;
    }
    return false;
  }

  u.addEventListener('pointerdown', (e) => {
    if (STATE.umbrellaDone) return;
    e.preventDefault();
    dragging = true;
    u.classList.add('dragging');
    const r = u.getBoundingClientRect();
    ox = e.clientX - r.left;
    oy = e.clientY - r.top;
    u.setPointerCapture(e.pointerId);
  });
  u.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const sr = stage.getBoundingClientRect();
    let nx = e.clientX - sr.left - ox;
    let ny = e.clientY - sr.top - oy;
    nx = clamp(nx, 0, sr.width - u.offsetWidth);
    ny = clamp(ny, 0, sr.height - u.offsetHeight);
    u.style.left = nx + 'px';
    u.style.top = ny + 'px';
  });
  u.addEventListener('pointerup', () => {
    if (!dragging) return;
    dragging = false;
    u.classList.remove('dragging');
    if (!trySnap()) {
      /* gentle return to corner */
      u.style.left = '18px';
      u.style.top = '18px';
      showToast('Belum kena — seret ke atas pasangan');
    }
  });
  u.addEventListener('pointercancel', () => {
    dragging = false;
    u.classList.remove('dragging');
  });
  u.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && !STATE.umbrellaDone) {
      e.preventDefault();
      /* keyboard assist: auto snap */
      const sr = stage.getBoundingClientRect();
      const cr = couple.getBoundingClientRect();
      u.style.left = (cr.left + cr.width / 2 - sr.left - u.offsetWidth / 2) + 'px';
      u.style.top = (cr.top - sr.top - u.offsetHeight + 8) + 'px';
      trySnap();
    }
  });

  wireNext('btn-10-next', 10);
}

/* ============================================================
   SCENE 11 — SURAT PEMBACA
   ============================================================ */
function resetLetter() {
  let saved = '';
  try { saved = localStorage.getItem(LETTER_KEY) || ''; } catch (e) {}
  const ta = $('reader-letter');
  if (saved) {
    ta.value = saved;
    STATE.letterDone = true;
    $('letter-status').textContent = '💌 Surat tersimpan di browser ini.';
    $('st-11').textContent = 'Surat sudah tersimpan ✓';
  } else {
    $('letter-status').textContent = '';
    $('st-11').textContent = STATE.letterDone ? 'Surat sudah tersimpan ✓' : 'Surat belum tersimpan';
  }
}
function initScene11() {
  $('btn-save-letter').addEventListener('click', () => {
    const ta = $('reader-letter');
    const text = ta.value.trim();
    if (!text) {
      showToast('Tulis sedikit dulu ya 📜');
      ta.focus();
      return;
    }
    try { localStorage.setItem(LETTER_KEY, text); } catch (e) {}
    STATE.letterDone = true;
    $('letter-status').textContent = '💌 Surat tersimpan di browser ini.';
    $('st-11').textContent = 'Surat sudah tersimpan ✓';
    sfxChime();
    vibrate(20);
    showToast('Suratmu tersimpan 💌');
    spawnFloaters(4);
  });
  wireNext('btn-11-next', 11);
}

/* ============================================================
   SCENE 12 — GRAND FINALE (kembang api canvas)
   ============================================================ */
let finaleRaf = null, fireworks = [];
function launchFinale() {
  /* WA link */
  const waText = encodeURIComponent(
    '💌 "Istirahatlah. Kamu sudah berjalan begitu jauh. Semuanya akan baik-baik saja." — Jika Kita Tak Pernah Jatuh Cinta'
  );
  $('wa-link').href = 'https://wa.me/?text=' + waText;

  if (STATE.finaleLaunched) return;
  STATE.finaleLaunched = true;

  const cv = $('finale-canvas');
  const ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  fireworks = [];
  sfxChime();

  const colors = ['#e6c35c', '#d47b85', '#ffecd2', '#b85d68', '#cda134', '#f5a8b0'];

  function burst(x, y) {
    const n = Math.floor(rand(24, 40));
    for (let i = 0; i < n; i++) {
      const a = (Math.PI * 2 * i) / n + rand(-0.1, 0.1);
      const sp = rand(1.6, 4.2);
      fireworks.push({
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        r: rand(1.4, 3),
        life: 1,
        c: colors[Math.floor(Math.random() * colors.length)]
      });
    }
  }

  let launchTimer = setInterval(() => {
    if (fireworks.length < 500) burst(rand(60, W - 60), rand(50, H * 0.55));
  }, 700);
  burst(W / 2, H * 0.4);

  function draw() {
    ctx.fillStyle = 'rgba(26,11,20,.28)';
    ctx.fillRect(0, 0, W, H);
    fireworks = fireworks.filter((p) => p.life > 0);
    fireworks.forEach((p) => {
      p.x += p.vx; p.y += p.vy;
      p.vy += 0.035; p.vx *= 0.985; p.vy *= 0.985;
      p.life -= 0.012;
      ctx.globalAlpha = Math.max(p.life, 0);
      ctx.fillStyle = p.c;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    });
    finaleRaf = requestAnimationFrame(draw);
  }
  finaleRaf = requestAnimationFrame(draw);

  /* stop interval when leaving scene (cleanup on restart handles raf) */
  STATE._finaleStop = () => {
    clearInterval(launchTimer);
    cancelAnimationFrame(finaleRaf);
    finaleRaf = null;
    fireworks = [];
    STATE.finaleLaunched = false;
  };
}

function initScene12() {
  $('btn-restart').addEventListener('click', restartJourney);
}

/* ============================================================
   RESTART
   ============================================================ */
function restartJourney() {
  if (STATE._finaleStop) STATE._finaleStop();
  const keepMute = STATE.musicMuted;
  const keepUnlocked = STATE.audioUnlocked;
  STATE = defaultState();
  STATE.musicMuted = keepMute;
  STATE.audioUnlocked = keepUnlocked;
  try { localStorage.removeItem(SCENE_KEY); } catch (e) {}

  /* hide all scenes */
  for (let i = 1; i <= 12; i++) {
    const el = $('scene-' + i);
    if (el) { el.classList.remove('active'); el.style.animation = ''; }
  }
  /* reset widgets */
  $('envelope').classList.remove('open');
  $('env-seal').textContent = '🔒';
  $('st-1').textContent = 'Klik amplop untuk membuka';
  $('btn-1-next').classList.add('hidden');
  clockHour = 300; clockMin = 0;
  $('hand-hour').style.transform = 'rotate(300deg)';
  $('hand-minute').style.transform = 'rotate(0deg)';
  $('chat-screen').innerHTML = '';
  $('btn-3-next').classList.add('hidden');
  $('lighthouse').classList.remove('lit');
  $('btn-4-next').classList.add('hidden');
  document.querySelectorAll('.mem-card').forEach((c) => {
    c.classList.remove('gone', 'dragging');
    c.style.transform = '';
    c.style.display = '';
  });
  $('btn-6-next').classList.add('hidden');
  $('btn-heart').classList.remove('full');
  $('btn-7-next').classList.add('hidden');
  document.querySelectorAll('.petal').forEach((p) => p.classList.remove('bloomed'));
  $('flower-core').textContent = '🌱';
  $('flower-core').classList.remove('full');
  $('btn-8-next').classList.add('hidden');
  document.querySelectorAll('.star').forEach((s) => s.classList.remove('lit', 'wrong'));
  for (let i = 1; i <= 4; i++) $('cl-' + i).classList.remove('on');
  $('btn-9-next').classList.add('hidden');
  $('btn-10-next').classList.add('hidden');
  STATE.umbrellaDone = false;
  resetUmbrella();

  STATE.currentScene = 1;
  $('scene-1').classList.add('active');
  $('stage').scrollTop = 0;
  updateProgress(1);
  showToast('Perjalanan dimulai ulang 💌');
  spawnFloaters(5);
}

/* ============================================================
   AMBIENT CANVAS — partikel rose/emas melayang
   ============================================================ */
function initAmbient() {
  const cv = $('ambient-canvas');
  const ctx = cv.getContext('2d');
  let W, H, parts = [];

  function resize() {
    W = cv.width = window.innerWidth;
    H = cv.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  for (let i = 0; i < 32; i++) {
    parts.push({
      x: rand(0, W), y: rand(0, H),
      r: rand(1, 3.2),
      vx: rand(-0.15, 0.15),
      vy: rand(-0.35, -0.08),
      a: rand(0.15, 0.55),
      hue: Math.random() < 0.5 ? '230,195,92' : '212,123,133',
      tw: rand(0, Math.PI * 2)
    });
  }

  function tick() {
    ctx.clearRect(0, 0, W, H);
    parts.forEach((p) => {
      p.x += p.vx; p.y += p.vy; p.tw += 0.03;
      if (p.y < -8) { p.y = H + 8; p.x = rand(0, W); }
      if (p.x < -8) p.x = W + 8;
      if (p.x > W + 8) p.x = -8;
      const alpha = p.a * (0.6 + 0.4 * Math.sin(p.tw));
      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'rgb(' + p.hue + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/* ============================================================
   BOOT
   ============================================================ */
function boot() {
  buildDots();
  initAmbient();

  initScene1();
  initScene2();
  initScene3();
  initScene4();
  initScene5();
  initScene6();
  initScene7();
  initScene8();
  initScene9();
  initScene10();
  initScene11();
  initScene12();

  /* restore scene */
  let start = 1;
  try {
    const saved = parseInt(localStorage.getItem(SCENE_KEY) || '1', 10);
    if (saved >= 1 && saved <= 12) start = saved;
  } catch (e) {}
  if (start > 1) {
    for (let i = 1; i < start; i++) $('scene-' + i).classList.remove('active');
    $('scene-' + start).classList.add('active');
    STATE.currentScene = start;
  }
  updateProgress(STATE.currentScene);

  /* unlock audio on first gesture */
  const unlock = () => {
    unlockAudio();
    document.removeEventListener('pointerdown', unlock);
    document.removeEventListener('keydown', unlock);
  };
  document.addEventListener('pointerdown', unlock);
  document.addEventListener('keydown', unlock);

  /* music pill toggle */
  $('music-pill').addEventListener('click', (e) => {
    e.stopPropagation();
    unlockAudio();
    STATE.musicMuted = !STATE.musicMuted;
    syncMusicUI();
    showToast(STATE.musicMuted ? 'Musik dimatikan 🎵' : 'Musik dinyalakan 🎵');
  });
  syncMusicUI();

  /* keyboard nav (desktop) */
  document.addEventListener('keydown', (e) => {
    if (e.target && (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT')) return;
    if (e.key === 'ArrowRight') {
      const btn = $('btn-' + STATE.currentScene + '-next');
      if (btn && !btn.classList.contains('hidden')) nextScene();
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
