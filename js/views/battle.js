/* battle.js (view) — the Battle Arena. Compose any matchup (1v1 or 2v2),
   tag it with an event, and fight it out with the shared Battle engine.
   Independent of the bracket — though the bracket uses the same engine. */
(function () {
  const { el, uid } = U;

  function thumb(a) {
    const f = Store.currentForm(a);
    const src = f.id ? Store.sprite(f.id) : "";
    return src ? el("img", { class: "sl-thumb", src: src, alt: "" }) : el("span", { class: "draft-thumb-ball" });
  }

  // Modal to add a fighter (squad member, team, or custom) into a side.
  function pickInto(side, redraw) {
    if (side.length >= 2) { alert("Two per side max (that's a 2v2)."); return; }
    const custom = el("input", { class: "in", placeholder: "Custom name…" });
    const add = (name) => { if (name && side.length < 2) { side.push(name); ref.close(); redraw(); } };

    const squad = el("div", { class: "sl-vote-grid" }, Store.state.attendees.map((a) =>
      el("button", { class: "sl-vote-pick", onClick: () => add(a.name) }, [thumb(a), el("span", { class: "sl-vote-name" }, a.name)])));
    const teams = el("div", { class: "chip-row" }, Store.state.teams.map((t) =>
      el("button", { class: "chip", style: { borderColor: t.color }, onClick: () => add(t.name) }, [U.teamIcon(t), " " + t.name])));

    const body = el("div", { class: "modal-form" }, [
      el("div", { class: "field" }, [el("span", {}, "Squad"), squad]),
      el("div", { class: "field" }, [el("span", {}, "Teams"), teams]),
      el("div", { class: "field" }, [el("span", {}, "Custom"),
        el("div", { class: "brk-add-row" }, [custom, el("button", { class: "btn sm", onClick: () => add(custom.value.trim()) }, "Add")])]),
    ]);
    const ref = Modal.open("Add a fighter", body, null, {});
  }

  function sideCard(title, cls, side, redraw) {
    const chips = el("div", { class: "arena-chips" });
    if (!side.length) chips.appendChild(el("p", { class: "hint" }, "No fighter yet."));
    side.forEach((n, i) => chips.appendChild(el("span", { class: "brk-name-chip" }, [
      n, el("button", { class: "x", onClick: () => { side.splice(i, 1); redraw(); } }, "×"),
    ])));
    return el("div", { class: "arena-side " + cls }, [
      el("div", { class: "arena-side-title" }, title),
      chips,
      side.length < 2
        ? el("button", { class: "btn subtle sm", onClick: () => pickInto(side, redraw) }, "＋ Add fighter")
        : el("span", { class: "hint" }, "2v2 full"),
    ]);
  }

  // Ordered Pokémon list for a trainer's duel picker: team of 6 first, then
  // the rest of their caught dex. Everyone at least has their partner.
  function duelPool(attId) {
    const t = (Store.state.pokedex.trainers || {})[attId] || {};
    const ids = (t.team || []).filter(Boolean).slice();
    Object.keys(t.caught || {}).map(Number).forEach((id) => { if (ids.indexOf(id) < 0) ids.push(id); });
    if (!ids.length) { const a = Store.attendee(attId); if (a && a.favoriteId) ids.push(a.favoriteId); }
    return ids;
  }

  function view(root) {
    const sideA = [], sideB = [];
    let eventLabel = "";

    root.appendChild(el("div", { class: "page-head" }, [
      el("h1", {}, "⚔️ Battle Arena"),
      el("p", { class: "page-sub" }, "Fight a real turn-based duel with your caught Pokémon, or call a quick winner for any event matchup."),
    ]));

    // ---- Duel Mode: real turn-based battles at Lv50 ----
    const duel = { a: { attId: "", monId: 0 }, b: { attId: "", monId: 0 } };
    const duelHost = el("div", { class: "duel-setup" });
    root.appendChild(el("h2", { class: "section-title" }, "🎮 Pokémon Duel"));
    root.appendChild(el("p", { class: "hint" },
      "Turn-based, every Pokémon at Lv50. 🧪 Potion = 3 sips to heal · 🍺 Liquid Courage = finish half your drink for a guaranteed crit."));
    root.appendChild(duelHost);

    function duelSide(side, label, cls) {
      const d = duel[side];
      const sel = el("select", { class: "in" }, [el("option", { value: "" }, "Pick a trainer…")]
        .concat(Store.state.attendees.map((a) => el("option", { value: a.id }, a.name))));
      sel.value = d.attId;
      sel.addEventListener("change", () => { d.attId = sel.value; d.monId = duelPool(d.attId)[0] || 0; renderDuel(); });
      const kids = [el("div", { class: "arena-side-title" }, label), sel];
      if (d.attId) {
        const pool = duelPool(d.attId);
        kids.push(el("div", { class: "duel-pick-row" }, pool.map((id) => {
          const st = window.Duel ? Duel.statsFor(id) : { name: "#" + id, hpMax: 0 };
          const src = (window.DEX_SPRITES && DEX_SPRITES[id]) || Store.sprite(id);
          return el("button", { class: "duel-pick" + (d.monId === id ? " on" : ""), title: st.name,
            onClick: () => { d.monId = id; renderDuel(); } }, [
            src ? el("img", { src: src, alt: st.name }) : el("span", { class: "draft-thumb-ball" }),
          ]);
        })));
        if (d.monId && window.Duel) {
          const st = Duel.statsFor(d.monId);
          kids.push(el("div", { class: "duel-pick-meta" },
            st.name + " · Lv50 · " + st.hpMax + " HP · " + st.moves.map((m) => m.name).join(" / ")));
        }
      }
      return el("div", { class: "arena-side " + cls }, kids);
    }

    function renderDuel() {
      duelHost.innerHTML = "";
      duelHost.appendChild(el("div", { class: "arena-grid" }, [
        duelSide("a", "🔵 Blue Corner", "blue"),
        el("div", { class: "arena-vs" }, "VS"),
        duelSide("b", "🔴 Red Corner", "red"),
      ]));
      duelHost.appendChild(el("div", { class: "toolbar", style: { justifyContent: "center" } }, [
        el("button", { class: "btn spin-btn", onClick: () => {
          if (!duel.a.attId || !duel.b.attId || !duel.a.monId || !duel.b.monId) { alert("Pick both trainers and their Pokémon first."); return; }
          if (!window.Duel) return;
          Duel.start({ a: duel.a, b: duel.b, title: (eventLabel || "").trim() || "Duel",
            onResult: () => { renderLog(); } });
        } }, "🎮 START DUEL"),
      ]));
    }
    renderDuel();

    root.appendChild(el("h2", { class: "section-title" }, "📣 Quick Call (referee mode)"));
    root.appendChild(el("p", { class: "hint" }, "For real-world events — set the matchup, then tap who won."));

    // ---- Who's here now (live sync): challenge a present trainer's phone ----
    if (window.Sync) {
      const hereHost = el("div", {});
      root.appendChild(hereHost);
      const renderHere = function (list) {
        hereHost.innerHTML = "";
        if (!Sync.isLive()) return;                       // only when a room is joined
        const me = Sync.myClientId();
        const others = (list || []).filter((p) => p.clientId !== me && p.attId);
        const unsigned = (list || []).filter((p) => p.clientId !== me && !p.attId).length;
        hereHost.appendChild(el("h2", { class: "section-title" }, "🟢 Trainers here now"));
        if (!others.length) {
          hereHost.appendChild(el("p", { class: "hint" }, unsigned
            ? "🔌 " + unsigned + " device" + (unsigned > 1 ? "s are" : " is") + " in the room but hasn't picked a trainer — Settings → “You are”."
            : "No one else is signed in yet — get the crew to open the app, join the room, and pick their trainer in Settings."));
          return;
        }
        if (unsigned) hereHost.appendChild(el("p", { class: "hint" }, "🔌 +" + unsigned + " device" + (unsigned > 1 ? "s" : "") + " connected without a trainer picked."));
        hereHost.appendChild(el("div", { class: "here-grid" }, others.map((p) => {
          const a = Store.attendee(p.attId);
          const src = a ? Store.sprite(Store.currentForm(a).id) : "";
          const btn = el("button", { class: "btn primary sm" }, "⚔ Challenge");
          btn.addEventListener("click", () => {
            Sync.sendChallenge(p.clientId, p.attId, p.name || (a && a.name) || "Trainer", (eventLabel || "").trim());
            btn.disabled = true; btn.textContent = "Waiting…";
            setTimeout(() => { if (btn.isConnected) { btn.disabled = false; btn.textContent = "⚔ Challenge"; } }, 8000);
          });
          return el("div", { class: "here-card" }, [
            src ? el("img", { class: "here-sprite", src: src, alt: "" }) : el("span", { class: "draft-thumb-ball" }),
            el("div", { class: "here-name" }, p.name || (a && a.name) || "Trainer"),
            btn,
          ]);
        })));
      };
      Sync.onPresence(renderHere);
    }

    // Event label + quick picks from Victory Road events.
    const evIn = el("input", { class: "in", placeholder: "Event (e.g. Beer Pong)", value: "" });
    evIn.addEventListener("input", () => { eventLabel = evIn.value; });
    const quick = el("div", { class: "chip-row" }, (Store.state.events || []).map((e) =>
      el("button", { class: "chip", onClick: () => { eventLabel = e.name; evIn.value = e.name; } }, (e.emoji || "") + " " + e.name)));
    root.appendChild(el("h2", { class: "section-title" }, "The Event"));
    root.appendChild(evIn);
    root.appendChild(quick);

    root.appendChild(el("h2", { class: "section-title" }, "The Matchup"));
    const arena = el("div", { class: "arena-grid" });
    root.appendChild(arena);

    const result = el("div", {});
    root.appendChild(result);

    function start() {
      if (!sideA.length || !sideB.length) { alert("Add at least one fighter to each side."); return; }
      Battle.start({
        title: (eventLabel || "").trim() || "Battle",
        a: { label: sideA.join(" & "), names: sideA.slice() },
        b: { label: sideB.join(" & "), names: sideB.slice() },
        onResult: (winnerKey) => {
          const label = winnerKey === "a" ? sideA.join(" & ") : sideB.join(" & ");
          result.innerHTML = "";
          result.appendChild(el("div", { class: "arena-result" },
            "🏆 " + label + " won" + (eventLabel ? " " + eventLabel : "") + "!"));
          renderLog();
        },
      });
    }

    function renderLog() {
      logHost.innerHTML = "";
      const log = (Store.state.battles && Store.state.battles.log) || [];
      logHost.appendChild(el("h2", { class: "section-title" }, "🏆 Battle Leaderboard"));
      if (!log.length) { logHost.appendChild(el("p", { class: "hint" }, "No battles yet — run one above.")); return; }
      const wins = {};
      log.forEach((bt) => { wins[bt.winner] = (wins[bt.winner] || 0) + 1; });
      const ranked = Object.keys(wins).map((k) => ({ k: k, n: wins[k] })).sort((a, b) => b.n - a.n);
      logHost.appendChild(el("div", { class: "safari-board" }, ranked.map((r, i) =>
        el("div", { class: "safari-board-row" + (i === 0 ? " lead" : "") }, [
          el("span", { class: "safari-board-rank" }, i === 0 ? "🏆" : "#" + (i + 1)),
          el("span", { class: "safari-board-name" }, r.k),
          el("span", { class: "safari-board-n" }, r.n + " win" + (r.n > 1 ? "s" : "")),
        ]))));
      logHost.appendChild(el("h2", { class: "section-title" }, "Recent Battles"));
      logHost.appendChild(el("div", { class: "battle-log" }, log.slice(0, 12).map((bt) =>
        el("div", { class: "battle-log-row" }, [
          el("span", { class: "battle-log-win" }, "🏆 " + bt.winner),
          el("span", { class: "battle-log-vs" }, " beat "),
          el("span", { class: "battle-log-lose" }, bt.loser),
          bt.title ? el("span", { class: "battle-log-ev" }, " · " + bt.title) : null,
        ]))));
      logHost.appendChild(el("div", { class: "toolbar" }, [
        el("button", { class: "btn subtle sm", onClick: () => { if (confirm("Clear the battle log?")) { Store.update((s) => { s.battles = { log: [] }; }); renderLog(); } } }, "Clear battle log"),
      ]));
    }

    function redraw() {
      arena.innerHTML = "";
      arena.appendChild(sideCard("🔵 Blue Corner", "blue", sideA, redraw));
      arena.appendChild(el("div", { class: "arena-vs" }, "VS"));
      arena.appendChild(sideCard("🔴 Red Corner", "red", sideB, redraw));
    }
    redraw();

    root.appendChild(el("div", { class: "toolbar", style: { justifyContent: "center" } }, [
      el("button", { class: "btn spin-btn", onClick: start }, "⚔ START BATTLE"),
      el("button", { class: "btn subtle", onClick: () => { sideA.length = 0; sideB.length = 0; result.innerHTML = ""; redraw(); } }, "Clear"),
    ]));

    const logHost = el("div", {});
    root.appendChild(logHost);
    renderLog();
  }

  window.Views = window.Views || {};
  window.Views.battle = view;
})();
