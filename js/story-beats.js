/* story-beats.js — 🌏 THE WORLD GROWS: the cinematic hinge between eras of
   THE JOURNEY. The moment a Champion falls, the saga doesn't just tick a
   checkbox — the curtain drops ONCE per Champion (per phone) and shows what
   that victory actually opened: the sting (Cynthia's piano falling silent
   as the rift tears open, the road on from Kanto…), the next region, the
   films now showing, the era's Legendary Challenge. The rift cinematic,
   RED's silence and the 🎹 finale intro already live elsewhere — this is
   the connective tissue between them. */
(function () {
  const { el } = U;
  const KEY = "jasonBachHub.beats.v1";
  function seen() { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (_) { return {}; } }
  function mark(k) { try { const s = seen(); s[k] = 1; localStorage.setItem(KEY, JSON.stringify(s)); } catch (_) {} }

  // What lies BEYOND each Champion — the road, and a story sting in the
  // saga's own voice. (Champions without a sting still get their unlocks.)
  const NEXT_REGION = { blue: "Johto", lance: "Hoenn", steven: "Sinnoh", cynthia: "Unova",
    alder: "Kalos", diantha: "Alola", kukui: "Galar", leon: "Paldea" };
  const CHAMP_GEN = { blue: 1, lance: 2, steven: 3, cynthia: 4, alder: 5, diantha: 6, kukui: 7, leon: 8, geeta: 9 };
  const STINGS = {
    blue: "The Champion was the rival who left Pallet Town one step ahead of you — and now the league hall will carve YOUR name over his. Professor Oak is already on his way up the stairs…",
    lance: "The dragons kneel. But far past Mt. Silver, a collector's airship casts its shadow over three legendary birds — and a whole new sea of Pokémon stirs.",
    steven: "The steel Champion bows. Deep beneath the waves and inside a sleeping volcano, older powers turn over in their sleep…",
    cynthia: "Somewhere in her villa, a piano falls quiet mid-phrase. High over Mt. Coronet the sky TEARS — and through the rift, an older Sinnoh is calling. The Safari will never be the same.",
    alder: "The Champion laughs, and mourns, and laughs again. Truth and Ideals settle back into their stones — for now — and a kingdom's caged victory waits on the horizon.",
    diantha: "The starlet curtsies to the new Champion. In the Allearth Forest, a cocoon dreams of destruction; above a hidden kingdom, a fortress waits for its Soul-Heart.",
    kukui: "The professor grins — his league, his dream, your crown. Beyond the islands, a storm-dark stadium is chanting somebody's name.",
    leon: "The unbeatable man takes off his cap and bows. Across the sea, an open-world horizon glitters — the LAST region… and the strangest.",
    geeta: "La Primera concedes the top seat. There is no next region — only the roads you skipped, the films still showing, the legends still waiting… and Mt. Silver, if you never went.",
  };

  // 🌅 ARRIVAL & 🏆 CONQUEST — the two new key-moment curtains that bracket a
  // region between its gateway (afterChampion) and its Champion. Each region
  // gets a "you've set foot here" sting the first time you take a badge in it,
  // and a "the League doors open" sting the moment its final badge is won.
  const REGION_META = {
    Kanto:  { emoji: "🗾", gate: "the Kanto Elite Four & Champion BLUE",
      arrive: "Pallet Town shrinks behind you. Route 1's tall grass whispers with your very first wild encounters — the whole saga starts on this road.",
      conquer: "Eight badges gleam in your case. Victory Road climbs ahead — and at its summit, the Indigo Plateau and your rival's stolen crown." },
    Johto:  { emoji: "🌸", gate: "the Johto Elite Four (and silent RED, for the full sweep)",
      arrive: "New Bark Town smells of morning dew. Bell-chimes drift from Ecruteak; somewhere a rainbow-winged legend is watching the road you've chosen.",
      conquer: "The Johto eight are yours. Past the Dragon's Den the Elite Four wait — and beyond even them, a silent boy stands alone on Mt. Silver." },
    Hoenn:  { emoji: "🌊", gate: "the Hoenn Elite Four",
      arrive: "Salt spray and volcano smoke share one sky. Two ancient titans sleep beneath Hoenn's sea and stone — and you've just stepped onto their island.",
      conquer: "Hoenn's eight are won. Ever Grande City rises from the sea, and its Elite Four throw open the last gate before the Champion." },
    Sinnoh: { emoji: "🏔", gate: "the Sinnoh Elite Four",
      arrive: "Snow crunches underfoot on the slopes of Mt. Coronet. Myth says the whole universe was born here — and the myth is starting to feel true.",
      conquer: "Sinnoh's eight are earned. Victory Road bores through the mountain's heart, and the Elite Four wait on the far side." },
    Unova:  { emoji: "🏙", gate: "the Unova Elite Four",
      arrive: "Skyscrapers rear over Unova like a new world with no room for the old one. Truth and Ideals wait, frozen in their stones, for a hero to choose.",
      conquer: "Unova's eight are claimed. The League castle waits across the badlands — four rooms, four masters, one crown." },
    Kalos:  { emoji: "🗼", gate: "the Kalos Elite Four",
      arrive: "Lumiose Tower glitters at the heart of Kalos. Beauty and destruction braid together here — mega stones humming with borrowed light.",
      conquer: "Kalos's eight are yours. The Pokémon League château opens its elegant doors — and the Elite Four expect a show." },
    Alola:  { emoji: "🌺", gate: "the Alola Elite Four",
      arrive: "Warm surf, hibiscus, and the low chant of the islands. Alola keeps no gyms — only trials, and the Tapu guardians who set them.",
      conquer: "All four Kahunas have bowed. Mount Lanakila's Elite Four — Alola's very first, forged for a challenger like you — await at the summit." },
    Galar:  { emoji: "⚽", gate: "the Galar Champion Cup and unbeatable LEON",
      arrive: "The stadium roars your name before you've even said it. Under the pitch-lights of Galar the crowd came for giants — so give them one.",
      conquer: "Eight Galar badges! The Champion Cup finals are set. Best the field and only the undefeated LEON stands between you and the trophy." },
    Paldea: { emoji: "🍊", gate: "the Paldea Elite Four & Top Champion GEETA",
      arrive: "An open horizon in every direction — mountain, city, sea, all yours to cross. Paldea's treasure is the road itself, and it runs to the crater's heart.",
      conquer: "Paldea's eight are won. The Elite Four and Top Champion GEETA hold the final gate of the final region — the last climb of the whole journey." },
  };

  // Shared full-screen curtain, styled like the world-grows beat. Waits for any
  // battle / evolution / other curtain to clear so it never buries a flow.
  function curtain(o) {
    const lay = el("div", { class: "league-intro final story-beat" + (o.cls ? " " + o.cls : "") }, [
      el("div", { class: "league-intro-inner" }, [
        el("div", { class: "league-intro-mt" }, o.mt || "🌏"),
        el("div", { class: "league-intro-flair" }, o.flair || ""),
        el("div", { class: "league-intro-name" }, o.name || ""),
        o.quote ? el("div", { class: "league-intro-quote" }, o.quote) : null,
        o.rows && o.rows.length ? el("div", { class: "beat-rows" }, o.rows) : null,
        el("div", { class: "toolbar", style: { justifyContent: "center" } }, [
          el("button", { class: "btn spin-btn", onClick: () => lay.remove() }, o.cta || "🌏 ONWARD"),
        ]),
      ]),
    ]);
    let tries = 0;
    (function whenClear() {
      if (++tries > 40) return;
      if (document.querySelector(".battle, .evo-stage, .league-intro:not(.story-beat)")) { setTimeout(whenClear, 700); return; }
      document.body.appendChild(lay);
      if (window.SFX && SFX.fanfare) SFX.fanfare();
      requestAnimationFrame(() => lay.classList.add("go"));
    })();
  }

  // 🌅 First foothold in a region — fires once per region per phone.
  function arriveRegion(region) {
    const m = REGION_META[region]; if (!m) return;
    if (seen()["arr:" + region]) return; mark("arr:" + region);
    curtain({ mt: m.emoji, flair: "A NEW REGION OPENS", name: "WELCOME TO " + region.toUpperCase(),
      quote: m.arrive, cta: "🌅 BEGIN" });
  }
  // 🏆 Every badge in a region earned — the League gate swings wide.
  function conquerRegion(region) {
    const m = REGION_META[region]; if (!m) return;
    if (seen()["conq:" + region]) return; mark("conq:" + region);
    curtain({ mt: m.emoji, flair: region.toUpperCase() + " CONQUERED", name: "EVERY BADGE WON",
      quote: m.conquer, rows: [el("div", { class: "beat-row" }, "🚪 " + region + "'s road now runs to " + m.gate + ".")],
      cta: "🏆 TO THE LEAGUE" });
  }

  // The curtain: one full-screen beat, once per Champion per phone.
  function afterChampion(attId, st) {
    if (!st || !st.key) return;
    const isChamp = /Champion/i.test(st.rank || "") || NEXT_REGION[st.key] || CHAMP_GEN[st.key];
    if (!isChamp) return;
    if (!attId || (window.Store && Store.leagueWins(attId).indexOf(st.key) < 0)) return;   // only on a real win
    if (seen()["ch:" + st.key]) return;
    mark("ch:" + st.key);

    const films = (window.MOVIE_BOSSES || []).filter((b) => b.needs === st.key);
    const region = NEXT_REGION[st.key];
    const gen = CHAMP_GEN[st.key];
    const legend = ((window.LegendChallenge && LegendChallenge.LEGENDS) || []).find((l) => l.gen === gen);
    const rows = [];
    if (region) rows.push(el("div", { class: "beat-row" }, "🗺 The road to " + region.toUpperCase() + " is open — a new generation roams the wild."));
    films.forEach((b) => rows.push(el("div", { class: "beat-row" }, "🎬 Now showing: " + b.film)));
    if (legend) rows.push(el("div", { class: "beat-row" }, "🌌 The Gen " + gen + " Legendary Challenge will answer you now."));
    if (st.key === "cynthia") rows.push(el("div", { class: "beat-row" }, "🏔 Something ancient opened over Mt. Coronet — check the Safari."));
    if (!rows.length && !STINGS[st.key]) return;

    const lay = el("div", { class: "league-intro final story-beat" }, [
      el("div", { class: "league-intro-inner" }, [
        el("div", { class: "league-intro-mt" }, "🌏"),
        el("div", { class: "league-intro-flair" }, "THE WORLD GROWS"),
        el("div", { class: "league-intro-name" }, (st.name || "THE CHAMPION") + " HAS FALLEN"),
        STINGS[st.key] ? el("div", { class: "league-intro-quote" }, STINGS[st.key]) : null,
        el("div", { class: "beat-rows" }, rows),
        el("div", { class: "toolbar", style: { justifyContent: "center" } }, [
          el("button", { class: "btn spin-btn", onClick: () => lay.remove() }, "🌏 ONWARD"),
        ]),
      ]),
    ]);
    // Never bury the Hall of Fame flow — wait for battle screens to clear.
    let tries = 0;
    (function whenClear() {
      if (++tries > 30) return;
      if (document.querySelector(".battle, .evo-stage")) { setTimeout(whenClear, 700); return; }
      document.body.appendChild(lay);
      if (window.SFX && SFX.fanfare) SFX.fanfare();
      requestAnimationFrame(() => lay.classList.add("go"));
    })();
  }

  window.StoryBeats = { afterChampion: afterChampion, arriveRegion: arriveRegion, conquerRegion: conquerRegion };
})();
