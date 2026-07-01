/*
 * bulba-cards.js — Jason's Bulbasaur card collection for the Hall of Bulba.
 *
 * These entries point at the Pokémon TCG image CDN (images.pokemontcg.io).
 * The card artwork is © The Pokémon Company / Nintendo / Creatures and the
 * listed illustrators — used here only for a private, non-commercial party
 * keepsake, never published or sold.
 *
 * IMPORTANT: `src`/`large` are ONLINE links (hotlinked). They load in the
 * browser when there's wifi, but they will NOT show offline and can break if
 * the CDN changes. To make a card permanent/offline, replace its `src` with a
 * base64 data URI (same trick as data/sprites.js) or a local file path like
 * "assets/cards/base-set.png" — the Hall renders whatever you point it at.
 *
 * Add more Bulbasaur cards by copying an entry. Image URL pattern:
 *   https://images.pokemontcg.io/<setCode>/<number>.png        (small)
 *   https://images.pokemontcg.io/<setCode>/<number>_hires.png  (large)
 */
window.BULBA_CARDS = [
  { id: "base1-44",   set: "Base Set",            year: "1999", number: "44/102",  artist: "Mitsuhiro Arita",
    src: "https://images.pokemontcg.io/base1/44.png",     large: "https://images.pokemontcg.io/base1/44_hires.png" },
  { id: "base4-67",   set: "Base Set 2",          year: "2000", number: "67/130",  artist: "Mitsuhiro Arita",
    src: "https://images.pokemontcg.io/base4/67.png",     large: "https://images.pokemontcg.io/base4/67_hires.png" },
  { id: "base6-68",   set: "Legendary Collection",year: "2002", number: "68/110",  artist: "Mitsuhiro Arita",
    src: "https://images.pokemontcg.io/base6/68.png",     large: "https://images.pokemontcg.io/base6/68_hires.png" },
  { id: "ecard1-94",  set: "Expedition",          year: "2002", number: "94/165",  artist: "Sachi Matoba",
    src: "https://images.pokemontcg.io/ecard1/94.png",    large: "https://images.pokemontcg.io/ecard1/94_hires.png" },
  { id: "ecard1-95",  set: "Expedition",          year: "2002", number: "95/165",  artist: "Tomokazu Komiya",
    src: "https://images.pokemontcg.io/ecard1/95.png",    large: "https://images.pokemontcg.io/ecard1/95_hires.png" },
  { id: "dp3-77",     set: "Secret Wonders",      year: "2007", number: "77/132",  artist: "Kouki Saitou",
    src: "https://images.pokemontcg.io/dp3/77.png",       large: "https://images.pokemontcg.io/dp3/77_hires.png" },
  { id: "det1-1",     set: "Detective Pikachu",   year: "2019", number: "1/18",    artist: "MPC Film",
    src: "https://images.pokemontcg.io/det1/1.png",       large: "https://images.pokemontcg.io/det1/1_hires.png" },
  { id: "sv3pt5-1",   set: "Pokémon 151",         year: "2023", number: "001/165", artist: "Yuu Nishida",
    src: "https://images.pokemontcg.io/sv3pt5/1.png",     large: "https://images.pokemontcg.io/sv3pt5/1_hires.png" },
  { id: "sv3pt5-166", set: "Pokémon 151 · Illustration Rare", year: "2023", number: "166/165", artist: "Yoriyuki Ikegami",
    src: "https://images.pokemontcg.io/sv3pt5/166.png",   large: "https://images.pokemontcg.io/sv3pt5/166_hires.png" },
];
