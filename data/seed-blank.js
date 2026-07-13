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
  gymBadges: [],
  oakTip: {},
  memes: [],
  hall: [],
  superlatives: [],
  challenges: [],
  evolutions: {},
  cards: {},
  jeopardyBoard: { rounds: [], final: {} },
};
