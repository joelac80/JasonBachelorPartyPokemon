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

  window.StoryBeats = { afterChampion: afterChampion };
})();
