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
    { key: "mewtwo", name: "MEWTWO", title: "The Genetic Pokémon", film: "Mewtwo Strikes Back",
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
    { key: "collector", name: "LAWRENCE III", title: "The Collector", film: "Pokémon 2000 · The Power of One",
      type: "flying", team: [144, 145, 146, 142, 149, 249], pts: 12, boost: 1.4, icon: "🎐", face: 249,
      quote: "Fire, Ice, Lightning — the titans of the sky are already mine. Only Lugia, guardian of the sea, remains… the jewel of my collection. You? Merely an obstacle to be catalogued.",
      winChron: "freed the legendary birds and grounded THE COLLECTOR's airship!",
      loseChron: "THE COLLECTOR catalogued another trainer",
      lead: "🎐 Articuno, Zapdos, Moltres — then the ancient rarities, and Lugia, the prize." },
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

  function challenge(b, attId) {
    const size = b.team.length;
    const startWith = (ids) => {
      Duel.start({ mode: "local", title: b.name + " — " + b.film,
        movie: { key: b.key, name: b.name, pts: b.pts, icon: b.icon, winChron: b.winChron, loseChron: b.loseChron },
        a: { units: [{ attId: attId, monIds: ids }] },
        b: { units: [{ npc: b.name, ai: true, monIds: b.team.slice(), boost: b.boost, shiny: b.shiny || false, vsFace: b.vsFace || null }] },
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
    return el("div", { class: "league-stage movie-stage" + (mineBeat ? " cleared" : " next") }, [
      el("div", { class: "league-stage-rail" }, [el("span", { class: "league-dot" }, mineBeat ? "✅" : b.icon)]),
      el("div", { class: "league-stage-card" }, [
        el("div", { class: "league-stage-head" }, [
          el("span", { class: "league-mt" }, b.icon),
          el("div", {}, [
            el("div", { class: "gymc-badge" }, b.name),
            el("div", { class: "gymc-leader" }, b.title + " · 🎬 " + b.film + " · team of 6 (hidden)"),
          ]),
          aceSrc ? el("img", { class: "league-ace" + ((mineBeat || anyBeat) ? " lit" : ""), src: aceSrc, alt: "" }) : null,
        ]),
        el("div", { class: "movie-lead" }, b.lead),
        beatenBy.length ? el("div", { class: "gymc-holders" }, beatenBy.map((a) =>
          el("span", { class: "gymc-holder", onClick: () => window.Profile && Profile.open(a.id) }, "🎬 " + a.name))) : null,
        el("button", { class: "btn " + (mineBeat ? "subtle" : "primary") + " sm", onClick: () => challenge(b, attId) },
          (mineBeat ? "🔁 Rematch " : b.icon + " Challenge " + b.name + " ") + "(6v6)"),
      ]),
    ]);
  }

  function view(root) {
    root.appendChild(el("div", { class: "page-head" }, [
      el("h1", {}, "🎬 Movie Legends"),
      el("p", { class: "page-sub" }, "Two villains straight off the big screen. The cloned tyrant of Mewtwo Strikes Back, and the sky-pirate Collector who caged the legendary birds to seize Lugia. Six-on-six, no mercy — beat them for the wall of fame." ),
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
  };
})();
