/* safari.js — Pokédex Safari drinking game (per-trainer competition).
   Pick who's catching, find a wild Pokémon (cool ones show up more but are
   very hard to catch), then stack boosts to raise your odds:
     • Dares      up to 3 × +20%   (one-off, this encounter)
     • Berry      +15%             (one-off; also halves flee chance)
     • Squad rally +10%            (one-off, this encounter)
     • Helper     +15% (a 2nd trainer joins; earns an assist + a share of the
                        payout — half the sips, or the full haul on a legendary)
     • Catch combo +5%/link, cap +25% — carries between encounters, a flee breaks it
   Then throw. Catches go into that trainer's own Pokédex. Leaderboard +
   Ash Ketchum cap for the top catcher. State in Store.pokedex. */
(function () {
  const { el } = U;
  const DEX = window.DEX || {};
  const SP = window.DEX_SPRITES || {};
  const IDS = Object.keys(DEX).map(Number);
  function sfx(n) { if (window.SFX && SFX[n]) SFX[n](); }
  function now() { try { return Date.now(); } catch (_) { return 0; } }

  const TIER_COLOR = { Common: "#8a97a8", Evolved: "#5fbf6a", Strong: "#3aa0e6", Elite: "#7a5aa0", Legendary: "#e6b800" };
  const DARES = [
    "Take a sip 🍺", "Finish your current drink 🍻", "Take a shot 🥃",
    "Do 5 push-ups 💪", "Sing one line of any song 🎤", "Strike your best gym-leader pose 🕺",
    "Let the group pick your next drink 🎲", "Speak only in Pokémon names for 1 minute 🗣️",
    "10-second victory dance 💃", "Toast the groom, everyone drinks 🥂",
    "Do your best Pokémon cry 📣", "Waterfall for 3 seconds 🌊",
    "Grab someone a fresh drink 🍺", "Get the groom a round 🤵",
    "Cheers the person on your left 🥂", "Refill an empty cup nearby 🥤",
  ];
  function randomDare() { return DARES[(Math.random() * DARES.length) | 0]; }

  // Base catch is low (very low for cool Pokémon); each challenge level +20%.
  function info(id) {
    const d = DEX[id] || { x: 60 }; const x = d.x, leg = !!d.leg;
    let base = 0.6 - x / 500; base = Math.max(0.05, Math.min(0.6, base));
    if (leg) base = Math.min(base, 0.06);
    let sips = 1 + Math.round(x / 70); if (leg) sips += 2; sips = Math.min(7, Math.max(1, sips));
    const flee = leg ? 0.06 : 0.12;
    const tier = leg ? "Legendary" : x >= 200 ? "Elite" : x >= 140 ? "Strong" : x >= 90 ? "Evolved" : "Common";
    return { name: d.n, x: x, leg: leg, base: base, sips: sips, flee: flee, tier: tier, color: TIER_COLOR[tier] };
  }

  // The ball reflects your odds: Poké → Great → Ultra → Master (100% = sure catch).
  function ballTier(chance) {
    if (chance >= 1) return { key: "master", name: "Master Ball", top: "#7a2ff2" };
    if (chance >= 0.75) return { key: "ultra", name: "Ultra Ball", top: "#e6a100" };
    if (chance >= 0.55) return { key: "great", name: "Great Ball", top: "#2a75bb" };
    return { key: "poke", name: "Poké Ball", top: "#ee1515" };
  }
  function ballIcon(tier) { return el("span", { class: "ball-ico " + tier.key, style: { "--ball-top": tier.top } }); }

  // Catch combo (Let's Go-style hot streak): +5% per consecutive catch, cap +25%.
  function comboOf(id) { return (rec(id).combo || 0); }
  function comboBonus(id) { return Math.min(0.25, 0.05 * comboOf(id)); }

  // Flatter weighting than before — cool Pokémon show up more often.
  function weightFor(id) { const d = DEX[id]; let w = 1 / Math.pow(d.x, 0.55); if (d.leg) w *= 0.4; return w; }
  function randomEncounter() {
    let total = 0; const cum = [];
    IDS.forEach((id) => { total += weightFor(id); cum.push([total, id]); });
    const r = Math.random() * total;
    for (let i = 0; i < cum.length; i++) if (r <= cum[i][0]) return cum[i][1];
    return IDS[0];
  }

  function P() { return Store.state.pokedex; }
  function rec(id) { return (P().trainers && P().trainers[id]) || { caught: {}, team: [], catches: 0 }; }
  function caughtCount(id) { return Object.keys(rec(id).caught || {}).length; }
  function attendeeName(id) { const a = Store.attendee(id); return a ? a.name : id; }

  function view(root) {
    let current = null, busy = false, status = "", level = 0, pendingDare = "";
    let usedBerry = false, usedRally = false, helper = "";

    // Effective catch chance = base + all active boosts (capped at 100%).
    function chanceFor(nfo) {
      return Math.min(1, nfo.base + 0.2 * level + (usedBerry ? 0.15 : 0) + (usedRally ? 0.10 : 0) + (helper ? 0.15 : 0) + comboBonus(active()));
    }

    // A helper is a second trainer teaming up (a "double-battle" catch): +15%,
    // and they earn an assist toward the Best Helper badge on a successful catch.
    function pickHelper() {
      const others = Store.state.attendees.filter((a) => a.id !== active());
      const grid = el("div", { class: "sl-vote-grid" }, others.map((a) =>
        el("button", { class: "sl-vote-pick", onClick: () => { helper = a.id; sfx("select"); ref.close(); renderEncounter(); } },
          el("span", { class: "sl-vote-name" }, a.name))));
      const body = el("div", { class: "modal-form" }, [el("div", { class: "field" }, [el("span", {}, "Who's teaming up? (+15% — earns them an assist + a share of the sips)"), grid])]);
      const ref = Modal.open("🤝 Double-battle catch", body, null, {});
    }

    root.appendChild(el("div", { class: "page-head" }, [
      el("h1", {}, "🔴 Pokédex Safari"),
      el("p", { class: "page-sub" }, "Pick your trainer, find a wild one, then stack boosts — dares, berries, a squad rally, and a catch combo — before you throw."),
    ]));

    // ---- trainer selector ----
    const sel = el("select", { class: "in" }, [el("option", { value: "" }, "— pick a trainer —")].concat(
      Store.state.attendees.map((a) => el("option", { value: a.id, selected: P().active === a.id ? "true" : null }, a.name))));
    sel.addEventListener("change", () => {
      Store.update((s) => { s.pokedex.active = sel.value; });
      current = null; level = 0; pendingDare = ""; status = ""; usedBerry = false; usedRally = false; helper = "";
      renderAll();
    });
    root.appendChild(el("div", { class: "safari-trainer" }, [el("span", { class: "safari-trainer-lbl" }, "Now catching:"), sel]));

    const stats = el("div", { class: "safari-stats" });
    const enc = el("div", { class: "safari-enc" });
    const boardHost = el("div", {});
    const teamHost = el("div", {});
    const dexHost = el("div", {});
    root.appendChild(stats); root.appendChild(enc); root.appendChild(boardHost);
    root.appendChild(teamHost); root.appendChild(dexHost);

    function active() { return P().active; }

    // ---- stats ----
    function renderStats() {
      stats.innerHTML = "";
      const id = active();
      const stat = (v, l) => el("div", { class: "safari-stat" }, [el("div", { class: "safari-stat-v" }, String(v)), el("div", { class: "safari-stat-l" }, l)]);
      stats.appendChild(stat(id ? caughtCount(id) + " / 251" : "—", id ? attendeeName(id) + "'s dex" : "No trainer"));
      stats.appendChild(stat("🍺 " + (P().given || 0), "Sips dealt"));
      stats.appendChild(stat(id && comboOf(id) ? "🔥 " + comboOf(id) : (Store.state.pokedex.log ? Store.state.pokedex.log.length : 0),
        id && comboOf(id) ? "Catch combo" : "Catches logged"));
    }

    // ---- encounter (wild-battle scene with a silhouette that focuses in) ----
    let revealId = null;
    function renderEncounter() {
      enc.innerHTML = "";
      if (!active()) { enc.appendChild(el("div", { class: "safari-idle" }, el("p", { class: "empty" }, "👆 Pick a trainer to start catching."))); return; }
      if (!current) {
        enc.appendChild(el("div", { class: "safari-idle" }, [
          el("div", { class: "safari-grass" }, "🌿🌿🌿"),
          el("button", { class: "btn spin-btn", onClick: findOne }, "🔍 Walk in the grass"),
        ]));
        return;
      }
      const nfo = info(current);
      const chance = chanceFor(nfo);
      const ball = ballTier(chance);
      const combo = comboOf(active());
      const owned = !!rec(active()).caught[current];
      const firstShow = revealId !== current && !status;

      // ---- battle scene ----
      const wild = SP[current]
        ? el("img", { class: "safari-wild-scene" + (firstShow ? " revealing" : ""), src: SP[current], alt: nfo.name })
        : el("div", { class: "tc-ball-fallback" });
      const grass = el("div", { class: "safari-scene-grass" }, ["🌿", "🌿", "🌿", "🌿", "🌿"].map((g) => el("span", {}, g)));
      const scene = el("div", { class: "safari-scene" + (firstShow ? " rustle" : "") }, [
        el("div", { class: "safari-scene-platform" }), wild, el("div", { class: "safari-ball-throw", style: { "--ball-top": ball.top } }), grass,
      ]);

      // ---- controls (name/odds/etc. hidden until the silhouette focuses in) ----
      const meta = el("div", { class: "safari-wild-meta" }, [
        el("span", { class: "safari-tier", style: { background: nfo.color } }, nfo.tier),
        el("span", { class: "safari-wild-name" }, "No." + current + " " + nfo.name),
        owned ? el("span", { class: "safari-owned" }, "✓ already in dex") : null,
      ]);
      // Human-readable breakdown of every active boost.
      const parts = [];
      if (level) parts.push(level + " dare" + (level > 1 ? "s" : ""));
      if (usedBerry) parts.push("berry");
      if (usedRally) parts.push("rally");
      if (helper) parts.push("helper");
      if (combo) parts.push("combo ×" + combo);
      const breakdown = parts.length ? " (base " + Math.round(nfo.base * 100) + "% + " + parts.join(" + ") + ")" : "";
      const odds = el("div", { class: "safari-odds" }, [
        el("span", { class: "safari-odds-big" }, Math.round(chance * 100) + "%"),
        el("span", {}, " catch chance" + breakdown + " · catch deals " + nfo.sips + " sip" + (nfo.sips > 1 ? "s" : "")),
        el("span", { class: "safari-ball-chip" }, [ballIcon(ball), " " + ball.name + (ball.key === "master" ? " — sure catch!" : "")]),
      ]);
      const pips = el("div", { class: "safari-pips" }, [0, 1, 2].map((i) => el("span", { class: "safari-pip" + (i < level ? " on" : "") })));

      // Active-boost chips (berry / rally / combo) shown alongside the dare pips.
      const activeChips = [];
      if (usedBerry) activeChips.push(el("span", { class: "safari-boost-chip berry" }, "🍓 Berry +15%"));
      if (usedRally) activeChips.push(el("span", { class: "safari-boost-chip rally" }, "📣 Rally +10%"));
      if (helper) activeChips.push(el("span", { class: "safari-boost-chip helper" }, "🤝 " + attendeeName(helper) + " +15%"));
      if (combo) activeChips.push(el("span", { class: "safari-boost-chip combo" }, "🔥 Combo ×" + combo + " (+" + Math.round(comboBonus(active()) * 100) + "%)"));

      let challengeArea;
      if (pendingDare) {
        challengeArea = el("div", { class: "safari-dare" }, [
          el("div", { class: "safari-dare-txt" }, "🔥 " + pendingDare),
          el("div", { class: "safari-actions" }, [
            el("button", { class: "btn primary sm", onClick: () => { level++; pendingDare = ""; renderEncounter(); } }, "✓ Did it (+20%)"),
            el("button", { class: "btn subtle sm", onClick: () => { pendingDare = ""; renderEncounter(); } }, "Nah"),
          ]),
        ]);
      } else {
        const btns = [];
        if (level < 3) btns.push(el("button", { class: "btn subtle sm", onClick: () => { pendingDare = randomDare(); renderEncounter(); } }, "🔥 Take a dare (+20%)"));
        if (!usedBerry) btns.push(el("button", { class: "btn subtle sm", onClick: () => { usedBerry = true; sfx("coin"); renderEncounter(); } }, "🍓 Toss a Berry (+15%)"));
        if (!usedRally) btns.push(el("button", { class: "btn subtle sm", onClick: () => { usedRally = true; sfx("blip"); renderEncounter(); } }, "📣 Squad rally (+10%)"));
        btns.push(helper
          ? el("button", { class: "btn subtle sm", onClick: () => { helper = ""; renderEncounter(); } }, "🤝 Remove helper")
          : el("button", { class: "btn subtle sm", onClick: pickHelper }, "🤝 Add a helper (+15%)"));
        challengeArea = el("div", { class: "safari-actions safari-boosts" }, btns);
      }
      const suspense = el("div", { class: "safari-suspense" });
      const throwRow = el("div", { class: "safari-actions safari-throw-row" }, [
        el("button", { class: "btn primary", onClick: () => throwBall(nfo), disabled: pendingDare ? "true" : null }, [ballIcon(ball), " Throw " + ball.name]),
        el("button", { class: "btn subtle", onClick: () => { current = null; level = 0; pendingDare = ""; status = ""; renderEncounter(); } }, "Run"),
      ]);
      const post = el("div", { class: "safari-post" + (firstShow ? " hidden" : "") }, [
        meta,
        helper ? el("div", { class: "safari-teamup" }, "🤝 " + attendeeName(active()) + " & " + attendeeName(helper) + " — double-battle catch!") : null,
        odds,
        el("div", { class: "safari-challenge" }, [
          el("div", { class: "safari-challenge-row" }, [el("span", { class: "safari-challenge-lbl" }, "Boost"), pips].concat(activeChips)),
          challengeArea,
        ]),
        suspense, throwRow,
      ]);
      const appeared = el("div", { class: "safari-appeared" }, status || (firstShow ? "The tall grass rustles…" : ("A wild " + nfo.name + " appeared!")));

      enc.appendChild(el("div", { class: "safari-battlebox" }, [scene, el("div", { class: "safari-controls" }, [appeared, post])]));

      if (firstShow) {
        revealId = current;
        sfx("select");
        setTimeout(() => {
          if (revealId !== current) return;
          appeared.textContent = "A wild " + nfo.name + " appeared!";
          post.classList.remove("hidden");
          sfx("win");
        }, 1200);
      }
    }

    function findOne() { current = null; revealId = null; busy = false; status = ""; level = 0; pendingDare = ""; usedBerry = false; usedRally = false; helper = ""; current = randomEncounter(); sfx("blip"); renderEncounter(); }

    function throwBall(nfo) {
      if (busy || !current || pendingDare) return;
      busy = true;
      const chance = chanceFor(nfo);
      const flee = usedBerry ? nfo.flee / 2 : nfo.flee;   // a berry calms it — less likely to bolt
      const outcome = Math.random() < chance ? "catch" : (Math.random() < flee ? "flee" : "break");
      const wild = enc.querySelector(".safari-wild-scene");
      const ball = enc.querySelector(".safari-ball-throw");
      const suspense = enc.querySelector(".safari-suspense");
      const throwRow = enc.querySelector(".safari-throw-row");
      if (throwRow) throwRow.style.visibility = "hidden";
      if (ball) ball.classList.add("go");
      if (wild && outcome !== "break") wild.classList.add("caught-anim");
      sfx("select");
      const beats = ["The ball shakes…", "…and shakes…", "…and shakes…"];
      beats.forEach((t, i) => setTimeout(() => { if (suspense) suspense.textContent = t; sfx("blip"); }, 500 + i * 400));
      setTimeout(() => resolveThrow(outcome, nfo), 1900);
    }

    function resolveThrow(outcome, nfo) {
      const id = current, tid = active();
      if (outcome === "break") {
        status = "So close! " + nfo.name + " broke free — throw again!";
        busy = false; renderEncounter(); return;
      }
      if (outcome === "catch") {
        let newCombo = 0;
        const helperId = helper && helper !== tid ? helper : "";
        const helperName = helperId ? attendeeName(helperId) : "";
        // Helper shares the reward: half the sips on a normal catch, the full
        // haul when the assist lands a legendary.
        const helperSips = helperId ? (nfo.leg ? nfo.sips : Math.max(1, Math.round(nfo.sips / 2))) : 0;
        Store.update((s) => {
          const t = s.pokedex.trainers[tid] = s.pokedex.trainers[tid] || { caught: {}, team: [], catches: 0 };
          const prev = t.caught[id];
          t.caught[id] = { count: (prev ? prev.count : 0) + 1 };
          t.catches = Object.keys(t.caught).length;
          t.combo = (t.combo || 0) + 1;               // extend the catch combo
          newCombo = t.combo;
          if (helperId) {                              // credit the helper's assist + payout
            const h = s.pokedex.trainers[helperId] = s.pokedex.trainers[helperId] || { caught: {}, team: [], catches: 0 };
            h.helps = (h.helps || 0) + 1;
            h.assistSips = (h.assistSips || 0) + helperSips;
          }
          s.pokedex.given = (s.pokedex.given || 0) + nfo.sips + helperSips;
          s.pokedex.log = s.pokedex.log || [];
          s.pokedex.log.unshift({ trainer: tid, dexId: id, name: nfo.name, helper: helperId || undefined, ts: now() });
          if (s.pokedex.log.length > 80) s.pokedex.log.length = 80;
        });
        sfx("win");
        const nextBonus = Math.min(0.25, 0.05 * newCombo);
        enc.innerHTML = "";
        enc.appendChild(el("div", { class: "safari-card result win" }, [
          el("img", { class: "safari-wild pop", src: SP[id], alt: nfo.name }),
          el("div", { class: "safari-result-msg" }, "Gotcha! " + attendeeName(tid) + " caught " + nfo.name + "!"),
          el("div", { class: "safari-payout" }, "🍺 " + attendeeName(tid) + " hands out " + nfo.sips + " sip" + (nfo.sips > 1 ? "s" : "") + "!"),
          helperName ? el("div", { class: "safari-assist-note" }, "🤝 Assist from " + helperName + " — they hand out " + helperSips + (nfo.leg ? " sip" + (helperSips > 1 ? "s" : "") + " (full legendary share!)" : " sip" + (helperSips > 1 ? "s" : "") + " too!")) : null,
          newCombo > 1 ? el("div", { class: "safari-combo-note" }, "🔥 Catch combo ×" + newCombo + " — +" + Math.round(nextBonus * 100) + "% on your next throw!") : null,
          el("div", { class: "safari-actions" }, [el("button", { class: "btn spin-btn", onClick: findOne }, "🔍 Find another")]),
        ]));
      } else {
        const lostCombo = comboOf(tid);              // grab it before we reset
        Store.update((s) => {
          s.pokedex.taken = (s.pokedex.taken || 0) + 1;
          const t = s.pokedex.trainers[tid];
          if (t) t.combo = 0;                          // a runaway breaks the combo
        });
        sfx("error");
        enc.innerHTML = "";
        enc.appendChild(el("div", { class: "safari-card result miss" }, [
          el("img", { class: "safari-wild fled", src: SP[id], alt: nfo.name }),
          el("div", { class: "safari-result-msg" }, nfo.name + " slipped away!"),
          el("div", { class: "safari-payout miss" }, "😅 It got away. Take a sip." ),
          lostCombo > 1 ? el("div", { class: "safari-combo-note broke" }, "💔 Catch combo of " + lostCombo + " broken!") : null,
          el("div", { class: "safari-actions" }, [el("button", { class: "btn spin-btn", onClick: findOne }, "🔍 Find another")]),
        ]));
      }
      current = null; busy = false; status = ""; level = 0; pendingDare = ""; usedBerry = false; usedRally = false; helper = "";
      renderStats(); renderBoard(); renderTeam(); renderDex();
    }

    // ---- leaderboard ----
    function renderBoard() {
      boardHost.innerHTML = "";
      const rows = Store.state.attendees
        .map((a) => ({ a, n: caughtCount(a.id) }))
        .filter((r) => r.n > 0)
        .sort((x, y) => y.n - x.n);
      boardHost.appendChild(el("h2", { class: "section-title" }, "🏆 Catch Leaderboard"));
      if (!rows.length) { boardHost.appendChild(el("p", { class: "hint" }, "No catches yet. Be the first!")); return; }
      const list = el("div", { class: "safari-board" }, rows.map((r, i) =>
        el("div", { class: "safari-board-row" + (i === 0 ? " lead" : "") }, [
          el("span", { class: "safari-board-rank" }, i === 0 ? "🧢" : "#" + (i + 1)),
          el("span", { class: "safari-board-name" }, r.a.name),
          el("span", { class: "safari-board-n" }, r.n + " caught"),
        ])));
      boardHost.appendChild(list);
      boardHost.appendChild(el("p", { class: "hint" }, "🧢 = Ash Ketchum — most Pokémon caught wins the badge."));

      // ---- Top Helpers (Best Helper badge) ----
      const helpers = Store.state.attendees
        .map((a) => ({ a, n: helpsOf(a.id) }))
        .filter((r) => r.n > 0)
        .sort((x, y) => y.n - x.n);
      if (helpers.length) {
        boardHost.appendChild(el("h2", { class: "section-title" }, "🤝 Top Helpers"));
        boardHost.appendChild(el("div", { class: "safari-board" }, helpers.map((r, i) =>
          el("div", { class: "safari-board-row" + (i === 0 ? " lead" : "") }, [
            el("span", { class: "safari-board-rank" }, i === 0 ? "🤝" : "#" + (i + 1)),
            el("span", { class: "safari-board-name" }, r.a.name),
            el("span", { class: "safari-board-n" }, r.n + " assist" + (r.n > 1 ? "s" : "") + (assistSipsOf(r.a.id) ? " · 🍺 " + assistSipsOf(r.a.id) : "")),
          ]))));
        boardHost.appendChild(el("p", { class: "hint" }, "🤝 = Best Helper — most assists on catches wins the badge."));
      }
    }
    function helpsOf(id) { return rec(id).helps || 0; }
    function assistSipsOf(id) { return rec(id).assistSips || 0; }

    // ---- team of 6 (active trainer) ----
    function inTeam(id) { return (rec(active()).team || []).indexOf(id) >= 0; }
    function toggleTeam(id) {
      const tid = active(); if (!tid) return;
      Store.update((s) => {
        const t = s.pokedex.trainers[tid] = s.pokedex.trainers[tid] || { caught: {}, team: [], catches: 0 };
        const i = t.team.indexOf(id);
        if (i >= 0) t.team.splice(i, 1);
        else if (t.team.length < 6) t.team.push(id);
        else alert("Team is full (6). Remove one first.");
      });
      renderTeam(); renderDex();
    }
    function renderTeam() {
      teamHost.innerHTML = "";
      if (!active()) return;
      teamHost.appendChild(el("h2", { class: "section-title" }, attendeeName(active()) + "'s Team of 6"));
      const team = rec(active()).team || [];
      const slots = el("div", { class: "safari-team" });
      for (let i = 0; i < 6; i++) {
        const id = team[i];
        slots.appendChild(id
          ? el("button", { class: "safari-team-slot filled", title: "Remove", onClick: () => toggleTeam(id) },
              [el("img", { src: SP[id], alt: DEX[id].n }), el("span", {}, DEX[id].n)])
          : el("div", { class: "safari-team-slot empty" }, "＋"));
      }
      teamHost.appendChild(slots);
    }

    // ---- dex grid (active trainer) ----
    function renderDex() {
      dexHost.innerHTML = "";
      if (!active()) return;
      dexHost.appendChild(el("h2", { class: "section-title" }, "Pokédex (" + caughtCount(active()) + " / 251)"));
      const caught = rec(active()).caught || {};
      const grid = el("div", { class: "safari-dex" });
      IDS.forEach((id) => {
        const got = !!caught[id];
        grid.appendChild(el("div", { class: "safari-dex-cell" + (got ? " got" : "") + (inTeam(id) ? " team" : ""),
          title: got ? DEX[id].n + " — tap for team" : "#" + id + " — not caught",
          onClick: got ? () => toggleTeam(id) : null }, [
          SP[id] ? el("img", { src: SP[id], alt: got ? DEX[id].n : "", loading: "lazy" }) : null,
          el("span", { class: "safari-dex-num" }, "#" + id),
        ]));
      });
      dexHost.appendChild(grid);
      dexHost.appendChild(el("div", { class: "toolbar" }, [
        el("button", { class: "btn subtle sm", onClick: () => {
          if (confirm("Reset the ENTIRE Safari (all trainers, catches, teams, log)?")) {
            Store.update((s) => { s.pokedex = { active: "", trainers: {}, log: [], given: 0, taken: 0 }; });
            location.reload();
          }
        } }, "Reset Safari"),
      ]));
    }

    function renderAll() { renderStats(); renderEncounter(); renderBoard(); renderTeam(); renderDex(); }
    renderAll();
  }

  window.Views = window.Views || {};
  window.Views.safari = view;
})();
