/* tournament.js — 🏆 Champions Tournament: a 16-trainer single-elimination
   bracket drawn FRESH each run from every Elite Four member, every Champion,
   plus RED and BLUE. You fight your own 2v2 double battles; the rest of the bracket
   simulates itself — upsets and all — round by round, until a champion is
   crowned. Pure exhibition: no Elo, no belt, glory only. */
(function () {
  const { el, energyIcon } = U;
  const SP = window.DEX_SPRITES || {};
  function sfx(n) { if (window.SFX && SFX[n]) SFX[n](); }

  const ROUND_NAMES = ["Round of 16", "Quarterfinals", "Semifinals", "The Final"];

  // The legend pool: every League ladder trainer (Elite Four → Champions → RED)
  // plus BLUE. `tier` weights the simulation — bigger names win more often, but
  // the random jitter is large enough that upsets absolutely happen.
  function roster() {
    const L = window.LEAGUE_STAGES || [];
    const tierOf = (r) => r === "Top Champion" ? 4 : r === "???" ? 4 : r === "Champion" ? 3 : r === "Champion Cup" ? 2 : 1;
    const pool = L.map((s) => ({
      name: s.name, title: s.key === "red" ? "Mt. Silver" : s.rank, type: s.type,
      team: s.team.slice(), tier: tierOf(s.rank),
    }));
    // (BLUE now sits in the League ladder itself — Kanto's Gen 1 Champion.)
    // Famous canon trainers — Giovanni, Silver, N, and the rest — join the draw.
    (window.CANON_TRAINERS || []).forEach((t) => pool.push({ name: t.name, title: t.title, type: t.type, team: t.team.slice(), tier: t.tier }));
    return pool;
  }

  // ---- tournament state (in-memory; each run is a fresh draw) ----
  let T = null;

  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  function draw(attId, team) {
    const a = Store.attendee(attId);
    const me = { player: true, attId: attId, name: (a && a.name) || attId, tier: 2.6,
      face: (team && team[0]) || (a && a.favoriteId) || null };
    const pool = shuffle(roster()).slice(0, 15);
    const slots = shuffle([me].concat(pool));
    const round0 = [];
    for (let i = 0; i < 16; i += 2) round0.push({ a: slots[i], b: slots[i + 1], winner: null });
    T = { attId: attId, team: (team || []).slice(), rounds: [round0], roundIdx: 0,
      over: false, eliminated: false, playerOut: -1, championName: "" };
    advance();
  }

  // A single non-player match's outcome: tier + big jitter → weighted upsets.
  function simWinner(x, y) {
    const px = x.tier + Math.random() * 3.2, py = y.tier + Math.random() * 3.2;
    return px >= py ? x : y;
  }

  // Walk the bracket forward: simulate every non-player match of each round,
  // pausing at the player's live match. Once the player is out, simulate the
  // whole rest of the bracket to crown a champion.
  function advance() {
    while (true) {
      const round = T.rounds[T.roundIdx];
      round.forEach((m) => {
        if (m.winner) return;
        const hasPlayer = m.a.player || m.b.player;
        if (hasPlayer && !T.eliminated) return;            // wait for the player to fight
        m.winner = hasPlayer ? (m.a.player ? m.b : m.a) : simWinner(m.a, m.b);
      });
      if (round.some((m) => !m.winner)) return;            // player's live match still pending
      const winners = round.map((m) => m.winner);
      if (winners.length === 1) {
        T.over = true;
        T.championName = winners[0].player ? (T.rounds && (Store.attendee(T.attId) || {}).name) || "You" : winners[0].name;
        T.playerWon = !!winners[0].player;
        // 🏆 enshrine the championship (once) for Battle Honors + the ceremony.
        if (T.playerWon && !T.recorded) {
          T.recorded = true;
          try { Store.update((s) => { s.tourneyWins = s.tourneyWins || {}; s.tourneyWins[T.attId] = (s.tourneyWins[T.attId] || 0) + 1; }); } catch (_) {}
        }
        return;
      }
      const next = [];
      for (let i = 0; i < winners.length; i += 2) next.push({ a: winners[i], b: winners[i + 1], winner: null });
      T.rounds.push(next); T.roundIdx++;
    }
  }

  function playerMatchIn(round) {
    return round.find((m) => (m.a.player || m.b.player) && !m.winner);
  }

  function battle(match) {
    const me = match.a.player ? match.a : match.b;
    const opp = match.a.player ? match.b : match.a;
    const size = 4;   // 2v2 double battle → pick 4 of your locked squad of 6
    const oppTeam = opp.team.slice(0, size);
    // Scouting report: reveal the four the opponent is bringing so you can
    // counter-pick your 4 of 6.
    const scout = el("div", { class: "trn-scout" }, [
      el("div", { class: "trn-scout-lab" }, "🔎 " + opp.title + " " + opp.name + " brings:"),
      el("div", { class: "trn-scout-row" }, oppTeam.map((id) => {
        const s = SP[id] || Store.sprite(id);
        return s ? el("img", { class: "trn-scout-mon", src: s, alt: "" }) : null;
      })),
    ]);
    Duel.pickParty({ attId: me.attId, min: size, max: size, pool: T.team, preview: scout,
      title: "vs " + opp.title + " " + opp.name + " — pick 4 of your 6",
      hint: "🏆 Champions Cup — 2 v 2 DOUBLE battle. Choose 4 of your six to counter them (first two lead, next two reserve). Win to advance; lose and you're out.",
      onDone: (ids) => {
        Duel.start({ mode: "local", title: "the Champions Cup",
          tournament: { foe: opp.title + " " + opp.name },
          a: { shared: true, units: [{ attId: me.attId, monIds: ids }, { attId: me.attId, monIds: ids }] },
          b: { shared: true, units: [
            { npc: opp.name, ai: true, monIds: oppTeam, boost: 1.15 },
            { npc: opp.name, ai: true, monIds: oppTeam, boost: 1.15 } ] },
          onResult: (winSide) => {
            const won = winSide === "a";
            match.winner = won ? me : opp;
            if (!won) { T.eliminated = true; T.playerOut = T.roundIdx; }
            advance();
            Router.render();
          } });
      } });
  }

  // ---- rendering ----
  function face(c) {
    const id = c.player ? c.face : c.team[c.team.length - 1];
    const src = id ? (SP[id] || Store.sprite(id)) : "";
    return src ? el("img", { class: "trn-face", src: src, alt: "" })
      : el("span", { class: "trn-face ball" }, c.player ? "🧑" : "◓");
  }

  function competitor(c, m) {
    const isWinner = m.winner === c;
    const isLoser = m.winner && m.winner !== c;
    return el("div", { class: "trn-comp" + (c.player ? " you" : "") + (isWinner ? " win" : "") + (isLoser ? " out" : "") }, [
      face(c),
      el("div", { class: "trn-comp-txt" }, [
        el("div", { class: "trn-name" }, c.player ? (c.name + " (you)") : c.name),
        el("div", { class: "trn-title" }, c.player ? "Challenger" : c.title),
      ]),
      isWinner ? el("span", { class: "trn-check" }, "✓") : null,
    ]);
  }

  function matchCard(m, live) {
    const you = m.a.player || m.b.player;
    return el("div", { class: "trn-match" + (live ? " live" : "") + (you ? " mine" : "") }, [
      competitor(m.a, m),
      el("div", { class: "trn-vs" }, "vs"),
      competitor(m.b, m),
      live ? el("button", { class: "btn primary sm trn-go", onClick: () => battle(m) }, "⚔ Battle (2v2)") : null,
    ]);
  }

  function bracketView(host) {
    const live = !T.over ? playerMatchIn(T.rounds[T.roundIdx]) : null;

    if (T.over) {
      host.appendChild(el("div", { class: "trn-crown" }, [
        el("div", { class: "trn-crown-ico" }, T.playerWon ? "🎉" : "🏆"),
        el("div", { class: "trn-crown-rank" }, T.playerWon ? "TOURNAMENT CHAMPION" : "TOURNAMENT OVER"),
        el("div", { class: "trn-crown-name" }, T.playerWon ? T.championName + " wins it all!" : "🏆 " + T.championName + " is the champion"),
        T.playerWon ? null : el("div", { class: "trn-crown-sub" },
          T.playerOut >= 0 ? "You went out in the " + ROUND_NAMES[T.playerOut] + ". Draw again for another shot." : ""),
      ]));
    } else if (live) {
      const opp = live.a.player ? live.b : live.a;
      host.appendChild(el("div", { class: "trn-now" }, "⚔ Your " + ROUND_NAMES[T.roundIdx] + " match — vs " + opp.title + " " + opp.name + "!"));
    }

    T.rounds.forEach((round, ri) => {
      host.appendChild(el("h2", { class: "section-title" }, roundLabel(ri) ));
      host.appendChild(el("div", { class: "trn-round" }, round.map((m) => matchCard(m, m === live))));
    });
  }
  function roundLabel(ri) {
    const total = 16 >> ri;
    const nm = ROUND_NAMES[ri] || ("Round " + (ri + 1));
    return nm + (total > 2 ? " · " + total + " left" : "");
  }

  // 🧢 vs POKÉMON MASTER ASH KETCHUM — the reward past every reward. His
  // Masters Eight team, ace closing, and a world-champion script: Gengar
  // GIGANTAMAXES, Lucario and Charizard MEGA EVOLVE, and Pikachu closes
  // wreathed in Z-Power. He alone ignores the one-spectacle rule — the
  // player still gets just one. Recorded on the league ledger (key "ash"),
  // enshrined in the Hall of Fame.
  function battleAsh(attId) {
    if (Duel.poolFor(attId).length < 6) { alert("Bring SIX of your own for this one — the Master fields his full team."); return; }
    const lay = el("div", { class: "league-intro final" }, [
      el("div", { class: "league-intro-inner" }, [
        el("div", { class: "league-intro-mt" }, "🧢"),
        el("div", { class: "league-intro-flair" }, "THE FINAL CHALLENGE"),
        el("div", { class: "league-intro-name" }, "POKÉMON MASTER ASH KETCHUM"),
        el("div", { class: "league-intro-quote" },
          "The boy from Pallet Town who never stopped walking. Nine regions, every league, the Masters Eight crown — and one last battle before the sun. His whole team transforms: Gigantamax Gengar, Mega Lucario, Mega Charizard… and Pikachu, wreathed in Z-Power, closes."),
        el("div", { class: "toolbar", style: { justifyContent: "center" } }, [
          el("button", { class: "btn spin-btn", onClick: () => { lay.remove(); pick(); } }, "⚡ I'm ready"),
          el("button", { class: "btn subtle", onClick: () => lay.remove() }, "Not yet"),
        ]),
      ]),
    ]);
    document.body.appendChild(lay);
    requestAnimationFrame(() => lay.classList.add("go"));
    sfx("fanfare");
    function pick() {
      Duel.pickParty({ attId: attId, min: 6, max: 6,
        title: "vs POKÉMON MASTER ASH — pick your 6",
        hint: "🧢 His full champion team is waiting, and EVERY phase of it transforms. You get ONE spectacle of your own — spend it well.",
        onDone: (ids) => {
          Duel.start({ mode: "local", title: "the Final Challenge",
            env: "bg-dusk",                              // 🌅 fought into the setting sun
            league: { key: "ash", name: "ASH KETCHUM", rank: "Pokémon Master", region: "", pts: 30 },
            a: { units: [{ attId: attId, monIds: ids }] },
            b: { units: [{ npc: "POKÉMON MASTER ASH", ai: true,
              // Sirfetch'd → Dragonite → G-MAX Gengar → MEGA Lucario → MEGA Charizard X → Z-Pikachu
              monIds: [865, 149, 94, 448, 6, 25],
              boost: 1.5, vsFace: 25,
              gimmicks: [null, null, { g: "dyna", gmax: true }, { g: "mega", megaId: 10059 }, { g: "mega", megaId: 10034 }, { g: "z" }],
              speak: { 5: ["Pikachu — I choose YOU! One more time, buddy!"] },
              ace: { line: "This is it — everything Pikachu and I have, right here, right now!" },
              outro: { lose: "…Wow. That was everything we had — and you took it. The torch is yours now, Champion. Take care of them.",
                       win: "Not yet! That fire you've got — keep feeding it. We'll be waiting, just past the horizon!" } }] },
            onResult: () => Router.render() });
        } });
    }
  }

  function view(root, opts) {
    opts = opts || {};
    // When embedded inside The Journey (region area) we skip our own page title.
    if (!opts.embed) root.appendChild(el("div", { class: "page-head" }, [
      el("h1", {}, "🏆 Champions Tournament"),
      el("p", { class: "page-sub" }, "Sixteen legends — every Elite Four, every Champion, RED and BLUE — drawn fresh each time into one single-elimination bracket. Lock in a squad of SIX for the whole run, then bring 4 of them to each 2v2 double battle once you've scouted your opponent. The rest of the field battles itself; last trainer standing takes the crown." ),
    ]));

    let attId = (window.Sync && Sync.getMe && Sync.getMe()) || (Store.state.attendees[0] || {}).id || "";
    if (!attId) { root.appendChild(el("p", { class: "hint" }, "Add trainers first (Squad page).")); return; }

    // 🧢 THE FINAL CHALLENGE — conquer all nine regions (Top Champion GEETA)
    // AND win this Cup, and a trainer from Pallet Town comes down from the
    // stands: POKÉMON MASTER ASH KETCHUM, fielding the champion team he had
    // before he walked into the sun — and EVERY phase of it transforms.
    (function finalChallenge() {
      const cupWon = ((Store.state.tourneyWins || {})[attId] || 0) > 0;
      const geeta = Store.leagueWins(attId).indexOf("geeta") >= 0;
      const beaten = Store.leagueWins(attId).indexOf("ash") >= 0;
      if (!geeta && !cupWon) return;                 // not even a whisper yet
      if (!(geeta && cupWon)) {                      // half the key → a silhouette in the stands
        root.appendChild(el("div", { class: "ash-card locked" }, [
          el("div", { class: "ash-sil" }, "🧢"),
          el("div", { class: "ash-txt" }, [
            el("b", {}, "Someone is watching from the stands…"),
            el("span", {}, geeta
              ? "Win the Champions Cup, and he'll come down to meet you."
              : "Conquer all nine regions, then win this Cup — and he'll come down to meet you."),
          ]),
        ]));
        return;
      }
      root.appendChild(el("div", { class: "ash-card" + (beaten ? " beaten" : "") }, [
        el("img", { class: "ash-face", src: SP[25] || Store.sprite(25), alt: "" }),
        el("div", { class: "ash-txt" }, [
          el("b", {}, "🧢 POKÉMON MASTER — ASH KETCHUM"),
          el("span", {}, beaten
            ? "The torch is passed — but he'll always come back for one more."
            : "“So YOU'RE the one who conquered every region AND my Cup! I've been waiting my whole journey for a battle like this!”"),
        ]),
        el("button", { class: "btn spin-btn", onClick: () => battleAsh(attId) },
          beaten ? "🔁 One more, buddy" : "⚡ THE FINAL CHALLENGE"),
      ]));
    })();

    // Lock in the 6-mon tournament squad, then build the bracket.
    const enter = (att) => {
      if (Duel.poolFor(att).length < 6) {
        alert("The Champions Cup asks for a squad of SIX — catch a few more in the Safari, then enter.");
        return;
      }
      Duel.pickParty({ attId: att, min: 6, max: 6,
        title: "Your Champions Cup squad — pick 6",
        hint: "🏆 Bring SIX for the ENTIRE tournament. Each 2v2 match you'll choose 4 of these six after scouting your opponent — so pick a versatile squad.",
        onDone: (ids) => { sfx("fanfare"); draw(att, ids); Router.render(); } });
    };

    const bar = el("div", { class: "toolbar" });
    const sel = el("select", { class: "in" }, Store.state.attendees.map((a) => el("option", { value: a.id }, a.name)));
    sel.value = (T && T.attId) || attId;
    const drawBtn = el("button", { class: "btn spin-btn" }, (T ? "🔁 New run (re-pick 6)" : "🎲 Enter — pick your 6"));
    drawBtn.onclick = () => enter(sel.value);
    bar.appendChild(sel); bar.appendChild(drawBtn);
    root.appendChild(bar);

    const host = el("div", { class: "trn-host" });
    root.appendChild(host);

    if (!T) {
      host.appendChild(el("p", { class: "hint" }, "🎲 Pick your challenger, lock in a squad of six, and the bracket of 16 legends is drawn — a new set every time. RED and BLUE are always in the pool."));
      return;
    }
    // Show the locked squad above the bracket.
    if (T.team && T.team.length) {
      host.appendChild(el("div", { class: "trn-squad" }, [
        el("span", { class: "trn-squad-lab" }, "🎒 Your squad:"),
        el("span", { class: "trn-squad-row" }, T.team.map((id) => {
          const s = SP[id] || Store.sprite(id);
          return s ? el("img", { class: "trn-squad-mon", src: s, alt: "" }) : null;
        })),
      ]));
    }
    // If the selected trainer differs from the running bracket, keep showing the
    // running one until they redraw (avoids clobbering a live bracket on nav).
    bracketView(host);
  }

  window.Views = window.Views || {};
  window.Views.tournament = view;
  // Embed the whole Champions Cup (controls + full bracket) inside The Journey.
  window.ChampionsCup = { render: function (host) { view(host, { embed: true }); } };
})();
