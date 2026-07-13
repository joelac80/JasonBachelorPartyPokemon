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
        { r: null, e: "👋", t: "The welcome tour", d: "Every fresh phone gets a seven-slide walkthrough on first open — picking your trainer and the room code happens right in it. Skippable; replay it any time from the bottom of this guide." },
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
        { r: "safari", e: "🔴", t: "Pokédex Safari", d: "Find a wild one, then raise the odds the CLASSIC way: toss 🍓 berries (+10% each, but 5% it grabs the snack and runs) or 🪨 rocks (+30% each, but 15% it spooks and bolts) — stack your nerve. Add a helper for a 2v2 assist, or arm a 🟣 MASTER BALL for a guaranteed catch: you earn 5 for every Champion you beat and more for nuzlocke crowns (3 each, 5 for ultimates). ✨ 1-in-16 encounters are SHINY — different colors, DOUBLE payout, and their OWN Pokédex. 🧭 THE GEN LADDER: your wild starts at Gen 1 (#1–151) and BATTLES open the rest — beat Champion BLUE in Kanto to spill Gen 2 into the grass, then each Champion you beat in The Journey unlocks the next generation (LANCE→Gen 3, STEVEN→Gen 4… LEON→Gen 9, all the way to #1025). No dex completion required — it's about the climb. You won't re-meet something you've already caught, but a shiny counts separately — catch a normal Totodile and a shiny one can still turn up. Flip the Regular ⇄ ✨ Shiny tabs in your dex. ~30% of catches drop a 🍓 Sitrus Berry (auto-heals in duels), tap any caught mon for nicknames — and every so often, with the room synced, the sky breaks and a 🌩 ROAMING LEGENDARY appears: everyone can go catch their own. Everyone builds their own dex — no one-of-one." },
        { r: "trade", e: "🔁", t: "Trading Post", d: "Swap caught Pokémon 1-for-1, link-cable style. Partners are untradeable — and Kadabra, Machoke, Graveler and Haunter EVOLVE when traded, just like the games. In a live room, trades are 📬 OFFERS: they sit in the other trainer's Trading Post inbox until they accept or decline on their own phone — no need to be around when it's sent." },
        { r: "tracker", e: "🔬", t: "Pokédex Tracker", d: "Every trainer's team of 6 and dex progress on one page — plus the Type Masters: catch the most of a type to claim its crown (partners don't count). Not to be confused with the Gym Leaders, who you battle in The Journey." },
        { r: "drinks", e: "🍺", t: "Drink Tracker", d: "Log every round by trainer, type, and day. First Sip, Thirstiest, and a champion for each drink kind all earn badges." },
        { r: "cards", e: "🃏", t: "Card Table", d: "Track President/Asshole (finishing order → Best & Worst President), Euchre, King's Cup and Ride the Bus. Winners score team points; the awards land on the poster." },
        { r: "battle", e: "⚔️", t: "Battle Arena", d: "🎮 Pokémon Duel: real turn-based battles at Lv50. Singles bring a party of up to 6 (switch on faint or spend a turn to switch); Doubles put 2 Pokémon a side on the field at once — team up with a partner, or one trainer runs both. 🧪 Potion = heal 120 (2 per battle) · 🎯 Dire Hit = UNLEASH a can’t-miss guaranteed crit that same turn (once per battle). Singles wins claim the 🥇 Champion’s Belt — beat the holder to take it. And battle EXP is real: a Pokémon that lands 3 KOs ITSELF evolves after the battle (Eevee gets to choose) — except Kadabra, Machoke, Graveler and Haunter, who ONLY evolve by trade. 📣 Quick Call: tap who won a real-world event. Winners’ teams score either way. 📈 Singles duels move your Elo rating; veterans hit harder (+2% ATK per KO, up to +20%); 🍓 a Sitrus Berry auto-heals when a mon drops low; hot-seat duels offer an instant 🔁 rematch." },
        { r: "brackets", e: "🥊", t: "Party Brackets", d: "Run a tournament bracket — each matchup can launch the battle screen." },
        { r: "regions", e: "🗺", t: "The Journey", d: "The whole saga in one place, region by region (Kanto first, then Johto's 16-badge era, on to Paldea): each region's GYMS → its ELITE FOUR → its CHAMPION, with that era's 🎬 films and 🌌 legends folded into its tab. 68 canon leaders in EVEN matches — you bring exactly as many Pokémon as the leader runs, lineups hidden until each ball opens. TWO STYLES, switchable any time: ⚔ CHALLENGE (full-power rematch squads — the default wall) or 📖 TRUE STORY (levels scale like the games, Lv 14 at badge 1 → 58 at the Champion, both teams stepping down to era-true forms). Beyond the regions: the silent trainer RED on Mt. Silver and the 🏆 CHAMPIONS CUP, a 16-legend bracket of every Elite Four & Champion. A Champion win enshrines your team in the 🏛 Hall of Fame — challenge any enshrined team, or run a region's whole GAUNTLET in one go." },
        { r: null, e: "🧭", t: "The full ladder", d: "Per region it's the same shape: ① the 8 gym badges → ② the Elite Four fall IN ORDER → ③ the Champion. Kanto opens the saga (the original Elite Four and a Champion someone will recognize); Johto adds 8 more badges, LANCE, then RED on Mt. Silver; every later region (Hoenn → Paldea) brings its own 8 gyms, Elite Four and Champion, ending with Top Champion GEETA. Beating a region's Champion opens the NEXT region — and spills its generation of Pokémon into the Safari (the Gen Ladder)." },
        { r: "tower", e: "🗼", t: "Battle Tower", d: "Streak battles, 4v4 doubles, randomized foes that scale as you climb. Bring your own catches or run the RENTAL floor with dealt teams; PALMER waits at streak 7, and a LEGENDS floor looms above. Your best streak feeds the achievement wall." },
        { r: "cups", e: "🏟", t: "Stadium Cups", d: "Round-robin into finals with the whole room (AI fills empty seats): 🍼 BABY CUP at Lv 5 (basics only), 🔴 POKÉ CUP with your own catches, 👑 PRIME CUP at Lv 100 with everything legal, and 🎲 RENTAL CUP on dealt random sixes — everyone equal, pure play. Humans battle for real; AI-vs-AI seats simulate. Top four seed the semifinals; a champion gets crowned." },
        { r: "movies", e: "🎬", t: "Movie Legends", d: "The films, each showing in its own era of The Journey — every poster hides a boss battle (Mewtwo's cloned army, the Collector's airship, Darkrai's nightmare and more), each with a canon co-star moment. Beat a film's gate Champion first to open its premiere." },
        { r: "legends", e: "🌌", t: "Legendary Challenge", d: "Once a generation's Champion falls, its gods answer: every generation's legendary gauntlet, plus SEALED STORY SPECIALS beyond them (rifts, frenzied nobles, judgments…) that stay hidden until their moment. The endgame above the endgame." },
        { r: "nuzlocke", e: "🪦", t: "Nuzlocke — seven epics", d: "Permadeath, one save slot per structure so all seven can run at once: 🗾 CLASSIC (one region on the level curve), 🎲 RANDOMIZER, 🌍 MASTER (all 114 battles at Lv 100), 🕰 THROUGH THE AGES (nine regions, a fresh team each era — Professor Oak waits at the very end), 🎒 THE LONG WALK (ONE box through every region, devolving at each border), ⚡ BLITZ (15 battles scaling 14→100 in one sitting), and the 🎬 MOVIE MARATHON (draft six, survive all the films). Faint = gone forever; fewest catches wears the crown." },
        { r: "leaderboard", e: "🏆", t: "Squad Leaderboard", d: "The whole squad ranked by TRAINER SCORE — the achievement wall's bronze/silver/gold/platinum points — with each trainer's generations, catches, badges, Champions, tower streak and nuzlocke crowns in one row. Tap anyone for their full profile." },
        { r: "jeopardy", e: "❓", t: "Jeopardy", d: "Bulbasaur-themed trivia with Daily Bulbas. Award (or dock) clue values to teams." },
        { r: "predictions", e: "🔮", t: "The Oracle", d: "Call outcomes before they happen — who wins, how many drinks, will the groom cry. Nail your calls to climb the Oracle board; right calls score for your team." },
      ],
    },
    {
      title: "🔗 Play together (Live Sync)",
      items: [
        { r: "settings", e: "🔗", t: "Turn on Live Sync", d: "Optional. Settings → Live Sync: type the shared room code, pick your trainer, tap Connect — the party's Firebase project is built in, no config needed. Now everyone’s phones share one live scoreboard. Off = fully local." },
        { r: null, e: "🟢", t: "Green Poké Ball", d: "The Poké Ball in the top bar glows green when your phone is live-synced to the room (grey/hidden when local)." },
        { r: null, e: "🔄", t: "Live & pull-to-refresh", d: "Synced phones update in REAL TIME — a drink, catch, or battle on one phone shows on the others within a second, no refreshing needed. It also auto-pulls the latest whenever you switch back to the app. If something ever looks stale, pull DOWN from the top of the screen to force a refresh." },
        { r: "battle", e: "🥊", t: "Trainers here now", d: "Once synced, the Battle Arena shows who else is signed in — tap ⚔ Challenge to battle their phone." },
        { r: null, e: "👀", t: "Challenge & spectate", d: "Tap 🎮 Duel on a trainer who’s here now — single (party up to 6) or a double battle where each of you brings a partner. Everyone plays their turns on their OWN phone (partners too, if they’re signed in on one) — with a “🎮 Your move!” ping if the app is backgrounded. Watchers get emoji reaction buttons that float up on every screen, players’ included. Everyone else gets a “Watch” alert and sees the battle live, move by move — and a LIVE banner on Home lets latecomers jump in." },
        { r: null, e: "🏟", t: "Journey battles are room events", d: "When the room is synced, gym badge attempts, Elite Four chambers, and the Mt. Silver climb broadcast live: everyone gets a “⚔ Battle starting — 🏅 Fog Badge on the line” ping, can 👀 Watch & cheer move by move (your 🔥👏😱💀🍺 float up on the battler's phone too), and the whole room hears who won even if they didn't watch." },
        { r: "settings", e: "🔔", t: "Phone alerts", d: "Pings when you’re challenged or a battle starts. iPhone: FIRST Add to Home Screen (Share → Add to Home Screen), open from that icon, then Settings → Enable notifications → Send a test. Alerts fire while the app is open in the background — not when it’s fully closed." },
      ],
    },
    {
      title: "🏅 Honors & finale",
      items: [
        { r: "superlatives", e: "🗳️", t: "Superlatives", d: "The crew votes on end-of-weekend awards. One tap = one vote." },
        { r: "badges", e: "🏅", t: "Weekend Badges", d: "The 8 hand-awarded party badges — each earned by weekend deeds and carrying a real ⚡ power the holder can invoke — plus the glossy badge case and the live trophies. (Gym Leader battles live in 🗺 The Journey.)" },
        { r: "challenges", e: "🎣", t: "Daily Dares (Catch of the Day)", d: "The Dock's daily photo / dare board — check them off as you go. (Nothing to do with catching Pokémon — that's the Safari.)" },
        { r: "feed", e: "📸", t: "Snapshots (the feed)", d: "The weekend's photo feed — every 📸 photo moment lands here with who posted it and WHEN. React ❤️😂🔥👏🥳 and comment as your trainer, ⬇️ Save one photo, or tap “Select & save” to grab a bunch at once (iPhone opens the share sheet to save to Photos; elsewhere it downloads a zip). A scrolling strip of the latest also sits at the bottom of Home; photos show on the Weekend Log and Poster too." },
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
        { r: null, e: "🏟", t: "Gym Crusher", d: "Most gym badges across every region's gyms in The Journey — sweep all 16 Johto & Kanto and the trophy becomes CHAMPION." },
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
