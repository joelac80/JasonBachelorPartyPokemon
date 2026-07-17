/* regions.js — 🗺 The Journey: every region's FULL path in one place, one tab
   per generation (Kanto/Gen 1 first — the true beginning — then Johto's
   16-badge era, and on). Reuses the Gym Circuit, Pokémon League, and Movie
   Legends renderers — this view just composes them per region. */
(function () {
  const { el } = U;
  let curTab = 0;   // module-scope so the chosen region survives a re-render

  // Chronological regions, one per generation. The Movie Legends fold into
  // the Johto era (their gate: Champion LANCE).
  const TABS = [
    { key: "kanto", name: "Kanto", emoji: "🗾", gen: "Gen 1", gym: ["Kanto"], lg: ["Kanto"],
      note: "Where it all began — the 8 Kanto gyms, the ORIGINAL Elite Four, and Champion BLUE. Beat him to unlock Gen 2 and the road to Johto." },
    { key: "johto", name: "Johto", emoji: "🌸", gen: "Gen 2", gym: ["Johto"], lg: ["Johto"], gate: true, movies: true, needs: { champ: "blue", name: "BLUE", prev: "Kanto" },
      note: "The Gen 2 era — 8 Johto gyms (16 badges in all), the Elite Four, Champion LANCE, the silent summit of Mt. Silver, and the Movie Legends." },
    { key: "hoenn", name: "Hoenn", emoji: "🌊", gen: "Gen 3", gym: ["Hoenn"], lg: ["Hoenn"], needs: { champ: "lance", name: "LANCE", prev: "Johto" },
      note: "Eight gyms, then the Elite Four and Champion STEVEN." },
    { key: "sinnoh", name: "Sinnoh", emoji: "🏔", gen: "Gen 4", gym: ["Sinnoh"], lg: ["Sinnoh"], needs: { champ: "steven", name: "STEVEN", prev: "Hoenn" },
      note: "Eight gyms, the Elite Four, and CYNTHIA's final battle." },
    { key: "unova", name: "Unova", emoji: "🏙", gen: "Gen 5", gym: ["Unova"], lg: ["Unova"], needs: { champ: "cynthia", name: "CYNTHIA", prev: "Sinnoh" },
      note: "Eight gyms, the Elite Four, and Champion ALDER." },
    { key: "kalos", name: "Kalos", emoji: "🗼", gen: "Gen 6", gym: ["Kalos"], lg: ["Kalos"], needs: { champ: "alder", name: "ALDER", prev: "Unova" },
      note: "Eight gyms, the Elite Four, and Champion DIANTHA. Mega Evolution awakens here." },
    { key: "alola", name: "Alola", emoji: "🌺", gen: "Gen 7", gym: ["Alola"], lg: ["Alola"], needs: { champ: "diantha", name: "DIANTHA", prev: "Kalos" },
      note: "The Island Challenge — four Kahunas, the Elite Four, and Prof. KUKUI." },
    { key: "galar", name: "Galar", emoji: "⚽", gen: "Gen 8", gym: ["Galar"], lg: ["Galar"], needs: { champ: "kukui", name: "PROF. KUKUI", prev: "Alola" },
      note: "Eight gyms, the Champion Cup, and Champion LEON." },
    { key: "paldea", name: "Paldea", emoji: "🍊", gen: "Gen 9", gym: ["Paldea"], lg: ["Paldea"], needs: { champ: "leon", name: "LEON", prev: "Galar" },
      note: "Eight gyms, the Elite Four, and Top Champion GEETA." },
    { key: "cup", name: "Champions Cup", emoji: "🏆", gen: "Endgame", cup: true, needs: { champ: "geeta", name: "GEETA", prev: "Paldea" },
      note: "Beyond every region — a 16-legend single-elimination bracket. Every Elite Four, every Champion, RED and BLUE, drawn fresh into one tournament." },
  ];
  // Locked for this trainer until the gating Champion falls (Gen Ladder). The
  // check rides the LADDER CAP (which climbs strictly in order), so a stray
  // out-of-order win can never skip a region. The Cup gates on GEETA herself.
  const TAB_MIN_GEN = { johto: 2, hoenn: 3, sinnoh: 4, unova: 5, kalos: 6, alola: 7, galar: 8, paldea: 9 };
  function tabLocked(t, attId) {
    if (!t.needs || !attId) return false;
    if (t.cup) return Store.leagueWins(attId).indexOf("geeta") < 0;
    const min = TAB_MIN_GEN[t.key];
    return min ? (Store.genCapFor ? Store.genCapFor(attId) : 9) < min : false;
  }

  function view(root) {
    root.appendChild(el("div", { class: "page-head" }, [
      el("h1", {}, "🗺 The Journey"),
      el("p", { class: "page-sub" }, "Every region's full path — gyms, the Elite Four, and the Champion — in one place. Pick a region to begin the climb." ),
    ]));

    let attId = (window.Sync && Sync.getMe && Sync.getMe()) || (Store.state.attendees[0] || {}).id || "";
    if (!attId) { root.appendChild(el("p", { class: "hint" }, "Add trainers first (Squad page).")); return; }
    const lockedRow = U.lockedTrainerRow("Journey of:");
    const sel = el("select", { class: "in" }, Store.state.attendees.map((a) => el("option", { value: a.id }, a.name + "'s journey")));
    sel.value = attId;
    sel.addEventListener("change", () => { attId = sel.value; paintStyle(); paintTabs(); rebuild(); });
    if (lockedRow) { attId = lockedRow.dataset.me; root.appendChild(lockedRow); }
    else root.appendChild(sel);

    // ⚔/📖 The style switch: Challenge's full-power rematch squads, or True
    // Story's classic level curve. It rides the whole Journey — gyms, League,
    // gauntlets — and can be flipped between battles at any time.
    const styleHost = el("div", {});
    root.appendChild(styleHost);
    function paintStyle() { styleHost.innerHTML = ""; if (window.JourneyStyle) styleHost.appendChild(JourneyStyle.row(attId)); }
    paintStyle();

    const tabBar = el("div", { class: "rg-tabs" });
    root.appendChild(tabBar);
    const host = el("div", {});
    root.appendChild(host);

    function paintTabs() {
      tabBar.innerHTML = "";
      TABS.forEach((t, i) => {
        const locked = tabLocked(t, attId);
        tabBar.appendChild(el("button", { class: "rg-tab" + (i === curTab ? " on" : "") + (locked ? " locked" : ""),
          onClick: () => { if (curTab !== i) { curTab = i; paintTabs(); rebuild(); window.scrollTo(0, 0); } } }, [
          el("span", { class: "rg-tab-emoji" }, locked ? "🔒" : t.emoji),
          el("span", { class: "rg-tab-name" }, t.name),
          el("span", { class: "rg-tab-gen" }, t.gen),
        ]));
      });
    }

    function rebuild() {
      host.innerHTML = "";
      const t = TABS[curTab] || TABS[0];
      host.appendChild(el("div", { class: "rg-region-head" }, [
        el("h2", { class: "section-title" }, t.emoji + " " + t.name + " · " + t.gen),
        el("p", { class: "hint", style: { marginTop: "-4px" } }, t.note),
      ]));

      // 🧭 Gen Ladder gate: this region hasn't opened for this trainer yet.
      if (tabLocked(t, attId)) {
        host.appendChild(el("div", { class: "unown-seal" }, [
          el("div", { class: "unown-seal-ico" }, "🔒" + t.emoji),
          el("div", { class: "unown-seal-txt" }, "The road to " + t.name + " is closed. Beat " +
            (t.needs.champ === "geeta" ? "Top Champion" : "Champion") + " " + t.needs.name +
            " to finish " + t.needs.prev + " — then " + t.name + (t.cup ? "" : " and its generation of Pokémon") + " open up."),
        ]));
        return;
      }

      // 🏆 Champions Cup — the endgame bracket (no gyms/league; its own view)
      if (t.cup) {
        if (window.ChampionsCup) ChampionsCup.render(host);
        else host.appendChild(el("p", { class: "hint" }, "Champions Cup unavailable."));
        return;
      }

      // 🏟 Gyms for this region
      const GC = window.GymCircuit;
      const gymIdxs = GC ? (t.gym || []).reduce(function (acc, r) { return acc.concat(GC.idxsForRegion(r)); }, []) : [];
      if (gymIdxs.length) {
        host.appendChild(el("h3", { class: "rg-sub" }, "🏟 Gyms — " + gymIdxs.length));
        host.appendChild(el("div", { class: "gymc-grid" }, gymIdxs.map(function (i) { return GC.card(i, attId); })));
      } else if (!GC && (t.gym || []).length) {
        // a flaky connection can drop ONE script mid-update — say so instead
        // of silently hiding the whole circuit
        host.appendChild(el("p", { class: "hint" }, "⚠️ The Gym Circuit didn't load — check your connection and refresh the app."));
      }

      // 👑 Elite Four + Champion (+ Victory Road gate for the first region)
      const PL = window.PokeLeague;
      const stageIdxs = PL ? PL.stageIdxsForRegions(t.lg || []) : [];
      if (stageIdxs.length) {
        host.appendChild(el("h3", { class: "rg-sub" }, "👑 Elite Four & Champion"));
        // ⚔ Gate-style entry to run the whole Elite Four → Champion as one gauntlet.
        if (PL.leagueGate) { const gate = PL.leagueGate(attId, stageIdxs, t.name); if (gate) host.appendChild(gate); }
        const journey = el("div", { class: "league-journey" });
        if (t.gate) journey.appendChild(PL.gateCard(attId));
        stageIdxs.forEach(function (i) { journey.appendChild(PL.stageNode(i, attId)); });
        host.appendChild(journey);
      }

      // ⚔ THE LEGEND CONTINUES — the region's story specials, sitting right
      // where the credits would roll: beat the Champion, and the postgame
      // sagas open on the very next card (Rainbow Rocket, the Frontier,
      // the Darkest Day, the Orange League…).
      if (window.LegendChallenge && LegendChallenge.specialsForRegion) {
        var sps = LegendChallenge.specialsForRegion(t.name);
        if (sps.length) {
          host.appendChild(el("h3", { class: "rg-sub" }, "⚔ The Legend Continues"));
          host.appendChild(el("div", { class: "league-journey" },
            sps.map(function (sp) { return LegendChallenge.specialCard(sp, attId); })));
        }
      }

      // 🌌 Legendary Challenge — this region's generation(s) of legendaries,
      // unlocked once its Champion has fallen. The post-league endgame.
      if (window.LegendChallenge) {
        var trials = LegendChallenge.forRegions(t.lg || []);
        if (trials.length) {
          host.appendChild(el("h3", { class: "rg-sub" }, "🌌 Legendary Challenge"));
          host.appendChild(el("div", { class: "league-journey" },
            trials.map(function (lg) { return LegendChallenge.card(lg, attId); })));
        }
      }

      // 🎬 Movie Legends — each film mounts in its own era's tab.
      if (window.MovieLegends && MovieLegends.forRegion) {
        var films = MovieLegends.forRegion(t.name);
        if (films.length) {
          host.appendChild(el("h3", { class: "rg-sub" }, "🎬 Movie Legends"));
          host.appendChild(el("div", { class: "league-journey" },
            films.map(function (b) { return MovieLegends.card(b, attId); })));
        }
      }

      // 🏛 Hall of Fame + Gauntlet — scoped to THIS region's champions
      if (window.PokeLeague && PokeLeague.renderHOF) PokeLeague.renderHOF(host, attId, { regions: t.lg, label: t.name });
    }

    paintTabs();
    rebuild();
  }

  window.Views = window.Views || {};
  window.Views.regions = view;
})();
