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
    { leader: "FALKNER",   badge: "Zephyr",   type: "flying",   team: [164, 85, 198, 178, 22, 18] },
    { leader: "BUGSY",     badge: "Hive",     type: "bug",      team: [213, 15, 193, 127, 214, 212] },
    { leader: "WHITNEY",   badge: "Plain",    type: "normal",   team: [203, 162, 108, 53, 36, 241] },
    { leader: "MORTY",     badge: "Fog",      type: "ghost",    team: [200, 200, 93, 93, 94, 94] },
    { leader: "CHUCK",     badge: "Storm",    type: "fighting", team: [237, 107, 106, 57, 68, 62] },
    { leader: "JASMINE",   badge: "Mineral",  type: "steel",    team: [205, 227, 82, 82, 208] },
    { leader: "PRYCE",     badge: "Glacier",  type: "ice",      team: [87, 124, 91, 215, 131, 221] },
    { leader: "CLAIR",     badge: "Rising",   type: "dragon",   team: [130, 6, 142, 149, 149, 230] },
    { leader: "BROCK",     badge: "Boulder",  type: "rock",     team: [75, 111, 139, 95, 141] },
    { leader: "MISTY",     badge: "Cascade",  type: "water",    team: [55, 195, 131, 121] },
    { leader: "LT. SURGE", badge: "Thunder",  type: "electric", team: [26, 101, 82, 125] },
    { leader: "ERIKA",     badge: "Rainbow",  type: "grass",    team: [114, 189, 182, 71] },
    { leader: "JANINE",    badge: "Soul",     type: "poison",   team: [169, 49, 110, 168] },
    { leader: "SABRINA",   badge: "Marsh",    type: "psychic",  team: [196, 122, 65] },
    { leader: "BLAINE",    badge: "Volcano",  type: "fire",     team: [219, 126, 78] },
    { leader: "BLUE",      badge: "Earth",    type: "ground",   team: [18, 65, 112, 130, 103, 59] },
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
      el("p", { class: "page-sub" }, "The 16 canon Gym Leaders of Johto & Kanto, Falkner → BLUE — the battling heart of the Frontier. Johto's leaders bring their full REMATCH squads." ),
    ]));

    const totalBadges = (Store.state.attendees || []).reduce((n, a) => n + Store.gymBadgeCount(a.id), 0);
    root.appendChild(el("p", { class: "hint" },
      "Even match: bring EXACTLY as many Pokémon as the leader runs — their team stays hidden until each comes out of its ball. Everyone can earn every badge; sweep all 16 to become CHAMPION. Lose = 3 sips." +
      (totalBadges ? " (" + totalBadges + " badge" + (totalBadges > 1 ? "s" : "") + " earned so far.)" : "")));
    root.appendChild(el("div", { class: "gymc-grid" }, GYMS.map((g, i) => circuitCard(i))));

    // The League continues where the circuit ends.
    root.appendChild(el("div", { class: "duel-belt", onClick: () => { location.hash = "#/league"; } },
      "👑 All 8 Johto badges? Victory Road is open — enter the POKÉMON LEAGUE →"));
  }

  window.Views = window.Views || {};
  window.Views.gyms = view;
})();
