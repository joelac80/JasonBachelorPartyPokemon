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
  function nm(id) { const a = Store.attendee(id); return a ? a.name : ""; }

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
    const caught = Store.dexCount(a.id);

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
    // Merge text moments (chronicle) + photo moments into one time-ordered story.
    const moments = (Store.state.chronicle || []).map((c) => ({ ts: c.ts, icon: c.icon, text: c.text, by: c.by }));
    const photos = (Store.state.photos || []).map((p) => ({ ts: p.ts, img: p.img, text: p.caption, by: p.by, id: p.id, reactions: p.reactions, comments: p.comments }));
    const all = moments.concat(photos);
    if (!all.length) return el("p", { class: "hint" }, "No moments yet — add photos and play games; they'll fill in here.");
    all.sort((a, b) => a.ts - b.ts);   // oldest → newest, a story
    const byDay = [];
    let curKey = null, cur = null;
    all.forEach((c) => {
      const k = Store.dayKey(c.ts);
      if (k !== curKey) { curKey = k; cur = { label: Store.dayLabel(c.ts), items: [] }; byDay.push(cur); }
      cur.items.push(c);
    });
    return el("div", { class: "poster-timeline" }, byDay.map((d) =>
      el("div", { class: "poster-day" }, [
        el("div", { class: "poster-day-h" }, d.label),
        el("div", { class: "poster-feed" }, d.items.map((c) => {
          if (!c.img) return el("div", { class: "poster-moment" }, [
            el("span", { class: "poster-moment-e" }, c.icon || "•"),
            el("span", {}, [c.text, c.by ? el("span", { class: "poster-moment-by" }, "  · logged by " + nm(c.by)) : null]),
          ]);
          const counts = {}; (c.reactions || []).forEach((r) => { counts[r.emoji] = (counts[r.emoji] || 0) + 1; });
          const summary = Object.keys(counts).map((e) => e + counts[e]).join("  ");
          const nComments = (c.comments || []).length;
          return el("figure", { class: "poster-photo", onClick: () => window.PhotoLog && PhotoLog.openDetail(c.id, () => Router.render()) }, [
            el("img", { src: c.img, alt: c.text || "", loading: "lazy" }),
            (c.text || c.by) ? el("figcaption", {}, (c.text || "") + (c.by ? " — " + c.by : "")) : null,
            el("div", { class: "poster-photo-react" }, summary + (nComments ? "  💬 " + nComments : "") || "💬 tap to react"),
          ]);
        })),
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
      el("button", { class: "btn subtle", onClick: () => { if (window.PhotoLog) PhotoLog.capture(() => Router.render()); } }, "📸 Add a photo moment"),
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

    // ---- type masters ----
    const gyms = Store.typeLeaders().filter((l) => l.n > 0);
    if (gyms.length) {
      poster.appendChild(el("h2", { class: "poster-section" }, "⚡ Type Masters"));
      poster.appendChild(el("div", { class: "chip-row" }, gyms.map((l) => {
        const ico = U.energyIcon(l.type);
        return el("span", { class: "drink-chip" }, [
          ico ? el("img", { class: "poster-gym-ico", src: ico, alt: l.type }) : null,
          " " + l.holder + " ×" + l.n,
        ]);
      })));
    }

    // ---- scorekeepers ----
    const keepers = Store.state.attendees.map((a) => ({ a: a, n: Store.logCount(a.id) })).filter((r) => r.n > 0).sort((x, y) => y.n - x.n);
    if (keepers.length) {
      poster.appendChild(el("h2", { class: "poster-section" }, "📋 Scorekeepers"));
      poster.appendChild(el("div", { class: "safari-board" }, keepers.map((r, i) =>
        el("div", { class: "safari-board-row" + (i === 0 ? " lead" : "") }, [
          el("span", { class: "safari-board-rank" }, i === 0 ? "📋" : "#" + (i + 1)),
          el("span", { class: "safari-board-name" }, r.a.name),
          el("span", { class: "safari-board-n" }, r.n + " logged"),
        ]))));
    }

    // ---- what we drank ----
    const labels = Store.drinkLabels();
    if (labels.length) {
      poster.appendChild(el("h2", { class: "poster-section" }, "What We Drank"));
      poster.appendChild(el("div", { class: "chip-row" }, labels.map((x) =>
        el("span", { class: "drink-chip" }, Store.drinkEmoji(x.type) + " " + x.label + " ×" + x.n))));
    }

    // ---- the story ----
    poster.appendChild(el("h2", { class: "poster-section" }, "The Weekend, Move by Move"));
    poster.appendChild(timeline());
  }

  window.Views = window.Views || {};
  window.Views.poster = view;
})();
