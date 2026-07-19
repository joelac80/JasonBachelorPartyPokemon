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
      lead: "🔮 Articuno, Zapdos, Moltres, Mew and Dragonite — and MEWTWO, the perfect Pokémon.",
      ace: "Enough. I was created the strongest — MEWTWO takes the field.", outroWin: "You fought with borrowed courage. Return when it is your own.", outroLose: "…A bond stronger than creation itself. Remember this day, trainer — I will." },
    { key: "gen2", gen: 2, name: "Johto Beasts", emoji: "🌈", needs: "lance", champ: "LANCE", regions: ["Johto"],
      team: [243, 244, 245, 250, 251, 249], face: 249, boost: 1.44, pts: 22,
      quote: "The three legendary beasts race the wind, the guardians of the towers spread their wings. Time itself sent Celebi to watch you fall.",
      winChron: "outran the Johto beasts and grounded LUGIA and HO-OH!", loseChron: "the Johto beasts vanished into legend",
      lead: "🌈 Raikou, Entei, Suicune, Ho-Oh and Celebi — and LUGIA, the guardian of the sea.",
      ace: "The sea splits — LUGIA rises from the deep!", outroWin: "A beat of silver wings, and the storm swallows the whirlpool again.", outroLose: "The storm folds its wings. Lugia sinks back beneath the waves — and the sea keeps your name." },
    { key: "gen3", gen: 3, name: "Hoenn Weather Trio", emoji: "🌊", needs: "steven", champ: "STEVEN", regions: ["Hoenn"],
      team: [377, 378, 379, 382, 383, 384], face: 384, boost: 1.46, pts: 24,
      quote: "The land rises, the sea swells, and the sky splits open. Only the Delta Emerald can settle who rules the heavens.",
      winChron: "quelled the Hoenn superancients — RAYQUAZA yielded the sky!", loseChron: "the weather trio drowned another challenger",
      lead: "🌊 Regirock, Regice, Registeel, Kyogre and Groudon — and RAYQUAZA, lord of the skies.",
      ace: "The ozone tears open — RAYQUAZA descends!", outroWin: "Rayquaza climbs beyond the clouds, and the storm rages on.", outroLose: "The sky serpent coils upward and is gone — the heavens are yours to cross." },
    { key: "gen4", gen: 4, name: "Sinnoh Creation Trio", emoji: "🌌", needs: "cynthia", champ: "CYNTHIA", regions: ["Sinnoh"],
      team: [483, 484, 487, 485, 491, 493], face: 493, boost: 1.48, pts: 26,
      quote: "Time, Space, and Antimatter converge — and the Original One that shaped them all descends to judge you.",
      winChron: "unmade the Sinnoh creation trio — even ARCEUS knelt!", loseChron: "the creation trio erased another hope",
      lead: "🌌 Dialga, Palkia, Giratina, Heatran and Darkrai — and ARCEUS, the Original One.",
      ace: "The air rings like a struck bell — the ORIGINAL ONE descends!", outroWin: "Arceus fades into the white. Judgment: not yet.", outroLose: "The Original One inclines its head — creation itself acknowledges you." },
    { key: "gen5", gen: 5, name: "Unova Tao Trio", emoji: "⚡", needs: "alder", champ: "ALDER", regions: ["Unova"],
      team: [638, 639, 640, 643, 644, 646], face: 646, boost: 1.50, pts: 28,
      quote: "Truth and Ideals burn and spark, the Swords of Justice stand guard — and the empty shell of Kyurem hungers for both.",
      winChron: "shattered the Unova tao dragons — KYUREM froze over!", loseChron: "the tao dragons judged another wanting",
      lead: "⚡ Cobalion, Terrakion, Virizion, Reshiram and Zekrom — and KYUREM, the boundary.",
      ace: "The cold that predates truth and ideals — KYUREM unfolds!", outroWin: "Kyurem's frost seals the field — truth and ideals both freeze.", outroLose: "The empty shell steams, and stills. The boundary bows." },
    { key: "gen6", gen: 6, name: "Kalos Life & Death", emoji: "🦌", needs: "diantha", champ: "DIANTHA", regions: ["Kalos"],
      team: [719, 720, 721, 716, 717, 718], face: 718, boost: 1.52, pts: 30,
      quote: "Life eternal and destruction absolute, bound by the serpent of order. The jewel, the genie and the kettle attend.",
      winChron: "balanced the Kalos legends — ZYGARDE enforced no order here!", loseChron: "life and death reclaimed another",
      lead: "🦌 Diancie, Hoopa, Volcanion, Xerneas and Yveltal — and ZYGARDE, the order between.",
      ace: "The cells convene — ZYGARDE enforces the order!", outroWin: "Order is kept. The chamber's aura scatters you from the field.", outroLose: "The serpent of order dissolves into a hundred green motes — balance is satisfied." },
    { key: "gen7", gen: 7, name: "Alola Guardians", emoji: "🌞", needs: "kukui", champ: "KUKUI", regions: ["Alola"],
      team: [785, 791, 792, 801, 802, 800], face: 800, boost: 1.54, pts: 32,
      quote: "Sun and Moon blaze in the sky, the island guardian crackles, and the prism that devours light unfolds its blades.",
      winChron: "eclipsed the Alola cosmos — NECROZMA's light returned!", loseChron: "the blinding one swallowed another dawn",
      lead: "🌞 Tapu Koko, Solgaleo, Lunala, Magearna and Marshadow — and NECROZMA, the light-eater.",
      ace: "The light bends INTO it — NECROZMA unfolds its prisms!", outroWin: "Necrozma drinks the light, and the islands go dark.", outroLose: "Light pours back into the world — the prism dims, at peace." },
    { key: "gen8", gen: 8, name: "Galar Heroes", emoji: "⚔️", needs: "leon", champ: "LEON", regions: ["Galar"],
      team: [888, 889, 890, 894, 895, 898], face: 898, boost: 1.56, pts: 34,
      quote: "The Fairy King's swords are drawn, the endless one coils in the crater, and the frozen monarch mounts his steed.",
      winChron: "dethroned the Galar monarchs — CALYREX lost its crown!", loseChron: "the crowned king unmade another reign",
      lead: "⚔️ Zacian, Zamazenta, Eternatus, Regieleki and Regidrago — and CALYREX, the King of Bountiful Harvests.",
      ace: "The crown blazes — CALYREX and its steed take the field!", outroWin: "The King rides on. The crown was never in question.", outroLose: "The King bows from the saddle — the harvest is yours." },
    { key: "gen9", gen: 9, name: "Paldea Paradox", emoji: "🟣", needs: "geeta", champ: "GEETA", regions: ["Paldea"],
      team: [1001, 1002, 1003, 1004, 1007, 1008], face: 1008, boost: 1.58, pts: 36,
      quote: "The Treasures of Ruin break their seals, and the paradox of past and future thunders out of Area Zero. The final trial.",
      winChron: "conquered the Paldea paradox — the last legend fell!", loseChron: "the paradox devoured another future",
      lead: "🟣 Wo-Chien, Chien-Pao, Ting-Lu, Chi-Yu and Koraidon — and MIRAIDON, the Iron Serpent.",
      ace: "A roar from the future — MIRAIDON breaks from Area Zero!", outroWin: "The paradox accelerates beyond you — time keeps its secret.", outroLose: "Past and future power down, side by side. The paradox is tamed." },
  ];
  window.LEGEND_CHALLENGES = LEGENDS;

  // Unlocked once this trainer has toppled the gating Champion.
  function champBeaten(attId, key) {
    if (window.LeagueGate && LeagueGate.hasBeat) return LeagueGate.hasBeat(attId, key);   // self-healing (re-infers sync-clipped wins)
    return Store.leagueWins(attId).indexOf(key) >= 0;
  }
  function unlocked(lg, attId) { return champBeaten(attId, lg.needs); }

  // 🐍 REGION SPECIALS — one-off legendary boss battles beyond the per-gen
  // challenges, each mounted on its era's Journey tab. Gated on that region's
  // Champion (raw league win) — except the Clash of Ages, the capstone that
  // demands ALL NINE Legendary Challenges. Wins record to s.secrets[att].
  const SPECIALS = [
    // ---- KANTO: the Orange League (the anime!) — the crew Ash actually
    // beat first, ending with Supreme Leader DRAKE and his Dragonite.
    { key: "orange", tab: "Kanto", name: "THE ORANGE LEAGUE", flair: "KANTO SPECIAL · The Orange Archipelago",
      sub: "Kanto Special · Four island leaders (Luana fights DOUBLES) — then Supreme Leader DRAKE · one squad, 5 battles",
      icon: "🍊", face: 149, boost: 1.4, pts: 30, needs: "blue", champ: "BLUE",
      chain: [
        { name: "CISSY", flair: "🌊 MIKAN ISLAND · Coral-Eye Badge", icon: "🌊", face: 9, boost: 1.2,
          team: [117, 9],
          quote: "On Mikan Island we don't just battle — we race the waves first. But your kind always skips to the fighting, so… Seadra! Blastoise! Water Gun on my mark!",
          outro: { lose: "Clean run, straight shooting. The Coral-Eye Badge is yours, sailor.",
            win: "Wiped out! Come back when you can ride a wave AND throw a ball." } },
        { name: "DANNY", flair: "🧊 NAVEL ISLAND · Sea Ruby Badge", icon: "🧊", face: 31, boost: 1.25,
          team: [87, 31],
          quote: "You climbed the mountain without your Pokémon — good. Rule of Navel Island: the trainer carries themself, THEN the Pokémon carry the battle.",
          outro: { lose: "Ha! You froze, you carved, you conquered. Sea Ruby Badge — you earned every degree of it.",
            win: "The mountain decides who's ready. Today it said no." } },
        { name: "RUDY", flair: "⚡ TROVITA ISLAND · Spike Shell Badge", icon: "⚡", face: 121, boost: 1.3,
          team: [125, 121],
          quote: "On Trovita, Pokémon don't just fight — they DANCE. Attacks on the beat, if you please. Electabuzz, Starmie: positions!",
          outro: { lose: "…And THAT is how you dance. The Spike Shell Badge, with my respect.",
            win: "No rhythm, no badge. Practice your footwork." } },
        // 👥 Kumquat Island's house rule: Luana ONLY battles 2-on-2.
        { name: "LUANA", flair: "👥 KUMQUAT ISLAND · Jade Star Badge — DOUBLES", icon: "👥", face: 105, boost: 1.32,
          duoShared: true, team: [65, 105],
          quote: "Kumquat Island rule, dear: two Pokémon each, side by side, and we see whose PAIR fights as one. Alakazam, Marowak — you know the drill.",
          outro: { lose: "Beautiful teamwork! You'd make my son proud. The Jade Star Badge is yours.",
            win: "Your two fought like strangers. Come back when they're family." } },
      ],
      finale: { npc: "DRAKE", name: "SUPREME LEADER DRAKE", flair: "🐉 PUMMELO STADIUM · The Winner's Trophy", icon: "🐉", face: 149,
        quote: "Pummelo Stadium, full house. The undefeated head of the Orange Crew rolls his shoulders — 'No trainer has ever taken my Dragonite past its first yawn. Show me something new.'" },
      team: [132, 95, 94, 125, 3, 149], reserve: 1,
      speak: { 5: ["The crowd goes silent. Drake reaches for his LAST ball — 'You woke it up. Nobody wakes it up.'",
                   "DRAGONITE descends onto the field."] },
      outro: { lose: "Drake shakes your hand as the stadium erupts. 'Trophy's yours. Dragonite doesn't bow often — remember this.'",
               win: "Dragonite yawns, stretches, and goes back to sleep. Drake grins: 'Told you.'" },
      quote: "Across the archipelago the badges are earned sideways — wave runs, cliff climbs, dance-offs and double battles — and at the end of the water waits Pummelo Stadium, where the Supreme Leader's Dragonite has never been woken up by a challenger. The league Ash won first.",
      winChron: "conquered the ORANGE LEAGUE — four islands fell, and Drake's DRAGONITE finally bowed!",
      loseChron: "the archipelago kept its trophy",
      lead: "🍊 Cissy's tides, Danny's ice, Rudy's rhythm, Luana's DOUBLE battle — then DRAKE, undefeated at Pummelo, with the Dragonite that never wakes up twice." },
    // ---- JOHTO: Cipher's masterpiece (Orre / XD) — the door it never
    // should have opened. A Pokémon whose heart was shut on purpose.
    { key: "xd001", tab: "Johto", name: "XD001 · SHADOW LUGIA", flair: "JOHTO SPECIAL · Cipher's Masterpiece", feral: true,
      sub: "Johto Special · Miror B dances the door open — then the whale of the deep, painted wrong · 2 battles",
      icon: "🌘", face: 249, boost: 1.5, pts: 34, needs: "lance", champ: "LANCE",
      chain: [
        { name: "MIROR B", flair: "🕺 THE FUNK OF ORRE", icon: "🕺", face: 272, boost: 1.3,
          team: [272, 272, 272, 272],
          quote: "Ohhh yeah baby — you found Miror B! Four Ludicolo, one groove, ZERO shame. Let the music play!",
          outro: { lose: "The music… stopped?! Fine, FINE — the big fish is below deck. Don't say Miror B never gave you nothing.",
            win: "That's the rhythm of defeat, baby! Cha-cha-cha!" } },
      ],
      finale: { npc: "XD001", name: "XD001 · SHADOW LUGIA", flair: "🌘 THE DOOR TO THE DARK", icon: "🌘", face: 249,
        quote: "The cargo bay is cold. Something vast hangs in the dark — Lugia, but wrong: violet where there should be silver, eyes with nothing behind them. Cipher closed its heart on purpose. Opening it again goes through you." },
      team: [249], shiny: true, hpBoost: 2.6,
      outro: { lose: "The violet drains away like a tide going out. Silver again, Lugia looks at you once — grateful, unknowable — and dives.",
               win: "The dark door closes with you on the wrong side of it." },
      quote: "In Orre they built a Pokémon that couldn't feel. Fight past Cipher's dancing admiral and stand in front of XD001 — SHADOW LUGIA, the whale of the deep painted wrong — and hit it hard enough to remind it what it was.",
      winChron: "opened the dark door — MIROR B danced, and XD001, SHADOW LUGIA, came home to silver!",
      loseChron: "the shadow door stayed shut",
      lead: "🌘 Miror B and his four-Ludicolo disco — then XD001 itself, a raid-sized SHADOW LUGIA in its wrong colors." },
    // ---- HOENN: the Delta Episode (ORAS) — Zinnia, then the meteor's rider.
    { key: "delta", tab: "Hoenn", name: "THE DELTA EPISODE", flair: "HOENN SPECIAL · Sky High, ORAS",
      sub: "Hoenn Special · Zinnia the Lorekeeper — then soar to the meteor, where something alien waits · 2 battles",
      icon: "☄️", face: 386, boost: [0.62, 0.62, 0.78], pts: 30, needs: "steven", champ: "STEVEN",
      chain: [
        { name: "ZINNIA", flair: "🐉 THE LOREKEEPER", icon: "🐉", face: 373, boost: 0.86,
          team: [715, 334, 697, 706, 373],
          quote: "You want to stop the meteor with a machine? How boring. The old ways say a dragon must rise. Show me your bond is worth more than draconid lore — or step aside!",
          outro: { lose: "…Aster. Did you see it? I lost — and somehow it made me smile. Go, hero. The sky is yours to save.",
            win: "Lorekeeper's verdict: not yet. The sky would swallow you whole." } },
      ],
      finale: { npc: "DEOXYS", name: "DEOXYS", flair: "🌌 THE METEOR'S RIDER", icon: "🌌", face: 386,
        quote: "You soar past the clouds on a dragon's back. The meteor cracks open — and the thing inside unfolds, watching you with a single crystal eye." },
      team: [386, 10001, 10003], reserve: 2,
      speak: { 1: ["The DNA Pokémon twists and re-knits itself — ATTACK FORME!"],
               2: ["It will not fall — the visitor reshapes once more. SPEED FORME!"] },
      outro: { lose: "The visitor folds itself small, hangs in orbit a moment… and drifts back into the dark, satisfied.",
               win: "The crystal eye dims you out of the sky. Hoenn's fate rides on the next attempt." },
      quote: "A meteor is coming for Hoenn, and the Draconids say a machine won't save you. Beat the Lorekeeper for the right to ride the sky — and face what rides the meteor down.",
      winChron: "cleared THE DELTA EPISODE — Zinnia bowed, and DEOXYS fell at the edge of space!",
      loseChron: "the meteor kept its rider",
      lead: "☄️ Zinnia and her Salamence guard the old ways. Beyond her: the stratosphere, and DEOXYS — which refuses to stay one shape." },
    // ---- KALOS runs a little timeline of its own: XY's villain arc, the
    // order trio, AZ's peace — and then LEGENDS Z-A, Lumiose rebuilt.
    // ---- HOENN: the BATTLE FRONTIER (Emerald) — seven Brains, one squad,
    // and at the top of the Pyramid a man who commands the golems themselves.
    { key: "frontier", tab: "Hoenn", name: "THE BATTLE FRONTIER", flair: "HOENN SPECIAL · Seven Facilities, Seven Brains",
      sub: "Hoenn Special · Six Frontier Brains back-to-back — then BRANDON and the Regis atop the Pyramid · one squad, 7 battles",
      icon: "🏛️", face: 377, boost: 1.5, pts: 40, needs: "steven", champ: "STEVEN",
      chain: [
        { name: "NOLAND", flair: "🏭 THE FACTORY HEAD", icon: "🏭", face: 376, boost: 1.3,
          team: [65, 130, 376],
          quote: "Factory rule is rentals, but for you? I'm bringing MY tools. Let's see what you're built from.",
          outro: { lose: "Solid engineering, kid. The Knowledge Symbol's yours — six Brains to go.",
            win: "Back to the assembly line with you." } },
        { name: "GRETA", flair: "🥋 THE ARENA TYCOON", icon: "🥋", face: 214, boost: 1.34,
          team: [214, 197, 68],
          quote: "Three rounds, no stalling, ALL heart! The Arena only respects trainers who swing first!",
          outro: { lose: "WOO! Now THAT'S fighting spirit! Take the Guts Symbol and keep swinging!",
            win: "Judges' decision: knockout. Hit the showers." } },
        { name: "TUCKER", flair: "🎪 THE DOME ACE", icon: "🎪", face: 6, boost: 1.38,
          team: [6, 130, 272],
          quote: "LADIES AND GENTLEMEN! The Dome Ace has entered the arena! Try to lose beautifully, darling — the crowd is watching!",
          outro: { lose: "Magnifique! The Tactics Symbol — and the spotlight — are yours tonight!",
            win: "The crowd came for a star and got a cautionary tale. Exit stage left!" } },
        { name: "LUCY", flair: "🐍 THE PIKE QUEEN", icon: "🐍", face: 336, boost: 1.4,
          team: [336, 213, 350],
          quote: "…Three doors. You picked the one with me behind it. Unlucky.",
          outro: { lose: "…Hm. The Luck Symbol. Don't make me smile again.",
            win: "The Pike swallows another one. Next." } },
        { name: "SPENSER", flair: "🗿 THE PALACE MAVEN", icon: "🗿", face: 289, boost: 1.42,
          team: [169, 289, 131],
          quote: "In the Palace, a Pokémon fights from its NATURE, not its orders. Show me yours trust you when you stop commanding them.",
          outro: { lose: "Their spirit moved before your voice did. The Spirits Symbol, young one.",
            win: "Your bond is still all leash. Come back when it's roots." } },
        { name: "ANABEL", flair: "🗼 THE SALON MAIDEN", icon: "🗼", face: 196, boost: 1.46,
          team: [143, 196, 243],
          quote: "I feel what my Pokémon feel — every spark, every heartbeat. It makes us very hard to surprise. Shall we?",
          outro: { lose: "…That, I did not feel coming. The Ability Symbol — Brandon waits at the Pyramid.",
            win: "I felt your resolve waver before you did. Rest, then try again." } },
      ],
      finale: { npc: "BRANDON", name: "PYRAMID KING BRANDON", flair: "⛰️ THE PYRAMID KING", icon: "⛰️", face: 377,
        quote: "Atop the Battle Pyramid the explorer turns, and behind him three ancient shapes grind out of the stone. 'I did not FIND the golems,' Brandon says. 'They found ME. GO — REGIROCK! REGICE! REGISTEEL!'" },
      team: [377, 378, 379],
      outro: { lose: "The three golems power down with a sound like closing tombs. Brandon nods once: 'Frontier conquered. All seven symbols. Remember the weight of them.'",
               win: "The Pyramid keeps its gold. Train, return, ascend." },
      quote: "Seven facilities, seven Brains, one squad of six carried through all of it — the Factory, the Arena, the Dome, the Pike, the Palace, the Tower… and at the Pyramid's peak, Brandon and the three legendary golems. Emerald's crown, rebuilt.",
      winChron: "conquered the BATTLE FRONTIER — all seven Brains fell, and Brandon's REGIS crumbled at the Pyramid's peak!",
      loseChron: "the Frontier kept its symbols",
      lead: "🏛️ Noland, Greta, Tucker, Lucy, Spenser, Anabel — then PYRAMID KING BRANDON with Regirock, Regice and Registeel." },
    { key: "flare", tab: "Kalos", name: "THE ULTIMATE WEAPON", flair: "KALOS SPECIAL · Team Flare's Dawn", feral: true,
      sub: "Kalos Special · Lysandre in the lab, then the weapon's core — life and death, unchained · 2 battles",
      icon: "🔥", face: 716, boost: 1.5, pts: 30, needs: "diantha", champ: "DIANTHA",
      chain: [
        { name: "LYSANDRE", flair: "🔥 THE FLARE BOSS", icon: "🔥", face: 10041, boost: 1.4,
          team: [620, 430, 668, 10041],   // Mienshao, Honchkrow, Pyroar, MEGA Gyarados
          quote: "I wanted a beautiful world. Humanity keeps soiling it — so the ultimate weapon will prune the garden. You would stop me? Then you carry the ugliness too.",
          outro: { lose: "…So my beauty was a delusion after all. Do what you will with this filthy, wonderful world.",
            win: "The weapon blooms at dawn, little gardener. Farewell." } },
      ],
      finale: { npc: "THE WEAPON'S CORE", name: "XERNEAS & YVELTAL", flair: "⚗️ THE WEAPON'S CORE", icon: "⚗️", face: 716,
        quote: "At the machine's heart, the life Pokémon glows like a captive sunrise. And coiled beneath it, feeding on the same wire… something with black wings." },
      team: [716, 717], reserve: 1,
      speak: { 1: ["Beneath the light of life, DEATH stirs — YVELTAL unfurls its wings!"] },
      outro: { lose: "The weapon powers down. Light and death drift apart, free — and Kalos never sees the dawn Lysandre promised.",
               win: "The core flares. You wake outside the lab with your ears ringing and the countdown still running." },
      quote: "Team Flare's key turns tonight. Cut through Lysandre's lab, then face what the ultimate weapon runs on: XERNEAS — and the death coiled beneath it.",
      winChron: "shut down THE ULTIMATE WEAPON — Lysandre fell, and Xerneas AND Yveltal were set loose!",
      loseChron: "the ultimate weapon kept its countdown",
      lead: "🔥 Lysandre and his MEGA Gyarados hold the lab. In the core: Xerneas, radiant — and one hidden ball that is not a ball." },
    { key: "zygarde", tab: "Kalos", name: "THE ORDER OF KALOS", flair: "KALOS SPECIAL · Forms of Zygarde",
      sub: "Kalos Special · Zygarde's forms + Xerneas & Yveltal · 5v5",
      icon: "🐍", face: 10120, boost: 1.52, pts: 30, needs: "diantha", champ: "DIANTHA", after: "flare",
      team: [716, 717, 10118, 718, 10120],
      quote: "Life blooms. Destruction circles. And beneath Kalos the cells stir — ten percent, fifty… until the ecosystem's guardian stands COMPLETE. Disturb the balance, and answer to ORDER itself.",
      winChron: "restored the ORDER OF KALOS — Xerneas, Yveltal and every form of ZYGARDE, felled in one stand!",
      loseChron: "ZYGARDE COMPLETE judged the balance undisturbed",
      lead: "🐍 Xerneas and Yveltal — then Zygarde rises: 10%, 50%, and the COMPLETE form." },
    { key: "az", tab: "Kalos", name: "AZ", flair: "KALOS SPECIAL · The 3000-Year Man",
      sub: "Kalos Special · The giant who fired the weapon, and the flower he lost · 3v3…?",
      icon: "🌸", face: 10061, boost: 1.44, pts: 26, needs: "diantha", champ: "DIANTHA", after: "zygarde",
      team: [324, 561, 623, 10061], playerSize: 3, reserve: 1,
      speak: { 3: ["The giant goes still. Something small and bright drifts down to his shoulder…",
                   "…she came back. After three thousand years — the ETERNAL FLOWER FLOETTE fights for him one last time."] },
      quote: "Three thousand years I have wandered. I am the man who fired the ultimate weapon — who burned a war away, and my own heart with it. Battle me. I have long forgotten how to feel anything at all.",
      outro: { lose: "…Ah. So this is what it feels like… to be free. Thank you, trainer. Truly.",
               win: "Even eternity wins sometimes. Not the peace I wanted — but a battle worth three thousand years." },
      winChron: "freed AZ — three thousand years ended, and the Eternal Floette came home!",
      loseChron: "AZ walked on, still waiting",
      lead: "🌸 Torkoal, Sigilyph, Golurk — machines of an ancient war. And one more presence the giant does not know is coming." },
    // ---- LEGENDS Z-A (the Kalos epilogue, like Hisui after Sinnoh):
    // Lumiose rebuilt — and Mega Evolution running wild in the streets.
    { key: "rogues", tab: "Kalos", name: "THE ROGUE MEGAS", flair: "LUMIOSE SPECIAL · Legends Z-A",
      sub: "Legends Z-A · Lumiose rebuilt — and rogue Mega Evolutions rampaging through the boulevards · 6v6",
      icon: "🏙", face: 10058, boost: 1.54, pts: 34, needs: "diantha", champ: "DIANTHA", after: "az",
      team: [10039, 10046, 10057, 10059, 10089, 10058],   // M-Kangaskhan → M-Garchomp
      quote: "Lumiose is being reborn — tower by tower, quarter by quarter. But something in the new city drives Mega Evolution feral: rogue Megas rampage down the boulevards, glowing wrong. Someone has to stand in the street and calm them all.",
      winChron: "calmed the ROGUE MEGAS of Lumiose — six feral Mega Evolutions, soothed one by one!",
      loseChron: "the rogue Megas still own Lumiose's night",
      lead: "🏙 Mega Kangaskhan, Scizor, Absol, Lucario, Salamence — and a feral MEGA GARCHOMP tearing up Centrico Plaza." },
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
      winChron: "saw through VOLO's smile — Garchomp, Giratina, ORIGIN Giratina, all of it, beaten!",
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
    // ---- UNOVA: N's Castle — the series' most famous story battle.
    // ---- SINNOH: TOBIAS (the anime's most unfair legend) — the man who
    // swept a whole league with a Darkrai nobody could touch.
    { key: "tobias", tab: "Sinnoh", name: "TOBIAS", flair: "SINNOH SPECIAL · Lily of the Valley",
      sub: "Sinnoh Special · The trainer who ended Ash's best run — Darkrai, Latios, and nobody has ever seen the rest · 6 v ???",
      icon: "🌑", face: 491, boost: 1.55, hpBoost: 1.8, pts: 34, needs: "cynthia", champ: "CYNTHIA",
      team: [491, 381], reserve: 1, playerSize: 6,
      speak: { 1: ["Darkrai falls — and the stadium gasps. Nobody has EVER gotten this far.",
                   "Tobias smiles for the first time. 'Then you've earned the second one.' LATIOS descends."] },
      outro: { lose: "Tobias returns Latios and studies you for a long moment. 'Four more wait in my belt. May we never need them.' He walks off into legend.",
               win: "Darkrai never even woke the second ball. The stadium files out in silence." },
      quote: "He swept every gym with one Pokémon. He ended the best league run the anime ever saw. Six of yours against a Darkrai with a raid-sized nightmare pool — and if you somehow drop it, the Latios comes out. Nobody in history has seen his third.",
      winChron: "beat TOBIAS — the Darkrai fell, the Latios followed, and the rest of his belt stays a mystery!",
      loseChron: "the nightmare swept another challenger",
      lead: "🌑 A raid-pool DARKRAI, then LATIOS — six of yours against the anime's most unfair trainer." },
    { key: "ncastle", tab: "Unova", name: "N'S CASTLE", flair: "UNOVA SPECIAL · Two Heroes, One Truth",
      sub: "Unova Special · The castle rises over the League — N and his dragon, then Ghetsis, enraged · 2 battles",
      icon: "🏰", face: 635, boost: 1.46, pts: 32, needs: "alder", champ: "ALDER",
      chain: [
        { name: "N", flair: "🐲 THE KING OF TEAM PLASMA", icon: "🐲", face: 644, boost: 1.42,
          team: [571, 555, 567, 565, 601, 644], reserve: 1,
          speak: { 5: ["The world speaks to me in formulas — and every formula ends the same way.",
                       "ZEKROM! Deep Black Pokémon — hero of IDEALS — answer the truth in my heart!"] },
          quote: "I am N, king of Team Plasma. My castle has swallowed your Pokémon League. Formulas cannot express the bond you claim to share with Pokémon — so show me the variable I am missing.",
          outro: { lose: "…The truth I sought was standing in front of me all along. There is no formula for what you two just did.",
            win: "The equation holds. Your ideals were lighter than mine. Go home, trainer." } },
      ],
      finale: { npc: "GHETSIS", name: "GHETSIS", flair: "👁 THE SAGE UNMASKED", icon: "👁", face: 635,
        quote: "Before you can breathe, a green-robed figure shoves past the king. \"You RUINED it! I created Team Plasma with these hands — I made that boy — and I will NOT be denied by a child with a Pokédex!\"" },
      team: [563, 626, 537, 625, 604, 635],
      outro: { lose: "My plans… my flawless, perfect plans! I am absolute! I AM PERFECTION! …I am… nothing.",
               win: "Weep, little hero. Your ideals end in my castle — and my world begins at dawn." },
      quote: "You beat the Champion — and the ground shook. N's castle has risen around the Pokémon League itself. Somewhere inside, a king waits with a black dragon… and behind him, the man who built the king.",
      winChron: "took N'S CASTLE — the king's ZEKROM fell, and GHETSIS raged into ruin!",
      loseChron: "the castle still stands over the League",
      lead: "🏰 N fields his wild-caught court — and one hidden ball crackling with ideals. Beat him, and his father does NOT take it well." },
    { key: "myths", tab: "Unova", name: "THE MYTHS OF UNOVA", flair: "UNOVA SPECIAL · Songs & Storms",
      sub: "Unova Special · The storm genies, the colt, the song — and the landlord · 5v5",
      icon: "🎵", face: 645, boost: 1.50, pts: 28, needs: "alder", champ: "ALDER",
      team: [641, 642, 647, 648, 645],
      quote: "Two genies wreck the skies while a colt of justice and a living melody try to hold the line — until the Abundance itself descends to settle the storm.",
      winChron: "quieted the MYTHS OF UNOVA — genies grounded, the song stilled, LANDORUS bowed!",
      loseChron: "Unova's storms howled another challenger away",
      lead: "🎵 Tornadus and Thundurus tearing the sky, Keldeo and Meloetta holding the line — and LANDORUS to end it." },
    // ---- ALOLA: Aether Paradise — Lusamine and the Motherbeast.
    // ---- UNOVA: the SUBWAY BOSSES — the twin conductors, and the series'
    // one true double-battle duo. (All aboard. Ingo came home for this.)
    { key: "subway", tab: "Unova", name: "INGO & EMMET", flair: "UNOVA SPECIAL · The Battle Subway",
      sub: "Unova Special · The twin conductors fight as one — a true DOUBLE battle on the rails · 4v4 doubles",
      icon: "🚇", face: 609, boost: 1.45, pts: 32, needs: "alder", champ: "ALDER",
      duo: { names: ["INGO", "EMMET"], teams: [[530, 609], [632, 604]] },
      team: [530, 609, 632, 604],
      outro: { lose: "Emmet beams: 'I am Emmet. We lost. That is also a kind of arriving.' Ingo tips his cap, and for a heartbeat he looks somewhere very far away — 'Wherever the rails take us next… thank you for this stop.'" },
      quote: "Two conductors, one uniform in white and one in black, finishing each other's battle plans since the day the Subway opened. They only fight DOUBLES, they never fight apart — and one of them once came back from somewhere very old with his cap full of snow. All aboard.",
      winChron: "beat the SUBWAY BOSSES — Ingo & Emmet's double formation finally derailed!",
      loseChron: "the Battle Subway rolled on without them",
      lead: "🚇 Ingo's Excadrill & Chandelure beside Emmet's Durant & Eelektross — the twins fight as ONE, and so must your pair." },
    { key: "aether", tab: "Alola", name: "AETHER PARADISE", flair: "ALOLA SPECIAL · The Mother's Love",
      sub: "Alola Special · Lusamine in Ultra Space — where love means never letting go · 6v6…?",
      icon: "🧬", face: 793, boost: 1.44, pts: 30, needs: "kukui", champ: "PROF. KUKUI",
      team: [36, 350, 429, 549, 760, 793], playerSize: 5, reserve: 1,
      speak: { 5: ["You would take my family from me? After everything I gave them?!",
                   "N-nngh… the light… so beautiful… NIHILEGO — MAKE US BEAUTIFUL! (Lusamine fuses with the Motherbeast!)"] },
      quote: "Welcome to Aether Paradise, little wanderer — where every Pokémon is loved forever and ever and ever. You've come to break up my family? How cruel. How ugly. Stay a while… stay FOREVER.",
      outro: { lose: "…the light let go of me. Gladion… Lillie… what did I almost become?",
               win: "Stay, little one. Everyone stays. Forever and ever and ever…" },
      winChron: "broke the spell of AETHER PARADISE — Lusamine's court fell, and the MOTHERBEAST let her go!",
      loseChron: "the Motherbeast kept its favorite",
      lead: "🧬 Clefable, Milotic, Mismagius, Lilligant, Bewear — a family that never says goodbye. And in Ultra Space, mother and NIHILEGO stop being two creatures." },
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
      icon: "☄️", face: 10157, boost: 1.56, pts: 34, needs: "kukui", champ: "PROF. KUKUI", after: "aether",
      team: [793, 794, 796, 797, 799, 10157],
      quote: "The sky tears open and the beasts of Ultra Space pour through — parasite, swollen fist, living wire, rocket hull, glutton. And behind them all, drowned in stolen light… ULTRA NECROZMA.",
      winChron: "sealed the ULTRA RIFT — five Ultra Beasts down, and ULTRA NECROZMA's light returned!",
      loseChron: "the Rift swallowed another world's champion",
      lead: "☄️ Nihilego, Buzzwole, Xurkitree, Celesteela and Guzzlord — then ULTRA NECROZMA, blinding and absolute." },
    // ---- ALOLA: TEAM RAINBOW ROCKET (USUM) — every villain boss from
    // every era, assembled in Giovanni's stolen castle. The crossover.
    { key: "rrocket", tab: "Alola", name: "TEAM RAINBOW ROCKET", flair: "ALOLA SPECIAL · The Castle of Every Villain",
      sub: "Alola Special · Maxie, Archie, Cyrus, Ghetsis, Lysandre — then GIOVANNI and his Mega Mewtwo · one squad, 6 battles",
      icon: "🌈", face: 150, boost: 1.5, pts: 42, needs: "kukui", champ: "KUKUI",
      chain: [
        { name: "MAXIE", flair: "🌋 TEAM MAGMA · the land's ambition", icon: "🌋", face: 383, boost: 1.4,
          team: [262, 169, 323, 383],
          quote: "In MY world, the Ultimate Weapon fired and the continents grew. I regret nothing — Groudon regrets less.",
          outro: { lose: "Tch… even here, the land betrays me. Go. The others are worse.",
            win: "The land expands, and you are not on it." } },
        { name: "ARCHIE", flair: "🌊 TEAM AQUA · the sea's hunger", icon: "🌊", face: 382, boost: 1.42,
          team: [262, 169, 319, 382],
          quote: "Where I come from, the rains never stopped and the sea took everything back. BEST decision I ever made! KYOGRE!",
          outro: { lose: "HAH! Sunk by a landlubber! Fine — the scary ones are upstairs.",
            win: "Glub glub, kid. The sea keeps what it catches." } },
        { name: "CYRUS", flair: "🌌 TEAM GALACTIC · the null world", icon: "🌌", face: 484, boost: 1.44,
          team: [229, 430, 461, 483, 484],
          quote: "I come from the world I succeeded in creating. There is no spirit there. No strife. Nothing. It is perfect — and I will have it again.",
          outro: { lose: "Emotion… persists. A flaw in every world, it seems.",
            win: "Deleted, like everything else that feels." } },
        { name: "GHETSIS", flair: "🐉 TEAM PLASMA · the puppet king", icon: "🐉", face: 646, boost: 1.46,
          team: [563, 625, 635, 646],
          quote: "In my world the boy N never found his heroes, and Unova knelt. You are not even a footnote in the speech I am about to give.",
          outro: { lose: "IMPOSSIBLE! I am PERFECTION! I am— get away from me!",
            win: "Kneel. Everyone does, eventually." } },
        { name: "LYSANDRE", flair: "🔥 TEAM FLARE · the chosen few", icon: "🔥", face: 717, boost: 1.48,
          team: [620, 430, 668, 130, 717],
          quote: "My weapon fired, and only the beautiful remained. Look at this castle — villains from five worlds, and every one of us WON. What does that tell you about yours?",
          outro: { lose: "…Perhaps a world with trainers like you did not need cleansing. A troubling thought to lose to.",
            win: "The unchosen fall. It is almost merciful." } },
      ],
      finale: { npc: "GIOVANNI", name: "GIOVANNI", flair: "🌈 THE MAN WHO NEVER LOSES TWICE", icon: "🌈", face: 150,
        quote: "The throne room. The man who vanished from Viridian sits at the head of every villain who ever won, stroking a ball that hums with something furious. 'In every world, in every timeline, there is one constant,' Giovanni says, standing. 'ME.'" },
      team: [51, 31, 34, 464, 150], gimmick: "mega", reserve: 1,
      speak: { 4: ["Giovanni's last ball opens — and the fury inside it needs no introduction.",
                   "MEWTWO. And Giovanni is already reaching for the Key Stone."] },
      outro: { lose: "The castle lights gutter. Giovanni straightens his suit — 'A world where I lose. How novel.' — and is gone before the echo fades. The rainbow over the castle burns out.",
               win: "Giovanni sits back down among the victors of five worlds. 'As I said. One constant.'" },
      quote: "A castle drops out of a wormhole with a rainbow burning over it. Inside: Maxie and Archie from worlds where the weapon fired, Cyrus from his perfect nothing, Ghetsis from a kneeling Unova, Lysandre from the cleansed earth — and at the head of the table, the Rocket Boss himself, holding a Mega Stone and the world's angriest Pokémon.",
      winChron: "toppled TEAM RAINBOW ROCKET — five victorious villains fell, and Giovanni's MEGA MEWTWO went down with the castle!",
      loseChron: "the rainbow castle claimed another world",
      lead: "🌈 Five bosses who WON their timelines — Groudon, Kyogre, Dialga & Palkia, Kyurem, Yveltal — then GIOVANNI, and the Mega Mewtwo he always promised himself." },
    // ---- GALAR: the Darkest Day — Rose, then ETERNAMAX Eternatus.
    { key: "darkest", tab: "Galar", name: "THE DARKEST DAY", flair: "GALAR SPECIAL · Rose's Tomorrow",
      sub: "Galar Special · Chairman Rose wakes the storm — then the sky itself descends · 2 battles",
      icon: "🌑", face: 890, boost: 1.6, pts: 36, needs: "leon", champ: "LEON",
      chain: [
        { name: "CHAIRMAN ROSE", flair: "🏢 MACRO COSMOS TOWER", icon: "🏢", face: 879, boost: 1.44,
          team: [601, 863, 589, 598, 879],
          quote: "Galar's energy runs out in a thousand years. A THOUSAND! How can Leon sleep at night?! The Darkest Day is not a disaster, child — it is a battery. I am simply turning the key early.",
          outro: { lose: "…Leon believed in you too. Very well. Let tomorrow judge which of us loved Galar more.",
            win: "You see? Sacrifices must be made — and tonight, you were one of them." } },
      ],
      finale: { npc: "ETERNATUS", name: "ETERNATUS", flair: "🌌 THE DARKEST DAY", icon: "🌌", face: 890,
        quote: "The sky over Hammerlocke splits open, raining red light. Something vast and skeletal uncoils from the clouds — the storm that felled Galar 3,000 years ago, awake and hungry." },
      // 🐺 the wolves don't just watch anymore — the finale is a 2-on-1
      // DOUBLE battle with ZACIAN & ZAMAZENTA fighting at your side.
      ally: { name: "ZACIAN & ZAMAZENTA", monIds: [888, 889], boost: 1.2 },
      team: [890, 10190], reserve: 1,
      speak: { 1: ["The sky tears — ETERNATUS surges into its ETERNAMAX form, a storm with a heartbeat!",
                   "Two howls answer from the hills… Zacian and Zamazenta stand with you. NOW — BRING IT DOWN!"] },
      outro: { lose: "The storm collapses into a single sleeping core. Zacian and Zamazenta bow once — and vanish into the hills.",
               win: "The Darkest Day swallows Hammerlocke whole. Somewhere below, Rose is smiling." },
      quote: "Chairman Rose couldn't wait for tomorrow. Fight through Macro Cosmos, then stand in the stadium as the sky comes down — the Darkest Day itself, in a form no ball can hold.",
      winChron: "ended THE DARKEST DAY — Rose fell, and ETERNAMAX ETERNATUS was brought down over Hammerlocke!",
      loseChron: "the Darkest Day kept rising",
      lead: "🌑 Rose fields Macro Cosmos steel. Then ETERNATUS — and what it becomes when the sky finishes opening is the biggest battle in Galar's history." },
    // ---- GALAR: MUSTARD (Isle of Armor) — the champion before Leon,
    // undefeated for eighteen years, still smiling like it's a picnic.
    { key: "mustard", tab: "Galar", name: "MUSTARD", flair: "GALAR SPECIAL · The Master Dojo",
      sub: "Galar Special · Leon's own master — champion for 18 years, and he never actually retired his edge · 6v6",
      icon: "🍜", face: 892, boost: 1.5, pts: 34, needs: "leon", champ: "LEON",
      team: [620, 405, 823, 9, 3, 892], reserve: 1,
      speak: { 5: ["Mustard cracks his neck, and for one second the smile is gone.",
                   "'My pupil holds the title. But the TOWER remembers who built it.' URSHIFU!"] },
      outro: { lose: "Mustard is beaming again before Urshifu hits the mat. 'WONDERFUL! Best bowl of a battle I've had in years — stay for curry, I insist.'",
               win: "'Almost!' he laughs, patting your shoulder like you didn't just lose. 'The dojo's door is always open.'" },
      quote: "Before Leon, there was Mustard — eighteen years undefeated, the man who trained the unbeatable champion himself. He runs a dojo now, cooks curry, wears silly clothes… and keeps a fist of a Pokémon in his back room for guests who look strong enough to be worth it.",
      winChron: "went a full round with MUSTARD — the 18-year champion's URSHIFU finally hit the mat!",
      loseChron: "the old master is still the old master",
      lead: "🍜 Mienshao, Luxray, Corviknight, both his old starters — then URSHIFU, the fist he built a whole island around." },
    { key: "monarchs", tab: "Galar", name: "MYTHS & MONARCHS", flair: "GALAR SPECIAL · The Uncrowned",
      sub: "Galar Special · The unseen myths and riderless monarchs of the Crown · 6v6",
      icon: "👊", face: 809, boost: 1.56, pts: 34, needs: "leon", champ: "LEON",
      team: [893, 896, 897, 905, 892, 809],
      quote: "A jungle guardian who trusts no one, two riderless steeds of ice and shadow, a fury bottled in a whirlwind, a fist that strikes in a single blow — and the liquid-metal titan a thousand years in the making.",
      winChron: "felled Galar's MYTHS & MONARCHS — Zarude, both steeds, Enamorus, Urshifu and MELMETAL!",
      loseChron: "the uncrowned monarchs kept their myths",
      lead: "👊 Zarude, Glastrier and Spectrier, Enamorus and Urshifu — and MELMETAL, the hex-nut titan." },
    // ---- PALDEA: the Path of Legends — Arven's five Titans.
    { key: "titans", tab: "Paldea", name: "THE PATH OF LEGENDS", flair: "PALDEA SPECIAL · Arven & the Herba Mystica",
      sub: "Paldea Special · The five Titan Pokémon guarding the Herba Mystica — for Mabosstiff · 6v6…?",
      icon: "🥪", face: 977, boost: 1.5, pts: 30, needs: "geeta", champ: "GEETA",
      team: [950, 962, 968, 984, 978, 977], playerSize: 5, reserve: 1,
      speak: { 5: ["The little Tatsugiri dives into the lake… and the whole lake stands up.",
                   "THE FALSE DRAGON'S TRUE BODY — DONDOZO, the last Titan, surfaces!"] },
      quote: "Arven needs the Herba Mystica — every last one — for Mabosstiff. Five colossal Titans guard them: the stone crab, the roaming bird, the iron worm, the quaking earth… and a 'dragon' the old books drew wrong on purpose. Sandwiches after. Let's go.",
      outro: { lose: "Mabosstiff barrels into you at full speed, healed and howling. Arven pretends something's in his eye. Best sandwich you've ever earned.",
               win: "The Titan sinks back below the surface. Arven shoulders his pack — 'we go again tomorrow.'" },
      winChron: "walked the PATH OF LEGENDS — all five Titans fell, and Mabosstiff ate like a king!",
      loseChron: "the Titans kept their herbs",
      lead: "🥪 Klawf on the cliffs, Bombirdier overhead, Orthworm in the sands, Great Tusk in the crater — and a tiny Tatsugiri whose bodyguard is the size of the lake." },
    // ---- 🎭 THE TEAL MASK (Kitakami DLC) — the Loyal Three fall one by
    // one as festival night unravels, and the "villain" of the village
    // songs turns out to be the hero. The ogre defends her mountain last.
    { key: "dlc", tab: "Paldea", name: "THE TEAL MASK", flair: "PALDEA SPECIAL · Kitakami Festival Night",
      sub: "Paldea Special · The Loyal Three fall one by one — then the ogre, unmasked · one squad, 4 battles",
      icon: "🎭", face: 1017, boost: 1.52, pts: 36, needs: "geeta", champ: "GEETA",
      chain: [
        { name: "OKIDOGI", flair: "🐕 THE LOYAL BRUTE · Paradise Barrens", icon: "🐕", face: 1014,
          boost: 1.4, hpBoost: 2.0, team: [1014],
          quote: "The first 'hero' of the village songs finds you in the barrens — a mountain of muscle wearing a stolen chain of gold, and no loyalty left in its eyes.",
          outro: { lose: "The golden chain cracks. Okidogi slumps — and something like relief crosses its face.",
            win: "The brute drags you off the barrens. The song, it seems, was right about ONE thing." } },
        { name: "MUNKIDORI", flair: "🐒 THE LOYAL SCHEMER · Wistful Fields", icon: "🐒", face: 1015,
          boost: 1.44, hpBoost: 2.0, team: [1015],
          quote: "The second 'hero' never fights fair — it floats above the fields, fingers to its temples, and the air starts to taste like poison.",
          outro: { lose: "The schemer's smirk finally slips. It flees toward the mountain, screeching for its master.",
            win: "Your thoughts fold in half. When you wake, your Pokémon are carrying YOU home." } },
        { name: "FEZANDIPITI", flair: "🐦 THE LOYAL CHARMER · Crystal Pool", icon: "🐦", face: 1016,
          boost: 1.48, hpBoost: 2.0, team: [1016],
          quote: "The last 'hero' is beautiful — iridescent, perfumed, adored. The scent off its wings could stop a heart. The village never asked what it was FOR.",
          outro: { lose: "The perfume scatters on the night wind. Three heroes down — and the mountain starts to rumble.",
            win: "The crowd sighs as the charmer takes a bow over you. Fairy tales die hard." } },
      ],
      finale: { npc: "OGERPON", name: "OGERPON", flair: "👹 THE OGRE, UNMASKED · Dreaded Den", icon: "👹", face: 1017,
        quote: "At the top of the mountain, the 'monster' of every campfire story waits — small, quick, furious, and wearing the teal mask her only friend was murdered for. She is not the villain. She was NEVER the villain. But she will test you like one." },
      team: [1017], boost: 1.58, hpBoost: 2.6,
      outro: { lose: "Ogerpon lowers her cudgel and tilts her head. The mask comes off — and underneath is just… a face that's been alone too long. The mountain is quiet at last.",
               win: "The ogre dances alone on the peak, cudgel high. The festival drums keep a respectful distance." },
      quote: "The village sings of three loyal heroes and one wicked ogre. Festival night tells the truth: hunt the Loyal Three across Kitakami — poisoned puppets in stolen jewelry — then climb to the den where the REAL story has been hiding for two hundred years.",
      winChron: "unmasked Kitakami — the Loyal Three fell one by one, and OGERPON danced free on the mountain!",
      loseChron: "the mask stayed on and the songs stayed wrong",
      lead: "🎭 Okidogi in the barrens, Munkidori in the fields, Fezandipiti at the pool — each a boss with a mountain of health — then OGERPON herself, the fastest fury in Kitakami." },
    { key: "paradox", tab: "Paldea", name: "THE PARADOX GAUNTLET", flair: "PALDEA SPECIAL · Area Zero, Unstuck in Time",
      sub: "Paldea Special · Three trials: the deep past, the far future — then the crystal heart of Area Zero · one squad",
      icon: "⏰", face: 1024, boost: 1.5, pts: 38, needs: "geeta", champ: "GEETA", after: "dlc",
      // Battles 1-2 ride `chain`; the finale is the special itself:
      // Terapagos looks like one little turtle… then TERASTALLIZES (10276),
      // then goes STELLAR (10277) — the final test.
      chain: [
        { name: "PROFESSOR SADA", flair: "🦕 TRIAL 1 · THE DEEP PAST", icon: "🦕", face: 1005, boost: 1.46,
          team: [984, 985, 986, 987, 989, 1005],   // Great Tusk → Roaring Moon
          quote: "Welcome to the world before history. I am — I was — Professor Sada. My beasts have never known a trainer… only prey.",
          outro: { lose: "Magnificent… the ancient world bows to you. But I am only an echo of the past. The future is far less kind.",
            win: "The past devours the unprepared. Crawl back to your own era." } },
        { name: "PROFESSOR TURO", flair: "🤖 TRIAL 2 · THE FAR FUTURE", icon: "🤖", face: 1006, boost: 1.5,
          team: [990, 991, 992, 993, 994, 1006],   // Iron Treads → Iron Valiant
          quote: "Query: why do you persist? I am the paradigm of Professor Turo. My machines are what Pokémon become when time finishes with them.",
          outro: { lose: "Calculation complete… defeat acknowledged. What waits beneath the crater is beyond either of us. Go.",
            win: "The future has no room for you. Deleted." } },
      ],
      finale: { npc: "TERAPAGOS", name: "TERAPAGOS", flair: "💎 TRIAL 3 · THE CRYSTAL HEART", icon: "💎", face: 1024,
        quote: "The cavern glows. Something small crawls out of the light… and the light follows it. This is the final test." },
      team: [1024, 10276, 10277], reserve: 2,
      speak: { 1: ["The crystal turtle glows white-hot — TERAPAGOS TERASTALLIZES!"],
               2: ["Stellar light floods the cavern… ITS FINAL FORM. The true test begins."] },
      outro: { lose: "The light dims. Terapagos blinks up at you — small again — and bows its head. Area Zero is yours.",
               win: "Stellar light swallows the chamber. When it fades, you stand at the rim of the crater, empty-handed." },
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
    if (!champBeaten(attId, sp.needs)) return false;
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
    if (sp.after === "flare") return "Shut down THE ULTIMATE WEAPON first — order can't be restored while the countdown runs.";
    if (sp.after === "zygarde") return "Restore THE ORDER OF KALOS first — AZ only battles when the balance is whole.";
    if (sp.after === "az") return "Meet AZ first — Lumiose's rebirth begins where his three thousand years end.";
    if (sp.after === "aether") return "Break the spell of AETHER PARADISE first — the rift only opens for the one who freed Lusamine.";
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
        hint: sp.icon + " " + (sp.duo ? "⚔⚔ DOUBLE battle — your first two picks lead. " : size + "v" + size + " — ") +
          "The lineup is hidden, and they hit like gods. Bring your very best.",
        onDone: (ids) => {
          Duel.start({ mode: "local", title: sp.name.toLowerCase(),
            secret: { key: sp.key, name: sp.name, pts: sp.pts, icon: sp.icon, winChron: sp.winChron, loseChron: sp.loseChron },
            // 👥 a DUO special (the Subway Bosses!) is a double battle —
            // two foes on the field, and you lead two of your own.
            a: sp.duo
              ? { shared: true, units: [{ attId: attId, monIds: ids }, { attId: attId, monIds: ids }] }
              : { units: [{ attId: attId, monIds: ids }] },
            // reserve/speak/outro: hidden reveals, mid-battle lines and the
            // boss's closing quote (Volo's Giratina, Arceus's judgment…).
            b: sp.duo
              ? { units: sp.duo.names.map((nm, k) => ({ npc: nm, ai: true, monIds: sp.duo.teams[k].slice(),
                  boost: sp.boost, vsFace: k === 0 ? sp.face : null, outro: k === 0 ? (sp.outro || null) : null })) }
              : { units: [{ npc: sp.name, ai: true, monIds: sp.team.slice(), boost: sp.boost, vsFace: sp.face,
                  hpBoost: sp.hpBoost || undefined, shiny: sp.shiny || undefined,
                  reserve: sp.reserve || 0, speak: sp.speak || null, ace: sp.ace || null, outro: sp.outro || null, feral: sp.feral }] },
            onResult: () => Router.render() });
        } });
    });
  }

  // ⚔ STORY CHAINS — the mainline games' big set-piece arcs, run as
  // back-to-back battles with ONE squad of six (fully healed between, no
  // swaps). A special declares `chain: [trial, …]` for everything BEFORE
  // the finale; the finale is the special itself (sp.team/boost/reserve/
  // speak/outro — the only battle that records the secret + points).
  // Falling anywhere ends the run. The Paradox Gauntlet, N's Castle, the
  // Darkest Day, the Ultimate Weapon and the Delta Episode all ride this.
  function eraIntro(t, onGo) {
    const src = t.face ? (SP[t.face] || Store.sprite(t.face)) : null;
    const lay = el("div", { class: "league-intro final legend-intro" }, [
      el("div", { class: "league-intro-inner" }, [
        src ? el("img", { class: "league-intro-ico legend-boss-ico", src: src, alt: "" }) : el("div", { class: "league-intro-mt" }, "⚔"),
        el("div", { class: "league-intro-flair" }, t.flair),
        el("div", { class: "league-intro-rank" }, t.name),
        el("div", { class: "league-intro-quote" }, "“" + t.quote + "”"),
        el("div", { class: "toolbar", style: { justifyContent: "center" } }, [
          el("button", { class: "btn spin-btn", onClick: () => { lay.remove(); onGo(); } }, (t.icon || "⚔") + " STEP THROUGH"),
          el("button", { class: "btn subtle", onClick: () => lay.remove() }, "Not yet"),
        ]),
      ]),
    ]);
    document.body.appendChild(lay);
    sfx("fanfare");
    requestAnimationFrame(() => lay.classList.add("go"));
  }
  function challengeChain(sp, attId) {
    const total = (sp.chain || []).length + 1;
    if (Duel.poolFor(attId).length < 6) { alert(sp.name + " runs one squad of 6 through " + total + " battles — catch 6 of your own first (Safari Zone)."); return; }
    specialIntro(sp, () => {
      Duel.pickParty({ attId: attId, min: 6, max: 6,
        title: sp.name + " — pick your ONE squad of 6",
        hint: sp.icon + " The same six carry the whole story (" + total + " battles) — fully healed between, but no swaps.",
        onDone: (ids) => runChainBattle(sp, attId, ids, 0) });
    });
  }
  function runChainBattle(sp, attId, ids, i) {
    const total = (sp.chain || []).length + 1;
    const fell = () => {
      try { Store.update((s) => Store.chron(s, sp.icon, ((Store.attendee(attId) || {}).name || attId) + " — " + sp.loseChron + " (battle " + (i + 1) + "/" + total + ").")); } catch (_) {}
      Router.render();
    };
    if (i < (sp.chain || []).length) {
      const t = sp.chain[i];
      eraIntro(t, () => {
        // 👥 a chain step can be a DOUBLE battle: t.duo = two named trainers
        // (nobody expects the second voice), t.duoShared = one trainer
        // fielding two at once (Luana's Kumquat Island rule).
        const foeSide = t.duo
          ? { units: t.duo.names.map((nm, k) => ({ npc: nm, ai: true, monIds: t.duo.teams[k].slice(),
              boost: t.boost, vsFace: k === 0 ? t.face : null, outro: k === 0 ? (t.outro || null) : null })) }
          : t.duoShared
          ? { shared: true, units: [0, 1].map((k) => ({ npc: t.name, ai: true, monIds: t.team.slice(),
              boost: t.boost, vsFace: k === 0 ? t.face : null, outro: k === 0 ? (t.outro || null) : null })) }
          : { units: [{ npc: t.name, ai: true, monIds: t.team.slice(), boost: t.boost, vsFace: t.face,
              hpBoost: t.hpBoost || undefined,   // 🩸 raid-pool bosses (the Loyal Three)
              shiny: t.shiny || undefined, gimmick: t.gimmick || null,
              reserve: t.reserve || 0, speak: t.speak || null, outro: t.outro || null }] };
        const go = (leadIds) => Duel.start({ mode: "local", gauntlet: true, title: sp.name.toLowerCase() + " (" + (i + 1) + "/" + total + ")",
          a: (t.duo || t.duoShared)
            ? { shared: true, units: [{ attId: attId, monIds: leadIds }, { attId: attId, monIds: leadIds }] }
            : { units: [{ attId: attId, monIds: leadIds }] },
          b: foeSide,
          onResult: (w) => { if (w === "a") runChainBattle(sp, attId, ids, i + 1); else fell(); } });
        if (i === 0) { go(ids); return; }
        Duel.pickLead({ attId: attId, ids: ids, title: "Battle " + (i + 1) + "/" + total + " — " + t.name,
          hint: (t.icon || sp.icon) + " Healed and ready. Choose your lead.", onDone: go });
      });
    } else {
      const fin = sp.finale || { npc: sp.name, name: sp.name, flair: sp.flair, face: sp.face, quote: sp.quote, icon: sp.icon };
      eraIntro(fin, () => {
        const start = (leadIds) => Duel.start({ mode: "local", gauntlet: true, title: sp.name.toLowerCase(),   // a chain finale is still mid-RUN — no rematch popup
          secret: { key: sp.key, name: sp.name, pts: sp.pts, icon: sp.icon, winChron: sp.winChron, loseChron: sp.loseChron },
          // 🐺 an ALLY (sp.ally) turns the finale into a 2-on-1 double battle —
          // the legendary wolves fight beside you against the Darkest Day.
          a: sp.ally
            ? { units: [{ attId: attId, monIds: leadIds },
                        { npc: sp.ally.name, ai: true, monIds: sp.ally.monIds.slice(), boost: sp.ally.boost || 1 }] }
            : { units: [{ attId: attId, monIds: leadIds }] },
          b: { units: [{ npc: fin.npc || sp.name, ai: true, monIds: sp.team.slice(), boost: sp.boost, vsFace: fin.face || sp.face,
            hpBoost: sp.hpBoost || undefined, shiny: sp.shiny || undefined, gimmick: sp.gimmick || null,
            reserve: sp.reserve || 0, speak: sp.speak || null, outro: sp.outro || null, feral: sp.feral }] },
          onResult: () => Router.render() });
        if (!(sp.chain || []).length) { start(ids); return; }
        Duel.pickLead({ attId: attId, ids: ids, title: "The finale — " + (fin.npc || sp.name),
          hint: (fin.icon || sp.icon) + " The last battle. Choose your lead.", onDone: start });
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
              onClick: () => (sp.chain ? challengeChain(sp, attId) : challengeSpecial(sp, attId)) },
              (beaten ? "🔁 Rematch " : sp.icon + " Face ") + sp.name + (sp.chain ? " (" + (sp.chain.length + 1) + " battles)" : " (" + n + "v" + n + ")"))
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
            b: { units: [{ npc: "The " + lg.name, ai: true, monIds: lg.team.slice(), boost: lg.boost, vsFace: lg.face || null,
              feral: true,   // 🐾 gods do not banter — narration + their own scripted words
              ace: lg.ace ? { line: lg.ace } : null,
              outro: { win: lg.outroWin || null, lose: lg.outroLose || null } }] },
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
          : el("div", { class: "legend-lock" }, "🔒 Beat " + (lg.needs === "geeta" ? "Top Champion " : "Champion ") + lg.champ + " to summon the " + lg.name + "."),
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
    const lockedRow = U.lockedTrainerRow("Challenger:");
    const sel = el("select", { class: "in" }, Store.state.attendees.map((a) => el("option", { value: a.id }, a.name + "'s trials")));
    sel.value = attId;
    const host = el("div", { class: "league-journey" });
    sel.addEventListener("change", () => { attId = sel.value; paint(); });
    if (lockedRow) { attId = lockedRow.dataset.me; root.appendChild(lockedRow); }
    else root.appendChild(sel);
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
