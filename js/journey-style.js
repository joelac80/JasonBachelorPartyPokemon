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
        mk("challenge", "⚔", "Challenge", "Full-power rematch squads — the canon best"),
        mk("story", "📖", "True Story", "Levels scale like the games — Lv 14 → the throne"),
      ]),
      el("p", { class: "hint jstyle-note" }, cur === "story"
        ? "📖 TRUE STORY: every badge and chamber fights at its story level — both teams step down to era-true forms (a Lv 14 Brock opens with Geodude, and so does your Golem), and movesets shrink to what that level would know. Same badges, same ladder — only the fight changes."
        : "⚔ CHALLENGE: every leader and Champion fields their grown-up rematch squad at FULL power. The hardest wall in the app — switch to 📖 True Story any time for the classic level curve."),
    ]);
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
  };
})();
