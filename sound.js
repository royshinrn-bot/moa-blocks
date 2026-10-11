/* sound.js — shared sound for Korean Fidget + Moa Blocks
   The dial-detent click is Korean Fidget's playClick(), unchanged, so both
   apps sound like the same family. Moa adds two relatives built from the
   same two-layer recipe (triangle "tock" + square tick): a lower "set" for
   a block landing and a short rising chord for a finished word. */
(function (global) {
  let ctx = null, on = true;
  function keepAlive() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume().catch(()=>{}); return; }
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator(), g = ctx.createGain();
      g.gain.value = 0; o.connect(g); g.connect(ctx.destination); o.start();
    } catch (e) {}
  }
  function tock(base, vol, tick) {
    if (!on) return;
    try {
      keepAlive(); if (!ctx) return; if (ctx.state === 'suspended') ctx.resume();
      const t = ctx.currentTime;
      const o1 = ctx.createOscillator(), g1 = ctx.createGain();
      o1.type = 'triangle';
      o1.frequency.setValueAtTime(base, t);
      o1.frequency.exponentialRampToValueAtTime(base * 0.6, t + 0.03);
      g1.gain.setValueAtTime(0.0001, t);
      g1.gain.exponentialRampToValueAtTime(vol, t + 0.003);
      g1.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
      o1.connect(g1); g1.connect(ctx.destination); o1.start(t); o1.stop(t + 0.05);
      const o2 = ctx.createOscillator(), g2 = ctx.createGain();
      o2.type = 'square';
      o2.frequency.setValueAtTime(tick, t);
      g2.gain.setValueAtTime(0.0001, t);
      g2.gain.exponentialRampToValueAtTime(0.05, t + 0.001);
      g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.012);
      o2.connect(g2); g2.connect(ctx.destination); o2.start(t); o2.stop(t + 0.02);
    } catch (e) {}
  }
  const click = () => tock(300 + Math.random() * 80, 0.11, 1300);   // Fidget's detent
  const set   = () => tock(170 + Math.random() * 30, 0.16, 900);    // block lands in place
  const miss  = () => tock(120, 0.14, 500);                          // wrong spot
  const done  = () => [0, 70, 140].forEach((d, i) => setTimeout(() => tock(360 * [1, 1.25, 1.5][i], 0.1, 1600), d));

  /* Speech: Korean Fidget's voice priority, with Apple's Korean voices
     (Yuna and its enhanced builds) and Microsoft's natural voices ranked in. */
  let voices = [], chosen = null;
  // Jian (Premium) is Apple's best Korean voice; pick it first whenever it's installed
  const rank = v => (/jian/i.test(v.name) ? 20 : 0) + (/natural|neural|online/i.test(v.name) ? 5 : 0) + (/premium|enhanced|향상|고품질/i.test(v.name) ? 4 : 0)
                  + (/google/i.test(v.name) ? 3 : 0) + (/yuna|sora|sunhi|injoon/i.test(v.name) ? 2 : 0) + (v.lang === 'ko-KR' ? 1 : 0);
  function loadVoices(saved) {
    try { voices = speechSynthesis.getVoices().filter(v => /^ko/i.test(v.lang)).sort((a, b) => rank(b) - rank(a)); } catch (e) { voices = []; }
    chosen = voices.find(v => v.name === saved) || voices[0] || null;
    return voices;
  }
  function speak(text, rate) {
    if (!('speechSynthesis' in window)) return;
    keepAlive();
    try {
      speechSynthesis.cancel();
      setTimeout(() => {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'ko-KR'; u.rate = rate || 0.75; if (chosen) u.voice = chosen;
        speechSynthesis.speak(u);
      }, 50);
    } catch (e) {}
  }
  global.Sound = {
    click, set, miss, done, speak, loadVoices, keepAlive,
    get voices() { return voices; }, get voice() { return chosen; },
    useVoice(name) { chosen = voices.find(v => v.name === name) || chosen; },
    get on() { return on; }, set on(v) { on = !!v; }
  };
})(window);
