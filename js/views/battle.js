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

  function view(root) {
    const sideA = [], sideB = [];
    let eventLabel = "";

    root.appendChild(el("div", { class: "page-head" }, [
      el("h1", {}, "⚔️ Battle Arena"),
      el("p", { class: "page-sub" }, "Fight a real turn-based duel with your caught Pokémon, or call a quick winner for any event matchup."),
    ]));

    // ---- Duel Mode: real turn-based battles at Lv50 ----
    // Singles = 1 trainer per side with a party of up to 6 (switch on faint,
    // or spend a turn to switch). Doubles = 2 trainers per side, 1 mon each.
    let format = "single";
    const duel = { a: [{ attId: "", party: [] }], b: [{ attId: "", party: [] }] };
    function blankUnits() { return format === "double" ? [{ attId: "", party: [] }, { attId: "", party: [] }] : [{ attId: "", party: [] }]; }
    const duelHost = el("div", { class: "duel-setup" });
    root.appendChild(el("h2", { class: "section-title" }, "🎮 Pokémon Duel"));
    root.appendChild(el("p", { class: "hint" },
      "Turn-based, every Pokémon at Lv50. 🧪 Potion = 3 sips to heal · 🍺 Liquid Courage = finish half your drink for a guaranteed crit. Every KO = 2 sips, losing side toasts 4. Synced to a room? Challenge someone below and they'll play their turns on their own phone."));
    // Champion's Belt — win a singles duel to claim it, beat the holder to take it.
    const belt = (Store.state.battles && Store.state.battles.belt) || null;
    root.appendChild(el("div", { class: "duel-belt" + (belt ? "" : " open"), onClick: () => { if (belt && window.Profile) Profile.open(belt.attId); } }, belt
      ? "🥇 Champion's Belt: " + ((Store.attendee(belt.attId) || {}).name || belt.name) +
        (belt.streak > 1 ? " — " + belt.streak + " straight" : "") + ". Beat them in a singles duel to take it!"
      : "🥇 The Champion's Belt is UNCLAIMED — win a singles duel to grab it."));
    root.appendChild(duelHost);

    function unitEditor(side, cls, u, slotLabel) {
      const maxParty = format === "double" ? 1 : 6;
      const sel = el("select", { class: "in" }, [el("option", { value: "" }, slotLabel || "Pick a trainer…")]
        .concat(Store.state.attendees.map((a) => el("option", { value: a.id }, a.name))));
      sel.value = u.attId;
      sel.addEventListener("change", () => {
        u.attId = sel.value;
        const pool = Duel.poolFor(u.attId);
        u.party = pool.length ? [pool[0]] : [];
        renderDuel();
      });
      const kids = [sel];
      if (u.attId) {
        const pool = Duel.poolFor(u.attId);
        kids.push(el("div", { class: "duel-pick-row" }, pool.map((id) => {
          const st = Duel.statsFor(id);
          const idx = u.party.indexOf(id);
          const src = (window.DEX_SPRITES && DEX_SPRITES[id]) || Store.sprite(id);
          return el("button", { class: "duel-pick" + (idx >= 0 ? " on" : ""), title: st.name,
            onClick: () => {
              if (idx >= 0) u.party.splice(idx, 1);
              else if (u.party.length < maxParty) u.party.push(id);
              else if (maxParty === 1) u.party = [id];
              renderDuel();
            } }, [
            src ? el("img", { src: src, alt: st.name }) : el("span", { class: "draft-thumb-ball" }),
            idx >= 0 && maxParty > 1 ? el("span", { class: "duel-pick-n" }, String(idx + 1)) : null,
          ]);
        })));
        if (u.party.length) {
          const lead = Duel.statsFor(u.party[0]);
          kids.push(el("div", { class: "duel-pick-meta" }, (maxParty > 1
            ? "Party of " + u.party.length + " — lead: " : "") +
            lead.name + " · Lv50 · " + lead.hpMax + " HP · " + lead.moves.map((m) => m.name).join(" / ")));
        }
      }
      return el("div", { class: "duel-unit" }, kids);
    }

    function duelSide(side, label, cls) {
      const units = duel[side];
      return el("div", { class: "arena-side " + cls }, [el("div", { class: "arena-side-title" }, label)]
        .concat(units.map((u, i) => unitEditor(side, cls, u, format === "double" ? "Trainer " + (i + 1) + "…" : "Pick a trainer…"))));
    }

    function renderDuel() {
      duelHost.innerHTML = "";
      duelHost.appendChild(el("div", { class: "chip-row duel-format" }, [
        el("button", { class: "chip" + (format === "single" ? " on" : ""), onClick: () => { if (format !== "single") { format = "single"; duel.a = blankUnits(); duel.b = blankUnits(); renderDuel(); } } }, "⚔ Single — party up to 6"),
        el("button", { class: "chip" + (format === "double" ? " on" : ""), onClick: () => { if (format !== "double") { format = "double"; duel.a = blankUnits(); duel.b = blankUnits(); renderDuel(); } } }, "🤝 Double — 2 trainers a side"),
      ]));
      duelHost.appendChild(el("div", { class: "arena-grid" }, [
        duelSide("a", "🔵 Blue Corner", "blue"),
        el("div", { class: "arena-vs" }, "VS"),
        duelSide("b", "🔴 Red Corner", "red"),
      ]));
      duelHost.appendChild(el("div", { class: "toolbar", style: { justifyContent: "center" } }, [
        el("button", { class: "btn spin-btn", onClick: () => {
          const ok = (us) => us.every((u) => u.attId && u.party.length);
          if (!ok(duel.a) || !ok(duel.b)) { alert("Every trainer needs to be picked and have at least one Pokémon."); return; }
          Duel.start({ mode: "local", title: (eventLabel || "").trim() || "Duel",
            a: { units: duel.a.map((u) => ({ attId: u.attId, monIds: u.party.slice() })) },
            b: { units: duel.b.map((u) => ({ attId: u.attId, monIds: u.party.slice() })) },
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
          const nm = p.name || (a && a.name) || "Trainer";
          const src = a ? Store.sprite(Store.currentForm(a).id) : "";
          // 🎮 Duel: a REAL remote duel — they pick their party and play
          // their turns on their own phone. Double battles bring a partner:
          // if the partner is here on their own phone, THEY play their turns.
          const duelBtn = el("button", { class: "btn primary sm" }, "🎮 Duel");
          const sent = (extra) => {
            Sync.sendChallenge(p.clientId, p.attId, nm, (eventLabel || "").trim(), extra);
            duelBtn.disabled = true; duelBtn.textContent = "Waiting…";
            setTimeout(() => { if (duelBtn.isConnected) { duelBtn.disabled = false; duelBtn.textContent = "🎮 Duel"; } }, 15000);
          };
          duelBtn.addEventListener("click", () => {
            const me = Sync.getMe();
            if (!me) { alert("Pick who you are first — Settings → “You are”."); return; }
            let fmt;
            const body = el("div", { class: "chal-modal" }, [
              el("div", { class: "chal-line" }, "Challenge " + nm + " to…"),
              el("div", { class: "toolbar" }, [
                el("button", { class: "btn primary", onClick: () => { fmt.close();
                  Duel.pickParty({ attId: me, title: "Your party vs " + nm, onDone: (ids) => sent({ kind: "duel", party: ids }) });
                } }, "⚔ Single — party up to 6"),
                el("button", { class: "btn primary", onClick: () => { fmt.close();
                  Duel.pickParty({ attId: me, max: 1, title: "Your Pokémon (double battle)", hint: "One mon each in doubles.", onDone: (mine) => {
                    Duel.pickTrainer({ exclude: [me], title: "Pick your partner", hint: "They fight beside you. If they're in the room on their own phone, they'll play their own turns.", onDone: (ally) => {
                      const allyName = (Store.attendee(ally) || {}).name || "Partner";
                      Duel.pickParty({ attId: ally, max: 1, title: allyName + "'s Pokémon", onDone: (theirs) => {
                        sent({ kind: "duel", party: mine, pairAtt: ally, pairParty: theirs });
                      } });
                    } });
                  } });
                } }, "🤝 Double — bring a partner"),
              ]),
            ]);
            fmt = Modal.open("🎮 Pokémon Duel", body, null, {});
          });
          // ⚔ Quick call: the old referee battle (you tap who won).
          const btn = el("button", { class: "btn subtle sm" }, "⚔ Quick call");
          btn.addEventListener("click", () => {
            Sync.sendChallenge(p.clientId, p.attId, nm, (eventLabel || "").trim());
            btn.disabled = true; btn.textContent = "Waiting…";
            setTimeout(() => { if (btn.isConnected) { btn.disabled = false; btn.textContent = "⚔ Quick call"; } }, 8000);
          });
          return el("div", { class: "here-card" }, [
            src ? el("img", { class: "here-sprite", src: src, alt: "" }) : el("span", { class: "draft-thumb-ball" }),
            el("div", { class: "here-name" }, nm),
            duelBtn, btn,
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
