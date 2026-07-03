/* drinks.js — the weekend Drink Tracker. Log every round by trainer, see
   per-type and per-day breakdowns, a leaderboard, and drink awards (First
   Sip, Thirstiest, and a champion for each kind). Feeds the chronicle + poster. */
(function () {
  const { el } = U;
  function sfx(n) { if (window.SFX && SFX[n]) SFX[n](); }
  function now() { try { return Date.now(); } catch (_) { return 0; } }
  function uid() { return "dk" + Math.random().toString(36).slice(2) + now().toString(36); }

  function view(root) {
    // Default to the signed-in trainer (live sync), else the first attendee.
    let active = (window.Sync && Sync.getMe && Sync.getMe()) ||
      (Store.state.attendees[0] && Store.state.attendees[0].id) || "";

    root.appendChild(el("div", { class: "page-head" }, [
      el("h1", {}, "🍺 Drink Tracker"),
      el("p", { class: "page-sub" }, "Log every round by trainer and day. First sip and each drink's champion earn a badge."),
    ]));

    const sel = el("select", { class: "in" }, Store.state.attendees.map((a) =>
      el("option", { value: a.id, selected: a.id === active ? "true" : null }, a.name)));
    sel.addEventListener("change", () => { active = sel.value; renderAll(); });
    root.appendChild(el("div", { class: "safari-trainer" }, [el("span", { class: "safari-trainer-lbl" }, "Logging for:"), sel]));

    const whichIn = el("input", { class: "in", placeholder: "Which one? (optional — e.g. Bud Light, Old Fashioned)" });
    const logRow = el("div", {}), statHost = el("div", {}), favesHost = el("div", {}), boardHost = el("div", {}), awardHost = el("div", {}), recentHost = el("div", {});
    [logRow, statHost, favesHost, boardHost, awardHost, recentHost].forEach((h) => root.appendChild(h));

    function logDrink(type) {
      if (!active) return;
      Store.logDrink(active, type, whichIn.value);
      whichIn.value = "";
      sfx("coin");
      renderAll();
    }

    function renderLog() {
      logRow.innerHTML = "";
      logRow.appendChild(el("h2", { class: "section-title" }, "Log a round"));
      logRow.appendChild(whichIn);           // optional name feeds the next tap
      logRow.appendChild(el("div", { class: "drink-btns" }, Store.drinkTypes().map((d) =>
        el("button", { class: "drink-btn", onClick: () => logDrink(d.type) }, [
          el("span", { class: "drink-e" }, d.emoji), el("span", {}, d.type),
        ]))));
    }

    function renderFaves() {
      favesHost.innerHTML = "";
      const list = Store.drinkLabels();
      if (!list.length) return;
      favesHost.appendChild(el("h2", { class: "section-title" }, "🍹 What we drank"));
      favesHost.appendChild(el("div", { class: "chip-row" }, list.map((x) =>
        el("span", { class: "drink-chip" }, Store.drinkEmoji(x.type) + " " + x.label + " ×" + x.n))));
    }

    function renderStats() {
      statHost.innerHTML = "";
      if (!active) return;
      const a = Store.attendee(active), total = Store.drinkCount(active);
      statHost.appendChild(el("h2", { class: "section-title" }, (a ? a.name : "") + " — " + total + " drink" + (total !== 1 ? "s" : "")));
      const types = Store.drinkTypes().filter((d) => Store.drinkCount(active, d.type) > 0);
      statHost.appendChild(el("div", { class: "chip-row" }, types.length
        ? types.map((d) => el("span", { class: "drink-chip" }, d.emoji + " " + d.type + " ×" + Store.drinkCount(active, d.type)))
        : [el("p", { class: "hint" }, "No drinks logged yet — tap one above.")]));
      // Per-day breakdown for this trainer.
      const mine = (Store.state.drinks || []).filter((x) => x.trainer === active);
      const byDay = {};
      mine.forEach((x) => { const k = Store.dayKey(x.ts); (byDay[k] = byDay[k] || { label: Store.dayLabel(x.ts), n: 0 }).n++; });
      const days = Object.keys(byDay).sort();
      if (days.length) {
        statHost.appendChild(el("div", { class: "drink-days" }, days.map((k) =>
          el("div", { class: "drink-day" }, [
            el("span", { class: "drink-day-l" }, byDay[k].label),
            el("span", { class: "drink-day-n" }, String(byDay[k].n)),
          ]))));
      }
    }

    function renderBoard() {
      boardHost.innerHTML = "";
      const rows = Store.state.attendees.map((a) => ({ a: a, n: Store.drinkCount(a.id) })).filter((r) => r.n > 0).sort((x, y) => y.n - x.n);
      boardHost.appendChild(el("h2", { class: "section-title" }, "🍻 Weekend Leaderboard"));
      if (!rows.length) { boardHost.appendChild(el("p", { class: "hint" }, "No drinks logged yet — be the first!")); return; }
      boardHost.appendChild(el("div", { class: "safari-board" }, rows.map((r, i) =>
        el("div", { class: "safari-board-row clickable" + (i === 0 ? " lead" : ""), title: "View profile", onClick: () => window.Profile && Profile.open(r.a.id) }, [
          el("span", { class: "safari-board-rank" }, i === 0 ? "🍺" : "#" + (i + 1)),
          el("span", { class: "safari-board-name" }, r.a.name),
          el("span", { class: "safari-board-n" }, String(r.n)),
        ]))));
    }

    function renderAwards() {
      awardHost.innerHTML = "";
      const aw = Store.drinkAwards();
      if (!aw.length) return;
      awardHost.appendChild(el("h2", { class: "section-title" }, "🏅 Drink Awards"));
      awardHost.appendChild(el("div", { class: "trophy-strip" }, aw.map((t) =>
        el("div", { class: "trophy" }, [
          el("span", { class: "trophy-emoji" }, t.emoji),
          el("div", { class: "trophy-txt" }, [
            el("div", { class: "trophy-title" }, t.title),
            el("div", { class: "trophy-holder" }, t.holder),
            el("div", { class: "trophy-sub" }, t.sub),
          ]),
        ]))));
    }

    function renderRecent() {
      recentHost.innerHTML = "";
      const recent = (Store.state.drinks || []).slice().sort((a, b) => b.ts - a.ts).slice(0, 10);
      if (!recent.length) return;
      recentHost.appendChild(el("h2", { class: "section-title" }, "Recent"));
      recentHost.appendChild(el("div", { class: "battle-log" }, recent.map((d) => {
        const a = Store.attendee(d.trainer);
        return el("div", { class: "battle-log-row drink-recent" }, [
          el("span", {}, Store.drinkEmoji(d.type) + " " + (a ? a.name : d.trainer) + " — " + d.type + (d.label ? " (" + d.label + ")" : "")),
          el("button", { class: "x", title: "Undo this one", onClick: () => { Store.update((s) => { s.drinks = (s.drinks || []).filter((x) => x.id !== d.id); }); renderAll(); } }, "×"),
        ]);
      })));
    }

    function renderAll() { renderLog(); renderStats(); renderFaves(); renderBoard(); renderAwards(); renderRecent(); }
    renderAll();
  }

  window.Views = window.Views || {};
  window.Views.drinks = view;
})();
