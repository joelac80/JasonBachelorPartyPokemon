/* predictions.js — the Oracle board. Anyone posts a call ("Who wins beer
   pong?"), everyone picks, a host settles it, and correct callers score
   points + climb the Oracle leaderboard. Feeds the chronicle + poster. */
(function () {
  const { el } = U;
  function sfx(n) { if (window.SFX && SFX[n]) SFX[n](); }
  function nameOf(id) { const a = Store.attendee(id); return a ? a.name : id; }

  function view(root) {
    let me = (window.Sync && Sync.getMe && Sync.getMe()) ||
      (Store.state.attendees[0] && Store.state.attendees[0].id) || "";

    root.appendChild(el("div", { class: "page-head" }, [
      el("h1", {}, "🔮 The Oracle"),
      el("p", { class: "page-sub" }, "Call it before it happens. Nail your calls to climb the Oracle board — no athletic ability required." ),
    ]));

    const sel = el("select", { class: "in" }, Store.state.attendees.map((a) =>
      el("option", { value: a.id, selected: a.id === me ? "true" : null }, a.name)));
    sel.addEventListener("change", () => { me = sel.value; renderAll(); });
    root.appendChild(el("div", { class: "safari-trainer" }, [el("span", { class: "safari-trainer-lbl" }, "Voting as:"), sel]));

    const makeHost = el("div", {}), listHost = el("div", {}), boardHost = el("div", {});
    [makeHost, listHost, boardHost].forEach((h) => root.appendChild(h));

    // ---- make a prediction ----
    function renderMake() {
      makeHost.innerHTML = "";
      const q = el("input", { class: "in", placeholder: "What's the call? (e.g. Who wins beer pong?)" });
      const opts = [el("input", { class: "in", placeholder: "Option 1" }), el("input", { class: "in", placeholder: "Option 2" })];
      const optWrap = el("div", { class: "pred-opts" }, opts.map((o) => o));
      const addOpt = el("button", { class: "btn subtle sm", onClick: () => {
        if (opts.length >= 6) return;
        const o = el("input", { class: "in", placeholder: "Option " + (opts.length + 1) });
        opts.push(o); optWrap.appendChild(o);
      } }, "+ option");
      const post = el("button", { class: "btn primary", onClick: () => {
        const ok = Store.addPrediction(q.value, opts.map((o) => o.value), nameOf(me));
        if (!ok) { alert("Add a question and at least two options."); return; }
        sfx("blip"); renderAll();
      } }, "🔮 Post prediction");
      makeHost.appendChild(el("h2", { class: "section-title" }, "Make a prediction"));
      makeHost.appendChild(el("div", { class: "pred-make" }, [q, optWrap, el("div", { class: "toolbar" }, [addOpt, post])]));
    }

    // ---- the board of calls ----
    function renderList() {
      listHost.innerHTML = "";
      const preds = (Store.state.predictions || []).slice().sort((a, b) => (a.closed - b.closed) || (b.ts - a.ts));
      listHost.appendChild(el("h2", { class: "section-title" }, "The Calls"));
      if (!preds.length) { listHost.appendChild(el("p", { class: "hint" }, "No predictions yet — post the first call above.")); return; }
      listHost.appendChild(el("div", { class: "pred-list" }, preds.map(predCard)));
    }

    function predCard(p) {
      const counts = {}; p.options.forEach((o) => { counts[o.id] = 0; });
      Object.keys(p.votes || {}).forEach((a) => { if (counts[p.votes[a]] !== undefined) counts[p.votes[a]]++; });
      const myVote = p.votes && p.votes[me];

      const optionEls = p.options.map((o) => {
        const isWinner = p.closed && p.answer === o.id;
        const mine = myVote === o.id;
        const cls = "pred-opt" + (mine ? " mine" : "") + (isWinner ? " winner" : "") + (p.closed && !isWinner ? " dim" : "");
        const kids = [el("span", { class: "pred-opt-t" }, (isWinner ? "✓ " : "") + o.text), el("span", { class: "pred-opt-n" }, String(counts[o.id]))];
        if (p.closed) return el("div", { class: cls }, kids);
        return el("button", { class: cls, onClick: () => { Store.votePrediction(p.id, me, o.id); sfx("select"); renderAll(); } }, kids);
      });

      const parts = [
        el("div", { class: "pred-q" }, p.q),
        p.by ? el("div", { class: "pred-by" }, "posted by " + p.by) : null,
        el("div", { class: "pred-opts" }, optionEls),
      ];

      if (p.closed) {
        const winners = Object.keys(p.votes || {}).filter((a) => p.votes[a] === p.answer).map(nameOf);
        parts.push(el("div", { class: "pred-result" }, winners.length ? "🔮 Nailed it: " + winners.join(", ") : "Nobody called it."));
      } else {
        // settle control (host action) — pick the correct option
        const settle = el("div", { class: "pred-settle" }, [el("span", { class: "pred-settle-l" }, "Settle it:")].concat(
          p.options.map((o) => el("button", { class: "btn subtle sm", onClick: () => {
            if (confirm("Mark “" + o.text + "” as the winner? This scores everyone who called it.")) { Store.resolvePrediction(p.id, o.id); sfx("correct"); renderAll(); }
          } }, "✓ " + o.text))));
        parts.push(settle);
      }
      return el("div", { class: "pred-card" + (p.closed ? " closed" : "") }, parts);
    }

    // ---- oracle leaderboard ----
    function renderBoard() {
      boardHost.innerHTML = "";
      const rows = Store.state.attendees.map((a) => ({ a: a, n: Store.oracleScore(a.id) })).filter((r) => r.n > 0).sort((x, y) => y.n - x.n);
      boardHost.appendChild(el("h2", { class: "section-title" }, "🔮 Oracle Leaderboard"));
      if (!rows.length) { boardHost.appendChild(el("p", { class: "hint" }, "No settled calls yet.")); return; }
      boardHost.appendChild(el("div", { class: "safari-board" }, rows.map((r, i) =>
        el("div", { class: "safari-board-row clickable" + (i === 0 ? " lead" : ""), onClick: () => window.Profile && Profile.open(r.a.id) }, [
          el("span", { class: "safari-board-rank" }, i === 0 ? "🔮" : "#" + (i + 1)),
          el("span", { class: "safari-board-name" }, r.a.name),
          el("span", { class: "safari-board-n" }, r.n + " correct"),
        ]))));
      boardHost.appendChild(el("p", { class: "hint" }, "🔮 = Oracle — most correct calls. Right calls also score 2 pts for your team." ));
    }

    function renderAll() { renderMake(); renderList(); renderBoard(); }
    renderAll();
  }

  window.Views = window.Views || {};
  window.Views.predictions = view;
})();
