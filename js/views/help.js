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
        { r: null, e: "👋", t: "The welcome tour", d: "Every fresh phone gets a six-slide walkthrough on first open — picking your trainer and the room code happens right in it. Skippable; replay it any time from the bottom of this guide." },
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
        { r: "safari", e: "🔴", t: "Pokédex Safari", d: "Pick a catcher, then earn boosts by doing dares/berries/rallies (chicken out = drink, and it might bolt!). Add a helper for a 2v2, or nail the Master Ball dare for a guaranteed catch. ✨ 1-in-16 encounters are SHINY — different colors, DOUBLE payout, marked in your dex forever. ~30% of catches drop a 🍓 Sitrus Berry (auto-heals in duels), tap any caught mon for nicknames — and every so often, with the room synced, the sky breaks and a 🌩 ROAMING LEGENDARY appears out of nowhere: the whole house races to catch it, first claim wins." },
        { r: "trade", e: "🔁", t: "Trading Post", d: "Swap caught Pokémon 1-for-1, link-cable style. Partners are untradeable — and Kadabra, Machoke, Graveler and Haunter EVOLVE when traded, just like the games. In a live room, trades are 📬 OFFERS: they sit in the other trainer's Trading Post inbox until they accept or decline on their own phone — no need to be around when it's sent." },
        { r: "tracker", e: "🔬", t: "Pokédex Tracker", d: "Every trainer's team of 6 and dex progress on one page — plus the Type Masters: catch the most of a type to claim its crown (partners don't count). Not to be confused with the Gym Leaders, who you battle in the Frontier." },
        { r: "drinks", e: "🍺", t: "Drink Tracker", d: "Log every round by trainer, type, and day. First Sip, Thirstiest, and a champion for each drink kind all earn badges." },
        { r: "cards", e: "🃏", t: "Card Table", d: "Track President/Asshole (finishing order → Best & Worst President), Euchre, King's Cup and Ride the Bus. Winners score team points; the awards land on the poster." },
        { r: "battle", e: "⚔️", t: "Battle Arena", d: "🎮 Pokémon Duel: real turn-based battles at Lv50. Singles bring a party of up to 6 (switch on faint or spend a turn to switch); Doubles put 2 Pokémon a side on the field at once — team up with a partner, or one trainer runs both. 🧪 Potion = 3 sips to heal · 🍺 Liquid Courage = finish half your drink and UNLEASH a can’t-miss guaranteed crit that same turn. Sips are on the line: every KO = 2 sips, the losing side toasts 4. Singles wins claim the 🥇 Champion’s Belt — beat the holder to take it. And battle EXP is real: a Pokémon that lands 3 KOs ITSELF evolves after the battle (Eevee gets to choose) — except Kadabra, Machoke, Graveler and Haunter, who ONLY evolve by trade. 📣 Quick Call: tap who won a real-world event. Winners’ teams score either way. 📈 Singles duels move your Elo rating; veterans hit harder (+2% ATK per KO, up to +20%); 🍓 a Sitrus Berry auto-heals when a mon drops low; hot-seat duels offer an instant 🔁 rematch." },
        { r: "brackets", e: "🥊", t: "Brackets", d: "Run a tournament bracket — each matchup can launch the battle screen." },
        { r: "gyms", e: "🏟", t: "Gym Circuit", d: "Battle the 16 canon Gym Leaders of Johto & Kanto (Falkner → BLUE) in EVEN matches — you bring exactly as many Pokémon as the leader runs, and their team is hidden until each comes out of its ball. Since everyone's Lv50, the Johto leaders bring their full HGSS REMATCH squads (5–6 deep, fully evolved) — no free Zephyr Badge off a Pidgey. Everyone can earn every badge; sweep all 16 for CHAMPION; a loss costs 3 sips. All 8 Johto badges unlock the 👑 POKÉMON LEAGUE." },
        { r: "league", e: "👑", t: "Pokémon League", d: "The cinematic climb: Victory Road gate (8 Johto badges to pass), the Elite Four chambers in order — running their full HGSS rematch squads, 6 deep, so bring an evolved team — then Champion LANCE, the Hall of Fame with every champion’s winning team (challenge any enshrined team in a ⚔ Battle of Fame — exhibition only)… and beating Lance wakes something on Mt. Silver." },
        { r: null, e: "🗺", t: "The road to RED", d: "The full ladder, Gen 2 style: ① the 8 JOHTO badges (Falkner → Clair) open Victory Road → ② the Elite Four fall IN ORDER (Will, Koga, Bruno, Karen) → ③ Champion LANCE — win and you’re in the Hall of Fame, and Mt. Silver appears for everyone → ④ collect the 8 KANTO badges (Brock → Blue) for all 16 → ⑤ only then will RED face you at the summit." },
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
        { r: null, e: "👀", t: "Challenge & spectate", d: "Tap 🎮 Duel on a trainer who’s here now — single (party up to 6) or a double battle where each of you brings a partner. Everyone plays their turns on their OWN phone (partners too, if they’re signed in on one) — with a “🎮 Your move!” ping if the app is backgrounded. Watchers get emoji reaction buttons that float up on every screen, players’ included. Everyone else gets a “Watch” alert and sees the battle live, move by move — and a LIVE banner on Home lets latecomers jump in." },
        { r: null, e: "🏟", t: "Gym & League runs are room events", d: "When the room is synced, gym badge attempts, Elite Four chambers, and the Mt. Silver climb broadcast live: everyone gets a “⚔ Battle starting — 🏅 Fog Badge on the line” ping, can 👀 Watch & cheer move by move (your 🔥👏😱💀🍺 float up on the battler's phone too), and the whole room hears who won even if they didn't watch." },
        { r: "settings", e: "🔔", t: "Phone alerts", d: "Pings when you’re challenged or a battle starts. iPhone: FIRST Add to Home Screen (Share → Add to Home Screen), open from that icon, then Settings → Enable notifications → Send a test. Alerts fire while the app is open in the background — not when it’s fully closed." },
      ],
    },
    {
      title: "🏅 Honors & finale",
      items: [
        { r: "superlatives", e: "🗳️", t: "Superlatives", d: "The crew votes on end-of-weekend awards. One tap = one vote." },
        { r: "badges", e: "🏅", t: "Weekend Badges", d: "The 8 hand-awarded party badges — each earned by weekend deeds and carrying a real ⚡ power the holder can invoke — plus the glossy badge case and the live trophies. (Gym Leader battles moved to the Battle Frontier → 🏟 Gym Circuit.)" },
        { r: "challenges", e: "🎣", t: "Daily Dares (Catch of the Day)", d: "The Dock's daily photo / dare board — check them off as you go. (Nothing to do with catching Pokémon — that's the Safari.)" },
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
        { r: null, e: "✨", t: "Shiny Hunter", d: "Most shiny Pokémon caught in the Safari (1-in-16 encounters)." },
        { r: null, e: "🏟", t: "Gym Crusher", d: "Most gym badges from the 16-leader Gym Circuit — sweep all 16 and the trophy becomes CHAMPION." },
        { r: null, e: "👑", t: "League Contender", d: "Most Pokémon League battles won — and whoever fells RED on Mt. Silver holds 🗻 Conquered Mt. Silver instead." },
        { r: null, e: "🥇", t: "Champion's Belt", d: "Held by the last trainer to win or defend a singles duel — beat the holder to take it. Streaks are counted." },
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
      el("button", { class: "btn subtle", onClick: () => { if (window.Onboard) Onboard.start(true); } }, "▶ Replay the welcome tour"),
    ]));
  }

  window.Views = window.Views || {};
  window.Views.help = view;
})();
