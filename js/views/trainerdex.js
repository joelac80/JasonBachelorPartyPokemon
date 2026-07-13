/* trainerdex.js — 🎓 THE TRAINER DEX: a Pokédex for the PEOPLE. Every
   notable trainer in the whole saga — gym leaders, Elite Four, Champions,
   movie legends, the nine legendary hosts, every special's boss, and the
   canon rivals & villains who ambush the roads — registered the moment you
   beat them, silhouetted until then. The roaming ones are remembered here:
   even a random SILVER rematch or a wild Prof. Oak sighting counts forever
   (encounter wins are append-only). All read straight from the existing
   records (badges, league, movies, legends, secrets, encounters) — the dex
   fills itself in as the story is lived. */
(function () {
  const { el, energyIcon } = U;
  const SP = window.DEX_SPRITES || {};

  let me = "";

  const aceOf = (team) => (team && team.length ? team[team.length - 1] : 0);
  function aceImg(id, lit) {
    const src = SP[id] || (window.Store && Store.sprite(id)) || "";
    if (!src) return el("span", { class: "tdex-noimg" }, "◓");
    return el("img", { class: "tdex-ace" + (lit ? " lit" : ""), src: src, alt: "" });
  }
  function card(lit, aceId, name, sub, chip) {
    return el("div", { class: "tdex-card" + (lit ? " lit" : "") }, [
      aceImg(aceId, lit),
      el("div", { class: "tdex-name" }, lit ? name : (name === "???" ? "???" : name)),
      el("div", { class: "tdex-sub" }, sub || ""),
      chip ? el("div", { class: "tdex-chip" + (lit ? " lit" : "") }, chip) : null,
    ]);
  }
  function section(host, emoji, title, got, total, hint, cards) {
    host.appendChild(el("h2", { class: "section-title tdex-head" }, [
      el("span", {}, emoji + " " + title),
      el("span", { class: "tdex-count" + (got >= total ? " full" : "") }, got + " / " + total),
    ]));
    if (hint) host.appendChild(el("p", { class: "hint" }, hint));
    host.appendChild(el("div", { class: "tdex-grid" }, cards));
    return got;
  }

  function view(root) {
    const meId = (window.Sync && Sync.getMe && Sync.getMe()) || "";
    if (!me && meId && Store.attendee(meId)) me = meId;

    root.appendChild(el("div", { class: "page-head" }, [
      el("h1", {}, "🎓 Trainer Dex"),
      el("p", { class: "page-sub" }, "A Pokédex for the PEOPLE of the saga. Every leader, Champion, legend and roadside rival is registered here the moment you beat them — silhouettes until you do. Even the roaming ones are remembered forever." ),
    ]));

    const sel = el("select", { class: "in" }, [el("option", { value: "" }, "— pick a trainer —")].concat(
      Store.state.attendees.map((a) => el("option", { value: a.id, selected: me === a.id ? "true" : null }, a.name))));
    sel.addEventListener("change", () => { me = sel.value; Router.render(); });
    root.appendChild(el("div", { class: "safari-trainer" }, [el("span", { class: "safari-trainer-lbl" }, "Trainer:"), sel]));

    if (!me) { root.appendChild(el("p", { class: "empty" }, "👆 Pick a trainer to open their Trainer Dex.")); return; }

    const host = el("div", {});
    root.appendChild(host);
    let got = 0, total = 0;

    // ❗ Crossed Paths — the canon rivals & villains of the road (story
    // moments AND random roamers both land here via encounterWins).
    const enc = Store.encounterWins(me);
    const roster = window.CANON_TRAINERS || [];
    got += section(host, "❗", "Crossed Paths", roster.filter((t) => enc.indexOf(t.name) >= 0).length, roster.length,
      "The bosses and rivals who ambush the roads — at their canon story moments, or as roaming surprises. Beat them once and they're registered forever.",
      roster.map((t) => {
        const lit = enc.indexOf(t.name) >= 0;
        const chip = t.story ? "📖 " + t.story.region + " · badge " + t.story.badge : "🎲 roams " + (t.region || "everywhere");
        return card(lit, aceOf(t.team), t.name, t.title, chip);
      }));
    total += roster.length;

    // 🏅 Gym Leaders — badge holders across all nine regions.
    const GYMS = (window.GymCircuit && GymCircuit.GYMS) || [];
    let gymGot = 0;
    const gymsByRegion = {};
    GYMS.forEach((g, i) => { (gymsByRegion[g.region] = gymsByRegion[g.region] || []).push([g, i]); });
    const gymCards = [];
    Object.keys(gymsByRegion).forEach((region) => {
      gymsByRegion[region].forEach(([g, i]) => {
        const lit = Store.gymHolders(i).indexOf(me) >= 0;
        if (lit) gymGot++;
        gymCards.push(card(lit, aceOf(g.team), g.leader, g.badge + " Badge", region));
      });
    });
    got += section(host, "🏅", "Gym Leaders", gymGot, GYMS.length,
      "Every leader across the nine regions — lit when you hold their badge.", gymCards);
    total += GYMS.length;

    // 👑 The League — Elite Four, Champions, RED. Mystery names stay hidden.
    const LEAGUE = window.LEAGUE_STAGES || [];
    const lw = Store.leagueWins(me);
    let lgGot = 0;
    const lgCards = LEAGUE.map((st) => {
      const lit = lw.indexOf(st.key) >= 0;
      if (lit) lgGot++;
      const anyBeat = Store.state.attendees.some((a) => Store.leagueWins(a.id).indexOf(st.key) >= 0);
      const nm = st.mystery && !lit && !anyBeat ? "???" : st.name;
      return card(lit, aceOf(st.team), nm, st.rank, st.region);
    });
    got += section(host, "👑", "The League", lgGot, LEAGUE.length,
      "The Elite Four, the Champions — and whatever waits on the mountain.", lgCards);
    total += LEAGUE.length;

    // 🎬 The Silver Screen — movie legends.
    const MOVIES = window.MOVIE_BOSSES || [];
    const mw = Store.movieWins(me);
    let mvGot = 0;
    const mvCards = MOVIES.map((b) => {
      const lit = mw.indexOf(b.key) >= 0;
      if (lit) mvGot++;
      return card(lit, b.face || aceOf(b.team), b.name, b.title, "🎬 " + (b.film || ""));
    });
    got += section(host, "🎬", "The Silver Screen", mvGot, MOVIES.length,
      "The movie legends — one poster per film.", mvCards);
    total += MOVIES.length;

    // 🌌 Legends & Story Specials — the nine hosts + every special's boss.
    const LEGENDS = (window.LegendChallenge && LegendChallenge.LEGENDS) || [];
    const SPECIALS = (window.LegendChallenge && LegendChallenge.SPECIALS) || [];
    const legW = Store.legendWins(me), secW = Store.secretWins(me);
    let spGot = 0;
    const spCards = LEGENDS.map((lg) => {
      const lit = legW.indexOf(lg.key) >= 0;
      if (lit) spGot++;
      return card(lit, lg.face || aceOf(lg.team), lg.name, "Legendary Challenge", "Gen " + lg.gen);
    }).concat(SPECIALS.map((sp) => {
      const lit = secW.indexOf(sp.key) >= 0;
      if (lit) spGot++;
      return card(lit, sp.face || aceOf(sp.team), sp.name, sp.flair || "Special", sp.tab);
    }));
    got += section(host, "🌌", "Legends & Story Beats", spGot, LEGENDS.length + SPECIALS.length,
      "The nine legendary hosts and every story special — N's Castle to the Paradox Gauntlet.", spCards);
    total += LEGENDS.length + SPECIALS.length;

    // Roll the summary up top (built last, inserted first).
    const pct = total ? Math.round((got / total) * 100) : 0;
    root.insertBefore(el("div", { class: "tdex-summary" }, [
      el("div", { class: "tdex-total" }, "🎓 " + got + " / " + total + " trainers registered"),
      el("div", { class: "tdex-bar" }, [el("div", { class: "tdex-fill", style: { width: pct + "%" } })]),
      el("div", { class: "tdex-pct" }, got >= total ? "🏆 THE COMPLETE TRAINER DEX — every soul in the saga, beaten." : pct + "% of the saga's trainers beaten"),
    ]), host);
  }

  window.Views = window.Views || {};
  window.Views.trainerdex = view;
})();
