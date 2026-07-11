/* jeopardy.js — Jason Jeopardy: a Bulbasaur-themed trivia board.
   "Daily Bulba" squares are our Daily Double. Scoring runs against the
   Victory Road teams. Clues are editable in-app (tap ✎) so real questions
   from Bob can be dropped in live. Board state lives in Store.state.jeopardy. */
(function () {
  const { el, contrast } = U;

  function J() { return Store.state.jeopardy; }
  function key(r, ci, qi) { return r + "-" + ci + "-" + qi; }
  function sfx(name) { if (window.SFX && SFX[name]) SFX[name](); }
  // The board's rounds (Single / Double Jeopardy). Falls back to a single round
  // for any legacy board that only had a flat `categories` array.
  function rounds() {
    const b = J().board || {};
    if (b.rounds && b.rounds.length) return b.rounds;
    return [{ name: "Jeopardy", categories: b.categories || [] }];
  }
  function curRound() { return Math.min(Math.max(0, J().round || 0), rounds().length - 1); }

  // ---- Scoring against teams ------------------------------------------------
  function teamScore(id) { return (J().scores && J().scores[id]) || 0; }
  function addToTeam(id, delta) {
    Store.update((s) => {
      s.jeopardy.scores = s.jeopardy.scores || {};
      s.jeopardy.scores[id] = (s.jeopardy.scores[id] || 0) + delta;
      // Feed Victory Road too, scaled down (a $300 clue ≈ 3 championship pts).
      Store.grantPoints(s, "jeopardy", id, Math.round(delta / 100));
    });
  }

  function renderScores(host) {
    const teams = Store.state.teams;
    host.innerHTML = "";
    if (!teams.length) {
      host.appendChild(el("p", { class: "empty" }, "Add teams (Draft page) to keep score."));
      return;
    }
    teams.forEach((t) => {
      host.appendChild(el("div", { class: "jp-score", style: { "--tc": t.color } }, [
        el("div", { class: "jp-score-name" }, [U.teamIcon(t), " " + t.name]),
        el("div", { class: "jp-score-val" }, String(teamScore(t.id))),
        el("div", { class: "jp-score-btns" }, teams.length ? [
          el("button", { class: "jp-mini", title: "−100", onClick: () => { addToTeam(t.id, -100); renderScores(host); } }, "−"),
          el("button", { class: "jp-mini", title: "+100", onClick: () => { addToTeam(t.id, 100); renderScores(host); } }, "+"),
        ] : null),
      ]));
    });
  }

  // ---- Clue modal -----------------------------------------------------------
  function openClue(r, ci, qi, onDone) {
    const cat = rounds()[r].categories[ci];
    const clue = cat.clues[qi];
    const teams = Store.state.teams;
    const isBulba = !!clue.dailyBulba;

    if (isBulba) sfx("dailyBulba"); else sfx("select");

    let revealed = false;
    const answerBox = el("div", { class: "jp-answer" }, clue.answer || "TBD");
    answerBox.style.display = "none";

    const revealBtn = el("button", { class: "btn primary jp-reveal" }, "Reveal answer");
    revealBtn.addEventListener("click", () => {
      revealed = true;
      answerBox.style.display = "block";
      revealBtn.style.display = "none";
      scoreRow.style.display = teams.length ? "block" : "none";
    });

    // Award / deduct the clue value to a team, then close + mark used.
    const scoreRow = el("div", { class: "jp-score-row" }, [
      el("div", { class: "jp-score-row-label" }, "Award " + clue.value + " pts to:"),
      el("div", { class: "jp-award-grid" }, teams.map((t) =>
        el("div", { class: "jp-award-team" }, [
          el("button", {
            class: "jp-award-btn", style: { background: t.color, color: contrast(t.color) },
            onClick: () => { addToTeam(t.id, clue.value); sfx("correct"); finish(); },
          }, ["✓ ", U.teamIcon(t), " " + t.name]),
          el("button", {
            class: "jp-award-btn wrong", title: "Wrong — deduct",
            onClick: () => { addToTeam(t.id, -clue.value); sfx("error"); },
          }, "✗ −" + clue.value),
        ])
      )),
      el("button", { class: "btn subtle sm", onClick: () => finish() }, "No one / skip"),
    ]);
    scoreRow.style.display = "none";

    let modalRef = null;
    function finish() {
      Store.update((s) => { s.jeopardy.used[key(r, ci, qi)] = true; });
      if (modalRef) modalRef.close();
      if (onDone) onDone();
    }

    const body = el("div", { class: "jp-clue-modal" }, [
      el("div", { class: "jp-clue-cat" }, cat.name + (isBulba ? "" : " • " + clue.value)),
      isBulba ? el("div", { class: "jp-bulba-banner" }, "🌿 DAILY BULBA! Wager before you reveal 🌿") : null,
      el("div", { class: "jp-clue-text" }, clue.clue || "TBD"),
      answerBox,
      revealBtn,
      scoreRow,
      el("button", { class: "jp-edit-clue", onClick: () => { modalRef.close(); editClue(r, ci, qi, onDone); } }, "✎ Edit this clue"),
    ]);

    modalRef = Modal.open(isBulba ? "Daily Bulba" : "Clue", body, null, {});
  }

  // ---- Edit clue ------------------------------------------------------------
  function editClue(r, ci, qi, onDone) {
    const clue = rounds()[r].categories[ci].clues[qi];
    const clueIn = el("textarea", { class: "in", rows: "3" }, clue.clue || "");
    const ansIn = el("textarea", { class: "in", rows: "2" }, clue.answer || "");
    const bulbaIn = el("input", { type: "checkbox" });
    bulbaIn.checked = !!clue.dailyBulba;

    const body = el("div", { class: "modal-form" }, [
      el("label", { class: "field" }, ["Clue (the prompt)", clueIn]),
      el("label", { class: "field" }, ["Answer (phrase as a question)", ansIn]),
      el("label", { class: "jp-check" }, [bulbaIn, " Make this a Daily Bulba square"]),
    ]);

    Modal.open("Edit Clue — " + rounds()[r].categories[ci].name, body, () => {
      Store.update((s) => {
        const b = s.jeopardy.board;
        const cats = (b.rounds && b.rounds[r] ? b.rounds[r].categories : b.categories);
        const c = cats[ci].clues[qi];
        c.clue = clueIn.value.trim();
        c.answer = ansIn.value.trim();
        c.dailyBulba = bulbaIn.checked;
      });
      if (onDone) onDone();
    }, { saveLabel: "Save clue" });
  }

  // ---- Final Jeopardy -------------------------------------------------------
  function openFinal(onDone) {
    const f = J().board.final || {};
    sfx("dailyBulba");
    let modalRef = null;
    const answerBox = el("div", { class: "jp-answer" }, f.answer || "TBD");
    answerBox.style.display = "none";
    const revealBtn = el("button", { class: "btn primary jp-reveal" }, "Reveal answer");
    revealBtn.addEventListener("click", () => {
      answerBox.style.display = "block"; revealBtn.style.display = "none";
      sfx("fanfare");
    });
    const body = el("div", { class: "jp-clue-modal final" }, [
      el("div", { class: "jp-clue-cat" }, "FINAL JEOPARDY — " + (f.category || "")),
      el("div", { class: "jp-clue-text" }, f.clue || "TBD"),
      answerBox,
      revealBtn,
      el("button", { class: "jp-edit-clue", onClick: () => { modalRef.close(); editFinal(onDone); } }, "✎ Edit Final Jeopardy"),
      el("button", { class: "btn subtle sm", onClick: () => { Store.update((s) => { s.jeopardy.finalDone = true; }); modalRef.close(); if (onDone) onDone(); } }, "Mark Final complete"),
    ]);
    modalRef = Modal.open("Final Jeopardy", body, null, {});
  }

  function editFinal(onDone) {
    const f = J().board.final || {};
    const catIn = el("input", { class: "in", value: f.category || "" });
    const clueIn = el("textarea", { class: "in", rows: "3" }, f.clue || "");
    const ansIn = el("textarea", { class: "in", rows: "2" }, f.answer || "");
    const body = el("div", { class: "modal-form" }, [
      el("label", { class: "field" }, ["Category", catIn]),
      el("label", { class: "field" }, ["Clue", clueIn]),
      el("label", { class: "field" }, ["Answer", ansIn]),
    ]);
    Modal.open("Edit Final Jeopardy", body, () => {
      Store.update((s) => {
        s.jeopardy.board.final = { category: catIn.value.trim(), clue: clueIn.value.trim(), answer: ansIn.value.trim() };
      });
      if (onDone) onDone();
    }, { saveLabel: "Save" });
  }

  // ---- Board ----------------------------------------------------------------
  function view(root) {
    const rs = rounds();

    root.appendChild(el("div", { class: "page-head" }, [
      el("h1", {}, "❓ Jason Jeopardy"),
      el("p", { class: "page-sub" }, "Two full rounds — Single then Double Jeopardy — plus Final. Watch for the Daily Bulba!"),
    ]));

    // Scores
    root.appendChild(el("h2", { class: "section-title" }, "Scores"));
    const scoreHost = el("div", { class: "jp-scores" });
    root.appendChild(scoreHost);
    renderScores(scoreHost);

    if (!rs.length || !(rs[0].categories || []).length) {
      root.appendChild(el("p", { class: "empty" }, "No board yet — add a jeopardyBoard in seed.js."));
      return;
    }

    // Round tabs (Single / Double Jeopardy). Each round keeps its own board
    // state; used squares track (round-cat-clue).
    const tabs = el("div", { class: "jp-rounds" });
    root.appendChild(tabs);

    root.appendChild(el("h2", { class: "section-title" }, "The Board"));
    const boardEl = el("div", { class: "jp-board" });

    function paintTabs() {
      tabs.innerHTML = "";
      rs.forEach((rd, ri) => {
        const on = ri === curRound();
        // count remaining clues in this round
        const cs = rd.categories || [];
        let left = 0; cs.forEach((c, ci) => c.clues.forEach((_, qi) => { if (!J().used[key(ri, ci, qi)]) left++; }));
        tabs.appendChild(el("button", { class: "jp-round-tab" + (on ? " on" : ""),
          onClick: () => { if (ri !== curRound()) { Store.update((s) => { s.jeopardy.round = ri; }); rebuild(); paintTabs(); } } },
          [el("span", {}, (ri === 0 ? "① " : ri === 1 ? "② " : (ri + 1) + " ") + rd.name),
           el("span", { class: "jp-round-left" }, left + " left")]));
      });
    }

    function rebuild() {
      const r = curRound();
      const cats = rs[r].categories || [];
      boardEl.style.gridTemplateColumns = "repeat(" + cats.length + ", 1fr)";
      boardEl.innerHTML = "";
      cats.forEach((c) => boardEl.appendChild(el("div", { class: "jp-cat" }, c.name)));
      const nrows = Math.max.apply(null, cats.map((c) => c.clues.length));
      for (let qi = 0; qi < nrows; qi++) {
        cats.forEach((c, ci) => {
          const clue = c.clues[qi];
          if (!clue) { boardEl.appendChild(el("div", { class: "jp-cell empty-cell" })); return; }
          const used = !!J().used[key(r, ci, qi)];
          const cell = el("div", {
            class: "jp-cell" + (used ? " used" : ""),
            onClick: () => { if (!used) openClue(r, ci, qi, () => { rebuild(); paintTabs(); }); },
          }, used ? "" : el("span", { class: "jp-val" }, "$" + clue.value));
          boardEl.appendChild(cell);
        });
      }
    }
    paintTabs();
    rebuild();
    root.appendChild(boardEl);

    // Final Jeopardy + reset
    root.appendChild(el("div", { class: "toolbar" }, [
      el("button", { class: "btn primary", onClick: () => openFinal(rebuild) },
        J().finalDone ? "✔ Final Jeopardy (replay)" : "🌟 Play Final Jeopardy"),
      el("button", { class: "btn subtle", onClick: () => {
        if (confirm("Clear BOTH rounds (reopen all clues) and zero the scores?")) {
          Store.update((s) => { s.jeopardy.used = {}; s.jeopardy.scores = {}; s.jeopardy.finalDone = false; s.jeopardy.round = 0; });
          renderScores(scoreHost); paintTabs(); rebuild();
        }
      } }, "↺ Reset board & scores"),
    ]));

    root.appendChild(el("p", { class: "hint", style: { marginTop: "10px" } },
      "Tip: tap a square to read the clue, reveal the answer, and award points. Switch rounds with the tabs above; ✎ edits any clue live."));
  }

  window.Views = window.Views || {};
  window.Views.jeopardy = view;
})();
