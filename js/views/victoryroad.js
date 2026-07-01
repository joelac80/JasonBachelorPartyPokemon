/* victoryroad.js — Beer Olympics scoreboard + events. */
(function () {
  const { el, contrast } = U;
  const MEDALS = { 1: "🥇", 2: "🥈", 3: "🥉" };
  const FORMAT_LABEL = {
    bracket: "Head-to-head bracket", relay: "Team relay",
    count: "Best score / streak", mystery: "Mystery format",
  };

  function showRules(ev) {
    const body = el("div", { class: "rules-body" }, [
      el("div", { class: "rules-top" }, [
        el("span", { class: "rules-emoji" }, ev.emoji || "🎯"),
        el("div", {}, [
          el("div", { class: "rules-name" }, ev.name),
          el("div", { class: "rules-meta" },
            ev.points + " pts · " + (FORMAT_LABEL[ev.format] || "Custom")),
        ]),
      ]),
      el("p", { class: "rules-text" }, ev.rules || ev.desc || "Rules TBD."),
    ]);
    Modal.open(ev.name + " — Rules", body, null, {});
  }

  // Highlight + scroll to an event row (used when the spinner lands on it).
  function flashEventRow(evId) {
    const row = document.querySelector('.sb-event[data-ev="' + evId + '"]');
    if (!row) return;
    row.scrollIntoView({ behavior: "smooth", block: "center" });
    row.classList.remove("hot");
    void row.offsetWidth;
    row.classList.add("hot");
  }

  function scoreCell(ev, team) {
    const scores = Store.state.scores;
    const val = (scores[ev.id] && scores[ev.id][team.id]) || 0;

    const numEl = el("span", { class: "sc-val" }, String(val));

    function setScore(next) {
      Store.update((s) => {
        s.scores[ev.id] = s.scores[ev.id] || {};
        s.scores[ev.id][team.id] = Math.max(0, next);
      });
      numEl.textContent = String(Math.max(0, next));
      // Live-refresh the standings bar without a full re-render.
      renderStandings();
      flash(numEl);
    }

    const cur = () => (Store.state.scores[ev.id] && Store.state.scores[ev.id][team.id]) || 0;

    return el("div", { class: "sc-cell" }, [
      el("button", { class: "sc-btn minus", title: "Minus 5",
        onClick: () => setScore(cur() - 5) }, "−"),
      numEl,
      el("button", { class: "sc-btn plus", title: "Plus 5",
        onClick: () => setScore(cur() + 5) }, "+"),
      el("button", { class: "sc-award", title: "Award full " + ev.points + " pts",
        onClick: () => setScore(cur() + ev.points) }, "+" + ev.points),
    ]);
  }

  function flash(node) {
    node.classList.remove("flash");
    // force reflow so the animation restarts
    void node.offsetWidth;
    node.classList.add("flash");
  }

  let standingsHost = null;
  function renderStandings() {
    if (!standingsHost) return;
    const rows = Store.standings();
    const max = Math.max(1, ...rows.map((r) => r.total));
    standingsHost.innerHTML = "";
    rows.forEach((r) => {
      const pct = Math.round((r.total / max) * 100);
      const fg = contrast(r.team.color);
      standingsHost.appendChild(
        el("div", { class: "stand-row" }, [
          el("div", { class: "stand-rank" }, MEDALS[r.rank] || ("#" + r.rank)),
          el("div", { class: "stand-name", style: { color: r.team.color } },
            (r.team.emoji || "") + " " + r.team.name),
          el("div", { class: "stand-bar-wrap" }, [
            el("div", {
              class: "stand-bar",
              style: { width: Math.max(pct, 3) + "%", background: r.team.color, color: fg },
            }),
          ]),
          el("div", { class: "stand-total" }, String(r.total)),
        ])
      );
    });
  }

  function view(root) {
    standingsHost = null;
    const teams = Store.state.teams;
    const events = Store.state.events;

    root.appendChild(el("div", { class: "page-head" }, [
      el("h1", {}, "🏆 Victory Road"),
      el("p", { class: "page-sub" }, "The Beer Olympics. Award points and crown a champion."),
    ]));

    // "What's next?" — spin to pick the next event to play.
    if (events.length) {
      root.appendChild(el("h2", { class: "section-title" }, "What's Next?"));
      root.appendChild(Wheel.make({
        items: events.map((e) => ({ label: e.name, ev: e })),
        buttonLabel: "🎡 Spin the event",
        hint: "Spin to pick the next event",
        onPick: (item) => flashEventRow(item.ev.id),
      }));
    }

    // Live standings panel
    root.appendChild(el("h2", { class: "section-title" }, "Standings"));
    standingsHost = el("div", { class: "standings" });
    root.appendChild(standingsHost);
    renderStandings();

    if (!teams.length) {
      root.appendChild(el("p", { class: "empty" }, "No teams yet — add teams in Settings or the Draft page."));
      return;
    }

    // Scoreboard table (event rows × team columns)
    root.appendChild(el("h2", { class: "section-title" }, "Scoreboard"));

    const table = el("div", { class: "scoreboard", style: {
      gridTemplateColumns: "minmax(140px,1.4fr) repeat(" + teams.length + ", minmax(150px,1fr))",
    } });

    // header row
    table.appendChild(el("div", { class: "sb-corner" }, "Event"));
    teams.forEach((t) => {
      table.appendChild(el("div", {
        class: "sb-team", style: { background: t.color, color: contrast(t.color) },
      }, [
        el("span", { class: "sb-team-emoji" }, t.emoji || "🎽"),
        el("span", {}, t.name),
      ]));
    });

    // event rows
    events.forEach((ev) => {
      table.appendChild(el("div", {
        class: "sb-event", dataset: { ev: ev.id }, title: "Tap for rules",
        onClick: () => showRules(ev),
      }, [
        el("span", { class: "sb-ev-emoji" }, ev.emoji || "🎯"),
        el("div", { class: "sb-ev-text" }, [
          el("div", { class: "sb-ev-name" }, ev.name),
          el("div", { class: "sb-ev-pts" }, ev.points + " pts • " + (ev.desc || "")),
          el("div", { class: "sb-ev-rules" }, "ℹ︎ Rules"),
        ]),
      ]));
      teams.forEach((t) => table.appendChild(scoreCell(ev, t)));
    });

    root.appendChild(table);

    // Reset scores control
    root.appendChild(el("div", { class: "toolbar" }, [
      el("button", { class: "btn danger", onClick: () => {
        if (confirm("Reset ALL Victory Road scores to zero?")) {
          Store.update((s) => { s.scores = {}; });
          Router.render();
        }
      } }, "Reset all scores"),
    ]));
  }

  window.Views = window.Views || {};
  window.Views.victoryroad = view;
})();
