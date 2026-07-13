/* nuz-regions.js — 🗺 the nine regions as NUZLOCKE structures. One entry per
   region wires together everything a region-exclusive run needs: where its
   gyms live on the circuit (gym0/gymN — Alola is four kahunas), its five
   league stage keys ending at the Champion, its starters, and how far the
   wild pool reaches (dexMax — cumulative national dex through that gen, so
   a Hoenn run still meets a Pidgey). Johto carries the one `peak`: RED on
   Mt. Silver, the optional battle past the crown. The MASTER randomizer
   walks this whole array in order — every gym, every league, RED included.
   Loaded before store.js: both the store (crowns, chronicle) and the
   nuzlocke view (sequence, caps, pools) read from here. */
(function () {
  window.NUZ_REGIONS = [
    { key: "kanto",  name: "Kanto",  emoji: "🔴", gen: 1, prof: "Oak",      gym0: 8,  gymN: 8, dexMax: 151,
      starters: [1, 4, 7, 25],
      league: ["lorelei", "brunok", "agatha", "lance4", "blue"], champKey: "blue", champ: "BLUE" },
    { key: "johto",  name: "Johto",  emoji: "🌸", gen: 2, prof: "Elm",      gym0: 0,  gymN: 8, dexMax: 251,
      starters: [152, 155, 158],
      league: ["will", "koga", "bruno", "karen", "lance"], champKey: "lance", champ: "LANCE",
      peak: "red", peakName: "RED" },
    { key: "hoenn",  name: "Hoenn",  emoji: "🌊", gen: 3, prof: "Birch",    gym0: 16, gymN: 8, dexMax: 386,
      starters: [252, 255, 258],
      league: ["sidney", "phoebe", "glacia", "drake", "steven"], champKey: "steven", champ: "STEVEN" },
    { key: "sinnoh", name: "Sinnoh", emoji: "⛰️", gen: 4, prof: "Rowan",    gym0: 24, gymN: 8, dexMax: 493,
      starters: [387, 390, 393],
      league: ["aaron", "bertha", "flint", "lucian", "cynthia"], champKey: "cynthia", champ: "CYNTHIA" },
    { key: "unova",  name: "Unova",  emoji: "🌉", gen: 5, prof: "Juniper",  gym0: 32, gymN: 8, dexMax: 649,
      starters: [495, 498, 501],
      league: ["shauntal", "grimsley", "caitlin", "marshal", "alder"], champKey: "alder", champ: "ALDER" },
    { key: "kalos",  name: "Kalos",  emoji: "🗼", gen: 6, prof: "Sycamore", gym0: 40, gymN: 8, dexMax: 721,
      starters: [650, 653, 656],
      league: ["malva", "wikstrom", "drasna", "siebold", "diantha"], champKey: "diantha", champ: "DIANTHA" },
    { key: "alola",  name: "Alola",  emoji: "🌺", gen: 7, prof: "Kukui",    gym0: 48, gymN: 4, dexMax: 809,
      starters: [722, 725, 728],
      league: ["molayne", "acerola", "kahili", "mina", "kukui"], champKey: "kukui", champ: "PROF. KUKUI" },
    { key: "galar",  name: "Galar",  emoji: "⚽", gen: 8, prof: "Magnolia", gym0: 52, gymN: 8, dexMax: 905,
      starters: [810, 813, 816],
      league: ["marnie", "bede", "oleana", "hop", "leon"], champKey: "leon", champ: "LEON" },
    { key: "paldea", name: "Paldea", emoji: "🍊", gen: 9, prof: "Sada",     gym0: 60, gymN: 8, dexMax: 1025,
      starters: [906, 909, 912],
      league: ["rika", "poppy", "larryf", "hassel", "geeta"], champKey: "geeta", champ: "GEETA" },
  ];
})();
