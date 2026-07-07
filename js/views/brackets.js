/* brackets.js — single-elimination tournament brackets for the 1v1 / 2v2
   events (beer pong, cornhole, kan jam…). Build a bracket from teams, the
   squad, or custom names; tap a name to advance the winner. Champions feed
   your bragging rights. Stored in Store.state.brackets. */
(function () {
  const { el, uid, contrast } = U;
  function sfx(name) { if (window.SFX && SFX[name]) SFX[name](); }

  // Split an entrant name into up to two members ("Jason & Joe" → doubles).
  function membersOf(name) { return (name || "").split(/\s*[&+/]\s*/).filter(Boolean).slice(0, 2); }

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
    const nameIn = el("input", { class: "in grow", placeholder: "Add a player / team… (use “A & B” for 2v2)" });
    const doublesIn = el("input", { type: "checkbox" });

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
          const list = Store.state.attendees;
          if (doublesIn.checked) {
            for (let i = 0; i < list.length; i += 2) names.push(list[i].name + (list[i + 1] ? " & " + list[i + 1].name : ""));
          } else list.forEach((a) => names.push(a.name));
          renderNames();
        } }, "＋ Add whole squad"),
        el("button", { class: "btn subtle sm", onClick: () => { names.length = 0; renderNames(); } }, "Clear"),
      ]),
      el("label", { class: "jp-check" }, [doublesIn, " Doubles (2v2) — pair up the squad"]),
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

  // ---- Battle button → a REAL duel when both entrants are squad members,
  // with the old referee screen as the fallback (custom names, teams, or
  // real-world matches someone just wants to log).
  function openBattle(bid, r, m, aName, bName, total, onChange) {
    const record = (winnerKey) => {
      const winner = winnerKey === "a" ? aName : bName;
      Store.update((s) => {
        const bx = s.brackets.find((x) => x.id === bid);
        if (bx) { bx.winners[r][m] = winner; normalize(bx); }
      });
      onChange();
    };
    const referee = () => Battle.start({
      title: "the Match",
      a: { label: aName, names: membersOf(aName) },
      b: { label: bName, names: membersOf(bName) },
      isFinal: r === total - 1,
      onResult: record,
    });
    const aAtt = Store.state.attendees.find((x) => x.name === aName);
    const bAtt = Store.state.attendees.find((x) => x.name === bName);
    if (!aAtt || !bAtt || !window.Duel) { referee(); return; }
    let ctrl;
    const body = U.el("div", { class: "chal-modal" }, [
      U.el("div", { class: "chal-line" }, aName + " vs " + bName + " — how do we settle it?"),
      U.el("div", { class: "toolbar" }, [
        U.el("button", { class: "btn primary", onClick: () => { ctrl.close();
          Duel.pickParty({ attId: aAtt.id, max: 3, title: aName + "'s party (up to 3)", onDone: (aIds) => {
            Duel.pickParty({ attId: bAtt.id, max: 3, title: bName + "'s party (up to 3)", onDone: (bIds) => {
              Duel.start({ mode: "local", title: r === total - 1 ? "the Final" : "the Match",
                a: { units: [{ attId: aAtt.id, monIds: aIds }] },
                b: { units: [{ attId: bAtt.id, monIds: bIds }] },
                onResult: record });
            } });
          } });
        } }, "🎮 Real duel"),
        U.el("button", { class: "btn subtle", onClick: () => { ctrl.close(); referee(); } }, "📣 Quick call"),
      ]),
    ]);
    ctrl = Modal.open("⚔ " + (r === total - 1 ? "The Final!" : "Bracket match"), body, null, { noFooter: true });
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
