/* stats.js — the Trip Stats / "Wrapped" hub. An activity chart, auto-derived
   fun superlatives, per-person Wrapped recap cards, a daily digest, battle
   rivalries, and a one-tap export of the whole log. All from the weekend data. */
(function () {
  const { el, contrast, teamIcon } = U;
  function nm(id) { const a = Store.attendee(id); return a ? a.name : id; }

  function chart() {
    const hours = Store.activityByHour();
    const max = Math.max(1, Math.max.apply(null, hours));
    const W = 24 * 12, H = 84;
    let s = '<svg viewBox="0 0 ' + W + ' ' + (H + 16) + '" class="stat-chart" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Activity by hour">';
    hours.forEach((v, h) => {
      const bh = Math.max(v ? 2 : 0, Math.round(v / max * H));
      s += '<rect x="' + (h * 12 + 2) + '" y="' + (H - bh) + '" width="8" height="' + bh + '" rx="1.5" fill="' + (v ? "#e6352f" : "#dcdcdc") + '"><title>' + v + ' at ' + h + ':00</title></rect>';
    });
    [0, 6, 12, 18, 23].forEach((h) => { s += '<text x="' + (h * 12 + 6) + '" y="' + (H + 12) + '" font-size="7" text-anchor="middle" fill="#888">' + h + '</text>'; });
    s += "</svg>";
    const wrap = el("div", { class: "stat-chart-wrap" });
    wrap.innerHTML = s;
    return wrap;
  }

  function trophyStrip(list) {
    return el("div", { class: "trophy-strip" }, list.map((t) =>
      el("div", { class: "trophy" }, [
        el("span", { class: "trophy-emoji" }, t.emoji),
        el("div", { class: "trophy-txt" }, [
          el("div", { class: "trophy-title" }, t.title),
          el("div", { class: "trophy-holder" }, t.holder),
          el("div", { class: "trophy-sub" }, t.sub),
        ]),
      ])));
  }

  function wrappedCard(attId) {
    const w = Store.wrapped(attId);
    const line = (v, l) => el("div", { class: "wrap-stat" }, [el("div", { class: "wrap-v" }, String(v)), el("div", { class: "wrap-l" }, l)]);
    const rows = [
      line(w.caught, "🔴 caught"), line(w.seen, "👀 seen"), line(w.duel.w + "–" + w.duel.l, "🎮 duels"),
      line(w.elo, "📈 rating"), line(w.kos, "💥 KOs"), line(w.shinies, "✨ shinies"),
      line(w.trades, "🔁 trades"), line(w.evolutions, "🎉 evolutions"), line(w.beltNow ? "👊" : w.beltReigns, "🥇 belt reigns"),
      line(w.drinks, "🍺 drinks"), line(w.presidencies, "👑 presidencies"),
      line(w.assholeries, "💩 assholeries"), line(w.oracle, "🔮 correct calls"),
      line(w.helps, "🤝 assists"), line(w.logged, "📋 logged"),
    ];
    return el("div", { class: "wrap-card" }, [
      el("div", { class: "wrap-head" }, [
        el("div", { class: "wrap-name" }, w.name),
        w.team ? el("span", { class: "pf-team", style: { background: w.team.color, color: contrast(w.team.color) } }, [teamIcon(w.team), " " + w.team.name]) : null,
      ]),
      el("div", { class: "wrap-grid" }, rows),
      w.topDrink ? el("div", { class: "wrap-note" }, "🥂 Signature drink: " + w.topDrink) : null,
      (w.master || w.euchre || w.photosIn) ? el("div", { class: "wrap-note" }, [
        w.master ? "🟣 " + w.master + " master catch" + (w.master > 1 ? "es" : "") + "  " : "",
        w.euchre ? "♠️ " + w.euchre + " euchre  " : "",
        w.photosIn ? "🌟 in " + w.photosIn + " photos" : "",
      ].join("")) : null,
    ]);
  }

  // ---- structured exports (pivot-table friendly) ----
  function timeStr(ts) { try { return new Date(ts).toLocaleTimeString(); } catch (_) { return ""; } }
  function csvRow(arr) { return arr.map((v) => { v = String(v == null ? "" : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(","); }
  function dl(name, rows) {
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const a = el("a", { href: URL.createObjectURL(blob), download: name });
    document.body.appendChild(a); a.click(); a.remove();
  }
  function teamName(id) { const t = Store.team(Store.teamOf(id)); return t ? t.name : ""; }

  function exportLog() {
    const rows = [csvRow(["day", "time", "text", "logged_by", "ts"])];
    (Store.state.chronicle || []).slice().reverse().forEach((c) => rows.push(csvRow([Store.dayLabel(c.ts), timeStr(c.ts), c.text || "", c.by ? nm(c.by) : "", c.ts])));
    dl("weekend-log.csv", rows);
  }
  function exportDrinks() {
    const rows = [csvRow(["trainer", "team", "type", "specific_drink", "day", "time", "ts"])];
    (Store.state.drinks || []).slice().sort((a, b) => a.ts - b.ts).forEach((d) => rows.push(csvRow([nm(d.trainer), teamName(d.trainer), d.type, d.label || "", Store.dayLabel(d.ts), timeStr(d.ts), d.ts])));
    dl("drinks.csv", rows);
  }
  function exportCatches() {
    const rows = [csvRow(["trainer", "team", "pokemon", "dex_no", "ball", "master_ball", "helper", "day", "time", "ts"])];
    ((Store.state.pokedex && Store.state.pokedex.log) || []).slice().reverse().forEach((c) => rows.push(csvRow([nm(c.trainer), teamName(c.trainer), c.name, c.dexId, c.ball || "", c.master ? "yes" : "", c.helper ? nm(c.helper) : "", Store.dayLabel(c.ts), timeStr(c.ts), c.ts])));
    dl("catches.csv", rows);
  }
  function exportBattles() {
    const rows = [csvRow(["winner", "loser", "event", "day", "time", "ts"])];
    ((Store.state.battles && Store.state.battles.log) || []).slice().reverse().forEach((b) => rows.push(csvRow([b.winner, b.loser, b.title || "", Store.dayLabel(b.ts), timeStr(b.ts), b.ts])));
    dl("battles.csv", rows);
  }
  function exportCards() {
    const rows = [csvRow(["game", "result", "note", "day", "time", "ts"])];
    (Store.state.cardGames || []).slice().reverse().forEach((r) => {
      let res;
      if (r.game === "president" && r.ranking.length >= 2) res = "President: " + nm(r.ranking[0]) + " / Asshole: " + nm(r.ranking[r.ranking.length - 1]);
      else if (r.game === "euchre") res = "Winners: " + r.ranking.map(nm).join(" & ");
      else res = r.ranking.map(nm).join(", ");
      rows.push(csvRow([r.game, res, r.note || "", Store.dayLabel(r.ts), timeStr(r.ts), r.ts]));
    });
    dl("card-games.csv", rows);
  }

  function view(root) {
    let me = (window.Sync && Sync.getMe && Sync.getMe()) || (Store.state.attendees[0] && Store.state.attendees[0].id) || "";

    root.appendChild(el("div", { class: "page-head" }, [
      el("h1", {}, "📊 Trip Stats"),
      el("p", { class: "page-sub" }, "The weekend by the numbers — activity, superlatives, and everyone's Wrapped." ),
    ]));

    // activity chart
    root.appendChild(el("h2", { class: "section-title" }, "⏰ When it went down"));
    root.appendChild(chart());
    root.appendChild(el("p", { class: "hint" }, "Moments logged by hour of day (midnight → 11pm)."));

    // auto superlatives
    const fun = Store.funSuperlatives();
    if (fun.length) {
      root.appendChild(el("h2", { class: "section-title" }, "🏅 Superlatives (auto)"));
      root.appendChild(trophyStrip(fun));
    }

    // player wrapped
    root.appendChild(el("h2", { class: "section-title" }, "🎁 Player Wrapped"));
    const sel = el("select", { class: "in" }, Store.state.attendees.map((a) => el("option", { value: a.id, selected: a.id === me ? "true" : null }, a.name)));
    const wrapHost = el("div", {});
    function paintWrap() { wrapHost.innerHTML = ""; wrapHost.appendChild(wrappedCard(sel.value)); }
    sel.addEventListener("change", paintWrap);
    root.appendChild(el("div", { class: "safari-trainer" }, [el("span", { class: "safari-trainer-lbl" }, "Whose recap:"), sel]));
    root.appendChild(wrapHost);
    paintWrap();

    // daily digest
    const days = Store.activityByDay();
    if (days.length) {
      root.appendChild(el("h2", { class: "section-title" }, "🗓️ Daily Digest"));
      root.appendChild(el("div", { class: "digest" }, days.map((d) => {
        const drinks = (Store.state.drinks || []).filter((x) => Store.dayKey(x.ts) === d.key).length;
        const catches = ((Store.state.pokedex && Store.state.pokedex.log) || []).filter((x) => Store.dayKey(x.ts) === d.key).length;
        const photos = (Store.state.photos || []).filter((x) => Store.dayKey(x.ts) === d.key).length;
        const battles = ((Store.state.battles && Store.state.battles.log) || []).filter((x) => Store.dayKey(x.ts) === d.key).length;
        return el("div", { class: "digest-card" }, [
          el("div", { class: "digest-day" }, d.label),
          el("div", { class: "digest-line" }, "🍺 " + drinks + "   🔴 " + catches + "   ⚔️ " + battles + "   📸 " + photos),
          el("div", { class: "digest-total" }, d.n + " moments"),
        ]);
      })));
    }

    // rivalries
    const rivs = Store.rivalries().filter((r) => r.n >= 1).slice(0, 6);
    if (rivs.length) {
      root.appendChild(el("h2", { class: "section-title" }, "😈 Head-to-Head" ));
      root.appendChild(el("div", { class: "safari-board" }, rivs.map((r) =>
        el("div", { class: "safari-board-row" }, [
          el("span", { class: "safari-board-rank" }, "⚔"),
          el("span", { class: "safari-board-name" }, r.winner + " over " + r.loser),
          el("span", { class: "safari-board-n" }, "×" + r.n),
        ]))));
    }

    // export — structured, pivot-table-ready CSVs
    root.appendChild(el("h2", { class: "section-title" }, "⬇ Export the data"));
    root.appendChild(el("p", { class: "hint" }, "Structured CSVs — drop them straight into a spreadsheet." ));
    root.appendChild(el("div", { class: "toolbar", style: { flexWrap: "wrap" } }, [
      el("button", { class: "btn subtle sm", onClick: exportLog }, "📜 Full log"),
      el("button", { class: "btn subtle sm", onClick: exportDrinks }, "🍺 Drinks"),
      el("button", { class: "btn subtle sm", onClick: exportCatches }, "🔴 Catches"),
      el("button", { class: "btn subtle sm", onClick: exportBattles }, "⚔️ Battles"),
      el("button", { class: "btn subtle sm", onClick: exportCards }, "🃏 Card games"),
    ]));
  }

  window.Views = window.Views || {};
  window.Views.stats = view;
})();
