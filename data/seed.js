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
    // The big weekend (local time).
    startDate: "2026-07-07T17:00:00",
    endDate: "2026-07-10T12:00:00",
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
    { id: "chris",  name: "Chris Davies",       nickname: "", rank: "Elite Four", role: "Groomsman", team: "", type: "water",    favorite: "", favoriteId: 0, photo: "", catchphrase: "" },
    { id: "jeremy", name: "Jeremy Warren",      nickname: "", rank: "Elite Four", role: "Groomsman", team: "", type: "bug",      favorite: "Beedrill", favoriteId: 15, photo: "", catchphrase: "" },
    { id: "jamie",  name: "Jamie Fujinaka",     nickname: "", rank: "Elite Four", role: "Groomsman", team: "", type: "fairy",    favorite: "Tinkaton", favoriteId: 959, photo: "", catchphrase: "" },
    { id: "dan",    name: "Dan Kania",          nickname: "", rank: "Gym Leader", role: "The Squad", team: "", type: "fire",     favorite: "", favoriteId: 0, photo: "", catchphrase: "" },
    { id: "joseph", name: "Joseph Thomas",      nickname: "", rank: "Gym Leader", role: "The Squad", team: "", type: "fire",     favorite: "Vulpix", favoriteId: 37, photo: "", catchphrase: "" },
    { id: "sid",    name: "Sid Suresh",         nickname: "", rank: "Gym Leader", role: "The Squad", team: "", type: "ghost",    favorite: "Mimikyu", favoriteId: 778, photo: "", catchphrase: "" },
    { id: "matt",   name: "Matt Spicer",        nickname: "", rank: "Gym Leader", role: "The Squad", team: "", type: "flying",   favorite: "Tranquill", favoriteId: 520, photo: "", catchphrase: "" },
    { id: "tyler",  name: "Tyler Logan",        nickname: "", rank: "Gym Leader", role: "The Squad", team: "", type: "fighting", favorite: "", favoriteId: 0, photo: "", catchphrase: "" },
    { id: "brian",  name: "Brian Mallon",       nickname: "", rank: "Gym Leader", role: "The Squad", team: "", type: "dark",     favorite: "", favoriteId: 0, photo: "", catchphrase: "" },
  ],

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
    { id: "a1", day: "Tuesday",   time: "5:00 PM",  title: "Arrival & Check-in", emoji: "🏡", desc: "Roll up to the lake house, claim beds, crack the first one." },
    { id: "a2", day: "Tuesday",   time: "8:00 PM",  title: "Draft Night",         emoji: "📋", desc: "Spin the wheel. Draft the teams for Victory Road." },
    { id: "a3", day: "Wednesday", time: "11:00 AM", title: "On the Water",        emoji: "🌊", desc: "Kayak, hot tub, football." },
    { id: "a4", day: "Wednesday", time: "8:00 PM",  title: "Jason Jeopardy",      emoji: "❓", desc: "This-is-your-life trivia." },
    { id: "a5", day: "Thursday",  time: "2:00 PM",  title: "Victory Road",        emoji: "🏆", desc: "The beer olympics. Let the games begin." },
    { id: "a6", day: "Thursday",  time: "9:00 PM",  title: "Zimmy's",             emoji: "🍹", desc: "Margaritaville night — frozen drinks + live music." },
    { id: "a7", day: "Friday",    time: "11:00 AM", title: "Recovery Brunch",     emoji: "🍳", desc: "Breakfast of champions before the road home." },
  ],

  // ---------------------------------------------------------------------------
  // MEMES — add in-app, or seed paths here (e.g. the Oak's Tip screenshot).
  // ---------------------------------------------------------------------------
  memes: [
    // { id: "m1", caption: "Oak's questionable wisdom", src: "assets/memes/oak.png" },
  ],
};
