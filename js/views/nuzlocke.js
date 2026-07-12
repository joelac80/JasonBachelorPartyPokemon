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
  // Near-flat encounter odds, like the Safari grass.
  function rollWild(run) {
    const WILDS = wildsFor(run);
    const owned = {}; run.box.forEach((m) => { owned[m.id] = 1; });
    const pool = WILDS.filter((id) => !owned[id]);
    if (!pool.length) return WILDS[(Math.random() * WILDS.length) | 0];
    let total = 0; const cum = [];
    pool.forEach((id) => { total += 1 / Math.pow(DEX[id].x || 60, 0.30); cum.push([total, id]); });
    const r = Math.random() * total;
    for (let i = 0; i < cum.length; i++) if (r <= cum[i][0]) return cum[i][1];
    return pool[pool.length - 1];
  }

  // ── Per-phone session (NOT synced): who's running, current grass encounter ──
  let me = "";
  let wildId = 0;

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
      el("div", { class: "nuz-starters" }, STARTERS.map((id) =>
        el("button", { class: "nuz-starter", onClick: () => {
          if (!confirm("Start a Nuzlocke run with " + monName(id) + "? " + (lastRun && !lastRun.over ? "" : "Permadeath is ON — no take-backs."))) return;
          Store.nuzStart(me, id);
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
      stat(run.catches, "Caught"),
      stat("🪦 " + run.deaths, "Lost forever"),
    ]));
    host.appendChild(el("div", { class: "safari-card nuz-boxcard" }, [
      el("div", { class: "nuz-lab-head" }, "📦 The box — " + alive.length + " standing"),
      el("div", { class: "nuz-box-grid" }, run.box.map((m) => boxMon(m))),
    ]));

    // The grass — wild catches (battle-only).
    const grass = el("div", { class: "safari-card nuz-grass" });
    host.appendChild(grass);
    if (!wildId) {
      grass.appendChild(el("div", { class: "nuz-lab-head" }, "🌿 Tall grass"));
      grass.appendChild(el("div", { class: "safari-actions" }, [
        el("button", { class: "btn spin-btn", onClick: () => {
          wildId = rollWild(run); sfx("blip"); Router.render();
        } }, "👣 Walk in the grass"),
      ]));
      grass.appendChild(el("p", { class: "hint" }, "Recruits are caught by battling — and battles can cost lives. How small can you keep the box?"));
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
      next.appendChild(el("div", { class: "nuz-lab-head" }, "🏟 Gym " + (kBadges + 1) + "/8 — Leader " + (g ? g.leader : "?")));
      if (g) {
        next.appendChild(el("div", { class: "nuz-foe-row" }, g.team.map((id) =>
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
        next.appendChild(el("div", { class: "nuz-foe-row" }, st.team.map((id) =>
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
        next.appendChild(el("div", { class: "nuz-foe-row" }, g.team.map((id) =>
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
        next.appendChild(el("div", { class: "nuz-foe-row" }, st.team.map((id) =>
          Store.sprite(id) ? el("img", { class: "nuz-foe-img", src: Store.sprite(id), alt: monName(id) }) : null)));
        next.appendChild(el("div", { class: "safari-actions" }, [
          el("button", { class: "btn primary", onClick: () => battleStage(run, st) }, "⚔ Climb — battle RED"),
        ]));
        next.appendChild(el("p", { class: "hint" }, "The final battle of the run. Beat RED with permadeath on and you're a NUZLOCKE LEGEND."));
      }
    }

    // Bail-out (tombstones the run; a new start replaces it).
    host.appendChild(el("div", { class: "safari-actions nuz-abandon" }, [
      el("button", { class: "btn subtle sm", onClick: () => {
        if (!confirm("Abandon this Nuzlocke run? It ends here — badges, box and all.")) return;
        Store.nuzAbandon(me); wildId = 0; sfx("error"); Router.render();
      } }, "🏳️ Abandon run"),
    ]));
  }

  function stat(v, l) { return el("div", { class: "safari-stat" }, [el("div", { class: "safari-stat-v" }, String(v)), el("div", { class: "safari-stat-l" }, l)]); }
  function boxMon(m) {
    return el("div", { class: "nuz-mon" + (m.dead ? " dead" : ""), title: monName(m.id) + (m.dead ? " — RIP" : "") }, [
      Store.sprite(m.id) ? el("img", { src: Store.sprite(m.id), alt: monName(m.id) }) : el("span", { class: "tc-ball-fallback" }),
      m.dead ? el("span", { class: "nuz-rip" }, "🪦") : null,
      el("span", { class: "nuz-mon-n" }, monName(m.id)),
    ]);
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
        Duel.start({ mode: "local", broadcast: false,
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

  function battleGym(run, idx, g) {
    partyThen(run, 6, "⚔ Nuzlocke gym — Leader " + g.leader,
      "Bring up to 6 of the living. Every faint in there is permanent.",
      (ids) => {
        Duel.start({ mode: "local",
          a: { units: [{ attId: me, monIds: ids }] },
          b: { units: [{ npc: "LEADER " + g.leader, ai: true, monIds: g.team.slice() }] },
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
    partyThen(run, 6, "❗ Ambush — " + t.title + " " + t.name,
      "No badge, no points — just survival. Every faint is permanent.",
      (ids) => {
        Duel.start({ mode: "local",
          a: { units: [{ attId: me, monIds: ids }] },
          b: { units: [{ npc: t.name, ai: true, monIds: t.team.slice(), boost: 1.1 }] },
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
        Duel.start({ mode: "local",
          a: { units: [{ attId: me, monIds: ids }] },
          b: { units: [{ npc: st.rank + " " + st.name, ai: true, monIds: st.team.slice(), boost: st.boost || 1.1 }] },
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
        el("span", { class: "nuz-hall-sub" }, r.catches + " caught · " + r.deaths + " lost" + (r.tier === "legend" ? " · 🗻 LEGEND" : "") + (r.deaths === 0 ? " · 💎 deathless" : "")),
      ]))),
    ]));
  }

  window.Views = window.Views || {};
  window.Views.nuzlocke = view;
})();
