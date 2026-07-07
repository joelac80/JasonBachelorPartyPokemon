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

  // ---- background chiptune loop (independent of the SFX mute) --------------
  let musicOn = false;
  try { musicOn = localStorage.getItem("jasonBachHub.music") === "1"; } catch (_) {}
  let mTimer = null, mNext = 0, mStep = 0;
  const LEAD = [523, 659, 784, 659, 587, 698, 880, 698, 659, 831, 988, 831, 587, 494, 440, 494];
  const BASS = [131, 0, 196, 0, 175, 0, 196, 0, 165, 0, 208, 0, 175, 0, 147, 0];
  const MSTEP = 0.17;
  // Battle theme — faster, minor, driving. Plays during duels (respects the
  // SFX mute, not the background-music toggle: a battle IS the moment).
  let battleOn = false;
  const BLEAD = [330, 392, 440, 392, 494, 440, 392, 330, 294, 330, 392, 440, 494, 440, 392, 294,
                 330, 392, 440, 494, 523, 494, 440, 392, 587, 523, 494, 440, 392, 330, 294, 0];
  const BBASS = [82, 82, 0, 82, 98, 0, 82, 0, 73, 73, 0, 73, 98, 0, 110, 0,
                 82, 82, 0, 82, 98, 0, 82, 0, 110, 0, 98, 0, 73, 0, 82, 0];
  const BSTEP = 0.125;
  function noteAt(freq, t0, dur, type, gain) {
    const a = ac(); if (!a) return;
    const osc = a.createOscillator(), g = a.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g); g.connect(a.destination); osc.start(t0); osc.stop(t0 + dur + 0.03);
  }
  function musicTick() {
    const a = ac(); if (!a || (!musicOn && !battleOn)) return;
    const lead = battleOn ? BLEAD : LEAD, bass = battleOn ? BBASS : BASS, step = battleOn ? BSTEP : MSTEP;
    while (mNext < a.currentTime + 0.25) {
      const i = mStep % lead.length;
      if (lead[i]) noteAt(lead[i], mNext, step * 0.9, "square", battleOn ? 0.05 : 0.04);
      if (bass[i]) noteAt(bass[i], mNext, step * 0.95, "triangle", battleOn ? 0.06 : 0.05);
      mNext += step; mStep++;
    }
    mTimer = setTimeout(musicTick, 45);
  }
  function startMusicInternal() {
    const a = ac(); if (!a) return;
    if (a.state === "suspended") a.resume();
    mNext = a.currentTime + 0.1; mStep = 0;
    clearTimeout(mTimer); musicTick();
  }
  function stopMusicInternal() { clearTimeout(mTimer); mTimer = null; }

  const SFX = {
    isMuted() { return muted; },

    isMusicOn() { return musicOn; },
    toggleMusic() {
      musicOn = !musicOn;
      try { localStorage.setItem("jasonBachHub.music", musicOn ? "1" : "0"); } catch (_) {}
      if (musicOn) startMusicInternal(); else if (!battleOn) stopMusicInternal();
      return musicOn;
    },

    // Duel battle theme: on for the fight, then back to whatever was playing.
    battleMusic(on) {
      if (on && muted) return;                    // respect the mute button
      if (battleOn === !!on) return;
      battleOn = !!on;
      if (battleOn) startMusicInternal();
      else if (musicOn) startMusicInternal();
      else stopMusicInternal();
    },

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

  // Resume the audio context on the first user interaction (autoplay policy),
  // and resume the soundtrack if it was left on.
  document.addEventListener("pointerdown", function once() {
    SFX.resume();
    if (musicOn) startMusicInternal();
    document.removeEventListener("pointerdown", once);
  });
})();
