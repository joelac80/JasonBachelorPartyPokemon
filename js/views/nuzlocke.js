/* nuzlocke.js — 🪦 The Nuzlocke Run: a true hardcore challenge mode.
   Pick ONE Kanto starter, then live off the land: wild Gen 1 Pokémon are
   caught by BATTLING them down (weaken-to-catch — there's no free throw
   here), the 8 Kanto gyms fall IN ORDER, then the Kanto Elite Four and
   Champion BLUE. The rule that makes it a Nuzlocke: any of YOUR Pokémon
   that faints in a run battle is DEAD for the rest of the run. Lose the
   whole box and the run is over. Catch as many as you like — but the
   crown board ranks champions by FEWEST catches, so every recruit costs
   bragging rights. Runs never touch the real ladder (no badges, league
   wins, dex entries or points) — state lives in Store.nuzlocke/nuzlockeHof. */
(function () {
  const { el } = U;
  const DEX = window.DEX || {};
  function sfx(n) { if (window.SFX && SFX[n]) SFX[n](); }

  const STARTERS = [1, 4, 7, 25];                  // Bulbasaur / Charmander / Squirtle / Pikachu
  const KANTO_GYM0 = 8;                            // Kanto gyms live at circuit idx 8-15
  const JOHTO_GYM0 = 0;                            // 🗻 Act II: Johto gyms live at idx 0-7
  const KANTO_E4 = ["lorelei", "brunok", "agatha", "lance4", "blue"];
  // Wild pools — no legendaries (they'd trivialize the run) and no starters
  // (yours is a gift). Act I roams Gen 1; the Johto act adds Gen 2.
  function wildsFor(run) {
    const max = (run && run.act === 2) ? 251 : 151;
    return Object.keys(DEX).map(Number)
      .filter((id) => id >= 1 && id <= max && !DEX[id].leg && STARTERS.indexOf(id) < 0);
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
    return (run.act === 2 ? 2 : 1) + ":" + run.badges.length + ":" + run.league.length;
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
    const seen = {}; (run.seen || []).forEach((id) => { seen[id] = 1; });
    const owned = {}; run.box.forEach((m) => { owned[m.id] = 1; });
    const WILDS = wildsFor(run).filter((id) =>
      !owned[id] && !seen[id] && !(PRE[id] && PRE[id].lvl > cap));
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
  // evolution level. Misty-era cap is 24, per the house rules.
  function runLevel(run) {
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

  // ── Per-phone session (NOT synced): who's running, current grass encounter ──
  let me = "";
  let wildId = 0;
  let evoOpen = false;
  let newMode = "";          // starter-lab pick: "" classic | "random" 🎲

  function view(root) {
    const meId = (window.Sync && Sync.getMe && Sync.getMe()) || "";
    if (!me && meId && Store.attendee(meId)) me = meId;

    root.appendChild(el("div", { class: "page-head" }, [
      el("h1", {}, "🪦 Nuzlocke Run"),
      el("p", { class: "page-sub" }, "The true challenge: one starter, catches only by battle, gyms in order — and any Pokémon that faints is gone for the whole run. Fewest catches wears the crown."),
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
      const headline = lastRun.over === "legend" ? "🗻 LEGEND — two regions, permadeath on, RED defeated!"
        : lastRun.over === "champion" ? "🏆 CHAMPION — the run is complete!"
        : lastRun.over === "wiped" ? "💀 The run ended — the whole box was lost." : "🏳️ Run abandoned.";
      host.appendChild(el("div", { class: "safari-card nuz-summary" + (lastRun.over === "champion" || lastRun.over === "legend" ? " result win" : " result miss") }, [
        el("div", { class: "safari-result-msg" }, headline),
        el("div", { class: "nuz-summary-line" },
          lastRun.badges.length + "/8 badges · " + lastRun.league.length + "/5 league stages · " +
          lastRun.catches + " caught · " + lastRun.deaths + " lost · " + alive + " survived"),
        el("div", { class: "nuz-box-grid" }, lastRun.box.map((m) => boxMon(m))),
      ]));
    }
    host.appendChild(el("div", { class: "safari-card nuz-lab" }, [
      el("div", { class: "nuz-lab-head" }, "🧪 Professor Oak's Lab"),
      el("p", { class: "hint" }, "“Every faint is forever in there. Choose your partner carefully — it's the only Pokémon you'll be given.”"),
      // 🎲 Classic keeps the canon leaders; Randomizer rerolls every team you
      // face (same caps, same sizes — different Pokémon every single run).
      el("div", { class: "dex-toggle" }, [
        el("button", { class: "btn sm" + (newMode ? " subtle" : " primary"), onClick: () => { newMode = ""; Router.render(); } }, "🎯 Classic"),
        el("button", { class: "btn sm" + (newMode ? " primary" : " subtle"), onClick: () => { newMode = "random"; Router.render(); } }, "🎲 Randomizer"),
      ]),
      newMode ? el("p", { class: "hint" }, "🎲 Every trainer you meet fields RANDOM Pokémon (era-appropriate, level-capped) — a fresh gauntlet every run.") : null,
      el("div", { class: "nuz-starters" }, STARTERS.map((id) =>
        el("button", { class: "nuz-starter", onClick: () => {
          if (!confirm("Start a " + (newMode ? "🎲 RANDOMIZER " : "") + "Nuzlocke run with " + monName(id) + "? Permadeath is ON — no take-backs.")) return;
          Store.nuzStart(me, id, newMode);
          wildId = 0; sfx("fanfare"); Router.render();
        } }, [
          Store.sprite(id) ? el("img", { src: Store.sprite(id), alt: monName(id) }) : el("span", { class: "tc-ball-fallback" }),
          el("span", { class: "nuz-starter-n" }, monName(id)),
        ]))),
      el("div", { class: "nuz-rules" }, [
        el("div", {}, "📜 House rules:"),
        el("div", {}, "• Catch wilds by BATTLING them — weaken, then throw mid-fight. KO it and it's lost."),
        el("div", {}, "• Any of your Pokémon that faints is dead for the rest of the run."),
        el("div", {}, "• 8 Kanto gyms in order → Kanto Elite Four → Champion BLUE = the crown."),
        el("div", {}, "• Catch as many as you want… but the crown board ranks by FEWEST catches."),
      ]),
    ]));
  }

  // ── Screen 2: the live run ─────────────────────────────────────────────────
  function renderRun(host, run) {
    const alive = run.box.filter((m) => !m.dead);
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

    // Progress strip + the box.
    host.appendChild(el("div", { class: "safari-stats" }, [
      act === 1 ? stat("🏅 " + kBadges + "/8", "Kanto badges") : stat("🏅 " + jBadges + "/8", "Johto badges"),
      act === 1 ? stat("👑 " + run.league.length + "/5", "League stages") : stat("🗻 " + (run.league.indexOf("red") >= 0 ? "1" : "0") + "/1", "Mt. Silver"),
      stat((run.mode === "random" ? "🎲 " : "📈 ") + "Lv " + runLevel(run), run.mode === "random" ? "Randomizer" : "Run level"),
      stat(run.catches, "Caught"),
      stat("🪦 " + run.deaths, "Lost forever"),
    ]));
    host.appendChild(el("div", { class: "safari-card nuz-boxcard" }, [
      el("div", { class: "nuz-lab-head" }, "📦 The box — " + alive.length + " standing"),
      el("div", { class: "nuz-box-grid" }, run.box.map((m) => boxMon(m, run))),
    ]));

    // The grass — wild catches (battle-only). Every stretch of road holds
    // only ENC_PER_ERA encounters, each roll burns one (no re-rolls), and a
    // species met once never appears again.
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
            wildId = id; sfx("blip"); Router.render();
          } }, "👣 Walk in the grass"),
        ]));
        grass.appendChild(el("p", { class: "hint" }, "Recruits are caught by battling — and battles can cost lives. ⚠️ Each walk burns an encounter (running away too), a species met once NEVER returns, and only Pokémon at home under the Lv " + runLevel(run) + " cap roam here."));
      } else {
        grass.appendChild(el("p", { class: "hint" }, "🚧 No wild Pokémon left on the road to the next badge — win it to reach fresh grass (" + ENC_PER_ERA + " new encounters)."));
      }
    } else {
      const wnfo = DEX[wildId] || {};
      grass.appendChild(el("div", { class: "nuz-lab-head" }, "🌿 A wild " + monName(wildId) + " appeared!"));
      grass.appendChild(el("div", { class: "nuz-wild-row" }, [
        Store.sprite(wildId) ? el("img", { class: "nuz-wild-img", src: Store.sprite(wildId), alt: monName(wildId) }) : null,
        el("div", { class: "nuz-wild-meta" }, [
          el("div", {}, "Base catch " + Math.round(catchBase(wildId) * 100) + "% — weakening it adds up to +65%."),
          el("div", { class: "hint" }, "⚠️ Bring up to 3. Anyone who faints in there is gone for good."),
        ]),
      ]));
      grass.appendChild(el("div", { class: "safari-actions" }, [
        el("button", { class: "btn primary", onClick: () => battleWild(run) }, "⚔ Battle to catch"),
        el("button", { class: "btn subtle", onClick: () => { wildId = 0; Router.render(); } }, "Run away"),
      ]));
    }

    // The gauntlet: next gym, the league ladder — or Mt. Silver.
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

    // 🎉 Any evolutions unlocked by the current level cap? Offer the first.
    setTimeout(() => { const r = Store.nuzRun(me); if (r && !r.over) checkEvolutions(r); }, 450);

    // Bail-out (tombstones the run; a new start replaces it).
    host.appendChild(el("div", { class: "safari-actions nuz-abandon" }, [
      el("button", { class: "btn subtle sm", onClick: () => {
        if (!confirm("Abandon this Nuzlocke run? It ends here — badges, box and all.")) return;
        Store.nuzAbandon(me); wildId = 0; sfx("error"); Router.render();
      } }, "🏳️ Abandon run"),
    ]));
  }

  function stat(v, l) { return el("div", { class: "safari-stat" }, [el("div", { class: "safari-stat-v" }, String(v)), el("div", { class: "safari-stat-l" }, l)]); }
  function boxMon(m, run) {
    // A living mon past its evolution level wears a ⬆ button (for the ones
    // who said "not now" — or missed the prompt).
    const canEvo = run && !run.over && evoTargetsFor(m, run).length > 0;
    return el("div", { class: "nuz-mon" + (m.dead ? " dead" : ""), title: monName(m.id) + (m.dead ? " — RIP" : "") }, [
      Store.sprite(m.id) ? el("img", { src: Store.sprite(m.id), alt: monName(m.id) }) : el("span", { class: "tc-ball-fallback" }),
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
        Duel.start({ mode: "local", broadcast: false, level: runLevel(run),
          a: { units: [{ attId: me, monIds: ids }] },
          b: { units: [{ npc: "Wild " + monName(id), ai: true, monIds: [id] }] },
          wild: {
            chanceFn: (frac) => Math.min(1, base + (1 - frac) * 0.65),
            onOutcome: (outcome, fainted) => {
              Store.nuzDeaths(me, fainted || []);
              if (outcome === "caught") { Store.nuzCatch(me, id); sfx("fanfare"); }
              else sfx("error");
              wildId = 0; Router.render();
            },
          } });
      });
  }

  // The run's difficulty CURVE: a fresh box is a Squirtle and a Pidgey, so
  // early leaders meet you halfway — 3 mons at ~70% strength — and ramp to
  // their full squad at full power by badge 8. Act II starts near full
  // strength (you're a champion now) and climbs past it.
  function gymHandicap(run) {
    const act = run.act === 2 ? 2 : 1;
    const step = act === 1
      ? run.badges.filter((i) => i >= KANTO_GYM0).length
      : run.badges.filter((i) => i < KANTO_GYM0).length;      // 0..7
    if (act === 1) return { size: 3 + Math.floor(step / 2), boost: 0.72 + step * 0.04 };
    return { size: 6, boost: 0.95 + step * 0.02 };
  }

  function battleGym(run, idx, g) {
    const hc = gymHandicap(run);
    partyThen(run, 6, "⚔ Nuzlocke gym — Leader " + g.leader,
      "Bring up to 6 of the living. Every faint in there is permanent.",
      (ids) => {
        Duel.start({ mode: "local", level: runLevel(run),
          a: { units: [{ attId: me, monIds: ids }] },
          b: { units: [{ npc: "LEADER " + g.leader, ai: true,
            monIds: foeTeam(run, g.team, Math.min(g.team.length, hc.size), "gym" + idx, gymAce(g)), boost: hc.boost }] },
          nuzlocke: { onEnd: (fainted, winSide) => {
            Store.nuzDeaths(me, fainted || []);
            if (winSide === "a") { Store.nuzBadge(me, idx); sfx("fanfare"); maybeAmbush(); }
            Router.render();
          } } });
      });
  }

  // ❗ Villains prowl the roads between Nuzlocke gyms (~28% after a win) —
  // same rogues' gallery as the main circuit, but HERE every faint is
  // forever. You can slip away… for a sip and a little shame.
  function maybeAmbush() {
    const pool = window.CANON_TRAINERS || [];
    if (!pool.length || Math.random() > 0.28) return;
    const t = pool[(Math.random() * pool.length) | 0];
    let tries = 0;
    (function whenClear() {
      if (++tries > 25 || !/^#\/nuzlocke/.test(location.hash)) return;
      if (document.querySelector(".battle, .modal-overlay, .league-intro")) { setTimeout(whenClear, 600); return; }
      const run = Store.nuzRun(me);
      if (!run || run.over || !Store.nuzAlive(me).length) return;
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
          a: { units: [{ attId: me, monIds: ids }] },
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
          a: { units: [{ attId: me, monIds: ids }] },
          b: { units: [{ npc: st.rank + " " + st.name, ai: true, monIds: foeTeam(run, st.team, st.team.length, "stage-" + st.key), boost: st.boost || 1.1 }] },
          nuzlocke: { onEnd: (fainted, winSide) => {
            Store.nuzDeaths(me, fainted || []);
            if (winSide === "a") { Store.nuzStage(me, st.key); sfx("fanfare"); }
            Router.render();
          } } });
      });
  }

  // ── The crown board — completed runs, fewest catches first ───────────────
  function renderHall(host) {
    const hall = Store.nuzHall();
    if (!hall.length) return;
    host.appendChild(el("div", { class: "safari-card nuz-hall" }, [
      el("div", { class: "nuz-lab-head" }, "👑 Nuzlocke crown board — fewest catches wins"),
      el("div", {}, hall.map((r, i) => el("div", { class: "nuz-hall-row" + (i === 0 ? " crowned" : "") }, [
        el("span", { class: "nuz-hall-rank" }, i === 0 ? "👑" : "#" + (i + 1)),
        el("span", { class: "nuz-hall-name" }, aName(r.att)),
        el("span", { class: "nuz-hall-sub" }, r.catches + " caught · " + r.deaths + " lost" + (r.mode === "random" ? " · 🎲" : "") + (r.tier === "legend" ? " · 🗻 LEGEND" : "") + (r.deaths === 0 ? " · 💎 deathless" : "")),
      ]))),
    ]));
  }

  window.Views = window.Views || {};
  window.Views.nuzlocke = view;
})();
