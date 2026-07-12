/* legends.js — 🌌 The Legendary & Mythical Challenge. The post-league endgame:
   once you've toppled a region's Champion, its generation's legendaries rise to
   test you — a full 6v6 against the titans, mascots and mythicals of that gen.
   Clear all nine to become a Legend Keeper. Pure glory: a win is recorded per
   trainer per generation (append-only, sync-unioned) for the wall and a ceremony
   honor. Reuses the League stage styling; folds into the Journey per region. */
(function () {
  const { el } = U;
  const SP = window.DEX_SPRITES || {};
  function sfx(n) { if (window.SFX && SFX[n]) SFX[n](); }

  // One trial per generation. `needs` is the Champion league-key that unlocks it
  // (beat that Champion and the titans appear). `regions` places the trial in the
  // matching Journey tab. Teams are that generation's legendaries + a mythical,
  // ace last. Boost/points climb with the generation — this is the hardest PvE.
  const LEGENDS = [
    { key: "gen1", gen: 1, name: "Kanto Titans", emoji: "🔮", needs: "lance", champ: "LANCE", regions: ["Johto", "Kanto"],
      team: [144, 145, 146, 151, 149, 150], face: 150, boost: 1.42, pts: 20,
      quote: "The Genetic Pokémon awakens, and the winged titans of ice, storm and flame answer. Prove a bond can outmatch raw creation.",
      winChron: "tamed the Kanto titans — MEWTWO itself bowed!", loseChron: "the Kanto titans proved unmatched",
      lead: "🔮 Articuno, Zapdos, Moltres, Mew and Dragonite — and MEWTWO, the perfect Pokémon." },
    { key: "gen2", gen: 2, name: "Johto Beasts", emoji: "🌈", needs: "lance", champ: "LANCE", regions: ["Johto", "Kanto"],
      team: [243, 244, 245, 250, 251, 249], face: 249, boost: 1.44, pts: 22,
      quote: "The three legendary beasts race the wind, the guardians of the towers spread their wings. Time itself sent Celebi to watch you fall.",
      winChron: "outran the Johto beasts and grounded LUGIA and HO-OH!", loseChron: "the Johto beasts vanished into legend",
      lead: "🌈 Raikou, Entei, Suicune, Ho-Oh and Celebi — and LUGIA, the guardian of the sea." },
    { key: "gen3", gen: 3, name: "Hoenn Weather Trio", emoji: "🌊", needs: "steven", champ: "STEVEN", regions: ["Hoenn"],
      team: [377, 378, 379, 382, 383, 384], face: 384, boost: 1.46, pts: 24,
      quote: "The land rises, the sea swells, and the sky splits open. Only the Delta Emerald can settle who rules the heavens.",
      winChron: "quelled the Hoenn superancients — RAYQUAZA yielded the sky!", loseChron: "the weather trio drowned another challenger",
      lead: "🌊 Regirock, Regice, Registeel, Kyogre and Groudon — and RAYQUAZA, lord of the skies." },
    { key: "gen4", gen: 4, name: "Sinnoh Creation Trio", emoji: "🌌", needs: "cynthia", champ: "CYNTHIA", regions: ["Sinnoh"],
      team: [483, 484, 487, 485, 491, 493], face: 493, boost: 1.48, pts: 26,
      quote: "Time, Space, and Antimatter converge — and the Original One that shaped them all descends to judge you.",
      winChron: "unmade the Sinnoh creation trio — even ARCEUS knelt!", loseChron: "the creation trio erased another hope",
      lead: "🌌 Dialga, Palkia, Giratina, Heatran and Darkrai — and ARCEUS, the Original One." },
    { key: "gen5", gen: 5, name: "Unova Tao Trio", emoji: "⚡", needs: "alder", champ: "ALDER", regions: ["Unova"],
      team: [638, 639, 640, 643, 644, 646], face: 646, boost: 1.50, pts: 28,
      quote: "Truth and Ideals burn and spark, the Swords of Justice stand guard — and the empty shell of Kyurem hungers for both.",
      winChron: "shattered the Unova tao dragons — KYUREM froze over!", loseChron: "the tao dragons judged another wanting",
      lead: "⚡ Cobalion, Terrakion, Virizion, Reshiram and Zekrom — and KYUREM, the boundary." },
    { key: "gen6", gen: 6, name: "Kalos Life & Death", emoji: "🦌", needs: "diantha", champ: "DIANTHA", regions: ["Kalos"],
      team: [719, 720, 721, 716, 717, 718], face: 718, boost: 1.52, pts: 30,
      quote: "Life eternal and destruction absolute, bound by the serpent of order. The jewel, the genie and the kettle attend.",
      winChron: "balanced the Kalos legends — ZYGARDE enforced no order here!", loseChron: "life and death reclaimed another",
      lead: "🦌 Diancie, Hoopa, Volcanion, Xerneas and Yveltal — and ZYGARDE, the order between." },
    { key: "gen7", gen: 7, name: "Alola Guardians", emoji: "🌞", needs: "kukui", champ: "KUKUI", regions: ["Alola"],
      team: [785, 791, 792, 801, 802, 800], face: 800, boost: 1.54, pts: 32,
      quote: "Sun and Moon blaze in the sky, the island guardian crackles, and the prism that devours light unfolds its blades.",
      winChron: "eclipsed the Alola cosmos — NECROZMA's light returned!", loseChron: "the blinding one swallowed another dawn",
      lead: "🌞 Tapu Koko, Solgaleo, Lunala, Magearna and Marshadow — and NECROZMA, the light-eater." },
    { key: "gen8", gen: 8, name: "Galar Heroes", emoji: "⚔️", needs: "leon", champ: "LEON", regions: ["Galar"],
      team: [888, 889, 890, 894, 895, 898], face: 898, boost: 1.56, pts: 34,
      quote: "The Fairy King's swords are drawn, the endless one coils in the crater, and the frozen monarch mounts his steed.",
      winChron: "dethroned the Galar monarchs — CALYREX lost its crown!", loseChron: "the crowned king unmade another reign",
      lead: "⚔️ Zacian, Zamazenta, Eternatus, Regieleki and Regidrago — and CALYREX, the King of Bountiful Harvests." },
    { key: "gen9", gen: 9, name: "Paldea Paradox", emoji: "🟣", needs: "geeta", champ: "GEETA", regions: ["Paldea"],
      team: [1001, 1002, 1003, 1004, 1007, 1008], face: 1008, boost: 1.58, pts: 36,
      quote: "The Treasures of Ruin break their seals, and the paradox of past and future thunders out of Area Zero. The final trial.",
      winChron: "conquered the Paldea paradox — the last legend fell!", loseChron: "the paradox devoured another future",
      lead: "🟣 Wo-Chien, Chien-Pao, Ting-Lu, Chi-Yu and Koraidon — and MIRAIDON, the Iron Serpent." },
  ];
  window.LEGEND_CHALLENGES = LEGENDS;

  // Unlocked once this trainer has toppled the gating Champion.
  function unlocked(lg, attId) { return Store.leagueWins(attId).indexOf(lg.needs) >= 0; }

  // Cinematic entrance — the ace looms out of the dark, the trial's quote, then
  // the choice to step in.
  function intro(lg, onGo) {
    const src = SP[lg.face] || Store.sprite(lg.face);
    const lay = el("div", { class: "league-intro final legend-intro" }, [
      el("div", { class: "league-intro-inner" }, [
        src ? el("img", { class: "league-intro-ico legend-boss-ico", src: src, alt: "" })
          : el("div", { class: "league-intro-mt" }, lg.emoji),
        el("div", { class: "league-intro-flair" }, "🌌 LEGENDARY CHALLENGE · Gen " + lg.gen),
        el("div", { class: "league-intro-rank" }, "THE " + lg.name.toUpperCase()),
        el("div", { class: "league-intro-name" }, lg.emoji + " 6 v 6"),
        el("div", { class: "league-intro-quote" }, "“" + lg.quote + "”"),
        el("div", { class: "toolbar", style: { justifyContent: "center" } }, [
          el("button", { class: "btn spin-btn", onClick: () => { lay.remove(); onGo(); } }, lg.emoji + " ANSWER THE LEGENDS"),
          el("button", { class: "btn subtle", onClick: () => lay.remove() }, "Not yet"),
        ]),
      ]),
    ]);
    document.body.appendChild(lay);
    sfx("fanfare");
    requestAnimationFrame(() => lay.classList.add("go"));
  }

  function challenge(lg, attId) {
    const size = lg.team.length;
    if (Duel.poolFor(attId).length < size) {
      alert("The " + lg.name + " field " + size + " legends — catch " + size + " of your own first (Safari Zone).");
      return;
    }
    intro(lg, () => {
      Duel.pickParty({ attId: attId, min: size, max: size,
        title: "vs the " + lg.name + " — pick EXACTLY " + size,
        hint: "🌌 A " + size + "v" + size + " legendary battle — the lineup is hidden, and they hit like gods. Bring your very best.",
        onDone: (ids) => {
          Duel.start({ mode: "local", title: "the " + lg.name + " (Gen " + lg.gen + ")",
            legend: { key: lg.key, name: lg.name, pts: lg.pts, icon: lg.emoji, winChron: lg.winChron, loseChron: lg.loseChron },
            a: { units: [{ attId: attId, monIds: ids }] },
            b: { units: [{ npc: "The " + lg.name, ai: true, monIds: lg.team.slice(), boost: lg.boost, vsFace: lg.face || null }] },
            onResult: () => Router.render() });
        } });
    });
  }

  function legendCard(lg, attId) {
    const mineBeat = Store.legendWins(attId).indexOf(lg.key) >= 0;
    const anyBeat = Store.state.attendees.some((a) => Store.legendWins(a.id).indexOf(lg.key) >= 0);
    const beatenBy = Store.state.attendees.filter((a) => Store.legendWins(a.id).indexOf(lg.key) >= 0);
    const open = unlocked(lg, attId);
    const ace = lg.team[lg.team.length - 1];
    const aceSrc = SP[ace] || Store.sprite(ace);
    // Locked: the ace stays a silhouette and the button explains the gate.
    return el("div", { class: "league-stage legend-stage" + (mineBeat ? " cleared" : open ? " next" : " locked") }, [
      el("div", { class: "league-stage-rail" }, [el("span", { class: "league-dot" }, mineBeat ? "✅" : open ? lg.emoji : "🔒")]),
      el("div", { class: "league-stage-card" }, [
        el("div", { class: "league-stage-head" }, [
          el("span", { class: "league-mt" }, lg.emoji),
          el("div", {}, [
            el("div", { class: "gymc-badge" }, lg.name),
            el("div", { class: "gymc-leader" }, "Gen " + lg.gen + " Legendaries & Mythicals · 6v6 (hidden)"),
          ]),
          aceSrc ? el("img", { class: "league-ace" + ((mineBeat || anyBeat) ? " lit" : ""), src: aceSrc, alt: "" }) : null,
        ]),
        open ? el("div", { class: "movie-lead" }, lg.lead) : null,
        beatenBy.length ? el("div", { class: "gymc-holders" }, beatenBy.map((a) =>
          el("span", { class: "gymc-holder", onClick: () => window.Profile && Profile.open(a.id) }, "🌌 " + a.name))) : null,
        open
          ? el("button", { class: "btn " + (mineBeat ? "subtle" : "primary") + " sm", onClick: () => challenge(lg, attId) },
              (mineBeat ? "🔁 Rematch the " : lg.emoji + " Challenge the ") + lg.name + " (6v6)")
          : el("div", { class: "legend-lock" }, "🔒 Beat Champion " + lg.champ + " to summon the " + lg.name + "."),
      ]),
    ]);
  }

  // Trials whose region set intersects the given regions (for the Journey tabs).
  function forRegions(regions) {
    regions = regions || [];
    return LEGENDS.filter((lg) => lg.regions.some((r) => regions.indexOf(r) >= 0));
  }

  function view(root) {
    root.appendChild(el("div", { class: "page-head" }, [
      el("h1", {}, "🌌 Legendary Challenge"),
      el("p", { class: "page-sub" }, "The post-league endgame. Topple a region's Champion and its generation's legendaries rise against you — a full 6v6 against the titans, mascots and mythicals. Clear all nine to become a Legend Keeper." ),
    ]));
    let attId = (window.Sync && Sync.getMe && Sync.getMe()) || (Store.state.attendees[0] || {}).id || "";
    if (!attId) { root.appendChild(el("p", { class: "hint" }, "Add trainers first (Squad page).")); return; }
    const sel = el("select", { class: "in" }, Store.state.attendees.map((a) => el("option", { value: a.id }, a.name + "'s trials")));
    sel.value = attId;
    const host = el("div", { class: "league-journey" });
    sel.addEventListener("change", () => { attId = sel.value; paint(); });
    root.appendChild(sel);
    root.appendChild(host);
    function paint() { host.innerHTML = ""; LEGENDS.forEach((lg) => host.appendChild(legendCard(lg, attId))); }
    paint();
  }

  window.Views = window.Views || {};
  window.Views.legends = view;
  // Shared with the combined Journey view — the trial cards, folded per region.
  window.LegendChallenge = { LEGENDS: LEGENDS, card: legendCard, forRegions: forRegions, unlocked: unlocked };
})();
