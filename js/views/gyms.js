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
  // ORDER MATTERS: the battle sends mons out left to right, so every team
  // lists the leader's REAL ACE in the LAST slot — Whitney's Miltank,
  // Surge's Raichu, Norman's Slaking — the boss saves their best for the end.
  const GYMS = [
    { leader: "FALKNER",   badge: "Zephyr",   type: "flying",   region: "Johto",  team: [164, 85, 430, 178, 22, 18] },
    { leader: "BUGSY",     badge: "Hive",     type: "bug",      region: "Johto",  team: [213, 15, 469, 127, 214, 212] },
    { leader: "WHITNEY",   badge: "Plain",    type: "normal",   region: "Johto",  team: [981, 162, 463, 53, 36, 241] },
    { leader: "MORTY",     badge: "Fog",      type: "ghost",    region: "Johto",  team: [429, 426, 442, 477, 302, 94] },
    { leader: "CHUCK",     badge: "Storm",    type: "fighting", region: "Johto",  team: [237, 107, 106, 979, 68, 62] },
    { leader: "JASMINE",   badge: "Mineral",  type: "steel",    region: "Johto",  team: [205, 227, 462, 462, 208] },
    { leader: "PRYCE",     badge: "Glacier",  type: "ice",      region: "Johto",  team: [87, 124, 91, 461, 131, 473] },
    { leader: "CLAIR",     badge: "Rising",   type: "dragon",   region: "Johto",  team: [130, 6, 142, 149, 149, 230] },
    { leader: "BROCK",     badge: "Boulder",  type: "rock",     region: "Kanto",  team: [76, 464, 139, 141, 208] },
    { leader: "MISTY",     badge: "Cascade",  type: "water",    region: "Kanto",  team: [55, 195, 131, 121] },
    { leader: "LT. SURGE", badge: "Thunder",  type: "electric", region: "Kanto",  team: [101, 462, 466, 26] },
    { leader: "ERIKA",     badge: "Rainbow",  type: "grass",    region: "Kanto",  team: [189, 182, 71, 465] },
    // 🔴🔵 Kanto runs the RED/BLUE track: KOGA holds Fuchsia (his daughter
    // Janine is the GSC-era stand-in) and GIOVANNI guards Viridian — the same
    // man who ambushes as Rocket Boss at badge 7, exactly like the cartridge.
    // He and Johto-E4 Koga are tracked by different keys, so the dual roles
    // never cross-credit (same as BLUE/BRUNO/LANCE).
    { leader: "KOGA",      badge: "Soul",     type: "poison",   region: "Kanto",  team: [109, 89, 49, 110] },
    { leader: "SABRINA",   badge: "Marsh",    type: "psychic",  region: "Kanto",  team: [196, 866, 65] },
    { leader: "BLAINE",    badge: "Volcano",  type: "fire",     region: "Kanto",  team: [219, 78, 467] },
    { leader: "GIOVANNI",  badge: "Earth",    type: "ground",   region: "Kanto",  team: [111, 51, 31, 34, 112] },
    // ---- Hoenn (idx 16-23) — needed before the Hoenn Elite Four ----
    { leader: "ROXANNE",   badge: "Stone",    type: "rock",     region: "Hoenn",  team: [76, 464, 409, 476] },
    { leader: "BRAWLY",    badge: "Knuckle",  type: "fighting", region: "Hoenn",  team: [68, 286, 214, 297] },
    { leader: "WATTSON",   badge: "Dynamo",   type: "electric", region: "Hoenn",  team: [462, 479, 101, 310] },
    { leader: "FLANNERY",  badge: "Heat",     type: "fire",     region: "Hoenn",  team: [323, 219, 229, 324] },
    { leader: "NORMAN",    badge: "Balance",  type: "normal",   region: "Hoenn",  team: [335, 295, 143, 289] },
    { leader: "WINONA",    badge: "Feather",  type: "flying",   region: "Hoenn",  team: [279, 277, 227, 357, 334] },
    { leader: "TATE&LIZA", badge: "Mind",     type: "psychic",  region: "Hoenn",  team: [344, 282, 178, 337, 338] },
    { leader: "JUAN",      badge: "Rain",     type: "water",    region: "Hoenn",  team: [350, 340, 342, 365, 230] },
    // ---- Sinnoh (idx 24-31) — needed before the Sinnoh Elite Four ----
    { leader: "ROARK",     badge: "Coal",     type: "rock",     region: "Sinnoh", team: [464, 76, 476, 409] },
    { leader: "GARDENIA",  badge: "Forest",   type: "grass",    region: "Sinnoh", team: [389, 421, 470, 407] },
    { leader: "MAYLENE",   badge: "Cobble",   type: "fighting", region: "Sinnoh", team: [68, 308, 214, 448] },
    { leader: "WAKE",      badge: "Fen",      type: "water",    region: "Sinnoh", team: [130, 195, 350, 419] },
    { leader: "FANTINA",   badge: "Relic",    type: "ghost",    region: "Sinnoh", team: [94, 426, 477, 429] },
    { leader: "BYRON",     badge: "Mine",     type: "steel",    region: "Sinnoh", team: [208, 437, 462, 411] },
    { leader: "CANDICE",   badge: "Icicle",   type: "ice",      region: "Sinnoh", team: [460, 471, 461, 473, 478] },
    { leader: "VOLKNER",   badge: "Beacon",   type: "electric", region: "Sinnoh", team: [405, 135, 26, 466] },
    // ---- Unova (Gen 5) ----
    { leader: "CHILI",     badge: "Trio",     type: "fire",     region: "Unova",  team: [609, 555, 631, 514] },
    { leader: "LENORA",    badge: "Basic",    type: "normal",   region: "Unova",  team: [508, 626, 573, 505] },
    { leader: "BURGH",     badge: "Insect",   type: "bug",      region: "Unova",  team: [545, 558, 617, 542] },
    { leader: "ELESA",     badge: "Bolt",     type: "electric", region: "Unova",  team: [587, 596, 604, 523] },
    { leader: "CLAY",      badge: "Quake",    type: "ground",   region: "Unova",  team: [553, 537, 623, 530] },
    { leader: "SKYLA",     badge: "Jet",      type: "flying",   region: "Unova",  team: [521, 561, 528, 581] },
    { leader: "BRYCEN",    badge: "Freeze",   type: "ice",      region: "Unova",  team: [615, 584, 473, 614] },
    { leader: "DRAYDEN",   badge: "Legend",   type: "dragon",   region: "Unova",  team: [621, 635, 149, 612] },
    // ---- Kalos (Gen 6) ----
    { leader: "VIOLA",     badge: "Bug",      type: "bug",      region: "Kalos",  team: [284, 214, 545, 666] },
    { leader: "GRANT",     badge: "Cliff",    type: "rock",     region: "Kalos",  team: [699, 411, 409, 697] },
    { leader: "KORRINA",   badge: "Rumble",   type: "fighting", region: "Kalos",  team: [701, 68, 620, 448] },
    { leader: "RAMOS",     badge: "Plant",    type: "grass",    region: "Kalos",  team: [709, 189, 549, 673] },
    { leader: "CLEMONT",   badge: "Voltage",  type: "electric", region: "Kalos",  team: [462, 587, 479, 695] },
    { leader: "VALERIE",   badge: "Fairy",    type: "fairy",    region: "Kalos",  team: [303, 671, 210, 700] },
    { leader: "OLYMPIA",   badge: "Psychic",  type: "psychic",  region: "Kalos",  team: [282, 561, 80, 678] },
    { leader: "WULFRIC",   badge: "Iceberg",  type: "ice",      region: "Kalos",  team: [460, 615, 461, 713] },
    // ---- Alola (Gen 7): the four Island Kahunas of the Island Challenge ----
    { leader: "HALA",      badge: "Melemele", type: "fighting", region: "Alola",  team: [297, 979, 760, 740] },
    { leader: "OLIVIA",    badge: "Akala",    type: "rock",     region: "Alola",  team: [476, 526, 76, 745] },
    { leader: "NANU",      badge: "Ula'ula",  type: "dark",     region: "Alola",  team: [302, 430, 553, 53] },
    { leader: "HAPU",      badge: "Poni",     type: "ground",   region: "Alola",  team: [330, 423, 623, 750] },
    // ---- Galar (Gen 8) ----
    { leader: "MILO",      badge: "Grass",    type: "grass",    region: "Galar",  team: [842, 547, 763, 830] },
    { leader: "NESSA",     badge: "Water",    type: "water",    region: "Galar",  team: [847, 279, 845, 834] },
    { leader: "KABU",      badge: "Fire",     type: "fire",     region: "Galar",  team: [59, 38, 668, 851] },
    { leader: "BEA",       badge: "Fighting", type: "fighting", region: "Galar",  team: [853, 870, 865, 68] },
    { leader: "ALLISTER",  badge: "Ghost",    type: "ghost",    region: "Galar",  team: [864, 867, 778, 94] },
    { leader: "OPAL",      badge: "Fairy",    type: "fairy",    region: "Galar",  team: [468, 110, 303, 869] },
    { leader: "GORDIE",    badge: "Rock",     type: "rock",     region: "Galar",  team: [874, 689, 526, 839] },
    { leader: "RAIHAN",    badge: "Dragon",   type: "dragon",   region: "Galar",  team: [330, 844, 776, 1018] },
    // ---- Paldea (Gen 9) ----
    { leader: "KATY",      badge: "Bug",      type: "bug",      region: "Paldea", team: [416, 168, 212, 918] },
    { leader: "BRASSIUS",  badge: "Grass",    type: "grass",    region: "Paldea", team: [930, 549, 556, 185] },
    { leader: "IONO",      badge: "Electric", type: "electric", region: "Paldea", team: [405, 429, 941, 939] },
    { leader: "KOFU",      badge: "Water",    type: "water",    region: "Paldea", team: [976, 961, 693, 740] },
    { leader: "LARRY",     badge: "Normal",   type: "normal",   region: "Paldea", team: [775, 982, 765, 398] },
    { leader: "RYME",      badge: "Ghost",    type: "ghost",    region: "Paldea", team: [354, 778, 426, 972] },
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

  // ❗ Post-gym challengers, two flavors:
  //   📖 STORY BATTLES — every canon boss & rival has a pinned moment on
  //   their own region's badge timeline (Silver in the Azalea shadows at
  //   Johto badge 2, N at the Ferris wheel at Unova badge 3, Cyrus at the
  //   Spear Pillar at Sinnoh badge 7…). The ambush is GUARANTEED once you
  //   reach the moment, and they come back after every badge until beaten.
  //   🎲 SURPRISES — otherwise ~28% of gym wins draw a challenger from THIS
  //   region's cast (era-true: no Nemona in Kanto), with Prof. Oak as the
  //   rare roaming wildcard anywhere.
  function startEncounter(attId, t, isStory) {
    const size = Math.min(6, Duel.poolFor(attId).length);
    if (size < 1) return;
    // 📖 True Story: the challenger scales with the badges you hold in their
    // region — both teams walk down to era-true forms at that level.
    const JS = window.JourneyStyle;
    const region = (t.story && t.story.region) || t.region || "";
    const lvl = (JS && JS.isStory(attId)) ? JS.encounterLevel(region, regionBadges(attId, region)) : 0;
    // 📖 Story battles devolve the squad — but the ACE (last slot) is the
    // trainer's signature and always fights in its TRUE form (Misty's
    // STARMIE at Lv24, exactly like the games).
    const foes = lvl ? t.team.map((id, i) => i === t.team.length - 1 ? id : JS.formAt(id, lvl)) : t.team.slice();
    Duel.pickParty({ attId: attId, min: 1, max: size, level: lvl || undefined,
      title: "vs " + t.title + " " + t.name + " — pick up to " + size,
      hint: (isStory ? "📖 A story battle! Pure glory — and they WILL be back until you win." :
        "A surprise battle! Bragging rights only — no badge, no rating.") +
        (lvl ? " (True Story: fought at Lv " + lvl + " — both teams step down to era-true forms.)" : ""),
      onDone: (ids, meta) => {
        Duel.start({ mode: "local", title: isStory ? "a story showdown" : "a surprise showdown",
          level: lvl || undefined,
          encounter: { foe: t.title + " " + t.name, who: t.name },
          a: { units: [{ attId: attId, defy: meta && meta.defiant,
            // ⚠ illegal picks fight in TRUE form (their disobedience is the tax)
            monIds: lvl ? ids.map((id) => (meta && meta.defiant && meta.defiant[id]) ? id : JS.formAt(id, lvl)) : ids }] },
          b: { units: [{ npc: t.name, ai: true, monIds: foes, boost: 1.12 }] },
          onResult: () => Router.render() });
      } });
  }
  function regionBadges(attId, region) {
    let n = 0;
    GYMS.forEach((g, i) => { if (g.region === region && Store.gymHolders(i).indexOf(attId) >= 0) n++; });
    return n;
  }
  function offerEncounter(attId, t, isStory) {
    let tries = 0;
    // Wait until the gym battle's own end screens (evolution / rematch) clear.
    (function whenClear() {
      if (++tries > 25 || !/^#\/gyms/.test(location.hash)) return;   // give up / left the page
      if (document.querySelector(".battle, .modal-overlay, .league-intro")) { setTimeout(whenClear, 600); return; }
      const ico = U.energyIcon(t.type);
      let ctrl;
      const body = el("div", { class: "modal-form" }, [
        el("p", { class: "hint" }, isStory && t.story ? "📖 " + t.story.intro : "❗ On your way out of the gym, a challenger blocks the path!"),
        el("div", { class: "enc-hero" }, [
          ico ? el("img", { class: "enc-ico", src: ico, alt: t.type }) : null,
          el("div", {}, [el("div", { class: "enc-name" }, t.name), el("div", { class: "enc-title" }, t.title)]),
        ]),
        el("div", { class: "enc-quote" }, "“" + t.quote + "”"),
        el("div", { class: "toolbar" }, [
          el("button", { class: "btn primary", onClick: () => { if (ctrl) ctrl.close(); if (window.SFX) SFX.fanfare && SFX.fanfare(); startEncounter(attId, t, isStory); } }, "⚔ Accept"),
          el("button", { class: "btn subtle", onClick: () => { if (ctrl) ctrl.close(); } }, isStory ? "Not now (they'll be back)" : "Walk away"),
        ]),
      ]);
      ctrl = Modal.open(isStory ? "📖 The story finds you!" : "A challenger appears!", body, null, { noFooter: true });
    })();
  }
  function maybeEncounter(attId, gymIdx) {
    const pool = window.CANON_TRAINERS || [];
    if (!pool.length || Duel.poolFor(attId).length < 1) return;
    const region = (GYMS[gymIdx] || {}).region || "";
    const have = regionBadges(attId, region);
    const beaten = Store.encounterWins ? Store.encounterWins(attId) : [];
    // 📖 A story moment reached (and its trainer still undefeated) always
    // fires — earliest moment first if a backlog has built up.
    const story = pool.filter((t) => t.story && t.story.region === region &&
      have >= t.story.badge && beaten.indexOf(t.name) < 0)
      .sort((a, b) => a.story.badge - b.story.badge)[0];
    if (story) { offerEncounter(attId, story, true); return; }
    // 🎲 Era-true surprise: this region's cast — or, rarely, the professor.
    if (Math.random() > 0.28) return;
    const oak = pool.find((t) => t.name === "PROF. OAK");
    const local = pool.filter((t) => ((t.story && t.story.region) || t.region) === region && t !== oak);
    const t = (oak && Math.random() < 0.08) ? oak : local[Math.floor(Math.random() * local.length)];
    if (!t) return;
    offerEncounter(attId, t, false);
  }

  // 🧭 The Gen Ladder: a region's gyms open only after the PREVIOUS region's
  // Champion falls, in order (Johto & Kanto are the free starting block).
  // Checked via the ladder cap so out-of-order wins can never skip a region.
  const REGION_NEEDS = { Kanto: null,
    Johto: { gen: 2, name: "BLUE" },
    Hoenn: { gen: 3, name: "LANCE" }, Sinnoh: { gen: 4, name: "STEVEN" },
    Unova: { gen: 5, name: "CYNTHIA" }, Kalos: { gen: 6, name: "ALDER" },
    Alola: { gen: 7, name: "DIANTHA" }, Galar: { gen: 8, name: "PROF. KUKUI" },
    Paldea: { gen: 9, name: "LEON" } };
  // The reason this trainer can't fight here yet, or "" when open.
  function gymLockedWhy(idx, attId) {
    const need = REGION_NEEDS[GYMS[idx].region];
    if (!need || !attId) return "";
    const cap = (Store.genCapFor ? Store.genCapFor(attId) : 9);
    return cap >= need.gen ? ""
      : "The road to " + GYMS[idx].region + " opens when you beat Champion " + need.name + " (The Journey).";
  }

  function challengeGym(idx) {
    const gym = GYMS[idx];
    const size = gym.team.length;
    const go = (attId) => {
      const why = gymLockedWhy(idx, attId);
      if (why) { alert("🔒 " + why); return; }
      if (Duel.poolFor(attId).length < size) {
        alert("Leader " + gym.leader + " runs " + size + " Pokémon — you need " + size + " of your own to challenge (catch more in the Safari!).");
        return;
      }
      // 📖 True Story: the gym fights at its badge's story level — BOTH teams
      // (the leader's rematch squad and your picks) step down to era-true
      // forms, and the level trims movesets to what it would really know.
      const JS = window.JourneyStyle;
      const lvl = (JS && JS.isStory(attId)) ? JS.gymLevel(idx) : 0;
      // 📖 devolve the squad, but the leader's ACE (last slot) stays TRUE
      const foes = lvl ? gym.team.map((id, i) => i === gym.team.length - 1 ? id : JS.formAt(id, lvl)) : gym.team.slice();
      Duel.pickParty({ attId: attId, min: size, max: size, level: lvl || undefined,
        title: "vs Leader " + gym.leader + " — pick EXACTLY " + size,
        hint: "Even match: " + size + " vs " + size + ". The leader's team is HIDDEN until it comes out of the ball." +
          (lvl ? " 📖 True Story: fought at Lv " + lvl + " — both teams step down to era-true forms." : ""),
        onDone: (ids, meta) => {
          Duel.start({ mode: "local", title: "the " + gym.badge + " Badge Gym", gym: { idx: idx, leader: gym.leader, badge: gym.badge },
            level: lvl || undefined,
            a: { units: [{ attId: attId, defy: meta && meta.defiant,
              // ⚠ illegal picks fight in TRUE form (their disobedience is the tax)
              monIds: lvl ? ids.map((id) => (meta && meta.defiant && meta.defiant[id]) ? id : JS.formAt(id, lvl)) : ids }] },
            b: { units: [{ npc: "LEADER " + gym.leader, ai: true, monIds: foes }] },
            onResult: () => { Router.render(); maybeEncounter(attId, idx); } });
        } });
    };
    const me = window.Sync && Sync.getMe && Sync.getMe();
    if (me) go(me); else openPicker("Who challenges Leader " + gym.leader + "?", (a) => go(a.id));
  }

  // attId (optional) locks the card for THAT trainer's Gen Ladder progress;
  // without it the lock is enforced at challenge time instead.
  function circuitCard(idx, attId) {
    const g = GYMS[idx];
    const holders = Store.gymHolders(idx);
    const ico = U.energyIcon(g.type);
    const why = gymLockedWhy(idx, attId || (window.Sync && Sync.getMe && Sync.getMe()) || "");
    return el("div", { class: "gymc-card" + (holders.length ? " earned" : "") + (why ? " locked" : "") }, [
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
      why ? el("div", { class: "gymc-lock" }, "🔒 " + why)
          : el("button", { class: "btn primary sm", onClick: () => challengeGym(idx) }, "⚔ Challenge (" + g.team.length + "v" + g.team.length +
              (function () {   // 📖 True Story shows each badge's story level up front
                const me = attId || (window.Sync && Sync.getMe && Sync.getMe()) || "";
                return (window.JourneyStyle && me && JourneyStyle.isStory(me)) ? " · Lv " + JourneyStyle.gymLevel(idx) : "";
              })() + ")"),
    ]);
  }

  function view(root) {
    root.appendChild(el("div", { class: "page-head" }, [
      el("h1", {}, "🏟 Gym Circuit"),
      el("p", { class: "page-sub" }, "68 Gym Leaders & Island Kahunas across nine regions — Johto & Kanto, Hoenn, Sinnoh, Unova, Kalos, Alola's Island Challenge, Galar and Paldea. Leaders bring their grown-up REMATCH squads." ),
    ]));

    const totalBadges = (Store.state.attendees || []).reduce((n, a) => n + Store.gymBadgeCount(a.id), 0);
    root.appendChild(el("p", { class: "hint" },
      "🧭 THE GEN LADDER: start in KANTO with Gen 1 in the wild. Beat Champion BLUE to open Johto and spill Gen 2 into the Safari; from there each region opens when you beat the PREVIOUS region's Champion in The Journey — and its generation of Pokémon comes with it. Even match: bring EXACTLY as many Pokémon as the leader runs." +
      (totalBadges ? " (" + totalBadges + " badge" + (totalBadges > 1 ? "s" : "") + " earned so far.)" : "")));

    // ⚔/📖 The style switch — how the whole circuit (and the League) fights you.
    (function styleRow() {
      const me = (window.Sync && Sync.getMe && Sync.getMe()) || (Store.state.attendees[0] || {}).id || "";
      if (me && window.JourneyStyle) root.appendChild(JourneyStyle.row(me));
    })();

    // Group the circuit by region so 32 gyms stay readable.
    const REGIONS = [
      { name: "Kanto", emoji: "🗾", note: "Where it all began — 8 badges open the door to the KANTO Elite Four and Champion BLUE." },
      { name: "Johto", emoji: "🌸", note: "The Gen 2 era — opens once Champion BLUE falls. All 16 badges = CHAMPION crusher (and RED demands the full sweep)." },
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
