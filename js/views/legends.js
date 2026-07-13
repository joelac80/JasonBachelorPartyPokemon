/* legends.js — 🌌 The Legendary & Mythical Challenge. The post-league endgame:
   once you've toppled a region's Champion, its generation's legendaries rise to
   test you — a full 6v6 against the titans, mascots and mythicals of that gen.
   Clear all nine to become a Legend Keeper. Pure glory: a win is recorded per
   trainer per generation (append-only, sync-unioned) for the wall and a ceremony
   honor. Reuses the League stage styling; folds into the Journey per region. */
(function () {
  const { el } = U;
  const SP = window.DEX_SPRITES || {};
  function sfx(n) { if (window.SFX && SFX[n]) SFX[n](); }

  // One trial per generation. `needs` is the Champion league-key that unlocks it
  // (beat that Champion and the titans appear). `regions` places the trial in the
  // matching Journey tab. Teams are that generation's legendaries + a mythical,
  // ace last. Boost/points climb with the generation — this is the hardest PvE.
  const LEGENDS = [
    { key: "gen1", gen: 1, name: "Kanto Titans", emoji: "🔮", needs: "blue", champ: "BLUE", regions: ["Kanto"],
      team: [144, 145, 146, 151, 149, 150], face: 150, boost: 1.42, pts: 20,
      quote: "The Genetic Pokémon awakens, and the winged titans of ice, storm and flame answer. Prove a bond can outmatch raw creation.",
      winChron: "tamed the Kanto titans — MEWTWO itself bowed!", loseChron: "the Kanto titans proved unmatched",
      lead: "🔮 Articuno, Zapdos, Moltres, Mew and Dragonite — and MEWTWO, the perfect Pokémon." },
    { key: "gen2", gen: 2, name: "Johto Beasts", emoji: "🌈", needs: "lance", champ: "LANCE", regions: ["Johto"],
      team: [243, 244, 245, 250, 251, 249], face: 249, boost: 1.44, pts: 22,
      quote: "The three legendary beasts race the wind, the guardians of the towers spread their wings. Time itself sent Celebi to watch you fall.",
      winChron: "outran the Johto beasts and grounded LUGIA and HO-OH!", loseChron: "the Johto beasts vanished into legend",
      lead: "🌈 Raikou, Entei, Suicune, Ho-Oh and Celebi — and LUGIA, the guardian of the sea." },
    { key: "gen3", gen: 3, name: "Hoenn Weather Trio", emoji: "🌊", needs: "steven", champ: "STEVEN", regions: ["Hoenn"],
      team: [377, 378, 379, 382, 383, 384], face: 384, boost: 1.46, pts: 24,
      quote: "The land rises, the sea swells, and the sky splits open. Only the Delta Emerald can settle who rules the heavens.",
      winChron: "quelled the Hoenn superancients — RAYQUAZA yielded the sky!", loseChron: "the weather trio drowned another challenger",
      lead: "🌊 Regirock, Regice, Registeel, Kyogre and Groudon — and RAYQUAZA, lord of the skies." },
    { key: "gen4", gen: 4, name: "Sinnoh Creation Trio", emoji: "🌌", needs: "cynthia", champ: "CYNTHIA", regions: ["Sinnoh"],
      team: [483, 484, 487, 485, 491, 493], face: 493, boost: 1.48, pts: 26,
      quote: "Time, Space, and Antimatter converge — and the Original One that shaped them all descends to judge you.",
      winChron: "unmade the Sinnoh creation trio — even ARCEUS knelt!", loseChron: "the creation trio erased another hope",
      lead: "🌌 Dialga, Palkia, Giratina, Heatran and Darkrai — and ARCEUS, the Original One." },
    { key: "gen5", gen: 5, name: "Unova Tao Trio", emoji: "⚡", needs: "alder", champ: "ALDER", regions: ["Unova"],
      team: [638, 639, 640, 643, 644, 646], face: 646, boost: 1.50, pts: 28,
      quote: "Truth and Ideals burn and spark, the Swords of Justice stand guard — and the empty shell of Kyurem hungers for both.",
      winChron: "shattered the Unova tao dragons — KYUREM froze over!", loseChron: "the tao dragons judged another wanting",
      lead: "⚡ Cobalion, Terrakion, Virizion, Reshiram and Zekrom — and KYUREM, the boundary." },
    { key: "gen6", gen: 6, name: "Kalos Life & Death", emoji: "🦌", needs: "diantha", champ: "DIANTHA", regions: ["Kalos"],
      team: [719, 720, 721, 716, 717, 718], face: 718, boost: 1.52, pts: 30,
      quote: "Life eternal and destruction absolute, bound by the serpent of order. The jewel, the genie and the kettle attend.",
      winChron: "balanced the Kalos legends — ZYGARDE enforced no order here!", loseChron: "life and death reclaimed another",
      lead: "🦌 Diancie, Hoopa, Volcanion, Xerneas and Yveltal — and ZYGARDE, the order between." },
    { key: "gen7", gen: 7, name: "Alola Guardians", emoji: "🌞", needs: "kukui", champ: "KUKUI", regions: ["Alola"],
      team: [785, 791, 792, 801, 802, 800], face: 800, boost: 1.54, pts: 32,
      quote: "Sun and Moon blaze in the sky, the island guardian crackles, and the prism that devours light unfolds its blades.",
      winChron: "eclipsed the Alola cosmos — NECROZMA's light returned!", loseChron: "the blinding one swallowed another dawn",
      lead: "🌞 Tapu Koko, Solgaleo, Lunala, Magearna and Marshadow — and NECROZMA, the light-eater." },
    { key: "gen8", gen: 8, name: "Galar Heroes", emoji: "⚔️", needs: "leon", champ: "LEON", regions: ["Galar"],
      team: [888, 889, 890, 894, 895, 898], face: 898, boost: 1.56, pts: 34,
      quote: "The Fairy King's swords are drawn, the endless one coils in the crater, and the frozen monarch mounts his steed.",
      winChron: "dethroned the Galar monarchs — CALYREX lost its crown!", loseChron: "the crowned king unmade another reign",
      lead: "⚔️ Zacian, Zamazenta, Eternatus, Regieleki and Regidrago — and CALYREX, the King of Bountiful Harvests." },
    { key: "gen9", gen: 9, name: "Paldea Paradox", emoji: "🟣", needs: "geeta", champ: "GEETA", regions: ["Paldea"],
      team: [1001, 1002, 1003, 1004, 1007, 1008], face: 1008, boost: 1.58, pts: 36,
      quote: "The Treasures of Ruin break their seals, and the paradox of past and future thunders out of Area Zero. The final trial.",
      winChron: "conquered the Paldea paradox — the last legend fell!", loseChron: "the paradox devoured another future",
      lead: "🟣 Wo-Chien, Chien-Pao, Ting-Lu, Chi-Yu and Koraidon — and MIRAIDON, the Iron Serpent." },
  ];
  window.LEGEND_CHALLENGES = LEGENDS;

  // Unlocked once this trainer has toppled the gating Champion.
  function unlocked(lg, attId) { return Store.leagueWins(attId).indexOf(lg.needs) >= 0; }

  // 🐍 REGION SPECIALS — one-off legendary boss battles beyond the per-gen
  // challenges, each mounted on its era's Journey tab. Gated on that region's
  // Champion (raw league win) — except the Clash of Ages, the capstone that
  // demands ALL NINE Legendary Challenges. Wins record to s.secrets[att].
  const SPECIALS = [
    { key: "zygarde", tab: "Kalos", name: "THE ORDER OF KALOS", flair: "KALOS SPECIAL · Forms of Zygarde",
      sub: "Kalos Special · Zygarde's forms + Xerneas & Yveltal · 5v5",
      icon: "🐍", face: 10120, boost: 1.52, pts: 30, needs: "diantha", champ: "DIANTHA",
      team: [716, 717, 10118, 718, 10120],
      quote: "Life blooms. Destruction circles. And beneath Kalos the cells stir — ten percent, fifty… until the ecosystem's guardian stands COMPLETE. Disturb the balance, and answer to ORDER itself.",
      winChron: "restored the ORDER OF KALOS — Xerneas, Yveltal and every form of ZYGARDE, felled in one stand!",
      loseChron: "ZYGARDE COMPLETE judged the balance undisturbed",
      lead: "🐍 Xerneas and Yveltal — then Zygarde rises: 10%, 50%, and the COMPLETE form." },
    { key: "vigil", tab: "Sinnoh", name: "THE SINNOH VIGIL", flair: "SINNOH SPECIAL · Spirits of Lake & Moon",
      sub: "Sinnoh Special · The lake spirits, moonlight, the sea's prince & the Colossus · 6v6",
      icon: "🌙", face: 486, boost: 1.48, pts: 28, needs: "cynthia", champ: "CYNTHIA",
      team: [480, 481, 482, 488, 490, 486],
      quote: "Knowledge, Emotion and Willpower rise from their lakes. The crescent moon keeps the nightmares out, the Prince of the Sea sings — and the Colossus that towed the continents WAKES.",
      winChron: "kept the SINNOH VIGIL — the lake spirits, Cresselia, Manaphy and REGIGIGAS all fell!",
      loseChron: "the Vigil of Sinnoh stood unbroken",
      lead: "🌙 Uxie, Mesprit and Azelf — then Cresselia and Manaphy, and REGIGIGAS, the sleeping Colossus." },
    { key: "nobles", tab: "Sinnoh", name: "THE FRENZIED NOBLES", flair: "HISUI SPECIAL · Lords & Ladies of Old",
      sub: "Hisui Special · Through the rift — the five frenzied Nobles of ancient Sinnoh · 5v5",
      icon: "🏔", face: 900, boost: 1.46, pts: 30, needs: "cynthia", champ: "CYNTHIA",
      team: [900, 10237, 10230, 10232, 10243],
      quote: "Lightning splits the old sky and the wardens cry out — the Nobles are FRENZIED, golden and blind with it. Kleavor rages in the fieldlands. Calm them the only way this era knows how.",
      outro: { lose: "The golden light fades… the Nobles kneel, calm at last. The wardens will sing of this.",
        win: "The frenzy takes the fieldlands. Run, trainer — and come back braver." },
      winChron: "quelled all five FRENZIED NOBLES of Hisui — Kleavor's rage broke first, Avalugg's last!",
      loseChron: "the frenzied Nobles of Hisui raged on",
      lead: "🏔 Lord Kleavor, Lady Lilligant, Lord Arcanine, Lord Electrode and Lord Avalugg — all five, golden-eyed and frenzied." },
    { key: "volo", tab: "Sinnoh", name: "VOLO", flair: "SINNOH SPECIAL · The Ginkgo Guild Merchant",
      sub: "Sinnoh Special · The friendly antique dealer finally shows his hand · 6v6…?",
      icon: "⚱️", face: 445, boost: 1.42, pts: 34, needs: "cynthia", champ: "CYNTHIA", after: "nobles",
      // What the card admits to: six. What he's hiding behind his back: the
      // Renegade — twice. Party order IS the script: Garchomp 6th ("that's his
      // ace, it's over"), then Giratina Altered, then… Origin.
      team: [442, 407, 468, 10230, 448, 445, 487, 10007],
      playerSize: 6, reserve: 2,
      speak: {
        6: ["No… no, this isn't how it ends. I've dug too deep, waited too long, come too FAR!",
            "The Renegade heeds ME now. From beyond the veil — GIRATINA!"],
        7: ["Hah… hahaha! You thought that was the end? That it was finally over?!",
            "Giratina fell once before and returned CHANGED — behold its ORIGIN FORME!"],
      },
      quote: "Lovely weather for a dig, isn't it? I've traded plates, pored over myths, smiled at every passing trainer… all for this moment. Show me everything you have — and I will show you what I've been keeping behind my smile.",
      outro: { lose: "…all of it. The plates, the myths, the smile — and it still wasn't enough. Keep your world, then. For now.",
        win: "Ah — don't look so crushed. Every relic I own was taken from someone who thought they'd win." },
      loseChron: "VOLO tucked his relics away, smiling — 'another time, perhaps'",
      lead: "⚱️ Spiritomb, Roserade, Togekiss, Hisuian Arcanine, Lucario… and a Garchomp to rival Cynthia's. Surely that's everything. Surely." },
    { key: "almighty", tab: "Sinnoh", name: "THE ALMIGHTY SINNOH", flair: "HISUI SPECIAL · Origins of Time & Space",
      sub: "Hisui Special · The true forms of the creation dragons — and whatever spoke through the rift · 3v3…?",
      icon: "⏳", face: 10245, boost: 1.55, pts: 38, needs: "cynthia", champ: "CYNTHIA", after: "volo",
      // The card admits to the two dragons + one more slot. The one more slot
      // is the voice from the rift itself.
      team: [10245, 10246, 493],
      playerSize: 3, reserve: 1,
      speak: {
        2: ["THE DRAGONS OF TIME AND SPACE KNEEL. THE WORLD HOLDS ITS BREATH.",
            "I AM THE ONE WHO SPOKE THROUGH THE RIFT. I AM ARCEUS — AND I AM NOT DONE WITH YOU."],
      },
      quote: "Atop the Temple of Sinnoh the sky splits twice — once for TIME, once for SPACE. The mountain folk call what stands behind them 'almighty Sinnoh'. You have heard its voice already. Now answer it.",
      outro: { lose: "IT IS ENOUGH. YOU ARE THE ONE I CALLED THROUGH THE RIFT. WALK YOUR ERA PROUDLY, CHOSEN ONE.",
        win: "TIME BENDS. SPACE FOLDS. RETURN WHEN YOUR SPIRIT WEIGHS MORE THAN YOUR AMBITION." },
      winChron: "conquered THE ALMIGHTY SINNOH — Origin Dialga, Origin Palkia… and ARCEUS itself answered!",
      loseChron: "time and space closed over another challenger",
      lead: "⏳ Origin Dialga bends the hours, Origin Palkia folds the miles. And the third ball on their belt… is not a ball." },
    { key: "myths", tab: "Unova", name: "THE MYTHS OF UNOVA", flair: "UNOVA SPECIAL · Songs & Storms",
      sub: "Unova Special · The storm genies, the colt, the song — and the landlord · 5v5",
      icon: "🎵", face: 645, boost: 1.50, pts: 28, needs: "alder", champ: "ALDER",
      team: [641, 642, 647, 648, 645],
      quote: "Two genies wreck the skies while a colt of justice and a living melody try to hold the line — until the Abundance itself descends to settle the storm.",
      winChron: "quieted the MYTHS OF UNOVA — genies grounded, the song stilled, LANDORUS bowed!",
      loseChron: "Unova's storms howled another challenger away",
      lead: "🎵 Tornadus and Thundurus tearing the sky, Keldeo and Meloetta holding the line — and LANDORUS to end it." },
    { key: "tapus", tab: "Alola", name: "THE ISLAND GUARDIANS", flair: "ALOLA SPECIAL · Rites of the Tapu",
      sub: "Alola Special · All four island Tapus, the chimera & the thunderclap · 6v6",
      icon: "🗿", face: 807, boost: 1.54, pts: 32, needs: "kukui", champ: "PROF. KUKUI",
      team: [785, 786, 787, 788, 773, 807],
      quote: "Four islands, four guardians — war, wisdom, harvest and tide. A chimera built to kill monsters joins their rite, and the thunderclap Pokémon answers no master. Show respect… or be shown out.",
      winChron: "passed the RITES OF THE TAPU — all four guardians, Silvally and ZERAORA honored the win!",
      loseChron: "the island guardians rejected another offering",
      lead: "🗿 Tapu Koko, Lele, Bulu and Fini — with Silvally, the type-shifting chimera, and ZERAORA, the thunderclap." },
    { key: "ultra", tab: "Alola", name: "THE ULTRA RIFT", flair: "ALOLA SPECIAL · Beasts from Beyond",
      sub: "Alola Special · Ultra Beasts pour through the wormhole — and the light-eater ascends · 6v6",
      icon: "☄️", face: 10157, boost: 1.56, pts: 34, needs: "kukui", champ: "PROF. KUKUI",
      team: [793, 794, 796, 797, 799, 10157],
      quote: "The sky tears open and the beasts of Ultra Space pour through — parasite, swollen fist, living wire, rocket hull, glutton. And behind them all, drowned in stolen light… ULTRA NECROZMA.",
      winChron: "sealed the ULTRA RIFT — five Ultra Beasts down, and ULTRA NECROZMA's light returned!",
      loseChron: "the Rift swallowed another world's champion",
      lead: "☄️ Nihilego, Buzzwole, Xurkitree, Celesteela and Guzzlord — then ULTRA NECROZMA, blinding and absolute." },
    { key: "monarchs", tab: "Galar", name: "MYTHS & MONARCHS", flair: "GALAR SPECIAL · The Uncrowned",
      sub: "Galar Special · The unseen myths and riderless monarchs of the Crown · 6v6",
      icon: "👊", face: 809, boost: 1.56, pts: 34, needs: "leon", champ: "LEON",
      team: [893, 896, 897, 905, 892, 809],
      quote: "A jungle guardian who trusts no one, two riderless steeds of ice and shadow, a fury bottled in a whirlwind, a fist that strikes in a single blow — and the liquid-metal titan a thousand years in the making.",
      winChron: "felled Galar's MYTHS & MONARCHS — Zarude, both steeds, Enamorus, Urshifu and MELMETAL!",
      loseChron: "the uncrowned monarchs kept their myths",
      lead: "👊 Zarude, Glastrier and Spectrier, Enamorus and Urshifu — and MELMETAL, the hex-nut titan." },
    { key: "dlc", tab: "Paldea", name: "THE TEAL MASK & INDIGO DISK", flair: "PALDEA SPECIAL · Kitakami & Blueberry",
      sub: "Paldea Special · The Loyal Three, the ogre, the poison behind it all — and Terapagos · 6v6",
      icon: "🎭", face: 1024, boost: 1.58, pts: 36, needs: "geeta", champ: "GEETA",
      team: [1014, 1015, 1016, 1025, 1017, 1024],
      quote: "The village sings of three loyal heroes… but the mask tells another story. The ogre was the hero, the poison pulled the strings — and beneath the academy, the crystal turtle holds the Terastal secret.",
      winChron: "unmasked Kitakami and cracked the Indigo Disk — the Loyal Three, Pecharunt, Ogerpon and TERAPAGOS!",
      loseChron: "the mask stayed on and the disk stayed sealed",
      lead: "🎭 Okidogi, Munkidori and Fezandipiti — Pecharunt's puppets — then OGERPON unmasked, and TERAPAGOS, the Terastal heart." },
    { key: "paradox", tab: "Paldea", name: "THE PARADOX GAUNTLET", flair: "PALDEA SPECIAL · Area Zero, Unstuck in Time",
      sub: "Paldea Special · Three trials: the deep past, the far future — then the crystal heart of Area Zero · one squad",
      icon: "⏰", face: 1024, boost: 1.5, pts: 38, needs: "geeta", champ: "GEETA", after: "dlc",
      gauntlet: true,   // three back-to-back battles — challengeParadox runs it
      // Trial 3's script: Terapagos looks like one little turtle… then
      // TERASTALLIZES (10276), then goes STELLAR (10277) — the final test.
      team: [1024, 10276, 10277],
      quote: "The time machine hums at the bottom of Area Zero. Step in, and it tears you loose — a jungle that predates history, a chrome world that hasn't happened yet, and in both… someone wearing the professor's face. Survive them, and the crystal heart of the crater itself will test you.",
      winChron: "survived THE PARADOX GAUNTLET — both professors' paradoxes fell, and TERAPAGOS terastallized in vain!",
      loseChron: "the timeline snapped shut on another traveler",
      lead: "⏰ Professor SADA commands the ancient beasts. Professor TURO fields the iron future. And beneath it all waits TERAPAGOS — small, patient, and hiding two more forms." },
    { key: "hoopa", tab: "Paldea", name: "THE CLASH OF AGES", flair: "CAPSTONE · Hoopa & the Clash of Ages",
      sub: "Capstone · Hoopa Unbound tears open its rings and summons the ages · 6v6",
      icon: "🌀", face: 10086, boost: 1.60, pts: 40, gate: "legends9",
      team: [381, 249, 10078, 10077, 384, 10086],
      quote: "A hundred years in a bottle, and the djinn remembers everything. The rings open — Latios, Lugia, the primal land and sea, the sky serpent — every age you ever conquered, summoned back at once. UNBOUND.",
      winChron: "won the CLASH OF AGES — Hoopa Unbound's every summons fell, and the rings closed for good!",
      loseChron: "the rings of HOOPA UNBOUND swallowed another age",
      lead: "🌀 Latios, Lugia, PRIMAL Groudon and Kyogre, Mega Rayquaza's wild ancestor sky-lord Rayquaza — and HOOPA UNBOUND itself." },
  ];

  function specialOpen(sp, attId) {
    if (!attId) return false;
    if (sp.gate === "legends9") return (Store.legendWins(attId) || []).length >= 9;
    if (Store.leagueWins(attId).indexOf(sp.needs) < 0) return false;
    // Chained specials: `after` names a secret that must fall first
    // (the Almighty Sinnoh only answers the keeper of the Nobles).
    if (sp.after && Store.secretWins(attId).indexOf(sp.after) < 0) return false;
    return true;
  }
  function specialLockText(sp) {
    if (sp.gate === "legends9") return "Conquer all NINE Legendary Challenges to tear open the rings.";
    if (sp.after === "nobles") return "Quell THE FRENZIED NOBLES first — the merchant only shows his hand to Hisui's savior.";
    if (sp.after === "volo") return "Unmask VOLO first — the temple only answers the one who saw through the smile.";
    if (sp.after === "dlc") return "Crack THE TEAL MASK & INDIGO DISK first — the time machine only answers the disk's keeper.";
    if (sp.after) return "Another trial stands before this one.";
    return "Beat " + (sp.needs === "geeta" ? "Top Champion" : "Champion") + " " + sp.champ + " to disturb the balance.";
  }

  function specialIntro(sp, onGo) {
    const src = SP[sp.face] || Store.sprite(sp.face);
    const n = sp.playerSize || sp.team.length;   // hidden reserves don't advertise
    const lay = el("div", { class: "league-intro final legend-intro" }, [
      el("div", { class: "league-intro-inner" }, [
        src ? el("img", { class: "league-intro-ico legend-boss-ico", src: src, alt: "" }) : el("div", { class: "league-intro-mt" }, sp.icon),
        el("div", { class: "league-intro-flair" }, sp.icon + " " + sp.flair),
        el("div", { class: "league-intro-rank" }, sp.name),
        el("div", { class: "league-intro-name" }, sp.icon + " " + n + " v " + n),
        el("div", { class: "league-intro-quote" }, "“" + sp.quote + "”"),
        el("div", { class: "toolbar", style: { justifyContent: "center" } }, [
          el("button", { class: "btn spin-btn", onClick: () => { lay.remove(); onGo(); } }, sp.icon + " FACE " + sp.name),
          el("button", { class: "btn subtle", onClick: () => lay.remove() }, "Not yet"),
        ]),
      ]),
    ]);
    document.body.appendChild(lay);
    sfx("fanfare");
    requestAnimationFrame(() => lay.classList.add("go"));
  }

  function challengeSpecial(sp, attId) {
    const size = sp.playerSize || sp.team.length;
    if (Duel.poolFor(attId).length < size) { alert(sp.name + " fields " + size + " — catch " + size + " of your own first (Safari Zone)."); return; }
    specialIntro(sp, () => {
      Duel.pickParty({ attId: attId, min: size, max: size,
        title: "vs " + sp.name + " — pick EXACTLY " + size,
        hint: sp.icon + " " + size + "v" + size + " — the lineup is hidden, and they hit like gods. Bring your very best.",
        onDone: (ids) => {
          Duel.start({ mode: "local", title: sp.name.toLowerCase(),
            secret: { key: sp.key, name: sp.name, pts: sp.pts, icon: sp.icon, winChron: sp.winChron, loseChron: sp.loseChron },
            a: { units: [{ attId: attId, monIds: ids }] },
            // reserve/speak/outro: hidden reveals, mid-battle lines and the
            // boss's closing quote (Volo's Giratina, Arceus's judgment…).
            b: { units: [{ npc: sp.name, ai: true, monIds: sp.team.slice(), boost: sp.boost, vsFace: sp.face,
              reserve: sp.reserve || 0, speak: sp.speak || null, ace: sp.ace || null, outro: sp.outro || null }] },
            onResult: () => Router.render() });
        } });
    });
  }

  // ⏰ THE PARADOX GAUNTLET — three battles back-to-back with ONE squad
  // (healed between): the deep past, the far future, then the crystal heart.
  // Only the finale records the secret; falling anywhere ends the run.
  const PARADOX_TRIALS = [
    { name: "PROFESSOR SADA", flair: "🦕 TRIAL 1 · THE DEEP PAST", face: 1005, boost: 1.46,
      team: [984, 985, 986, 987, 989, 1005],   // Great Tusk → Roaring Moon
      quote: "Welcome to the world before history. I am — I was — Professor Sada. My beasts have never known a trainer… only prey.",
      outro: { lose: "Magnificent… the ancient world bows to you. But I am only an echo of the past. The future is far less kind.",
        win: "The past devours the unprepared. Crawl back to your own era." } },
    { name: "PROFESSOR TURO", flair: "🤖 TRIAL 2 · THE FAR FUTURE", face: 1006, boost: 1.5,
      team: [990, 991, 992, 993, 994, 1006],   // Iron Treads → Iron Valiant
      quote: "Query: why do you persist? I am the paradigm of Professor Turo. My machines are what Pokémon become when time finishes with them.",
      outro: { lose: "Calculation complete… defeat acknowledged. What waits beneath the crater is beyond either of us. Go.",
        win: "The future has no room for you. Deleted." } },
  ];
  function eraIntro(t, onGo) {
    const src = t.face ? (SP[t.face] || Store.sprite(t.face)) : null;
    const lay = el("div", { class: "league-intro final legend-intro" }, [
      el("div", { class: "league-intro-inner" }, [
        src ? el("img", { class: "league-intro-ico legend-boss-ico", src: src, alt: "" }) : el("div", { class: "league-intro-mt" }, "⏰"),
        el("div", { class: "league-intro-flair" }, t.flair),
        el("div", { class: "league-intro-rank" }, t.name),
        el("div", { class: "league-intro-quote" }, "“" + t.quote + "”"),
        el("div", { class: "toolbar", style: { justifyContent: "center" } }, [
          el("button", { class: "btn spin-btn", onClick: () => { lay.remove(); onGo(); } }, "⏰ STEP THROUGH"),
          el("button", { class: "btn subtle", onClick: () => lay.remove() }, "Not yet"),
        ]),
      ]),
    ]);
    document.body.appendChild(lay);
    sfx("fanfare");
    requestAnimationFrame(() => lay.classList.add("go"));
  }
  function challengeParadox(sp, attId) {
    if (Duel.poolFor(attId).length < 6) { alert("The Paradox Gauntlet runs one squad of 6 through three trials — catch 6 of your own first (Safari Zone)."); return; }
    specialIntro(sp, () => {
      Duel.pickParty({ attId: attId, min: 6, max: 6,
        title: "THE PARADOX GAUNTLET — pick your ONE squad of 6",
        hint: "⏰ The same six carry you through the past, the future and the crystal heart — fully healed between trials, but no swaps.",
        onDone: (ids) => runParadoxTrial(sp, attId, ids, 0) });
    });
  }
  function runParadoxTrial(sp, attId, ids, i) {
    const fell = () => {
      try { Store.update((s) => Store.chron(s, "⏰", ((Store.attendee(attId) || {}).name || attId) + " — " + sp.loseChron + " (trial " + (i + 1) + "/3).")); } catch (_) {}
      Router.render();
    };
    if (i < 2) {
      const t = PARADOX_TRIALS[i];
      eraIntro(t, () => {
        const go = (leadIds) => Duel.start({ mode: "local", title: "the Paradox Gauntlet (" + (i + 1) + "/3)",
          a: { units: [{ attId: attId, monIds: leadIds }] },
          b: { units: [{ npc: t.name, ai: true, monIds: t.team.slice(), boost: t.boost, vsFace: t.face, outro: t.outro }] },
          onResult: (w) => { if (w === "a") runParadoxTrial(sp, attId, ids, i + 1); else fell(); } });
        if (i === 0) { go(ids); return; }
        Duel.pickLead({ attId: attId, ids: ids, title: "Trial " + (i + 1) + "/3 — " + t.name,
          hint: "⏰ Healed and ready. Choose who leads into " + (i === 1 ? "the future" : "the trial") + ".", onDone: go });
      });
    } else {
      // 💎 The finale: Terapagos looks like one small turtle — then the
      // reserve reveals do their work: TERASTAL, then STELLAR.
      eraIntro({ name: "TERAPAGOS", flair: "💎 TRIAL 3 · THE CRYSTAL HEART", face: 1024,
        quote: "The cavern glows. Something small crawls out of the light… and the light follows it. This is the final test." }, () => {
        Duel.pickLead({ attId: attId, ids: ids, title: "The final test — TERAPAGOS",
          hint: "💎 It looks so small. Choose your lead anyway.", onDone: (leadIds) => {
            Duel.start({ mode: "local", title: "the final test",
              secret: { key: sp.key, name: sp.name, pts: sp.pts, icon: sp.icon, winChron: sp.winChron, loseChron: sp.loseChron },
              a: { units: [{ attId: attId, monIds: leadIds }] },
              b: { units: [{ npc: "TERAPAGOS", ai: true, monIds: sp.team.slice(), boost: sp.boost, vsFace: 1024, reserve: 2,
                speak: { 1: ["The crystal turtle glows white-hot — TERAPAGOS TERASTALLIZES!"],
                         2: ["Stellar light floods the cavern… ITS FINAL FORM. The true test begins."] },
                outro: { lose: "The light dims. Terapagos blinks up at you — small again — and bows its head. Area Zero is yours.",
                         win: "Stellar light swallows the chamber. When it fades, you stand at the rim of the crater, empty-handed." } }] },
              onResult: () => Router.render() });
          } });
      });
    }
  }

  function specialCard(sp, attId) {
    const open = specialOpen(sp, attId);
    const beaten = !!(Store.secretWins && Store.secretWins(attId).indexOf(sp.key) >= 0);
    const beatenBy = Store.state.attendees.filter((a) => Store.secretWins && Store.secretWins(a.id).indexOf(sp.key) >= 0);
    const aceSrc = SP[sp.face] || Store.sprite(sp.face);
    const n = sp.playerSize || sp.team.length;   // the card only admits to six
    return el("div", { class: "league-stage legend-stage" + (beaten ? " cleared" : open ? " next" : " locked") }, [
      el("div", { class: "league-stage-rail" }, [el("span", { class: "league-dot" }, beaten ? "✅" : open ? sp.icon : "🔒")]),
      el("div", { class: "league-stage-card" }, [
        el("div", { class: "league-stage-head" }, [
          el("span", { class: "league-mt" }, sp.icon),
          el("div", {}, [
            el("div", { class: "gymc-badge" }, sp.name),
            el("div", { class: "gymc-leader" }, sp.sub),
          ]),
          aceSrc ? el("img", { class: "league-ace" + ((beaten || beatenBy.length) ? " lit" : ""), src: aceSrc, alt: "" }) : null,
        ]),
        open ? el("div", { class: "movie-lead" }, sp.lead) : null,
        beatenBy.length ? el("div", { class: "gymc-holders" }, beatenBy.map((a) =>
          el("span", { class: "gymc-holder", onClick: () => window.Profile && Profile.open(a.id) }, sp.icon + " " + a.name))) : null,
        open
          ? el("button", { class: "btn " + (beaten ? "subtle" : "primary") + " sm",
              onClick: () => (sp.gauntlet ? challengeParadox(sp, attId) : challengeSpecial(sp, attId)) },
              (beaten ? "🔁 Rematch " : sp.icon + " Face ") + sp.name + (sp.gauntlet ? " (3 trials)" : " (" + n + "v" + n + ")"))
          : el("div", { class: "legend-lock" }, "🔒 " + specialLockText(sp)),
      ]),
    ]);
  }

  // ---- The per-generation trials: cinematic intro, challenge, and card ----
  function intro(lg, onGo) {
    const src = SP[lg.face] || Store.sprite(lg.face);
    const lay = el("div", { class: "league-intro final legend-intro" }, [
      el("div", { class: "league-intro-inner" }, [
        src ? el("img", { class: "league-intro-ico legend-boss-ico", src: src, alt: "" })
          : el("div", { class: "league-intro-mt" }, lg.emoji),
        el("div", { class: "league-intro-flair" }, "🌌 LEGENDARY CHALLENGE · Gen " + lg.gen),
        el("div", { class: "league-intro-rank" }, "THE " + lg.name.toUpperCase()),
        el("div", { class: "league-intro-name" }, lg.emoji + " 6 v 6"),
        el("div", { class: "league-intro-quote" }, "“" + lg.quote + "”"),
        el("div", { class: "toolbar", style: { justifyContent: "center" } }, [
          el("button", { class: "btn spin-btn", onClick: () => { lay.remove(); onGo(); } }, lg.emoji + " ANSWER THE LEGENDS"),
          el("button", { class: "btn subtle", onClick: () => lay.remove() }, "Not yet"),
        ]),
      ]),
    ]);
    document.body.appendChild(lay);
    sfx("fanfare");
    requestAnimationFrame(() => lay.classList.add("go"));
  }

  function challenge(lg, attId) {
    const size = lg.team.length;
    if (Duel.poolFor(attId).length < size) {
      alert("The " + lg.name + " field " + size + " legends — catch " + size + " of your own first (Safari Zone).");
      return;
    }
    intro(lg, () => {
      Duel.pickParty({ attId: attId, min: size, max: size,
        title: "vs the " + lg.name + " — pick EXACTLY " + size,
        hint: "🌌 A " + size + "v" + size + " legendary battle — the lineup is hidden, and they hit like gods. Bring your very best.",
        onDone: (ids) => {
          Duel.start({ mode: "local", title: "the " + lg.name + " (Gen " + lg.gen + ")",
            legend: { key: lg.key, name: lg.name, pts: lg.pts, icon: lg.emoji, winChron: lg.winChron, loseChron: lg.loseChron },
            a: { units: [{ attId: attId, monIds: ids }] },
            b: { units: [{ npc: "The " + lg.name, ai: true, monIds: lg.team.slice(), boost: lg.boost, vsFace: lg.face || null }] },
            onResult: () => Router.render() });
        } });
    });
  }

  function legendCard(lg, attId) {
    const mineBeat = Store.legendWins(attId).indexOf(lg.key) >= 0;
    const anyBeat = Store.state.attendees.some((a) => Store.legendWins(a.id).indexOf(lg.key) >= 0);
    const beatenBy = Store.state.attendees.filter((a) => Store.legendWins(a.id).indexOf(lg.key) >= 0);
    const open = unlocked(lg, attId);
    const ace = lg.team[lg.team.length - 1];
    const aceSrc = SP[ace] || Store.sprite(ace);
    // Locked: the ace stays a silhouette and the button explains the gate.
    return el("div", { class: "league-stage legend-stage" + (mineBeat ? " cleared" : open ? " next" : " locked") }, [
      el("div", { class: "league-stage-rail" }, [el("span", { class: "league-dot" }, mineBeat ? "✅" : open ? lg.emoji : "🔒")]),
      el("div", { class: "league-stage-card" }, [
        el("div", { class: "league-stage-head" }, [
          el("span", { class: "league-mt" }, lg.emoji),
          el("div", {}, [
            el("div", { class: "gymc-badge" }, lg.name),
            el("div", { class: "gymc-leader" }, "Gen " + lg.gen + " Legendaries & Mythicals · 6v6 (hidden)"),
          ]),
          aceSrc ? el("img", { class: "league-ace" + ((mineBeat || anyBeat) ? " lit" : ""), src: aceSrc, alt: "" }) : null,
        ]),
        open ? el("div", { class: "movie-lead" }, lg.lead) : null,
        beatenBy.length ? el("div", { class: "gymc-holders" }, beatenBy.map((a) =>
          el("span", { class: "gymc-holder", onClick: () => window.Profile && Profile.open(a.id) }, "🌌 " + a.name))) : null,
        open
          ? el("button", { class: "btn " + (mineBeat ? "subtle" : "primary") + " sm", onClick: () => challenge(lg, attId) },
              (mineBeat ? "🔁 Rematch the " : lg.emoji + " Challenge the ") + lg.name + " (6v6)")
          : el("div", { class: "legend-lock" }, "🔒 Beat Champion " + lg.champ + " to summon the " + lg.name + "."),
      ]),
    ]);
  }

  // Trials whose region set intersects the given regions (for the Journey tabs).
  function forRegions(regions) {
    regions = regions || [];
    return LEGENDS.filter((lg) => lg.regions.some((r) => regions.indexOf(r) >= 0));
  }

  function view(root) {
    root.appendChild(el("div", { class: "page-head" }, [
      el("h1", {}, "🌌 Legendary Challenge"),
      el("p", { class: "page-sub" }, "The post-league endgame. Topple a region's Champion and its generation's legendaries rise against you — a full 6v6 against the titans, mascots and mythicals. Clear all nine to become a Legend Keeper." ),
    ]));
    let attId = (window.Sync && Sync.getMe && Sync.getMe()) || (Store.state.attendees[0] || {}).id || "";
    if (!attId) { root.appendChild(el("p", { class: "hint" }, "Add trainers first (Squad page).")); return; }
    const sel = el("select", { class: "in" }, Store.state.attendees.map((a) => el("option", { value: a.id }, a.name + "'s trials")));
    sel.value = attId;
    const host = el("div", { class: "league-journey" });
    sel.addEventListener("change", () => { attId = sel.value; paint(); });
    root.appendChild(sel);
    root.appendChild(host);
    function paint() { host.innerHTML = ""; LEGENDS.forEach((lg) => host.appendChild(legendCard(lg, attId))); }
    paint();
  }

  window.Views = window.Views || {};
  window.Views.legends = view;
  // Shared with the combined Journey view — the trial cards, folded per region.
  window.LegendChallenge = { LEGENDS: LEGENDS, card: legendCard, forRegions: forRegions, unlocked: unlocked,
    SPECIALS: SPECIALS, specialCard: specialCard,
    specialsForRegion: function (tabName) { return SPECIALS.filter(function (sp) { return sp.tab === tabName; }); } };
})();
