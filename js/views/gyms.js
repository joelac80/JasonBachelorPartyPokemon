/* gyms.js — 🏟 The Gym Circuit: the 16 canon Gen 2 leaders (Johto, then the
   Kanto rematch tour), canon teams. EVEN MATCH: you bring exactly as many
   Pokémon as the leader runs, and their lineup stays hidden until each one
   comes out of its ball. Everyone can earn every badge (no stealing). */
(function () {
  const { el } = U;

  // Johto runs the HGSS Fighting Dojo REMATCH teams (everything here is
  // Lv50 anyway, so the leaders bring their grown-up squads). Rematch mons
  // from later generations are swapped for their closest Gen 1–2 kin:
  // Staraptor/Swellow/Honchkrow→Dodrio/Xatu/Murkrow, Shedinja/Vespiquen/
  // Yanmega→Shuckle/Beedrill/Yanma, Bibarel/Lickilicky/Delcatty→Furret/
  // Lickitung/Persian, Drifblim/Mismagius/Sableye/Dusknoir→the Ecruteak
  // ghost duos, Medicham/Hariyama/Breloom→the Hitmons+Primeape, Bronzong/
  // Empoleon/Magnezone→Forretress/Magneton, Abomasnow/Glalie/Walrein/
  // Mamoswine→Jynx/Cloyster/Lapras/Piloswine, Salamence→Aerodactyl.
  const GYMS = [
    { leader: "FALKNER",   badge: "Zephyr",   type: "flying",   region: "Johto",  team: [164, 85, 198, 178, 22, 18] },
    { leader: "BUGSY",     badge: "Hive",     type: "bug",      region: "Johto",  team: [213, 15, 193, 127, 214, 212] },
    { leader: "WHITNEY",   badge: "Plain",    type: "normal",   region: "Johto",  team: [203, 162, 108, 53, 36, 241] },
    { leader: "MORTY",     badge: "Fog",      type: "ghost",    region: "Johto",  team: [200, 200, 93, 93, 94, 94] },
    { leader: "CHUCK",     badge: "Storm",    type: "fighting", region: "Johto",  team: [237, 107, 106, 57, 68, 62] },
    { leader: "JASMINE",   badge: "Mineral",  type: "steel",    region: "Johto",  team: [205, 227, 82, 82, 208] },
    { leader: "PRYCE",     badge: "Glacier",  type: "ice",      region: "Johto",  team: [87, 124, 91, 215, 131, 221] },
    { leader: "CLAIR",     badge: "Rising",   type: "dragon",   region: "Johto",  team: [130, 6, 142, 149, 149, 230] },
    { leader: "BROCK",     badge: "Boulder",  type: "rock",     region: "Kanto",  team: [75, 111, 139, 95, 141] },
    { leader: "MISTY",     badge: "Cascade",  type: "water",    region: "Kanto",  team: [55, 195, 131, 121] },
    { leader: "LT. SURGE", badge: "Thunder",  type: "electric", region: "Kanto",  team: [26, 101, 82, 125] },
    { leader: "ERIKA",     badge: "Rainbow",  type: "grass",    region: "Kanto",  team: [114, 189, 182, 71] },
    { leader: "JANINE",    badge: "Soul",     type: "poison",   region: "Kanto",  team: [169, 49, 110, 168] },
    { leader: "SABRINA",   badge: "Marsh",    type: "psychic",  region: "Kanto",  team: [196, 122, 65] },
    { leader: "BLAINE",    badge: "Volcano",  type: "fire",     region: "Kanto",  team: [219, 126, 78] },
    { leader: "BLUE",      badge: "Earth",    type: "ground",   region: "Kanto",  team: [18, 65, 112, 130, 103, 59] },
    // ---- Hoenn (idx 16-23) — needed before the Hoenn Elite Four ----
    { leader: "ROXANNE",   badge: "Stone",    type: "rock",     region: "Hoenn",  team: [76, 476, 464, 299] },
    { leader: "BRAWLY",    badge: "Knuckle",  type: "fighting", region: "Hoenn",  team: [68, 297, 296, 214] },
    { leader: "WATTSON",   badge: "Dynamo",   type: "electric", region: "Hoenn",  team: [310, 462, 82, 101] },
    { leader: "FLANNERY",  badge: "Heat",     type: "fire",     region: "Hoenn",  team: [324, 323, 219, 229] },
    { leader: "NORMAN",    badge: "Balance",  type: "normal",   region: "Hoenn",  team: [289, 288, 295, 143] },
    { leader: "WINONA",    badge: "Feather",  type: "flying",   region: "Hoenn",  team: [334, 279, 277, 227, 357] },
    { leader: "TATE&LIZA", badge: "Mind",     type: "psychic",  region: "Hoenn",  team: [338, 337, 344, 282, 178] },
    { leader: "JUAN",      badge: "Rain",     type: "water",    region: "Hoenn",  team: [230, 350, 340, 342, 365] },
    // ---- Sinnoh (idx 24-31) — needed before the Sinnoh Elite Four ----
    { leader: "ROARK",     badge: "Coal",     type: "rock",     region: "Sinnoh", team: [409, 464, 76, 476] },
    { leader: "GARDENIA",  badge: "Forest",   type: "grass",    region: "Sinnoh", team: [407, 389, 421, 470] },
    { leader: "MAYLENE",   badge: "Cobble",   type: "fighting", region: "Sinnoh", team: [448, 68, 308, 214] },
    { leader: "WAKE",      badge: "Fen",      type: "water",    region: "Sinnoh", team: [419, 130, 195, 350] },
    { leader: "FANTINA",   badge: "Relic",    type: "ghost",    region: "Sinnoh", team: [429, 94, 426, 477] },
    { leader: "BYRON",     badge: "Mine",     type: "steel",    region: "Sinnoh", team: [411, 208, 437, 462] },
    { leader: "CANDICE",   badge: "Icicle",   type: "ice",      region: "Sinnoh", team: [478, 460, 471, 461, 473] },
    { leader: "VOLKNER",   badge: "Beacon",   type: "electric", region: "Sinnoh", team: [466, 405, 135, 26] },
  ];
  window.GYM_CIRCUIT = GYMS;   // profiles/tests can read the circuit

  function thumb(a) {
    const s = a && a.favoriteId ? Store.sprite(a.favoriteId) : "";
    if (a && a.photo) return el("img", { class: "draft-thumb", src: a.photo, alt: a.name });
    return s
      ? el("img", { class: "draft-thumb", src: s, alt: a.favorite || "" })
      : el("span", { class: "draft-thumb-ball" });
  }

  function openPicker(title, onPick) {
    const people = Store.state.attendees;
    if (!people.length) { alert("Add trainers first (Squad page)."); return; }
    const grid = el("div", { class: "pick-grid" }, people.map((a) =>
      el("button", { class: "pick-item", onClick: () => { ctrl.close(); onPick(a); } }, [
        thumb(a),
        el("span", { class: "pick-name" }, a.name),
        el("span", { class: "pick-fav" }, a.favorite || a.role || ""),
      ])
    ));
    const ctrl = Modal.open(title, grid, null, {});
  }

  function challengeGym(idx) {
    const gym = GYMS[idx];
    const size = gym.team.length;
    const go = (attId) => {
      if (Duel.poolFor(attId).length < size) {
        alert("Leader " + gym.leader + " runs " + size + " Pokémon — you need " + size + " of your own to challenge (catch more in the Safari!).");
        return;
      }
      Duel.pickParty({ attId: attId, min: size, max: size,
        title: "vs Leader " + gym.leader + " — pick EXACTLY " + size,
        hint: "Even match: " + size + " vs " + size + ". The leader's team is HIDDEN until it comes out of the ball.",
        onDone: (ids) => {
          Duel.start({ mode: "local", title: "the " + gym.badge + " Badge Gym", gym: { idx: idx, leader: gym.leader, badge: gym.badge },
            a: { units: [{ attId: attId, monIds: ids }] },
            b: { units: [{ npc: "LEADER " + gym.leader, ai: true, monIds: gym.team.slice() }] },
            onResult: () => Router.render() });
        } });
    };
    const me = window.Sync && Sync.getMe && Sync.getMe();
    if (me) go(me); else openPicker("Who challenges Leader " + gym.leader + "?", (a) => go(a.id));
  }

  function circuitCard(idx) {
    const g = GYMS[idx];
    const holders = Store.gymHolders(idx);
    const ico = U.energyIcon(g.type);
    return el("div", { class: "gymc-card" + (holders.length ? " earned" : "") }, [
      el("div", { class: "gymc-head" }, [
        ico ? el("img", { class: "gymc-ico", src: ico, alt: g.type }) : null,
        el("div", { class: "gymc-names" }, [
          el("div", { class: "gymc-badge" }, g.badge + " Badge"),
          el("div", { class: "gymc-leader" }, "Leader " + g.leader + " · team of " + g.team.length + " (hidden)"),
        ]),
      ]),
      holders.length
        ? el("div", { class: "gymc-holders" }, holders.map((id) => {
            const a = Store.attendee(id);
            return el("span", { class: "gymc-holder", onClick: () => window.Profile && Profile.open(id) }, "🏅 " + (a ? a.name : id));
          }))
        : el("div", { class: "gymc-holders none" }, "No badge holders yet"),
      el("button", { class: "btn primary sm", onClick: () => challengeGym(idx) }, "⚔ Challenge (" + g.team.length + "v" + g.team.length + ")"),
    ]);
  }

  function view(root) {
    root.appendChild(el("div", { class: "page-head" }, [
      el("h1", {}, "🏟 Gym Circuit"),
      el("p", { class: "page-sub" }, "32 canon Gym Leaders across four regions — Johto & Kanto (Falkner → BLUE), then Hoenn (Roxanne → Juan) and Sinnoh (Roark → Volkner). Leaders bring their grown-up REMATCH squads." ),
    ]));

    const totalBadges = (Store.state.attendees || []).reduce((n, a) => n + Store.gymBadgeCount(a.id), 0);
    root.appendChild(el("p", { class: "hint" },
      "Even match: bring EXACTLY as many Pokémon as the leader runs — their team stays hidden until each comes out of its ball. Everyone can earn every badge; sweep all 16 Johto & Kanto to become CHAMPION. The 8 Hoenn badges unlock the Hoenn Elite Four; the 8 Sinnoh badges unlock Sinnoh's. Lose = 3 sips." +
      (totalBadges ? " (" + totalBadges + " badge" + (totalBadges > 1 ? "s" : "") + " earned so far.)" : "")));

    // Group the circuit by region so 32 gyms stay readable.
    const REGIONS = [
      { name: "Johto", emoji: "🌸", note: "The classic 8 — the road to Victory Road." },
      { name: "Kanto", emoji: "🗾", note: "The rematch tour. All 16 here = CHAMPION." },
      { name: "Hoenn", emoji: "🌊", note: "Earn all 8 to face the Hoenn Elite Four." },
      { name: "Sinnoh", emoji: "🏔", note: "Earn all 8 to face the Sinnoh Elite Four." },
    ];
    REGIONS.forEach((r) => {
      const idxs = GYMS.map((g, i) => i).filter((i) => GYMS[i].region === r.name);
      if (!idxs.length) return;
      const held = (Store.state.attendees || []).length
        ? idxs.reduce((n, i) => n + (Store.gymHolders(i).length ? 1 : 0), 0) : 0;
      root.appendChild(el("h2", { class: "section-title" }, r.emoji + " " + r.name + " — " + idxs.length + " gyms"));
      root.appendChild(el("p", { class: "hint", style: { marginTop: "-6px" } }, r.note));
      root.appendChild(el("div", { class: "gymc-grid" }, idxs.map((i) => circuitCard(i))));
    });

    // The League continues where the circuit ends.
    root.appendChild(el("div", { class: "duel-belt", onClick: () => { location.hash = "#/league"; } },
      "👑 All 8 Johto badges? Victory Road is open — enter the POKÉMON LEAGUE →"));
  }

  window.Views = window.Views || {};
  window.Views.gyms = view;
})();
