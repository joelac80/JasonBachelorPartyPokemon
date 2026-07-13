/*
 * seed-blank.js — the GENERIC default slate. A fresh install (or a brand-new
 * room) boots from here: no names, no dates, no inside jokes — just an empty
 * Party HQ waiting for a crew. Build yours in-app: Settings holds the party
 * basics, teams and events; the Squad page (or the welcome tour) adds
 * trainers. Every Pokémon system — Safari, Duels, the Journey, Nuzlocke,
 * the Tower, the Legends — is code-driven and fully playable from zero.
 *
 * (The original crew's room keeps its own data: a synced room carries the
 * whole state in its room doc, and existing phones keep their saved state.
 * data/seed.js remains in the repo as the archived example slate.)
 */
window.SEED = {
  party: {
    guestOfHonor: "",
    title: "",
    subtitle: "",
    startDate: "",
    endDate: "",
    location: "",
    venue: "",
    heroImage: "",
    blurb: "Assemble the crew, pick your trainers, and catch 'em all. Set the party details in ⚙️ Settings.",
  },

  // Draft teams — rename or recolor in Settings.
  teams: [
    { id: "grass",  name: "Team Bulbasaur", emoji: "🌿", color: "#5fbf6a", captain: "" },
    { id: "fire",   name: "Team Charizard", emoji: "🔥", color: "#f5732f", captain: "" },
    { id: "water",  name: "Team Squirtle",  emoji: "💧", color: "#3aa0e6", captain: "" },
    { id: "normal", name: "Team Pikachu",   emoji: "⚡", color: "#f2c744", captain: "" },
  ],

  // The crew starts EMPTY — add trainers on the Squad page or in the tour.
  attendees: [],

  events: [],
  activities: [],
  gamePlan: [],
  badges: [],
  // 🏅 The 8 hand-awarded party badges — judgment calls the room makes about
  // the moments the AUTO achievements can't measure. Each carries a power.
  gymBadges: [
    { id: "catcher", emoji: "🔴", color: "#e6352f", name: "Catcher's Badge", holder: "", used: false,
      earn: "Land the day's most legendary catch — rarest find, luckiest throw, best story.",
      power: "Pick the next Safari challenge for the whole room." },
    { id: "clutch", emoji: "💥", color: "#f2c744", name: "Clutch Badge", holder: "", used: false,
      earn: "Win a battle from the brink — one Pokémon, a sliver of HP, no business surviving.",
      power: "Force ONE rematch — any battle, any opponent, any time." },
    { id: "grave", emoji: "🪦", color: "#7b6f92", name: "Gravekeeper's Badge", holder: "", used: false,
      earn: "Suffer the room's most heartbreaking nuzlocke loss — and keep the run going anyway.",
      power: "Demand a toast to your fallen Pokémon, by name, from everyone." },
    { id: "shine", emoji: "✨", color: "#8fd0e6", name: "Shine Badge", holder: "", used: false,
      earn: "Catch a shiny — or be the loudest witness when one appears.",
      power: "Steal first pick in the next group game or draft." },
    { id: "scholar", emoji: "🧠", color: "#2e8b3d", name: "Scholar's Badge", holder: "", used: false,
      earn: "Drop the type-matchup or evolution knowledge that turns a battle around.",
      power: "One coaching timeout in any friend's battle this weekend." },
    { id: "marathon", emoji: "🕰", color: "#b06f2c", name: "Marathon Badge", holder: "", used: false,
      earn: "Push deepest into the saga in one sitting — gyms, films, or a nuzlocke that wouldn't die.",
      power: "Choose the soundtrack for the rest of the night." },
    { id: "rival", emoji: "⚔️", color: "#4fa3ff", name: "Rival Badge", holder: "", used: false,
      earn: "Call your shot: challenge someone ABOVE you on the boards — and beat them.",
      power: "Issue one duel that cannot be declined." },
    { id: "heart", emoji: "💛", color: "#f2a33c", name: "Heart Badge", holder: "", used: false,
      earn: "Do the thing that makes the whole room love this world a little more.",
      power: "Award the next Weekend Badge yourself." },
  ],
  oakTip: {},
  memes: [],
  hall: [],
  // 🗳 Voted awards — the human side of the achievement wall. The tiers
  // measure what you DID; these crown how you did it.
  superlatives: [
    { id: "ash",      emoji: "🧢", title: "The Ash Ketchum",        desc: "Heart of a true trainer — never stopped battling, never stopped believing." },
    { id: "prof",     emoji: "🔬", title: "The Professor",          desc: "Walking Pokédex: every matchup, every evolution level, every obscure form." },
    { id: "lucky",    emoji: "🍀", title: "Born Under Jirachi",     desc: "The crits, the shinies, the one-ball catches — luck that made the room boo." },
    { id: "funeral",  emoji: "💔", title: "Most Tragic Loss",       desc: "The nuzlocke death we all attended — a funeral, a eulogy, a legend." },
    { id: "trash",    emoji: "🎙", title: "Best Battle Commentary", desc: "Trash talk and play-by-play worthy of the big screen." },
    { id: "loyal",    emoji: "🐢", title: "Starter Loyalty",        desc: "Rode their day-one partner all the way to the end credits." },
    { id: "choke",    emoji: "😱", title: "The Big Choke",          desc: "Had the Champion at 1 HP… and we still talk about what happened next." },
    { id: "wildcard", emoji: "🃏", title: "Wild Card Legend",       desc: "Did the thing absolutely nobody saw coming." },
  ],
  challenges: [],
  evolutions: {},
  cards: {},
  jeopardyBoard: { rounds: [], final: {} },
};
