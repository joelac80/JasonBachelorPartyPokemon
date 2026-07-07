/* league.js — 👑 The Pokémon League: a cinematic climb. Victory Road's
   badge-checked gate, the four Elite Four chambers in canon order (leaders
   silhouetted until beaten), Champion LANCE's hall, the HALL OF FAME (each
   conqueror's winning team, forever), and — only after a champion is
   crowned — Mt. Silver looming at the top, where RED waits and says
   nothing. Canon Gen 2 teams; even matches; lineups hidden in the balls. */
(function () {
  const { el, energyIcon } = U;
  const SP = window.DEX_SPRITES || {};
  function sfx(n) { if (window.SFX && SFX[n]) SFX[n](); }

  const LEAGUE = [
    { key: "will",  name: "WILL",  rank: "Elite Four", type: "psychic",  team: [178, 124, 103, 80, 178], pts: 6,
      quote: "I have trained my mind to see all that is coming… and I foresee your defeat." },
    { key: "koga",  name: "KOGA",  rank: "Elite Four", type: "poison",   team: [168, 49, 205, 89, 169], pts: 6,
      quote: "A ninja's poison lingers long after the strike. Can you endure it?" },
    { key: "bruno", name: "BRUNO", rank: "Elite Four", type: "fighting", team: [237, 106, 107, 95, 68], pts: 6,
      quote: "We will grind you down with our superior power. Hoo hah!" },
    { key: "karen", name: "KAREN", rank: "Elite Four", type: "dark",     team: [197, 45, 94, 198, 229], pts: 6,
      quote: "Strong Pokémon. Weak Pokémon. That is only the selfish perception of people. Show me YOUR favorites." },
    { key: "lance", name: "LANCE", rank: "Champion",   type: "dragon",   team: [130, 149, 149, 149, 142, 6], pts: 8,
      quote: "I've been waiting for you. I knew you, of all trainers, would make it this far." },
    { key: "red",   name: "RED",   rank: "???",        type: "fire",     team: [25, 196, 143, 3, 6, 9], pts: 10,
      quote: "……" },
  ];
  window.LEAGUE_STAGES = LEAGUE;

  function johtoBadges(attId) {
    let n = 0; for (let i = 0; i < 8; i++) if (Store.gymHolders(i).indexOf(attId) >= 0) n++;
    return n;
  }
  // Why can't this trainer fight stage idx yet? "" = clear to battle.
  function leagueBlocked(attId, idx) {
    const wins = Store.leagueWins(attId);
    if (idx <= 3) {
      if (johtoBadges(attId) < 8) return "The League only admits trainers holding all 8 JOHTO badges (" + johtoBadges(attId) + "/8).";
      if (idx > 0 && wins.indexOf(LEAGUE[idx - 1].key) < 0) return "The Elite Four fall IN ORDER — beat " + LEAGUE[idx - 1].name + " first.";
      return "";
    }
    if (idx === 4) {
      const e4 = ["will", "koga", "bruno", "karen"].every((k) => wins.indexOf(k) >= 0);
      return e4 ? "" : "Champion LANCE only faces trainers who've toppled all four Elite Four.";
    }
    if (wins.indexOf("lance") < 0) return "…the summit is silent. (Beat Champion LANCE first.)";
    if (Store.gymBadgeCount(attId) < 16) return "RED faces only trainers holding ALL 16 badges (" + Store.gymBadgeCount(attId) + "/16).";
    return "";
  }
  window.LeagueGate = { blocked: leagueBlocked, johtoBadges: johtoBadges };

  // Cinematic chamber entrance: doors part, the quote lands, then you choose
  // to step in. RED's chamber is snow and silence.
  function chamberIntro(idx, onGo) {
    const st = LEAGUE[idx];
    const isRed = idx === 5;
    const ico = energyIcon(st.type);
    const lay = el("div", { class: "league-intro" + (isRed ? " red" : "") }, [
      el("div", { class: "league-intro-inner" }, [
        isRed ? el("div", { class: "league-intro-mt" }, "🗻") :
          (ico ? el("img", { class: "league-intro-ico", src: ico, alt: "" }) : null),
        el("div", { class: "league-intro-rank" }, isRed ? "MT. SILVER" : st.rank.toUpperCase()),
        el("div", { class: "league-intro-name" }, isRed ? "…" : st.name),
        el("div", { class: "league-intro-quote" }, "“" + st.quote + "”"),
        el("div", { class: "toolbar", style: { justifyContent: "center" } }, [
          el("button", { class: "btn spin-btn", onClick: () => { lay.remove(); onGo(); } }, isRed ? "🗻 STEP FORWARD" : "⚔ STEP INTO THE CHAMBER"),
          el("button", { class: "btn subtle", onClick: () => lay.remove() }, "Not yet"),
        ]),
      ]),
    ]);
    document.body.appendChild(lay);
    sfx(isRed ? "error" : "fanfare");
    requestAnimationFrame(() => lay.classList.add("go"));
  }

  function challengeLeague(idx, attId) {
    const st = LEAGUE[idx];
    const size = st.team.length;
    const why = leagueBlocked(attId, idx);
    if (why) { alert(why); return; }
    if (Duel.poolFor(attId).length < size) { alert(st.name + " runs " + size + " Pokémon — you need " + size + " of your own."); return; }
    chamberIntro(idx, () => {
      Duel.pickParty({ attId: attId, min: size, max: size,
        title: "vs " + (idx === 5 ? "RED" : st.rank + " " + st.name) + " — pick EXACTLY " + size,
        hint: idx === 5 ? "The silent trainer. " + size + " vs " + size + "." : "Even match: " + size + " vs " + size + ". The lineup is hidden.",
        onDone: (ids) => {
          Duel.start({ mode: "local",
            title: idx === 5 ? "Mt. Silver" : "the Pokémon League",
            league: { idx: idx, key: st.key, name: st.name, rank: st.rank, pts: st.pts },
            a: { units: [{ attId: attId, monIds: ids }] },
            b: { units: [{ npc: idx === 5 ? "RED" : st.rank.toUpperCase() + " " + st.name, ai: true, monIds: st.team.slice() }] },
            onResult: () => Router.render() });
        } });
    });
  }

  // The leader's ace, silhouetted until this stage has been beaten by anyone.
  function aceSprite(idx, beaten) {
    const st = LEAGUE[idx];
    const ace = st.team[st.team.length - 1];
    const src = SP[ace] || Store.sprite(ace);
    if (!src) return null;
    return el("img", { class: "league-ace" + (beaten ? " lit" : ""), src: src, alt: "" });
  }

  function view(root) {
    root.appendChild(el("div", { class: "page-head" }, [
      el("h1", {}, "👑 Pokémon League"),
      el("p", { class: "page-sub" }, "Victory Road ends here. Four Elite chambers, one Champion — and the stories whisper of a silent trainer beyond." ),
    ]));

    // whose journey are we looking at?
    let attId = (window.Sync && Sync.getMe && Sync.getMe()) || (Store.state.attendees[0] || {}).id || "";
    const sel = el("select", { class: "in" }, Store.state.attendees.map((a) => el("option", { value: a.id }, a.name + "'s journey")));
    sel.value = attId;
    const host = el("div", {});
    sel.addEventListener("change", () => { attId = sel.value; paint(); });
    root.appendChild(sel);
    root.appendChild(host);

    function stageNode(idx) {
      const st = LEAGUE[idx];
      const isRed = idx === 5;
      const wins = Store.leagueWins(attId);
      const mineBeat = wins.indexOf(st.key) >= 0;
      const anyBeat = Store.state.attendees.some((a) => Store.leagueWins(a.id).indexOf(st.key) >= 0);
      const blocked = leagueBlocked(attId, idx);
      const isNext = !mineBeat && !blocked;
      const ico = energyIcon(st.type);
      const beatenBy = Store.state.attendees.filter((a) => Store.leagueWins(a.id).indexOf(st.key) >= 0);
      return el("div", { class: "league-stage" + (mineBeat ? " cleared" : "") + (isNext ? " next" : "") + (isRed ? " red" : "") + (!mineBeat && blocked ? " locked" : "") }, [
        el("div", { class: "league-stage-rail" }, [el("span", { class: "league-dot" }, mineBeat ? "✅" : (isNext ? "⚔" : "🔒"))]),
        el("div", { class: "league-stage-card" }, [
          el("div", { class: "league-stage-head" }, [
            isRed ? el("span", { class: "league-mt" }, "🗻") : (ico ? el("img", { class: "gymc-ico", src: ico, alt: "" }) : null),
            el("div", {}, [
              el("div", { class: "gymc-badge" }, isRed ? (anyBeat || mineBeat ? "RED" : "???") : st.rank + " " + st.name),
              el("div", { class: "gymc-leader" }, (isRed ? "the summit" : "chamber " + (idx + 1)) + " · team of " + st.team.length + " (hidden)"),
            ]),
            aceSprite(idx, mineBeat || anyBeat),
          ]),
          isNext ? el("div", { class: "league-now" }, "⚔ YOUR NEXT CHALLENGE") : null,
          (!mineBeat && blocked) ? el("div", { class: "league-lock" }, blocked) : null,
          beatenBy.length ? el("div", { class: "gymc-holders" }, beatenBy.map((a) =>
            el("span", { class: "gymc-holder", onClick: () => window.Profile && Profile.open(a.id) }, (isRed ? "🗻 " : "👑 ") + a.name))) : null,
          (!mineBeat) ? el("button", { class: "btn " + (isNext ? "primary" : "subtle") + " sm", onClick: () => challengeLeague(idx, attId) },
            (isRed ? "🗻 Face what waits" : "⚔ Challenge " + st.name) + " (" + st.team.length + "v" + st.team.length + ")") :
            el("button", { class: "btn subtle sm", onClick: () => challengeLeague(idx, attId) }, "🔁 Rematch (glory only)"),
        ]),
      ]);
    }

    function paint() {
      host.innerHTML = "";
      const jb = johtoBadges(attId), all = Store.gymBadgeCount(attId);
      const journey = el("div", { class: "league-journey" });
      // Victory Road gate
      journey.appendChild(el("div", { class: "league-stage gate" + (jb >= 8 ? " cleared" : " locked") }, [
        el("div", { class: "league-stage-rail" }, [el("span", { class: "league-dot" }, jb >= 8 ? "✅" : "🔒")]),
        el("div", { class: "league-stage-card" }, [
          el("div", { class: "gymc-badge" }, "🚪 Victory Road Gate"),
          el("div", { class: "gymc-leader" }, jb >= 8
            ? "The guard nods. All 8 Johto badges — the gate stands open."
            : "“You'll need all 8 JOHTO badges to pass.” (" + jb + "/8 — earn them in the Gym Circuit)"),
          all >= 16 ? el("div", { class: "league-now" }, "🏟 ALL 16 BADGES — even the summit would accept you.") : null,
        ]),
      ]));
      for (let i = 0; i < 5; i++) journey.appendChild(stageNode(i));
      // Mt. Silver only exists once a Champion has been crowned
      const anyLance = Store.state.attendees.some((a) => Store.leagueWins(a.id).indexOf("lance") >= 0);
      if (anyLance) journey.appendChild(stageNode(5));
      else journey.appendChild(el("div", { class: "league-stage locked fog" }, [
        el("div", { class: "league-stage-rail" }, [el("span", { class: "league-dot" }, "🌫")]),
        el("div", { class: "league-stage-card" }, [
          el("div", { class: "gymc-badge" }, "🌫 ﹖﹖﹖"),
          el("div", { class: "gymc-leader" }, "Beyond the Champion's hall, clouds hide a mountain…"),
        ]),
      ]));
      host.appendChild(journey);

      // 🏛 HALL OF FAME — every Champion, with the team that did it.
      const hof = (Store.state.hof || []).slice();
      if (hof.length) {
        host.appendChild(el("h2", { class: "section-title" }, "🏛 Hall of Fame"));
        host.appendChild(el("div", { class: "hof-list" }, hof.map((h) => {
          const a = Store.attendee(h.attId);
          const beatRed = Store.leagueWins(h.attId).indexOf("red") >= 0;
          return el("div", { class: "hof-row" }, [
            el("div", { class: "hof-name" }, (beatRed ? "🗻 " : "👑 ") + ((a && a.name) || h.attId) +
              (beatRed ? " — conquered Mt. Silver" : " — Champion")),
            el("div", { class: "hof-team" }, (h.party || []).map((id) => {
              const shiny = a && Store.state.pokedex.trainers[a.id] && Store.state.pokedex.trainers[a.id].caught[id] && Store.state.pokedex.trainers[a.id].caught[id].shiny;
              const src = (shiny && window.DEX_SPRITES_SHINY && DEX_SPRITES_SHINY[id]) || SP[id] || Store.sprite(id);
              return src ? el("img", { class: "hof-mon", src: src, alt: "" }) : null;
            })),
          ]);
        })));
      }
    }
    paint();
  }

  window.Views = window.Views || {};
  window.Views.league = view;
})();
