/* safari.js — the Pokédex Safari drinking game. Find wild Pokémon (top 251),
   throw a ball, and catch them — rarer/stronger ones are harder but pay out
   more sips to hand out. Catches fill your Pokédex. Build a Team of 6 for the
   Ash Ketchum badge. Casual: one tap per encounter. State in Store.pokedex. */
(function () {
  const { el } = U;
  const DEX = window.DEX || {};
  const SP = window.DEX_SPRITES || {};
  const IDS = Object.keys(DEX).map(Number);
  function sfx(n) { if (window.SFX && SFX[n]) SFX[n](); }

  const TIER_COLOR = { Common: "#8a97a8", Evolved: "#5fbf6a", Strong: "#3aa0e6", Elite: "#7a5aa0", Legendary: "#e6b800" };

  function info(id) {
    const d = DEX[id] || { x: 60 }; const x = d.x, leg = !!d.leg;
    // Forgiving on purpose — you keep throwing until you catch it, so even
    // legendaries land in a few tries. Rarer just means more throws + bigger payout.
    let chance = 1 - x / 500; chance = Math.max(0.34, Math.min(0.9, chance));
    let sips = 1 + Math.round(x / 70); if (leg) sips += 2; sips = Math.min(7, Math.max(1, sips));
    // Flee is rare (and rarest for cool Pokémon, so they stick around).
    let flee = leg ? 0.06 : (x < 90 ? 0.2 : 0.12);
    const tier = leg ? "Legendary" : x >= 200 ? "Elite" : x >= 140 ? "Strong" : x >= 90 ? "Evolved" : "Common";
    return { name: d.n, x: x, leg: leg, chance: chance, sips: sips, flee: flee, tier: tier, color: TIER_COLOR[tier] };
  }

  function weightFor(id) { const d = DEX[id]; let w = 1 / Math.pow(d.x, 1.25); if (d.leg) w *= 0.12; return w; }
  function randomEncounter() {
    let total = 0; const cum = [];
    IDS.forEach((id) => { total += weightFor(id); cum.push([total, id]); });
    const r = Math.random() * total;
    for (let i = 0; i < cum.length; i++) if (r <= cum[i][0]) return cum[i][1];
    return IDS[0];
  }

  function caught(id) { return !!(Store.state.pokedex.caught || {})[id]; }
  function caughtCount() { return Object.keys(Store.state.pokedex.caught || {}).length; }

  function view(root) {
    let current = null;      // current wild encounter id
    let busy = false;
    let status = "";         // encounter status line (e.g. "broke free!")

    root.appendChild(el("div", { class: "page-head" }, [
      el("h1", {}, "🔴 Pokédex Safari"),
      el("p", { class: "page-sub" }, "Find wild Pokémon, catch 'em, hand out sips. Casual — pop in anytime." ),
    ]));

    // ---- stats ----
    const stats = el("div", { class: "safari-stats" });
    function renderStats() {
      const pd = Store.state.pokedex;
      stats.innerHTML = "";
      const stat = (v, l) => el("div", { class: "safari-stat" }, [el("div", { class: "safari-stat-v" }, String(v)), el("div", { class: "safari-stat-l" }, l)]);
      stats.appendChild(stat(caughtCount() + " / 251", "Caught"));
      stats.appendChild(stat("🍺 " + (pd.given || 0), "Sips dealt"));
      stats.appendChild(stat("😵 " + (pd.taken || 0), "Sips taken"));
    }
    root.appendChild(stats);

    // ---- encounter ----
    const enc = el("div", { class: "safari-enc" });
    root.appendChild(enc);

    function renderEncounter() {
      enc.innerHTML = "";
      if (!current) {
        enc.appendChild(el("div", { class: "safari-idle" }, [
          el("div", { class: "safari-grass" }, "🌿🌿🌿"),
          el("button", { class: "btn spin-btn", onClick: findOne }, "🔍 Find a Pokémon"),
        ]));
        return;
      }
      const nfo = info(current);
      const already = caught(current);
      const sprite = SP[current];
      const stage = el("div", { class: "safari-stage" }, [
        sprite ? el("img", { class: "safari-wild", src: sprite, alt: nfo.name }) : el("div", { class: "tc-ball-fallback" }),
        el("div", { class: "safari-ball-throw" }),   // ball animation target
      ]);
      const meta = el("div", { class: "safari-wild-meta" }, [
        el("span", { class: "safari-tier", style: { background: nfo.color } }, nfo.tier),
        el("span", { class: "safari-wild-name" }, "No." + current + " " + nfo.name),
        already ? el("span", { class: "safari-owned" }, "✓ in your Pokédex") : null,
      ]);
      const odds = el("div", { class: "safari-odds" },
        "~" + Math.round(nfo.chance * 100) + "% per throw · keep trying till you catch it · catch = deal " + nfo.sips + " sip" + (nfo.sips > 1 ? "s" : ""));
      const actions = el("div", { class: "safari-actions" }, [
        el("button", { class: "btn primary", onClick: throwBall }, status ? "🔴 Throw again" : "🔴 Throw Poké Ball"),
        el("button", { class: "btn subtle", onClick: () => { current = null; status = ""; renderEncounter(); } }, "Run"),
      ]);
      enc.appendChild(el("div", { class: "safari-card" }, [
        el("div", { class: "safari-appeared" }, status || ("A wild " + nfo.name + " appeared!")),
        stage, meta, odds, actions,
      ]));
    }

    function findOne() {
      current = randomEncounter();
      busy = false; status = "";
      sfx("blip");
      renderEncounter();
    }

    function throwBall() {
      if (busy || !current) return;
      busy = true;
      const nfo = info(current);
      // Resolve: catch > (rare) flee > broke free (keep trying).
      const outcome = Math.random() < nfo.chance ? "catch" : (Math.random() < nfo.flee ? "flee" : "break");
      const wild = enc.querySelector(".safari-wild");
      const ball = enc.querySelector(".safari-ball-throw");
      const actions = enc.querySelector(".safari-actions");
      if (actions) actions.style.visibility = "hidden";
      if (ball) ball.classList.add("go");
      sfx("select");
      if (wild && outcome !== "break") wild.classList.add("caught-anim");
      setTimeout(() => sfx("blip"), 500);
      setTimeout(() => sfx("blip"), 900);
      setTimeout(() => sfx("blip"), 1300);
      setTimeout(() => { resolveThrow(outcome, nfo); }, 1700);
    }

    function resolveThrow(outcome, nfo) {
      const id = current;
      if (outcome === "break") {
        // Stays on the field — throw again. No penalty.
        status = "So close! " + nfo.name + " broke free — throw again!";
        busy = false;
        renderEncounter();
        return;
      }
      if (outcome === "catch") {
        Store.update((s) => {
          s.pokedex.caught = s.pokedex.caught || {};
          const prev = s.pokedex.caught[id];
          s.pokedex.caught[id] = { count: (prev ? prev.count : 0) + 1 };
          s.pokedex.given = (s.pokedex.given || 0) + nfo.sips;
        });
        sfx("win");
        enc.innerHTML = "";
        enc.appendChild(el("div", { class: "safari-card result win" }, [
          el("img", { class: "safari-wild pop", src: SP[id], alt: nfo.name }),
          el("div", { class: "safari-result-msg" }, "Gotcha! " + nfo.name + " was caught!"),
          el("div", { class: "safari-payout" }, "🍺 Hand out " + nfo.sips + " sip" + (nfo.sips > 1 ? "s" : "") + "!"),
          el("div", { class: "safari-actions" }, [el("button", { class: "btn spin-btn", onClick: findOne }, "🔍 Find another")]),
        ]));
      } else { // flee (rare)
        Store.update((s) => { s.pokedex.taken = (s.pokedex.taken || 0) + 1; });
        sfx("error");
        enc.innerHTML = "";
        enc.appendChild(el("div", { class: "safari-card result miss" }, [
          el("img", { class: "safari-wild fled", src: SP[id], alt: nfo.name }),
          el("div", { class: "safari-result-msg" }, nfo.name + " slipped away!"),
          el("div", { class: "safari-payout miss" }, "😅 Take a sip and shake it off." ),
          el("div", { class: "safari-actions" }, [el("button", { class: "btn spin-btn", onClick: findOne }, "🔍 Find another")]),
        ]));
      }
      current = null; busy = false; status = "";
      renderStats(); renderDex(); renderTeam();
    }

    // ---- Team of 6 + Ash badge ----
    const teamHost = el("div", {});
    function inTeam(id) { return (Store.state.pokedex.team || []).indexOf(id) >= 0; }
    function toggleTeam(id) {
      Store.update((s) => {
        s.pokedex.team = s.pokedex.team || [];
        const i = s.pokedex.team.indexOf(id);
        if (i >= 0) s.pokedex.team.splice(i, 1);
        else if (s.pokedex.team.length < 6) s.pokedex.team.push(id);
        else alert("Team is full (6). Remove one first.");
      });
      renderTeam(); renderDex();
    }
    function teamScore() { return (Store.state.pokedex.team || []).reduce((a, id) => a + (DEX[id] ? DEX[id].x : 0), 0); }
    function renderTeam() {
      teamHost.innerHTML = "";
      teamHost.appendChild(el("h2", { class: "section-title" }, "Your Team of 6"));
      const team = Store.state.pokedex.team || [];
      const slots = el("div", { class: "safari-team" });
      for (let i = 0; i < 6; i++) {
        const id = team[i];
        slots.appendChild(id
          ? el("button", { class: "safari-team-slot filled", title: DEX[id].n + " — tap to remove", onClick: () => toggleTeam(id) },
              [el("img", { src: SP[id], alt: DEX[id].n }), el("span", {}, DEX[id].n)])
          : el("div", { class: "safari-team-slot empty" }, "＋"));
      }
      teamHost.appendChild(slots);
      teamHost.appendChild(el("div", { class: "safari-ash" }, [
        el("div", { class: "safari-ash-cap" }, "🧢"),
        el("div", {}, [
          el("div", { class: "safari-ash-title" }, "Ash Ketchum Badge"),
          el("div", { class: "safari-ash-sub" }, "Best Team of 6 at the end of the weekend wins it. Your team score:"),
        ]),
        el("div", { class: "safari-ash-score" }, String(teamScore())),
      ]));
      teamHost.appendChild(el("p", { class: "hint" }, "Tip: tap a caught Pokémon below to add it to your team."));
    }
    root.appendChild(teamHost);

    // ---- Pokédex grid ----
    const dexHost = el("div", {});
    function renderDex() {
      dexHost.innerHTML = "";
      dexHost.appendChild(el("h2", { class: "section-title" }, "Pokédex (" + caughtCount() + " / 251)"));
      const grid = el("div", { class: "safari-dex" });
      IDS.forEach((id) => {
        const got = caught(id);
        const cell = el("div", { class: "safari-dex-cell" + (got ? " got" : "") + (inTeam(id) ? " team" : ""),
          title: got ? (DEX[id].n + (inTeam(id) ? " (in team)" : " — tap for team")) : ("#" + id + " — not caught"),
          onClick: got ? () => toggleTeam(id) : null }, [
          SP[id] ? el("img", { src: SP[id], alt: got ? DEX[id].n : "", loading: "lazy" }) : null,
          el("span", { class: "safari-dex-num" }, "#" + id),
        ]);
        grid.appendChild(cell);
      });
      dexHost.appendChild(grid);
    }
    root.appendChild(dexHost);

    // ---- reset ----
    root.appendChild(el("div", { class: "toolbar" }, [
      el("button", { class: "btn subtle sm", onClick: () => {
        if (confirm("Reset your Pokédex, team, and sip tallies?")) {
          Store.update((s) => { s.pokedex = { caught: {}, team: [], given: 0, taken: 0 }; });
          current = null; renderStats(); renderEncounter(); renderTeam(); renderDex();
        }
      } }, "Reset Pokédex" ),
    ]));

    renderStats(); renderEncounter(); renderTeam(); renderDex();
  }

  window.Views = window.Views || {};
  window.Views.safari = view;
})();
