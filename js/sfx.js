/* sfx.js — retro 8-bit sound effects, synthesized live with WebAudio.
   No audio files ship with the app — every blip is generated on the fly,
   so it stays 100% offline. Global `SFX`. Mute state persists per browser.

   Usage: SFX.spin(), SFX.win(), SFX.coin(), SFX.fanfare(), etc.
   Every call is a no-op when muted or when WebAudio is unavailable. */
(function () {
  const KEY = "jasonBachHub.muted";

  let muted = false;
  try { muted = localStorage.getItem(KEY) === "1"; } catch (_) {}

  let ctx = null;
  function ac() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { ctx = new AC(); } catch (_) { ctx = null; }
    }
    return ctx;
  }

  // A single beep. Frequency can be a number (steady) or [from,to] (glide).
  function tone(freq, start, dur, type, gain) {
    const a = ac();
    if (!a || muted) return;
    const t0 = a.currentTime + (start || 0);
    const osc = a.createOscillator();
    const g = a.createGain();
    osc.type = type || "square";
    if (Array.isArray(freq)) {
      osc.frequency.setValueAtTime(freq[0], t0);
      osc.frequency.linearRampToValueAtTime(freq[1], t0 + dur);
    } else {
      osc.frequency.setValueAtTime(freq, t0);
    }
    const peak = gain == null ? 0.14 : gain;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g); g.connect(a.destination);
    osc.start(t0); osc.stop(t0 + dur + 0.03);
  }

  // Play a little melody: notes = [[freq,dur], ...], played in sequence.
  function seq(notes, type, gain) {
    let t = 0;
    notes.forEach((n) => {
      if (n[0]) tone(n[0], t, n[1], type, gain);
      t += n[1];
    });
  }

  const SFX = {
    isMuted() { return muted; },

    setMuted(v) {
      muted = !!v;
      try { localStorage.setItem(KEY, muted ? "1" : "0"); } catch (_) {}
      if (!muted) this.blip();
      return muted;
    },

    toggle() { return this.setMuted(!muted); },

    // Browsers suspend audio until a user gesture — call this on first click.
    resume() { const a = ac(); if (a && a.state === "suspended") a.resume(); },

    blip() { tone(720, 0, 0.07, "square", 0.10); },
    select() { seq([[880, 0.05], [1180, 0.07]], "square", 0.10); },
    hover() { tone(520, 0, 0.04, "sine", 0.05); },

    // Rising arcade whir for the wheel spin.
    spin() {
      const a = ac(); if (!a || muted) return;
      for (let i = 0; i < 10; i++) tone(280 + i * 55, i * 0.055, 0.05, "square", 0.06);
    },

    // Landing / a nice win chime.
    win() { seq([[660, 0.09], [880, 0.09], [1046, 0.16]], "square", 0.13); },

    // Coin / point award (Mario-ish).
    coin() { seq([[988, 0.05], [1318, 0.16]], "square", 0.12); },

    // Correct answer sparkle.
    correct() { seq([[784, 0.08], [1046, 0.08], [1318, 0.14]], "triangle", 0.12); },

    // Wrong answer buzz.
    error() { tone([220, 110], 0, 0.28, "sawtooth", 0.12); },

    // Daily Bulba reveal — magical ascending sparkle.
    dailyBulba() {
      seq([[523, 0.07], [659, 0.07], [784, 0.07], [1046, 0.07], [1318, 0.2]], "triangle", 0.12);
    },

    // Evolution jingle — the classic rising "you evolved!" flourish.
    evolve() {
      seq([[392, 0.1], [523, 0.1], [659, 0.1], [784, 0.1], [1046, 0.22]], "triangle", 0.12);
    },

    // Big victory fanfare for the Champion Ceremony.
    fanfare() {
      seq([
        [523, 0.12], [523, 0.12], [523, 0.12], [523, 0.28],
        [415, 0.28], [466, 0.28], [523, 0.16], [0, 0.08], [466, 0.16], [523, 0.5],
      ], "square", 0.14);
    },
  };

  window.SFX = SFX;

  // Resume the audio context on the first user interaction (autoplay policy).
  document.addEventListener("pointerdown", function once() {
    SFX.resume();
    document.removeEventListener("pointerdown", once);
  });
})();
