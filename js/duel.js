/* duel.js — real turn-based Pokémon duels. Global `Duel`.
   Duel.start({ a: {attId, monId}, b: {attId, monId}, title, onResult })
   Everything fights at Lv50: HP and attack come from the species' power
   stat (DEX x), moves come from its types (a reliable hit + a heavy risky
   one per type). Drink actions spice it up:
     🧪 Drink Potion   — take 3 sips → heal 60 HP (2 per battle)
     🍺 Liquid Courage — finish half your drink → next attack can't miss
                         and lands a guaranteed CRITICAL HIT (once)
   Hot-seat: pass the phone each turn. Wins are logged like any battle
   (battle log + Victory Road points + chronicle), and when a room is live
   the duel is broadcast so the crew gets the "Watch" alert. */
(function () {
  const { el } = U;
  const DEX = window.DEX || {};
  const SP = window.DEX_SPRITES || {};
  const BACK = window.SPRITES_BACK || {};
  function sfx(n) { if (window.SFX && SFX[n]) SFX[n](); }
  function now() { try { return Date.now(); } catch (_) { return 0; } }

  const TYPE_EMOJI = { normal: "⭐", fire: "🔥", water: "💧", electric: "⚡", grass: "🌿", ice: "❄️", fighting: "🥊", poison: "☠️", ground: "⛰️", flying: "🪽", psychic: "🔮", bug: "🐛", rock: "🪨", ghost: "👻", dragon: "🐉", dark: "🌑", steel: "⚙️", fairy: "✨" };
  const TYPE_COLOR = { normal: "#a8a878", fire: "#f08030", water: "#6890f0", electric: "#e0b400", grass: "#78c850", ice: "#58b8c8", fighting: "#c03028", poison: "#a040a0", ground: "#c8a850", flying: "#a890f0", psychic: "#f85888", bug: "#a8b820", rock: "#b8a038", ghost: "#705898", dragon: "#7038f8", dark: "#705848", steel: "#9898b0", fairy: "#e87898" };

  // Two damage moves per type: [name, power, accuracy]. The first is the
  // reliable jab, the second the heavy haymaker that sometimes whiffs.
  const MOVES = {
    normal: [["Body Slam", 60, 100], ["Double-Edge", 100, 85]],
    fire: [["Flamethrower", 65, 100], ["Fire Blast", 110, 75]],
    water: [["Surf", 65, 100], ["Hydro Pump", 110, 75]],
    electric: [["Thunderbolt", 65, 100], ["Thunder", 110, 70]],
    grass: [["Razor Leaf", 60, 100], ["Solar Beam", 110, 80]],
    ice: [["Ice Beam", 65, 100], ["Blizzard", 110, 70]],
    fighting: [["Brick Break", 60, 100], ["Cross Chop", 105, 80]],
    poison: [["Sludge", 60, 100], ["Sludge Bomb", 105, 80]],
    ground: [["Dig", 60, 100], ["Earthquake", 100, 90]],
    flying: [["Wing Attack", 60, 100], ["Sky Attack", 110, 75]],
    psychic: [["Psybeam", 60, 100], ["Psychic", 100, 85]],
    bug: [["Fury Cutter", 55, 100], ["Megahorn", 115, 75]],
    rock: [["Rock Throw", 55, 100], ["Rock Slide", 105, 80]],
    ghost: [["Lick", 55, 100], ["Shadow Ball", 100, 85]],
    dragon: [["Dragon Breath", 60, 100], ["Outrage", 110, 75]],
    dark: [["Bite", 60, 100], ["Crunch", 105, 80]],
    steel: [["Metal Claw", 55, 100], ["Iron Tail", 105, 75]],
    fairy: [["Fairy Wind", 55, 100], ["Moonblast", 110, 75]],
  };

  // Lv50 battle stats from the species power stat (x = base experience).
  function statsFor(monId) {
    const d = DEX[monId] || { n: "???", x: 60 };
    const x = d.x || 60;
    const types = (d.t && d.t.length ? d.t : ["normal"]).slice(0, 2);
    const moves = [];
    types.forEach((t) => (MOVES[t] || MOVES.normal).forEach((m) =>
      moves.push({ name: m[0], pow: m[1], acc: m[2], type: t })));
    // Mono-typed mons round out their set with a neutral Tackle.
    if (types.length === 1 && types[0] !== "normal") moves.push({ name: "Tackle", pow: 50, acc: 100, type: "normal" });
    return { id: monId, name: d.n, x: x, types: types,
      hpMax: 120 + Math.round(x * 0.5), atk: 0.55 + x / 500, moves: moves.slice(0, 4) };
  }

  // Effectiveness vs a (possibly dual-typed) defender.
  function effFor(moveType, defTypes) {
    const f = window.Battle && Battle.effectiveness;
    if (!f) return 1;
    return defTypes.reduce((m, t) => m * f(moveType, t), 1);
  }

  function hpBox(F, side) {
    const fill = el("div", { class: "battle-hp-fill" });
    const num = el("span", { class: "duel-hp-num" }, F.hp + " / " + F.mon.hpMax);
    const box = el("div", { class: "battle-hpbox " + side }, [
      el("div", { class: "battle-hp-mem" }, [
        el("div", { class: "battle-hp-name" }, [F.mon.name + " ", el("span", { class: "duel-lv" }, "Lv50")]),
        el("div", { class: "battle-hp-row" }, [
          el("span", { class: "battle-hp-lbl" }, "HP"),
          el("div", { class: "battle-hp-track" }, [fill]),
        ]),
        el("div", { class: "duel-hp-sub" }, [num, el("span", { class: "duel-owner" }, F.name)]),
      ]),
    ]);
    function paint() {
      const pct = Math.max(0, F.hp / F.mon.hpMax);
      fill.style.width = (pct * 100).toFixed(1) + "%";
      fill.classList.toggle("low", pct <= 0.5 && pct > 0.2);
      fill.classList.toggle("crit", pct <= 0.2);
      num.textContent = Math.max(0, F.hp) + " / " + F.mon.hpMax;
    }
    paint();
    return { box: box, paint: paint };
  }

  function spriteEl(F, side) {
    const back = side === "you" ? BACK[F.mon.id] : "";
    const src = back || SP[F.mon.id] || (window.Store && Store.sprite(F.mon.id)) || "";
    const inner = src
      ? el("img", { class: "battle-sprite-img", src: src, alt: "",
          style: side === "you" && !back ? { transform: "scaleX(-1)" } : {} })
      : el("div", { class: "battle-ball-inner" });
    return el("div", { class: "battle-sprite " + side }, [el("div", { class: "battle-mon mon0" }, [inner])]);
  }

  function start(opts) {
    opts = opts || {};
    function fighter(sideOpts) {
      const at = Store.attendee(sideOpts.attId) || { name: "Trainer", team: "" };
      const mon = statsFor(sideOpts.monId);
      return { attId: sideOpts.attId, name: at.name, teamId: at.team || "",
        mon: mon, hp: mon.hpMax, potions: 2, courage: true, armed: false };
    }
    const A = fighter(opts.a), B = fighter(opts.b);
    const title = (opts.title || "Duel").trim() || "Duel";
    let turn = A.mon.x === B.mon.x ? (Math.random() < 0.5 ? "a" : "b") : (A.mon.x > B.mon.x ? "a" : "b");
    let moved = 0, done = false;

    const youHp = hpBox(A, "you"), foeHp = hpBox(B, "foe");
    const youSprite = spriteEl(A, "you"), foeSprite = spriteEl(B, "foe");
    const msg = el("div", { class: "battle-msg" }, title + " — " + A.name + " VS " + B.name + "!");
    const menu = el("div", { class: "battle-menu" });
    const overlay = el("div", { class: "battle" }, [
      el("div", { class: "battle-arena" }, [
        el("div", { class: "battle-platform foe" }), el("div", { class: "battle-platform you" }),
        foeHp.box, foeSprite, youSprite, youHp.box,
      ]),
      msg, menu,
    ]);
    function close() { overlay.classList.add("out"); setTimeout(() => overlay.remove(), 350); }
    function cur() { return turn === "a" ? A : B; }
    function other() { return turn === "a" ? B : A; }
    function spriteOf(F) { return F === A ? youSprite : foeSprite; }
    function hpOf(F) { return F === A ? youHp : foeHp; }

    // Broadcast so the room gets the "Watch" alert (winner reveal for them).
    let live = false;
    if (opts.broadcast !== false && window.Sync && Sync.isLive && Sync.isLive()) {
      live = true;
      Sync.startLiveBattle({ aName: A.name, bName: B.name, event: title,
        aClient: Sync.myClientId(), mode: "duel" });
    }

    // Play a sequence of [text, waitMs] beats, then call done().
    function beats(steps, fin) {
      let i = 0;
      (function next() {
        if (i >= steps.length) { if (fin) fin(); return; }
        const s = steps[i++];
        if (s[0] != null) msg.textContent = s[0];
        if (s[2]) s[2]();
        setTimeout(next, s[1]);
      })();
    }

    function finish(winner, loser, how) {
      done = true;
      menu.innerHTML = "";
      beats([
        [how === "faint" ? loser.mon.name + " fainted!" : loser.name + " chickened out!", 1200,
          () => { spriteOf(loser).classList.add("fainted"); sfx("error"); }],
        ["🏆 " + winner.name + "'s " + winner.mon.name + " wins the duel!", 1900, () => sfx("fanfare")],
      ], () => { close(); if (opts.onResult) opts.onResult(winner === A ? "a" : "b"); });
      try {
        Store.update((s) => {
          s.battles = s.battles || { log: [] }; s.battles.log = s.battles.log || [];
          s.battles.log.unshift({ title: title, winner: winner.name, loser: loser.name, ts: now(),
            duel: true, wMon: winner.mon.name, lMon: loser.mon.name });
          if (s.battles.log.length > 60) s.battles.log.length = 60;
          if (winner.teamId) Store.grantPoints(s, "battle", winner.teamId, 4);
          if (Store.chron) Store.chron(s, "⚔️", winner.name + "'s " + winner.mon.name + " KO'd " +
            loser.name + "'s " + loser.mon.name + " in a duel!");
        });
      } catch (_) {}
      if (live) try { Sync.finishLiveBattle(winner.name); } catch (_) {}
    }

    function attack(move) {
      const me = cur(), foe = other();
      moved++;
      menu.innerHTML = "";
      const armed = me.armed; me.armed = false;
      const hits = armed || Math.random() * 100 < move.acc;
      spriteOf(me).classList.add("attack");
      setTimeout(() => spriteOf(me).classList.remove("attack"), 600);
      if (!hits) {
        beats([
          [me.mon.name + " used " + move.name + "!", 850, () => sfx("select")],
          ["…it missed!", 1000, () => sfx("error")],
        ], nextTurn);
        return;
      }
      const eff = effFor(move.type, foe.mon.types);
      const crit = armed || Math.random() < 0.08;
      const dmg = Math.max(1, Math.round(move.pow * me.mon.atk * eff * (crit ? 2 : 1) * (0.85 + Math.random() * 0.15)));
      const steps = [[me.mon.name + " used " + move.name + "!", 800, () => sfx("select")]];
      steps.push([null, 500, () => {
        foe.hp = Math.max(0, foe.hp - dmg);
        const sp = spriteOf(foe);
        sp.classList.add("hurt"); if (crit) sp.classList.add("crit");
        setTimeout(() => sp.classList.remove("hurt", "crit"), 700);
        hpOf(foe).paint(); sfx("coin");
      }]);
      if (crit) steps.push([armed ? "🍺💥 LIQUID COURAGE — a guaranteed critical hit!" : "💥 A critical hit!", 900, () => sfx("correct")]);
      if (eff > 1) steps.push(["It's super effective!", 900]);
      else if (eff < 1) steps.push(["It's not very effective…", 900]);
      steps.push(["−" + dmg + " HP!", 700]);
      beats(steps, () => { if (foe.hp <= 0) finish(me, foe, "faint"); else nextTurn(); });
    }

    // Drink actions — inline confirm so the table can verify the sips happen.
    function confirmPanel(lines, okLabel, onOk) {
      menu.innerHTML = "";
      menu.appendChild(el("div", { class: "duel-confirm" }, [
        el("div", { class: "duel-confirm-txt" }, lines),
        el("div", { class: "battle-menu-row" }, [
          el("button", { class: "btn primary", onClick: onOk }, okLabel),
          el("button", { class: "btn subtle", onClick: renderMenu }, "↩ Back"),
        ]),
      ]));
    }
    function potion() {
      const me = cur();
      confirmPanel("🧪 Drink Potion — " + me.name + " takes 3 sips, and " + me.mon.name + " heals 60 HP.",
        "✅ Sips taken — heal!", () => {
          me.potions--; moved++;
          me.hp = Math.min(me.mon.hpMax, me.hp + 60);
          hpOf(me).paint();
          menu.innerHTML = "";
          beats([[me.mon.name + " regained health! (+60 HP)", 1100, () => sfx("coin")]], nextTurn);
        });
    }
    function courage() {
      const me = cur();
      confirmPanel("🍺 Liquid Courage — " + me.name + " finishes half their drink. " + me.mon.name +
        "'s next attack can't miss and lands a CRITICAL HIT.",
        "🍺 Chugged!", () => {
          me.courage = false; me.armed = true; moved++;
          menu.innerHTML = "";
          beats([[me.mon.name + " is fired up!", 1100, () => sfx("correct")]], nextTurn);
        });
    }
    function forfeit() {
      const me = cur(), foe = other();
      if (!moved) {                       // nothing happened yet — just walk away
        if (live) try { Sync.finishLiveBattle(""); } catch (_) {}
        close(); return;
      }
      if (confirm("Give up? " + foe.name + "'s " + foe.mon.name + " takes the win.")) finish(foe, me, "forfeit");
    }

    function moveBtn(m) {
      return el("button", { class: "duel-move", style: { "--mt": TYPE_COLOR[m.type] || "#a8a878" }, onClick: () => attack(m) }, [
        el("span", { class: "duel-move-name" }, (TYPE_EMOJI[m.type] || "⭐") + " " + m.name),
        el("span", { class: "duel-move-sub" }, "POW " + m.pow + " · " + m.acc + "%"),
      ]);
    }
    function renderMenu() {
      if (done) return;
      const me = cur();
      menu.innerHTML = "";
      menu.appendChild(el("div", { class: "duel-turn " + (turn === "a" ? "you" : "foe") },
        "🎮 " + me.name + " — what will " + me.mon.name + " do?" + (me.armed ? " (🍺 crit armed!)" : "")));
      menu.appendChild(el("div", { class: "duel-moves" }, me.mon.moves.map(moveBtn)));
      menu.appendChild(el("div", { class: "battle-menu-row duel-items" }, [
        el("button", { class: "btn subtle sm", disabled: me.potions > 0 ? null : "true", onClick: potion },
          "🧪 Potion ×" + me.potions),
        el("button", { class: "btn subtle sm", disabled: me.courage ? null : "true", onClick: courage },
          "🍺 Liquid Courage"),
        el("button", { class: "btn subtle sm", onClick: forfeit }, "🏳️"),
      ]));
    }
    function nextTurn() {
      if (done) return;
      turn = turn === "a" ? "b" : "a";
      renderMenu();
    }

    // VS intro, then the faster species moves first.
    const vs = el("div", { class: "battle-vs" }, [
      el("div", { class: "vs-panel a" }, [
        el("div", { class: "vs-mons" }, [SP[A.mon.id] ? el("img", { class: "vs-mon", src: SP[A.mon.id], alt: "" }) : el("div", { class: "battle-ball-inner vs-mon" })]),
        el("div", { class: "vs-name" }, A.name + "'s " + A.mon.name),
      ]),
      el("div", { class: "vs-badge" }, "VS"),
      el("div", { class: "vs-panel b" }, [
        el("div", { class: "vs-mons" }, [SP[B.mon.id] ? el("img", { class: "vs-mon", src: SP[B.mon.id], alt: "" }) : el("div", { class: "battle-ball-inner vs-mon" })]),
        el("div", { class: "vs-name" }, B.name + "'s " + B.mon.name),
      ]),
    ]);
    document.body.appendChild(overlay);
    overlay.appendChild(vs);
    sfx("blip");
    requestAnimationFrame(() => vs.classList.add("go"));
    setTimeout(() => sfx("select"), 300);
    setTimeout(() => {
      vs.classList.add("out");
      setTimeout(() => vs.remove(), 400);
      overlay.classList.add("go", "ready");
      sfx("blip");
      msg.textContent = cur().mon.name + " is faster — " + cur().name + " goes first!";
      setTimeout(renderMenu, 900);
    }, 1700);

    return { close: close };
  }

  window.Duel = { start: start, statsFor: statsFor };
})();
