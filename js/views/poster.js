/* poster.js — the final Weekend Poster Board: every trainer with their
   Pokémon, team, badges and stats; the awards wall; and the full weekend
   timeline. Built for screenshotting or printing to PDF as a keepsake. */
(function () {
  const { el, contrast, teamIcon } = U;

  // Game trophies (minus the compact drink ones) + the full drink awards, so
  // First Sip / Thirstiest aren't listed twice.
  function allAwards() {
    const game = Store.liveTrophies().filter((t) => t.title !== "First Sip" && t.title !== "Thirstiest");
    return game.concat(Store.drinkAwards());
  }

  function trophyEl(emoji, title, holder, sub) {
    return el("div", { class: "trophy" }, [
      el("span", { class: "trophy-emoji" }, emoji),
      el("div", { class: "trophy-txt" }, [
        el("div", { class: "trophy-title" }, title),
        el("div", { class: "trophy-holder" }, holder),
        el("div", { class: "trophy-sub" }, sub),
      ]),
    ]);
  }

  // Superlative winners (attendee with the most votes per category).
  function superlativeWinners() {
    const cats = Store.state.superlatives || [];
    const votes = Store.state.superlativeVotes || {};
    const out = [];
    cats.forEach((c) => {
      const v = votes[c.id]; if (!v) return;
      let best = null;
      Object.keys(v).forEach((aid) => { if (!best || v[aid] > best.n) best = { aid: aid, n: v[aid] }; });
      if (best && best.n > 0) { const a = Store.attendee(best.aid); out.push({ title: c.title || c.name || "Award", emoji: c.emoji || "🏆", holder: a ? a.name : best.aid }); }
    });
    return out;
  }

  function trainerCard(a) {
    const form = Store.currentForm(a);
    const src = form.id ? Store.sprite(form.id) : "";
    const team = a.team ? Store.team(a.team) : null;
    const gyms = (Store.state.gymBadges || []).filter((g) => g.holder === a.id);
    const trophies = allAwards().filter((t) => t.holder === a.name);
    const drinks = Store.drinkCount(a.id);
    const tr = Store.state.pokedex.trainers[a.id];
    const caught = tr ? Object.keys(tr.caught || {}).length : 0;

    const badgeRow = [];
    gyms.forEach((g) => { const ic = g.icon || (window.BADGE_ICONS && BADGE_ICONS[g.id]) || ""; if (ic) badgeRow.push(el("img", { class: "poster-badge", src: ic, title: g.name, alt: g.name })); });
    trophies.forEach((t) => badgeRow.push(el("span", { class: "poster-trophy", title: t.title }, t.emoji)));

    return el("div", { class: "poster-trainer", onClick: () => window.Profile && Profile.open(a.id) }, [
      src ? el("img", { class: "poster-mon", src: src, alt: form.name }) : el("span", { class: "draft-thumb-ball" }),
      el("div", { class: "poster-tname" }, a.name),
      el("div", { class: "poster-tfav" }, "♥ " + form.name),
      team ? el("span", { class: "poster-team", style: { background: team.color, color: contrast(team.color) } }, [teamIcon(team), " " + team.name]) : null,
      el("div", { class: "poster-tstats" }, "🔴 " + caught + "  ·  🍺 " + drinks),
      badgeRow.length ? el("div", { class: "poster-tbadges" }, badgeRow) : null,
    ]);
  }

  function timeline() {
    const chron = (Store.state.chronicle || []).slice().reverse();  // oldest → newest, a story
    if (!chron.length) return el("p", { class: "hint" }, "No moments logged yet — they'll fill in as the weekend happens.");
    const byDay = [];
    let curKey = null, cur = null;
    chron.forEach((c) => {
      const k = Store.dayKey(c.ts);
      if (k !== curKey) { curKey = k; cur = { label: Store.dayLabel(c.ts), items: [] }; byDay.push(cur); }
      cur.items.push(c);
    });
    return el("div", { class: "poster-timeline" }, byDay.map((d) =>
      el("div", { class: "poster-day" }, [
        el("div", { class: "poster-day-h" }, d.label),
        el("div", { class: "poster-feed" }, d.items.map((c) =>
          el("div", { class: "poster-moment" }, [el("span", { class: "poster-moment-e" }, c.icon || "•"), el("span", {}, c.text)]))),
      ])));
  }

  function view(root) {
    const p = Store.state.party;

    root.appendChild(el("div", { class: "page-head" }, [
      el("h1", {}, "🖼️ Weekend Poster"),
      el("p", { class: "page-sub" }, "The whole trip on one board — every trainer, their badges, and the story of the weekend. Screenshot it or print to PDF."),
    ]));

    root.appendChild(el("div", { class: "toolbar" }, [
      el("button", { class: "btn primary", onClick: () => window.print() }, "🖨️ Print / Save PDF"),
    ]));

    const poster = el("div", { class: "poster" });
    root.appendChild(poster);

    // ---- masthead ----
    poster.appendChild(el("div", { class: "poster-head" }, [
      el("div", { class: "poster-title" }, p.title || "Bachelor Party"),
      el("div", { class: "poster-sub" }, [p.location, p.subtitle].filter(Boolean).join(" · ")),
    ]));

    // ---- champion ----
    const st = Store.standings().filter((r) => r.total > 0);
    if (st.length) {
      const c = st[0];
      poster.appendChild(el("div", { class: "poster-champ", style: { borderColor: c.team.color } }, [
        el("span", { class: "poster-champ-crown" }, "👑"),
        el("div", {}, [
          el("div", { class: "poster-champ-l" }, "Champions"),
          el("div", { class: "poster-champ-t", style: { color: c.team.color } }, [teamIcon(c.team), " " + c.team.name]),
          el("div", { class: "poster-champ-n" }, c.total + " pts"),
        ]),
      ]));
    }

    // ---- the crew ----
    poster.appendChild(el("h2", { class: "poster-section" }, "The Crew"));
    poster.appendChild(el("div", { class: "poster-grid" }, Store.state.attendees.map(trainerCard)));

    // ---- awards wall ----
    const aw = allAwards(), sup = superlativeWinners();
    if (aw.length || sup.length) {
      const cards = aw.map((t) => trophyEl(t.emoji, t.title, t.holder, t.sub))
        .concat(sup.map((s) => trophyEl(s.emoji, s.title, s.holder, "superlative")));
      poster.appendChild(el("h2", { class: "poster-section" }, "Awards"));
      poster.appendChild(el("div", { class: "trophy-strip" }, cards));
    }

    // ---- the story ----
    poster.appendChild(el("h2", { class: "poster-section" }, "The Weekend, Move by Move"));
    poster.appendChild(timeline());
  }

  window.Views = window.Views || {};
  window.Views.poster = view;
})();
