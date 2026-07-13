/* nuzlocke.js — 🪦 The Nuzlocke Run: a true hardcore challenge mode.
   Pick ONE starter, then live off the land: wilds are caught by BATTLING
   them down (weaken-to-catch — no free throw), the gyms fall IN ORDER, then
   the Elite Four and the Champion. The rule that makes it a Nuzlocke: any
   of YOUR Pokémon that faints in a run battle is DEAD for the rest of the
   run. Lose the whole box and the run is over.
   THREE structures (data/nuz-regions.js):
    🎯 REGION run — any of the nine regions as its own exclusive run, the
       proven level-scaling pattern (Lv14 → 48 gyms, league to ~58) applied
       region by region. Johto keeps RED past the crown for the Legend tier.
    🎲 REGION RANDOMIZER — same region, same caps and team sizes, but every
       trainer fields seeded-random era Pokémon.
    🌍 MASTER RANDOMIZER — all nine regions in canon order: 68 gyms, every
       Elite Four, every Champion (RED included) — 114 battles, randomized
       teams, one level curve climbing 14 → 100, permadeath the whole way.
    🎬 MOVIE MARATHON — the attrition epic: no starter, no grass, no caps.
       A casting call drafts SIX non-legendaries at full power, then the
       entire filmography rolls in release order — every movie legend at
       full boss strength, permadeath through every credits. The co-star
       rule is the only lifeline: a beaten film's legend may join the cast,
       but ONLY into a seat opened by a death. Survive all 16 films for
       the Marathon Premiere crown.
    🎒 THE LONG WALK — one box, nine regions, the region curve resetting to
       14 at every border. Your Pokémon PERSIST (no team reset, no gates) —
       veterans steamroll each region's early gyms, but permadeath never
       resets, encounters stay scarce, and ~115 battles of attrition erode
       the box. Classic teams; RED mandatory; GEETA crowns the trek.
    🕰 THROUGH THE AGES — the same nine-region walk with CLASSIC teams and
       the region curve resetting every generation (each region plays Lv
       14 → 48 → league, like Kanto did). What makes the reset fair: at
       every border the WHOLE TEAM retires to the professor and a brand-new
       regional starter begins the next era — nine generations, nine teams,
       one unbroken journey. Catches and deaths count across the saga.
   Legacy runs (Kanto Act I → Johto Act II) keep working untouched.
   Runs never touch the real ladder — state lives in Store.nuzlocke/HoF. */
(function () {
  const { el } = U;
  const DEX = window.DEX || {};
  function sfx(n) { if (window.SFX && SFX[n]) SFX[n](); }

  const REGIONS = window.NUZ_REGIONS || [];
  const regionByKey = (k) => REGIONS.find((r) => r.key === k) || null;
  // Starters are gifts, never wild — across every generation.
  const ALL_STARTERS = REGIONS.reduce((a, r) => a.concat(r.starters), []);
  const KANTO_GYM0 = 8;                            // legacy Act I: Kanto gyms at idx 8-15
  const JOHTO_GYM0 = 0;                            // legacy Act II: Johto gyms at idx 0-7
  const KANTO_E4 = ["lorelei", "brunok", "agatha", "lance4", "blue"];

  // ── The battle SEQUENCE of a region-aware run ────────────────────────────
  // Every gym in circuit order, then that region's Elite Four + Champion —
  // region by region for the master gauntlet (RED's Mt. Silver peak sits
  // right after Johto's league, exactly where the canon puts it).
  const allRegions = (run) => run.region === "master" || run.region === "ages" || run.region === "trek";
  // Ages and the Long Walk share the region-reset curve; only ages resets the BOX.
  const regionReset = (run) => run.region === "ages" || run.region === "trek";
  function seqFor(run) {
    const regions = allRegions(run) ? REGIONS : [regionByKey(run.region)].filter(Boolean);
    const seq = [];
    regions.forEach((R) => {
      for (let i = 0; i < R.gymN; i++) seq.push({ t: "gym", idx: R.gym0 + i, R: R });
      R.league.forEach((k) => seq.push({ t: "stage", key: k, R: R }));
      if (R.peak) seq.push({ t: "stage", key: R.peak, R: R, peak: 1 });
    });
    // 🕰 The ages walk ends where it began: after the last Champion, the road
    // leads home to Pallet Town — PROFESSOR OAK is the true final boss. (His
    // step keeps the last region's R so the border gate never re-triggers.)
    if (run.region === "ages" && regions.length) {
      seq.push({ t: "stage", key: "oak", R: regions[regions.length - 1], oak: 1 });
    }
    return seq;
  }
  // The professor's Stadium squad, straight from the canon-trainer registry.
  function oakStage() {
    const t = (window.CANON_TRAINERS || []).find((x) => x.name === "PROF. OAK");
    return { key: "oak", rank: "PROFESSOR", name: "OAK", boost: 1.3,
      team: (t && t.team) || [128, 103, 59, 130, 34, 149], quote: t && t.quote };
  }
  function nextStep(run) {
    const seq = seqFor(run);
    for (let i = 0; i < seq.length; i++) {
      const s = seq[i];
      const done = s.t === "gym" ? run.badges.indexOf(s.idx) >= 0 : run.league.indexOf(s.key) >= 0;
      if (!done) return s;
    }
    return null;
  }
  function doneCount(run) { return run.badges.length + run.league.length; }
  function curRegion(run) {
    if (run.region && !allRegions(run)) return regionByKey(run.region);
    const s = nextStep(run);
    return s ? s.R : REGIONS[REGIONS.length - 1];
  }
  // 🕰 Ages only: the border gate. The next battle sits in a region the
  // current box doesn't belong to yet → the run pauses at the professor's
  // lab until a new starter is chosen (returns that region, else null).
  function agesGate(run) {
    if (run.region !== "ages") return null;
    const step = nextStep(run);
    return step && step.R.key !== (run.curRegion || (REGIONS[0] || {}).key) ? step.R : null;
  }

  // Wild pools — no legendaries (they'd trivialize the run) and no starters
  // (yours is a gift). Region runs roam the cumulative national dex through
  // their gen (a Hoenn run still meets a Pidgey); the master gauntlet's
  // grass grows with every region it enters. Legacy: Gen 1, then +Gen 2.
  function wildsFor(run) {
    let max = 151;
    if (run && run.region) { const R = curRegion(run); max = R ? R.dexMax : 1025; }
    else if (run && run.act === 2) max = 251;
    return Object.keys(DEX).map(Number)
      .filter((id) => id >= 1 && id <= max && !DEX[id].leg && ALL_STARTERS.indexOf(id) < 0);
  }

  function gymAt(i) { return (window.GymCircuit && GymCircuit.GYMS && GymCircuit.GYMS[i]) || null; }
  function stageFor(key) { return (window.LEAGUE_STAGES || []).find((s) => s.key === key) || null; }
  function aName(id) { const a = Store.attendee(id); return a ? a.name : id; }
  function monName(id) { return (DEX[id] || {}).n || ("#" + id); }

  // Same drastic tiering as the Safari — but in a Nuzlocke the only boost is
  // WEAKENING it, so the floor is the raw base and damage is worth up to +65%.
  function catchBase(id) {
    const d = DEX[id] || { x: 60 };
    return d.x >= 200 ? 0.15 : d.x >= 140 ? 0.25 : d.x >= 90 ? 0.40 : 0.55;
  }
  // 👣 The roads between badges hold only so many wild encounters — no
  // re-rolling the dice. Each roll burns a slot (running away included).
  const ENC_PER_ERA = 3;
  function eraKey(run) {
    return (run.region || (run.act === 2 ? 2 : 1)) + ":" + run.badges.length + ":" + run.league.length;
  }
  function encLeft(run) {
    const used = run.encKey === eraKey(run) ? (run.encN || 0) : 0;
    return Math.max(0, ENC_PER_ERA - used);
  }
  // Near-flat encounter odds, like the Safari grass — but the grass only
  // grows what the CURRENT level cap allows (no Dragonite ambushing a
  // 2-badge run; its line shows up as Dratini), and the no-dupes clause
  // strikes every species already met this run.
  function rollWild(run) {
    const cap = runLevel(run);
    // The no-dupes clause takes whole FAMILIES: anything owned or already
    // met locks out its entire evolutionary line, both directions.
    const taken = {};
    (run.seen || []).forEach((id) => { taken[FAM_ROOT[id] || id] = 1; });
    run.box.forEach((m) => { taken[FAM_ROOT[m.id] || m.id] = 1; });
    const WILDS = wildsFor(run).filter((id) =>
      !taken[FAM_ROOT[id] || id] && !(PRE[id] && PRE[id].lvl > cap));
    const pool = WILDS;
    if (!pool.length) return 0;
    let total = 0; const cum = [];
    pool.forEach((id) => { total += 1 / Math.pow(DEX[id].x || 60, 0.30); cum.push([total, id]); });
    const r = Math.random() * total;
    for (let i = 0; i < cum.length; i++) if (r <= cum[i][0]) return cum[i][1];
    return pool[pool.length - 1];
  }

  // 📈 The run's LEVEL CAP — climbs with progress and drives two things:
  // every mon in a run battle DISPLAYS at this level (a fresh run reads
  // Lv14, not Lv50), and box mons EVOLVE when the cap crosses their real
  // evolution level. Region runs follow THE pattern (14 → 48 across the
  // gyms — Misty-era 24 per the house rules — league 50 + 2/stage, the
  // Mt. Silver peak at 62). Alola's four kahunas stride the same span.
  // The master gauntlet is ONE long curve: Lv14 at gym 1 → Lv100 at GEETA.
  function runLevel(run) {
    if (run.region === "movie") return 100;          // 🎬 full power, no caps
    if (run.region === "master") {
      const total = seqFor(run).length;              // 114 battles, 14 → 100
      return Math.min(100, 14 + Math.round((doneCount(run) * 86) / Math.max(1, total - 1)));
    }
    if (regionReset(run)) {
      // 🕰/🎒 The region curve RESETS each generation — ages earns it with a
      // fresh team; the Long Walk carries ONE box through every reset.
      const R = curRegion(run) || REGIONS[0];
      const g = run.badges.filter((i) => i >= R.gym0 && i < R.gym0 + R.gymN).length;
      const caps = R.gymN === 4 ? [14, 26, 37, 48] : [14, 24, 28, 32, 36, 40, 44, 48];
      if (g < R.gymN) return caps[g];
      const l = R.league.filter((k) => run.league.indexOf(k) >= 0).length;
      if (l < R.league.length) return 50 + l * 2;
      return 62;                                     // Gen 2's peak (RED)
    }
    if (run.region) {
      const R = regionByKey(run.region);
      const g = run.badges.length;
      const caps = R && R.gymN === 4 ? [14, 26, 37, 48] : [14, 24, 28, 32, 36, 40, 44, 48];
      if (R && g < R.gymN) return caps[g];
      const l = run.league.length;
      if (!R || l < R.league.length) return 50 + l * 2;   // league era → 58 at the Champion
      return 62;                                          // the peak (Mt. Silver)
    }
    const act = run.act === 2 ? 2 : 1;
    const k = run.badges.filter((i) => i >= KANTO_GYM0).length;
    const j = run.badges.filter((i) => i < KANTO_GYM0).length;
    if (act === 1) {
      if (k < 8) return [14, 24, 28, 32, 36, 40, 44, 48][k];
      return 50 + run.league.length * 2;               // Elite Four era → 58 past BLUE
    }
    if (j < 8) return [58, 60, 62, 64, 66, 68, 70, 72][j];
    return 78;                                         // Mt. Silver
  }

  // Which forms this box mon could evolve into at the current cap. Real
  // level-up lines use their true level (Squirtle→Wartortle at 16); stone /
  // trade / friendship lines stand in at 32 (data/evo-levels.js).
  // SPLIT FAMILIES (Slowbro/Slowking, Gardevoir/Gallade, Glalie/Froslass…):
  // the branches carry different levels, so waiting for "the other one" could
  // never happen — the moment ANY branch is within the cap, EVERY branch is
  // offered. Reaching one fork must never force the other's choice on you.
  function evoTargetsFor(m, run) {
    if (!m || m.dead) return [];
    const rows = ((window.EVO_LEVELS || {})[m.id] || []).filter((r) => DEX[r.to]);
    const cap = runLevel(run);
    if (rows.length > 1) return rows.some((r) => r.lvl <= cap) ? rows : [];
    return rows.filter((r) => r.lvl <= cap);
  }

  // ⬇ The reverse walk: what a species DEVOLVES to at a given cap. A Lv14
  // Brock can't field a Golem — the line walks down until the form is legal
  // (Golem→Graveler needs 32, Graveler→Geodude needs 25 → Geodude at 14).
  const PRE = {};
  Object.keys(window.EVO_LEVELS || {}).forEach((from) => {
    (window.EVO_LEVELS[from] || []).forEach((e) => { PRE[e.to] = { from: +from, lvl: e.lvl }; });
  });
  function formAtLevel(id, cap) {
    let guard = 0;
    while (PRE[id] && PRE[id].lvl > cap && DEX[PRE[id].from] && guard++ < 6) id = PRE[id].from;
    return id;
  }
  // 🧬 Evolutionary FAMILY roots (Slowpoke for Slowbro AND Slowking) — the
  // no-dupes clause strikes whole families, so owning a Sandshrew means no
  // Sandslash ever ambles out of the grass.
  const FAM_ROOT = {};
  Object.keys(DEX).forEach((k) => {
    let id = +k, g = 0;
    while (PRE[id] && DEX[PRE[id].from] && g++ < 6) id = PRE[id].from;
    FAM_ROOT[+k] = id;
  });

  // Tiny deterministic PRNG — the Randomizer must show the SAME team on the
  // preview card and in the battle, across re-renders, for the whole run.
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function strHash(s) { let h = 9; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 387420489); return h >>> 0; }

  // The team a run-battle opponent fields: classic keeps the canon lineup,
  // 🎲 Randomizer draws era-pool species seeded by (run, stage) — same caps,
  // same team sizes, different Pokémon every run. Both devolve to the cap —
  // EXCEPT the leader's ACE: pass it and it always closes the team in its
  // real form, caps be damned (Brock may open with a Geodude, but the run
  // still ends against his Steelix — randomizer included).
  function foeTeam(run, baseTeam, size, stageKey, ace) {
    const cap = runLevel(run);
    const want = ace ? Math.max(0, size - 1) : size;
    let ids;
    if (run.mode === "random") {
      const rnd = mulberry32(((run.seed || 1) ^ strHash(stageKey)) >>> 0);
      const pool = wildsFor(run);
      ids = [];
      let guard = 0;
      while (ids.length < want && guard++ < 400) {
        const id = pool[(rnd() * pool.length) | 0];
        if (ids.indexOf(id) < 0 && id !== ace) ids.push(id);
      }
    } else {
      ids = (ace ? baseTeam.filter((id) => id !== ace) : baseTeam).slice(0, want);
    }
    ids = ids.map((id) => formAtLevel(id, cap));
    if (ace) ids.push(ace);
    return ids;
  }
  // Gym teams keep the leader's REAL ace (data lists it last).
  const gymAce = (g) => (g && g.team && g.team[g.team.length - 1]) || 0;

  // In-place refresh: a grass roll (or run-away) re-renders the page, which
  // used to flash and snap the scroll back to the top — mid-page buttons
  // deserve a mid-page refresh (the router's live-sync mode does exactly this).
  function renderKeepScroll() { Router.render({ keepScroll: true }); }

  // ── Per-phone session (NOT synced): who's running, current grass encounter ──
  let me = "";
  let wildId = 0;
  let wildShiny = 0;        // ✨ this encounter rolled shiny (1-in-16)
  let evoOpen = false;
  let newKind = "classic";   // starter-lab pick: "classic" | "random" | "master"
  let newRegion = "kanto";   // starter-lab region (classic/random structures)

  function view(root) {
    const meId = (window.Sync && Sync.getMe && Sync.getMe()) || "";
    if (!me && meId && Store.attendee(meId)) me = meId;

    root.appendChild(el("div", { class: "page-head" }, [
      el("h1", {}, "🪦 Nuzlocke Run"),
      el("p", { class: "page-sub" }, "The true challenge: one starter, catches only by battle, gyms in order — and any Pokémon that faints is gone for the whole run. Run a single region, randomize it, or take the 🌍 master gauntlet across all nine. Fewest catches wears the crown."),
    ]));

    // Trainer picker (per phone, like the Safari).
    const sel = el("select", { class: "in" }, [el("option", { value: "" }, "— pick a trainer —")].concat(
      Store.state.attendees.map((a) => el("option", { value: a.id, selected: me === a.id ? "true" : null }, a.name))));
    sel.addEventListener("change", () => { me = sel.value; wildId = 0; Router.render(); });
    root.appendChild(el("div", { class: "safari-trainer" }, [el("span", { class: "safari-trainer-lbl" }, "Running as:"), sel]));

    const body = el("div", {});
    root.appendChild(body);
    if (!me) { body.appendChild(el("p", { class: "empty" }, "👆 Pick a trainer to start (or continue) a run.")); renderHall(body); return; }

    const run = Store.nuzRun(me);
    if (!run || run.over) { renderStartScreen(body, run); renderHall(body); return; }
    renderRun(body, run);
    renderHall(body);
  }

  // ── Screen 1: no run (or finished run) → the starter lab ──────────────────
  function renderStartScreen(host, lastRun) {
    if (lastRun && lastRun.over) {
      const alive = lastRun.box.filter((m) => !m.dead).length;
      const won = lastRun.over === "champion" || lastRun.over === "legend" || lastRun.over === "master" || lastRun.over === "ages" || lastRun.over === "premiere" || lastRun.over === "trek";
      const headline = lastRun.over === "master" ? "🌍 MASTER OF ALL REGIONS — nine regions, every trainer, permadeath on!"
        : lastRun.over === "ages" ? "🕰 TRAINER OF THE AGES — nine generations, nine teams, one unbroken journey!"
        : lastRun.over === "trek" ? "🎒 THE LONG WALK IS OVER — one team, nine regions, border to border!"
        : lastRun.over === "premiere" ? "🎬 THE CREDITS ROLL — the whole filmography survived, permadeath on!"
        : lastRun.over === "legend" ? "🗻 LEGEND — past the crown, and RED still fell!"
        : lastRun.over === "champion" ? "🏆 CHAMPION — the run is complete!"
        : lastRun.over === "wiped" ? "💀 The run ended — the whole box was lost." : "🏳️ Run abandoned.";
      const retired = lastRun.retired || [];
      host.appendChild(el("div", { class: "safari-card nuz-summary" + (won ? " result win" : " result miss") }, [
        el("div", { class: "safari-result-msg" }, headline),
        el("div", { class: "nuz-summary-line" },
          lastRun.badges.length + " badge" + (lastRun.badges.length === 1 ? "" : "s") + " · " +
          lastRun.league.length + " league stage" + (lastRun.league.length === 1 ? "" : "s") + " · " +
          lastRun.catches + " caught · " + lastRun.deaths + " lost · " + alive + " survived"),
        el("div", { class: "nuz-box-grid" }, lastRun.box.map((m) => boxMon(m))),
        // 🕰 The retrospective: every retired generation's team, in order —
        // the payoff of the ages walk (tombstones stay honored too).
        retired.length ? el("div", { class: "nuz-lab-head", style: { marginTop: "10px" } }, "🕰 The teams of the ages") : null,
      ].concat(retired.map((era) => el("div", {}, [
        el("div", { class: "hint" }, "— " + era.region + " —"),
        el("div", { class: "nuz-box-grid" }, (era.box || []).map((m) => boxMon(m))),
      ])))));
    }
    const R = regionByKey(newRegion) || REGIONS[0] || { name: "Kanto", prof: "Oak", gymN: 8, champ: "BLUE", starters: [1, 4, 7, 25], league: [] };
    const first = REGIONS[0] || R;
    const movie = newKind === "movie";
    const filmN = (window.MOVIE_BOSSES || []).length || 16;
    const starterIds = newKind === "master" ? ALL_STARTERS
      : newKind === "ages" || newKind === "trek" ? first.starters : R.starters;
    host.appendChild(el("div", { class: "safari-card nuz-lab" }, [
      el("div", { class: "nuz-lab-head" }, movie ? "🎥 The Casting Call"
        : newKind === "master" ? "🧪 The Professors' Summit"
        : "🧪 Professor " + ((newKind === "ages" || newKind === "trek" ? first.prof : R.prof) || "Oak") + "'s Lab"),
      el("p", { class: "hint" }, movie
        ? "“Lights. Cameras. Permadeath. Six seats in the cast — and every legend on the reel is waiting at FULL power.”"
        : "“Every faint is forever in there. Choose your partner carefully — it's the only Pokémon you'll be given.”"),
      // Five structures: 🎯 a region's exclusive run on the classic curve,
      // 🎲 the same region with every trainer's team rerolled, 🌍 the master
      // gauntlet (all nine, randomized, one 14→100 curve), 🕰 the ages walk
      // (all nine, classic, curve + team resetting each generation), or 🎬
      // the movie marathon (drafted cast of 6 vs the filmography, no caps).
      el("div", { class: "dex-toggle" }, [
        el("button", { class: "btn sm" + (newKind === "classic" ? " primary" : " subtle"), onClick: () => { newKind = "classic"; Router.render(); } }, "🎯 Region Run"),
        el("button", { class: "btn sm" + (newKind === "random" ? " primary" : " subtle"), onClick: () => { newKind = "random"; Router.render(); } }, "🎲 Region Randomizer"),
        el("button", { class: "btn sm" + (newKind === "master" ? " primary" : " subtle"), onClick: () => { newKind = "master"; Router.render(); } }, "🌍 Master Randomizer"),
        el("button", { class: "btn sm" + (newKind === "ages" ? " primary" : " subtle"), onClick: () => { newKind = "ages"; Router.render(); } }, "🕰 Through the Ages"),
        el("button", { class: "btn sm" + (newKind === "trek" ? " primary" : " subtle"), onClick: () => { newKind = "trek"; Router.render(); } }, "🎒 The Long Walk"),
        el("button", { class: "btn sm" + (movie ? " primary" : " subtle"), onClick: () => { newKind = "movie"; Router.render(); } }, "🎬 Movie Marathon"),
      ]),
      newKind === "master"
        ? el("p", { class: "hint" }, "🌍 ALL NINE REGIONS in canon order — every gym, every Elite Four, every Champion (RED included): 114 battles on one Lv 14→100 curve, every team randomized, permadeath the whole way. The ultimate run.")
        : newKind === "ages"
          ? el("p", { class: "hint" }, "🕰 The whole saga, generation by generation: all nine regions with their CANON leaders, and the level curve resets to 14 at every border — because your TEAM does too. Each new region, the box retires to the professor and a fresh regional starter begins the next era. Nine generations, nine teams, one unbroken journey — and at the very end, the road leads home: PROFESSOR OAK waits in Pallet Town as the LAST BOSS.")
          : newKind === "trek"
            ? el("p", { class: "hint" }, "🎒 One team, nine regions: the level curve resets to 14 at every border, but your BOX walks the whole way — every catch, every scar, every survivor, Kanto to Paldea. Your veterans will bully each region's early gyms… and permadeath will spend nine regions collecting its toll. Classic leaders, RED on the road, GEETA at the end.")
            : movie
              ? el("p", { class: "hint" }, "🎬 The attrition epic: draft ANY six non-legendaries — that's the whole cast, full power, no level caps, no wild grass. Then the entire filmography rolls in release order: " + filmN + " films, every movie legend at full boss strength, MEWTWO on opening night. A beaten film's legend may join the cast — but only over a fallen seat.")
            : newKind === "random"
              ? el("p", { class: "hint" }, "🎲 One region — but every trainer you meet fields RANDOM Pokémon (era-appropriate, level-capped). A fresh gauntlet every run.")
              : el("p", { class: "hint" }, "🎯 One region, its canon leaders, the proven level curve — Lv 14 at gym 1 to the Champion at ~58."),
      newKind === "classic" || newKind === "random" ? el("div", { class: "nuz-regions" }, REGIONS.map((r) =>
        el("button", { class: "btn sm" + (newRegion === r.key ? " primary" : " subtle"), onClick: () => { newRegion = r.key; Router.render(); } }, r.emoji + " " + r.name))) : null,
      newKind === "master" ? el("p", { class: "hint" }, "A master run begins in Kanto — but the professors have gathered: choose ANY starter from the whole saga.") : null,
      newKind === "ages" || newKind === "trek" ? el("p", { class: "hint" }, "The journey begins where it all began — Gen 1, Professor Oak's lab.") : null,
      movie
        ? el("div", { class: "safari-actions" }, [
            el("button", { class: "btn primary spin-btn", onClick: () => draftCast() }, "🎥 Hold the casting call — draft your 6"),
          ])
        : el("div", { class: "nuz-starters" }, starterIds.map((id) =>
          el("button", { class: "nuz-starter", onClick: () => {
            const label = newKind === "master" ? "🌍 MASTER RANDOMIZER (all nine regions!)"
              : newKind === "ages" ? "🕰 THROUGH THE AGES (nine generations, a fresh team each era!)"
              : newKind === "trek" ? "🎒 LONG WALK (one team through all nine regions!)"
              : R.name + (newKind === "random" ? " 🎲 RANDOMIZER" : "") + " Nuzlocke";
            if (!confirm("Start a " + label + " run with " + monName(id) + "? Permadeath is ON — no take-backs.")) return;
            Store.nuzStart(me, id, newKind === "random" || newKind === "master" ? "random" : "",
              newKind === "master" ? "master" : newKind === "ages" ? "ages" : newKind === "trek" ? "trek" : newRegion);
            wildId = 0; sfx("fanfare"); Router.render();
          } }, [
            Store.sprite(id) ? el("img", { src: Store.sprite(id), alt: monName(id) }) : el("span", { class: "tc-ball-fallback" }),
            el("span", { class: "nuz-starter-n" }, monName(id)),
          ]))),
      el("div", { class: "nuz-rules" }, [
        el("div", {}, "📜 House rules:"),
        movie ? null : el("div", {}, "• Catch wilds by BATTLING them — weaken, then throw mid-fight. KO it and it's lost."),
        el("div", {}, "• Any of your Pokémon that faints is dead for the rest of the run."),
        el("div", {}, newKind === "master"
          ? "• Nine regions in canon order: 68 gyms, nine leagues, RED on Mt. Silver — the LAST Champion crowns the MASTER."
          : newKind === "ages"
            ? "• Nine regions in canon order, canon teams — and at every generation border your WHOLE box retires to the professor. New region, new starter, new team, Lv 14 again. After the last Champion, one road remains: PROFESSOR OAK in Pallet Town — beat the LAST BOSS to be crowned TRAINER OF THE AGES."
            : newKind === "trek"
              ? "• Nine regions in canon order, canon teams, the curve resetting to 14 at every border — but your box NEVER resets. One team walks the whole saga (RED included); GEETA crowns THE LONG WALK."
              : movie
              ? "• " + filmN + " films in release order, every boss at FULL power. No catching — the only reinforcements are co-star legends, and only a death opens their seat. Survive the whole reel for the MARATHON PREMIERE."
              : "• " + R.gymN + " " + R.name + " gyms in order → the " + R.name + " Elite Four → Champion " + R.champ + " = the crown" + (R.peak ? " (then RED on Mt. Silver, if you dare)" : "") + "."),
        el("div", {}, movie
          ? "• The crown board still counts the cast: fewest recruits (and fewest tombstones) is the flex."
          : "• Catch as many as you want… but the crown board ranks by FEWEST catches."),
      ]),
    ]));
  }

  // ── Screen 2: the live run ─────────────────────────────────────────────────
  function renderRun(host, run) {
    const gateR = agesGate(run);
    const movie = run.region === "movie";
    if (movie) renderMovieHead(host, run);
    else if (run.region) renderRegionHead(host, run);
    else renderActHead(host, run);
    renderBoxCard(host, run);
    if (gateR) {
      // 🕰 A generation border: no grass, no battles — the professor first.
      renderAgesGate(host, run, gateR);
    } else {
      if (!movie) renderGrass(host, run);         // 🎬 no wild grass on a film set
      if (movie) renderMovieNext(host, run);
      else if (run.region) renderRegionNext(host, run);
      else renderActNext(host, run);
      // 🎉 Any evolutions unlocked by the current level cap? Offer them all.
      setTimeout(() => { const r = Store.nuzRun(me); if (r && !r.over) checkEvolutions(r); }, 450);
    }

    // Bail-out (tombstones the run; a new start replaces it).
    host.appendChild(el("div", { class: "safari-actions nuz-abandon" }, [
      el("button", { class: "btn subtle sm", onClick: () => {
        if (!confirm("Abandon this Nuzlocke run? It ends here — badges, box and all.")) return;
        Store.nuzAbandon(me); wildId = 0; sfx("error"); Router.render();
      } }, "🏳️ Abandon run"),
    ]));
  }

  // Banner + progress strip for LEGACY act runs (Kanto Act I → Johto Act II).
  function renderActHead(host, run) {
    const act = run.act === 2 ? 2 : 1;
    const kBadges = run.badges.filter((i) => i >= KANTO_GYM0).length;
    const jBadges = run.badges.filter((i) => i < KANTO_GYM0).length;

    // 🗻 Act II banner — the crown is banked; Johto (and RED) are optional glory.
    if (act === 2) {
      host.appendChild(el("div", { class: "safari-card nuz-act2" }, [
        el("div", { class: "nuz-lab-head" }, "🗻 ACT II — THE JOHTO RUN"),
        el("p", { class: "hint" }, "You're already a Nuzlocke CHAMPION (it's in the Hall of Fame). Now Gen 2 roams the grass, 8 Johto gyms stand in order… and RED waits on Mt. Silver. Or retire with the crown."),
        el("div", { class: "safari-actions" }, [
          el("button", { class: "btn subtle sm", onClick: () => {
            if (!confirm("Retire as Nuzlocke Champion? The run ends here — RED keeps waiting.")) return;
            Store.nuzRetire(me); wildId = 0; Router.render();
          } }, "👑 Retire as Champion"),
        ]),
      ]));
    }

    host.appendChild(el("div", { class: "safari-stats" }, [
      act === 1 ? stat("🏅 " + kBadges + "/8", "Kanto badges") : stat("🏅 " + jBadges + "/8", "Johto badges"),
      act === 1 ? stat("👑 " + run.league.length + "/5", "League stages") : stat("🗻 " + (run.league.indexOf("red") >= 0 ? "1" : "0") + "/1", "Mt. Silver"),
      stat((run.mode === "random" ? "🎲 " : "📈 ") + "Lv " + runLevel(run), run.mode === "random" ? "Randomizer" : "Run level"),
      stat(run.catches, "Caught"),
      stat("🪦 " + run.deaths, "Lost forever"),
    ]));
  }

  // Banner + progress strip for REGION, MASTER and AGES runs.
  function renderRegionHead(host, run) {
    const master = run.region === "master";
    const ages = run.region === "ages";
    const R = curRegion(run);
    const gymsDone = R ? run.badges.filter((i) => i >= R.gym0 && i < R.gym0 + R.gymN).length : 0;
    const leagueDone = R ? R.league.filter((k) => run.league.indexOf(k) >= 0).length : 0;

    if (master) {
      host.appendChild(el("div", { class: "safari-card nuz-act2" }, [
        el("div", { class: "nuz-lab-head" }, "🌍 MASTER RANDOMIZER — Region " + (REGIONS.indexOf(R) + 1) + "/9: " + (R ? R.emoji + " " + R.name : "")),
        el("p", { class: "hint" }, "Every gym, every Elite Four, every Champion across all nine regions — " +
          doneCount(run) + "/" + seqFor(run).length + " battles down, randomized teams all the way, permadeath from the first step to the last."),
      ]));
    } else if (ages) {
      const teamN = 1 + ((run.retired || []).length);
      host.appendChild(el("div", { class: "safari-card nuz-act2" }, [
        el("div", { class: "nuz-lab-head" }, "🕰 THROUGH THE AGES — Gen " + (R ? R.gen : "?") + "/9: " + (R ? R.emoji + " " + R.name : "")),
        el("p", { class: "hint" }, "The whole saga, one generation at a time — team #" + teamN + " carries the torch, " +
          doneCount(run) + "/" + seqFor(run).length + " battles down. At every border the box retires and a new era begins at Lv 14. Permadeath never retires."),
      ]));
    } else if (run.region === "trek") {
      host.appendChild(el("div", { class: "safari-card nuz-act2" }, [
        el("div", { class: "nuz-lab-head" }, "🎒 THE LONG WALK — Gen " + (R ? R.gen : "?") + "/9: " + (R ? R.emoji + " " + R.name : "")),
        el("p", { class: "hint" }, "One team, the whole saga — " + doneCount(run) + "/" + seqFor(run).length +
          " battles walked. The curve resets to Lv " + runLevel(run) + " here, but the box never resets: every survivor remembers every region, and permadeath is keeping score."),
      ]));
    } else if (run.crowned && !run.over) {
      // Johto region run, crown banked — RED is optional glory.
      host.appendChild(el("div", { class: "safari-card nuz-act2" }, [
        el("div", { class: "nuz-lab-head" }, "🗻 PAST THE CROWN — MT. SILVER"),
        el("p", { class: "hint" }, "You're already a Nuzlocke CHAMPION (it's in the Hall of Fame). RED waits at the peak for the Legend tier. Or retire with the crown."),
        el("div", { class: "safari-actions" }, [
          el("button", { class: "btn subtle sm", onClick: () => {
            if (!confirm("Retire as Nuzlocke Champion? The run ends here — RED keeps waiting.")) return;
            Store.nuzRetire(me); wildId = 0; Router.render();
          } }, "👑 Retire as Champion"),
        ]),
      ]));
    } else {
      host.appendChild(el("div", { class: "safari-card nuz-act2" }, [
        el("div", { class: "nuz-lab-head" }, (R ? R.emoji + " THE " + R.name.toUpperCase() + " RUN" : "") + (run.mode === "random" ? " — 🎲 RANDOMIZER" : "")),
      ]));
    }

    host.appendChild(el("div", { class: "safari-stats" }, [
      stat("🏅 " + gymsDone + "/" + (R ? R.gymN : 8), (R ? R.name : "") + " badges"),
      stat("👑 " + leagueDone + "/" + (R ? R.league.length : 5), "League stages"),
      master || ages || run.region === "trek" ? stat("⚔ " + doneCount(run) + "/" + seqFor(run).length, master ? "Gauntlet" : run.region === "trek" ? "The walk" : "The saga") : null,
      stat((run.mode === "random" ? "🎲 " : "📈 ") + "Lv " + runLevel(run), run.mode === "random" ? "Randomizer" : "Run level"),
      stat(run.catches, "Caught"),
      stat("🪦 " + run.deaths, "Lost forever"),
    ]));
  }

  // ── 🎬 The Movie Marathon ──────────────────────────────────────────────────
  // The casting call: draft ANY six non-legendary species — that's the cast.
  function draftCast() {
    const pool = Object.keys(DEX).map(Number)
      .filter((id) => id >= 1 && id <= 1025 && !DEX[id].leg);
    Duel.pickParty({ attId: me, min: 6, max: 6, pool: pool,
      title: "🎥 Casting call — draft your cast of SIX",
      hint: "Any six non-legendary species, full power, no level caps. This cast is ALL you get — legends only ever join over a fallen seat.",
      onDone: (ids) => {
        if (!ids || ids.length < 6) return;
        const names = ids.map((id) => monName(id)).join(", ");
        if (!confirm("Premiere the 🎬 MOVIE MARATHON with this cast — " + names + "? " + ((window.MOVIE_BOSSES || []).length || 16) + " films at full power, permadeath is ON — no take-backs.")) return;
        Store.nuzStartMovie(me, ids);
        wildId = 0; sfx("fanfare"); Router.render();
      } });
  }
  function nextFilm(run) {
    return (window.MOVIE_BOSSES || []).find((b) => run.league.indexOf(b.key) < 0) || null;
  }
  function renderMovieHead(host, run) {
    const REEL = window.MOVIE_BOSSES || [];
    const n = run.league.length;
    const b = nextFilm(run);
    host.appendChild(el("div", { class: "safari-card nuz-act2" }, [
      el("div", { class: "nuz-lab-head" }, "🎬 MOVIE MARATHON — Film " + Math.min(n + 1, REEL.length) + "/" + REEL.length + (b ? ": " + b.film : "")),
      el("p", { class: "hint" }, "The attrition epic: one drafted cast against every movie legend at FULL power — no level caps, no wild grass, no second takes. Only a fallen seat lets a film's legend join the cast."),
    ]));
    host.appendChild(el("div", { class: "safari-stats" }, [
      stat("🎬 " + n + "/" + REEL.length, "Films survived"),
      stat("🎭 " + run.box.filter((m) => !m.dead).length + "/6", "Cast standing"),
      stat("⭐ " + Math.max(0, run.catches - 6), "Co-stars"),
      stat("🪦 " + run.deaths, "Lost forever"),
    ]));
  }
  // NOW SHOWING — the next film on the reel, full billing.
  function renderMovieNext(host, run) {
    const next = el("div", { class: "safari-card nuz-next" });
    host.appendChild(next);
    const b = nextFilm(run);
    if (!b) { next.appendChild(el("div", { class: "nuz-lab-head" }, "🏁 The reel is empty — the marathon is complete!")); return; }
    next.appendChild(el("div", { class: "nuz-lab-head" }, b.icon + " NOW SHOWING — " + b.film));
    next.appendChild(el("p", { class: "hint" }, b.name + " · " + b.title + ". " + b.lead));
    next.appendChild(el("div", { class: "nuz-foe-row" }, b.team.map((id) =>
      Store.sprite(id) ? el("img", { class: "nuz-foe-img", src: Store.sprite(id), alt: monName(id) }) : null)));
    next.appendChild(el("div", { class: "enc-quote" }, "“" + b.quote + "”"));
    next.appendChild(el("div", { class: "safari-actions" }, [
      el("button", { class: "btn primary", onClick: () => battleMovie(run, b) }, "🎬 PREMIERE — face " + b.name),
    ]));
    next.appendChild(el("p", { class: "hint" }, "Full power on both sides of the screen, every faint forever. Win with a fallen seat in the cast, and the film's legend may step off the screen…"));
  }
  function battleMovie(run, b) {
    partyThen(run, 6, "🎬 " + b.film + " — vs " + b.name,
      "Full power, no caps — and every faint is permanent.",
      (ids) => {
        Duel.start({ mode: "local",
          a: { units: [{ attId: me, monIds: ids, shiny: ownShiny(run, ids), shinyExact: true }] },
          b: { units: [{ npc: b.name, ai: true, monIds: b.team.slice(), glyphs: b.glyphs || null, boost: b.boost, shiny: b.shiny || false, vsFace: b.vsFace || null }] },
          nuzlocke: { onEnd: (fainted, winSide) => {
            Store.nuzDeaths(me, fainted || []);
            if (winSide === "a") { Store.nuzStage(me, b.key); sfx("fanfare"); offerCostar(b); }
            Router.render();
          } } });
      });
  }
  // 🌟 The co-star rule — fired after a film falls. Waits for the battle
  // screen to clear, then offers the film's legend IF a seat is open.
  function offerCostar(b) {
    const id = b.costar;
    if (!id) return;
    let tries = 0;
    (function whenClear() {
      if (++tries > 25 || !/^#\/nuzlocke/.test(location.hash)) return;
      if (document.querySelector(".battle, .modal-overlay, .league-intro")) { setTimeout(whenClear, 600); return; }
      const run = Store.nuzRun(me);
      if (!run || run.over || run.region !== "movie") return;
      if (run.box.some((m) => m.id === id) || run.box.filter((m) => !m.dead).length >= 6) return;
      let ctrl;
      const body = el("div", { class: "modal-form" }, [
        el("p", { class: "hint" }, "🌟 THE CO-STAR RULE — there's an empty seat in the cast, and the legend of " + b.film + " steps off the screen to fill it."),
        Store.sprite(id) ? el("img", { class: "evo-prompt-img", src: Store.sprite(id), alt: "", style: { display: "block", margin: "0 auto" } }) : null,
        el("div", { class: "nuz-lab-head", style: { textAlign: "center" } }, monName(id)),
        el("div", { class: "toolbar", style: { justifyContent: "center" } }, [
          el("button", { class: "btn primary", onClick: () => { ctrl.close(); Store.nuzRecruit(me, id, b.film); sfx("fanfare"); Router.render(); } }, "🌟 Welcome to the cast"),
          el("button", { class: "btn subtle", onClick: () => ctrl.close() }, "Decline — the moment passes"),
        ]),
      ]);
      ctrl = Modal.open("🌟 A co-star steps forward!", body, null, { noFooter: true });
    })();
  }

  // 🕰 The generation border — the emotional center of the ages walk. The
  // old team (tombstones and all) retires to the professor who watched it
  // grow; three new partners wait in the next region's lab. No grass, no
  // battles, until the choice is made.
  function renderAgesGate(host, run, R) {
    const prev = regionByKey(run.curRegion) || REGIONS[0];
    const alive = run.box.filter((m) => !m.dead).length;
    host.appendChild(el("div", { class: "safari-card nuz-lab" }, [
      el("div", { class: "nuz-lab-head" }, "🛳 GEN " + R.gen + " — " + R.emoji + " " + R.name.toUpperCase() + " AWAITS"),
      el("p", { class: "hint" }, "The " + (prev ? prev.name : "") + " chapter is closed. Your team — " + alive + " standing, every tombstone honored — retires to Professor " + (prev ? prev.prof : "Oak") + "'s ranch, safe forever. Across the water, Professor " + R.prof + " has three new partners waiting… and the level curve starts over at 14."),
      el("div", { class: "nuz-starters" }, R.starters.map((id) =>
        el("button", { class: "nuz-starter", onClick: () => {
          if (!confirm("Leave the whole team with Professor " + (prev ? prev.prof : "Oak") + " and begin " + R.name + " with " + monName(id) + "? The box resets — permadeath stays ON.")) return;
          Store.nuzNewRegion(me, id, R.key);
          wildId = 0; sfx("fanfare"); Router.render();
        } }, [
          Store.sprite(id) ? el("img", { src: Store.sprite(id), alt: monName(id) }) : el("span", { class: "tc-ball-fallback" }),
          el("span", { class: "nuz-starter-n" }, monName(id)),
        ]))),
      el("p", { class: "hint" }, "⚠️ A new generation, a new nuzlocke: " + R.gymN + " gyms from Lv 14, the " + R.name + " league — same rules, fresh grass, fewest catches still wears the crown."),
    ]));
  }

  function renderBoxCard(host, run) {
    const alive = run.box.filter((m) => !m.dead);
    host.appendChild(el("div", { class: "safari-card nuz-boxcard" }, [
      el("div", { class: "nuz-lab-head" }, (run.region === "movie" ? "🎭 The cast — " : "📦 The box — ") + alive.length + " standing"),
      el("div", { class: "nuz-box-grid" }, run.box.map((m) => boxMon(m, run))),
    ]));
  }

  // The grass — wild catches (battle-only). Every stretch of road holds
  // only ENC_PER_ERA encounters, each roll burns one (no re-rolls), and a
  // species met once never appears again.
  function renderGrass(host, run) {
    const grass = el("div", { class: "safari-card nuz-grass" });
    host.appendChild(grass);
    const left = encLeft(run);
    if (!wildId) {
      grass.appendChild(el("div", { class: "nuz-lab-head" }, "🌿 Tall grass — " +
        (left ? "👣 " + left + "/" + ENC_PER_ERA + " encounters left on this road" : "trampled flat")));
      if (left > 0) {
        grass.appendChild(el("div", { class: "safari-actions" }, [
          el("button", { class: "btn spin-btn", onClick: () => {
            const id = rollWild(run);
            if (!id) { alert("The grass is quiet — every species on this road has already been met."); return; }
            Store.nuzEncounter(me, id, eraKey(run));
            // ✨ the run rolls its OWN shinies — same 1-in-16 as the Safari.
            wildShiny = Math.random() < 1 / 16 ? 1 : 0;
            wildId = id; sfx(wildShiny ? "fanfare" : "blip"); renderKeepScroll();
          } }, "👣 Walk in the grass"),
        ]));
        grass.appendChild(el("p", { class: "hint" }, "Recruits are caught by battling — and battles can cost lives. ⚠️ Each walk burns an encounter (running away too), a species met once NEVER returns, and only Pokémon at home under the Lv " + runLevel(run) + " cap roam here."));
      } else {
        grass.appendChild(el("p", { class: "hint" }, "🚧 No wild Pokémon left on the road to the next badge — win it to reach fresh grass (" + ENC_PER_ERA + " new encounters)."));
      }
    } else {
      const wSrc = (wildShiny && (window.DEX_SPRITES_SHINY || {})[wildId]) || Store.sprite(wildId);
      grass.appendChild(el("div", { class: "nuz-lab-head" }, wildShiny
        ? "✨ A SHINY wild " + monName(wildId) + " appeared!!"
        : "🌿 A wild " + monName(wildId) + " appeared!"));
      grass.appendChild(el("div", { class: "nuz-wild-row" }, [
        wSrc ? el("img", { class: "nuz-wild-img" + (wildShiny ? " is-shiny" : ""), src: wSrc, alt: monName(wildId) }) : null,
        el("div", { class: "nuz-wild-meta" }, [
          el("div", {}, "Base catch " + Math.round(catchBase(wildId) * 100) + "% — weakening it adds up to +65%."),
          wildShiny ? el("div", { class: "hint" }, "✨ ONE in SIXTEEN — and in a nuzlocke it can still faint, or walk away forever. No pressure.") : null,
          el("div", { class: "hint" }, "⚠️ Bring up to 3. Anyone who faints in there is gone for good."),
        ]),
      ]));
      grass.appendChild(el("div", { class: "safari-actions" }, [
        el("button", { class: "btn primary", onClick: () => battleWild(run) }, "⚔ Battle to catch"),
        el("button", { class: "btn subtle", onClick: () => { wildId = 0; wildShiny = 0; renderKeepScroll(); } }, "Run away"),
      ]));
    }
  }

  // Next battle for LEGACY act runs: Kanto gym → Kanto E4 → Johto gym → RED.
  function renderActNext(host, run) {
    const act = run.act === 2 ? 2 : 1;
    const kBadges = run.badges.filter((i) => i >= KANTO_GYM0).length;
    const jBadges = run.badges.filter((i) => i < KANTO_GYM0).length;
    const next = el("div", { class: "safari-card nuz-next" });
    host.appendChild(next);
    if (act === 1 && kBadges < 8) {
      const idx = KANTO_GYM0 + kBadges;
      const g = gymAt(idx);
      const hc = gymHandicap(run);
      next.appendChild(el("div", { class: "nuz-lab-head" }, "🏟 Gym " + (kBadges + 1) + "/8 — Leader " + (g ? g.leader : "?")));
      if (g) {
        next.appendChild(el("div", { class: "nuz-foe-row" }, foeTeam(run, g.team, Math.min(g.team.length, hc.size), "gym" + idx, gymAce(g)).map((id) =>
          Store.sprite(id) ? el("img", { class: "nuz-foe-img", src: Store.sprite(id), alt: monName(id) }) : null)));
        next.appendChild(el("div", { class: "safari-actions" }, [
          el("button", { class: "btn primary", onClick: () => battleGym(run, idx, g) }, "⚔ Challenge " + g.leader),
        ]));
        next.appendChild(el("p", { class: "hint" }, "Gyms fall IN ORDER — no skipping ahead. And villains prowl the roads between them…"));
      }
    } else if (act === 1) {
      const key = KANTO_E4[run.league.length];
      const st = key && stageFor(key);
      next.appendChild(el("div", { class: "nuz-lab-head" }, "👑 Victory Road — " + run.league.length + "/5"));
      if (st) {
        next.appendChild(el("div", { class: "nuz-foe-row" }, foeTeam(run, st.team, st.team.length, "stage-" + st.key).map((id) =>
          Store.sprite(id) ? el("img", { class: "nuz-foe-img", src: Store.sprite(id), alt: monName(id) }) : null)));
        next.appendChild(el("div", { class: "safari-actions" }, [
          el("button", { class: "btn primary", onClick: () => battleStage(run, st) }, "⚔ Battle " + st.rank + " " + st.name),
        ]));
        next.appendChild(el("p", { class: "hint" }, key === "blue" ? "Beat BLUE and the crown is yours — and then Johto opens for the LEGEND tier." : "The Kanto Elite Four stands between you and BLUE."));
      }
    } else if (jBadges < 8) {
      const idx = JOHTO_GYM0 + jBadges;
      const g = gymAt(idx);
      next.appendChild(el("div", { class: "nuz-lab-head" }, "🏟 Johto Gym " + (jBadges + 1) + "/8 — Leader " + (g ? g.leader : "?")));
      if (g) {
        const hc2 = gymHandicap(run);
        next.appendChild(el("div", { class: "nuz-foe-row" }, foeTeam(run, g.team, Math.min(g.team.length, hc2.size), "gym" + idx, gymAce(g)).map((id) =>
          Store.sprite(id) ? el("img", { class: "nuz-foe-img", src: Store.sprite(id), alt: monName(id) }) : null)));
        next.appendChild(el("div", { class: "safari-actions" }, [
          el("button", { class: "btn primary", onClick: () => battleGym(run, idx, g) }, "⚔ Challenge " + g.leader),
        ]));
        next.appendChild(el("p", { class: "hint" }, "Eight more, in order — the mountain only answers a 16-badge trainer."));
      }
    } else {
      const st = stageFor("red");
      next.appendChild(el("div", { class: "nuz-lab-head" }, "🗻 MT. SILVER — the silent one"));
      if (st) {
        next.appendChild(el("div", { class: "nuz-foe-row" }, foeTeam(run, st.team, st.team.length, "stage-red").map((id) =>
          Store.sprite(id) ? el("img", { class: "nuz-foe-img", src: Store.sprite(id), alt: monName(id) }) : null)));
        next.appendChild(el("div", { class: "safari-actions" }, [
          el("button", { class: "btn primary", onClick: () => battleStage(run, st) }, "⚔ Climb — battle RED"),
        ]));
        next.appendChild(el("p", { class: "hint" }, "The final battle of the run. Beat RED with permadeath on and you're a NUZLOCKE LEGEND."));
      }
    }
  }

  // Next battle for REGION and MASTER runs — driven by the sequence.
  function renderRegionNext(host, run) {
    const next = el("div", { class: "safari-card nuz-next" });
    host.appendChild(next);
    const step = nextStep(run);
    if (!step) { next.appendChild(el("div", { class: "nuz-lab-head" }, "🏁 Nothing left to fight — the run is complete!")); return; }
    const R = step.R;
    const master = run.region === "master";
    if (step.t === "gym") {
      const idx = step.idx;
      const g = gymAt(idx);
      const n = idx - R.gym0 + 1;
      const hc = gymHandicap(run);
      next.appendChild(el("div", { class: "nuz-lab-head" }, "🏟 " + R.name + " Gym " + n + "/" + R.gymN + " — Leader " + (g ? g.leader : "?")));
      if (g) {
        next.appendChild(el("div", { class: "nuz-foe-row" }, foeTeam(run, g.team, Math.min(g.team.length, hc.size), "gym" + idx, gymAce(g)).map((id) =>
          Store.sprite(id) ? el("img", { class: "nuz-foe-img", src: Store.sprite(id), alt: monName(id) }) : null)));
        next.appendChild(el("div", { class: "safari-actions" }, [
          el("button", { class: "btn primary", onClick: () => battleGym(run, idx, g) }, "⚔ Challenge " + g.leader),
        ]));
        next.appendChild(el("p", { class: "hint" }, master
          ? "The master road runs through EVERY gym in the saga — and villains prowl the stretches between them…"
          : "Gyms fall IN ORDER — no skipping ahead. And villains prowl the roads between them…"));
      }
      return;
    }
    const ages = run.region === "ages";
    // 🔬 THE LAST BOSS — Pallet Town. Only the ages walk comes back here.
    if (step.oak) {
      const ok = oakStage();
      next.appendChild(el("div", { class: "nuz-lab-head" }, "🔬 PALLET TOWN — where it all began"));
      next.appendChild(el("p", { class: "hint" }, "Nine regions. Nine teams. Every Champion has fallen — and the road ends at a small lab in Pallet Town. The professor who handed over the very first partner has watched the whole journey… and he asks for one last battle."));
      next.appendChild(el("div", { class: "nuz-foe-row" }, foeTeam(run, ok.team, ok.team.length, "stage-oak").map((id) =>
        Store.sprite(id) ? el("img", { class: "nuz-foe-img", src: Store.sprite(id), alt: monName(id) }) : null)));
      ok.quote ? next.appendChild(el("div", { class: "enc-quote" }, "“" + ok.quote + "”")) : null;
      next.appendChild(el("div", { class: "safari-actions" }, [
        el("button", { class: "btn primary", onClick: () => battleStage(run, ok) }, "⚔ THE LAST BOSS — battle PROF. OAK"),
      ]));
      next.appendChild(el("p", { class: "hint" }, "Beat him and the TRAINER OF THE AGES crown is yours — permadeath to the very last turn."));
      return;
    }
    const st = stageFor(step.key);
    if (step.peak) {
      next.appendChild(el("div", { class: "nuz-lab-head" }, "🗻 MT. SILVER — the silent one"));
      if (st) {
        next.appendChild(el("div", { class: "nuz-foe-row" }, foeTeam(run, st.team, st.team.length, "stage-red").map((id) =>
          Store.sprite(id) ? el("img", { class: "nuz-foe-img", src: Store.sprite(id), alt: monName(id) }) : null)));
        next.appendChild(el("div", { class: "safari-actions" }, [
          el("button", { class: "btn primary", onClick: () => battleStage(run, st) }, "⚔ Climb — battle RED"),
        ]));
        next.appendChild(el("p", { class: "hint" }, master
          ? "The silent one guards the road out of Johto — the master gauntlet goes THROUGH him."
          : ages
            ? "The last page of Gen 2 — the ages walk goes THROUGH him, with the team that grew up here."
            : run.region === "trek"
              ? "The silent one guards the road out of Johto — the long walk goes THROUGH him."
              : "The final battle of the run. Beat RED with permadeath on and you're a NUZLOCKE LEGEND."));
      }
      return;
    }
    const li = R.league.indexOf(step.key);
    next.appendChild(el("div", { class: "nuz-lab-head" }, "👑 " + R.name + " League — " + li + "/" + R.league.length));
    if (st) {
      next.appendChild(el("div", { class: "nuz-foe-row" }, foeTeam(run, st.team, st.team.length, "stage-" + st.key).map((id) =>
        Store.sprite(id) ? el("img", { class: "nuz-foe-img", src: Store.sprite(id), alt: monName(id) }) : null)));
      next.appendChild(el("div", { class: "safari-actions" }, [
        el("button", { class: "btn primary", onClick: () => battleStage(run, st) }, "⚔ Battle " + st.rank + " " + st.name),
      ]));
      const trek = run.region === "trek";
      const isFinal = (master || ages || trek) && R === REGIONS[REGIONS.length - 1] && step.key === R.champKey;
      next.appendChild(el("p", { class: "hint" }, isFinal
        ? (master
          ? "THE FINAL BATTLE of the master gauntlet — beat " + st.name + " and every trainer in the saga has fallen to one box."
          : trek
            ? "THE LAST BATTLE of the long walk — beat " + st.name + " and ONE TEAM has carried the whole saga, border to border."
            : "Beat " + st.name + " and every league in the saga has fallen — then one last road: home to Pallet Town, where PROFESSOR OAK waits.")
        : step.key === R.champKey
          ? (master ? "Beat the Champion and the next region opens — the gauntlet rolls on."
            : ages ? "Beat the Champion and Gen " + R.gen + " closes — a new generation (and a brand-new team) waits at the border."
            : trek ? "Beat the Champion and the next region opens — same team, fresh Lv 14 curve, permadeath still counting."
            : "Beat the Champion and the crown is yours" + (R.peak ? " — then Mt. Silver calls." : "."))
          : "The " + R.name + " Elite Four stands between you and the Champion."));
    }
  }

  function stat(v, l) { return el("div", { class: "safari-stat" }, [el("div", { class: "safari-stat-v" }, String(v)), el("div", { class: "safari-stat-l" }, l)]); }
  function boxMon(m, run) {
    // A living mon past its evolution level wears a ⬆ button (for the ones
    // who said "not now" — or missed the prompt).
    const canEvo = run && !run.over && evoTargetsFor(m, run).length > 0;
    const src = (m.shiny && (window.DEX_SPRITES_SHINY || {})[m.id]) || Store.sprite(m.id);
    return el("div", { class: "nuz-mon" + (m.dead ? " dead" : ""), title: monName(m.id) + (m.shiny ? " ✨ SHINY" : "") + (m.dead ? " — RIP" : "") }, [
      src ? el("img", { src: src, alt: monName(m.id) }) : el("span", { class: "tc-ball-fallback" }),
      m.shiny ? el("span", { class: "nuz-shiny-tag" }, "✨") : null,
      m.dead ? el("span", { class: "nuz-rip" }, "🪦") : null,
      canEvo ? el("button", { class: "nuz-evo-btn", title: "Ready to evolve!", onClick: () => promptEvolve(run) }, "⬆") : null,
      el("span", { class: "nuz-mon-n" }, monName(m.id)),
    ]);
  }

  // 🎉 THE EVOLUTION CHECK — one modal for the WHOLE box. Every living mon
  // past its evolution level gets a row: tap to evolve (instant, with the
  // fanfare — no full cinematic; there can be a lot of these at once), or
  // leave it be. Closing the modal Everstones whatever's left (no more
  // nagging, but each box card keeps its ⬆ to change your mind later).
  function promptEvolve(run) {
    if (evoOpen || !run || run.over) return;
    const eligible = run.box.filter((x) => !x.dead && evoTargetsFor(x, run).length);
    if (!eligible.length) return;
    evoOpen = true;
    let ctrl;
    const acted = {};                        // box slots already evolved here
    const settle = () => {
      // Whatever wasn't touched holds its Everstone — the auto-check stays quiet.
      eligible.forEach((m, i) => { if (!acted[i] && !m.dead) { try { Store.nuzNoEvo(me, m.id); } catch (_) {} } });
      evoOpen = false; Router.render();
    };
    const rows = eligible.map((m, i) => {
      const targets = evoTargetsFor(m, run);
      const row = el("div", { class: "nuz-evocheck-row" });
      const evolveTo = (to) => {
        if (acted[i]) return;
        acted[i] = 1;
        const before = m.id;
        Store.nuzEvolve(me, before, to);
        sfx("fanfare");
        row.innerHTML = "";
        row.classList.add("done");
        row.appendChild(el("img", { class: "evo-opt-img", src: Store.sprite(before) || "", alt: "" }));
        row.appendChild(el("span", { class: "nuz-evocheck-arrow" }, "➜"));
        row.appendChild(el("img", { class: "evo-prompt-img", src: Store.sprite(to) || "", alt: "" }));
        row.appendChild(el("span", { class: "nuz-evocheck-note" }, "✨ " + monName(before) + " evolved into " + monName(to) + "!"));
      };
      row.appendChild(Store.sprite(m.id) ? el("img", { class: "evo-prompt-img", src: Store.sprite(m.id), alt: "" }) : el("span", {}, "◓"));
      row.appendChild(el("div", { class: "nuz-evocheck-body" }, [
        el("div", { class: "nuz-evocheck-name" }, monName(m.id)),
        el("div", { class: "toolbar", style: { flexWrap: "wrap" } }, targets.map((t) =>
          el("button", { class: "btn primary sm", onClick: () => evolveTo(t.to) }, [
            Store.sprite(t.to) ? el("img", { class: "evo-opt-img", src: Store.sprite(t.to), alt: "" }) : null,
            " " + monName(t.to) + " (Lv " + t.lvl + ")",
          ]))),
      ]));
      return row;
    });
    const body = el("div", { class: "modal-form" }, [
      el("p", { class: "hint" }, "🎉 The run has reached Lv " + runLevel(run) + " — " +
        (eligible.length > 1 ? eligible.length + " Pokémon in the box are" : monName(eligible[0].id) + " is") +
        " past an evolution level! Evolve them now, or close to hold Everstones (the ⬆ on each box card stays)."),
      el("div", { class: "nuz-evocheck-list" }, rows),
      el("div", { class: "toolbar", style: { justifyContent: "center" } }, [
        el("button", { class: "btn primary", onClick: () => ctrl.close() }, "Done"),
      ]),
    ]);
    ctrl = Modal.open("🎉 Evolution check!", body, null, { noFooter: true, onClose: settle });
  }
  // Auto-run the evolution check — never over a battle or modal; if one's up
  // (the gym win is still playing out), keep checking until the screen
  // clears, then pop the moment. Only mons that haven't declined count.
  function checkEvolutions(run, tries) {
    if (evoOpen || !/^#\/nuzlocke/.test(location.hash)) return;
    if (document.querySelector(".battle, .modal-overlay, .evo-stage")) {
      if ((tries || 0) < 40) setTimeout(() => checkEvolutions(null, (tries || 0) + 1), 700);
      return;
    }
    const r = Store.nuzRun(me);
    if (!r || r.over) return;
    const fresh = r.box.some((x) => !x.dead && !x.noEvo && evoTargetsFor(x, r).length);
    if (fresh) promptEvolve(r);
  }

  // ── Battles — all report to the RUN, never the real ladder ────────────────
  // ✨ Only the RUN's own shiny catches sparkle in run battles (shinyExact
  // stops the Safari collection from leaking its palettes in here).
  function ownShiny(run, ids) {
    return run.box.filter((m) => !m.dead && m.shiny && ids.indexOf(m.id) >= 0).map((m) => m.id);
  }
  function partyThen(run, maxSize, title, hint, go) {
    const alive = Store.nuzAlive(me);
    if (!alive.length) return;
    Duel.pickParty({ attId: me, min: 1, max: Math.min(maxSize, alive.length), pool: alive,
      title: title, hint: hint, onDone: go });
  }

  function battleWild(run) {
    const id = wildId;
    if (!id) return;
    const base = catchBase(id);
    partyThen(run, 3, "⚔ vs wild " + monName(id) + " — up to 3",
      "Weaken it, then 🔴 Throw Ball mid-battle. KO = catch lost. Faints are FOREVER.",
      (ids) => {
        const shiny = wildShiny;
        Duel.start({ mode: "local", broadcast: false, level: runLevel(run),
          a: { units: [{ attId: me, monIds: ids, shiny: ownShiny(run, ids), shinyExact: true }] },
          b: { units: [{ npc: (shiny ? "✨ Shiny wild " : "Wild ") + monName(id), ai: true, monIds: [id], shiny: shiny ? [id] : false }] },
          wild: {
            chanceFn: (frac) => Math.min(1, base + (1 - frac) * 0.65),
            onOutcome: (outcome, fainted) => {
              Store.nuzDeaths(me, fainted || []);
              if (outcome === "caught") { Store.nuzCatch(me, id, shiny); sfx("fanfare"); }
              else sfx("error");
              wildId = 0; wildShiny = 0; Router.render();
            },
          } });
      });
  }

  // The run's difficulty CURVE: a fresh box is a Squirtle and a Pidgey, so
  // early leaders meet you halfway — 3 mons at ~70% strength — and ramp to
  // their full squad at full power by the last badge.
  // Gym scaling, SPLIT since devolution took over the stat curve:
  //  - size: matches the encounter economy (a badge-1 box is 2-4 mons).
  //  - support ×0.9 flat: the devolved fodder is already Squirtle-tier —
  //    let it actually land hits instead of double-discounting it.
  //  - ace on the 0.72→1.0 curve: the leader's REAL, undevolved ace is
  //    the boss moment, and this is what keeps a cap-14 Steelix beatable.
  // Region runs ride the SAME proven curve (Alola's four kahunas stride it
  // double); the master gauntlet ramps on OVERALL progress instead — full
  // size by the Kanto league, full strength by mid-Johto, then a hair past.
  function gymHandicap(run) {
    if (run.region === "master") {
      const done = doneCount(run);
      return { size: Math.min(6, 3 + Math.floor(done / 3)),
        boost: Math.min(1.1, 0.72 + done * 0.02),
        support: Math.min(1.1, 0.9 + done * 0.01) };
    }
    if (regionReset(run)) {
      // The leader curve resets with the region (ages: fresh box earns it;
      // trek: the veteran box gets a soft landing, the ACE still ramps).
      const R = curRegion(run) || REGIONS[0];
      const g = run.badges.filter((i) => i >= R.gym0 && i < R.gym0 + R.gymN).length;
      const step = Math.min(7, g * (R.gymN === 4 ? 2 : 1));
      return { size: 3 + Math.floor(step / 2), boost: 0.72 + step * 0.04, support: 0.9 };
    }
    if (run.region) {
      const R = regionByKey(run.region);
      const step = Math.min(7, run.badges.length * (R && R.gymN === 4 ? 2 : 1));
      return { size: 3 + Math.floor(step / 2), boost: 0.72 + step * 0.04, support: 0.9 };
    }
    const act = run.act === 2 ? 2 : 1;
    const step = act === 1
      ? run.badges.filter((i) => i >= KANTO_GYM0).length
      : run.badges.filter((i) => i < KANTO_GYM0).length;      // 0..7
    if (act === 1) return { size: 3 + Math.floor(step / 2), boost: 0.72 + step * 0.04, support: 0.9 };
    const b2 = 0.95 + step * 0.02;                             // act II: uniform (no devolution overlap)
    return { size: 6, boost: b2, support: b2 };
  }
  // Per-mon boost array: everyone at the support rate, the ace (always last)
  // on the ace curve.
  function gymBoosts(team, hc) {
    return team.map((_, i) => (i === team.length - 1 ? hc.boost : (hc.support || hc.boost)));
  }
  // League-stage strength for region-aware runs: the canon Kanto ramp
  // (1.1 → 1.18 at the Champion, RED at 1.25) instead of the real ladder's
  // late-gen 1.5s — a nuzlocke box earns its stats the hard way. The master
  // gauntlet adds a shade per region crossed (its box has grown too).
  const E4_RAMP = [1.1, 1.1, 1.12, 1.14, 1.18];
  function stageBoost(run, st) {
    if (!run.region) return st.boost || 1.1;
    const R = REGIONS.find((x) => x.league.indexOf(st.key) >= 0 || x.peak === st.key);
    if (!R) return st.boost || 1.1;
    const base = st.key === R.peak ? 1.25 : E4_RAMP[Math.max(0, R.league.indexOf(st.key))];
    if (run.region !== "master") return base;
    return Math.min(1.4, base + REGIONS.indexOf(R) * 0.02);
  }

  function battleGym(run, idx, g) {
    const hc = gymHandicap(run);
    const team = foeTeam(run, g.team, Math.min(g.team.length, hc.size), "gym" + idx, gymAce(g));
    partyThen(run, 6, "⚔ Nuzlocke gym — Leader " + g.leader,
      "Bring up to 6 of the living. Every faint in there is permanent.",
      (ids) => {
        Duel.start({ mode: "local", level: runLevel(run),
          a: { units: [{ attId: me, monIds: ids, shiny: ownShiny(run, ids), shinyExact: true }] },
          b: { units: [{ npc: "LEADER " + g.leader, ai: true,
            monIds: team, boost: gymBoosts(team, hc) }] },
          nuzlocke: { onEnd: (fainted, winSide) => {
            Store.nuzDeaths(me, fainted || []);
            if (winSide === "a") { Store.nuzBadge(me, idx); sfx("fanfare"); maybeAmbush(); }
            Router.render();
          } } });
      });
  }

  // ❗ Villains prowl the roads between Nuzlocke gyms (~28% after a win) —
  // same rogues' gallery as the main circuit, but HERE every faint is
  // forever. Region-aware runs only meet era-true villains (no Nemona
  // jumping a Kanto run). PROF. OAK never prowls: in a nuzlocke he's the
  // ages walk's LAST BOSS — the professor doesn't jump people on roads.
  // You can slip away… for a sip and a little shame.
  function ambushPool(run) {
    const all = (window.CANON_TRAINERS || []).filter((t) => t.name !== "PROF. OAK");
    if (!run || !run.region) return all;
    const R = curRegion(run);
    const gen = R ? R.gen : 9;
    const genOf = {}; REGIONS.forEach((x) => { genOf[x.name] = x.gen; });
    return all.filter((t) => {
      const g = genOf[(t.story && t.story.region) || t.region];
      return !g || g <= gen;
    });
  }
  function maybeAmbush() {
    if (Math.random() > 0.28) return;
    let tries = 0;
    (function whenClear() {
      if (++tries > 25 || !/^#\/nuzlocke/.test(location.hash)) return;
      if (document.querySelector(".battle, .modal-overlay, .league-intro")) { setTimeout(whenClear, 600); return; }
      const run = Store.nuzRun(me);
      if (!run || run.over || !Store.nuzAlive(me).length) return;
      const pool = ambushPool(run);
      if (!pool.length) return;
      const t = pool[(Math.random() * pool.length) | 0];
      let ctrl;
      const body = el("div", { class: "modal-form" }, [
        el("p", { class: "hint" }, "❗ On the road out of the gym, a villain blocks the path — and in a NUZLOCKE, every faint is FOREVER."),
        el("div", { class: "enc-quote" }, "“" + t.quote + "”"),
        el("div", { class: "toolbar" }, [
          el("button", { class: "btn primary", onClick: () => { ctrl.close(); ambushBattle(run, t); } }, "⚔ Stand and fight"),
          el("button", { class: "btn subtle", onClick: () => {
            ctrl.close();
            Store.update((s) => { s.pokedex.taken = (s.pokedex.taken || 0) + 1; Store.chron(s, "🏃", aName(me) + " slipped away from " + t.title + " " + t.name + " mid-Nuzlocke — a sip for the shame."); });
          } }, "🏃 Slip away (take a sip)"),
        ]),
      ]);
      ctrl = Modal.open("❗ " + t.title + " " + t.name + " ambushes the run!", body, null, { noFooter: true });
    })();
  }
  function ambushBattle(run, t) {
    const hc = gymHandicap(run);   // villains scale with the run, like the gyms
    partyThen(run, 6, "❗ Ambush — " + t.title + " " + t.name,
      "No badge, no points — just survival. Every faint is permanent.",
      (ids) => {
        Duel.start({ mode: "local", level: runLevel(run),
          a: { units: [{ attId: me, monIds: ids, shiny: ownShiny(run, ids), shinyExact: true }] },
          b: { units: [{ npc: t.name, ai: true, monIds: foeTeam(run, t.team, Math.min(t.team.length, hc.size), "ambush" + run.badges.length), boost: Math.min(1.1, hc.boost) }] },
          nuzlocke: { onEnd: (fainted, winSide) => {
            Store.nuzDeaths(me, fainted || []);
            Store.update((s) => Store.chron(s, "❗", aName(me) + (winSide === "a" ? " fought off " : " survived ") + t.title + " " + t.name + "'s Nuzlocke ambush" + (winSide === "a" ? "!" : " — barely.")));
            Router.render();
          } } });
      });
  }

  function battleStage(run, st) {
    partyThen(run, 6, "⚔ Nuzlocke league — " + st.rank + " " + st.name,
      "The endgame. Every faint is permanent — and a wipe ends the run.",
      (ids) => {
        Duel.start({ mode: "local", level: runLevel(run),
          a: { units: [{ attId: me, monIds: ids, shiny: ownShiny(run, ids), shinyExact: true }] },
          b: { units: [{ npc: st.rank + " " + st.name, ai: true, monIds: foeTeam(run, st.team, st.team.length, "stage-" + st.key), boost: stageBoost(run, st) }] },
          nuzlocke: { onEnd: (fainted, winSide) => {
            Store.nuzDeaths(me, fainted || []);
            if (winSide === "a") { Store.nuzStage(me, st.key); sfx("fanfare"); }
            Router.render();
          } } });
      });
  }

  // ── The crown board — highest tier first, then fewest catches ─────────────
  function renderHall(host) {
    const hall = Store.nuzHall();
    if (!hall.length) return;
    host.appendChild(el("div", { class: "safari-card nuz-hall" }, [
      el("div", { class: "nuz-lab-head" }, "👑 Nuzlocke crown board — fewest catches wins"),
      el("div", {}, hall.map((r, i) => el("div", { class: "nuz-hall-row" + (i === 0 ? " crowned" : "") }, [
        el("span", { class: "nuz-hall-rank" }, i === 0 ? "👑" : "#" + (i + 1)),
        el("span", { class: "nuz-hall-name" }, aName(r.att)),
        el("span", { class: "nuz-hall-sub" }, r.catches + " caught · " + r.deaths + " lost"
          + (r.mode === "random" ? " · 🎲" : "")
          + (r.tier === "master" ? " · 🌍 MASTER" : r.tier === "ages" ? " · 🕰 AGES" : r.tier === "trek" ? " · 🎒 LONG WALK" : r.tier === "movie" ? " · 🎬 PREMIERE" : r.tier === "legend" ? " · 🗻 LEGEND" : (r.region ? " · " + r.region : ""))
          + (r.deaths === 0 ? " · 💎 deathless" : "")),
      ]))),
    ]));
  }

  window.Views = window.Views || {};
  window.Views.nuzlocke = view;
})();
