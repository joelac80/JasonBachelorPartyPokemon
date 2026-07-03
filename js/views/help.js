/* help.js — the Field Guide: what every area is, how to run it, and how the
   pieces connect. Reached only via the "?" button in the top bar. */
(function () {
  const { el } = U;

  // Grouped tour of the app. Items with a route render as links; items with
  // r:null are info-only cards (concepts, not destinations).
  const GROUPS = [
    {
      title: "🚀 Set up (before the party)",
      items: [
        { r: "victoryroad", e: "🎡", t: "Draft teams", d: "Split the crew into teams — find it under Victory Road’s Setup row." },
        { r: "roster", e: "🎴", t: "The Squad", d: "Everyone’s trainer card + their favorite Pokémon. Tap ⓘ for a profile, ✎ to edit." },
        { r: "activities", e: "🗓️", t: "Game Plan", d: "The weekend itinerary — also under Victory Road’s Setup row." },
      ],
    },
    {
      title: "🏆 The competition",
      items: [
        { r: "victoryroad", e: "🏆", t: "Victory Road", d: "The master scoreboard. Tap +/− or “+pts” to award event points. The mini-games below auto-add points here." },
        { r: null, e: "🎮", t: "How scoring connects", d: "A Safari catch, a Battle win, and Jeopardy clues all feed the winner’s team on Victory Road — which the Ceremony crowns." },
      ],
    },
    {
      title: "🎯 Games to play",
      items: [
        { r: "safari", e: "🔴", t: "Pokédex Safari", d: "Pick a catcher, then earn boosts by doing dares/berries/rallies (chicken out = drink, and it might bolt!). Add a helper for a 2v2, or nail the Master Ball dare for a guaranteed catch." },
        { r: "battle", e: "⚔️", t: "Battle Arena", d: "Set any 1v1 or 2v2, tag the event (e.g. Beer Pong), and fight. The winner’s team scores." },
        { r: "brackets", e: "🥊", t: "Brackets", d: "Run a tournament bracket — each matchup can launch the battle screen." },
        { r: "jeopardy", e: "❓", t: "Jeopardy", d: "Bulbasaur-themed trivia with Daily Bulbas. Award (or dock) clue values to teams." },
      ],
    },
    {
      title: "🏅 Honors & finale",
      items: [
        { r: "superlatives", e: "🗳️", t: "Superlatives", d: "The crew votes on end-of-weekend awards. One tap = one vote." },
        { r: "badges", e: "🏅", t: "Gym Badges", d: "Hand out the 8 gym badges — and see the Live Trophies auto-earned in the games." },
        { r: "challenges", e: "🎣", t: "Catch of the Day", d: "Daily photo / dare challenges — check them off as you go." },
        { r: "hall", e: "🌿", t: "Hall of Bulbasaur", d: "Your gallery wall — add photos and art from the weekend." },
        { r: "ceremony", e: "👑", t: "Champion Ceremony", d: "The grand finale. Crowns the champion from the standings, plus superlative & badge winners." },
      ],
    },
    {
      title: "⭐ Trophies & profiles",
      items: [
        { r: null, e: "🧢", t: "Ash Ketchum", d: "Most Pokémon caught in the Safari." },
        { r: null, e: "🟣", t: "Master Catcher", d: "Most catches landed via the epic Master Ball dare." },
        { r: null, e: "🤝", t: "Best Helper", d: "Most assists helping others catch." },
        { r: null, e: "⚔️", t: "Battle Champ", d: "Most Battle Arena wins. All four show on the Home hub + each trainer’s profile." },
      ],
    },
  ];

  function card(it) {
    const kids = [
      el("span", { class: "help-card-e" }, it.e),
      el("div", { class: "help-card-txt" }, [
        el("div", { class: "help-card-t" }, it.t),
        el("div", { class: "help-card-d" }, it.d),
      ]),
    ];
    return it.r
      ? el("a", { class: "help-card link", href: "#/" + it.r }, kids)
      : el("div", { class: "help-card" }, kids);
  }

  function view(root) {
    root.appendChild(el("div", { class: "page-head" }, [
      el("h1", {}, "❓ Field Guide"),
      el("p", { class: "page-sub" }, "Where everything is, how to run it, and how the pieces fit together." ),
    ]));

    // The single most important thing to understand: it's all local.
    root.appendChild(el("div", { class: "help-callout" }, [
      el("div", { class: "help-callout-t" }, "📱 One device runs the show" ),
      el("p", {}, "This app is 100% local — like a save file on a single Game Boy. Everything you tap is stored in THIS browser only, so two phones = two separate save files that don’t see each other."),
      el("p", {}, "Simplest way to run the weekend: pick one “host” phone for the scoreboard and pass it around (or screen-share). To move the save to another device, use Settings → Export on the host, then Settings → Import on the other phone. There’s no live sync."),
      el("a", { class: "btn subtle sm", href: "#/settings" }, "⚙️ Export / Import in Settings"),
    ]));

    GROUPS.forEach((g) => {
      root.appendChild(el("h2", { class: "section-title" }, g.title));
      root.appendChild(el("div", { class: "help-grid" }, g.items.map(card)));
    });

    root.appendChild(el("div", { class: "help-foot" }, [
      el("a", { class: "btn spin-btn", href: "#/home" }, "🗺️ Back to the map"),
    ]));
  }

  window.Views = window.Views || {};
  window.Views.help = view;
})();
