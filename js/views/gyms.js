/* gyms.js — 🏟 The Gym Circuit: the 16 canon Gen 2 leaders (Johto, then the
   Kanto rematch tour), canon teams. EVEN MATCH: you bring exactly as many
   Pokémon as the leader runs, and their lineup stays hidden until each one
   comes out of its ball. Everyone can earn every badge (no stealing). */
(function () {
  const { el } = U;

  // Every leader across all nine regions brings their grown-up REMATCH squad,
  // and every Pokémon is its FINAL evolved form — no mid-stages. Where a mon's
  // real ace has since gained a newer evolution, the leader fields it (Murkrow→
  // Honchkrow, Magneton→Magnezone, Piloswine→Mamoswine, Primeape→Annihilape,
  // Duraludon→Archaludon, etc.). Alola runs its four Island Kahunas.
  const GYMS = [
    { leader: "FALKNER",   badge: "Zephyr",   type: "flying",   region: "Johto",  team: [164, 85, 430, 178, 22, 18] },
    { leader: "BUGSY",     badge: "Hive",     type: "bug",      region: "Johto",  team: [213, 15, 469, 127, 214, 212] },
    { leader: "WHITNEY",   badge: "Plain",    type: "normal",   region: "Johto",  team: [981, 162, 463, 53, 36, 241] },
    { leader: "MORTY",     badge: "Fog",      type: "ghost",    region: "Johto",  team: [94, 429, 426, 442, 477, 302] },
    { leader: "CHUCK",     badge: "Storm",    type: "fighting", region: "Johto",  team: [237, 107, 106, 979, 68, 62] },
    { leader: "JASMINE",   badge: "Mineral",  type: "steel",    region: "Johto",  team: [205, 227, 462, 462, 208] },
    { leader: "PRYCE",     badge: "Glacier",  type: "ice",      region: "Johto",  team: [87, 124, 91, 461, 131, 473] },
    { leader: "CLAIR",     badge: "Rising",   type: "dragon",   region: "Johto",  team: [130, 6, 142, 149, 149, 230] },
    { leader: "BROCK",     badge: "Boulder",  type: "rock",     region: "Kanto",  team: [76, 464, 139, 208, 141] },
    { leader: "MISTY",     badge: "Cascade",  type: "water",    region: "Kanto",  team: [55, 195, 131, 121] },
    { leader: "LT. SURGE", badge: "Thunder",  type: "electric", region: "Kanto",  team: [26, 101, 462, 466] },
    { leader: "ERIKA",     badge: "Rainbow",  type: "grass",    region: "Kanto",  team: [465, 189, 182, 71] },
    { leader: "JANINE",    badge: "Soul",     type: "poison",   region: "Kanto",  team: [169, 49, 110, 168] },
    { leader: "SABRINA",   badge: "Marsh",    type: "psychic",  region: "Kanto",  team: [196, 866, 65] },
    { leader: "BLAINE",    badge: "Volcano",  type: "fire",     region: "Kanto",  team: [219, 467, 78] },
    { leader: "BLUE",      badge: "Earth",    type: "ground",   region: "Kanto",  team: [18, 65, 464, 130, 103, 59] },
    // ---- Hoenn (idx 16-23) — needed before the Hoenn Elite Four ----
    { leader: "ROXANNE",   badge: "Stone",    type: "rock",     region: "Hoenn",  team: [76, 476, 464, 409] },
    { leader: "BRAWLY",    badge: "Knuckle",  type: "fighting", region: "Hoenn",  team: [68, 297, 286, 214] },
    { leader: "WATTSON",   badge: "Dynamo",   type: "electric", region: "Hoenn",  team: [310, 462, 479, 101] },
    { leader: "FLANNERY",  badge: "Heat",     type: "fire",     region: "Hoenn",  team: [324, 323, 219, 229] },
    { leader: "NORMAN",    badge: "Balance",  type: "normal",   region: "Hoenn",  team: [289, 335, 295, 143] },
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
    // ---- Unova (Gen 5) ----
    { leader: "CHILI",     badge: "Trio",     type: "fire",     region: "Unova",  team: [609, 514, 555, 631] },
    { leader: "LENORA",    badge: "Basic",    type: "normal",   region: "Unova",  team: [508, 505, 626, 573] },
    { leader: "BURGH",     badge: "Insect",   type: "bug",      region: "Unova",  team: [542, 545, 558, 617] },
    { leader: "ELESA",     badge: "Bolt",     type: "electric", region: "Unova",  team: [523, 587, 596, 604] },
    { leader: "CLAY",      badge: "Quake",    type: "ground",   region: "Unova",  team: [530, 553, 537, 623] },
    { leader: "SKYLA",     badge: "Jet",      type: "flying",   region: "Unova",  team: [581, 521, 561, 528] },
    { leader: "BRYCEN",    badge: "Freeze",   type: "ice",      region: "Unova",  team: [614, 615, 584, 473] },
    { leader: "DRAYDEN",   badge: "Legend",   type: "dragon",   region: "Unova",  team: [612, 621, 635, 149] },
    // ---- Kalos (Gen 6) ----
    { leader: "VIOLA",     badge: "Bug",      type: "bug",      region: "Kalos",  team: [666, 284, 214, 545] },
    { leader: "GRANT",     badge: "Cliff",    type: "rock",     region: "Kalos",  team: [697, 699, 411, 409] },
    { leader: "KORRINA",   badge: "Rumble",   type: "fighting", region: "Kalos",  team: [448, 701, 68, 620] },
    { leader: "RAMOS",     badge: "Plant",    type: "grass",    region: "Kalos",  team: [673, 709, 189, 549] },
    { leader: "CLEMONT",   badge: "Voltage",  type: "electric", region: "Kalos",  team: [695, 462, 587, 479] },
    { leader: "VALERIE",   badge: "Fairy",    type: "fairy",    region: "Kalos",  team: [700, 303, 671, 210] },
    { leader: "OLYMPIA",   badge: "Psychic",  type: "psychic",  region: "Kalos",  team: [678, 282, 561, 80] },
    { leader: "WULFRIC",   badge: "Iceberg",  type: "ice",      region: "Kalos",  team: [713, 460, 615, 461] },
    // ---- Alola (Gen 7): the four Island Kahunas of the Island Challenge ----
    { leader: "HALA",      badge: "Melemele", type: "fighting", region: "Alola",  team: [740, 297, 979, 760] },
    { leader: "OLIVIA",    badge: "Akala",    type: "rock",     region: "Alola",  team: [745, 476, 526, 76] },
    { leader: "NANU",      badge: "Ula'ula",  type: "dark",     region: "Alola",  team: [53, 302, 430, 553] },
    { leader: "HAPU",      badge: "Poni",     type: "ground",   region: "Alola",  team: [750, 330, 423, 623] },
    // ---- Galar (Gen 8) ----
    { leader: "MILO",      badge: "Grass",    type: "grass",    region: "Galar",  team: [830, 842, 547, 763] },
    { leader: "NESSA",     badge: "Water",    type: "water",    region: "Galar",  team: [834, 847, 279, 845] },
    { leader: "KABU",      badge: "Fire",     type: "fire",     region: "Galar",  team: [851, 59, 38, 668] },
    { leader: "BEA",       badge: "Fighting", type: "fighting", region: "Galar",  team: [68, 853, 870, 865] },
    { leader: "ALLISTER",  badge: "Ghost",    type: "ghost",    region: "Galar",  team: [94, 864, 867, 778] },
    { leader: "OPAL",      badge: "Fairy",    type: "fairy",    region: "Galar",  team: [869, 468, 110, 303] },
    { leader: "GORDIE",    badge: "Rock",     type: "rock",     region: "Galar",  team: [839, 874, 689, 526] },
    { leader: "RAIHAN",    badge: "Dragon",   type: "dragon",   region: "Galar",  team: [1018, 330, 844, 776] },
    // ---- Paldea (Gen 9) ----
    { leader: "KATY",      badge: "Bug",      type: "bug",      region: "Paldea", team: [918, 416, 168, 212] },
    { leader: "BRASSIUS",  badge: "Grass",    type: "grass",    region: "Paldea", team: [930, 185, 549, 556] },
    { leader: "IONO",      badge: "Electric", type: "electric", region: "Paldea", team: [939, 405, 429, 941] },
    { leader: "KOFU",      badge: "Water",    type: "water",    region: "Paldea", team: [976, 961, 740, 693] },
    { leader: "LARRY",     badge: "Normal",   type: "normal",   region: "Paldea", team: [398, 775, 982, 765] },
    { leader: "RYME",      badge: "Ghost",    type: "ghost",    region: "Paldea", team: [354, 778, 972, 426] },
    { leader: "TULIP",     badge: "Psychic",  type: "psychic",  region: "Paldea", team: [981, 282, 956, 671] },
    { leader: "GRUSHA",    badge: "Ice",      type: "ice",      region: "Paldea", team: [975, 873, 614, 998] },
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

  // ❗ ~1-in-4 chance a famous canon trainer (Giovanni, Silver, N…) ambushes you
  // on your way out of a gym. Pure exhibition — glory and sips.
  function startEncounter(attId, t) {
    const size = Math.min(6, Duel.poolFor(attId).length);
    if (size < 1) return;
    Duel.pickParty({ attId: attId, min: 1, max: size,
      title: "vs " + t.title + " " + t.name + " — pick up to " + size,
      hint: "A surprise battle! Bragging rights and sips — no badge, no rating.",
      onDone: (ids) => {
        Duel.start({ mode: "local", title: "a surprise showdown",
          encounter: { foe: t.title + " " + t.name, who: t.name },
          a: { units: [{ attId: attId, monIds: ids }] },
          b: { units: [{ npc: t.name, ai: true, monIds: t.team.slice(), boost: 1.12 }] },
          onResult: () => Router.render() });
      } });
  }
  function maybeEncounter(attId) {
    const pool = window.CANON_TRAINERS || [];
    if (!pool.length || Duel.poolFor(attId).length < 1) return;
    if (Math.random() > 0.28) return;                       // ~28% of gym battles
    const t = pool[Math.floor(Math.random() * pool.length)];
    let tries = 0;
    // Wait until the gym battle's own end screens (evolution / rematch) clear.
    (function whenClear() {
      if (++tries > 25 || !/^#\/gyms/.test(location.hash)) return;   // give up / left the page
      if (document.querySelector(".battle, .modal-overlay, .league-intro")) { setTimeout(whenClear, 600); return; }
      const ico = U.energyIcon(t.type);
      let ctrl;
      const body = el("div", { class: "modal-form" }, [
        el("p", { class: "hint" }, "❗ On your way out of the gym, a challenger blocks the path!"),
        el("div", { class: "enc-hero" }, [
          ico ? el("img", { class: "enc-ico", src: ico, alt: t.type }) : null,
          el("div", {}, [el("div", { class: "enc-name" }, t.name), el("div", { class: "enc-title" }, t.title)]),
        ]),
        el("div", { class: "enc-quote" }, "“" + t.quote + "”"),
        el("div", { class: "toolbar" }, [
          el("button", { class: "btn primary", onClick: () => { if (ctrl) ctrl.close(); if (window.SFX) SFX.fanfare && SFX.fanfare(); startEncounter(attId, t); } }, "⚔ Accept"),
          el("button", { class: "btn subtle", onClick: () => { if (ctrl) ctrl.close(); } }, "Walk away"),
        ]),
      ]);
      ctrl = Modal.open("A challenger appears!", body, null, { noFooter: true });
    })();
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
            onResult: () => { Router.render(); maybeEncounter(attId); } });
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
      el("p", { class: "page-sub" }, "68 Gym Leaders & Island Kahunas across nine regions — Johto & Kanto, Hoenn, Sinnoh, Unova, Kalos, Alola's Island Challenge, Galar and Paldea. Leaders bring their grown-up REMATCH squads." ),
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
      { name: "Unova", emoji: "🏙", note: "Earn all 8 to face the Unova Elite Four." },
      { name: "Kalos", emoji: "🗼", note: "Earn all 8 to face the Kalos Elite Four." },
      { name: "Alola", emoji: "🌺", note: "The Island Challenge — best all 4 Kahunas to face the Alola Elite Four." },
      { name: "Galar", emoji: "⚽", note: "Earn all 8 to enter the Galar Champion Cup." },
      { name: "Paldea", emoji: "🍊", note: "Earn all 8 to face the Paldea Elite Four." },
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
  // Shared with the combined Regions view: a gym card + region→gym-index lookup.
  window.GymCircuit = {
    GYMS: GYMS,
    card: circuitCard,
    idxsForRegion: function (name) { return GYMS.map(function (g, i) { return i; }).filter(function (i) { return GYMS[i].region === name; }); },
  };
})();
