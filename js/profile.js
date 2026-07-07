/* profile.js — a Trainer Profile modal that gathers everything about one
   person into a single card: their evolving favorite, team + standing,
   Safari dex, battle record, assists, live trophies and gym badges.
   Global `Profile.open(attendeeId)`. Linked from the Squad cards and the
   Safari leaderboards so the person is the through-line across features. */
(function () {
  const { el, contrast, teamIcon } = U;

  function stat(v, l) {
    return el("div", { class: "pf-stat" }, [
      el("div", { class: "pf-stat-v" }, String(v)),
      el("div", { class: "pf-stat-l" }, l),
    ]);
  }

  function open(attId) {
    const a = Store.attendee(attId);
    if (!a) return;
    const form = Store.currentForm(a);
    const tr = (Store.state.pokedex && Store.state.pokedex.trainers && Store.state.pokedex.trainers[attId]) || {};
    const dexN = Store.dexCount(attId);
    const masterN = tr.masterCatches || 0, helpsN = tr.helps || 0;

    const log = (Store.state.battles && Store.state.battles.log) || [];
    let wins = 0, losses = 0;
    log.forEach((b) => { if (b.winner === a.name) wins++; if (b.loser === a.name) losses++; });

    const team = Store.team(Store.teamOf(attId));
    const rankRow = team ? Store.standings().find((r) => r.team.id === team.id) : null;
    const sprite = form.id ? Store.sprite(form.id) : "";
    const trophies = Store.liveTrophies().filter((t) => t.holder === a.name);
    const gyms = (Store.state.gymBadges || []).filter((g) => g.holder === attId);

    const head = el("div", { class: "pf-head" }, [
      sprite
        ? el("img", { class: "pf-sprite", src: sprite, alt: form.name, style: { transform: "scale(" + (form.scale || 1) + ")" } })
        : el("span", { class: "draft-thumb-ball" }),
      el("div", { class: "pf-id" }, [
        el("div", { class: "pf-role" }, ((a.rank || "") + (a.role ? " · " + a.role : "")).trim()),
        team
          ? el("span", { class: "pf-team", style: { background: team.color, color: contrast(team.color) } },
              [teamIcon(team), " " + team.name + (rankRow ? " · #" + rankRow.rank : "")])
          : el("span", { class: "pf-team none" }, "Free Agent"),
        el("div", { class: "pf-fav" }, "♥ " + form.name + (form.total > 1 ? " · stage " + (form.stage + 1) + "/" + form.total : "")),
      ]),
    ]);

    const seenN = Object.keys(Object.assign({}, tr.seen || {}, tr.caught || {})).length;
    const duel = Store.duelRecord(attId);
    const beltNow = Store.state.battles && Store.state.battles.belt && Store.state.battles.belt.attId === attId;
    const stats = el("div", { class: "pf-stats" }, [
      stat(dexN + " / 251", "Safari dex"),
      stat(seenN, "👀 Seen"),
      stat(duel.w + "–" + duel.l, "🎮 Duels"),
      stat(Store.eloOf(attId), "📈 Rating"),
      stat(Store.koLife(attId), "💥 KOs"),
      stat(Store.shinyCount(attId), "✨ Shinies"),
      stat(Store.tradeCount(attId), "🔁 Trades"),
      stat(Store.evoCount(attId), "🎉 Evolutions"),
      stat(beltNow ? "👊 now" : Store.beltReigns(attId), "🥇 Belt reigns"),
      stat(Store.gymBadgeCount(attId) + " / 16", "🏟 Gym badges"),
      stat(wins + "–" + losses, "Battle W–L"),
      stat(helpsN, "Assists"),
      stat(masterN, "Master catches"),
      stat(Store.logCount(attId), "📋 Logged"),
    ]);

    const troRow = trophies.length
      ? el("div", { class: "pf-section" }, [
          el("span", { class: "pf-lbl" }, "Trophies"),
          el("div", { class: "pf-trophies" }, trophies.map((t) => el("span", { class: "pf-trophy" }, t.emoji + " " + t.title))),
        ])
      : null;

    const gymRow = gyms.length
      ? el("div", { class: "pf-section" }, [
          el("span", { class: "pf-lbl" }, "Gym badges"),
          el("div", { class: "pf-gyms" }, gyms.map((g) => {
            const icon = g.icon || (window.BADGE_ICONS && BADGE_ICONS[g.id]) || "";
            return icon
              ? el("img", { class: "pf-gym", src: icon, title: g.name, alt: g.name })
              : el("span", { class: "pf-gym-e", title: g.name }, g.emoji || "🏅");
          })),
        ])
      : null;

    const links = el("div", { class: "pf-links" }, [
      el("a", { class: "btn subtle sm", href: "#/roster", onClick: () => ctrl.close() }, "🎴 Squad"),
      el("a", { class: "btn subtle sm", href: "#/safari",
        onClick: () => { Store.update((s) => { s.pokedex.active = attId; }); ctrl.close(); } }, "🔴 Catch as " + a.name.split(" ")[0]),
    ]);

    const body = el("div", { class: "pf-body" }, [head, stats, troRow, gymRow, links]);
    const ctrl = Modal.open(a.name, body, null, {});
  }

  window.Profile = { open: open };
})();
