/* leaderboard.js — 🏆 THE SQUAD LEADERBOARD: everyone in the room, ranked by
   TRAINER SCORE (the achievement wall: bronze 1 · silver 2 · gold 3 ·
   platinum 5 — the same score the badges page builds). Each row lays the
   trainer's whole journey out in chips — generations opened, catches,
   badges, Champions, tower streak, nuzlocke crowns — so the race is
   visible at a glance. Tap a row for the full profile. */
(function () {
  const { el } = U;

  const CHAMPS = () => (window.LEAGUE_STAGES || [])
    .filter((s) => s.rank === "Champion" || s.rank === "Top Champion")
    .map((s) => s.key);

  function statsFor(a) {
    const id = a.id;
    const wins = Store.leagueWins(id);
    const champKeys = CHAMPS();
    return {
      a: a,
      score: Store.achievementScore(id),
      gen: Store.genCapFor ? Store.genCapFor(id) : 1,
      caught: Store.dexCount(id),
      shiny: Store.shinyCount ? Store.shinyCount(id) : 0,
      badges: Store.gymBadgeCount(id),
      champs: champKeys.filter((k) => wins.indexOf(k) >= 0).length,
      champTotal: champKeys.length,
      red: wins.indexOf("red") >= 0,
      tower: (Store.towerOf(id) || {}).best || 0,
      crowns: (Store.state.nuzlockeHof || []).filter((r) => r.att === id).length,
    };
  }

  function thumb(a) {
    if (a.photo) return el("img", { class: "lb-thumb", src: a.photo, alt: a.name });
    const src = Store.favSprite ? Store.favSprite(a) : "";
    return src ? el("img", { class: "lb-thumb", src: src, alt: a.favorite || "" })
               : el("span", { class: "lb-thumb lb-ball" });
  }

  function view(root) {
    root.appendChild(el("div", { class: "page-head" }, [
      el("h1", {}, "🏆 Squad Leaderboard"),
      el("p", { class: "page-sub" }, "The whole squad's journey, ranked by TRAINER SCORE — the achievement wall's points (bronze 1 · silver 2 · gold 3 · platinum 5). RANK IS EARNED HERE: #1 is the room's CHAMPION, seats 2-5 the ELITE FOUR, everyone else Gym Leaders (a zero score never wears a crown). Tap a trainer for their full card."),
    ]));

    const people = Store.state.attendees || [];
    if (!people.length) {
      root.appendChild(el("p", { class: "hint" }, "No trainers yet — build the squad on the 🎴 Squad page (or in the welcome tour)."));
      return;
    }

    const rows = people.map(statsFor).sort((x, y) =>
      (y.score - x.score) || (y.caught - x.caught) || (y.badges - x.badges) || x.a.name.localeCompare(y.a.name));
    const top = Math.max(1, rows[0].score);
    const me = (window.Sync && Sync.getMe && Sync.getMe()) || "";
    const MEDAL = ["🥇", "🥈", "🥉"];

    root.appendChild(el("div", { class: "lb-board" }, rows.map((r, i) => {
      const chips = [
        ["🧭", "Gen " + r.gen + "/9"],
        ["📕", r.caught + " caught" + (r.shiny ? " · ✨" + r.shiny : "")],
        ["🏅", r.badges + " badge" + (r.badges === 1 ? "" : "s")],
        ["👑", r.champs + "/" + r.champTotal + " Champions" + (r.red ? " · 🗻" : "")],
        ["🗼", "streak " + r.tower],
        ["🪦", r.crowns + " crown" + (r.crowns === 1 ? "" : "s")],
      ];
      return el("div", { class: "lb-row" + (r.a.id === me ? " me" : ""), onClick: () => window.Profile && Profile.open(r.a.id) }, [
        el("div", { class: "lb-rank" }, MEDAL[i] || "#" + (i + 1)),
        thumb(r.a),
        el("div", { class: "lb-main" }, [
          el("div", { class: "lb-name" }, r.a.name + " · " + (Store.rankOf ? Store.rankOf(r.a.id) : "") + (r.a.id === me ? " · you" : "")),
          el("div", { class: "lb-bar" }, [el("div", { class: "lb-fill", style: { width: Math.round(100 * r.score / top) + "%" } })]),
          el("div", { class: "lb-chips" }, chips.map(([e, t]) => el("span", { class: "lb-chip" }, e + " " + t))),
        ]),
        el("div", { class: "lb-score" }, [
          el("span", { class: "lb-score-n" }, String(r.score)),
          el("span", { class: "lb-score-l" }, "score"),
        ]),
      ]);
    })));

    root.appendChild(el("p", { class: "hint" },
      "🏅 Score climbs on the achievement wall (Party Central → Weekend Badges shows every tier). The hardest points: nuzlocke ultimates are worth a platinum each."));
  }

  window.Views = window.Views || {};
  window.Views.leaderboard = view;
})();
