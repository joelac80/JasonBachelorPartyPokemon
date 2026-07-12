/* tower.js — 🗼 The Battle Tower: endless 4v4 DOUBLE battles against
   randomized trainers, with saved win streaks. Every battle: pick FOUR of
   your Pokémon (first two lead the 2v2 field, two ride the bench) against a
   random trainer running four random Pokémon from your unlocked generations.
   Foes hit a little harder every win; every 7th battle TOWER TYCOON PALMER
   himself blocks the elevator. A loss resets the streak — your BEST streak
   is forever (and prints honors at 3/7/21). Streaks in Store.tower; battles
   never touch the real ladder, Elo, or leaderboards. */
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

  function nextFoe(attId) {
    const streak = Store.towerOf(attId).streak;
    const no = streak + 1;                               // this battle's number
    const boost = Math.min(1.5, 1.02 + streak * 0.02);   // the tower tightens its grip
    if (no % 7 === 0) {
      return { name: "TOWER TYCOON PALMER", tycoon: true, boost: boost + 0.08,
        team: (no >= 14 ? PALMER_GOLD : PALMER_SILVER).slice(), face: no >= 14 ? 486 : 149 };
    }
    // Random challenger: 4 distinct picks from THIS trainer's unlocked gens.
    // Legendaries stay out of the pool until the streak earns them (5+), and
    // even then only sometimes — the tower is a grind, not a slot machine.
    const cap = (Store.genMaxIdFor && Store.genMaxIdFor(attId)) || 493;
    const pool = IDS.filter((id) => id <= cap);
    const legOk = streak >= 5;
    const team = [];
    let guard = 0;
    while (team.length < 4 && guard++ < 400) {
      const id = pool[(Math.random() * pool.length) | 0];
      if (team.indexOf(id) >= 0) continue;
      if (DEX[id].leg && !(legOk && Math.random() < 0.2)) continue;
      team.push(id);
    }
    while (team.length < 4) team.push(pool[team.length]);   // tiny-pool fallback
    return { name: CLASSES[(Math.random() * CLASSES.length) | 0] + " " + NAMES[(Math.random() * NAMES.length) | 0],
      tycoon: false, boost: boost, team: team };
  }

  // Per-phone challenger (like the Safari).
  let me = "";

  function view(root) {
    const meId = (window.Sync && Sync.getMe && Sync.getMe()) || "";
    if (!me && meId && Store.attendee(meId)) me = meId;

    root.appendChild(el("div", { class: "page-head" }, [
      el("h1", {}, "🗼 Battle Tower"),
      el("p", { class: "page-sub" }, "Endless 4v4 double battles against random trainers — foes hit harder every floor, PALMER guards every 7th, and one loss resets the streak. How high can you climb?"),
    ]));

    const sel = el("select", { class: "in" }, [el("option", { value: "" }, "— pick a trainer —")].concat(
      Store.state.attendees.map((a) => el("option", { value: a.id, selected: me === a.id ? "true" : null }, a.name))));
    sel.addEventListener("change", () => { me = sel.value; Router.render(); });
    root.appendChild(el("div", { class: "safari-trainer" }, [el("span", { class: "safari-trainer-lbl" }, "Climbing as:"), sel]));

    const body = el("div", {});
    root.appendChild(body);
    if (!me) { body.appendChild(el("p", { class: "empty" }, "👆 Pick a trainer to enter the tower.")); board(body); return; }

    const t = Store.towerOf(me);
    const no = t.streak + 1;
    const isTycoon = no % 7 === 0;
    body.appendChild(el("div", { class: "safari-stats" }, [
      stat("🔥 " + t.streak, "Current streak"),
      stat("🏆 " + (t.best || 0), "Best streak"),
      stat((isTycoon ? "👑 " : "🛗 ") + no, "Next floor"),
    ]));

    const card = el("div", { class: "safari-card tower-card" + (isTycoon ? " tycoon" : "") });
    body.appendChild(card);
    card.appendChild(el("div", { class: "nuz-lab-head" }, isTycoon
      ? "👑 Floor " + no + " — TOWER TYCOON PALMER bars the way"
      : "🛗 Floor " + no + " — a challenger is waiting"));
    card.appendChild(el("p", { class: "hint" }, isTycoon
      ? "“You've climbed well. But this floor is MINE.” Beat the Tycoon for the " + (no >= 14 ? "GOLD" : "silver") + " print."
      : "A random trainer, four random Pokémon from your unlocked generations, boosted ×" + nextFoe(me).boost.toFixed(2) + " — you won't know the lineup until the balls open."));
    if (Duel.poolFor(me).length < 4) {
      card.appendChild(el("p", { class: "empty" }, "The tower asks for FOUR Pokémon — catch a few more in the Safari first."));
    } else {
      card.appendChild(el("div", { class: "safari-actions" }, [
        el("button", { class: "btn primary", onClick: () => climb() }, "⚔ Battle — pick your 4"),
        t.streak > 0 ? el("button", { class: "btn subtle sm", onClick: () => {
          if (!confirm("Walk away and bank the memory? Your current streak of " + t.streak + " resets.")) return;
          Store.towerLoss(me, "the walk of shame"); Router.render();
        } }, "🚪 Leave the tower") : null,
      ]));
    }

    board(body);
  }

  function stat(v, l) { return el("div", { class: "safari-stat" }, [el("div", { class: "safari-stat-v" }, String(v)), el("div", { class: "safari-stat-l" }, l)]); }

  function climb() {
    const foe = nextFoe(me);
    Duel.pickParty({ attId: me, min: 4, max: 4,
      title: "🗼 Floor " + (Store.towerOf(me).streak + 1) + " — vs " + foe.name,
      hint: "4v4 DOUBLE battle — your first two lead the field (2v2), the other two ride the bench. Their four stay secret until sent out.",
      onDone: (ids) => {
        Duel.start({ mode: "local", title: "the Battle Tower",
          tower: { onEnd: (winSide) => {
            if (winSide === "a") { Store.towerWin(me, foe.name, foe.tycoon); sfx("fanfare"); }
            else { Store.towerLoss(me, foe.name); sfx("error"); }
            Router.render();
          } },
          a: { shared: true, units: [{ attId: me, monIds: ids }, { attId: me, monIds: ids }] },
          b: { shared: true, units: [
            { npc: foe.name, ai: true, monIds: foe.team, boost: foe.boost, vsFace: foe.tycoon ? foe.face : null },
            { npc: foe.name, ai: true, monIds: foe.team, boost: foe.boost } ] } });
      } });
  }

  // 🏆 The streak board — every trainer's current run + high-water mark.
  function board(host) {
    const rows = Store.state.attendees
      .map((a) => ({ a: a, t: Store.towerOf(a.id) }))
      .filter((r) => (r.t.best || 0) > 0 || r.t.streak > 0)
      .sort((x, y) => (y.t.best - x.t.best) || (y.t.streak - x.t.streak));
    if (!rows.length) return;
    host.appendChild(el("div", { class: "safari-card nuz-hall" }, [
      el("div", { class: "nuz-lab-head" }, "🏆 Tower streak board"),
      el("div", {}, rows.map((r, i) => el("div", { class: "nuz-hall-row" + (i === 0 ? " crowned" : "") }, [
        el("span", { class: "nuz-hall-rank" }, i === 0 ? "👑" : "#" + (i + 1)),
        el("span", { class: "nuz-hall-name" }, r.a.name),
        el("span", { class: "nuz-hall-sub" }, "best " + (r.t.best || 0) + (r.t.streak ? " · riding " + r.t.streak : "") + (r.t.best >= 7 ? " · 🗼 Tycoon slain" : "")),
      ]))),
    ]));
  }

  window.Views = window.Views || {};
  window.Views.tower = view;
})();
