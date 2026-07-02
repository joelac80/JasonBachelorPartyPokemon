/*
 * seed.js — Default data for Jason's Bachelor Party Hub.
 *
 * This is the ONE file you edit to plug in real info.
 * It defines a global `SEED` object (no build step, no imports needed).
 *
 * After editing, open the app and use Settings ▸ "Reset to defaults" to
 * reload this fresh data (that wipes in-app edits/scores, so do it before
 * the party). You can also just edit everything live in the app.
 *
 * Custom art slots: drop image files into /assets and point the matching
 * field at them (e.g. hero.image, attendees[].photo, card.art, badges[].img).
 * Any field left "" falls back to a nice built-in placeholder.
 */
window.SEED = {
  // ---------------------------------------------------------------------------
  // PARTY BASICS
  // ---------------------------------------------------------------------------
  party: {
    guestOfHonor: "Jason Garza",
    title: "Jason Garza",
    subtitle: "Gotta Catch the Groom",
    // The big weekend (local time). Check in Thursday, leave Sunday.
    startDate: "2026-07-09T17:00:00",
    endDate: "2026-07-12T12:00:00",
    location: "Lake House · Bristol, Indiana",
    venue: "VRBO · 50567 E Indiana Lake Rd · Bristol, IN",
    // Optional hero banner image (e.g. the flyer art). Leave "" for the
    // built-in Bulbasaur/sunburst banner.
    heroImage: "",
    blurb:
      "One trainer. One last quest before the big day. Bulbasaur energy, " +
      "Hoosier pride, Carolina Persians grit, and pure lake house vibes.",
  },

  // ---------------------------------------------------------------------------
  // TEAMS — used by Victory Road (beer olympics) + the Draft Board.
  // These are the teams the squad gets DRAFTED into at the party.
  // ---------------------------------------------------------------------------
  teams: [
    { id: "grass",  name: "Team Bulbasaur", emoji: "🌿", color: "#5fbf6a", captain: "" },
    { id: "fire",   name: "Team Charizard", emoji: "🔥", color: "#f5732f", captain: "" },
    { id: "water",  name: "Team Squirtle",  emoji: "💧", color: "#3aa0e6", captain: "" },
    { id: "normal", name: "Team Pikachu",   emoji: "⚡", color: "#f2c744", captain: "" },
  ],

  // ---------------------------------------------------------------------------
  // THE SQUAD — the real crew (from the flyer).
  //   rank:  "Champion" | "Elite Four" | "Gym Leader"  (drives the roster grouping)
  //   role:  free text shown on the card (Groom / Best Man / Groomsman / The Squad)
  //   team:  "" (undrafted) or a team id above
  //   photo: "" or a path like "assets/photos/joe.jpg"
  //   card:  optional full trainer-card detail (see Jason for the shape)
  // ---------------------------------------------------------------------------
  attendees: [
    {
      id: "jason", name: "Jason Garza", nickname: "Bulbasaur Fiend",
      rank: "Champion", role: "The Groom", team: "", type: "grass",
      level: 100, photo: "",
      favorite: "Bulbasaur", favoriteId: 1,
      catchphrase: "Bulbasaur, I choose you.",
      card: {
        dex: "No.001", number: "001/034", stage: "Basic Pokémon",
        hp: 100, type: "grass", holo: true, illus: "The Squad",
        art: "", // drop the Bulbasaur card art here, e.g. "assets/cards/jason.png"
        flavor: "The Groom Pokémon. Height: 5'10\". Weight: Taken by Bob.",
        attacks: [
          { name: "Hoosier Daddy", cost: 1, dmg: "20",
            text: "Fernando on loop + a pic of Fernando Mendoza." },
          { name: "Solar Beam", cost: 3, dmg: "90",
            text: "Soaks up the sun to power up anything the weekend throws." },
          { name: "Take Down", cost: 4, dmg: "100",
            text: "Full send to the finish — recoil lands the next morning." },
        ],
        power: { name: "Keep Pounding",
          text: "Once each day, throw the football and pound a PBR for no reason at all." },
        weakness: "Bobby Quinn ×2",
        resistance: "Hangover −30",
        retreat: 3,
      },
    },
    { id: "joe",    name: "Joe Memmolo Jr #26", nickname: "", rank: "Elite Four", role: "Best Man",  team: "", type: "water",    favorite: "Totodile", favoriteId: 158, photo: "", catchphrase: "" },
    { id: "chris",  name: "Chris Davies",       nickname: "", rank: "Elite Four", role: "Groomsman", team: "", type: "fire",     favorite: "Charmander", favoriteId: 4, photo: "", catchphrase: "" },
    { id: "jeremy", name: "Jeremy Warren",      nickname: "", rank: "Elite Four", role: "Groomsman", team: "", type: "bug",      favorite: "Beedrill", favoriteId: 15, photo: "", catchphrase: "" },
    { id: "jamie",  name: "Jamie Fujinaka",     nickname: "", rank: "Elite Four", role: "Groomsman", team: "", type: "fairy",    favorite: "Tinkaton", favoriteId: 959, photo: "", catchphrase: "" },
    { id: "dan",    name: "Dan Kania",          nickname: "", rank: "Gym Leader", role: "The Squad", team: "", type: "dark",     favorite: "Bisharp", favoriteId: 625, photo: "", catchphrase: "" },
    { id: "joseph", name: "Joseph Thomas",      nickname: "", rank: "Gym Leader", role: "The Squad", team: "", type: "fire",     favorite: "Vulpix", favoriteId: 37, photo: "", catchphrase: "" },
    { id: "sid",    name: "Sid Suresh",         nickname: "", rank: "Gym Leader", role: "The Squad", team: "", type: "ghost",    favorite: "Mimikyu", favoriteId: 778, photo: "", catchphrase: "" },
    { id: "matt",   name: "Matt Spicer",        nickname: "", rank: "Gym Leader", role: "The Squad", team: "", type: "flying",   favorite: "Tranquill", favoriteId: 520, photo: "", catchphrase: "" },
    { id: "tyler",  name: "Tyler Logan",        nickname: "", rank: "Gym Leader", role: "The Squad", team: "", type: "water",    favorite: "Feraligatr", favoriteId: 160, photo: "", catchphrase: "" },
    { id: "brian",  name: "Brian Mallon",       nickname: "", rank: "Gym Leader", role: "The Squad", team: "", type: "grass",    favorite: "Serperior", favoriteId: 497, photo: "", catchphrase: "" },
  ],

  // ---------------------------------------------------------------------------
  // EVOLUTIONS — each trainer's favorite can "evolve" as they earn it, keyed by
  // attendee id. Two modes:
  //   "evolve" — the sprite becomes the next real evolution (id changes).
  //   "grow"   — the SAME Pokémon just gets bigger (id stays, scale grows).
  // Jason (Bulbasaur) and Joe (Totodile) GROW on purpose; final-stage / no-evo
  // Pokémon (Beedrill, Tinkaton, Mimikyu, Serperior) grow too so nobody's left
  // out. Each stage past the first has a `req` — how you earn that evolution.
  // Stage 0 is the starting form. Advance/rewind live on the Squad page.
  // ---------------------------------------------------------------------------
  evolutions: {
    jason:  { mode: "grow", stages: [
      { name: "Bulbasaur", id: 1, scale: 1 },
      { name: "Big Bulbasaur", id: 1, scale: 1.2, req: "Keep Pounding — throw the football & pound a PBR." },
      { name: "MEGA BULBA", id: 1, scale: 1.4, req: "Reign as Victory Road Champion (or just for being the groom)." },
    ] },
    joe:    { mode: "grow", stages: [
      { name: "Totodile", id: 158, scale: 1 },
      { name: "Big Totodile", id: 158, scale: 1.2, req: "Win a Victory Road event as Best Man." },
      { name: "MEGA TOTO", id: 158, scale: 1.4, req: "Deliver the Best Man speech, full send." },
    ] },
    chris:  { mode: "evolve", stages: [
      { name: "Charmander", id: 4, scale: 1 },
      { name: "Charmeleon", id: 5, scale: 1, req: "Win a 1-on-1 (beer pong or a chug-off)." },
      { name: "Charizard", id: 6, scale: 1.12, req: "Win a Victory Road bracket outright." },
      // Mega Evolution — swap id to 10035 for Mega Charizard Y instead of X.
      { name: "Mega Charizard X", id: 10034, scale: 1.2, mega: true, req: "MEGA: be on the Victory Road Champion team." },
    ] },
    jeremy: { mode: "evolve", stages: [
      { name: "Beedrill", id: 15, scale: 1 },
      { name: "Mega Beedrill", id: 10090, scale: 1.22, mega: true, req: "MEGA: earn a gym badge AND win a 1-on-1." },
    ] },
    jamie:  { mode: "grow", stages: [
      { name: "Tinkaton", id: 959, scale: 1 },
      { name: "Big Tinkaton", id: 959, scale: 1.3, req: "Tinkaton's a final form — grow instead. Land a hammer blow (win an event)." },
    ] },
    dan:    { mode: "evolve", stages: [
      { name: "Bisharp", id: 625, scale: 1 },
      { name: "Kingambit", id: 983, scale: 1.15, req: "Lead your team to a Victory Road event win." },
    ] },
    joseph: { mode: "evolve", stages: [
      { name: "Vulpix", id: 37, scale: 1 },
      { name: "Ninetales", id: 38, scale: 1.08, req: "Earn a gym badge (use a Fire Stone)." },
    ] },
    sid:    { mode: "grow", stages: [
      { name: "Mimikyu", id: 778, scale: 1 },
      { name: "Big Mimikyu", id: 778, scale: 1.3, req: "Mimikyu never evolves — so grow. Pull off the spookiest play of the night." },
    ] },
    matt:   { mode: "evolve", stages: [
      { name: "Tranquill", id: 520, scale: 1 },
      { name: "Unfezant", id: 521, scale: 1.12, req: "Win an event to take flight." },
    ] },
    brian:  { mode: "grow", stages: [
      { name: "Serperior", id: 497, scale: 1 },
      { name: "Big Serperior", id: 497, scale: 1.3, req: "Serperior's a final form — grow instead. Win a Victory Road event." },
    ] },
    tyler:  { mode: "grow", stages: [
      { name: "Feraligatr", id: 160, scale: 1 },
      { name: "Big Feraligatr", id: 160, scale: 1.3, req: "Feraligatr's a final form — grow instead. Win a Victory Road event." },
    ] },
  },

  // ---------------------------------------------------------------------------
  // VICTORY ROAD — the beer olympics events. Each event is worth points.
  // ---------------------------------------------------------------------------
  //   points: awarded to the winning team; `rules` explains how it's played
  //   and scored (format: "bracket" = head-to-head match, "count" = best
  //   score/streak wins, "relay" = first team done wins).
  events: [
    { id: "beerpong",  name: "Beer Pong",   emoji: "🏓", points: 100, format: "bracket", desc: "Classic cups, elbows behind the table.",
      rules: "10-cup racks, standard house rules (re-rack on request). Bracket play — win your match to take the 100. Sink the final two cups and the loser owes a lap of the dock." },
    { id: "flipcup",   name: "Flip Cup",    emoji: "🥤", points: 75,  format: "relay", desc: "Full-team relay. Drink, flip, repeat.",
      rules: "Line up the whole team. Drink, set the cup on the edge, flip it upright, next person goes. First team with every cup flipped wins the 75." },
    { id: "cornhole",  name: "Cornhole",    emoji: "🌽", points: 75,  format: "bracket", desc: "Bags in the hole. 2v2.",
      rules: "2v2, play to 21 (cancellation scoring, must win by 1). Bracket — win your match for the 75." },
    { id: "kanjam",    name: "Kan Jam",     emoji: "🥏", points: 50,  format: "bracket", desc: "Frisbee + can. Deflect and dunk.",
      rules: "2v2 to 21. A clean throw straight into the slot is an instant win. Bracket winner scores the 50." },
    { id: "diceroll",  name: "Beer Die",    emoji: "🎲", points: 50,  format: "bracket", desc: "Bounce the die off the table.",
      rules: "2v2. Lob the die so it arcs above eye level and lands on the opponents' side; they try to catch it one-handed with a full cup. First to 11, win by 2. Bracket winner takes the 50." },
    { id: "boatrace",  name: "Boat Race",   emoji: "🚣", points: 100, format: "relay", desc: "Chug relay. Anchor drinks last.",
      rules: "Whole team in a line, drink in sequence — you can't start until the person before you finishes and flips. Anchor goes last. First team fully done wins the 100." },
    { id: "football",  name: "Football Toss", emoji: "🏈", points: 50, format: "count", desc: "Catch streak with a beer in hand.",
      rules: "Not a bracket — a count. Partner up and see how many catches in a row you can make while each of you holds a full beer. Every dropped ball = 3 sips each and the streak resets. Highest streak of the weekend wins the 50." },
    { id: "wildcard",  name: "Wild Card",   emoji: "⭐", points: 150, format: "mystery", desc: "The commissioner's mystery event.",
      rules: "Announced day-of by the commissioner (that's the groom's call, or best man's). Worth the most points — scoring format revealed at kickoff." },
  ],

  // ---------------------------------------------------------------------------
  // THE GAME PLAN — the weekend activities (from the flyer). `wildcard: true`
  // gets the special highlighted treatment (Zimmy's).
  // ---------------------------------------------------------------------------
  gamePlan: [
    { id: "g1", name: "Mario Kart & Smash", emoji: "🎮", note: "Switch 2 throwdowns" },
    { id: "g2", name: "Nintendo Party",     emoji: "🍄", note: "Mario Party & co." },
    { id: "g3", name: "Jason Jeopardy",     emoji: "❓", note: "this-is-your-life trivia" },
    { id: "g4", name: "Master Trainer",     emoji: "🎲", note: "board game, but you drink" },
    { id: "g5", name: "On the Water",       emoji: "🌊", note: "kayak · hot tub · football" },
    { id: "g6", name: "PBR Runs",           emoji: "🍺", note: "keep the cooler stocked" },
    { id: "gw", name: "Zimmy's",            emoji: "🍹", note: "Margaritaville-themed · frozen drinks · live music", wildcard: true },
  ],

  // ---------------------------------------------------------------------------
  // FAN BADGES — the allegiances. Drop logo files in /assets/badges or leave
  // img "" for a styled text badge.
  // ---------------------------------------------------------------------------
  badges: [
    { id: "iu",       name: "Indiana Hoosiers",  color: "#a3122b", img: "" },
    { id: "persians", name: "Carolina Persians", color: "#0085ca", img: "" },
    { id: "pbr",      name: "Pabst Blue Ribbon", color: "#1f3a93", img: "" },
  ],

  // ---------------------------------------------------------------------------
  // GYM BADGES — 8 badges the commissioner hands out through the weekend.
  //   earn:  why/how a trainer earns it   power: the perk the holder gets
  //   holder: attendee id ("" = unclaimed)   used: has the power been spent?
  // Award / clear / mark-used live in the Badges page.
  // ---------------------------------------------------------------------------
  gymBadges: [
    { id: "boulder", name: "Boulder Badge", emoji: "🥌", color: "#b0a06a",
      earn: "First trainer up and cooking breakfast for the crew.",
      power: "Veto one drink call made against you.", holder: "", used: false },
    { id: "cascade", name: "Cascade Badge", emoji: "🌊", color: "#3aa0e6",
      earn: "Biggest splash — best cannonball or gnarliest tube wipeout.",
      power: "Override the wheel and choose the next Victory Road event.", holder: "", used: false },
    { id: "thunder", name: "Thunder Badge", emoji: "⚡", color: "#f2c744",
      earn: "Win a 1-on-1 chug-off.",
      power: "Hand any trainer a 3-sip penalty, once.", holder: "", used: false },
    { id: "rainbow", name: "Rainbow Badge", emoji: "🌈", color: "#f45f9c",
      earn: "Owned the Zimmy's dance floor.",
      power: "Aux-cord rights — queue 3 songs, no skips.", holder: "", used: false },
    { id: "soul", name: "Soul Badge", emoji: "💜", color: "#7a5aa0",
      earn: "MVP wingman — hauled water, snacks, and a buddy to bed.",
      power: "Skip one PBR run.", holder: "", used: false },
    { id: "marsh", name: "Marsh Badge", emoji: "🌿", color: "#5fbf6a",
      earn: "Win a round of Jason Jeopardy.",
      power: "+25 bonus points to your team, one time.", holder: "", used: false },
    { id: "volcano", name: "Volcano Badge", emoji: "🔥", color: "#f5732f",
      earn: "Biggest comeback or most competitive moment of the day.",
      power: "Call one re-rack in beer pong.", holder: "", used: false },
    { id: "earth", name: "Earth Badge", emoji: "🏅", color: "#c9a227",
      earn: "Champion's Choice — the groom awards this for whatever he deems legendary.",
      power: "Immunity from the Wild Card penalty.", holder: "", used: false },
  ],

  // ---------------------------------------------------------------------------
  // OAK'S TIP — the fun quote block. `image` optional (the Oak meme).
  // ---------------------------------------------------------------------------
  oakTip: {
    quote: "The early bird gets the worm, or in this case, the Bobby Quinn.",
    attribution: "Professor Oak, dispensing questionable wisdom since Episode 1",
    image: "",
  },

  // ---------------------------------------------------------------------------
  // ITINERARY — optional scheduled version of the weekend (by day). Leave the
  // array empty to hide the timeline and just show The Game Plan.
  // ---------------------------------------------------------------------------
  activities: [
    { id: "a1", day: "Thursday",  time: "5:00 PM",  title: "Arrival & Check-in", emoji: "🏡", desc: "Roll up to the lake house, claim beds, crack the first one." },
    { id: "a2", day: "Thursday",  time: "8:00 PM",  title: "Draft Night",         emoji: "📋", desc: "Spin the wheel. Draft the teams for Victory Road." },
    { id: "a3", day: "Friday",    time: "11:00 AM", title: "On the Water",        emoji: "🌊", desc: "Kayak, hot tub, football." },
    { id: "a4", day: "Friday",    time: "8:00 PM",  title: "Jason Jeopardy",      emoji: "❓", desc: "This-is-your-life trivia." },
    { id: "a5", day: "Saturday",  time: "2:00 PM",  title: "Victory Road",        emoji: "🏆", desc: "The beer olympics. Let the games begin." },
    { id: "a6", day: "Saturday",  time: "9:00 PM",  title: "Zimmy's",             emoji: "🍹", desc: "Margaritaville night — frozen drinks + live music." },
    { id: "a7", day: "Sunday",    time: "11:00 AM", title: "Recovery Brunch",     emoji: "🍳", desc: "Breakfast of champions before the road home." },
  ],

  // ---------------------------------------------------------------------------
  // MEMES — add in-app, or seed paths here (e.g. the Oak's Tip screenshot).
  // ---------------------------------------------------------------------------
  memes: [
    // { id: "m1", caption: "Oak's questionable wisdom", src: "assets/memes/oak.png" },
  ],

  // ---------------------------------------------------------------------------
  // SUPERLATIVES — end-of-weekend award categories the crew votes on live.
  // Votes are cast in-app (one tap per vote); the leader wins the trophy at
  // the Champion Ceremony. Add/remove categories freely.
  // ---------------------------------------------------------------------------
  superlatives: [
    { id: "mvp",       emoji: "🏆", title: "Weekend MVP",           desc: "Carried the vibes start to finish." },
    { id: "sips",      emoji: "🍺", title: "Most Sips Taken",        desc: "The human keg. Never not holding one." },
    { id: "drop",      emoji: "🤦", title: "Best Drop / Fumble",     desc: "The clumsiest moment of the trip." },
    { id: "firstbed",  emoji: "😴", title: "First to Bed",           desc: "Tapped out before the anthem." },
    { id: "catchgroom",emoji: "💍", title: "Most Likely to Catch the Groom", desc: "Stuck to Jason like a Poké Ball." },
    { id: "chef",      emoji: "🍳", title: "Lake House Chef",        desc: "Fed the squad when it mattered." },
    { id: "hypeman",   emoji: "📣", title: "Ultimate Hype Man",      desc: "Loudest, proudest, most contagious energy." },
    { id: "wildcard",  emoji: "🃏", title: "Wild Card Legend",       desc: "Did the thing nobody saw coming." },
  ],

  // ---------------------------------------------------------------------------
  // CATCH OF THE DAY — daily photo/dare challenges. Complete one for a badge
  // moment and bragging rights. `points` optional (a suggested bounty).
  // ---------------------------------------------------------------------------
  challenges: [
    { id: "c1", day: "Thursday",  emoji: "📸", title: "Squad Selfie",       desc: "Get the whole crew in one photo before the first PBR is gone.", points: 25 },
    { id: "c2", day: "Thursday",  emoji: "🎣", title: "First Cast",         desc: "Land a catch (fish OR a Bobby Quinn) off the dock.", points: 25 },
    { id: "c3", day: "Friday",    emoji: "🌊", title: "Cannonball King",    desc: "Biggest splash off the dock — filmed for proof.", points: 50 },
    { id: "c4", day: "Friday",    emoji: "🏈", title: "Fernando Tribute",   desc: "Recreate a Fernando Mendoza touchdown celebration.", points: 25 },
    { id: "c5", day: "Saturday",  emoji: "🌿", title: "Wild Bulbasaur",     desc: "Find/make a Bulbasaur in the wild (drawn, built, or spotted).", points: 50 },
    { id: "c6", day: "Saturday",  emoji: "🍹", title: "Zimmy's Cheers",     desc: "Full-squad frozen-drink toast to the groom.", points: 50 },
    { id: "c7", day: "Any",       emoji: "🤝", title: "Groom's Wingman",    desc: "Get Jason a fresh drink before he asks. Every time counts.", points: 10 },
    { id: "c8", day: "Any",       emoji: "🎤", title: "Karaoke Courage",    desc: "Sing the Pokémon theme, full send, no notes.", points: 25 },
  ],

  // ---------------------------------------------------------------------------
  // JASON JEOPARDY — the trivia board. Bulbasaur-themed, with "Daily Bulba"
  // squares (our Daily Double). Real clues/answers come from Bob (the fiancé) —
  // these are the FRAMEWORK. Edit any clue live in the app (tap ✎ on a clue).
  //   Each category has 5 clues worth 100..500.
  //   dailyBulba: true marks a hidden wager square.
  // ---------------------------------------------------------------------------
  jeopardyBoard: {
    categories: [
      {
        name: "All About Jason",
        clues: [
          { value: 100, clue: "Clue coming from Bob…", answer: "TBD" },
          { value: 200, clue: "Clue coming from Bob…", answer: "TBD" },
          { value: 300, clue: "Clue coming from Bob…", answer: "TBD", dailyBulba: true },
          { value: 400, clue: "Clue coming from Bob…", answer: "TBD" },
          { value: 500, clue: "Clue coming from Bob…", answer: "TBD" },
        ],
      },
      {
        name: "Bulba-Trivia",
        clues: [
          { value: 100, clue: "This Grass/Poison starter is #001 in the Kanto Pokédex.", answer: "Who is Bulbasaur?" },
          { value: 200, clue: "Bulbasaur evolves into this Pokémon at level 16.", answer: "What is Ivysaur?" },
          { value: 300, clue: "The seed on Bulbasaur's back is said to grow using this from the sun.", answer: "What is (sun)light / nutrients?" },
          { value: 400, clue: "This signature Grass move fires a beam after absorbing sunlight.", answer: "What is Solar Beam?" },
          { value: 500, clue: "Bulbasaur's final evolution is this Pokémon.", answer: "What is Venusaur?", dailyBulba: true },
        ],
      },
      {
        name: "Indiana Hoosiers",
        clues: [
          { value: 100, clue: "Clue coming from Bob…", answer: "TBD" },
          { value: 200, clue: "This QB — a big theme of the weekend — goes by 'Fernando'.", answer: "Who is Fernando Mendoza?" },
          { value: 300, clue: "Clue coming from Bob…", answer: "TBD" },
          { value: 400, clue: "Clue coming from Bob…", answer: "TBD" },
          { value: 500, clue: "Clue coming from Bob…", answer: "TBD" },
        ],
      },
      {
        name: "Carolina / Persians",
        clues: [
          { value: 100, clue: "Clue coming from Bob…", answer: "TBD" },
          { value: 200, clue: "Clue coming from Bob…", answer: "TBD", dailyBulba: true },
          { value: 300, clue: "Clue coming from Bob…", answer: "TBD" },
          { value: 400, clue: "Clue coming from Bob…", answer: "TBD" },
          { value: 500, clue: "Clue coming from Bob…", answer: "TBD" },
        ],
      },
      {
        name: "Lake House Lore",
        clues: [
          { value: 100, clue: "The party HQ sits on this lake road in Bristol, Indiana.", answer: "What is E Indiana Lake Rd?" },
          { value: 200, clue: "Clue coming from Bob…", answer: "TBD" },
          { value: 300, clue: "Clue coming from Bob…", answer: "TBD" },
          { value: 400, clue: "Clue coming from Bob…", answer: "TBD" },
          { value: 500, clue: "Clue coming from Bob…", answer: "TBD" },
        ],
      },
    ],
    final: {
      category: "The Groom's Future",
      clue: "Clue coming from Bob — the big Final Jeopardy question about Jason & the wedding.",
      answer: "TBD",
    },
  },
};
