/* cards.js — the Card Table. Log rounds of Asshole/President (finishing order
   → auto Best/Worst President), Euchre (winners), King's Cup and Ride the Bus
   (spotlight + note). Feeds team points, the chronicle/poster, and the awards. */
(function () {
  const { el } = U;
  function sfx(n) { if (window.SFX && SFX[n]) SFX[n](); }
  function nameOf(id) { const a = Store.attendee(id); return a ? a.name : id; }

  const GAMES = [
    { key: "president", name: "Asshole / President", emoji: "🃏", mode: "order" },
    { key: "euchre", name: "Euchre", emoji: "♠️", mode: "winners" },
    { key: "kings", name: "King's Cup", emoji: "🫗", mode: "spotlight" },
    { key: "ridebus", name: "Ride the Bus", emoji: "🚌", mode: "spotlight" },
  ];
  function gameOf(k) { return GAMES.find((g) => g.key === k) || GAMES[0]; }

  function view(root) {
    let game = "president";
    let picks = [];                 // ordered ids (order/winners) or single (spotlight)
    let tableSet = Store.lastCardTable(game);   // remembered players at the table
    let showAll = false;
    let byName = (window.Sync && Sync.getMe && Sync.getMe() && Store.attendee(Sync.getMe())) ? Store.attendee(Sync.getMe()).name : "";

    root.appendChild(el("div", { class: "page-head" }, [
      el("h1", {}, "🃏 Card Table"),
      el("p", { class: "page-sub" }, "Track President, Euchre, King's Cup and Ride the Bus. Best & Worst President earn a badge." ),
    ]));

    const tabHost = el("div", {}), formHost = el("div", {}), recentHost = el("div", {}), boardHost = el("div", {});
    [tabHost, formHost, recentHost, boardHost].forEach((h) => root.appendChild(h));

    function renderTabs() {
      tabHost.innerHTML = "";
      tabHost.appendChild(el("div", { class: "card-tabs" }, GAMES.map((g) =>
        el("button", { class: "card-tab" + (g.key === game ? " on" : ""), onClick: () => { game = g.key; picks = []; tableSet = Store.lastCardTable(g.key); showAll = false; renderAll(); } }, g.emoji + " " + g.name))));
    }

    function chip(a, label) {
      const chosen = picks.indexOf(a.id);
      return el("button", { class: "card-pick" + (chosen >= 0 ? " on" : ""),
        onClick: () => { toggle(a.id); } }, [
        chosen >= 0 && label ? el("span", { class: "card-pick-rank" }, label(chosen)) : null,
        el("span", {}, a.name),
      ]);
    }

    function toggle(id) {
      const g = gameOf(game);
      const i = picks.indexOf(id);
      if (i >= 0) { picks.splice(i, 1); }
      else if (g.mode === "spotlight") { picks = [id]; }
      else if (g.mode === "winners") { if (picks.length < 2) picks.push(id); }
      else { picks.push(id); }        // order: append to finishing order
      renderForm();
    }

    function renderForm() {
      formHost.innerHTML = "";
      const g = gameOf(game);
      const noteIn = el("input", { class: "in", placeholder: g.mode === "spotlight"
        ? (g.key === "ridebus" ? "Note (optional — e.g. blew it on the 4th card)" : "Note (optional — e.g. drew the last King)")
        : "Note (optional)" });

      let prompt, label = null;
      if (g.mode === "order") { prompt = "Tap players in finishing order — 1st is President, last is the Asshole."; label = (i) => (i === 0 ? "👑" : String(i + 1)); }
      else if (g.mode === "winners") { prompt = "Tap the winning pair (up to 2)."; }
      else { prompt = "Who's in the spotlight?"; }

      // "Same table" — show just the remembered players (fast re-ordering each
      // hand), with a way to add someone or reset to everyone.
      const tableIds = tableSet.filter((id) => Store.attendee(id));
      const useTable = tableIds.length && !showAll;
      const players = useTable ? tableIds.map((id) => Store.attendee(id)) : Store.state.attendees;
      const tableCtl = el("div", { class: "card-table-ctl" }, tableIds.length
        ? [
            el("span", { class: "hint" }, "🔁 Same table — " + tableIds.length + " players"),
            el("button", { class: "btn subtle sm", onClick: () => { showAll = !showAll; renderForm(); } }, showAll ? "Show table only" : "＋ Add someone"),
            el("button", { class: "btn subtle sm", onClick: () => { tableSet = []; showAll = false; renderForm(); } }, "Reset table"),
          ]
        : (Store.lastCardTable(game).length
            ? [el("button", { class: "btn subtle sm", onClick: () => { tableSet = Store.lastCardTable(game); showAll = false; renderForm(); } }, "🔁 Same table as last round")]
            : [el("span", { class: "hint" }, "Tap players to start — they'll be remembered as the table.")]));

      const grid = el("div", { class: "card-picks" }, players.map((a) => chip(a, label)));

      // finishing-order preview for President
      let preview = null;
      if (g.mode === "order" && picks.length) {
        preview = el("div", { class: "card-order" }, picks.map((id, i) =>
          el("div", { class: "card-order-row" }, [
            el("span", { class: "card-order-pos" }, i === 0 ? "👑 President" : (i === picks.length - 1 && picks.length >= 2 ? "💩 Asshole" : "#" + (i + 1))),
            el("span", {}, nameOf(id)),
          ])));
      }

      const canLog = picks.length >= (g.mode === "order" ? 2 : 1);
      const logBtn = el("button", { class: "btn primary", disabled: canLog ? null : "true", onClick: () => {
        if (!Store.logCardRound(game, picks, noteIn.value, byName)) { U.toast("Pick the players for this round first."); return; }
        tableSet = picks.slice();   // remember who's at the table for the next hand
        picks = []; showAll = false; sfx("win"); renderAll();
      } }, "Log " + g.name + " round");
      const clearBtn = el("button", { class: "btn subtle", onClick: () => { picks = []; renderForm(); } }, "Clear");

      formHost.appendChild(el("div", { class: "card-form" }, [
        el("p", { class: "hint" }, prompt),
        tableCtl,
        grid,
        preview,
        noteIn,
        el("div", { class: "toolbar" }, [logBtn, clearBtn]),
      ]));
    }

    function renderRecent() {
      recentHost.innerHTML = "";
      const rounds = (Store.state.cardGames || []).slice(0, 12);
      if (!rounds.length) return;
      recentHost.appendChild(el("h2", { class: "section-title" }, "Recent rounds"));
      recentHost.appendChild(el("div", { class: "battle-log" }, rounds.map((r) => {
        const g = gameOf(r.game);
        let txt;
        if (r.game === "president" && r.ranking.length >= 2) txt = "👑 " + nameOf(r.ranking[0]) + " · 💩 " + nameOf(r.ranking[r.ranking.length - 1]);
        else if (r.game === "euchre") txt = r.ranking.map(nameOf).join(" & ");
        else txt = (r.ranking[0] ? nameOf(r.ranking[0]) : "") + (r.note ? " — " + r.note : "");
        return el("div", { class: "battle-log-row" }, g.emoji + " " + txt);
      })));
    }

    function board(title, emoji, fn) {
      const rows = Store.state.attendees.map((a) => ({ a: a, n: fn(a.id) })).filter((r) => r.n > 0).sort((x, y) => y.n - x.n);
      if (!rows.length) return null;
      return el("div", {}, [
        el("h2", { class: "section-title" }, emoji + " " + title),
        el("div", { class: "safari-board" }, rows.map((r, i) =>
          el("div", { class: "safari-board-row clickable" + (i === 0 ? " lead" : ""), onClick: () => window.Profile && Profile.open(r.a.id) }, [
            el("span", { class: "safari-board-rank" }, i === 0 ? emoji : "#" + (i + 1)),
            el("span", { class: "safari-board-name" }, r.a.name),
            el("span", { class: "safari-board-n" }, String(r.n)),
          ]))),
      ]);
    }

    function renderBoard() {
      boardHost.innerHTML = "";
      [board("Best President", "👑", (id) => Store.presidencies(id)),
       board("Worst President (the Asshole)", "💩", (id) => Store.assholeries(id)),
       board("Euchre Champs", "♠️", (id) => Store.euchreWins(id))].forEach((b) => { if (b) boardHost.appendChild(b); });
    }

    function renderAll() { renderTabs(); renderForm(); renderRecent(); renderBoard(); }
    renderAll();
  }

  window.Views = window.Views || {};
  window.Views.cards = view;
})();
