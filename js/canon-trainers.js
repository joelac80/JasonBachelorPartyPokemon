/* canon-trainers.js — famous canon trainers (villain bosses & rivals) used as
   Champions-Tournament entrants and as post-gym challengers. Teams are
   final-evolution squads themed to each character. window.CANON_TRAINERS.
   `story: {region, badge, intro}` pins a trainer to their CANON moment on
   the timeline — they ambush you (guaranteed) once you hold that many of
   the region's badges, and keep coming back until you beat them. Trainers
   without a story slot spice up their region's random surprise pool. */
(function () {
  // tier ~ Champions-Tournament seeding weight (higher = wins more often).
  window.CANON_TRAINERS = [
    // 🏢 The SILPH CO. takeover (badge 5, mid-Kanto) — deliberately well
    // before his Earth Badge gym at Viridian, so the Rocket Boss showdown
    // and the gym-leader rematch land as two separate story beats, not
    // back-to-back battles (his gym squad is different too: Rhydon's crew).
    // Canon squad: his pet Persian plus the Silph Co. Kangaskhan and his
    // Ground corps — Rhyperior (the Rhydon line, his true signature) aces.
    // No Tyranitar: that one belongs to SILVER (Stadium 2 rival's ace).
    { name: "GIOVANNI", title: "Rocket Boss", type: "ground", tier: 3, team: [53, 115, 51, 31, 34, 464],
      story: { region: "Kanto", badge: 5, intro: "The elevator doors slide open on Silph Co.'s top floor — Team Rocket's boss sits at the president's desk like he owns it. He looks up, unsurprised." },
      quote: "So — you've grown strong. But Team Rocket bows to no one. Face me." },
    // Sneasel/Golbat/Magneton/Haunter crew grown up, his stolen starter —
    // and TYRANITAR as the ace, the Stadium 2 rival's famous closer.
    { name: "SILVER", title: "Rival", type: "dark", tier: 3, team: [461, 94, 462, 169, 160, 248],
      story: { region: "Johto", badge: 2, intro: "A red-haired trainer shoves past you out of the Azalea shadows — the kid who stole a starter. He wants yours next." },
      quote: "…Don't get cocky. I'll show you what real strength looks like." },
    { name: "ARCHIE", title: "Aqua Leader", type: "water", tier: 3, team: [130, 321, 350, 260, 279, 319],
      story: { region: "Hoenn", badge: 7, intro: "The tide pulls wrong. At the mouth of the Seafloor Cavern, Team Aqua's boss grins beneath his bandana." },
      quote: "The sea will swallow all! You won't stand in the way of my dream." },
    { name: "MAXIE", title: "Magma Leader", type: "fire", tier: 3, team: [262, 257, 76, 169, 289, 323],
      story: { region: "Hoenn", badge: 3, intro: "Smoke rolls off Mt. Chimney. Team Magma's leader stands at the crater's edge, a meteorite in hand." },
      quote: "The land must expand. Step aside — or be burned away." },
    // Platinum's Spear Pillar five, Weavile acing — Cyrus never ran a Tyranitar.
    { name: "CYRUS", title: "Galactic Boss", type: "dark", tier: 3, team: [229, 430, 130, 169, 461],
      story: { region: "Sinnoh", badge: 7, intro: "The sky over Mt. Coronet goes wrong. At the Spear Pillar, Team Galactic's boss speaks without turning around." },
      quote: "Emotion is weakness. I will build a world without it — starting with your defeat." },
    { name: "GHETSIS", title: "Plasma Sage", type: "dark", tier: 4, team: [563, 626, 537, 983, 604, 635],
      region: "Unova",   // no story slot — his moment is N'S CASTLE; he lurks in Unova's surprise pool
      quote: "Kneel. Everything belongs to me — and so will your defeat." },
    { name: "N", title: "Team Plasma King", type: "dragon", tier: 4, team: [571, 567, 565, 584, 601, 644],
      story: { region: "Unova", badge: 3, intro: "The amusement park is empty but for one green-haired trainer by the Ferris wheel. 'First, let's ride. Then… I should tell you. I am the king of Team Plasma.'" },
      quote: "My friends and I hear the voices of Pokémon. Show me the bond you fight with." },
    { name: "LYSANDRE", title: "Flare Boss", type: "dark", tier: 3, team: [668, 620, 430, 448, 715, 130],
      story: { region: "Kalos", badge: 7, intro: "Your Holo Caster crackles — 'This is Lysandre…' — and the doors of Lysandre Labs slide open on their own." },
      quote: "Only the chosen deserve a beautiful world. Prove you belong in it." },
    // His USUM bug crew — Scizor in, Tyranitar out — and GOLISOPOD aces,
    // because it's ya boy's signature.
    { name: "GUZMA", title: "Skull Boss", type: "bug", tier: 3, team: [738, 127, 168, 284, 212, 768],
      story: { region: "Alola", badge: 2, intro: "Po Town's gates swing wide and Team Skull's boss cracks his neck twice. 'It's ya boy. GUZMA! What is it? WHO is it? IT'S ME!'" },
      quote: "Ya boy Guzma's here to knock ya down! Big bad Guzma, comin' through!" },
    // Lucario replaces the stray Tyranitar; SILVALLY closes — Null grew up.
    { name: "GLADION", title: "Rival", type: "dark", tier: 3, team: [745, 461, 571, 169, 448, 773],
      story: { region: "Alola", badge: 3, intro: "A pale kid with a stitched-together Pokémon blocks the pier. 'You're not weak. Prove it — Null and I need the practice.'" },
      quote: "I don't have time for the weak. Come at me with everything." },
    { name: "COLRESS", title: "Plasma Scientist", type: "steel", tier: 3, team: [462, 604, 649, 596, 637, 601],
      story: { region: "Unova", badge: 6, intro: "The Plasma Frigate hums overhead. A scientist descends, more curious than cruel. 'Perfect timing — my finest data set just walked in on its own.'" },
      quote: "I want to draw out the ultimate power of Pokémon. You'll be my finest data." },
    { name: "ROSE", title: "Macro Cosmos", type: "steel", tier: 3, team: [1018, 823, 618, 601, 462, 879],
      story: { region: "Galar", badge: 8, intro: "Dinner with the Chairman ran long. Rose folds his napkin: 'I've decided not to wait for tomorrow after all.'" },
      quote: "For the sake of Galar's future, I cannot lose. Not even to you." },
    { name: "WALLY", title: "Rival", type: "fairy", tier: 2, team: [334, 407, 462, 301, 445, 282],
      story: { region: "Hoenn", badge: 8, intro: "At the gate of Victory Road, a familiar boy in white stands taller than you remember. 'I hoped it would be you.'" },
      quote: "I've gotten stronger too, you know! Gardevoir and I — we'll show you!" },
    { name: "BARRY", title: "Rival", type: "normal", tier: 2, team: [398, 214, 143, 448, 445, 392],
      story: { region: "Sinnoh", badge: 4, intro: "Something crashes into you at a dead sprint. 'Whoa — YOU?! Perfect timing! Fine: TEN million if I lose!'" },
      quote: "If you make me wait, you're gonna owe me a million! Now BATTLE me!" },
    { name: "NEMONA", title: "Rival", type: "fighting", tier: 3, team: [745, 923, 706, 982, 968, 908],
      story: { region: "Paldea", badge: 2, intro: "She's been vibrating on the route out of town. 'You GOT it?! The badge?! Show me show me show me — BATTLE. NOW!'" },
      quote: "Finally, a real battle! Come on, come on — give me EVERYTHING you've got!" },
    // 👨‍🔬 The professor who's studied them all — a top-tier generalist running
    // his classic Stadium-style Kanto powerhouse squad, every mon fully evolved.
    { name: "PROF. OAK", title: "Pokémon Professor", type: "normal", tier: 4, team: [128, 103, 59, 130, 34, 149],
      region: "Kanto",  // no story slot — the professor is the rare roaming wildcard, any region
      quote: "I've devoted my whole life to Pokémon research… now let me show you what decades of study can really do!" },
  ];

  // 🎈 TEAM ROCKET — Jessie, James & Meowth, the saga's traveling SECRET.
  // Deliberately NOT in CANON_TRAINERS (no tournament seats, no villain
  // pools): they AMBUSH — Journey surprise encounters and nuzlocke roads —
  // in EVERY region, running the squad they actually had in that era of the
  // show. Meowth talks his way into the ace slot; the blast-off is
  // guaranteed television.
  window.TEAM_ROCKET = {
    teams: {
      Kanto:  [23, 109, 108, 52],                //  Ekans, Koffing, Lickitung — and Meowth
      Johto:  [24, 110, 71, 202, 52],            //  Arbok, Weezing, Victreebel, Wobbuffet
      Hoenn:  [336, 331, 269, 358, 52],          //  Seviper, Cacnea, Dustox, Chimecho
      Sinnoh: [336, 455, 469, 439, 52],          //  Seviper, Carnivine, Yanmega, Mime Jr.
      Unova:  [527, 562, 591, 202, 52],          //  Woobat, Yamask, Amoonguss, Wobbuffet
      Kalos:  [686, 711, 202, 52],               //  Inkay, Gourgeist, Wobbuffet
      Alola:  [747, 778, 202, 52],               //  Mareanie, Mimikyu, Wobbuffet
      Galar:  [24, 110, 202, 52],                //  the Rocket Gacha classics
      Paldea: [336, 686, 778, 202, 52],          //  the greatest-hits farewell tour
    },
    // `again` = this trainer has blasted them off before — they remember.
    for(region, again) {
      return { name: "JESSIE & JAMES", title: "Team Rocket", type: "poison", tier: 1,
        team: (this.teams[region] || this.teams.Kanto).slice(),
        quote: again
          ? "YOU AGAIN?! Prepare for trouble — you KNOW that it's double! Team Rocket never forgets a twerp… this time it's PERSONAL!"
          : "Prepare for trouble — and make it double! To protect the world from devastation… TEAM ROCKET blasts off at the speed of light! Surrender now, or prepare to fight!",
        outro: again
          ? { lose: "We trained for MONTHS for this rematch — and we're STILL blasting off agaaaain!! ✨",
              win: "Meowth, that's right! Revenge is sweet like a bottle cap!" }
          : { lose: "WOBBUFFEEET— looks like Team Rocket's blasting off agaaaain! ✨",
              win: "Meowth, that's right! Da twerp actually LOST!" } };
    },
  };
})();
