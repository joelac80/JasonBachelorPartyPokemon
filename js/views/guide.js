/* guide.js — 🧭 EVERY WAY TO PLAY: the complete mode directory on its own
   page. The explainer for a newcomer, the index for a veteran — every mode in
   the app, one line each, every row a door. Lifted off the Home page (which
   is long enough) and pointed at from the top-bar "?" and a Home icon.
   (Hidden CONTENT stays hidden — Home's Whispers tease it — but no MODE is a
   secret.) The old Field Guide (#/help) still holds the setup / Live-Sync /
   import-export details, linked at the foot. */
(function () {
  const { el } = U;

  const GROUPS = [
    { head: "🔴 Catching", rows: [
      ["safari", el("span", { class: "pokeball-ico", "aria-label": "Poké Ball" }), "Safari Zone", "Walk the grass across Gen 1-9 — 🍓 berry & 🪨 rock throws, ✨ shinies 1-in-20, 🟣 Master Balls earned by Champions & crowns"],
      ["safari", "🥊", "Wild battles", "Weaken 'em first — real battles that end in a throw, with a live catch meter"],
      ["trade", "🔁", "Trading Post", "Swap catches with friends — some species only ever evolve by trade"],
      ["dex", "📕", "Pokédex", "Every collection in one book: Gen 1-9, Hisui, Unown, Mega and Trainer dexes"],
    ] },
    { head: "⚔️ Battling each other", rows: [
      ["battle", "⚔️", "Battle Arena", "Live duels phone-to-phone — singles or doubles, ALL four era gimmicks open (Mega · Z-Move · Dynamax · pick-your-type Tera), the Elo belt on the line"],
      ["battle", "🎲", "Rental battles", "Deal random rental sixes to everyone in the Arena — nobody needs a single catch"],
      ["cups", "🏟", "Stadium Cups", "Round robin into finals with the whole room: Baby (Lv 5) · Poké (own catches) · Prime (Lv 100) · Rental"],
      ["brackets", "🥇", "Brackets", "A seeded knockout for the room — winner takes the bragging rights"],
    ] },
    { head: "🗺 Battling the saga", rows: [
      ["regions", "🗺", "The Journey", "68 gyms, nine Elite Fours, every Champion — fought ⚔ Challenge style (full-power rematch squads) or 📖 True Story (the classic Lv 14 → 58 curve)"],
      ["tower", "🗼", "Battle Tower", "Streak doubles with your catches or rentals — PALMER at 7, and a Legends floor above"],
      ["movies", "🎬", "Movie Legends", "The films, each showing in its own era — every poster hides a boss"],
      ["legends", "🌌", "Legendary Challenge", "Every generation's gods once their Champion falls… and sealed story specials beyond"],
      ["nuzlocke", "🪦", "Nuzlocke", "Seven permadeath structures, one save each: Classic · Randomizer · Master · Through the Ages · The Long Walk · ⚡ Blitz · Movie Marathon"],
    ] },
    { head: "🧭 The crew & the scoreboard", rows: [
      ["roster", "🎴", "Squad", "Everyone's trainer card and favorite Pokémon — tap for a full profile"],
      ["leaderboard", "🏆", "Leaderboard", "The whole squad ranked by trainer score — generations, catches, badges, Champions, crowns"],
      ["draft", "🏆", "Draft Teams", "Split the crew into teams for the run at Victory Road"],
      ["settings", "⚙️", "Settings", "Your trainer identity, the room code & Live Sync, and Export / Import of the save"],
    ] },
  ];

  function row(r, e, t, d) {
    return el("a", { class: "mode-row", href: "#/" + r }, [
      el("span", { class: "mode-e" }, e),
      el("span", { class: "mode-txt" }, [el("strong", { class: "mode-t" }, t), el("span", { class: "mode-d" }, d)]),
    ]);
  }

  function view(root) {
    root.appendChild(el("div", { class: "page-head" }, [
      el("h1", {}, "🧭 Every Way to Play"),
      el("p", { class: "page-sub" }, "Every mode in the app, one line each — every row is a door. Catch 'em, battle each other, or walk the whole saga." ),
    ]));

    root.appendChild(el("div", { class: "mode-index" }, GROUPS.map((g) =>
      el("div", { class: "mode-group" },
        [el("div", { class: "mode-head" }, g.head)].concat(g.rows.map((r) => row(r[0], r[1], r[2], r[3])))))));

    root.appendChild(el("div", { class: "help-foot" }, [
      el("a", { class: "btn spin-btn", href: "#/home" }, "🏠 Back to Home"),
      el("a", { class: "btn subtle", href: "#/help" }, "📖 Field Guide — setup, Live Sync & troubleshooting"),
    ]));

    // 🎛️ the hidden workshop door: 7 quick taps on the version dot flips
    // CARTRIDGE MODE (real stats, real damage math, level-driven bosses).
    let taps = 0, tapT = 0;
    const cartOn = () => window.CartridgeMode && CartridgeMode.on();
    const dot = el("p", { class: "hint", style: "text-align:center;opacity:.45;user-select:none;",
      onClick: () => {
        const now = Date.now();
        taps = (now - tapT < 1600) ? taps + 1 : 1;
        tapT = now;
        if (taps >= 7 && window.CartridgeMode) {
          taps = 0;
          const on = CartridgeMode.toggle();
          dot.textContent = "• v" + (on ? " 🎛️" : "");
          alert(on
            ? "🎛️ CARTRIDGE MODE — ON (beta)\n\nReal base stats at real levels, the true damage formula, and bosses that outlevel you instead of out-multiplying you. Every region climbs 1 → Champion, then resets.\n\nTap 7 more times to switch back."
            : "🎛️ CARTRIDGE MODE — OFF\n\nBack to the classic engine.");
        }
      } }, "• v" + (cartOn() ? " 🎛️" : ""));
    root.appendChild(dot);
  }

  window.Views = window.Views || {};
  window.Views.guide = view;
})();
