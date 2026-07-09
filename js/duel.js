/* duel.js — turn-based Pokémon duels. Global `Duel`.
   Duel.start({ mode, title, first, a, b, myClient, net, onResult, onEnd })
     a/b: { units: [{ attId, monIds: [...], client? }, ...] }
       1 unit per side = singles (bring a party of up to 6, switch on faint
       or spend a turn to switch voluntarily); 2 units = a DOUBLE battle (2v2 —
       each unit fields one active mon and switches to its own bench; the two
       units can be two trainers, or the same trainer running both slots).
   Everything fights at Lv50: HP/attack come from the species power stat,
   moves from its types. Drink actions (per trainer, each takes the turn):
     🧪 Drink Potion   — take 3 sips → heal 60 HP (2 per battle)
     🍺 Liquid Courage — finish half your drink → next attack can't miss
                         and lands a guaranteed CRITICAL HIT (once)
   modes: "local" (hot-seat, pass the phone), "remote" (each trainer picks
   their turns on their own phone — actions travel as small serialized
   acts, all dice rolled by the acting phone so every screen agrees), and
   "watch" (spectators replay the same acts live, turn by turn).
   Wins land in the battle log + chronicle and score Victory Road points. */
(function () {
  const { el } = U;
  const DEX = window.DEX || {};
  const SP = window.DEX_SPRITES || {};
  const BACKS = window.DEX_SPRITES_BACK || {};          // full 251 rear views
  const SPS = window.DEX_SPRITES_SHINY || {};           // ✨ shiny fronts
  const BACKS_S = window.DEX_SPRITES_BACK_SHINY || {};  // ✨ shiny rear views
  const BACK = window.SPRITES_BACK || {};               // legacy squad set (fallback)
  // A mon instance is shiny if that trainer's dex record says so.
  function isShinyFor(attId, monId) {
    const t = ((Store.state.pokedex || {}).trainers || {})[attId];
    return !!(t && t.caught && t.caught[monId] && t.caught[monId].shiny);
  }
  function frontSprite(id, shiny) { return (shiny && SPS[id]) || SP[id] || (window.Store && Store.sprite(id)) || ""; }
  function backSprite(id, shiny) { return (shiny && BACKS_S[id]) || BACKS[id] || BACK[id] || ""; }
  function sfx(n) { if (window.SFX && SFX[n]) SFX[n](); }
  function now() { try { return Date.now(); } catch (_) { return 0; } }

  const TYPE_EMOJI = { normal: "⭐", fire: "🔥", water: "💧", electric: "⚡", grass: "🌿", ice: "❄️", fighting: "🥊", poison: "☠️", ground: "⛰️", flying: "🪽", psychic: "🔮", bug: "🐛", rock: "🪨", ghost: "👻", dragon: "🐉", dark: "🌑", steel: "⚙️", fairy: "✨" };
  const TYPE_COLOR = { normal: "#a8a878", fire: "#f08030", water: "#6890f0", electric: "#e0b400", grass: "#78c850", ice: "#58b8c8", fighting: "#c03028", poison: "#a040a0", ground: "#c8a850", flying: "#a890f0", psychic: "#f85888", bug: "#a8b820", rock: "#b8a038", ghost: "#705898", dragon: "#7038f8", dark: "#705848", steel: "#9898b0", fairy: "#e87898" };

  // Two damage moves per type: [name, power, accuracy] — a reliable jab and
  // a heavy haymaker that sometimes whiffs.
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
    if (types.length === 1 && types[0] !== "normal") moves.push({ name: "Tackle", pow: 50, acc: 100, type: "normal" });
    return { id: monId, name: d.n, x: x, types: types,
      hpMax: 120 + Math.round(x * 0.5), atk: 0.55 + x / 500, moves: moves.slice(0, 4) };
  }

  function effFor(moveType, defTypes) {
    const f = window.Battle && Battle.effectiveness;
    if (!f) return 1;
    return defTypes.reduce((m, t) => m * f(moveType, t), 1);
  }

  // Last resort when every move is nullified by immunity (e.g. a mono-Normal
  // mon staring down a Ghost): typeless, always usable, never great.
  const STRUGGLE = { name: "Struggle", pow: 50, acc: 100, type: "none" };

  // A trainer's pickable Pokémon: team of 6 first, then the rest of their
  // caught dex — and the partner is ALWAYS in the pool (it used to vanish
  // as soon as you caught anything, so "you need 6" miscounted by one).
  function poolFor(attId) {
    const t = ((Store.state.pokedex || {}).trainers || {})[attId] || {};
    const ids = (t.team || []).filter(Boolean).slice();
    Object.keys(t.caught || {}).map(Number).forEach((id) => { if (ids.indexOf(id) < 0) ids.push(id); });
    const a = Store.attendee(attId);
    if (a && a.favoriteId && ids.indexOf(a.favoriteId) < 0) ids.push(a.favoriteId);
    return ids;
  }

  // Ordered party picker (modal) — used to challenge someone to a remote
  // duel and to accept one. onDone receives the picked mon ids, lead first.
  function pickParty(opts) {
    const pool = poolFor(opts.attId);
    const max = opts.max || 6;
    const min = opts.min || 1;
    let picked = [];
    const grid = el("div", { class: "duel-party-grid" });
    const cta = el("button", { class: "btn primary", onClick: () => {
      if (picked.length < min) return;
      ref.close(); opts.onDone(picked.slice());
    } }, "Ready");
    function paint() {
      grid.innerHTML = "";
      pool.forEach((id) => {
        const st = statsFor(id);
        const idx = picked.indexOf(id);
        const shiny = isShinyFor(opts.attId, id);
        const src = frontSprite(id, shiny);
        grid.appendChild(el("button", { class: "duel-pick" + (idx >= 0 ? " on" : "") + (shiny ? " is-shiny" : ""), title: st.name + (shiny ? " \u2728 SHINY" : ""), onClick: () => {
          const i = picked.indexOf(id);
          if (i >= 0) picked.splice(i, 1); else if (picked.length < max) picked.push(id);
          paint();
        } }, [
          src ? el("img", { src: src, alt: st.name }) : el("span", { class: "draft-thumb-ball" }),
          shiny ? el("span", { class: "duel-pick-shiny" }, "\u2728") : null,
          idx >= 0 ? el("span", { class: "duel-pick-n" }, String(idx + 1)) : null,
        ]));
      });
      cta.textContent = picked.length < min
        ? "⚔ Pick " + (min - picked.length) + " more"
        : "⚔ Ready — " + (picked.length === 1 ? picked.length + " Pokémon" : "party of " + picked.length);
      cta.disabled = picked.length < min;
    }
    // One tap loads the trainer's saved Team of 6 (capped to this picker's max).
    const teamBtn = el("button", { class: "btn subtle sm", onClick: () => {
      const t = ((Store.state.pokedex || {}).trainers || {})[opts.attId] || {};
      const team = (t.team || []).filter((id) => pool.indexOf(id) >= 0).slice(0, max);
      if (!team.length) { alert("No team set — build one on the Safari page."); return; }
      picked = team;
      paint();
    } }, "⚡ Use my team");
    const body = el("div", { class: "modal-form" }, [
      el("p", { class: "hint" }, (opts.hint || "Tap Pokémon in order — the first is your lead.") + " Up to " + max + "."),
      grid,
      el("div", { class: "toolbar" }, [cta, teamBtn]),
    ]);
    paint();
    const ref = Modal.open(opts.title || "Choose your party", body, null, {});
  }

  // Simple trainer picker (modal) — used to choose a double-battle partner.
  function pickTrainer(opts) {
    const skip = opts.exclude || [];
    const grid = el("div", { class: "sl-vote-grid" }, Store.state.attendees
      .filter((a) => skip.indexOf(a.id) < 0)
      .map((a) => {
        const f = Store.currentForm(a);
        const src = f.id ? Store.sprite(f.id) : "";
        return el("button", { class: "sl-vote-pick", onClick: () => { ref.close(); opts.onDone(a.id); } }, [
          src ? el("img", { class: "sl-thumb", src: src, alt: "" }) : el("span", { class: "draft-thumb-ball" }),
          el("span", { class: "sl-vote-name" }, a.name),
        ]);
      }));
    const body = el("div", { class: "modal-form" }, [
      opts.hint ? el("p", { class: "hint" }, opts.hint) : null,
      grid,
    ]);
    const ref = Modal.open(opts.title || "Pick a trainer", body, null, {});
  }

  // ---------------- the battle itself ----------------
  function start(opts) {
    opts = opts || {};
    const mode = opts.mode || "local";
    const myClient = opts.myClient || "";
    let net = opts.net || null;
    const title = (opts.title || "Duel").trim() || "Duel";

    function makeUnit(u) {
      // NPC units (gym leaders) have no attendee — just a name and an AI flag.
      const at = u.npc ? { name: u.npc, team: "" } : (Store.attendee(u.attId) || { name: "Trainer", team: "" });
      const party = (u.monIds || []).filter(Boolean).map((id) => {
        const m = statsFor(id); m.hp = m.hpMax;
        m.shiny = isShinyFor(u.attId, id);          // ✨ carried into battle
        // battle EXP: KOs banked before this battle (this mon must land the
        // blow itself to earn more). Veterans hit harder: +2% attack per
        // banked KO, capped at +20%.
        const t0 = ((Store.state.pokedex || {}).trainers || {})[u.attId];
        const rec0 = (t0 && t0.caught && t0.caught[id]) || {};
        m.kos0 = rec0.kos || 0;
        m.kos = 0;
        m.atk = m.atk * (1 + Math.min(0.2, 0.02 * m.kos0));
        // League-calibre foes (Elite Four/Champion/RED) hit and endure
        // harder than any gym — rank boost keeps the ladder a ladder.
        if (u.boost) { m.atk *= u.boost; m.hpMax = Math.round(m.hpMax * u.boost); m.hp = m.hpMax; }
        m.species = m.name;
        if (rec0.nick) m.name = rec0.nick;          // nicknames scream in battle text
        return m;
      });
      if (!party.length) { const m = statsFor(1); m.hp = m.hpMax; party.push(m); }
      // 🍓 one Sitrus Berry per trainer per battle, if their bag has any
      // (snapshotted at setup so every phone agrees).
      const bag = ((Store.state.pokedex || {}).trainers || {})[u.attId];
      return { attId: u.attId, client: u.client || "", name: at.name, teamId: at.team || "",
        ai: !!u.ai, hasBerry: !!(bag && bag.berries > 0), berryUsed: false,
        party: party, cur: 0, potions: 2, courage: true, armed: false };
    }
    const sides = {
      a: { key: "a", units: ((opts.a || {}).units || []).slice(0, 2).map(makeUnit) },
      b: { key: "b", units: ((opts.b || {}).units || []).slice(0, 2).map(makeUnit) },
    };
    const doubles = sides.a.units.length > 1 || sides.b.units.length > 1;
    function other(s) { return s === "a" ? "b" : "a"; }
    // One trainer running both slots of a double reads as one name, not "X & X".
    function label(s) {
      const seen = [];
      sides[s].units.forEach((u) => { if (seen.indexOf(u.name) < 0) seen.push(u.name); });
      return seen.join(" & ");
    }
    function mon(u) { return u.party[u.cur]; }
    function unitAlive(u) { return u.party.some((m) => m.hp > 0); }
    function firstLiving(s) { const us = sides[s].units; for (let i = 0; i < us.length; i++) if (unitAlive(us[i])) return i; return 0; }
    function bench(u) { return u.party.map((m, i) => ({ m: m, i: i })).filter((x) => x.i !== u.cur && x.m.hp > 0); }
    function livingEnemies(s) { return sides[other(s)].units.map((u, i) => ({ u: u, i: i })).filter((x) => unitAlive(x.u)); }

    const S = { seq: 0, queue: [], busy: false, done: false, moved: 0, pending: null, zmove: false,
      first: opts.first === "b" ? "b" : (opts.first === "a" ? "a" : null), actor: null };
    if (!S.first) {
      // Deterministic tie-break (challenger first) so every phone —
      // players, partners, and watchers — agrees who leads.
      const ax = mon(sides.a.units[0]).x, bx = mon(sides.b.units[0]).x;
      S.first = ax >= bx ? "a" : "b";
    }
    S.actor = { side: S.first, unit: firstLiving(S.first) };

    // ---- arena DOM ----
    // Perspective: each phone draws ITS OWN side at the bottom with back
    // sprites, like the real games. The battle data (sides a/b, acts) is
    // identical everywhere — only the camera flips. Watchers and hot-seat
    // screens see side a at the bottom.
    const myView = (mode === "remote"
      && sides.b.units.some((u) => u.client === myClient)
      && !sides.a.units.some((u) => u.client === myClient)) ? "b" : "a";
    function posOf(s) { return s === myView ? "you" : "foe"; }
    const sprites = {
      a: el("div", { class: "battle-sprite " + posOf("a") + (sides.a.units.length > 1 ? " doubles" : "") }),
      b: el("div", { class: "battle-sprite " + posOf("b") + (sides.b.units.length > 1 ? " doubles" : "") }),
    };
    function monImg(s, u) {
      const m = mon(u);
      const back = s === myView ? backSprite(m.id, m.shiny) : "";
      const src = back || frontSprite(m.id, m.shiny);
      return src
        ? el("img", { class: "battle-sprite-img", src: src, alt: "",
            style: s === myView && !back ? { transform: "scaleX(-1)" } : {} })
        : el("div", { class: "battle-ball-inner" });
    }
    function renderSprites(s) {
      const w = sprites[s]; w.innerHTML = "";
      sides[s].units.forEach((u, i) => {
        const mw = el("div", { class: "battle-mon mon" + i + (unitAlive(u) ? "" : " fainted") }, [monImg(s, u)]);
        u._monEl = mw;
        w.appendChild(mw);
      });
    }
    renderSprites("a"); renderSprites("b");

    const hpBoxes = {
      a: el("div", { class: "battle-hpbox " + posOf("a") + (sides.a.units.length > 1 ? " doubles" : "") }),
      b: el("div", { class: "battle-hpbox " + posOf("b") + (sides.b.units.length > 1 ? " doubles" : "") }),
    };
    function paintHp(u) {
      if (!u._fill) return;
      const m = mon(u), pct = Math.max(0, m.hp / m.hpMax);
      u._fill.style.width = (pct * 100).toFixed(1) + "%";
      u._fill.classList.toggle("low", pct <= 0.5 && pct > 0.2);
      u._fill.classList.toggle("crit", pct <= 0.2);
      u._num.textContent = Math.max(0, m.hp) + " / " + m.hpMax;
    }
    function renderHp(s) {
      const box = hpBoxes[s]; box.innerHTML = "";
      sides[s].units.forEach((u) => {
        const m = mon(u);
        u._fill = el("div", { class: "battle-hp-fill" });
        u._num = el("span", { class: "duel-hp-num" });
        const left = u.party.filter((x) => x.hp > 0).length;
        box.appendChild(el("div", { class: "battle-hp-mem" }, [
          el("div", { class: "battle-hp-name" }, [(m.shiny ? "\u2728" : "") + m.name + " ", el("span", { class: "duel-lv" }, "Lv50")]),
          el("div", { class: "battle-hp-row" }, [
            el("span", { class: "battle-hp-lbl" }, "HP"),
            el("div", { class: "battle-hp-track" }, [u._fill]),
          ]),
          el("div", { class: "duel-hp-sub" }, [u._num,
            el("span", { class: "duel-owner" }, u.name + (u.party.length > 1 ? " · ⚪" + left + "/" + u.party.length : ""))]),
        ]));
        paintHp(u);
      });
    }
    renderHp("a"); renderHp("b");

    const msg = el("div", { class: "battle-msg" }, title + " — " + label("a") + " VS " + label("b") + "!");
    const menu = el("div", { class: "battle-menu" });
    const arena = el("div", { class: "battle-arena" }, [
      el("div", { class: "battle-platform foe" }), el("div", { class: "battle-platform you" }),
      hpBoxes[other(myView)], sprites[other(myView)], sprites[myView], hpBoxes[myView],
    ]);
    const overlay = el("div", { class: "battle" }, [arena, msg, menu]);
    // Watchers get a PERSISTENT bar — reactions were buried in the turn
    // menu (cleared during every animation, i.e. most of the battle) and
    // there was no way to leave at all.
    if (mode === "watch") {
      overlay.appendChild(el("div", { class: "duel-watch-bar" }, [
        opts.rx ? el("div", { class: "duel-rx-bar" }, ["🔥", "👏", "😱", "💀", "🍺"].map((e) =>
          el("button", { class: "duel-rx-btn", onClick: () => { try { opts.rx(e); } catch (_) {} } }, e))) : null,
        el("button", { class: "btn subtle sm", onClick: () => close() }, "✕ Stop watching"),
      ]));
    }
    function close() {
      if (window.SFX && SFX.battleMusic) SFX.battleMusic(false);
      overlay.classList.add("out");
      setTimeout(() => overlay.remove(), 350);
      // release the page-scroll lock unless another battle screen is still up
      if (document.querySelectorAll(".battle").length <= 1)
        document.documentElement.classList.remove("scroll-lock");
      if (opts.onEnd) try { opts.onEnd(); } catch (_) {}
    }

    // Type-colored impact burst on the defender (+ a screen shake on crits).
    function spawnHit(monEl, color, crit) {
      const fx = el("div", { class: "duel-hit", style: { "--hc": color } }, [el("b")]);
      for (let i = 0; i < 8; i++) {
        const p = el("i");
        const ang = (Math.PI * 2 * i) / 8 + Math.random() * 0.6;
        const d = 32 + Math.random() * 28;
        p.style.setProperty("--dx", (Math.cos(ang) * d).toFixed(0) + "px");
        p.style.setProperty("--dy", (Math.sin(ang) * d).toFixed(0) + "px");
        fx.appendChild(p);
      }
      monEl.appendChild(fx);
      setTimeout(() => fx.remove(), 700);
      if (crit) { overlay.classList.add("shake"); setTimeout(() => overlay.classList.remove("shake"), 450); }
    }

    // Spectator reactions — everyone's taps float up on every screen.
    let rxSeen = -1;
    function spawnRx(item) {
      const n = el("div", { class: "duel-rx" }, [
        el("span", { class: "duel-rx-e" }, item.e || "🔥"),
        item.by ? el("span", { class: "duel-rx-by" }, item.by) : null,
      ]);
      n.style.left = (8 + Math.random() * 74).toFixed(0) + "%";
      arena.appendChild(n);
      setTimeout(() => n.remove(), 2400);
    }
    function receiveRx(list) {
      list = list || [];
      if (rxSeen < 0) { rxSeen = list.length; return; }   // don't replay history on join
      for (let i = rxSeen; i < list.length; i++) spawnRx(list[i]);
      rxSeen = Math.max(rxSeen, list.length);
    }

    // Broadcast local battles turn-by-turn when the room is live: the full
    // setup + every act goes out on the duel channel (the same plumbing
    // remote duels use), so any phone can WATCH move-by-move and cheer —
    // gym runs and League climbs become room events. The banner channel
    // still announces it (Watch alert + the Home LIVE strip), carrying the
    // stakes so the room knows a badge or a crown is on the line.
    let liveLocal = false, castId = null, castUnsub = null;
    if (mode === "local" && opts.broadcast !== false && window.Sync && Sync.isLive && Sync.isLive()) {
      liveLocal = true;
      try {
        const lg = opts.league;
        const stakes = opts.gym ? "🏅 " + ((opts.gym.badge || "Gym") + " Badge") + " on the line"
          : lg ? (lg.idx === 5 ? "🗻 Mt. Silver — facing RED" : "👑 " + ((lg.rank || "League") + " " + (lg.name || "")).trim())
          : opts.hof ? "🏛 Battle of Fame" : "";
        const setup = { mode: "local", title: title, first: S.first,
          gym: opts.gym || null, league: lg || null, hof: opts.hof || null,
          a: { units: ((opts.a || {}).units || []) }, b: { units: ((opts.b || {}).units || []) } };
        castId = Sync.startRemoteDuel && Sync.startRemoteDuel(setup);
        if (castId) {
          net = { send: function (act) { try { Sync.sendDuelAct(act); } catch (_) {} } };
          castUnsub = Sync.onDuel(function (d) { if (d && d.id === castId) receiveRx(d.rx || []); });
        }
        Sync.startLiveBattle({ aName: label("a"), bName: label("b"), event: title,
          aClient: Sync.myClientId(), mode: castId ? "duel-remote" : "duel", stakes: stakes });
      } catch (_) {}
    }

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

    // ---- act plumbing: every decision is a small serializable act ----
    function sendAct(act) {
      act.by = myClient || "local";
      if (net) try { net.send(act); } catch (_) {}
      enqueue(act);
    }
    function enqueue(act) {
      if (!act || typeof act.seq !== "number") return;
      if (act.seq <= S.seq) return;                                   // already applied (echo)
      if (S.queue.some((q) => q.seq === act.seq)) return;
      S.queue.push(act);
      S.queue.sort((x, y) => x.seq - y.seq);
      pump();
    }
    function receiveActs(acts) { (acts || []).forEach(enqueue); }
    function pump() {
      if (!S.ready || S.busy || S.done || !S.queue.length) return;
      if (S.queue[0].seq !== S.seq + 1) return;                        // wait for the gap to fill
      const act = S.queue.shift();
      const instant = S.queue.length > 0;                              // catching up — skip anims
      S.busy = true;
      S.seq = act.seq;
      applyAct(act, instant, () => { S.busy = false; pump(); });
    }

    function advance() {
      const s = S.actor.side, units = sides[s].units;
      let u = S.actor.unit + 1;
      while (u < units.length && !unitAlive(units[u])) u++;
      if (u < units.length) S.actor = { side: s, unit: u };
      else { const o = other(s); S.actor = { side: o, unit: firstLiving(o) }; }
      renderMenu();
    }

    function applyAct(act, instant, done) {
      const u = sides[act.side].units[act.unit];
      if (act.kind === "move") return applyMove(act, u, instant, done);
      if (act.kind === "potion") {
        u.potions = Math.max(0, u.potions - 1); S.moved++;
        const m = mon(u); m.hp = Math.min(m.hpMax, m.hp + 60); paintHp(u);
        if (instant) { advance(); done(); return; }
        menu.innerHTML = "";
        beats([["🧪 " + u.name + " takes 3 sips… " + m.name + " regained health! (+60 HP)", 1200, () => sfx("coin")]],
          () => { advance(); done(); });
        return;
      }
      if (act.kind === "courage") {
        u.courage = false; u.armed = true; S.moved++;
        if (instant) { advance(); done(); return; }
        menu.innerHTML = "";
        beats([["🍺 " + u.name + " chugs half the drink — " + mon(u).name + " is fired up!", 1200, () => sfx("correct")]],
          () => { advance(); done(); });
        return;
      }
      if (act.kind === "switch" || act.kind === "next") {
        const old = mon(u).name;
        u.cur = act.to; S.moved++;
        renderSprites(act.side); renderHp(act.side);
        const isNext = act.kind === "next";
        const fin = () => { if (isNext) { S.pending = null; advance(); } else advance(); done(); };
        if (instant) { fin(); return; }
        menu.innerHTML = "";
        beats([[isNext ? u.name + " sent out " + mon(u).name + "!" : u.name + " withdrew " + old + " — go, " + mon(u).name + "!",
          1100, () => sfx("blip")]], fin);
        return;
      }
      if (act.kind === "forfeit") {
        finish(other(act.side), act, "forfeit", instant, done);
        return;
      }
      done();
    }

    // The KO'ing mon earns battle EXP (3 KOs = an evolution). Every screen
    // applies the same acts, so every phone increments identically — that
    // keeps the count safe under last-write-wins state sync.
    function creditKO(u, m) {
      m.kos = (m.kos || 0) + 1;
      try {
        Store.update((s) => {
          const t = s.pokedex.trainers[u.attId];
          const r = t && t.caught && t.caught[m.id];
          if (r) r.kos = (r.kos || 0) + 1;
          if (t) t.koLife = (t.koLife || 0) + 1;      // lifetime KOs (never spent)
        });
      } catch (_) {}
      if (!(window.DEX_EVOS || {})[m.id]) return null;
      const need = Store.KO_TO_EVOLVE || 3;
      const total = (m.kos0 || 0) + m.kos;
      // Kadabra/Machoke/Graveler/Haunter refuse to evolve from EXP — only a
      // trade will do. Rub it in at the moment they'd otherwise be ready.
      if (Store.TRADE_EVOS && Store.TRADE_EVOS[m.id]) {
        return total >= need
          ? "🔁 " + m.name + " has the EXP… but it ONLY evolves by TRADE — hit the Trading Post!"
          : "⚔ " + m.name + " earned battle EXP! (" + total + "/" + need + ")";
      }
      return total >= need
        ? "⚡ " + m.name + " has enough battle EXP to EVOLVE after the battle!"
        : "⚔ " + m.name + " earned battle EXP! (" + total + "/" + need + " KOs to evolve)";
    }

    function applyMove(act, u, instant, done) {
      S.moved++;
      const dSide = other(act.side);
      const tu = sides[dSide].units[act.tUnit];
      const m = mon(u), mv = act.move === 99 ? STRUGGLE : (m.moves[act.move] || m.moves[0]), tm = mon(tu);
      if (act.courage) u.courage = false;               // half a drink, spent on this very hit
      const chug = act.courage ? [["🍺 " + u.name + " chugs — LIQUID COURAGE!", 950, () => sfx("correct")]] : [];
      const afterDamage = () => {
        if (tm.hp > 0) { advance(); done(); return; }
        // fainted — replacement, drop the unit, or end the battle
        if (unitAlive(tu)) {                       // bench remains → owner picks
          S.pending = { side: dSide, unit: act.tUnit };
          renderMenu(); done(); return;
        }
        if (sides[dSide].units.some(unitAlive)) { renderHp(dSide); advance(); done(); return; }  // doubles partner fights on
        finish(act.side, act, "faint", instant, done);
      };
      // 🍓 auto-berry: survive a hit below 30% and the trainer's Sitrus kicks in
      const eatBerry = () => {
        tu.berryUsed = true;
        mon(tu).hp = Math.min(mon(tu).hpMax, mon(tu).hp + 45);
        paintHp(tu);
        try {
          Store.update((s) => {
            const t = s.pokedex.trainers[tu.attId];
            if (t && t.berries > 0) t.berries--;
          });
        } catch (_) {}
      };
      const berryReady = () => tm.hp > 0 && tm.hp < tm.hpMax * 0.3 && tu.hasBerry && !tu.berryUsed;
      if (instant) {
        if (!act.miss) {
          tm.hp = Math.max(0, tm.hp - act.dmg); paintHp(tu);
          if (tm.hp <= 0) { creditKO(u, m); if (tu._monEl) tu._monEl.classList.add("fainted"); }
          else if (berryReady()) eatBerry();
        }
        afterDamage();
        return;
      }
      menu.innerHTML = "";
      u._monEl.classList.add("attack");
      setTimeout(() => u._monEl.classList.remove("attack"), 600);
      if (act.miss) {
        beats([
          [m.name + " used " + mv.name + "!", 850, () => sfx("select")],
          ["…it missed!", 1000, () => sfx("error")],
        ], () => { advance(); done(); });
        return;
      }
      if (act.eff === 0) {                              // immune — no damage at all
        beats(chug.concat([
          [m.name + " used " + mv.name + "!", 850, () => sfx("select")],
          ["It doesn't affect " + tm.name + "…", 1150, () => sfx("error")],
        ]), () => { advance(); done(); });
        return;
      }
      const steps = chug.concat([[m.name + " used " + mv.name + "!", 800, () => sfx("select")]]);
      steps.push([null, 500, () => {
        tm.hp = Math.max(0, tm.hp - act.dmg);
        if (tm.hp <= 0) act._exp = creditKO(u, m);
        tu._monEl.classList.add("hurt"); if (act.crit) tu._monEl.classList.add("crit");
        setTimeout(() => tu._monEl.classList.remove("hurt", "crit"), 700);
        spawnHit(tu._monEl, TYPE_COLOR[mv.type] || "#fff", act.crit);
        paintHp(tu); sfx("coin");
      }]);
      if (act.crit) steps.push([act.armed ? "🍺💥 LIQUID COURAGE — a guaranteed critical hit!" : "💥 A critical hit!", 900, () => sfx("correct")]);
      if (act.eff >= 4) steps.push(["💥💥 It's SUPER effective!! (double weakness)", 950]);
      else if (act.eff > 1) steps.push(["It's super effective!", 900]);
      else if (act.eff <= 0.25) steps.push(["It barely has any effect…", 900]);
      else if (act.eff < 1) steps.push(["It's not very effective…", 900]);
      steps.push(["−" + act.dmg + " HP!", 650]);
      beats(steps, () => {
        if (tm.hp <= 0) {
          beats([
            [tm.name + " fainted!", 1100, () => { tu._monEl.classList.add("fainted"); sfx("error"); }],
            ["🍺 KO! " + tu.name + " takes 2 sips!", 1150],
          ].concat(act._exp ? [[act._exp, 1300, () => sfx("coin")]] : []), afterDamage);
        } else if (berryReady()) {
          beats([["🍓 " + tu.name + "'s Sitrus Berry! " + tm.name + " recovered 45 HP!", 1250, () => { eatBerry(); sfx("coin"); }]], afterDamage);
        } else afterDamage();
      });
    }

    // ---- battle-EXP evolutions (after the battle, classic style) ----
    // Prompts appear on the phone that controls the mon; branched lines
    // (Eevee!) get a choice. Declining keeps the EXP for next time.
    function promptEvolutions(afterAll) {
      const fin = afterAll || function () {};
      if (mode === "watch" || !window.Modal) { fin(); return; }
      const pend = [], seen = {};
      ["a", "b"].forEach((sd) => sides[sd].units.forEach((un) => {
        if (!(mode === "local" || isMine(un))) return;
        un.party.forEach((mn) => {
          const key = un.attId + ":" + mn.id;
          if (seen[key]) return; seen[key] = 1;
          if (Store.evoReady(un.attId, mn.id)) pend.push({ attId: un.attId, owner: un.name, mon: mn });
        });
      }));
      (function next() {
        const p = pend.shift(); if (!p) { fin(); return; }
        showEvoPrompt(p, next);
      })();
    }

    // Losers always want to run it back — same trainers, same parties,
    // fresh HP. Hot-seat only (remote rematches are a new challenge).
    function offerRematch(wLabel) {
      if (mode !== "local" || !window.Modal) return;
      let ctrl;
      const body = el("div", { class: "chal-modal" }, [
        el("div", { class: "chal-line" }, "🏆 " + wLabel + " took it. Run it back?"),
        el("div", { class: "toolbar" }, [
          el("button", { class: "btn primary", onClick: () => { if (ctrl) ctrl.close(); start(opts); } }, "🔁 Rematch"),
          el("button", { class: "btn subtle", onClick: () => { if (ctrl) ctrl.close(); } }, "Done"),
        ]),
      ]);
      ctrl = Modal.open("Rematch?", body, null, { noFooter: true });
    }
    function showEvoPrompt(p, onDone) {
      const targets = Store.evoTargets(p.mon.id);
      const nm = (id) => (DEX[id] && DEX[id].n) || ("#" + id);
      let ctrl;
      const evolveTo = (tid) => {
        if (!Store.evolveMon(p.attId, p.mon.id, tid)) { if (ctrl) ctrl.close(); onDone(); return; }
        if (ctrl) ctrl.close();
        // The full "Squad evolution" cinematic: silhouette flicker → flash →
        // color reveal → energy fireworks, with the evolve + win music.
        const type = (window.DEX && DEX[tid] && DEX[tid].t && DEX[tid].t[0]) || "";
        if (window.EvoFX && EvoFX.play) {
          EvoFX.play({
            beforeSrc: frontSprite(p.mon.id, p.mon.shiny),
            afterSrc: frontSprite(tid, p.mon.shiny),
            beforeName: p.mon.name, afterName: nm(tid),
            type: type, shiny: p.mon.shiny, onComplete: onDone,
          });
        } else { onDone(); }
      };
      const body = el("div", { class: "modal-form" }, [
        el("div", { class: "evo-prompt-head" }, [
          el("img", { class: "evo-prompt-img", src: frontSprite(p.mon.id, p.mon.shiny), alt: "" }),
          el("p", { class: "hint" }, "⚡ " + p.owner + "'s " + (p.mon.shiny ? "✨" : "") + p.mon.name +
            " has enough battle EXP to evolve (" + (Store.KO_TO_EVOLVE || 3) + " KOs — it landed them itself)!"),
        ]),
        el("div", { class: "toolbar", style: { flexWrap: "wrap" } }, targets.map((tid) =>
          el("button", { class: "btn primary", onClick: () => evolveTo(tid) }, [
            frontSprite(tid, p.mon.shiny) ? el("img", { class: "evo-opt-img", src: frontSprite(tid, p.mon.shiny), alt: "" }) : null,
            " Evolve into " + nm(tid),
          ])).concat([
          el("button", { class: "btn subtle", onClick: () => { if (ctrl) ctrl.close(); onDone(); } }, "Not now (keep the EXP)"),
        ])),
      ]);
      ctrl = Modal.open("🎉 " + p.mon.name + " is ready to evolve!", body, null, { noFooter: true });
    }

    function finish(winSide, act, how, instant, done) {
      S.done = true;
      menu.innerHTML = "";
      const wLabel = label(winSide), lLabel = label(other(winSide));
      const wMons = sides[winSide].units.map((x) => mon(x).name).join(" & ");
      const lMons = sides[other(winSide)].units.map((x) => mon(x).name).join(" & ");
      const record = mode === "local" || (mode === "remote" && act.by === myClient);
      beats([
        how === "forfeit" ? ["🏳️ " + lLabel + (lLabel.indexOf(" & ") >= 0 ? " give up!" : " gives up!"), 1200, () => sfx("error")] : [null, 250],
        ["🏆 " + wLabel + " win" + (wLabel.indexOf(" & ") >= 0 ? "" : "s") + " the duel!", 1700, () => sfx("fanfare")],
        ["🍺 Defeat toast — " + lLabel + ": 4 sips for the loss!", 1700],
      ], () => { close(); if (opts.onResult) opts.onResult(winSide); setTimeout(() => promptEvolutions(() => offerRematch(wLabel)), 700); if (done) done(); });
      if (!record) return;
      // End the room broadcast no matter which branch records below —
      // watchers' screens resolve and the LIVE banner clears.
      try {
        if (window.Sync) {
          if (mode === "remote") { Sync.endRemoteDuel(wLabel); Sync.finishLiveBattle(wLabel); }
          else if (liveLocal) { if (castId) Sync.endRemoteDuel(wLabel); Sync.finishLiveBattle(wLabel); }
          if (castUnsub) { castUnsub(); castUnsub = null; }
        }
      } catch (_) {}
      // 👑 Pokémon League: Elite Four → LANCE → the silent one on Mt. Silver.
      // Off the leaderboards, like gyms — glory (and points) only.
      if (opts.league) {
        try {
          const playerSide = sides.a.units.some((x) => x.ai) ? "b" : "a";
          const player = sides[playerSide].units[0];
          const lg = opts.league;
          Store.update((s) => {
            if (winSide === playerSide) {
              s.league = s.league || {};
              const w = s.league[player.attId] = s.league[player.attId] || [];
              const fresh = w.indexOf(lg.key) < 0;
              if (fresh) w.push(lg.key);
              Store.grantPoints(s, "battle", player.teamId, lg.pts || 6);
              if (lg.key === "red") Store.chron(s, "🗻", player.name + " climbed Mt. Silver and defeated RED. There is nothing left to prove. THE ABSOLUTE CHAMPION.");
              else if (lg.key === "lance") {
                // 🏛 Hall of Fame: the champion AND the team that did it, forever.
                if (fresh) {
                  s.hof = s.hof || [];
                  s.hof.push({ attId: player.attId, ts: now(), party: player.party.map((x) => x.id) });
                }
                Store.chron(s, "👑", player.name + " defeated Champion LANCE — welcome to the HALL OF FAME!" + (fresh ? " …the summit of Mt. Silver just rumbled." : ""));
              }
              else Store.chron(s, "⭐", player.name + " toppled Elite Four " + lg.name + "!");
            } else {
              if (lg.key === "red") Store.chron(s, "🗻", "RED said nothing. " + player.name + " drinks 3 and descends the mountain.");
              else Store.chron(s, "🤖", lg.rank + " " + lg.name + " stands undefeated — " + player.name + " drinks 3.");
            }
          });
        } catch (_) {}
        return;
      }
      // 🏟 Gym challenges: badge on a win, sips on a loss — they never touch
      // the duel leaderboard, Elo, or the Champion's Belt.
      if (opts.gym) {
        try {
          const playerSide = sides.a.units.some((x) => x.ai) ? "b" : "a";
          const player = sides[playerSide].units[0];
          Store.update((s) => {
            if (winSide === playerSide) {
              // Everyone can hold every badge — a win just adds you.
              s.gymCircuit = s.gymCircuit || {};
              const hs = s.gymCircuit[opts.gym.idx] = s.gymCircuit[opts.gym.idx] || [];
              const fresh = hs.indexOf(player.attId) < 0;
              if (fresh) hs.push(player.attId);
              Store.grantPoints(s, "battle", player.teamId, 5);
              Store.chron(s, "🏅", player.name + " defeated Leader " + opts.gym.leader + " and earned the " + (opts.gym.badge || "gym") + " Badge!" + (fresh ? "" : " (rematch flex)"));
              if (fresh && Store.gymBadgeCount(player.attId) >= 16)
                Store.chron(s, "🏆", "ALL 16 BADGES — " + player.name + " has conquered Johto AND Kanto. CHAMPION!!");
            } else {
              Store.chron(s, "🤖", "Leader " + opts.gym.leader + " defended the gym — " + player.name + " drinks 3 and trains harder.");
            }
          });
        } catch (_) {}
        return;
      }
      // 🏛 Battle of Fame: a Hall of Fame team steps down from its plaque.
      // Pure exhibition — no leaderboard, no Elo, no belt. Glory and sips.
      if (opts.hof) {
        try {
          const playerSide = sides.a.units.some((x) => x.ai) ? "b" : "a";
          const player = sides[playerSide].units[0];
          const ghost = opts.hof;
          const ownGhost = player.attId === ghost.attId;
          Store.update((s) => {
            if (winSide === playerSide) {
              Store.grantPoints(s, "battle", player.teamId, 4);
              Store.chron(s, "🏛", ownGhost
                ? player.name + " defeated the ghost of their own championship team. Growth."
                : player.name + " took down " + ghost.name + "'s Hall of Fame team! The plaque still shines… but so does " + player.name + ".");
            } else {
              Store.chron(s, "🏛", ownGhost
                ? player.name + " lost to their own past self. 3 sips of humility."
                : ghost.name + "'s Hall of Fame team stands eternal — " + player.name + " toasts the champion with 3 sips.");
            }
          });
        } catch (_) {}
        return;
      }
      try {
        Store.update((s) => {
          s.battles = s.battles || { log: [] }; s.battles.log = s.battles.log || [];
          s.battles.log.unshift({ title: title, winner: wLabel, loser: lLabel, ts: now(),
            duel: true, wMon: wMons, lMon: lMons });
          if (s.battles.log.length > 60) s.battles.log.length = 60;
          const teams = [];
          sides[winSide].units.forEach((x) => { if (x.teamId && teams.indexOf(x.teamId) < 0) teams.push(x.teamId); });
          teams.forEach((tid) => Store.grantPoints(s, "battle", tid, 4));
          if (Store.chron) Store.chron(s, "⚔️", doubles
            ? wLabel + " out-dueled " + lLabel + " in a double battle!"
            : wLabel + "'s " + wMons + " KO'd " + lLabel + "'s " + lMons + " in a duel!");
          // Champion's Belt — singles only. Unclaimed → winner takes it;
          // the holder loses → it changes hands; the holder wins → a defense.
          // A duel that doesn't involve the holder leaves the belt alone.
          if (!doubles) {
            const w = sides[winSide].units[0], l = sides[other(winSide)].units[0];
            const belt = s.battles.belt;
            const logBelt = () => { s.battles.beltLog = s.battles.beltLog || []; s.battles.beltLog.push({ attId: w.attId, ts: now() }); };
            if (!belt || !belt.attId) {
              s.battles.belt = { attId: w.attId, name: w.name, streak: 1, ts: now() }; logBelt();
              if (Store.chron) Store.chron(s, "🥇", w.name + " claimed the Champion's Belt!");
            } else if (belt.attId === w.attId) {
              belt.streak = (belt.streak || 1) + 1; belt.name = w.name;
            } else if (belt.attId === l.attId) {
              s.battles.belt = { attId: w.attId, name: w.name, streak: 1, ts: now() }; logBelt();
              if (Store.chron) Store.chron(s, "🥇", w.name + " took the Champion's Belt from " + l.name + "!");
            }
            // 📈 Duel Elo (singles only, K=32, everyone starts at 1000).
            if (w.attId && l.attId) {
              s.battles.elo = s.battles.elo || {};
              const rw = s.battles.elo[w.attId] || 1000, rl = s.battles.elo[l.attId] || 1000;
              const exp = 1 / (1 + Math.pow(10, (rl - rw) / 400));
              s.battles.elo[w.attId] = Math.round(rw + 32 * (1 - exp));
              s.battles.elo[l.attId] = Math.round(rl - 32 * (1 - exp));
            }
          }
        });
      } catch (_) {}
    }

    // ---- menus (only the phone that controls the current pick gets one) ----
    function isMine(u) { return mode === "local" || (mode === "remote" && u.client === myClient); }

    function moveBtn(m, onPick) {
      return el("button", { class: "duel-move", style: { "--mt": TYPE_COLOR[m.type] || "#a8a878" }, onClick: onPick }, [
        el("span", { class: "duel-move-name" }, (TYPE_EMOJI[m.type] || "⭐") + " " + m.name),
        el("span", { class: "duel-move-sub" }, "POW " + m.pow + " · " + m.acc + "%"),
      ]);
    }

    function confirmPanel(text, okLabel, onOk) {
      menu.innerHTML = "";
      menu.appendChild(el("div", { class: "duel-confirm" }, [
        el("div", { class: "duel-confirm-txt" }, text),
        el("div", { class: "battle-menu-row" }, [
          el("button", { class: "btn primary", onClick: onOk }, okLabel),
          el("button", { class: "btn subtle", onClick: renderMenu }, "↩ Back"),
        ]),
      ]));
    }

    function partyPanel(u, ptr, kind, allowBack) {
      // pick a replacement (kind "next") or a voluntary switch (kind "switch")
      menu.innerHTML = "";
      menu.appendChild(el("div", { class: "duel-turn " + (posOf(ptr.side)) },
        kind === "next" ? "💫 " + u.name + " — choose your next Pokémon!" : "🔄 " + u.name + " — switch to who?"));
      menu.appendChild(el("div", { class: "duel-party-row" }, bench(u).map((x) =>
        el("button", { class: "duel-bench", onClick: () => {
          sendAct({ seq: S.seq + 1, kind: kind, side: ptr.side, unit: ptr.unit, to: x.i });
        } }, [
          frontSprite(x.m.id, x.m.shiny) ? el("img", { src: frontSprite(x.m.id, x.m.shiny), alt: x.m.name }) : el("span", { class: "draft-thumb-ball" }),
          el("span", { class: "duel-bench-txt" }, x.m.name + " · " + x.m.hp + "/" + x.m.hpMax),
        ]))));
      if (allowBack) menu.appendChild(el("div", { class: "battle-menu-row" },
        [el("button", { class: "btn subtle sm", onClick: renderMenu }, "↩ Back")]));
    }

    function pickTarget(u, ptr, mIdx, z) {
      const foes = livingEnemies(ptr.side);
      if (foes.length <= 1) { doMove(u, ptr, mIdx, foes.length ? foes[0].i : 0, z); return; }
      menu.innerHTML = "";
      menu.appendChild(el("div", { class: "duel-turn " + (posOf(ptr.side)) }, "🎯 Which target?"));
      menu.appendChild(el("div", { class: "battle-menu-row" }, foes.map((x) =>
        el("button", { class: "btn primary", onClick: () => doMove(u, ptr, mIdx, x.i, z) },
          mon(x.u).name + " (" + x.u.name + ")"))));
      menu.appendChild(el("div", { class: "battle-menu-row" },
        [el("button", { class: "btn subtle sm", onClick: renderMenu }, "↩ Back")]));
    }

    function doMove(u, ptr, mIdx, tIdx, z) {
      const m = mon(u), mv = mIdx === 99 ? STRUGGLE : m.moves[mIdx];
      const tm = mon(sides[other(ptr.side)].units[tIdx]);
      const armed = !!z;                               // Liquid Courage: unleashed on THIS hit
      S.zmove = false;
      const eff = effFor(mv.type, tm.types);
      const immune = eff === 0;                        // type trumps everything, even beer
      const miss = !immune && !armed && Math.random() * 100 >= mv.acc;
      const crit = !immune && !miss && (armed || Math.random() < 0.08);
      const dmg = (miss || immune) ? 0 : Math.max(1, Math.round(mv.pow * m.atk * eff * (crit ? 2 : 1) * (0.85 + Math.random() * 0.15)));
      sendAct({ seq: S.seq + 1, kind: "move", side: ptr.side, unit: ptr.unit, move: mIdx, tUnit: tIdx,
        miss: miss, crit: crit, armed: armed, courage: armed, eff: eff, dmg: dmg });
    }

    // ---- gym-leader AI: picks the hardest-hitting move vs the best target,
    // sends the next mon on a faint. No drinks — leaders battle sober.
    function aiAct(u, ptr) {
      if (S.done) return;
      if (S.pending) {
        const b = bench(u);
        if (b.length) sendAct({ seq: S.seq + 1, kind: "next", side: ptr.side, unit: ptr.unit, to: b[0].i });
        return;
      }
      const m = mon(u);
      let best = null;
      livingEnemies(ptr.side).forEach((f) => {
        m.moves.forEach((mv, i) => {
          const score = mv.pow * effFor(mv.type, mon(f.u).types) * (mv.acc / 100);
          if (!best || score > best.score) best = { score: score, mIdx: i, tIdx: f.i };
        });
      });
      if (best && best.score > 0) { doMove(u, ptr, best.mIdx, best.tIdx); return; }
      doMove(u, ptr, 99, (livingEnemies(ptr.side)[0] || { i: 0 }).i);   // fully walled → Struggle
    }

    function renderMenu() {
      if (S.done) return;
      menu.innerHTML = "";
      const ptr = S.pending || S.actor;
      const u = sides[ptr.side].units[ptr.unit];
      // Only the hosting phone rolls the AI's dice — watchers replay its
      // acts from the stream like any other player's.
      if (u.ai && mode !== "watch") {
        menu.appendChild(el("div", { class: "duel-wait" }, "🤖 " + u.name +
          (S.pending ? " sends out the next Pokémon…" : " is planning an attack…")));
        setTimeout(() => {
          const p2 = S.pending || S.actor;
          if (!S.done && !S.busy && sides[p2.side].units[p2.unit] === u) aiAct(u, p2);
        }, 1400);
        return;
      }
      if (mode === "watch" || !isMine(u)) {
        // (watchers' reactions + leave live in the persistent duel-watch-bar)
        menu.appendChild(el("div", { class: "duel-wait" },
          (mode === "watch" ? "👀 " : "⏳ ") + u.name +
          (S.pending ? " is choosing the next Pokémon…" : " is choosing…")));
        return;
      }
      // it's this phone's pick — ping if the app is backgrounded (once per turn)
      if (mode === "remote" && window.AppNotify && AppNotify.ping) {
        const k = S.seq + (S.pending ? "p" : "m");
        if (S.pinged !== k) {
          S.pinged = k;
          AppNotify.ping("🎮 Your move!", S.pending ? "Choose your next Pokémon" : "What will " + mon(u).name + " do?");
        }
      }
      if (S.pending) { partyPanel(u, ptr, "next", false); return; }
      const m = mon(u);
      // Everything immune against everything standing? Struggle keeps the
      // fight alive (typeless, always usable).
      const foes = livingEnemies(ptr.side);
      const walled = m.moves.every((mv) => foes.every((f) => effFor(mv.type, mon(f.u).types) === 0));
      // Liquid Courage armed: Z-move style — the chug happened, now unleash
      // a move on THIS same turn (can't miss, guaranteed crit).
      if (S.zmove) {
        menu.appendChild(el("div", { class: "duel-turn " + (posOf(ptr.side)) },
          "🍺💥 LIQUID COURAGE — " + u.name + ", unleash a move!"));
        const zEls = m.moves.map((mv, i) => moveBtn(mv, () => pickTarget(u, ptr, i, true)));
        if (walled) zEls.push(moveBtn(STRUGGLE, () => pickTarget(u, ptr, 99, true)));
        menu.appendChild(el("div", { class: "duel-moves zmove" }, zEls));
        return;
      }
      menu.appendChild(el("div", { class: "duel-turn " + (posOf(ptr.side)) },
        "🎮 " + u.name + " — what will " + m.name + " do?"));
      const moveEls = m.moves.map((mv, i) => moveBtn(mv, () => pickTarget(u, ptr, i)));
      if (walled) moveEls.push(moveBtn(STRUGGLE, () => pickTarget(u, ptr, 99)));
      menu.appendChild(el("div", { class: "duel-moves" }, moveEls));
      const row = [
        el("button", { class: "btn subtle sm", disabled: u.potions > 0 ? null : "true", onClick: () => {
          confirmPanel("🧪 Drink Potion — " + u.name + " takes 3 sips, and " + m.name + " heals 60 HP.",
            "✅ Sips taken — heal!", () => sendAct({ seq: S.seq + 1, kind: "potion", side: ptr.side, unit: ptr.unit }));
        } }, "🧪 Potion ×" + u.potions),
        el("button", { class: "btn subtle sm", disabled: u.courage ? null : "true", onClick: () => {
          confirmPanel("🍺 Liquid Courage — " + u.name + " finishes half their drink, then UNLEASHES a move this same turn: it can't miss and lands a guaranteed CRITICAL HIT.",
            "🍺 Chugged — power up!", () => { S.zmove = true; sfx("correct"); renderMenu(); });
        } }, "🍺 Liquid Courage"),
      ];
      if (bench(u).length) row.push(el("button", { class: "btn subtle sm", onClick: () => partyPanel(u, ptr, "switch", true) }, "🔄 Switch"));
      row.push(el("button", { class: "btn subtle sm", onClick: () => {
        if (!S.moved) {                           // nothing happened yet — just walk away (hot-seat only)
          if (mode === "local") {
            if (liveLocal) try { Sync.finishLiveBattle(""); if (castId) Sync.endRemoteDuel(""); if (castUnsub) { castUnsub(); castUnsub = null; } } catch (_) {}
            close(); return;
          }
        }
        if (confirm("Give up? " + label(other(ptr.side)) + " take" + (sides[other(ptr.side)].units.length > 1 ? "" : "s") + " the win.")) {
          sendAct({ seq: S.seq + 1, kind: "forfeit", side: ptr.side, unit: ptr.unit });
        }
      } }, "🏳️"));
      menu.appendChild(el("div", { class: "battle-menu-row duel-items" }, row));
    }

    // ---- VS intro, then the faster lead moves first ----
    function vsPanel(cls, s) {
      const mons = [];
      sides[s].units.forEach((u) => {
        if (u.ai) {
          // Gym leaders keep their team in the balls — one ball per mon,
          // identities hidden until they're sent out.
          u.party.forEach(() => mons.push(el("div", { class: "battle-ball-inner vs-mon" })));
          return;
        }
        const m = mon(u);
        const src = frontSprite(m.id, m.shiny);
        mons.push(src ? el("img", { class: "vs-mon", src: src, alt: "" }) : el("div", { class: "battle-ball-inner vs-mon" }));
      });
      return el("div", { class: "vs-panel " + cls }, [
        el("div", { class: "vs-mons" }, mons),
        el("div", { class: "vs-name" }, label(s)),
      ]);
    }
    const vs = el("div", { class: "battle-vs" }, [vsPanel("a", myView), el("div", { class: "vs-badge" }, "VS"), vsPanel("b", other(myView))]);
    document.documentElement.classList.add("scroll-lock");
    document.body.appendChild(overlay);
    overlay.appendChild(vs);
    if (window.SFX && SFX.battleMusic) SFX.battleMusic(true);
    sfx("blip");
    requestAnimationFrame(() => vs.classList.add("go"));
    setTimeout(() => sfx("select"), 300);
    setTimeout(() => {
      vs.classList.add("out");
      setTimeout(() => vs.remove(), 400);
      overlay.classList.add("go", "ready");
      sfx("blip");
      const lead = sides[S.first].units[0];
      msg.textContent = mon(lead).name + " is faster — " + label(S.first) + " go" + (label(S.first).indexOf(" & ") >= 0 ? "" : "es") + " first!";
      setTimeout(() => { if (!S.done) { S.ready = true; renderMenu(); pump(); } }, 900);
    }, 1700);

    return { receiveActs: receiveActs, receiveRx: receiveRx, close: close };
  }

  window.Duel = { start: start, statsFor: statsFor, poolFor: poolFor, pickParty: pickParty, pickTrainer: pickTrainer };
})();
