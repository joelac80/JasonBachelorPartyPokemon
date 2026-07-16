/* cups.js — 🏟 STADIUM CUPS: the Pokémon Stadium homage. Pick a ruleset,
   enter the room's trainers (AI fills the empty chairs), play a ROUND ROBIN
   where everyone meets everyone, then the top four settle it in a knockout
   FINALS. Four cups, straight from the N64 era:
     🍼 Baby Cup   — first forms only, Lv 5
     🔴 Poké Cup   — your own caught Pokémon, Lv 50
     👑 Prime Cup  — anything goes (legendaries!), Lv 100
     🎲 Rental Cup — everyone plays a seeded rental six
   Human matches are REAL duels (hot-seat, 3v3); AI-vs-AI simulates with a
   seeded coin so the table always completes. One cup lives at a time in
   Store.state.stadium (synced with the room like everything else). */
(function () {
  const { el, uid } = U;
  const DEX = window.DEX || {};
  function sfx(n) { if (window.SFX && SFX[n]) SFX[n](); }

  const CUPS = {
    baby:   { e: "🍼", name: "Baby Cup",   lvl: 5,   desc: "First forms ONLY, shown at Lv 5 — everyone's tiny, nobody's safe." },
    poke:   { e: "🔴", name: "Poké Cup",   lvl: 50,  desc: "Your OWN caught Pokémon at Lv 50 — the classic Stadium ruleset. Catch before you enter!" },
    prime:  { e: "👑", name: "Prime Cup",  lvl: 100, desc: "Anything goes at Lv 100 — legendaries welcome. The heavyweight belt." },
    rental: { e: "🎲", name: "Rental Cup", lvl: 50,  desc: "Everyone is dealt a seeded RENTAL six and chooses 3 per match — zero prep, pure skill." },
    // 🎪 THE GIMMICK CUPS — each cup IS its spectacle: only that transform is
    // legal (for everyone, Gen Ladder be damned), and every AI trainer's ace
    // fires it. Mega restricts the roster to stone-worthy species; the rest
    // run the whole dex; Mixed deals each trainer a random era, seeded.
    mega:   { e: "✨", name: "Mega Cup",    lvl: 50, gim: "mega",  desc: "Mega-capable species ONLY — every ace Mega Evolves. Bring a stone-worthy squad." },
    zcup:   { e: "🌀", name: "Z Cup",       lvl: 50, gim: "z",     desc: "Any species — every ace fires a Z-MOVE. One devastating, unmissable strike each." },
    dyna:   { e: "🔴", name: "Dynamax Cup", lvl: 50, gim: "dyna",  desc: "Any species — every ace DYNAMAXES. Three towering turns each." },
    tera:   { e: "💎", name: "Tera Cup",    lvl: 50, gim: "tera",  desc: "Any species — every ace TERASTALLIZES. Pick your crystal wisely." },
    mixed:  { e: "🌈", name: "Mixed Cup",   lvl: 50, gim: "mixed", desc: "Every trainer draws a RANDOM gimmick for their ace — Mega, Z, Dynamax or Tera. Seeded chaos." },
  };
  const GIMS = ["mega", "z", "dyna", "tera"];
  // A player's gimmick in this cup: the cup's own, or their seeded Mixed draw.
  function cupGim(c, key) {
    const g = CUPS[c.cup].gim;
    if (!g) return null;
    if (g !== "mixed") return g;
    return GIMS[(mulberry32(((c.seed || 1) ^ strHash("gim-" + key)) >>> 0)() * 4) | 0];
  }

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function strHash(s) { let h = 9; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 387420489); return h >>> 0; }
  const PRE = {};
  Object.keys(window.EVO_LEVELS || {}).forEach((from) => {
    (window.EVO_LEVELS[from] || []).forEach((e) => { PRE[e.to] = 1; });
  });

  // Species legal in a cup. Baby = basics that can still evolve; Prime = the
  // whole dex, gods included; Rental draws from every non-legendary.
  function cupPool(cup, attId) {
    const ids = Object.keys(DEX).map(Number).filter((id) => id >= 1 && id <= 1025);
    if (cup === "baby") return ids.filter((id) => !DEX[id].leg && !PRE[id] && (window.EVO_LEVELS || {})[id]);
    if (cup === "prime") return ids;
    if (cup === "poke") return (window.Duel && Duel.poolFor(attId)) || [];
    // ✨ Mega Cup: only species with a stone — the ace transform must be REAL
    if (cup === "mega") return ids.filter((id) => (window.MEGA_BY_BASE || {})[id]);
    return ids.filter((id) => !DEX[id].leg);
  }
  function rentalSix(cup, seed, key) {
    const pool = cupPool(cup === "poke" ? "rental" : cup, null);
    const rnd = mulberry32((seed ^ strHash(key)) >>> 0);
    const out = [];
    let guard = 0;
    while (out.length < 6 && guard++ < 500) {
      const id = pool[(rnd() * pool.length) | 0];
      if (out.indexOf(id) < 0) out.push(id);
    }
    return out;
  }

  const cupOf = () => Store.state.stadium || null;
  function saveCup(fn) { Store.update((s) => { if (s.stadium) fn(s.stadium, s); }); }

  // ── Setup: pick a cup, seat the players, fill chairs with AI ──────────────
  let pickCup = "poke";
  let seats = null;                    // attId → true (per phone until start)
  function renderSetup(root) {
    root.appendChild(el("h2", { class: "section-title" }, "🏟 Open a cup"));
    root.appendChild(el("div", { class: "dex-toggle", style: { flexWrap: "wrap" } }, Object.keys(CUPS).map((k) =>
      el("button", { class: "btn sm" + (pickCup === k ? " primary" : " subtle"), onClick: () => { pickCup = k; Router.render(); } },
        CUPS[k].e + " " + CUPS[k].name))));
    root.appendChild(el("p", { class: "hint" }, CUPS[pickCup].desc));

    if (!seats) { seats = {}; Store.state.attendees.forEach((a) => { seats[a.id] = true; }); }
    root.appendChild(el("p", { class: "hint" }, "Who's in? (AI trainers fill the table up to at least four)"));
    root.appendChild(el("div", { class: "toolbar", style: { flexWrap: "wrap" } }, Store.state.attendees.map((a) =>
      el("button", { class: "btn sm " + (seats[a.id] ? "primary" : "subtle"), onClick: () => { seats[a.id] = !seats[a.id]; Router.render(); } },
        (seats[a.id] ? "✓ " : "") + a.name))));

    root.appendChild(el("div", { class: "toolbar" }, [
      el("button", { class: "btn primary spin-btn", onClick: () => {
        const humans = Store.state.attendees.filter((a) => seats[a.id]);
        if (!humans.length) { alert("Seat at least one trainer."); return; }
        if (pickCup === "poke") {
          const short = humans.filter((a) => cupPool("poke", a.id).length < 3);
          if (short.length) { alert("Poké Cup needs 3+ caught Pokémon each — " + short.map((a) => a.name).join(", ") + " must hit the Safari first (or run the Rental Cup)."); return; }
        }
        const seed = (Math.floor(Math.random() * 2147483647) || 1);
        const players = humans.map((a) => ({ key: a.id, name: a.name, ai: false }));
        // AI fills from the canon roster (seeded, no repeats) up to 4 seats.
        const canon = (window.CANON_TRAINERS || []).slice();
        const rnd = mulberry32(seed);
        while (players.length < 4 && canon.length) {
          const t = canon.splice((rnd() * canon.length) | 0, 1)[0];
          players.push({ key: "ai:" + t.name, name: t.name, ai: true });
        }
        // Rental cup deals everyone a six; AI trainers always play rentals.
        players.forEach((p) => {
          if (p.ai || pickCup === "rental") p.team = rentalSix(pickCup, seed, p.key);
        });
        Store.update((s) => {
          s.stadium = { id: uid("cup"), cup: pickCup, players: players, results: {}, seed: seed,
            stage: "rr", finals: null, ts: Date.now() };
          Store.chron(s, "🏟", "A " + CUPS[pickCup].name.toUpperCase() + " opened at the Stadium — " + players.filter((p) => !p.ai).length + " trainers, " + players.filter((p) => p.ai).length + " AI challengers. Round robin, then the FINAL FOUR.");
        });
        sfx("fanfare"); Router.render();
      } }, "🏟 OPEN THE " + CUPS[pickCup].name.toUpperCase()),
    ]));
  }

  // ── The table ──────────────────────────────────────────────────────────────
  function pairs(c) {
    const out = [];
    for (let i = 0; i < c.players.length; i++)
      for (let j = i + 1; j < c.players.length; j++) out.push([i, j]);
    return out;
  }
  function winsOf(c, i) {
    let w = 0;
    Object.keys(c.results).forEach((k) => { if (c.results[k] === i) w++; });
    return w;
  }
  function record(c, i, j, winnerIdx) {
    saveCup((cup, s) => {
      cup.results[i + ":" + j] = winnerIdx;
      const done = pairs(cup).every((p) => cup.results[p[0] + ":" + p[1]] !== undefined);
      if (done && cup.stage === "rr") {
        // Top four (by wins, seeded tiebreak) march into the FINALS.
        const rnd = mulberry32(cup.seed ^ 0xF1AA15);
        const order = cup.players.map((p, idx) => ({ idx: idx, w: winsOf(cup, idx), t: rnd() }))
          .sort((a, b) => (b.w - a.w) || (a.t - b.t));
        const top = order.slice(0, Math.min(4, cup.players.length));
        cup.stage = "finals";
        cup.finals = top.length >= 4
          ? { pairs: [[top[0].idx, top[3].idx], [top[1].idx, top[2].idx]], winners: [], champ: -1 }
          : { pairs: [[top[0].idx, top[1] ? top[1].idx : top[0].idx]], winners: [], champ: -1 };
        Store.chron(s, "🏟", "The " + CUPS[cup.cup].name + " round robin is COMPLETE — the finals are set!");
      }
    });
    Router.render();
  }
  function recordFinal(c, matchIdx, winnerIdx) {
    saveCup((cup, s) => {
      const f = cup.finals;
      f.winners[matchIdx] = winnerIdx;
      if (f.pairs.length === 2 && f.winners.filter((w) => w !== undefined).length === 2 && !f.finalPair) {
        f.finalPair = [f.winners[0], f.winners[1]];
      } else if (f.finalPair && f.winners[2] !== undefined) {
        f.champ = f.winners[2];
      } else if (f.pairs.length === 1 && f.winners[0] !== undefined) {
        f.champ = f.winners[0];
      }
      if (f.champ >= 0) {
        cup.stage = "done";
        const p = cup.players[f.champ];
        Store.chron(s, "🏆", (p.ai ? "AI challenger " : "") + p.name + " is the " + CUPS[cup.cup].name.toUpperCase() + " CHAMPION — round robin swept into a finals crown at the Stadium!");
      }
    });
    sfx("fanfare"); Router.render();
  }

  // ── Playing a match: real duel for humans, seeded coin for AI-vs-AI ──────
  function play(c, i, j, onWin) {
    const A = c.players[i], B = c.players[j];
    const lvl = CUPS[c.cup].lvl;
    if (A.ai && B.ai) {
      const rnd = mulberry32(c.seed ^ strHash(i + "v" + j));
      onWin(rnd() < 0.5 ? i : j);
      return;
    }
    // 🎪 gimmick cups: the AI's ace fires the cup's transform; humans get
    // ONLY that cup's button, Gen Ladder be damned (opts.gims allowlist).
    const unitFor = (p, ids) => p.ai
      ? { npc: p.name, ai: true, monIds: p.team.slice(0, 3), gimmick: cupGim(c, p.key) }
      : { attId: p.key, monIds: ids };
    // the battle's legal transforms = the two entrants' own (union) — in a
    // Mega Cup that's just "mega"; in Mixed, each side's seeded draw.
    const gimsAllowed = CUPS[c.cup].gim
      ? [A, B].map((p) => cupGim(c, p.key)).filter((g, ix, a) => g && a.indexOf(g) === ix)
      : null;
    const start = (aIds, bIds) => {
      Duel.start({ mode: "local", level: lvl, title: CUPS[c.cup].name,
        gims: gimsAllowed || undefined,
        a: { units: [unitFor(A, aIds)] },
        b: { units: [unitFor(B, bIds)] },
        onResult: (winSide) => { if (winSide === "a") onWin(i); else if (winSide === "b") onWin(j); } });
    };
    const pickFor = (p, done) => {
      if (p.ai) { done(null); return; }
      const pool = c.cup === "rental" ? p.team.slice() : cupPool(c.cup, p.key);
      const g = cupGim(c, p.key);
      Duel.pickParty({ attId: p.key, min: 3, max: 3, pool: pool,
        title: CUPS[c.cup].e + " " + p.name + " — pick 3 (" + CUPS[c.cup].name + ")",
        hint: (c.cup === "rental" ? "Choose 3 of your dealt rental six." : CUPS[c.cup].desc) +
          (g && CUPS[c.cup].gim === "mixed" ? " 🌈 YOUR drawn gimmick: " + ({ mega: "✨ Mega", z: "🌀 Z-Move", dyna: "🔴 Dynamax", tera: "💎 Tera" })[g] + "." : ""),
        onDone: done });
    };
    pickFor(A, (aIds) => pickFor(B, (bIds) => start(aIds, bIds)));
  }

  function matchRow(c, i, j, playedIdx, onPlay) {
    const A = c.players[i], B = c.players[j];
    return el("div", { class: "cup-match" + (playedIdx !== undefined ? " played" : "") }, [
      el("span", { class: "cup-side" + (playedIdx === i ? " won" : "") }, (A.ai ? "🤖 " : "") + A.name),
      el("span", { class: "cup-vs" }, "vs"),
      el("span", { class: "cup-side" + (playedIdx === j ? " won" : "") }, (B.ai ? "🤖 " : "") + B.name),
      playedIdx !== undefined
        ? el("span", { class: "cup-done" }, "✅")
        : el("button", { class: "btn primary sm", onClick: onPlay }, A.ai && B.ai ? "🎲 Sim" : "⚔ Play"),
    ]);
  }

  function renderCup(root, c) {
    const CUP = CUPS[c.cup];
    root.appendChild(el("div", { class: "safari-card" }, [
      el("div", { class: "nuz-lab-head" }, CUP.e + " " + CUP.name.toUpperCase() + " — " +
        (c.stage === "rr" ? "round robin" : c.stage === "finals" ? "THE FINALS" : "complete") + " · Lv " + CUP.lvl),
      el("p", { class: "hint" }, CUP.desc),
    ]));

    // Standings, always visible.
    const order = c.players.map((p, idx) => ({ p: p, idx: idx, w: winsOf(c, idx) })).sort((a, b) => b.w - a.w);
    root.appendChild(el("div", { class: "safari-card" }, [
      el("div", { class: "nuz-lab-head" }, "📊 Standings"),
      el("div", {}, order.map((r, rank) => el("div", { class: "nuz-hall-row" + (c.stage === "done" && c.finals && c.finals.champ === r.idx ? " crowned" : "") }, [
        el("span", { class: "nuz-hall-rank" }, c.stage === "done" && c.finals && c.finals.champ === r.idx ? "👑" : "#" + (rank + 1)),
        el("span", { class: "nuz-hall-name" }, (r.p.ai ? "🤖 " : "") + r.p.name),
        el("span", { class: "nuz-hall-sub" }, r.w + " win" + (r.w === 1 ? "" : "s") +
          (c.cup === "rental" && r.p.team ? " · " + r.p.team.slice(0, 3).map((id) => (DEX[id] || {}).n || id).join("/") + "…" : "") +
          (CUPS[c.cup].gim === "mixed" ? " · " + ({ mega: "✨ Mega", z: "🌀 Z", dyna: "🔴 Dyna", tera: "💎 Tera" })[cupGim(c, r.p.key)] : "")),
      ]))),
    ]));

    if (c.stage === "rr") {
      root.appendChild(el("h2", { class: "section-title" }, "⚔ Round robin — everyone meets everyone"));
      const host = el("div", { class: "safari-card" });
      root.appendChild(host);
      pairs(c).forEach((pr) => {
        const done = c.results[pr[0] + ":" + pr[1]];
        host.appendChild(matchRow(c, pr[0], pr[1], done, () => play(c, pr[0], pr[1], (w) => record(c, pr[0], pr[1], w))));
      });
    } else if (c.stage === "finals" && c.finals) {
      root.appendChild(el("h2", { class: "section-title" }, "👑 THE FINALS"));
      const host = el("div", { class: "safari-card" });
      root.appendChild(host);
      c.finals.pairs.forEach((pr, m) => {
        host.appendChild(el("p", { class: "hint" }, c.finals.pairs.length === 2 ? "Semifinal " + (m + 1) : "The Final"));
        host.appendChild(matchRow(c, pr[0], pr[1], c.finals.winners[m], () => play(c, pr[0], pr[1], (w) => recordFinal(c, m, w))));
      });
      if (c.finals.finalPair && c.finals.champ < 0) {
        host.appendChild(el("p", { class: "hint" }, "🏆 THE FINAL"));
        host.appendChild(matchRow(c, c.finals.finalPair[0], c.finals.finalPair[1], c.finals.winners[2],
          () => play(c, c.finals.finalPair[0], c.finals.finalPair[1], (w) => recordFinal(c, 2, w))));
      }
    } else if (c.stage === "done" && c.finals) {
      const champ = c.players[c.finals.champ];
      root.appendChild(el("div", { class: "safari-card result win" }, [
        el("div", { class: "safari-result-msg" }, "🏆 " + (champ.ai ? "🤖 " : "") + champ.name + " — " + CUP.name.toUpperCase() + " CHAMPION!"),
        el("p", { class: "hint" }, "Round robin survived, finals swept. Open another cup whenever the room's ready."),
      ]));
    }

    root.appendChild(el("div", { class: "toolbar" }, [
      el("button", { class: "btn subtle sm", onClick: () => {
        if (!confirm(c.stage === "done" ? "Clear the finished cup?" : "Cancel this cup? All its results are lost.")) return;
        Store.update((s) => { delete s.stadium; });
        seats = null; Router.render();
      } }, c.stage === "done" ? "🧹 Clear the cup" : "🏳️ Cancel cup"),
    ]));
  }

  function view(root) {
    root.appendChild(el("div", { class: "page-head" }, [
      el("h1", {}, "🏟 Stadium Cups"),
      el("p", { class: "page-sub" }, "The Pokémon Stadium homage — Baby, Poké, Prime and Rental Cups, plus the 🎪 GIMMICK CUPS (Mega · Z · Dynamax · Tera · Mixed) where every ace transforms: a round robin with friends and AI challengers, then a knockout FINALS for the crown." ),
    ]));
    if (!Store.state.attendees.length) { root.appendChild(el("p", { class: "empty" }, "Add trainers first (Squad page).")); return; }
    const c = cupOf();
    if (!c) renderSetup(root);
    else renderCup(root, c);
  }

  window.Views = window.Views || {};
  window.Views.cups = view;
})();
