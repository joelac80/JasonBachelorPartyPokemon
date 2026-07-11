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
      { name: "Big Tinkaton", id: 959, scale: 1.3, req: "Land a hammer blow — win a Victory Road event." },
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
      { name: "Big Mimikyu", id: 778, scale: 1.3, req: "Pull off the spookiest play of the night." },
    ] },
    matt:   { mode: "evolve", stages: [
      { name: "Tranquill", id: 520, scale: 1 },
      { name: "Unfezant", id: 521, scale: 1.12, req: "Win an event to take flight." },
    ] },
    brian:  { mode: "grow", stages: [
      { name: "Serperior", id: 497, scale: 1 },
      { name: "Big Serperior", id: 497, scale: 1.3, req: "Win a Victory Road event." },
    ] },
  },

  // ---------------------------------------------------------------------------
  // TCG CARDS — the funny full trainer cards, keyed by attendee id. Jason's
  // lives on his attendee record; everyone else's is here. Each card riffs on
  // the trainer's favorite Pokémon + real crew lore. Two attacks each, plus a
  // flavor line and a power. Fields match Jason's `card` shape.
  // ---------------------------------------------------------------------------
  cards: {
    joe: {
      dex: "No.158", number: "26/034", stage: "Basic Pokémon", hp: 90, type: "water", holo: true, illus: "The Squad",
      flavor: "The Best Man Pokémon. Bites first, toasts later — roommates with the groom in college and long after.",
      attacks: [
        { name: "Best Man Toast", cost: 2, dmg: "40", text: "Raises a glass so heartfelt the whole table has to drink with him." },
        { name: "Roommate Recall", cost: 3, dmg: "70", text: "A decade of living with Jason = infinite blackmail. Double damage to the groom." },
      ],
      power: { name: "Patrick's Volleyball Team", text: "Bump, set, spike — once a game, call a do-over on any missed drink." },
      weakness: "Last Call ×2", resistance: "Peer Pressure −20", retreat: 2,
    },
    chris: {
      dex: "No.004", number: "04/034", stage: "Basic Pokémon", hp: 80, type: "fire", holo: false, illus: "The Squad",
      flavor: "The Groomsman Pokémon. Small flame, huge serve — a founding member of Patrick's Volleyball Team.",
      attacks: [
        { name: "Ember Serve", cost: 1, dmg: "30", text: "A serve that lands like a fireball. Shank it and take two sips." },
        { name: "Flare Spike", cost: 2, dmg: "50", text: "Sets, jumps, and spikes with Charmander heat." },
      ],
      power: { name: "Tail Flame", text: "As long as his cup isn't empty, the party keeps burning." },
      weakness: "Cold Pool ×2", resistance: "Hangover −10", retreat: 1,
    },
    jeremy: {
      dex: "No.015", number: "15/034", stage: "Basic Pokémon", hp: 80, type: "bug", holo: false, illus: "The Squad",
      flavor: "The Groomsman Pokémon. Buzzes the net all game — Patrick's Volleyball Team's most relentless server.",
      attacks: [
        { name: "Twin Serve", cost: 2, dmg: "40", text: "Two stingers, two aces. The other team drinks for each." },
        { name: "Swarm Rush", cost: 3, dmg: "70", text: "Rushes the net so hard the opponents scatter." },
      ],
      power: { name: "Mega Overdrive", text: "When he Mega Evolves, his team's next round is on the house." },
      weakness: "Fly Swatter ×2", resistance: "Chill −20", retreat: 1,
    },
    jamie: {
      dex: "No.959", number: "20/034", stage: "Basic Pokémon", hp: 90, type: "fairy", holo: false, illus: "The Squad",
      flavor: "The Groomsman Pokémon. Looks harmless — carries a hammer bigger than the keg.",
      attacks: [
        { name: "Hammer Drop", cost: 2, dmg: "50", text: "Swings a comically huge mallet. Somebody's full cup goes flying." },
        { name: "Pixie Prank", cost: 1, dmg: "20", text: "A fairy trick nobody sees coming until it's too late." },
      ],
      power: { name: "Tinker Toughness", text: "Immune to the first drink call made against her each round." },
      weakness: "Steel Toe ×2", resistance: "Small Talk −10", retreat: 3,
    },
    dan: {
      dex: "No.625", number: "18/034", stage: "Basic Pokémon", hp: 90, type: "dark", holo: false, illus: "The Squad",
      flavor: "The Squad Pokémon. All blades and strategy — and, reportedly, a Patrick's Volleyball Team ringer.",
      attacks: [
        { name: "Blade Block", cost: 2, dmg: "40", text: "Stuffs a spike at the net. The attacker drinks." },
        { name: "Command the Court", cost: 3, dmg: "60", text: "Directs the whole squad like a Kingambit-in-waiting." },
      ],
      power: { name: "Sharp Edge", text: "First to call the play, last to lose his cool." },
      weakness: "Fire Pit ×2", resistance: "Doubt −20", retreat: 2,
    },
    joseph: {
      dex: "No.037", number: "37/034", stage: "Basic Pokémon", hp: 80, type: "fire", holo: false, illus: "The Squad",
      flavor: "The Squad Pokémon. Warm as six tails by the fire, sly as Ninetales after midnight.",
      attacks: [
        { name: "Ember Cozy", cost: 1, dmg: "20", text: "Keeps the lake house fire — and the vibes — going all night." },
        { name: "Nine-Tail Flick", cost: 3, dmg: "60", text: "Nine tails, nine reasons you now owe a sip." },
      ],
      power: { name: "Fire Stone", text: "One drink away from evolving into something far more dangerous." },
      weakness: "Water Balloon ×2", resistance: "Cold Feet −20", retreat: 1,
    },
    sid: {
      dex: "No.778", number: "10/034", stage: "Basic Pokémon", hp: 80, type: "ghost", holo: true, illus: "The Squad",
      flavor: "The Squad Pokémon. Wears the disguise, keeps the secrets — roommates with the groom in college and after.",
      attacks: [
        { name: "Disguise", cost: 1, dmg: "20", text: "Takes one hit for the crew, no questions asked. Then quietly plots." },
        { name: "Roommate Blackmail", cost: 3, dmg: "60", text: "Ten years of stories on Jason. Super effective on the groom." },
      ],
      power: { name: "Spookiest Play", text: "Once a night, appear out of nowhere and reverse a drink call." },
      weakness: "Daylight ×2", resistance: "Awkward Silence −30", retreat: 1,
    },
    matt: {
      dex: "No.520", number: "22/034", stage: "Basic Pokémon", hp: 80, type: "flying", holo: false, illus: "The Squad",
      flavor: "The Squad Pokémon. Unbothered and migratory — always finds his way back to the cooler.",
      attacks: [
        { name: "Homing Return", cost: 1, dmg: "20", text: "No matter how far the night goes, always lands back at the lake house." },
        { name: "Air Slash", cost: 3, dmg: "60", text: "Takes flight as Unfezant and rains it down from above." },
      ],
      power: { name: "Tailwind", text: "Skips one PBR run — the wind's always at his back." },
      weakness: "Ground Game ×2", resistance: "Stress −20", retreat: 1,
    },
    brian: {
      dex: "No.497", number: "12/034", stage: "Basic Pokémon", hp: 90, type: "grass", holo: false, illus: "The Squad",
      flavor: "The Squad Pokémon. Regal, unbothered, and 100% certain he's the most refined trainer at the lake house.",
      attacks: [
        { name: "Regal Glare", cost: 1, dmg: "20", text: "One disdainful look and you're already drinking." },
        { name: "Leaf Storm", cost: 3, dmg: "60", text: "Coils up and unleashes an elegant green tempest." },
      ],
      power: { name: "Contrary", text: "Insult him and he only gets stronger." },
      weakness: "Bug Spray ×2", resistance: "Riff-Raff −20", retreat: 2,
    },
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
  // Two full rounds of real clues (Single + Double Jeopardy) + Final Jeopardy.
  // `version` lets the app replace an older saved board with a newer deck.
  // dailyBulba: true marks the Daily Doubles.
  jeopardyBoard: {
    version: 2,
    rounds: [
      {
        name: "Single Jeopardy",
        categories: [
          {
            name: "Live From the Bach Party, It's Saturday Nighhhhtt",
            clues: [
              { value: 100, clue: "The Lonely Island digital short \"Lazy Sunday\" prominently referenced buying cupcakes at this Manhattan bakery.", answer: "What is Magnolia Bakery?" },
              { value: 200, clue: "This original SNL cast member portrayed Roseanne Roseannadanna on Weekend Update.", answer: "Who is Gilda Radner?" },
              { value: 300, clue: "This original cast member left SNL after one season and was replaced on Weekend Update by Jane Curtin.", answer: "Who is Chevy Chase?" },
              { value: 400, clue: "This recurring Weekend Update character was known for starting every sentence confidently before immediately changing direction with \"Just kidding…\"", answer: "Who is Judy Grimes?" },
              { value: 500, clue: "This fake commercial advertised a luxury perfume for \"complicit\" women after the Harvey Weinstein scandal.", answer: "What is \"Complicit\"?" },
            ],
          },
          {
            name: "Hoosier Daddy",
            clues: [
              { value: 100, clue: "This city is home to Indiana University's flagship campus.", answer: "What is Bloomington?" },
              { value: 200, clue: "This famous cyclist race takes place annually at IU.", answer: "What is the Little 500?" },
              { value: 300, clue: "This IU alumnus created the iconic TV series Parks and Recreation.", answer: "Who is Michael Schur?" },
              { value: 400, clue: "This IU professor developed the Elinor Ostrom framework that earned her the 2009 Nobel Prize in Economics.", answer: "Who is Elinor Ostrom?" },
              { value: 500, clue: "In 1938, IU's football stadium was named after this university president.", answer: "Who is Zora Clevenger?" },
            ],
          },
          {
            name: "Gotta Answer 'Em All",
            clues: [
              { value: 100, clue: "This Pokémon has the highest base HP of all Pokémon.", answer: "Who is Blissey?" },
              { value: 200, clue: "This is the only Pokémon whose English name begins with the letter X.", answer: "Who is Xatu?" },
              { value: 300, clue: "The move Sketch permanently copies another Pokémon's move and is exclusive to this Pokémon.", answer: "Who is Smeargle?" },
              { value: 400, clue: "This was the first Pokémon ever designed by Game Freak.", answer: "Who is Rhydon?" },
              { value: 500, clue: "This Pokémon is the only non-Legendary Pokémon with a base stat total of exactly 600.", answer: "Who is Tyranitar?" },
            ],
          },
          {
            name: "Sip Sip Hooray",
            clues: [
              { value: 100, clue: "2 oz vodka · 1 oz coffee liqueur · 1 oz espresso", answer: "What is an Espresso Martini?" },
              { value: 200, clue: "2 oz gin · 0.5 oz dry vermouth · 0.5 oz olive brine", answer: "What is a Dirty Martini?" },
              { value: 300, clue: "2 oz tequila · 4 oz grapefruit soda · 0.5 oz lime juice", answer: "What is a Paloma?" },
              { value: 400, clue: "12 oz Modelo Especial · 1.5 oz lime juice · 2 oz tomato juice · hot sauce · Worcestershire · Tajín", answer: "What is a Michelada?" },
              { value: 500, clue: "1.5 oz vodka · 1 oz cranberry juice · 0.5 oz lime juice · 0.5 oz triple sec", answer: "What is a Cosmopolitan?" },
            ],
          },
          {
            name: "Trust Me Bro, It's a Good Investment",
            clues: [
              { value: 100, clue: "Investors receive this payment when a company distributes profits.", answer: "What is a dividend?" },
              { value: 200, clue: "This investor is known as the Oracle of Omaha.", answer: "Who is Warren Buffett?", dailyBulba: true },
              { value: 300, clue: "A market decline of at least 20% is known as this.", answer: "What is a bear market?" },
              { value: 400, clue: "The 1987 stock market crash is commonly known by this name.", answer: "What is Black Monday?" },
              { value: 500, clue: "This company was the first to reach a $1 trillion market capitalization.", answer: "Who is Apple?" },
            ],
          },
          {
            name: "Blades of Glory",
            clues: [
              { value: 100, clue: "This jump enters from a back outside edge and uses the opposite toe pick.", answer: "What is a Lutz?" },
              { value: 200, clue: "This skater was the first to land a ratified Quad Axel in competition.", answer: "Who is Ilia Malinin?" },
              { value: 300, clue: "This skater was attacked before the 1994 Olympics.", answer: "Who is Nancy Kerrigan?" },
              { value: 400, clue: "A Triple Axel requires this many rotations.", answer: "What is 3½ rotations?" },
              { value: 500, clue: "The move now known as a \"Tano Jump\" was popularized by this 1988 Olympic gold medalist.", answer: "Who is Brian Boitano?" },
            ],
          },
        ],
      },
      {
        name: "Double Jeopardy",
        categories: [
          {
            name: "B-A-N-A-N-A-S",
            clues: [
              { value: 200, clue: "Bananas are naturally rich in this mineral.", answer: "What is Potassium?" },
              { value: 400, clue: "Despite common belief, bananas are botanically classified as this type of fruit.", answer: "What is a berry?", dailyBulba: true },
              { value: 600, clue: "Most commercial bananas are propagated through this process rather than seeds.", answer: "What is cloning (vegetative propagation)?" },
              { value: 800, clue: "The humorous unit \"Banana Equivalent Dose\" measures exposure to this phenomenon.", answer: "What is radiation?" },
              { value: 1000, clue: "O. Henry coined this political term in reference to Honduras in his 1904 book Cabbages and Kings.", answer: "What is a banana republic?" },
            ],
          },
          {
            name: "There's More than Corn Here",
            clues: [
              { value: 200, clue: "Indiana's capital city.", answer: "What is Indianapolis?" },
              { value: 400, clue: "The Indianapolis 500 is held at this speedway.", answer: "What is Indianapolis Motor Speedway?" },
              { value: 600, clue: "Indiana was the 19th state admitted to the Union in this year.", answer: "What is 1816?" },
              { value: 800, clue: "Indiana's state motto is this four-word phrase.", answer: "What is \"The Crossroads of America\"?" },
              { value: 1000, clue: "This singer-songwriter from Seymour, Indiana, recorded \"Jack and Diane.\"", answer: "Who is John Mellencamp?" },
            ],
          },
          {
            name: "Books Jason Definitely Didn't Read",
            clues: [
              { value: 200, clue: "This Harper Lee novel won the Pulitzer Prize in 1961.", answer: "What is To Kill a Mockingbird?" },
              { value: 400, clue: "This novel by Mary Shelley is subtitled The Modern Prometheus.", answer: "What is Frankenstein?" },
              { value: 600, clue: "The opening line, \"Happy families are all alike,\" appears in this novel.", answer: "What is Anna Karenina?" },
              { value: 800, clue: "The title of Do Androids Dream of Electric Sheep? inspired this 1982 film.", answer: "What is Blade Runner?" },
              { value: 1000, clue: "According to a 2021 survey, this book was the most commonly lied about when Americans claimed to have read it.", answer: "TBD — (from Bob)", dailyBulba: true },
            ],
          },
          {
            name: "The Almost Newlyweds",
            clues: [
              { value: 200, clue: "Bob was born on August 16, placing him under this zodiac sign, known for confidence and loving the spotlight.", answer: "What is Leo?" },
              { value: 400, clue: "In 2023, Bob and Jason's Halloween costume represented two magical beings whose jobs were governed by \"Da Rules.\"", answer: "Who are Cosmo and Wanda?" },
              { value: 600, clue: "Bob's master's degree from DePaul focused on the field whose practitioners spend nine months waiting for summer vacation.", answer: "What is Education?" },
              { value: 800, clue: "Bob and Jason attended a 2024 concert by a band whose average member age is higher than many Fortune 500 CEOs.", answer: "Who are The Rolling Stones?" },
              { value: 1000, clue: "The site of Bob and Jason's engagement sits between the city skyline and the namesake lagoon in Lincoln Park.", answer: "What is North Pond?" },
            ],
          },
          {
            name: "NSFW",
            clues: [
              { value: 200, clue: "This sex columnist and Sex and the City character famously asked, \"Couldn't help but wonder…\"", answer: "Who is Carrie Bradshaw?" },
              { value: 400, clue: "This slang term refers to someone you repeatedly hook up with casually.", answer: "What is FWB / a situationship?" },
              { value: 600, clue: "The term \"MILF\" was heavily popularized by this 1999 teen comedy.", answer: "What is American Pie?" },
              { value: 800, clue: "\"Cuffing season\" refers to the time of year when people tend to do this.", answer: "What is look for relationships during the colder months?" },
              { value: 1000, clue: "\"ENM\" on a dating profile stands for this.", answer: "What is Ethical Non-Monogamy?" },
            ],
          },
          {
            name: "Brian's Choice",
            clues: [
              { value: 200, clue: "The first appearance of Rowlf the Dog was not on a Henson production but on commercials for this dog food brand.", answer: "What is Purina Dog Chow?" },
              { value: 400, clue: "In The Lord of the Rings, the Elvish word \"Mellon\" means this.", answer: "What is friend?" },
              { value: 600, clue: "This houseplant is often called \"Mother-in-Law's Tongue.\"", answer: "What is a Snake Plant?" },
              { value: 800, clue: "If Velma says \"Jinkies!\" and Shaggy says \"Zoinks!\", then this phrase of exasperation belongs to the fashion-forward Daphne Blake.", answer: "What is \"Jeepers!\"?" },
              { value: 1000, clue: "In the classic Nickelodeon jingle, the word \"Nick\" is repeated this many times before the singer finally says \"Nickelodeon.\"", answer: "What is 7 or 8? (debated — either is accepted)" },
            ],
          },
        ],
      },
    ],
    final: {
      category: "Wedding Statistics",
      clue: "According to wedding industry surveys, more than 54% of couples create one of these to help guests share photos and memories from their wedding day online.",
      answer: "What is a Wedding Hashtag?",
    },
  },
};
