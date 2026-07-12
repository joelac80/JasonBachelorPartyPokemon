/* movies.js — 🎬 Movie Legends: two cinematic boss battles pulled straight from
   the films. MEWTWO (Mewtwo Strikes Back) fields his cloned army and himself;
   THE COLLECTOR — Lawrence III (Pokémon 2000: The Power of One) — hunts the
   three legendary birds to draw out Lugia. Full 6v6, villain dialog, and a ✅
   on the wall for every trainer who topples them. Pure glory. */
(function () {
  const { el, energyIcon } = U;
  const SP = window.DEX_SPRITES || {};
  function sfx(n) { if (window.SFX && SFX[n]) SFX[n](); }

  // Each boss: a themed final-evolution six, a signature quote, and the ace
  // whose silhouette looms in the card until someone beats them.
  const BOSSES = [
    { key: "mewtwo", name: "MEWTWO", title: "The Genetic Pokémon", film: "Mewtwo Strikes Back", tab: "Johto", needs: "lance", needsName: "LANCE",
      type: "psychic", team: [6, 9, 3, 25, 150], pts: 12, boost: 1.4, icon: "🧬", face: 150,
      // The four movie clones field in their eerie shadow palette (shiny sprites —
      // clone Charizard is jet-black, just like the film); Mewtwo stays himself.
      shiny: [6, 9, 3, 25], vsFace: 150,
      quote: "I was created by humans… to obey them. I have chosen a different destiny. You believe a TRAINED Pokémon can overcome a perfect clone? Come — show me. And despair.",
      winChron: "shattered MEWTWO's cloned army — and the genetic legend itself!",
      loseChron: "MEWTWO proved the clones reign supreme",
      lead: "🧬 His four shadow CLONES — a jet-black Charizard, plus Blastoise, Venusaur and Pikachu — then Mewtwo himself.",
      // 🎬 The film's mirror match: answer the clones with the ORIGINALS —
      // Charizard, Blastoise, Venusaur, Pikachu, and MEW (whom Mewtwo was cloned
      // from). Offered as a ready-made squad you don't need to have caught.
      mirror: { team: [6, 9, 3, 25, 151],
        note: "Answer the clones with the ORIGINALS — Charizard, Blastoise, Venusaur, Pikachu, and MEW, the ancient Pokémon Mewtwo was cloned from." } },
    { key: "collector", name: "LAWRENCE III", title: "The Collector", film: "Pokémon 2000 · The Power of One", tab: "Johto", needs: "lance", needsName: "LANCE",
      type: "flying", team: [144, 145, 146, 249], pts: 12, boost: 1.4, icon: "🎐", face: 249,
      quote: "Fire, Ice, Lightning — the titans of the sky are already mine. Only Lugia, guardian of the sea, remains… the jewel of my collection. You? Merely an obstacle to be catalogued.",
      winChron: "freed the three legendary birds and grounded THE COLLECTOR's airship!",
      loseChron: "THE COLLECTOR catalogued another trainer",
      lead: "🎐 The three caged titans — Articuno, Zapdos, Moltres — and Lugia, guardian of the sea, the prize itself." },
    { key: "entei", name: "ENTEI", title: "The Unown's Guardian", film: "Pokémon 3 · Spell of the Unown", tab: "Johto", needs: "lance", needsName: "LANCE",
      type: "fire", team: [201, 201, 201, 201, 201, 244], glyphs: ["D", "R", "E", "A", "M"], pts: 12, boost: 1.4, icon: "🔥", face: 244,
      quote: "The Unown dreamed me into being, and I am bound to a lonely girl's every wish. You would wake her from this world? Then get past ME — and the living alphabet that conjured me.",
      winChron: "shattered the D-R-E-A-M — the Unown's spell broke and Molly woke at last!",
      loseChron: "ENTEI guarded the dream and turned another dreamer away",
      lead: "🔥 A swarm of Unown spelling D · R · E · A · M — and ENTEI, the beast their spell made real.",
      // Breaking the spell frees the Unown: they begin to roam the Safari Zone.
      unlockUnown: true },
    { key: "marauder", name: "THE IRON-MASKED MARAUDER", title: "Team Rocket's Hunter", film: "Pokémon 4Ever · Voice of the Forest", tab: "Johto", needs: "lance", needsName: "LANCE",
      type: "dark", team: [215, 212, 248, 251], pts: 12, boost: 1.4, icon: "🌲", face: 251, shiny: [251], vsFace: 251,
      quote: "With my Dark Balls, any Pokémon becomes an obedient weapon — even the guardian of the forest. Time itself will serve Team Rocket!",
      winChron: "cracked the Dark Ball and freed CELEBI from the Iron-Masked Marauder!",
      loseChron: "the Iron-Masked Marauder caged another guardian",
      lead: "🌲 Sneasel and Scizor, an armored Tyranitar — and CELEBI, twisted into a Dark Ball shadow of itself." },
    { key: "heroes", name: "ANNIE & OAKLEY", title: "The Rogue Spies", film: "Pokémon Heroes · Latias & Latios", tab: "Hoenn", needs: "steven", needsName: "STEVEN",
      type: "psychic", team: [196, 168, 380, 381], pts: 12, boost: 1.42, icon: "🛶", face: 381,
      quote: "The Soul Dew and the secret of Alto Mare will be ours. Espeon, Ariados — and once we cage the Eon Pokémon, the whole city drowns.",
      winChron: "saved Alto Mare — LATIAS and LATIOS fly free again!",
      loseChron: "Annie & Oakley made off with the Soul Dew",
      lead: "🛶 Espeon and Ariados — then the stolen Eon duo, LATIAS and LATIOS, forced to fight." },
    { key: "wishmaker", name: "BUTLER", title: "The Vengeful Magician", film: "Jirachi · Wish Maker", tab: "Hoenn", needs: "steven", needsName: "STEVEN",
      type: "ghost", team: [282, 262, 356, 383, 385], pts: 12, boost: 1.42, icon: "🌠", face: 385, shiny: [383],
      quote: "A thousand years of sleep, and the Millennium Comet returns. With Jirachi's power I will forge my OWN Groudon — and no one will laugh at my magic again.",
      winChron: "broke BUTLER's false GROUDON and let JIRACHI sleep in peace!",
      loseChron: "BUTLER's creation swallowed another wish",
      lead: "🌠 Gardevoir, Mightyena, Dusclops — then the grotesque FALSE GROUDON, and JIRACHI, wide awake and weaponized." },
    { key: "deoxys", name: "DEOXYS", title: "The DNA Pokémon", film: "Destiny Deoxys", tab: "Hoenn", needs: "steven", needsName: "STEVEN",
      type: "psychic", team: [10001, 10002, 10003, 384, 386], pts: 12, boost: 1.44, icon: "🧬", face: 386,
      quote: "It fell from the stars searching for its friend — and RAYQUAZA rose from the ozone to repel it. Attack. Defense. Speed. Every form, one storm over the city.",
      winChron: "calmed the duel of DEOXYS and RAYQUAZA — every form weathered!",
      loseChron: "DEOXYS shifted forms faster than another challenger could follow",
      lead: "🧬 Deoxys cycling Attack, Defense and Speed forms, RAYQUAZA defending the sky — and the Normal Forme to finish." },
    { key: "aura", name: "THE TREE OF BEGINNING", title: "Aura's Trial", film: "Lucario and the Mystery of Mew", tab: "Sinnoh", needs: "cynthia", needsName: "CYNTHIA",
      type: "fighting", team: [377, 378, 379, 448, 151], pts: 12, boost: 1.44, icon: "🌳", face: 448,
      quote: "The aura is with you… but the Tree's immune guardians know no mercy, and a knight sealed a thousand years still waits for his master. Prove your heart to MEW.",
      winChron: "passed the Tree of Beginning — LUCARIO's aura bowed and MEW danced!",
      loseChron: "the Tree of Beginning rejected another intruder",
      lead: "🌳 The Regi guardians of the Tree — then LUCARIO, knight of the aura, and MEW at the heart of it all." },
    { key: "skywarrior", name: "ZERO", title: "The Reverse World's Captain", film: "Giratina and the Sky Warrior", tab: "Sinnoh", needs: "cynthia", needsName: "CYNTHIA",
      type: "ghost", team: [462, 462, 487, 492], pts: 12, boost: 1.44, icon: "🌫", face: 487,
      quote: "Giratina's power will be MINE, and the Reverse World my kingdom. The gratitude Pokémon can watch its flower field burn from the other side of the mirror.",
      winChron: "grounded ZERO's fleet — GIRATINA returned to the Reverse World and SHAYMIN bloomed!",
      loseChron: "ZERO sailed the Reverse World unchallenged",
      lead: "🌫 Zero's Magnezone escort — then GIRATINA dragged from the Reverse World, and SHAYMIN, the Sky Warrior itself." },
    { key: "victini", name: "DAMON", title: "The Kingdom's Heir", film: "White · Victini and Zekrom", tab: "Unova", needs: "alder", needsName: "ALDER",
      type: "fire", team: [555, 643, 644, 494], pts: 12, boost: 1.46, icon: "🔥", face: 494,
      quote: "For my people I will move the Sword of the Vale itself — and if the Victory Pokémon must power it forever, so be it. Truth and Ideals both answer ME.",
      winChron: "freed VICTINI from the Sword of the Vale — victory at last tastes sweet!",
      loseChron: "DAMON's kingdom rolled on, VICTINI still caged",
      lead: "🔥 Damon's Darmanitan, RESHIRAM and ZEKROM both answering his call — and VICTINI, the caged Victory Pokémon." },
    { key: "genesect", name: "THE GENESECT ARMY", title: "Red Genesect's Swarm", film: "Genesect and the Legend Awakened", tab: "Unova", needs: "alder", needsName: "ALDER",
      type: "bug", team: [649, 649, 649, 649, 649, 10044], pts: 14, boost: 1.48, icon: "🤖", face: 10044,
      quote: "Three hundred million years out of time, the swarm builds its nest in the city's heart — and the strongest Pokémon ever engineered has AWAKENED to meet it.",
      winChron: "grounded the GENESECT ARMY — and out-fought MEGA MEWTWO Y itself!",
      loseChron: "the swarm and the awakened legend proved too much",
      lead: "🤖 Five paleozoic war machines — the Genesect swarm — and MEGA MEWTWO Y, the legend awakened." },
  ];
  window.MOVIE_BOSSES = BOSSES;

  // Cinematic entrance — the film title card, the villain's face out of the
  // dark, the quote, then the choice to step in.
  function bossIntro(b, onGo) {
    const src = SP[b.face] || Store.sprite(b.face);
    const lay = el("div", { class: "league-intro final movie-intro" }, [
      el("div", { class: "league-intro-inner" }, [
        src ? el("img", { class: "league-intro-ico movie-boss-ico", src: src, alt: "" })
          : el("div", { class: "league-intro-mt" }, b.icon),
        el("div", { class: "league-intro-flair" }, "🎬 " + b.film),
        el("div", { class: "league-intro-rank" }, b.title.toUpperCase()),
        el("div", { class: "league-intro-name" }, b.name),
        el("div", { class: "league-intro-quote" }, "“" + b.quote + "”"),
        el("div", { class: "toolbar", style: { justifyContent: "center" } }, [
          el("button", { class: "btn spin-btn", onClick: () => { lay.remove(); onGo(); } }, b.icon + " FACE " + b.name),
          el("button", { class: "btn subtle", onClick: () => lay.remove() }, "Not yet"),
        ]),
      ]),
    ]);
    document.body.appendChild(lay);
    sfx("fanfare");
    requestAnimationFrame(() => lay.classList.add("go"));
  }

  // A ready-made "wield the Originals" choice: take the preset mirror squad (no
  // need to have caught them), or bring your own five.
  function teamChoice(b, onMirror, onOwn) {
    const mons = b.mirror.team.map((id) => {
      const s = SP[id] || Store.sprite(id);
      return s ? el("img", { class: "trn-scout-mon", src: s, alt: "" }) : null;
    });
    const lay = el("div", { class: "league-intro final movie-intro" }, [
      el("div", { class: "league-intro-inner" }, [
        el("div", { class: "league-intro-rank" }, "CHOOSE YOUR TEAM"),
        el("div", { class: "league-intro-name", style: { fontSize: "26px" } }, "Originals vs Clones"),
        el("div", { class: "league-intro-quote" }, b.mirror.note),
        el("div", { class: "trn-scout-row", style: { justifyContent: "center" } }, mons),
        el("div", { class: "toolbar", style: { justifyContent: "center", flexWrap: "wrap" } }, [
          el("button", { class: "btn spin-btn", onClick: () => { lay.remove(); onMirror(); } }, "✨ Wield the Originals (+ MEW)"),
          el("button", { class: "btn primary", onClick: () => { lay.remove(); onOwn(); } }, "🎒 Bring my own " + b.team.length),
          el("button", { class: "btn subtle", onClick: () => lay.remove() }, "↩ Back"),
        ]),
      ]),
    ]);
    document.body.appendChild(lay);
    requestAnimationFrame(() => lay.classList.add("go"));
  }

  // 🧭 Gen Ladder: each film answers only trainers who've beaten its era's
  // Champion (per-boss `needs`, raw league win — same rule as the Legendary
  // Challenges).
  function moviesLocked(b, attId) {
    return !attId || Store.leagueWins(attId).indexOf(b.needs || "lance") < 0;
  }

  function challenge(b, attId) {
    if (moviesLocked(b, attId)) { alert("🔒 The big screen waits — beat Champion " + (b.needsName || "LANCE") + " in The Journey first."); return; }
    const size = b.team.length;
    const startWith = (ids) => {
      Duel.start({ mode: "local", title: b.name + " — " + b.film,
        movie: { key: b.key, name: b.name, pts: b.pts, icon: b.icon, winChron: b.winChron, loseChron: b.loseChron },
        a: { units: [{ attId: attId, monIds: ids }] },
        b: { units: [{ npc: b.name, ai: true, monIds: b.team.slice(), glyphs: b.glyphs || null, boost: b.boost, shiny: b.shiny || false, vsFace: b.vsFace || null }] },
        onResult: () => Router.render() });
    };
    // Bring-your-own path needs a full pool; the preset mirror squad does not.
    const pickOwn = () => {
      if (Duel.poolFor(attId).length < size) {
        alert(b.name + " fields " + size + " Pokémon — catch " + size + " of your own first (Safari Zone), or take the ready-made squad.");
        return;
      }
      Duel.pickParty({ attId: attId, min: size, max: size,
        title: "vs " + b.name + " — pick EXACTLY " + size,
        hint: "🎬 " + b.film + ". A " + size + " v " + size + " boss battle — the lineup is hidden. Bring your very best.",
        onDone: (ids) => startWith(ids) });
    };
    bossIntro(b, () => {
      if (b.mirror) teamChoice(b, () => startWith(b.mirror.team.slice()), pickOwn);
      else pickOwn();
    });
  }

  function bossCard(b, attId) {
    const mineBeat = Store.movieWins(attId).indexOf(b.key) >= 0;
    const anyBeat = Store.state.attendees.some((a) => Store.movieWins(a.id).indexOf(b.key) >= 0);
    const beatenBy = Store.state.attendees.filter((a) => Store.movieWins(a.id).indexOf(b.key) >= 0);
    const ace = b.team[b.team.length - 1];
    const aceSrc = SP[ace] || Store.sprite(ace);
    const n = b.team.length, vs = n + "v" + n;
    const locked = moviesLocked(b, attId);
    return el("div", { class: "league-stage movie-stage" + (mineBeat ? " cleared" : locked ? " locked" : " next") }, [
      el("div", { class: "league-stage-rail" }, [el("span", { class: "league-dot" }, mineBeat ? "✅" : locked ? "🔒" : b.icon)]),
      el("div", { class: "league-stage-card" }, [
        el("div", { class: "league-stage-head" }, [
          el("span", { class: "league-mt" }, b.icon),
          el("div", {}, [
            el("div", { class: "gymc-badge" }, b.name),
            el("div", { class: "gymc-leader" }, b.title + " · 🎬 " + b.film + " · team of " + n + " (hidden)"),
          ]),
          aceSrc ? el("img", { class: "league-ace" + ((mineBeat || anyBeat) ? " lit" : ""), src: aceSrc, alt: "" }) : null,
        ]),
        locked ? null : el("div", { class: "movie-lead" }, b.lead),
        beatenBy.length ? el("div", { class: "gymc-holders" }, beatenBy.map((a) =>
          el("span", { class: "gymc-holder", onClick: () => window.Profile && Profile.open(a.id) }, "🎬 " + a.name))) : null,
        locked
          ? el("div", { class: "legend-lock" }, "🔒 The big screen waits for a Champion — beat " + (b.needsName || "LANCE") + " in The Journey first.")
          : el("button", { class: "btn " + (mineBeat ? "subtle" : "primary") + " sm", onClick: () => challenge(b, attId) },
              (mineBeat ? "🔁 Rematch " : b.icon + " Challenge " + b.name + " ") + "(" + vs + ")"),
      ]),
    ]);
  }

  function view(root) {
    root.appendChild(el("div", { class: "page-head" }, [
      el("h1", {}, "🎬 Movie Legends"),
      el("p", { class: "page-sub" }, "Two villains straight off the big screen. The cloned tyrant of Mewtwo Strikes Back, and the sky-pirate Collector who caged the legendary birds to seize Lugia. No mercy — beat them for the wall of fame." ),
    ]));

    let attId = (window.Sync && Sync.getMe && Sync.getMe()) || (Store.state.attendees[0] || {}).id || "";
    if (!attId) { root.appendChild(el("p", { class: "hint" }, "Add trainers first (Squad page).")); return; }

    const sel = el("select", { class: "in" }, Store.state.attendees.map((a) => el("option", { value: a.id }, a.name + "'s challenge")));
    sel.value = attId;
    const host = el("div", { class: "league-journey" });
    sel.addEventListener("change", () => { attId = sel.value; paint(); });
    root.appendChild(sel);
    root.appendChild(host);

    function paint() {
      host.innerHTML = "";
      BOSSES.forEach((b) => host.appendChild(bossCard(b, attId)));
    }
    paint();
  }

  window.Views = window.Views || {};
  window.Views.movies = view;
  // Shared with the combined Regions view: the boss cards (folded into Kanto).
  window.MovieLegends = {
    BOSSES: BOSSES,
    card: bossCard,
    forRegion: function (tabName) { return BOSSES.filter(function (b) { return (b.tab || "Johto") === tabName; }); },
  };
})();
