/* tower.js — 🗼 The Battle Tower: THE 1→100 GAUNTLET. Endless 4v4 DOUBLE
   battles against randomized trainers where every floor IS a level: floor 1
   is a Lv1 scrap between base forms, floor 100 a Lv100 war. Both squads
   obey the evolution rules (JourneyStyle.formAt) — your Charizard climbs
   the tower as a Charmander until Lv16 — and movesets follow the engine's
   level curve (full arsenals from Lv58). Pick FOUR of your Pokémon (first
   two lead the 2v2 field, two ride the bench) against a random trainer
   running four randoms from your unlocked generations. Foes hit a little
   harder every win; every 7th battle TOWER TYCOON PALMER himself blocks
   the elevator. A loss resets the streak — your BEST streak is forever
   (and prints honors at 3/7/21). Streaks in Store.tower; battles never
   touch the real ladder, Elo, or leaderboards. */
(function () {
  const { el } = U;
  const DEX = window.DEX || {};
  const IDS = Object.keys(DEX).map(Number).filter((id) => id <= 1025);
  function sfx(n) { if (window.SFX && SFX[n]) SFX[n](); }
  function aName(id) { const a = Store.attendee(id); return a ? a.name : id; }

  // The tower's revolving door of challengers — class + name make the label.
  const CLASSES = ["Ace Trainer", "Veteran", "Dragon Tamer", "Hex Maniac", "Ranger", "Scientist",
    "Black Belt", "Psychic", "Skier", "Sailor", "Bird Keeper", "Cool Couple's", "Gambler", "Youngster"];
  const NAMES = ["Dawn", "Barry", "Marcus", "Elena", "Kip", "Sable", "Otis", "June", "Rocco", "Vera",
    "Hollis", "Piper", "Dex", "Mona", "Silas", "Wren", "Casper", "Lena", "Brutus", "Ivy"];

  // 🥈🥇 The Frontier Brain — every 7th battle. Silver print at 7, the gold
  // squad from 14 on (all pulled up to double-battle size).
  const PALMER_SILVER = [464, 149, 350, 488];
  const PALMER_GOLD = [485, 488, 486, 149];

  // 4 distinct random picks from this trainer's unlocked gens. legMode:
  // "none" (never), "some" (20% per slot), "all" (legendaries ONLY).
  function randomTeam(attId, legMode, lv) {
    const cap = (Store.genMaxIdFor && Store.genMaxIdFor(attId)) || 493;
    const pool = IDS.filter((id) => id <= cap && (legMode !== "all" || DEX[id].leg));
    const team = [];
    const clash = (id) => team.some((t) => formAtLv(t, lv) === formAtLv(id, lv));
    let guard = 0;
    while (team.length < 4 && guard++ < 400) {
      const id = pool[(Math.random() * pool.length) | 0];
      if (id == null || team.indexOf(id) >= 0 || clash(id)) continue;
      if (legMode !== "all" && DEX[id].leg && !(legMode === "some" && Math.random() < 0.2)) continue;
      team.push(id);
    }
    let i = 0;
    while (team.length < 4 && i < pool.length) { if (team.indexOf(pool[i]) < 0 && !clash(pool[i])) team.push(pool[i]); i++; }   // tiny-pool fallback
    return team;
  }

  // 🛗 THE 1→100 GAUNTLET: every floor IS a level. Floor 1 is a Lv1 scrap
  // between base forms; floor 100 is a Lv100 war. The battle-wide level
  // feeds the engine's moveset curve (40 + Lv×1.2 — full arsenals from
  // Lv58), and EVERY Pokémon walks in obeying the evolution rules: your
  // Charizard is a Charmander until floor 16 and doesn't get his wings
  // back until floor 36 (JourneyStyle.formAt, the True Story walk).
  function floorLevel(no) { return Math.min(100, no); }
  // Pre-evolution map (child form → parent) for the dedupe walk below.
  const PRE = {};
  Object.keys(window.EVO_LEVELS || {}).forEach((from) => {
    (window.EVO_LEVELS[from] || []).forEach((e) => { PRE[e.to] = +from; });
  });
  // The evolution chain from a mon's TRUE form down to its base:
  // chainOf(Charizard) = [Charizard, Charmeleon, Charmander].
  function chainOf(id) {
    const c = [id]; let cur = id, g = 0;
    while (PRE[cur] && g++ < 6) { cur = PRE[cur]; c.push(cur); }
    return c;
  }
  function devolve(ids, lv) {
    const f = window.JourneyStyle && JourneyStyle.formAt;
    return f ? ids.map((id) => f(id, lv)) : ids.slice();
  }
  function formAtLv(id, lv) {
    return (lv && window.JourneyStyle && JourneyStyle.formAt) ? JourneyStyle.formAt(id, lv) : id;
  }
  // 🚫 One of each face, enforced BEFORE the battle: at this floor's level,
  // a family collapses to one pickable entry (Charmander + Charmeleon are
  // the SAME mon at Lv5 — same form, same stats), represented by its
  // least-evolved owned member so the card you tap is the mon that fights.
  function gauntletPool(attId, lv) {
    const pool = Duel.poolFor(attId);
    const rep = {};
    pool.slice().sort((a, b) => chainOf(a).length - chainOf(b).length)
      .forEach((id) => { const fm = formAtLv(id, lv); if (rep[fm] == null) rep[fm] = id; });
    const keep = {}; Object.keys(rep).forEach((fm) => { keep[rep[fm]] = 1; });
    return pool.filter((id) => keep[id]);
  }

  function nextFoe(attId, lad) {
    const t = Store.towerOf(attId);
    const streak = lad === "rental" ? (t.rStreak || 0) : lad === "max" ? (t.mStreak || 0) : t.streak;
    const no = streak + 1;                               // this battle's number
    const lv = lad === "max" ? 100 : floorLevel(no);     // for form-collision dedupe
    const boost = Math.min(1.5, 1.02 + streak * 0.02);   // the tower tightens its grip
    // 🌩 every 14th floor the elevator opens on the LEGENDS FLOOR — four
    // random legendaries, no trainer, no mercy. PALMER keeps the other 7s.
    if (no % 14 === 0) {
      return { name: "THE LEGENDS FLOOR", tycoon: true, legends: true, boost: boost + 0.05,
        team: randomTeam(attId, "all", lv), face: 493 };
    }
    if (no % 7 === 0) {
      return { name: "TOWER TYCOON PALMER", tycoon: true, boost: boost + 0.08,
        team: (no >= 21 ? PALMER_GOLD : PALMER_SILVER).slice(), face: no >= 21 ? 486 : 149 };
    }
    // Random challenger — legendaries stay out of their pool until the streak
    // earns them (5+), and even then only sometimes.
    return { name: CLASSES[(Math.random() * CLASSES.length) | 0] + " " + NAMES[(Math.random() * NAMES.length) | 0],
      tycoon: false, boost: boost, team: randomTeam(attId, streak >= 5 ? "some" : "none", lv) };
  }

  // Per-phone challenger (like the Safari) + which ladder they're climbing:
  // "classic" (the 1→100 gauntlet), "rental", or "max" (flat LEVEL 100).
  let me = "";
  let ladder = "classic";

  function view(root) {
    const meId = (window.Sync && Sync.getMe && Sync.getMe()) || "";
    if (!me && meId && Store.attendee(meId)) me = meId;

    root.appendChild(el("div", { class: "page-head" }, [
      el("h1", {}, "🗼 Battle Tower"),
      el("p", { class: "page-sub" }, "THE 1→100 GAUNTLET: 4v4 double battles where every floor IS a level — everyone enters in the form they'd really be at that level and evolves as you climb. Foes hit harder every floor, PALMER guards every 7th, one loss resets the streak. Prefer full power? The 💯 LEVEL 100 ladder fights every floor at Lv100, everything fully evolved."),
    ]));

    const sel = el("select", { class: "in" }, [el("option", { value: "" }, "— pick a trainer —")].concat(
      Store.state.attendees.map((a) => el("option", { value: a.id, selected: me === a.id ? "true" : null }, a.name))));
    sel.addEventListener("change", () => { me = sel.value; Router.render(); });
    const lockedRow = U.lockedTrainerRow("Climbing as:");
    if (lockedRow) { me = lockedRow.dataset.me; root.appendChild(lockedRow); }
    else root.appendChild(el("div", { class: "safari-trainer" }, [el("span", { class: "safari-trainer-lbl" }, "Climbing as:"), sel]));

    const body = el("div", {});
    root.appendChild(body);
    if (!me) { body.appendChild(el("p", { class: "empty" }, "👆 Pick a trainer to enter the tower.")); board(body); return; }

    // Three ladders: the 1→100 gauntlet (your team), Rental (dealt squads,
    // gauntlet levels), and the 💯 LEVEL 100 ladder (flat Lv100, full power).
    const t = Store.towerOf(me);
    const tab = (key, label) => el("button", { class: "btn sm" + (ladder === key ? " primary" : " subtle"),
      onClick: () => { ladder = key; Router.render(); } }, label);
    body.appendChild(el("div", { class: "dex-toggle" }, [
      tab("classic", "🛗 Gauntlet"), tab("rental", "🎲 Rental"), tab("max", "💯 Level 100"),
    ]));
    const rental = ladder === "rental";
    const streak = rental ? (t.rStreak || 0) : ladder === "max" ? (t.mStreak || 0) : t.streak;
    const best = rental ? (t.rBest || 0) : ladder === "max" ? (t.mBest || 0) : (t.best || 0);
    const no = streak + 1;
    const isLegends = no % 14 === 0;
    const isTycoon = !isLegends && no % 7 === 0;
    body.appendChild(el("div", { class: "safari-stats" }, [
      stat("🔥 " + streak, (rental ? "Rental" : ladder === "max" ? "Lv100" : "Gauntlet") + " streak"),
      stat("🏆 " + best, "Best " + (rental ? "(rental)" : ladder === "max" ? "(Lv100)" : "(gauntlet)")),
      stat((isLegends ? "🌩 " : isTycoon ? "👑 " : "🛗 ") + no, "Next floor"),
    ]));

    const card = el("div", { class: "safari-card tower-card" + (isTycoon || isLegends ? " tycoon" : "") });
    body.appendChild(card);
    const lv = ladder === "max" ? 100 : floorLevel(no);
    card.appendChild(el("div", { class: "nuz-lab-head" }, isLegends
      ? "🌩 Floor " + no + " — THE LEGENDS FLOOR (Lv" + lv + ")"
      : isTycoon
      ? "👑 Floor " + no + " — TOWER TYCOON PALMER bars the way (Lv" + lv + ")"
      : "🛗 Floor " + no + " — a challenger is waiting (Lv" + lv + ")"));
    card.appendChild(el("p", { class: "hint" }, isLegends
      ? "The elevator opens on an empty hall… and FOUR RANDOM LEGENDARIES descend. No trainer. No mercy."
      : isTycoon
      ? "“You've climbed well. But this floor is MINE.” Beat the Tycoon for the " + (no >= 21 ? "GOLD" : "silver") + " print."
      : (rental
        ? "The tower hands YOU four random rentals and the foe four of their own — pure piloting skill, boosted ×" + nextFoe(me, "rental").boost.toFixed(2) + "."
        : ladder === "max"
        ? "The FULL-POWER ladder: every floor is LEVEL 100 — full evolutions, full arsenals, boosted ×" + nextFoe(me, "max").boost.toFixed(2) + ". No training wheels, no mercy."
        : "A random trainer, four random Pokémon from your unlocked generations, boosted ×" + nextFoe(me, "classic").boost.toFixed(2) + " — you won't know the lineup until the balls open.")
      + (lv < 58 ? " Every floor IS a level — everyone fights in the form they'd be at Lv" + lv + ", and the heaviest moves stay locked until Lv58." : "")));
    if (!rental && gauntletPool(me, lv).length < 4) {
      card.appendChild(el("p", { class: "empty" }, "The tower asks for FOUR different Pokémon — at Lv" + lv + " a family counts as ONE. Catch more variety in the Safari (or flip to 🎲 Rental)."));
    } else {
      card.appendChild(el("div", { class: "safari-actions" }, [
        el("button", { class: "btn primary", onClick: () => climb() }, rental ? "🎲 Battle — take your rentals" : "⚔ Battle — pick your 4"),
        // Two-tap leave — native confirm() is silently suppressed in
        // iOS home-screen apps, so the button itself asks twice.
        streak > 0 ? (function () {
          let armed = false;
          const btn = el("button", { class: "btn subtle sm", onClick: () => {
            if (!armed) { armed = true; btn.textContent = "🚪 Sure? Streak of " + streak + " resets — tap again"; return; }
            Store.towerLoss(me, "the walk of shame", ladder); Router.render();
          } }, "🚪 Leave the tower");
          return btn;
        })() : null,
      ]));
    }

    board(body);
  }

  function stat(v, l) { return el("div", { class: "safari-stat" }, [el("div", { class: "safari-stat-v" }, String(v)), el("div", { class: "safari-stat-l" }, l)]); }

  function climb() {
    const lad = ladder, isRental = lad === "rental";
    const foe = nextFoe(me, lad);
    const t0 = Store.towerOf(me);
    const no = (isRental ? (t0.rStreak || 0) : lad === "max" ? (t0.mStreak || 0) : t0.streak) + 1;
    const lv = lad === "max" ? 100 : floorLevel(no);
    const go = (ids) => {
      // Both squads walk in at the FLOOR's level: devolved to the forms
      // they'd really be. (Streaks record your real picks, not the forms.)
      const mine = devolve(ids, lv), theirs = devolve(foe.team, lv);
      Duel.start({ mode: "local", title: "the Battle Tower", level: lv,
        tower: { onEnd: (winSide) => {
          if (winSide === "a") { Store.towerWin(me, foe.name, foe.tycoon, ids, lad); sfx("fanfare"); }
          else { Store.towerLoss(me, foe.name, lad); sfx("error"); }
          Router.render();
        } },
        a: { shared: true, units: [{ attId: me, monIds: mine }, { attId: me, monIds: mine }] },
        b: { shared: true, units: [
          { npc: foe.name, ai: true, monIds: theirs, boost: foe.boost, vsFace: foe.tycoon ? foe.face : null },
          { npc: foe.name, ai: true, monIds: theirs, boost: foe.boost } ] } });
    };
    if (isRental) {
      // 🎲 the tower hands you the squad — see it, steel yourself, go.
      const mine = randomTeam(me, "none", lv);
      let ctrl;
      const body = el("div", { class: "modal-form" }, [
        el("p", { class: "hint" }, "🎲 Your rentals for floor " + ((Store.towerOf(me).rStreak || 0) + 1) + " (Lv" + lv + ") — no swaps, no re-rolls. First two lead the 2v2."),
        el("div", { class: "nuz-foe-row" }, devolve(mine, lv).map((id) => Store.sprite(id) ? el("img", { class: "nuz-foe-img", src: Store.sprite(id), alt: "" }) : null)),
        el("div", { class: "toolbar" }, [
          el("button", { class: "btn primary", onClick: () => { ctrl.close(); go(mine); } }, "⚔ Take them up"),
          el("button", { class: "btn subtle", onClick: () => ctrl.close() }, "Not yet"),
        ]),
      ]);
      ctrl = Modal.open("🎲 Rental squad", body, null, { noFooter: true });
      return;
    }
    Duel.pickParty({ attId: me, min: 4, max: 4, pool: gauntletPool(me, lv),
      title: "🗼 Floor " + no + " (Lv" + lv + ") — vs " + foe.name,
      hint: "4v4 DOUBLE battle — your first two lead the field (2v2), the other two ride the bench. At this floor's level a family is ONE pick (Charmander and Charmeleon are the same mon at Lv5). Their four stay secret until sent out.",
      onDone: go });
  }

  // 🏆 The streak board — every trainer's current run + high-water mark.
  function board(host) {
    const rows = Store.state.attendees
      .map((a) => ({ a: a, t: Store.towerOf(a.id) }))
      .filter((r) => (r.t.best || 0) > 0 || r.t.streak > 0 || (r.t.rBest || 0) > 0 || (r.t.mBest || 0) > 0)
      .sort((x, y) => (y.t.best - x.t.best) || ((y.t.mBest || 0) - (x.t.mBest || 0)) || ((y.t.rBest || 0) - (x.t.rBest || 0)) || (y.t.streak - x.t.streak));
    if (!rows.length) return;
    host.appendChild(el("div", { class: "safari-card nuz-hall" }, [
      el("div", { class: "nuz-lab-head" }, "🏆 Tower streak board"),
      el("div", {}, rows.map((r, i) => el("div", { class: "nuz-hall-row" + (i === 0 ? " crowned" : "") }, [
        el("span", { class: "nuz-hall-rank" }, i === 0 ? "👑" : "#" + (i + 1)),
        el("span", { class: "nuz-hall-name" }, r.a.name),
        el("span", { class: "nuz-hall-sub" }, "best " + (r.t.best || 0)
          + ((r.t.mBest || 0) > 0 ? " · 💯 lv100 " + r.t.mBest : "")
          + ((r.t.rBest || 0) > 0 ? " · 🎲 rental " + r.t.rBest : "")
          + (r.t.streak ? " · riding " + r.t.streak : "")
          + (r.t.best >= 7 ? " · 🗼 Tycoon slain" : "")),
      ]))),
    ]));
  }

  window.Views = window.Views || {};
  window.Views.tower = view;
  // Tuning/debug hook (used by tests; harmless in production).
  window.TowerDebug = { gauntletPool: gauntletPool, randomTeam: randomTeam, devolve: devolve };
})();
