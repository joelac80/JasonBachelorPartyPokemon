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
        { r: "tracker", e: "🔬", t: "Pokédex Tracker", d: "Every trainer's team of 6 and dex progress on one page — plus the Type Gym Leaders: catch the most of a type to claim its gym (partners don't count)." },
        { r: "drinks", e: "🍺", t: "Drink Tracker", d: "Log every round by trainer, type, and day. First Sip, Thirstiest, and a champion for each drink kind all earn badges." },
        { r: "cards", e: "🃏", t: "Card Table", d: "Track President/Asshole (finishing order → Best & Worst President), Euchre, King's Cup and Ride the Bus. Winners score team points; the awards land on the poster." },
        { r: "battle", e: "⚔️", t: "Battle Arena", d: "🎮 Pokémon Duel: real turn-based battles at Lv50. Singles bring a party of up to 6 (switch on faint or spend a turn to switch); Doubles put 2 trainers a side on the field at once. 🧪 Potion = 3 sips to heal · 🍺 Liquid Courage = finish half your drink for a guaranteed crit. 📣 Quick Call: tap who won a real-world event. Winners’ teams score either way." },
        { r: "brackets", e: "🥊", t: "Brackets", d: "Run a tournament bracket — each matchup can launch the battle screen." },
        { r: "jeopardy", e: "❓", t: "Jeopardy", d: "Bulbasaur-themed trivia with Daily Bulbas. Award (or dock) clue values to teams." },
        { r: "predictions", e: "🔮", t: "Predictions (Oracle)", d: "Call outcomes before they happen — who wins, how many drinks, will the groom cry. Nail your calls to climb the Oracle board; right calls score for your team." },
      ],
    },
    {
      title: "🔗 Play together (Live Sync)",
      items: [
        { r: "settings", e: "🔗", t: "Turn on Live Sync", d: "Optional. Settings → Live Sync: type the shared room code, pick your trainer, tap Connect — the party's Firebase project is built in, no config needed. Now everyone’s phones share one live scoreboard. Off = fully local." },
        { r: null, e: "🟢", t: "Green Poké Ball", d: "The Poké Ball in the top bar glows green when your phone is live-synced to the room (grey/hidden when local)." },
        { r: "battle", e: "🥊", t: "Trainers here now", d: "Once synced, the Battle Arena shows who else is signed in — tap ⚔ Challenge to battle their phone." },
        { r: null, e: "👀", t: "Challenge & spectate", d: "Tap 🎮 Duel on a trainer who’s here now — single (party up to 6) or a double battle where each of you brings a partner. Everyone plays their turns on their OWN phone (partners too, if they’re signed in on one). Everyone else gets a “Watch” alert and sees the battle live, move by move — and a LIVE banner on Home lets latecomers jump in." },
        { r: "settings", e: "🔔", t: "Phone alerts", d: "Pings when you’re challenged or a battle starts. iPhone: FIRST Add to Home Screen (Share → Add to Home Screen), open from that icon, then Settings → Enable notifications → Send a test. Alerts fire while the app is open in the background — not when it’s fully closed." },
      ],
    },
    {
      title: "🏅 Honors & finale",
      items: [
        { r: "superlatives", e: "🗳️", t: "Superlatives", d: "The crew votes on end-of-weekend awards. One tap = one vote." },
        { r: "badges", e: "🏅", t: "Gym Badges", d: "Hand out the 8 gym badges — and see the Live Trophies auto-earned in the games." },
        { r: "challenges", e: "🎣", t: "Catch of the Day", d: "Daily photo / dare challenges — check them off as you go." },
        { r: "hall", e: "🌿", t: "Hall of Bulbasaur", d: "Your gallery wall — add photos and art from the weekend." },
        { r: "messages", e: "💌", t: "Message Wall", d: "Everyone leaves a note/advice/roast for the groom — sealed from his own phone until the closing ceremony unlocks it." },
        { r: "ceremony", e: "👑", t: "Champion Ceremony", d: "The grand finale. Crowns the champion, then “Roll the Closing Credits” plays a movie-style send-off through the whole squad, ending on the groom — and unlocks his Message Wall." },
        { r: "timeline", e: "📜", t: "Weekend Log", d: "The full activity feed — every catch, battle, drink, card round, prediction, badge and photo, stamped with who logged it. Filter by category or scorekeeper." },
        { r: "stats", e: "📊", t: "Trip Stats", d: "The weekend by the numbers — an activity chart, auto superlatives (Night Owl, Shutterbug…), everyone's Player Wrapped recap, a daily digest, battle rivalries, and a CSV export of the whole log." },
        { r: "poster", e: "🖼️", t: "Weekend Poster", d: "The whole trip on one board — every trainer with their Pokémon and badges, the awards wall, and a photo + move-by-move timeline. Add photo moments (they’re downscaled and shared to the room), then print or save a PDF keepsake." },
      ],
    },
    {
      title: "⭐ Trophies & profiles",
      items: [
        { r: null, e: "🧢", t: "Ash Ketchum", d: "Most Pokémon caught in the Safari." },
        { r: null, e: "🟣", t: "Master Catcher", d: "Most catches via the epic Master Ball dare." },
        { r: null, e: "🤝", t: "Best Helper", d: "Most assists helping others catch." },
        { r: null, e: "⚔️", t: "Battle Champ", d: "Most Battle Arena wins." },
        { r: null, e: "🔮", t: "Oracle", d: "Most correct predictions on the Oracle board." },
        { r: null, e: "👑💩", t: "Best & Worst President", d: "Most times President — and most times stuck as the Asshole — at the Card Table." },
        { r: null, e: "♠️", t: "Euchre Champ", d: "Most Euchre wins." },
        { r: null, e: "🍾🍺", t: "Drink awards", d: "First Sip, Thirstiest, and a champion for each drink kind — from the Drink Tracker." },
        { r: null, e: "📋", t: "Scorekeeper", d: "Most moments logged — whoever does the work of tracking the weekend. Every action is stamped with who recorded it (set your identity via “You are” in Settings)." },
        { r: "roster", e: "👤", t: "Trainer profiles", d: "Tap ⓘ on a Squad card (or any leaderboard name) for anyone’s full profile — their Pokémon, team standing, badges and stats. Every trophy above shows on the Home hub, the Badges case, and the Poster." },
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
      el("p", {}, "Simplest way to run the weekend: pick one “host” phone for the scoreboard and pass it around (or screen-share). To move the save to another device, use Settings → Export on the host, then Settings → Import on the other phone."),
      el("p", {}, "Want everyone’s phones sharing ONE live scoreboard instead? Turn on Live Sync (see “Play together” below) — it’s optional and off by default."),
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
