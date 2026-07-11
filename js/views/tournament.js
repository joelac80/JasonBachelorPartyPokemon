/* tournament.js — 🏆 Champions Tournament: a 16-trainer single-elimination
   bracket drawn FRESH each run from every Elite Four member, every Champion,
   plus RED and BLUE. You fight your own matches (3v3); the rest of the bracket
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
    pool.push({ name: "BLUE", title: "Rival Champion", type: "normal", team: [18, 65, 464, 130, 103, 59], tier: 3 });
    return pool;
  }

  // ---- tournament state (in-memory; each run is a fresh draw) ----
  let T = null;

  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  function draw(attId) {
    const a = Store.attendee(attId);
    const me = { player: true, attId: attId, name: (a && a.name) || attId, tier: 2.6,
      face: (a && a.favoriteId) ? a.favoriteId : null };
    const pool = shuffle(roster()).slice(0, 15);
    const slots = shuffle([me].concat(pool));
    const round0 = [];
    for (let i = 0; i < 16; i += 2) round0.push({ a: slots[i], b: slots[i + 1], winner: null });
    T = { attId: attId, rounds: [round0], roundIdx: 0, over: false, eliminated: false, playerOut: -1, championName: "" };
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
    const size = 3;
    if (Duel.poolFor(me.attId).length < size) {
      alert("The Champions Tournament is 3 v 3 — you need at least 3 of your own Pokémon (catch more in the Safari!).");
      return;
    }
    Duel.pickParty({ attId: me.attId, min: size, max: size,
      title: "vs " + opp.title + " " + opp.name + " — pick 3",
      hint: "🏆 Champions Tournament — 3 v 3. Win to advance; lose and you're out.",
      onDone: (ids) => {
        Duel.start({ mode: "local", title: "the Champions Tournament",
          tournament: { foe: opp.title + " " + opp.name },
          a: { units: [{ attId: me.attId, monIds: ids }] },
          b: { units: [{ npc: opp.name, ai: true, monIds: opp.team.slice(0, size), boost: 1.15 }] },
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
      live ? el("button", { class: "btn primary sm trn-go", onClick: () => battle(m) }, "⚔ Battle (3v3)") : null,
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

  function view(root) {
    root.appendChild(el("div", { class: "page-head" }, [
      el("h1", {}, "🏆 Champions Tournament"),
      el("p", { class: "page-sub" }, "Sixteen legends — every Elite Four, every Champion, RED and BLUE — drawn fresh each time into one single-elimination bracket. You fight your own 3v3 matches; the rest of the field battles itself. Last trainer standing takes the crown." ),
    ]));

    let attId = (window.Sync && Sync.getMe && Sync.getMe()) || (Store.state.attendees[0] || {}).id || "";
    if (!attId) { root.appendChild(el("p", { class: "hint" }, "Add trainers first (Squad page).")); return; }

    const bar = el("div", { class: "toolbar" });
    const sel = el("select", { class: "in" }, Store.state.attendees.map((a) => el("option", { value: a.id }, a.name)));
    sel.value = (T && T.attId) || attId;
    const drawBtn = el("button", { class: "btn spin-btn" }, (T ? "🔁 Redraw bracket" : "🎲 Draw the bracket"));
    drawBtn.onclick = () => { sfx("fanfare"); draw(sel.value); Router.render(); };
    bar.appendChild(sel); bar.appendChild(drawBtn);
    root.appendChild(bar);

    const host = el("div", { class: "trn-host" });
    root.appendChild(host);

    if (!T) {
      host.appendChild(el("p", { class: "hint" }, "🎲 Pick your challenger and draw the bracket — a new set of 16 legends every time. RED and BLUE are always in the pool."));
      return;
    }
    // If the selected trainer differs from the running bracket, keep showing the
    // running one until they redraw (avoids clobbering a live bracket on nav).
    bracketView(host);
  }

  window.Views = window.Views || {};
  window.Views.tournament = view;
})();
