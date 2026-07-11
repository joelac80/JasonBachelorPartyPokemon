/* regions.js — 🗺 The Journey: every region's FULL path in one place. Pick a
   region (chronological, Gen 1 & 2 combined) and see its gyms → Elite Four →
   Champion, all gated as before. Reuses the Gym Circuit, Pokémon League, and
   Movie Legends renderers — this view just composes them per region. */
(function () {
  const { el } = U;
  let curTab = 0;   // module-scope so the chosen region survives a re-render

  // Chronological regions. Gen 1 & 2 (Kanto + Johto) share one path; the two
  // Movie Legends (Kanto-themed) fold in at the bottom of that path.
  const TABS = [
    { key: "kanto-johto", name: "Kanto & Johto", emoji: "🗾", gen: "Gen 1 & 2", gym: ["Johto", "Kanto"], lg: ["Johto", "Kanto"], gate: true, movies: true,
      note: "The original journey — all 16 Johto & Kanto gyms, the Elite Four, Champion LANCE, the silent summit of Mt. Silver, and two big-screen legends." },
    { key: "hoenn", name: "Hoenn", emoji: "🌊", gen: "Gen 3", gym: ["Hoenn"], lg: ["Hoenn"],
      note: "Eight gyms, then the Elite Four and Champion STEVEN." },
    { key: "sinnoh", name: "Sinnoh", emoji: "🏔", gen: "Gen 4", gym: ["Sinnoh"], lg: ["Sinnoh"],
      note: "Eight gyms, the Elite Four, and CYNTHIA's final battle." },
    { key: "unova", name: "Unova", emoji: "🏙", gen: "Gen 5", gym: ["Unova"], lg: ["Unova"],
      note: "Eight gyms, the Elite Four, and Champion ALDER." },
    { key: "kalos", name: "Kalos", emoji: "🗼", gen: "Gen 6", gym: ["Kalos"], lg: ["Kalos"],
      note: "Eight gyms, the Elite Four, and Champion DIANTHA." },
    { key: "alola", name: "Alola", emoji: "🌺", gen: "Gen 7", gym: ["Alola"], lg: ["Alola"],
      note: "The Island Challenge — four Kahunas, the Elite Four, and Prof. KUKUI." },
    { key: "galar", name: "Galar", emoji: "⚽", gen: "Gen 8", gym: ["Galar"], lg: ["Galar"],
      note: "Eight gyms, the Champion Cup, and Champion LEON." },
    { key: "paldea", name: "Paldea", emoji: "🍊", gen: "Gen 9", gym: ["Paldea"], lg: ["Paldea"],
      note: "Eight gyms, the Elite Four, and Top Champion GEETA." },
    { key: "cup", name: "Champions Cup", emoji: "🏆", gen: "Endgame", cup: true,
      note: "Beyond every region — a 16-legend single-elimination bracket. Every Elite Four, every Champion, RED and BLUE, drawn fresh into one tournament." },
  ];

  function view(root) {
    root.appendChild(el("div", { class: "page-head" }, [
      el("h1", {}, "🗺 The Journey"),
      el("p", { class: "page-sub" }, "Every region's full path — gyms, the Elite Four, and the Champion — in one place. Pick a region to begin the climb." ),
    ]));

    let attId = (window.Sync && Sync.getMe && Sync.getMe()) || (Store.state.attendees[0] || {}).id || "";
    if (!attId) { root.appendChild(el("p", { class: "hint" }, "Add trainers first (Squad page).")); return; }
    const sel = el("select", { class: "in" }, Store.state.attendees.map((a) => el("option", { value: a.id }, a.name + "'s journey")));
    sel.value = attId;
    sel.addEventListener("change", () => { attId = sel.value; rebuild(); });
    root.appendChild(sel);

    const tabBar = el("div", { class: "rg-tabs" });
    root.appendChild(tabBar);
    const host = el("div", {});
    root.appendChild(host);

    function paintTabs() {
      tabBar.innerHTML = "";
      TABS.forEach((t, i) => {
        tabBar.appendChild(el("button", { class: "rg-tab" + (i === curTab ? " on" : ""),
          onClick: () => { if (curTab !== i) { curTab = i; paintTabs(); rebuild(); window.scrollTo(0, 0); } } }, [
          el("span", { class: "rg-tab-emoji" }, t.emoji),
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
        host.appendChild(el("div", { class: "gymc-grid" }, gymIdxs.map(function (i) { return GC.card(i); })));
      }

      // 👑 Elite Four + Champion (+ Victory Road gate for the first region)
      const PL = window.PokeLeague;
      const stageIdxs = PL ? PL.stageIdxsForRegions(t.lg || []) : [];
      if (stageIdxs.length) {
        host.appendChild(el("h3", { class: "rg-sub" }, "👑 Elite Four & Champion"));
        const journey = el("div", { class: "league-journey" });
        if (t.gate) journey.appendChild(PL.gateCard(attId));
        stageIdxs.forEach(function (i) { journey.appendChild(PL.stageNode(i, attId)); });
        host.appendChild(journey);
      }

      // 🎬 Movie Legends — Kanto & Johto only
      if (t.movies && window.MovieLegends) {
        host.appendChild(el("h3", { class: "rg-sub" }, "🎬 Movie Legends"));
        host.appendChild(el("div", { class: "league-journey" },
          MovieLegends.BOSSES.map(function (b) { return MovieLegends.card(b, attId); })));
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
