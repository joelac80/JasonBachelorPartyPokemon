/* battle.js — reusable retro Pokémon battle screen. Global `Battle`.
   Battle.start({ title, a, b, isFinal, onResult }) where a/b are sides:
     { label, names: [name1, name2?] }   // up to 2 members = a 2v2 doubles
   Each name resolves to a squad member's favorite Pokémon, a team (Poké Ball
   + energy), or a custom name (Poké Ball). onResult("a"|"b") fires on KO.
   Used by the Brackets battle button and the standalone Battle Arena. */
(function () {
  const { el, energyIcon } = U;
  function sfx(name) { if (window.SFX && SFX[name]) SFX[name](); }

  // Resolve one entrant name to battle visuals.
  function resolveMember(name) {
    name = (name || "").trim();
    const at = Store.state.attendees.find((a) => a.name === name);
    if (at) {
      const f = Store.currentForm(at);
      const card = at.card || (window.SEED && window.SEED.cards && window.SEED.cards[at.id]) || {};
      const move = (card.attacks && card.attacks[0] && card.attacks[0].name) || "Tackle";
      return { sprite: f.id ? Store.sprite(f.id) : "", scale: f.scale || 1, type: at.type, move: move };
    }
    const tm = Store.state.teams.find((t) => t.name && name.indexOf(t.name) >= 0);
    if (tm) return { ball: true, type: tm.id, move: "Team Rush" };
    return { ball: true, type: "normal", move: "Tackle" };
  }

  function monEl(mn, side) {
    let inner;
    if (mn.sprite) {
      inner = el("img", { class: "battle-sprite-img", src: mn.sprite, alt: "",
        style: { transform: "scaleX(" + (side === "you" ? -1 : 1) + ") scale(" + (mn.scale || 1) + ")" } });
    } else {
      inner = el("div", { class: "battle-ball-inner" });
      const ico = energyIcon(mn.type === "normal" ? "electric" : mn.type);
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
    function close() { overlay.classList.add("out"); setTimeout(() => overlay.remove(), 350); }

    function fight(winnerKey) {
      if (done) return; done = true;
      menu.innerHTML = "";
      const winIsA = winnerKey === "a";
      const W = { label: a.label, members: aMembers, sprite: youSprite };
      const L = { label: b.label, sprite: foeSprite, fills: foeHp.fills };
      if (!winIsA) {
        W.label = b.label; W.members = bMembers; W.sprite = foeSprite;
        L.label = a.label; L.sprite = youSprite; L.fills = youHp.fills;
      }
      const move = W.members[0].move;
      msg.textContent = W.label + " used " + move + "!";
      sfx("select");
      W.sprite.classList.add("attack");
      setTimeout(() => { L.sprite.classList.add("hurt"); L.fills.forEach(function (f) { f.style.width = "0%"; }); sfx("coin"); }, 420);
      setTimeout(() => {
        L.sprite.classList.remove("hurt"); L.sprite.classList.add("fainted");
        msg.textContent = L.label + " fainted!"; sfx("error");
      }, 1250);
      setTimeout(() => {
        msg.textContent = "🏆 " + W.label + " wins" + (opts.title ? " " + opts.title : "") + "!";
        sfx(opts.isFinal ? "fanfare" : "win");
      }, 2050);
      setTimeout(() => { close(); if (opts.onResult) opts.onResult(winnerKey); }, 3300);
    }

    menu.appendChild(el("div", { class: "battle-menu-q" }, "Who takes it?"));
    menu.appendChild(el("div", { class: "battle-menu-row" }, [
      el("button", { class: "btn primary", onClick: () => fight("a") }, "👊 " + a.label),
      el("button", { class: "btn primary", onClick: () => fight("b") }, "👊 " + b.label),
    ]));
    menu.appendChild(el("div", { class: "battle-menu-row" }, [
      el("button", { class: "btn subtle sm", onClick: () => fight(Math.random() < 0.5 ? "a" : "b") }, "🎲 Random KO"),
      el("button", { class: "btn subtle sm", onClick: () => { if (!done) close(); } }, "Cancel"),
    ]));

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add("go"));
    sfx("blip");
  }

  window.Battle = { start: start, resolveMember: resolveMember };
})();
