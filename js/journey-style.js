/* journey-style.js — ⚔/📖 HOW the saga fights you. THE JOURNEY comes in two
   styles, chosen per phone and switchable any time:
     ⚔ CHALLENGE (the default) — every leader and Champion fields their
       grown-up rematch squad at FULL power. The canon best, the hardest wall.
     📖 TRUE STORY — levels scale like the games: Lv 14 at a region's first
       badge climbing to 48, the Elite Four at 50+, the Champion at 58 (GEETA
       60, the summit 62). BOTH teams walk down to era-true forms — a Lv 14
       Brock opens with Geodude, and your Charizard steps in as Charmander —
       and movesets shrink to what those levels would really know.
   Same badges, same ladder, same Hall of Fame — only the fight changes. */
(function () {
  const { el } = U;
  const KEY = "jasonBachHub.journeyStyle.v1";
  function all() { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (_) { return {}; } }
  function styleOf(attId) { return all()[attId] === "story" ? "story" : "challenge"; }
  function setStyle(attId, v) { try { const s = all(); s[attId] = v; localStorage.setItem(KEY, JSON.stringify(s)); } catch (_) {} }
  function isStory(attId) { return styleOf(attId) === "story"; }

  // ⬇ The devolve walk (the nuzlocke's rule): a form whose evolution level
  // beats the cap steps down its line until it's legal at that level.
  const PRE = {};
  Object.keys(window.EVO_LEVELS || {}).forEach((from) => {
    (window.EVO_LEVELS[from] || []).forEach((e) => { PRE[e.to] = { from: +from, lvl: e.lvl }; });
  });
  // 🏔 Hisuian lines aren't in EVO_LEVELS (they don't level-up-evolve here), but
  // the cap law still needs to walk an evolved Hisuian form down to its base.
  Object.keys(window.HISUI_PREVO || {}).forEach((to) => {
    const p = window.HISUI_PREVO[to]; PRE[+to] = { from: p.from, lvl: p.lvl };
  });
  function formAt(id, cap) {
    let guard = 0;
    while (PRE[id] && PRE[id].lvl > cap && (window.DEX || {})[PRE[id].from] && guard++ < 6) id = PRE[id].from;
    return id;
  }

  // 📈 The classic curve — the same one the nuzlocke walks. 8-gym regions
  // climb 14 → 48; Alola's four kahunas stride the span in four steps.
  const CAPS8 = [14, 24, 28, 32, 36, 40, 44, 48], CAPS4 = [14, 26, 37, 48];
  function regionGymIdxs(region) {
    const GYMS = window.GYM_CIRCUIT || [];
    return GYMS.map((g, i) => i).filter((i) => GYMS[i].region === region);
  }
  // A gym's story level rides its POSITION in its region (badge 1 = Lv 14).
  function gymLevel(idx) {
    const GYMS = window.GYM_CIRCUIT || [];
    const g = GYMS[idx];
    if (!g) return 48;
    const idxs = regionGymIdxs(g.region);
    const caps = idxs.length === 4 ? CAPS4 : CAPS8;
    return caps[Math.max(0, Math.min(idxs.indexOf(idx), caps.length - 1))];
  }
  // Post-gym challengers scale with the badges you hold in THAT region.
  function encounterLevel(region, badges) {
    const caps = regionGymIdxs(region).length === 4 ? CAPS4 : CAPS8;
    return caps[Math.max(0, Math.min(badges || 0, caps.length - 1))];
  }
  // League chambers: 50 + 2 per stage, the Champion's hall at 58 — with the
  // two skyline exceptions (Top Champion GEETA 60, the silent summit 62).
  function stageLevel(idx) {
    const L = window.LEAGUE_STAGES || [];
    const st = L[idx];
    if (!st) return 58;
    if (st.key === "red") return 62;
    if (st.key === "geeta") return 60;
    const idxs = L.map((s, i) => i).filter((i) => L[i].region === st.region && L[i].key !== "red");
    const q = idxs.indexOf(idx);
    if (q === idxs.length - 1) return 58;
    return 50 + Math.max(0, q) * 2;
  }

  // The style switch — rendered on the Journey / Gym Circuit / League pages.
  function row(attId) {
    const cur = styleOf(attId);
    const mk = (v, e, t, d) => el("button", {
      class: "jstyle-chip" + (cur === v ? " on" : ""),
      onClick: () => { if (styleOf(attId) !== v) { setStyle(attId, v); Router.render({ keepScroll: true }); } },
    }, [
      el("span", { class: "jstyle-e" }, e),
      el("span", { class: "jstyle-txt" }, [el("span", { class: "jstyle-t" }, t), el("span", { class: "jstyle-d" }, d)]),
    ]);
    return el("div", { class: "jstyle" }, [
      el("div", { class: "jstyle-row" }, [
        mk("challenge", "⚔", "Challenge", "Their best team — and it climbs all saga"),
        mk("story", "📖", "True Story", "The classic curve — but the ace never bows"),
      ]),
      el("p", { class: "hint jstyle-note" }, cur === "story"
        ? "📖 TRUE STORY: every badge and chamber fights at its story level — your whole squad steps down to era-true forms (your Golem opens as a Geodude), and movesets shrink to what that level would know. But the leader's ACE never devolves: a Lv 14 gym still closes with its real signature Pokémon, towering over the field. That makes this the STEEPER climb of the two — the boss moment is the whole fight."
        : "⚔ CHALLENGE: every leader and Champion brings the BEST team they possibly can — full evolution, a full six, no era rules — and so do you. Your bag is SEALED (no Full Restores, no Dire Hit), and the ladder climbs the whole saga: Johto opens around Lv 50 and Paldea closes near Lv 72, with the leader pulling further ahead of you every region. Falkner is an even fight; GRUSHA and GEETA are not."),
    ]);
  }

  // ⚔ CHALLENGE — THE SAGA CURVE.
  // Challenge used to pin every battle to a flat reference of 50: Katy, sixty
  // gyms deep, was the same fight as Falkner, because the arc rose inside a
  // region and then RESET nine times. Against a box that keeps growing that
  // makes the ladder get easier as you walk it.
  // Now it climbs across the whole saga. Two separate dials, because Challenge's
  // identity is FULL-POWER teams — the reference must never be passed as
  // `level`, which is what triggers era devolution:
  //   refLevel — what BOTH sides fight at, 50 in early Johto → 72 by Paldea, so
  //     your squad's numbers grow with the journey.
  //   foeEdge  — levels the LEADER gets ON TOP, widening 0 → +8, so the gap
  //     itself opens up as you go. The per-region ace edge still rides above
  //     this, keeping each region's own badge-1→badge-8 arc intact.
  const CHAL_LO = 50, CHAL_HI = 74, CHAL_EDGE = 12;
  function sagaFrac(idx) {
    const n = Math.max(1, (window.GYM_CIRCUIT || []).length - 1);
    return Math.max(0, Math.min(1, (idx || 0) / n));
  }
  function chalGymLevel(idx) { return Math.round(CHAL_LO + (CHAL_HI - CHAL_LO) * sagaFrac(idx)); }
  function chalGymEdge(idx) { return Math.round(CHAL_EDGE * sagaFrac(idx)); }
  // The league sits ABOVE the gyms of its own era: a region's chambers start
  // where its last badge left off and climb through the Champion.
  function chalStageLevel(idx) {
    const L = window.LEAGUE_STAGES || [], st = L[idx];
    if (!st) return CHAL_HI;
    if (st.key === "red") return CHAL_HI + 8;
    const G = window.GYM_CIRCUIT || [];
    const last = G.map((g, i) => i).filter((i) => G[i].region === st.region).pop();
    const base = last == null ? CHAL_HI : chalGymLevel(last);
    const run = L.map((s, i) => i).filter((i) => L[i].region === st.region && L[i].key !== "red");
    const q = Math.max(0, run.indexOf(idx));
    return Math.min(95, base + 3 + q * 2);
  }
  function chalStageEdge(idx) {
    const L = window.LEAGUE_STAGES || [], st = L[idx];
    if (!st) return 4;
    if (st.key === "red") return 12;
    const G = window.GYM_CIRCUIT || [];
    const last = G.map((g, i) => i).filter((i) => G[i].region === st.region).pop();
    // ramp WITH the chamber: the first Elite Four seat is a step, not a wall
    const run = L.map((s, i) => i).filter((i) => L[i].region === st.region && L[i].key !== "red");
    const q = Math.max(0, run.indexOf(idx));
    return Math.round(1 + q * 1.5 + CHAL_EDGE * sagaFrac(last == null ? 67 : last) * 0.35);
  }

  // 📖 True Story ROSTER curve — early leaders run small teams like the
  // cartridges did: a region's first badge is a 3v3, growing to 6v6 by the
  // end (Alola's four kahunas stride 3→6 in four steps). The Elite Four
  // field the canon FIVE; Champions and RED keep their full six.
  const SIZES8 = [3, 3, 4, 4, 5, 5, 6, 6], SIZES4 = [3, 4, 5, 6];
  function gymSize(idx) {
    const GYMS = window.GYM_CIRCUIT || [];
    const g = GYMS[idx]; if (!g) return 6;
    const list = regionGymIdxs(g.region);
    const t = list.length <= 4 ? SIZES4 : SIZES8;
    const pos = Math.max(0, Math.min(t.length - 1, list.indexOf(idx)));
    return t[pos] || 6;
  }
  function stageSize(rank) { return /Elite Four/.test(rank || "") ? 5 : 6; }

  window.JourneyStyle = {
    of: styleOf, set: setStyle, isStory: isStory, formAt: formAt,
    gymLevel: gymLevel, stageLevel: stageLevel, encounterLevel: encounterLevel, row: row,
    gymSize: gymSize, stageSize: stageSize,
    chalGymLevel: chalGymLevel, chalGymEdge: chalGymEdge,
    chalStageLevel: chalStageLevel, chalStageEdge: chalStageEdge,
  };
})();
