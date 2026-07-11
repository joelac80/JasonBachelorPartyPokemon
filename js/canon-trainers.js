/* canon-trainers.js — famous canon trainers (villain bosses & rivals) used as
   Champions-Tournament entrants and as surprise post-gym-battle challengers.
   Teams are final-evolution squads themed to each character. window.CANON_TRAINERS. */
(function () {
  // tier ~ Champions-Tournament seeding weight (higher = wins more often).
  window.CANON_TRAINERS = [
    { name: "GIOVANNI", title: "Rocket Boss", type: "ground", tier: 3, team: [464, 34, 31, 51, 53, 248],
      quote: "So — you've grown strong. But Team Rocket bows to no one. Face me." },
    { name: "SILVER", title: "Rival", type: "dark", tier: 3, team: [461, 160, 94, 462, 169, 230],
      quote: "…Don't get cocky. I'll show you what real strength looks like." },
    { name: "ARCHIE", title: "Aqua Leader", type: "water", tier: 3, team: [130, 321, 350, 260, 279, 340],
      quote: "The sea will swallow all! You won't stand in the way of my dream." },
    { name: "MAXIE", title: "Magma Leader", type: "fire", tier: 3, team: [323, 262, 257, 76, 169, 289],
      quote: "The land must expand. Step aside — or be burned away." },
    { name: "CYRUS", title: "Galactic Boss", type: "dark", tier: 3, team: [430, 169, 229, 130, 461, 248],
      quote: "Emotion is weakness. I will build a world without it — starting with your defeat." },
    { name: "GHETSIS", title: "Plasma Sage", type: "dark", tier: 4, team: [563, 626, 537, 983, 604, 635],
      quote: "Kneel. Everything belongs to me — and so will your defeat." },
    { name: "N", title: "Team Plasma King", type: "dragon", tier: 4, team: [644, 571, 567, 565, 584, 601],
      quote: "My friends and I hear the voices of Pokémon. Show me the bond you fight with." },
    { name: "LYSANDRE", title: "Flare Boss", type: "dark", tier: 3, team: [668, 620, 430, 130, 448, 715],
      quote: "Only the chosen deserve a beautiful world. Prove you belong in it." },
    { name: "GUZMA", title: "Skull Boss", type: "bug", tier: 3, team: [768, 738, 127, 168, 284, 248],
      quote: "Ya boy Guzma's here to knock ya down! Big bad Guzma, comin' through!" },
    { name: "GLADION", title: "Rival", type: "dark", tier: 3, team: [773, 745, 461, 571, 169, 248],
      quote: "I don't have time for the weak. Come at me with everything." },
    { name: "COLRESS", title: "Plasma Scientist", type: "steel", tier: 3, team: [601, 462, 604, 649, 596, 637],
      quote: "I want to draw out the ultimate power of Pokémon. You'll be my finest data." },
    { name: "ROSE", title: "Macro Cosmos", type: "steel", tier: 3, team: [1018, 823, 879, 618, 601, 462],
      quote: "For the sake of Galar's future, I cannot lose. Not even to you." },
    { name: "WALLY", title: "Rival", type: "fairy", tier: 2, team: [282, 334, 407, 462, 301, 445],
      quote: "I've gotten stronger too, you know! Gardevoir and I — we'll show you!" },
    { name: "BARRY", title: "Rival", type: "normal", tier: 2, team: [398, 214, 143, 448, 445, 392],
      quote: "If you make me wait, you're gonna owe me a million! Now BATTLE me!" },
    { name: "NEMONA", title: "Rival", type: "fighting", tier: 3, team: [745, 923, 706, 982, 908, 445],
      quote: "Finally, a real battle! Come on, come on — give me EVERYTHING you've got!" },
    // 👨‍🔬 The professor who's studied them all — a top-tier generalist running
    // his classic Stadium-style Kanto powerhouse squad, every mon fully evolved.
    { name: "PROF. OAK", title: "Pokémon Professor", type: "normal", tier: 4, team: [128, 103, 59, 130, 34, 149],
      quote: "I've devoted my whole life to Pokémon research… now let me show you what decades of study can really do!" },
  ];
})();
