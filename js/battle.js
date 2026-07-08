/* battle.js — reusable retro Pokémon battle screen. Global `Battle`.
   Battle.start({ title, a, b, isFinal, onResult }) where a/b are sides:
     { label, names: [name1, name2?] }   // up to 2 members = a 2v2 doubles
   Each name resolves to a squad member's favorite Pokémon, a team (Poké Ball
   + energy), or a custom name (Poké Ball). onResult("a"|"b") fires on KO.
   Used by the Brackets battle button and the standalone Battle Arena. */
(function () {
  const { el, energyIcon } = U;
  function sfx(name) { if (window.SFX && SFX[name]) SFX[name](); }

  // Simplified type-effectiveness chart (attacker → defenders).
  const TYPE_CHART = {
    normal: { nve: ["rock", "steel"], no: ["ghost"] },
    fire: { se: ["grass", "ice", "bug", "steel"], nve: ["fire", "water", "rock", "dragon"] },
    water: { se: ["fire", "ground", "rock"], nve: ["water", "grass", "dragon"] },
    electric: { se: ["water", "flying"], nve: ["electric", "grass", "dragon"], no: ["ground"] },
    grass: { se: ["water", "ground", "rock"], nve: ["fire", "grass", "poison", "flying", "bug", "dragon", "steel"] },
    ice: { se: ["grass", "ground", "flying", "dragon"], nve: ["fire", "water", "ice", "steel"] },
    fighting: { se: ["normal", "ice", "rock", "dark", "steel"], nve: ["poison", "flying", "psychic", "bug", "fairy"], no: ["ghost"] },
    poison: { se: ["grass", "fairy"], nve: ["poison", "ground", "rock", "ghost"], no: ["steel"] },
    ground: { se: ["fire", "electric", "poison", "rock", "steel"], nve: ["grass", "bug"], no: ["flying"] },
    flying: { se: ["grass", "fighting", "bug"], nve: ["electric", "rock", "steel"] },
    psychic: { se: ["fighting", "poison"], nve: ["psychic", "steel"], no: ["dark"] },
    bug: { se: ["grass", "psychic", "dark"], nve: ["fire", "fighting", "poison", "flying", "ghost", "steel", "fairy"] },
    rock: { se: ["fire", "ice", "flying", "bug"], nve: ["fighting", "ground", "steel"] },
    ghost: { se: ["psychic", "ghost"], nve: ["dark"], no: ["normal"] },
    dragon: { se: ["dragon"], nve: ["steel"], no: ["fairy"] },
    dark: { se: ["psychic", "ghost"], nve: ["fighting", "dark", "fairy"] },
    steel: { se: ["ice", "rock", "fairy"], nve: ["fire", "water", "electric", "steel"] },
    fairy: { se: ["fighting", "dragon", "dark"], nve: ["fire", "poison", "steel"] },
  };
  function effectiveness(atk, def) {
    const c = TYPE_CHART[atk]; if (!c) return 1;
    if (c.no && c.no.indexOf(def) >= 0) return 0;     // true immunity (0 damage in duels)
    if (c.se && c.se.indexOf(def) >= 0) return 2;
    if (c.nve && c.nve.indexOf(def) >= 0) return 0.5;
    return 1;
  }

  // Resolve one entrant name to battle visuals.
  function resolveMember(name) {
    name = (name || "").trim();
    const at = Store.state.attendees.find((a) => a.name === name);
    if (at) {
      const f = Store.currentForm(at);
      const card = at.card || (window.SEED && window.SEED.cards && window.SEED.cards[at.id]) || {};
      const move = (card.attacks && card.attacks[0] && card.attacks[0].name) || "Tackle";
      const back = (window.SPRITES_BACK && window.SPRITES_BACK[f.id]) || "";
      return { sprite: f.id ? Store.sprite(f.id) : "", back: back, scale: f.scale || 1, type: at.type, move: move };
    }
    const tm = Store.state.teams.find((t) => t.name && name.indexOf(t.name) >= 0);
    if (tm) return { ball: true, type: tm.id, move: "Team Rush" };
    // NPC Gym Leaders / League members — the ball carries their real type
    // (Falkner's is flying, not a random bolt).
    const up = name.toUpperCase();
    const gym = (window.GYM_CIRCUIT || []).find((g) => up.indexOf(g.leader) >= 0);
    if (gym) return { ball: true, type: gym.type, move: "Gym Sweep" };
    const st = (window.LEAGUE_STAGES || []).find((s) => new RegExp("\\b" + s.name + "\\b").test(up));
    if (st) return { ball: true, type: st.type, move: "Elite Strike" };
    return { ball: true, type: "normal", move: "Tackle" };
  }

  // Distinct team ids represented by a winning side (attendee's team, or a
  // team fighting directly). Used to award Victory Road points on a win.
  function teamsForNames(names, label) {
    const ids = [];
    const list = names && names.length ? names : [label];
    list.forEach((nm) => {
      const at = Store.state.attendees.find((a) => a.name === nm);
      if (at && at.team) { if (ids.indexOf(at.team) < 0) ids.push(at.team); return; }
      const tm = Store.state.teams.find((t) => t.name && String(nm).indexOf(t.name) >= 0);
      if (tm && ids.indexOf(tm.id) < 0) ids.push(tm.id);
    });
    return ids;
  }

  function monEl(mn, side) {
    let inner;
    // Player side shows the rear-view (back) sprite when we have it — like the
    // real games. Otherwise fall back to a mirrored front sprite.
    const useBack = side === "you" && mn.back;
    const src = useBack ? mn.back : mn.sprite;
    if (src) {
      const flip = (side === "you" && !useBack) ? -1 : 1;
      inner = el("img", { class: "battle-sprite-img", src: src, alt: "",
        style: { transform: "scaleX(" + flip + ") scale(" + (mn.scale || 1) + ")" } });
    } else {
      inner = el("div", { class: "battle-ball-inner" });
      const ico = energyIcon(mn.type);
      if (ico) inner.appendChild(el("img", { class: "battle-ball-ico", src: ico, alt: "" }));
    }
    return inner;
  }

  function sideSprites(members, side) {
    const wrap = el("div", { class: "battle-sprite " + side + (members.length > 1 ? " doubles" : "") });
    members.forEach((mn, i) => wrap.appendChild(el("div", { class: "battle-mon mon" + i }, [monEl(mn, side)])));
    return wrap;
  }

  // One HP box per side, with a separate name + bar for each member (so 2v2
  // shows both names in full instead of a truncated combined label).
  function hpBox(names, side) {
    const list = (names && names.length ? names : ["?"]).slice(0, 2);
    const fills = [];
    const rows = list.map((nm) => {
      const fill = el("div", { class: "battle-hp-fill" });
      fills.push(fill);
      return el("div", { class: "battle-hp-mem" }, [
        el("div", { class: "battle-hp-name" }, nm),
        el("div", { class: "battle-hp-row" }, [
          el("span", { class: "battle-hp-lbl" }, "HP"),
          el("div", { class: "battle-hp-track" }, [fill]),
        ]),
      ]);
    });
    const box = el("div", { class: "battle-hpbox " + side + (list.length > 1 ? " doubles" : "") }, rows);
    return { box: box, fills: fills };
  }

  function start(opts) {
    opts = opts || {};
    const a = opts.a || { label: "Side A", names: [] };
    const b = opts.b || { label: "Side B", names: [] };
    const aMembers = (a.names || []).filter(Boolean).slice(0, 2).map(resolveMember);
    const bMembers = (b.names || []).filter(Boolean).slice(0, 2).map(resolveMember);
    if (!aMembers.length) aMembers.push(resolveMember(a.label));
    if (!bMembers.length) bMembers.push(resolveMember(b.label));

    const aLabels = (a.names && a.names.length ? a.names : [a.label]).slice(0, 2);
    const bLabels = (b.names && b.names.length ? b.names : [b.label]).slice(0, 2);
    const youSprite = sideSprites(aMembers, "you"), foeSprite = sideSprites(bMembers, "foe");
    const youHp = hpBox(aLabels, "you"), foeHp = hpBox(bLabels, "foe");
    const msg = el("div", { class: "battle-msg" },
      (opts.title ? opts.title + " — " : "") + a.label + " VS " + b.label + "!");
    const menu = el("div", { class: "battle-menu" });
    let done = false;

    const overlay = el("div", { class: "battle" }, [
      el("div", { class: "battle-arena" }, [
        el("div", { class: "battle-platform foe" }), el("div", { class: "battle-platform you" }),
        foeHp.box, foeSprite, youSprite, youHp.box,
      ]),
      msg, menu,
    ]);
    function close() {
      overlay.classList.add("out"); setTimeout(() => overlay.remove(), 350);
      if (document.querySelectorAll(".battle").length <= 1)
        document.documentElement.classList.remove("scroll-lock");
    }

    function fight(winnerKey) {
      if (done) return; done = true;
      menu.innerHTML = "";
      const winIsA = winnerKey === "a";
      const W = { label: a.label, members: aMembers, sprite: youSprite };
      const L = { label: b.label, members: bMembers, sprite: foeSprite, fills: foeHp.fills };
      if (!winIsA) {
        W.label = b.label; W.members = bMembers; W.sprite = foeSprite;
        L.label = a.label; L.members = aMembers; L.sprite = youSprite; L.fills = youHp.fills;
      }
      const eff = effectiveness(W.members[0].type, L.members[0].type);
      const move = W.members[0].move;
      const extra = eff !== 1 ? 250 : 0;
      msg.textContent = W.label + " used " + move + "!";
      sfx("select");
      W.sprite.classList.add("attack");
      setTimeout(() => {
        L.sprite.classList.add("hurt");
        if (eff === 2) L.sprite.classList.add("crit");
        L.fills.forEach(function (f) { f.style.width = "0%"; }); sfx("coin");
      }, 420);
      if (eff !== 1) setTimeout(() => {
        msg.textContent = eff === 2 ? "💥 It's super effective!" : "…It's not very effective.";
        if (eff === 2) sfx("correct");
      }, 820);
      setTimeout(() => {
        L.sprite.classList.remove("hurt", "crit"); L.sprite.classList.add("fainted");
        msg.textContent = L.label + " fainted!"; sfx("error");
      }, 1250 + extra);
      setTimeout(() => {
        msg.textContent = "🏆 " + W.label + " wins" + (opts.title ? " " + opts.title : "") + "!";
        sfx(opts.isFinal ? "fanfare" : "win");
        // Only the "real" (non-spectator) screen records the result.
        if (!opts.spectator) try {
          const winNames = winIsA ? (a.names || []) : (b.names || []);
          const winTeams = teamsForNames(winNames, W.label);
          Store.update((s) => {
            s.battles = s.battles || { log: [] }; s.battles.log = s.battles.log || [];
            s.battles.log.unshift({ title: opts.title || "Battle", winner: W.label, loser: L.label,
              ts: (function () { try { return Date.now(); } catch (_) { return 0; } })() });
            if (s.battles.log.length > 60) s.battles.log.length = 60;
            // A battle win scores for the winner's team(s) toward Victory Road.
            winTeams.forEach((tid) => Store.grantPoints(s, "battle", tid, 4));
            if (Store.chron) Store.chron(s, "⚔️", W.label + " beat " + L.label + (opts.title ? " at " + opts.title : "") + "!");
          });
        } catch (_) {}
      }, 2050 + extra);
      setTimeout(() => { close(); if (opts.onResult) opts.onResult(winnerKey); }, 3300 + extra);
    }

    // Map a winner (side key, label, or a member name) to "a" / "b".
    function resolveKey(w) {
      if (w === "a" || w === "b") return w;
      const nm = String(w || "");
      if (a.label === nm || (a.names || []).indexOf(nm) >= 0) return "a";
      if (b.label === nm || (b.names || []).indexOf(nm) >= 0) return "b";
      return "a";
    }

    if (opts.spectator) {
      menu.appendChild(el("div", { class: "battle-menu-q" }, "👀 Spectating — waiting for the winner…"));
      menu.appendChild(el("div", { class: "battle-menu-row" }, [
        el("button", { class: "btn subtle sm", onClick: () => {
          if (!done) close();
          if (opts.onClose) try { opts.onClose(); } catch (_) {}
        } }, "✕ Stop watching"),
      ]));
    } else {
      menu.appendChild(el("div", { class: "battle-menu-q" }, "Who takes it?"));
      menu.appendChild(el("div", { class: "battle-menu-row" }, [
        el("button", { class: "btn primary", onClick: () => fight("a") }, "👊 " + a.label),
        el("button", { class: "btn primary", onClick: () => fight("b") }, "👊 " + b.label),
      ]));
      menu.appendChild(el("div", { class: "battle-menu-row" }, [
        el("button", { class: "btn subtle sm", onClick: () => fight(Math.random() < 0.5 ? "a" : "b") }, "🎲 Random KO"),
        el("button", { class: "btn subtle sm", onClick: () => { if (!done) close(); } }, "Cancel"),
      ]));
    }

    // VS intro: two panels clash, then reveal the arena.
    function vsPanel(cls, labels, members) {
      const mons = el("div", { class: "vs-mons" }, members.map((mn) =>
        mn.sprite ? el("img", { class: "vs-mon", src: mn.sprite, alt: "" }) : el("div", { class: "battle-ball-inner vs-mon" })));
      return el("div", { class: "vs-panel " + cls }, [mons, el("div", { class: "vs-name" }, labels.join(" & "))]);
    }
    const vs = el("div", { class: "battle-vs" }, [
      vsPanel("a", aLabels, aMembers),
      el("div", { class: "vs-badge" }, "VS"),
      vsPanel("b", bLabels, bMembers),
    ]);

    document.documentElement.classList.add("scroll-lock");
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
    }, 1700);

    // Handle for remote control (spectator screens resolve when the referee
    // reports the winner).
    return { finish: function (w) { if (!done) fight(resolveKey(w)); }, close: close };
  }

  // View-only screen for spectators; returns a handle whose .finish(winner)
  // plays the KO once the referee's result arrives.
  function spectate(opts) { return start(Object.assign({}, opts || {}, { spectator: true })); }

  window.Battle = { start: start, spectate: spectate, resolveMember: resolveMember, effectiveness: effectiveness };
})();
