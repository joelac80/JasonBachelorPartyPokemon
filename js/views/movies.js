/* movies.js — 🎬 Movie Legends: the FULL FILMOGRAPHY as cinematic boss
   battles, in release order — Mewtwo Strikes Back (1998) to I Choose You
   (2017). Each film is a themed squad, villain dialog, and a ✅ on the wall
   for every trainer who topples it. Every entry carries `costar`: the legend
   the film frees, recruitable in the 🎬 Movie Marathon Nuzlocke (empty-seat
   rule). Array order IS the marathon's reel order. Pure glory. */
(function () {
  const { el, energyIcon } = U;
  const SP = window.DEX_SPRITES || {};
  function sfx(n) { if (window.SFX && SFX[n]) SFX[n](); }

  // Each boss: a themed final-evolution six, a signature quote, and the ace
  // whose silhouette looms in the card until someone beats them.
  const BOSSES = [
    { key: "mewtwo", name: "MEWTWO", title: "The Genetic Pokémon", film: "Mewtwo Strikes Back", tab: "Kanto", needs: "blue", needsName: "BLUE",
      type: "psychic", team: [6, 9, 3, 25, 150], pts: 20, boost: 1.4, icon: "🧬", face: 150, costar: 150,
      // The four movie clones field in their eerie shadow palette (shiny sprites —
      // clone Charizard is jet-black, just like the film); Mewtwo stays himself.
      shiny: [6, 9, 3, 25], vsFace: 150,
      quote: "I was created by humans… to obey them. I have chosen a different destiny. You believe a TRAINED Pokémon can overcome a perfect clone? Come — show me. And despair.",
      ace: { line: "Enough games with my clones. I am the strongest Pokémon in the world — witness it, and understand." },
      outro: { lose: "…So. It is not the circumstances of one's birth, but what one does with the gift of life, that gives it meaning. Perhaps that is a truth even I was born to learn.",
               win: "A trained Pokémon is no match for a perfect clone — nor a mere human for me. Despair, and remember this day." },
      winChron: "shattered MEWTWO's cloned army — and the genetic legend itself!",
      loseChron: "MEWTWO proved the clones reign supreme",
      lead: "🧬 His four shadow CLONES — a jet-black Charizard, plus Blastoise, Venusaur and Pikachu — then Mewtwo himself.",
      // 🎬 The film's mirror match: answer the clones with the ORIGINALS —
      // Charizard, Blastoise, Venusaur, Pikachu, and MEW (whom Mewtwo was cloned
      // from). Offered as a ready-made squad you don't need to have caught.
      mirror: { team: [6, 9, 3, 25, 151],
        note: "Answer the clones with the ORIGINALS — Charizard, Blastoise, Venusaur, Pikachu, and MEW, the ancient Pokémon Mewtwo was cloned from." } },
    { key: "collector", name: "LAWRENCE III", title: "The Collector", film: "Pokémon 2000 · The Power of One", tab: "Johto", needs: "lance", needsName: "LANCE",
      type: "flying", team: [144, 145, 146, 249], pts: 20, boost: 1.4, icon: "🎐", face: 249, costar: 249,
      quote: "Fire, Ice, Lightning — the titans of the sky are already mine. Only Lugia, guardian of the sea, remains… the jewel of my collection. You? Merely an obstacle to be catalogued.",
      ace: { line: "And now — the prize itself. Rise from the sea, guardian. LUGIA, the jewel of my collection!" },
      outro: { lose: "My airship, my collection, my Lugia — all slipping through my fingers. …And yet. Perhaps a single Pokémon, truly treasured, is worth more than a thousand behind glass. You've taught the collector something today.",
               win: "The guardian of the sea joins my collection at last — and you become a mere footnote beneath its display case. Catalogued." },
      winChron: "freed the three legendary birds and grounded THE COLLECTOR's airship!",
      loseChron: "THE COLLECTOR catalogued another trainer",
      lead: "🎐 The three caged titans — Articuno, Zapdos, Moltres — and Lugia, guardian of the sea, the prize itself." },
    { key: "entei", name: "ENTEI", title: "The Unown's Guardian", film: "Pokémon 3 · Spell of the Unown", tab: "Johto", needs: "lance", needsName: "LANCE",
      type: "fire", team: [201, 201, 201, 201, 201, 244], glyphs: ["D", "R", "E", "A", "M"], pts: 20,
      // 🔥 the Unown are the SPELL; ENTEI is the BOSS — hidden until the
      // alphabet falls, then fielded at true boss weight
      boost: [1.15, 1.15, 1.15, 1.15, 1.15, 2.3], reserve: 1, icon: "🔥", face: 244, costar: 244,
      ace: { line: "The letters spin — and the dream REFUSES to end. Entei burns at full fury!" },
      outro: { lose: "The flame beast slows… looks back once at the crystal tower… and dissolves into motes of light. Somewhere, a little girl wakes.",
               win: "Entei stands over the broken spell, burning. This dream is not yours to end." },
      quote: "The Unown dreamed me into being, and I am bound to a lonely girl's every wish. You would wake her from this world? Then get past ME — and the living alphabet that conjured me.",
      winChron: "shattered the D-R-E-A-M — the Unown's spell broke and Molly woke at last!",
      loseChron: "ENTEI guarded the dream and turned another dreamer away",
      lead: "🔥 A swarm of Unown spelling D · R · E · A · M — and ENTEI, the beast their spell made real." },
    { key: "marauder", name: "THE IRON-MASKED MARAUDER", title: "Team Rocket's Hunter", film: "Pokémon 4Ever · Voice of the Forest", tab: "Johto", needs: "lance", needsName: "LANCE",
      type: "dark", team: [215, 212, 248, 251], pts: 20, boost: [1.3, 1.45, 1.5, 1.7], icon: "🌲", face: 251, costar: 251, shiny: [251], vsFace: 251,
      quote: "With my Dark Balls, any Pokémon becomes an obedient weapon — even the guardian of the forest. Time itself will serve Team Rocket!",
      ace: { line: "Witness the guardian of the forest remade into a weapon — obey your master, Dark Celebi!" },
      outro: { lose: "The Dark Ball… CRACKING?! No — Celebi, come BACK here! …Curse you, curse this forest, curse EVERY green and growing thing in it!",
               win: "Another guardian caged, another little hero left in the dirt. Team Rocket thanks you for the sport." },
      winChron: "cracked the Dark Ball and freed CELEBI from the Iron-Masked Marauder!",
      loseChron: "the Iron-Masked Marauder caged another guardian",
      lead: "🌲 Sneasel and Scizor, an armored Tyranitar — and CELEBI, twisted into a Dark Ball shadow of itself." },
    { key: "heroes", name: "ANNIE & OAKLEY", title: "The Rogue Spies", film: "Pokémon Heroes · Latias & Latios", tab: "Hoenn", needs: "steven", needsName: "STEVEN",
      type: "psychic", team: [196, 168, 380, 381], pts: 20, boost: [1.45, 1.25, 1.65, 1.65], icon: "🛶", face: 381, costar: 380,
      quote: "The Soul Dew and the secret of Alto Mare will be ours. Espeon, Ariados — and once we cage the Eon Pokémon, the whole city drowns.",
      ace: { line: "Say hello to our new pets — the Eon Pokémon answer to US now!" },
      outro: { lose: "The Soul Dew's shattered and the whole city's flooding — Oakley, the mission's OFF, just RUN! Ugh… auntie is going to KILL us.",
               win: "Too slow, sweetie. The Soul Dew's ours, and Alto Mare can sink behind us. Ciao~!" },
      winChron: "saved Alto Mare — LATIAS and LATIOS fly free again!",
      loseChron: "Annie & Oakley made off with the Soul Dew",
      lead: "🛶 Espeon and Ariados — then the stolen Eon duo, LATIAS and LATIOS, forced to fight." },
    { key: "wishmaker", name: "BUTLER", title: "The Vengeful Magician", film: "Jirachi · Wish Maker", tab: "Hoenn", needs: "steven", needsName: "STEVEN",
      type: "ghost", team: [282, 262, 356, 383, 385], pts: 20, boost: 1.42, icon: "🌠", face: 385, costar: 385, shiny: [383],
      quote: "A thousand years of sleep, and the Millennium Comet returns. With Jirachi's power I will forge my OWN Groudon — and no one will laugh at my magic again.",
      ace: { line: "Rise, my masterpiece — no one will ever laugh at Butler's magic again! Behold my GROUDON!" },
      outro: { lose: "My Groudon… crumbling to dust, like every trick I ever pulled. …Diane. You were right about me all along. Jirachi — go home, little one. Sleep.",
               win: "A thousand years I waited for the Millennium Comet. Did you truly believe a child would take its power from ME?" },
      winChron: "broke BUTLER's false GROUDON and let JIRACHI sleep in peace!",
      loseChron: "BUTLER's creation swallowed another wish",
      lead: "🌠 Gardevoir, Mightyena, Dusclops — then the grotesque FALSE GROUDON, and JIRACHI, wide awake and weaponized." },
    { key: "deoxys", name: "DEOXYS", title: "The DNA Pokémon", film: "Destiny Deoxys", tab: "Hoenn", needs: "steven", needsName: "STEVEN",
      // 🧬 the formes carry raw 600-weight stats (they're the Delta Episode's
      // BOSS phases) — at film scale they ride at 0.45 so each lands like a
      // boosted legend instead of three unbeatable gods in a row
      type: "psychic", team: [10001, 10002, 10003, 384, 386], pts: 20, boost: [0.45, 0.45, 0.45, 1.05, 1.2], icon: "🧬", face: 386, costar: 386,
      quote: "It fell from the stars searching for its friend — and RAYQUAZA rose from the ozone to repel it. Attack. Defense. Speed. Every form, one storm over the city.",
      ace: { line: "The battle formes fall away — the DNA Pokémon takes its true shape, and the city holds its breath." },
      outro: { lose: "The aurora over the city softens. Its crystal pulses once — its friend is answered at last, from somewhere out past the stars — and DEOXYS rises skyward, searching no more.",
               win: "It shifts faster than the eye can follow — Attack, Defense, Speed, all at once — and the city vanishes beneath its light." },
      winChron: "calmed the duel of DEOXYS and RAYQUAZA — every form weathered!",
      loseChron: "DEOXYS shifted forms faster than another challenger could follow",
      lead: "🧬 Deoxys cycling Attack, Defense and Speed forms, RAYQUAZA defending the sky — and the Normal Forme to finish." },
    { key: "aura", name: "THE TREE OF BEGINNING", title: "Aura's Trial", film: "Lucario and the Mystery of Mew", tab: "Sinnoh", needs: "cynthia", needsName: "CYNTHIA",
      type: "fighting", team: [377, 378, 379, 448, 151], pts: 20, boost: 1.44, icon: "🌳", face: 448, costar: 151,
      quote: "The aura is with you… but the Tree's immune guardians know no mercy, and a knight sealed a thousand years still waits for his master. Prove your heart to MEW.",
      ace: { line: "The heart of the Tree stirs — and MEW itself comes out to play. Show it the aura that lives in you." },
      outro: { lose: "The aura truly is with you… just as it was with Sir Aaron. The Tree is at peace, and so, at last, am I. Thank you — for letting me see him one final time.",
               win: "The Tree's guardians know no mercy, and the aura finds your heart wanting. Steady it, and return." },
      winChron: "passed the Tree of Beginning — LUCARIO's aura bowed and MEW danced!",
      loseChron: "the Tree of Beginning rejected another intruder",
      lead: "🌳 The Regi guardians of the Tree — then LUCARIO, knight of the aura, and MEW at the heart of it all." },
    { key: "darkrai", name: "DARKRAI", title: "The Nightmare of Alamos", film: "The Rise of Darkrai", tab: "Sinnoh", needs: "cynthia", needsName: "CYNTHIA",
      type: "dark", team: [483, 484, 491], pts: 20, boost: 1.44, icon: "🌑", face: 491, costar: 491,
      quote: "Go away. This garden is MY world. Dialga and Palkia tear the sky apart above the towers — and every dream in Alamos is mine alone to guard.",
      ace: { line: "You should not have come to this garden. Darkrai rises — and the nightmare deepens." },
      outro: { lose: "…The nightmares lift. The town wakes safe, never knowing who kept it so. Darkrai turns into the dawn it fought to protect, and asks for nothing in return.",
               win: "Go away. This garden is MY world — and here, you will only ever dream." },
      winChron: "calmed the clash of DIALGA and PALKIA — and DARKRAI's long nightmare lifted at dawn!",
      loseChron: "the nightmare of Alamos swallowed another dreamer",
      lead: "🌑 DIALGA and PALKIA, tearing spacetime open over Alamos Town — and DARKRAI, the nightmare that stands against them both." },
    { key: "skywarrior", name: "ZERO", title: "The Reverse World's Captain", film: "Giratina and the Sky Warrior", tab: "Sinnoh", needs: "cynthia", needsName: "CYNTHIA",
      type: "ghost", team: [462, 462, 487, 492], pts: 20, boost: [1.3, 1.3, 1.7, 1.55], icon: "🌫", face: 487, costar: 492,
      quote: "Giratina's power will be MINE, and the Reverse World my kingdom. The gratitude Pokémon can watch its flower field burn from the other side of the mirror.",
      ace: { line: "Giratina — dragged from behind the mirror and bound to MY will. The Reverse World has a new master!" },
      outro: { lose: "The Reverse World rejects me — I only wanted to PRESERVE it! No… no, not like this — Giratina, release me — AAAGH!",
               win: "The mirror-world is my kingdom now, and Giratina my crown. The world of light may wither behind the glass." },
      winChron: "grounded ZERO's fleet — GIRATINA returned to the Reverse World and SHAYMIN bloomed!",
      loseChron: "ZERO sailed the Reverse World unchallenged",
      lead: "🌫 Zero's Magnezone escort — then GIRATINA dragged from the Reverse World, and SHAYMIN, the Sky Warrior itself." },
    { key: "jewel", name: "MARCUS", title: "The Betrayer of Michina", film: "Arceus and the Jewel of Life", tab: "Sinnoh", needs: "cynthia", needsName: "CYNTHIA",
      type: "steel", team: [437, 485, 493], pts: 22, boost: 1.46, icon: "⚖", face: 493, costar: 493,
      quote: "I saved this world once by betraying the Alpha Pokémon — and I will NOT return the Jewel of Life. Let it come in judgment; my Bronzong and my forge-bound Heatran will drain its plates dry.",
      ace: { line: "Come in judgment then, Original One — my forge-bound Heatran will drain your plates dry. JUDGMENT DENIED!" },
      outro: { lose: "The Jewel returns to Arceus… and its judgment spares us all. Michina lives. I was a fool to believe betrayal could ever be salvation.",
               win: "The Jewel of Life stays in Michina — in MY hand. Rage all you like, Alpha Pokémon; my forge holds even a god." },
      winChron: "returned the Jewel of Life — ARCEUS' judgment passed over Michina in peace!",
      loseChron: "MARCUS' betrayal repeated itself, and judgment fell",
      lead: "⚖ Marcus' silver Bronzong and the trap-forged HEATRAN — and then ARCEUS itself descends, wrathful, plates blazing." },
    { key: "victini", name: "DAMON", title: "The Kingdom's Heir", film: "White · Victini and Zekrom", tab: "Unova", needs: "alder", needsName: "ALDER",
      type: "fire", team: [555, 643, 644, 494], pts: 20, boost: 1.46, icon: "🔥", face: 494, costar: 494,
      quote: "For my people I will move the Sword of the Vale itself — and if the Victory Pokémon must power it forever, so be it. Truth and Ideals both answer ME.",
      ace: { line: "Power the Sword, Victini — your victory belongs to the People of the Vale now!" },
      outro: { lose: "The Sword of the Vale settles, and Victini flies free. …A kingdom built on one small captive's suffering is no kingdom at all. Forgive me, little one.",
               win: "For my people, ANY price is worth paying. Truth and Ideals both answer my call — and in the end, so will you." },
      winChron: "freed VICTINI from the Sword of the Vale — victory at last tastes sweet!",
      loseChron: "DAMON's kingdom rolled on, VICTINI still caged",
      lead: "🔥 Damon's Darmanitan, RESHIRAM and ZEKROM both answering his call — and VICTINI, the caged Victory Pokémon." },
    { key: "genesect", name: "THE GENESECT ARMY", title: "Red Genesect's Swarm", film: "Genesect and the Legend Awakened", tab: "Unova", needs: "alder", needsName: "ALDER",
      type: "bug", team: [649, 649, 649, 649, 649, 10044], pts: 22, boost: 1.48, icon: "🤖", face: 10044, costar: 649,
      quote: "Three hundred million years out of time, the swarm builds its nest in the city's heart — and the strongest Pokémon ever engineered has AWAKENED to meet it.",
      ace: { line: "The swarm has met its match — the strongest Pokémon ever awakened descends. MEGA MEWTWO Y." },
      outro: { lose: "The Red Genesect's cannon goes dark; the swarm powers down, three hundred million years of fury finally spent. And the Awakened One inclines its head, once — and is gone.",
               win: "The swarm claims the city for its nest, and the strongest Pokémon ever made claims you." },
      winChron: "grounded the GENESECT ARMY — and out-fought MEGA MEWTWO Y itself!",
      loseChron: "the swarm and the awakened legend proved too much",
      lead: "🤖 Five paleozoic war machines — the Genesect swarm — and MEGA MEWTWO Y, the legend awakened." },
    { key: "diancie", name: "YVELTAL", title: "The Cocoon of Destruction", film: "Diancie and the Cocoon of Destruction", tab: "Kalos", needs: "diantha", needsName: "DIANTHA",
      type: "dark", team: [655, 658, 717], pts: 20, boost: 1.46, icon: "🪶", face: 717, costar: 719,
      quote: "Deep in the Allearth Forest the Cocoon sleeps — and every hand that reaches for the Heart Diamond wakes it a little more. When Yveltal spreads its wings, everything they touch turns to stone.",
      ace: { line: "The Cocoon splits open — Destruction itself spreads its wings. YVELTAL wakes." },
      outro: { lose: "The great wings fold. Destruction sinks back into its cocoon and its centuries of sleep — and the Allearth Forest breathes green again.",
               win: "Its wings spread wide over the forest — and everything the Oblivion Wing touches turns grey, and still, and silent." },
      winChron: "outlasted YVELTAL's Oblivion Wing — and DIANCIE's Heart Diamond shone at last!",
      loseChron: "YVELTAL's wings turned another challenger to stone",
      lead: "🪶 The jewel thieves' Delphox and Greninja — and then the Cocoon opens: YVELTAL, Destruction itself, on the wing." },
    { key: "magearna", name: "ALVA", title: "The Minister of Machination", film: "Volcanion and the Mechanical Marvel", tab: "Kalos", needs: "diantha", needsName: "DIANTHA",
      type: "steel", team: [625, 94, 373, 801], pts: 20, boost: 1.46, icon: "⚙", face: 801, costar: 801,
      quote: "Mega Evolution at the push of a button — no bonds, no trust, just CONTROL. The Soul-Heart will power my kingdom in the sky, and Volcanion's rage means nothing to a man with a fortress.",
      ace: { line: "The Soul-Heart is mine to command — Magearna, hollow and obedient, ANNIHILATE them!" },
      outro: { lose: "My fortress, my flawless machines — falling out of the sky! Control without a bond was the lie all along. Take the Soul-Heart, then — take it and be GONE!",
               win: "Bonds. Trust. Sentiment — every one of them a weakness. My machines obey without question, and now, so does Magearna's stolen heart." },
      winChron: "brought down ALVA's flying fortress — MAGEARNA's Soul-Heart beats free!",
      loseChron: "ALVA's machines ground another rescue to a halt",
      lead: "⚙ Alva's remote-controlled arsenal — Bisharp, Gengar, Salamence — and MAGEARNA, hollowed into a weapon, its Soul-Heart stolen." },
    { key: "ichooseyou", name: "THE RAINBOW HERO", title: "Ho-Oh's Summit Trial", film: "Pokémon the Movie · I Choose You!", tab: "Johto", needs: "lance", needsName: "LANCE",
      type: "fire", team: [243, 244, 245, 802, 250], pts: 22, boost: 1.42, icon: "🌈", face: 250, costar: 802,
      quote: "Only a true partner may carry the Rainbow Wing. The sacred beasts will test your road, the Gloomdweller will test your shadow — and at the summit of Mt. Tensei, HO-OH will test your heart.",
      ace: { line: "The clouds part in gold over Mt. Tensei — HO-OH descends to weigh your heart against the Rainbow Wing." },
      outro: { lose: "Sacred fire washes warm over the summit, and the Rainbow Wing blazes true. You and your partner are worthy of the legend. Well climbed, trainer.",
               win: "The Rainbow Wing dims to grey. The summit of Mt. Tensei is not yours today — return when your bond burns brighter." },
      winChron: "passed the Rainbow Trial — HO-OH's sacred fire blessed a true partner at the summit!",
      loseChron: "the Rainbow Wing dimmed — Mt. Tensei turned another trainer away",
      lead: "🌈 Raikou, Entei and Suicune guarding the mountain, MARSHADOW rising from the shadows — and HO-OH descending in sacred fire." },
  ];
  window.MOVIE_BOSSES = BOSSES;

  // Cinematic entrance — the film title card, the villain's face out of the
  // dark, the quote, then the choice to step in.
  function bossIntro(b, onGo) {
    const src = SP[b.face] || Store.sprite(b.face);
    const lay = el("div", { class: "league-intro final movie-intro" }, [
      el("div", { class: "league-intro-inner" }, [
        src ? el("img", { class: "league-intro-ico movie-boss-ico", src: src, alt: "" })
          : el("div", { class: "league-intro-mt" }, b.icon),
        el("div", { class: "league-intro-flair" }, "🎬 " + b.film),
        el("div", { class: "league-intro-rank" }, b.title.toUpperCase()),
        el("div", { class: "league-intro-name" }, b.name),
        el("div", { class: "league-intro-quote" }, "“" + b.quote + "”"),
        el("div", { class: "toolbar", style: { justifyContent: "center" } }, [
          el("button", { class: "btn spin-btn", onClick: () => { lay.remove(); onGo(); } }, b.icon + " FACE " + b.name),
          el("button", { class: "btn subtle", onClick: () => lay.remove() }, "Not yet"),
        ]),
      ]),
    ]);
    document.body.appendChild(lay);
    sfx("fanfare");
    requestAnimationFrame(() => lay.classList.add("go"));
  }

  // A ready-made "wield the Originals" choice: take the preset mirror squad (no
  // need to have caught them), or bring your own five.
  function teamChoice(b, onMirror, onOwn) {
    const mons = b.mirror.team.map((id) => {
      const s = SP[id] || Store.sprite(id);
      return s ? el("img", { class: "trn-scout-mon", src: s, alt: "" }) : null;
    });
    const lay = el("div", { class: "league-intro final movie-intro" }, [
      el("div", { class: "league-intro-inner" }, [
        el("div", { class: "league-intro-rank" }, "CHOOSE YOUR TEAM"),
        el("div", { class: "league-intro-name", style: { fontSize: "26px" } }, "Originals vs Clones"),
        el("div", { class: "league-intro-quote" }, b.mirror.note),
        el("div", { class: "trn-scout-row", style: { justifyContent: "center" } }, mons),
        el("div", { class: "toolbar", style: { justifyContent: "center", flexWrap: "wrap" } }, [
          el("button", { class: "btn spin-btn", onClick: () => { lay.remove(); onMirror(); } }, "✨ Wield the Originals (+ MEW)"),
          el("button", { class: "btn primary", onClick: () => { lay.remove(); onOwn(); } }, "🎒 Bring my own " + b.team.length),
          el("button", { class: "btn subtle", onClick: () => lay.remove() }, "↩ Back"),
        ]),
      ]),
    ]);
    document.body.appendChild(lay);
    requestAnimationFrame(() => lay.classList.add("go"));
  }

  // 🧭 Gen Ladder: each film answers only trainers who've beaten its era's
  // Champion (per-boss `needs`, raw league win — same rule as the Legendary
  // Challenges).
  function moviesLocked(b, attId) {
    if (!attId) return true;
    const key = b.needs || "lance";
    // Prefer the League's self-healing check (re-infers sync-clipped wins).
    if (window.LeagueGate && LeagueGate.hasBeat) return !LeagueGate.hasBeat(attId, key);
    return Store.leagueWins(attId).indexOf(key) < 0;
  }

  function challenge(b, attId) {
    if (moviesLocked(b, attId)) { alert("🔒 The big screen waits — beat Champion " + (b.needsName || "LANCE") + " in The Journey first."); return; }
    const size = b.team.length;
    const startWith = (ids) => {
      Duel.start({ mode: "local", title: b.name + " — " + b.film,
        movie: { key: b.key, name: b.name, pts: b.pts, icon: b.icon, winChron: b.winChron, loseChron: b.loseChron },
        a: { units: [{ attId: attId, monIds: ids }] },
        b: { units: [{ npc: b.name, ai: true, monIds: b.team.slice(), glyphs: b.glyphs || null, boost: b.boost, shiny: b.shiny || false, vsFace: b.vsFace || null,
          reserve: b.reserve || 0, hpBoost: b.hpBoost || undefined, ace: b.ace || null, outro: b.outro || null, feral: b.feral }] },
        onResult: () => Router.render() });
    };
    // Bring-your-own path needs a full pool; the preset mirror squad does not.
    const pickOwn = () => {
      if (Duel.poolFor(attId).length < size) {
        alert(b.name + " fields " + size + " Pokémon — catch " + size + " of your own first (Safari Zone), or take the ready-made squad.");
        return;
      }
      Duel.pickParty({ attId: attId, min: size, max: size,
        title: "vs " + b.name + " — pick EXACTLY " + size,
        hint: "🎬 " + b.film + ". A " + size + " v " + size + " boss battle — the lineup is hidden. Bring your very best.",
        onDone: (ids) => startWith(ids) });
    };
    bossIntro(b, () => {
      if (b.mirror) teamChoice(b, () => startWith(b.mirror.team.slice()), pickOwn);
      else pickOwn();
    });
  }

  function bossCard(b, attId) {
    const mineBeat = Store.movieWins(attId).indexOf(b.key) >= 0;
    const anyBeat = Store.state.attendees.some((a) => Store.movieWins(a.id).indexOf(b.key) >= 0);
    const beatenBy = Store.state.attendees.filter((a) => Store.movieWins(a.id).indexOf(b.key) >= 0);
    const ace = b.team[b.team.length - 1];
    const aceSrc = SP[ace] || Store.sprite(ace);
    const n = b.team.length, vs = n + "v" + n;
    const locked = moviesLocked(b, attId);
    return el("div", { class: "league-stage movie-stage" + (mineBeat ? " cleared" : locked ? " locked" : " next") }, [
      el("div", { class: "league-stage-rail" }, [el("span", { class: "league-dot" }, mineBeat ? "✅" : locked ? "🔒" : b.icon)]),
      el("div", { class: "league-stage-card" }, [
        el("div", { class: "league-stage-head" }, [
          el("span", { class: "league-mt" }, b.icon),
          el("div", {}, [
            el("div", { class: "gymc-badge" }, b.name),
            el("div", { class: "gymc-leader" }, b.title + " · 🎬 " + b.film + " · team of " + n + " (hidden)"),
          ]),
          aceSrc ? el("img", { class: "league-ace" + ((mineBeat || anyBeat) ? " lit" : ""), src: aceSrc, alt: "" }) : null,
        ]),
        locked ? null : el("div", { class: "movie-lead" }, b.lead),
        beatenBy.length ? el("div", { class: "gymc-holders" }, beatenBy.map((a) =>
          el("span", { class: "gymc-holder", onClick: () => window.Profile && Profile.open(a.id) }, "🎬 " + a.name))) : null,
        locked
          ? el("div", { class: "legend-lock" }, "🔒 The big screen waits for a Champion — beat " + (b.needsName || "LANCE") + " in The Journey first.")
          : el("button", { class: "btn " + (mineBeat ? "subtle" : "primary") + " sm", onClick: () => challenge(b, attId) },
              (mineBeat ? "🔁 Rematch " : b.icon + " Challenge " + b.name + " ") + "(" + vs + ")"),
      ]),
    ]);
  }

  function view(root) {
    root.appendChild(el("div", { class: "page-head" }, [
      el("h1", {}, "🎬 Movie Legends"),
      el("p", { class: "page-sub" }, "The whole filmography, straight off the big screen — from Mewtwo's cloned army to Ho-Oh's summit trial, " + BOSSES.length + " films of legends and villains in release order. No mercy — beat them for the wall of fame." ),
    ]));

    let attId = (window.Sync && Sync.getMe && Sync.getMe()) || (Store.state.attendees[0] || {}).id || "";
    if (!attId) { root.appendChild(el("p", { class: "hint" }, "Add trainers first (Squad page).")); return; }

    const lockedRow = U.lockedTrainerRow("Challenger:");
    const sel = el("select", { class: "in" }, Store.state.attendees.map((a) => el("option", { value: a.id }, a.name + "'s challenge")));
    sel.value = attId;
    const host = el("div", { class: "league-journey" });
    sel.addEventListener("change", () => { attId = sel.value; paint(); });
    if (lockedRow) { attId = lockedRow.dataset.me; root.appendChild(lockedRow); }
    else root.appendChild(sel);
    root.appendChild(host);

    function paint() {
      host.innerHTML = "";
      BOSSES.forEach((b) => host.appendChild(bossCard(b, attId)));
    }
    paint();
  }

  window.Views = window.Views || {};
  window.Views.movies = view;
  // Shared with the combined Regions view: the boss cards (folded into Kanto).
  window.MovieLegends = {
    BOSSES: BOSSES,
    card: bossCard,
    forRegion: function (tabName) { return BOSSES.filter(function (b) { return (b.tab || "Johto") === tabName; }); },
  };
})();
