/* brackets.js — single-elimination tournament brackets for the 1v1 / 2v2
   events (beer pong, cornhole, kan jam…). Build a bracket from teams, the
   squad, or custom names; tap a name to advance the winner. Champions feed
   your bragging rights. Stored in Store.state.brackets. */
(function () {
  const { el, uid, contrast, energyIcon } = U;
  function sfx(name) { if (window.SFX && SFX[name]) SFX[name](); }

  // Resolve a bracket entrant name to battle visuals. Squad members fight as
  // their favorite Pokémon; teams/custom names fight as a Poké Ball.
  function fighter(name) {
    const at = Store.state.attendees.find((a) => a.name === name);
    if (at) {
      const f = Store.currentForm(at);
      const card = at.card || (window.SEED && window.SEED.cards && window.SEED.cards[at.id]) || {};
      const move = (card.attacks && card.attacks[0] && card.attacks[0].name) || "Tackle";
      return { label: name, sprite: f.id ? Store.sprite(f.id) : "", scale: f.scale || 1, type: at.type, move: move, hp: card.hp || 100 };
    }
    const tm = Store.state.teams.find((t) => t.name && name.indexOf(t.name) >= 0);
    if (tm) return { label: name, ball: true, type: tm.id, move: "Team Rush", hp: 100 };
    return { label: name, ball: true, type: "normal", move: "Tackle", hp: 100 };
  }

  // Round r has size/2^(r+1) matches. Slot names derive from prior winners.
  function slotsFor(b, r, m) {
    if (r === 0) return { a: b.participants[2 * m] || "", b: b.participants[2 * m + 1] || "" };
    const prev = b.winners[r - 1] || [];
    return { a: prev[2 * m] || "", b: prev[2 * m + 1] || "" };
  }

  // Drop any winner that's no longer valid for its (possibly changed) slots.
  function normalize(b) {
    for (let r = 0; r < b.winners.length; r++) {
      for (let m = 0; m < b.winners[r].length; m++) {
        const w = b.winners[r][m];
        if (!w) continue;
        const { a, b: bb } = slotsFor(b, r, m);
        if (w !== a && w !== bb) b.winners[r][m] = "";
        // Auto-advance a lone real player against a BYE.
        if (!b.winners[r][m]) {
          if (a && a !== "BYE" && (bb === "BYE" || bb === "")) { if (bb === "BYE") b.winners[r][m] = a; }
          else if (bb && bb !== "BYE" && a === "BYE") b.winners[r][m] = bb;
        }
      }
    }
  }

  function champion(b) {
    const last = b.winners[b.winners.length - 1];
    return (last && last[0]) || "";
  }

  function buildBracket(title, parts) {
    let size = 1; while (size < Math.max(2, parts.length)) size *= 2;
    const participants = parts.slice();
    while (participants.length < size) participants.push("BYE");
    const winners = [];
    let matches = size / 2;
    while (matches >= 1) { winners.push(new Array(matches).fill("")); matches = matches / 2; }
    const b = { id: uid("brk"), title: title || "Tournament", participants, winners };
    // Auto-advance round-0 byes.
    for (let m = 0; m < b.winners[0].length; m++) {
      const { a, b: bb } = slotsFor(b, 0, m);
      if (a === "BYE" && bb !== "BYE") b.winners[0][m] = bb;
      else if (bb === "BYE" && a !== "BYE") b.winners[0][m] = a;
    }
    return b;
  }

  // ---- Create modal ---------------------------------------------------------
  function openCreate(onDone) {
    const titleIn = el("input", { class: "in", placeholder: "e.g. Beer Pong Championship" });
    const names = [];
    const list = el("div", { class: "brk-names" });
    const nameIn = el("input", { class: "in grow", placeholder: "Add a player / team…" });

    function renderNames() {
      list.innerHTML = "";
      if (!names.length) { list.appendChild(el("p", { class: "hint" }, "No entrants yet.")); return; }
      names.forEach((n, i) => list.appendChild(el("span", { class: "brk-name-chip" }, [
        n, el("button", { class: "x", onClick: () => { names.splice(i, 1); renderNames(); } }, "×"),
      ])));
    }
    function addName(n) { n = (n || "").trim(); if (n) { names.push(n); renderNames(); } }

    nameIn.addEventListener("keydown", (e) => { if (e.key === "Enter") { addName(nameIn.value); nameIn.value = ""; } });

    const body = el("div", { class: "modal-form" }, [
      el("label", { class: "field" }, ["Bracket name", titleIn]),
      el("div", { class: "brk-quick" }, [
        el("button", { class: "btn subtle sm", onClick: () => {
          Store.state.teams.forEach((t) => names.push((t.emoji || "") + " " + t.name)); renderNames();
        } }, "＋ Add all teams"),
        el("button", { class: "btn subtle sm", onClick: () => {
          Store.state.attendees.forEach((a) => names.push(a.name)); renderNames();
        } }, "＋ Add whole squad"),
        el("button", { class: "btn subtle sm", onClick: () => { names.length = 0; renderNames(); } }, "Clear"),
      ]),
      el("label", { class: "field" }, ["Entrants", el("div", { class: "brk-add-row" }, [
        nameIn, el("button", { class: "btn sm", onClick: () => { addName(nameIn.value); nameIn.value = ""; } }, "Add"),
      ])]),
      list,
    ]);
    renderNames();

    Modal.open("New Bracket", body, () => {
      if (names.length < 2) { alert("Add at least 2 entrants."); return; }
      const b = buildBracket(titleIn.value.trim() || "Tournament", names);
      Store.update((s) => { s.brackets.push(b); });
      if (onDone) onDone();
    }, { saveLabel: "Create bracket", wide: false });
  }

  // ---- Retro battle screen --------------------------------------------------
  function fighterSprite(f, side) {
    let inner;
    if (f.sprite) {
      inner = el("img", { class: "battle-sprite-img", src: f.sprite, alt: f.label,
        style: { transform: "scaleX(" + (side === "you" ? -1 : 1) + ") scale(" + (f.scale || 1) + ")" } });
    } else {
      inner = el("div", { class: "battle-ball-inner" });
      const ico = energyIcon(f.type === "normal" ? "electric" : f.type);
      if (ico) inner.appendChild(el("img", { class: "battle-ball-ico", src: ico, alt: "" }));
    }
    return el("div", { class: "battle-sprite " + side }, [inner]);
  }

  function hpBox(f, side) {
    const fill = el("div", { class: "battle-hp-fill" });
    const box = el("div", { class: "battle-hpbox " + side }, [
      el("div", { class: "battle-hp-name" }, f.label),
      el("div", { class: "battle-hp-row" }, [
        el("span", { class: "battle-hp-lbl" }, "HP"),
        el("div", { class: "battle-hp-track" }, [fill]),
      ]),
    ]);
    return { box: box, fill: fill };
  }

  function openBattle(bid, r, m, aName, bName, total, onChange) {
    const A = fighter(aName), B = fighter(bName);   // A = you (bottom), B = foe (top)
    const youSprite = fighterSprite(A, "you"), foeSprite = fighterSprite(B, "foe");
    const youHp = hpBox(A, "you"), foeHp = hpBox(B, "foe");
    const msg = el("div", { class: "battle-msg" }, "Wild match! " + A.label + " VS " + B.label + "!");
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

    function fight(winner) {
      if (done) return; done = true;
      menu.innerHTML = "";
      const winIsA = winner === aName;
      const W = winIsA ? A : B, L = winIsA ? B : A;
      const wSprite = winIsA ? youSprite : foeSprite, lSprite = winIsA ? foeSprite : youSprite;
      const lFill = winIsA ? foeHp.fill : youHp.fill;

      msg.textContent = W.label + " used " + W.move + "!";
      sfx("select");
      wSprite.classList.add("attack");
      setTimeout(() => {
        lSprite.classList.add("hurt");
        lFill.style.width = "0%";
        sfx("coin");
      }, 420);
      setTimeout(() => {
        lSprite.classList.remove("hurt"); lSprite.classList.add("fainted");
        msg.textContent = L.label + " fainted!";
        sfx("error");
      }, 1250);
      setTimeout(() => {
        msg.textContent = "🏆 " + W.label + " wins the match!";
        sfx(r === total - 1 ? "fanfare" : "win");
      }, 2050);
      setTimeout(() => {
        Store.update((s) => {
          const bx = s.brackets.find((x) => x.id === bid);
          if (bx) { bx.winners[r][m] = winner; normalize(bx); }
        });
        close(); onChange();
      }, 3300);
    }

    menu.appendChild(el("div", { class: "battle-menu-q" }, "Who takes it?"));
    menu.appendChild(el("div", { class: "battle-menu-row" }, [
      el("button", { class: "btn primary", onClick: () => fight(aName) }, "👊 " + A.label),
      el("button", { class: "btn primary", onClick: () => fight(bName) }, "👊 " + B.label),
    ]));
    menu.appendChild(el("div", { class: "battle-menu-row" }, [
      el("button", { class: "btn subtle sm", onClick: () => fight(Math.random() < 0.5 ? aName : bName) }, "🎲 Random KO"),
      el("button", { class: "btn subtle sm", onClick: () => { if (!done) close(); } }, "Cancel"),
    ]));

    document.body.appendChild(overlay);
    // Slide the fighters in.
    requestAnimationFrame(() => overlay.classList.add("go"));
    sfx("blip");
  }

  // ---- Render one bracket ---------------------------------------------------
  function renderBracket(b, onChange) {
    Store.update((s) => { normalize(s.brackets.find((x) => x.id === b.id)); });
    b = Store.state.brackets.find((x) => x.id === b.id);

    const roundNames = (r, total) => {
      const fromEnd = total - r;
      if (fromEnd === 1) return "Final";
      if (fromEnd === 2) return "Semifinals";
      if (fromEnd === 3) return "Quarterfinals";
      return "Round " + (r + 1);
    };

    const cols = el("div", { class: "brk-rounds" });
    const total = b.winners.length;
    for (let r = 0; r < total; r++) {
      const col = el("div", { class: "brk-round" }, [el("div", { class: "brk-round-title" }, roundNames(r, total))]);
      for (let m = 0; m < b.winners[r].length; m++) {
        const { a, b: bb } = slotsFor(b, r, m);
        const win = b.winners[r][m];
        const slot = (name) => {
          const isBye = name === "BYE";
          const known = name && !isBye;
          return el("button", {
            class: "brk-slot" + (win && win === name ? " won" : "") + (win && win !== name ? " lost" : "") + (isBye ? " bye" : ""),
            disabled: !known || (!a || !bb || a === "BYE" || bb === "BYE"),
            onClick: () => {
              Store.update((s) => {
                const bx = s.brackets.find((x) => x.id === b.id);
                bx.winners[r][m] = name;
                normalize(bx);
              });
              sfx(r === total - 1 ? "fanfare" : "win");
              onChange();
            },
          }, name || "—");
        };
        const ready = a && bb && a !== "BYE" && bb !== "BYE" && !win;
        col.appendChild(el("div", { class: "brk-match" }, [
          slot(a), slot(bb),
          ready ? el("button", { class: "brk-battle", title: "Battle it out!",
            onClick: (e) => { e.stopPropagation(); openBattle(b.id, r, m, a, bb, total, onChange); } }, "⚔ Battle") : null,
        ]));
      }
      cols.appendChild(col);
    }

    const champ = champion(b);
    const card = el("div", { class: "brk-card" }, [
      el("div", { class: "brk-card-head" }, [
        el("h3", {}, "🏆 " + b.title),
        el("button", { class: "btn danger sm", onClick: () => {
          if (confirm("Delete this bracket?")) { Store.update((s) => { s.brackets = s.brackets.filter((x) => x.id !== b.id); }); onChange(); }
        } }, "Delete"),
      ]),
      champ ? el("div", { class: "brk-champ" }, "👑 Champion: " + champ) : null,
      el("div", { class: "brk-scroll" }, [cols]),
    ]);
    return card;
  }

  function view(root) {
    root.appendChild(el("div", { class: "page-head" }, [
      el("h1", {}, "🥊 Brackets"),
      el("p", { class: "page-sub" }, "Single-elimination tournaments. Tap a name to advance them — or hit ⚔ Battle for a Pokémon showdown."),
    ]));

    root.appendChild(el("div", { class: "toolbar", style: { marginTop: "0", marginBottom: "16px" } }, [
      el("button", { class: "btn primary", onClick: () => openCreate(() => Router.render()) }, "＋ New bracket"),
    ]));

    const list = el("div", { class: "brk-list" });
    function renderAll() {
      list.innerHTML = "";
      const bs = Store.state.brackets || [];
      if (!bs.length) {
        list.appendChild(el("p", { class: "empty" }, "No brackets yet. Spin one up for beer pong, cornhole, or kan jam 👆"));
        return;
      }
      bs.forEach((b) => list.appendChild(renderBracket(b, renderAll)));
    }
    renderAll();
    root.appendChild(list);
  }

  window.Views = window.Views || {};
  window.Views.brackets = view;
})();
