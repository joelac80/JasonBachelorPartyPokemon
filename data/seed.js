/*
 * seed.js — Default data for Jason's Bachelor Party Hub.
 *
 * This is the ONE file you edit to plug in real info.
 * It defines a global `SEED` object (no build step, no imports needed).
 *
 * When you get the real list of attendees / activities, edit the arrays
 * below. The app copies this into browser storage on first load. To force
 * a reset after editing, open the app and use Settings ▸ "Reset to defaults"
 * (or clear the browser's local storage for this page).
 */
window.SEED = {
  // ---------------------------------------------------------------------------
  // PARTY BASICS
  // ---------------------------------------------------------------------------
  party: {
    guestOfHonor: "Jason",
    title: "Jason's Bachelor Party",
    subtitle: "Gotta Party 'Em All",
    // The big weekend. Edit to the real date/time (local time).
    startDate: "2026-07-10T17:00:00",
    endDate: "2026-07-13T12:00:00",
    location: "The Lake House",
    // Short blurb shown on the home page.
    blurb:
      "One trainer. One last quest before the big day. Bulbasaur energy, " +
      "Hoosier pride, Panthers grit, and pure lake house vibes.",
  },

  // ---------------------------------------------------------------------------
  // TEAMS — used by Victory Road (beer olympics) + the Draft Board
  // Pokemon-themed, tied to the party's motifs. Add/remove freely.
  // `color` drives the team's accent color across the app.
  // ---------------------------------------------------------------------------
  teams: [
    { id: "grass",  name: "Team Bulbasaur", emoji: "🌿", color: "#5fbf6a", captain: "" },
    { id: "fire",   name: "Team Charizard", emoji: "🔥", color: "#f5732f", captain: "" },
    { id: "water",  name: "Team Squirtle",  emoji: "💧", color: "#3aa0e6", captain: "" },
    { id: "normal", name: "Team Persian",   emoji: "🐾", color: "#c9a227", captain: "" },
  ],

  // ---------------------------------------------------------------------------
  // ATTENDEES — "Trainers". These are placeholders — swap in real names.
  // `team` can be "" (undrafted) or a team id from the list above.
  // `type` is a Pokemon type used for the trainer card flavor/color.
  // ---------------------------------------------------------------------------
  attendees: [
    { id: "jason",  name: "Jason",   nickname: "The Champion", team: "", type: "grass",    role: "Groom",   catchphrase: "Bulbasaur, I choose you." },
    { id: "p2",     name: "Trainer 2", nickname: "", team: "", type: "fire",     role: "Best Man", catchphrase: "" },
    { id: "p3",     name: "Trainer 3", nickname: "", team: "", type: "water",    role: "Groomsman", catchphrase: "" },
    { id: "p4",     name: "Trainer 4", nickname: "", team: "", type: "electric", role: "Groomsman", catchphrase: "" },
    { id: "p5",     name: "Trainer 5", nickname: "", team: "", type: "normal",   role: "Attendee", catchphrase: "" },
    { id: "p6",     name: "Trainer 6", nickname: "", team: "", type: "fighting", role: "Attendee", catchphrase: "" },
    { id: "p7",     name: "Trainer 7", nickname: "", team: "", type: "psychic",  role: "Attendee", catchphrase: "" },
    { id: "p8",     name: "Trainer 8", nickname: "", team: "", type: "water",    role: "Attendee", catchphrase: "" },
  ],

  // ---------------------------------------------------------------------------
  // VICTORY ROAD — the beer olympics events. Each event is worth points.
  // The scoreboard lets you award points per team per event.
  // ---------------------------------------------------------------------------
  events: [
    { id: "beerpong",  name: "Beer Pong",     emoji: "🏓", points: 100, desc: "Classic cups. Elbows behind the table." },
    { id: "flipcup",   name: "Flip Cup",      emoji: "🥤", points: 75,  desc: "Team relay. Drink, flip, repeat." },
    { id: "cornhole",  name: "Cornhole",      emoji: "🌽", points: 75,  desc: "Bags in the hole. 21 to win." },
    { id: "kanjam",    name: "Kan Jam",       emoji: "🥏", points: 50,  desc: "Frisbee + can. Deflect and dunk." },
    { id: "diceroll",  name: "Beer Die",      emoji: "🎲", points: 50,  desc: "Bounce the die off the table." },
    { id: "boatrace",  name: "Boat Race",     emoji: "🚣", points: 100, desc: "Line up. Chug in sequence. Anchor drinks last." },
    { id: "laddergolf",name: "Ladder Golf",   emoji: "🪜", points: 50,  desc: "Toss the bolas. Wrap the rungs." },
    { id: "wildcard",  name: "Wild Card",     emoji: "⭐", points: 150, desc: "The commissioner's mystery event." },
  ],

  // ---------------------------------------------------------------------------
  // ACTIVITIES / ITINERARY — the weekend schedule + fun stuff.
  // `day` groups them; `time` is free text.
  // ---------------------------------------------------------------------------
  activities: [
    { id: "a1", day: "Friday",   time: "5:00 PM", title: "Arrival & Check-in", emoji: "🏡", desc: "Roll up to the lake house, claim beds, crack the first one." },
    { id: "a2", day: "Friday",   time: "7:00 PM", title: "Welcome Grill-out",   emoji: "🍔", desc: "Burgers, brats, and the opening ceremony toast." },
    { id: "a3", day: "Friday",   time: "9:00 PM", title: "Draft Night",         emoji: "📋", desc: "Spin the wheel. Draft the teams for Victory Road." },
    { id: "a4", day: "Saturday", time: "10:00 AM",title: "Lake Day",            emoji: "🌊", desc: "Boats, tubing, and floating with a cold one." },
    { id: "a5", day: "Saturday", time: "2:00 PM", title: "Victory Road Begins", emoji: "🏆", desc: "The beer olympics. Let the games begin." },
    { id: "a6", day: "Saturday", time: "8:00 PM", title: "Bonfire & Awards",    emoji: "🔥", desc: "Crown the champions. Roast the groom." },
    { id: "a7", day: "Sunday",   time: "11:00 AM",title: "Recovery Brunch",     emoji: "🍳", desc: "Breakfast of champions before the road home." },
  ],

  // ---------------------------------------------------------------------------
  // MEMES — local image files in /assets/memes (or paste image URLs).
  // Start empty; add your own. `src` can be a path or a data URL.
  // ---------------------------------------------------------------------------
  memes: [
    // { id: "m1", caption: "When Jason says one more round", src: "assets/memes/example.jpg" },
  ],
};
