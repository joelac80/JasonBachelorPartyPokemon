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
    // or spend a turn to switch). Doubles = 2 field slots per side (2v2), each
    // slot a party of up to 3 that switches to its own bench.
    let format = "single";
    const duel = { a: [{ attId: "", party: [] }], b: [{ attId: "", party: [] }] };
    function blankUnits() { return format === "double" ? [{ attId: "", party: [] }, { attId: "", party: [] }] : [{ attId: "", party: [] }]; }
    const duelHost = el("div", { class: "duel-setup" });
    root.appendChild(el("h2", { class: "section-title" }, "🎮 Pokémon Duel"));
    root.appendChild(el("p", { class: "hint" },
      "Turn-based, every Pokémon at Lv50. 🧪 Potion = 3 sips to heal 120 · 🍺 Liquid Courage = finish half your drink, unleash a guaranteed crit that same turn. Every KO = 2 sips, losing side toasts 4. Synced to a room? Challenge someone below and they'll play their turns on their own phone."));
    // Champion's Belt — win a singles duel to claim it, beat the holder to take it.
    const belt = (Store.state.battles && Store.state.battles.belt) || null;
    root.appendChild(el("div", { class: "duel-belt" + (belt ? "" : " open"), onClick: () => { if (belt && window.Profile) Profile.open(belt.attId); } }, belt
      ? "🥇 Champion's Belt: " + ((Store.attendee(belt.attId) || {}).name || belt.name) +
        (belt.streak > 1 ? " — " + belt.streak + " straight" : "") + ". Beat them in a singles duel to take it!"
      : "🥇 The Champion's Belt is UNCLAIMED — win a singles duel to grab it."));
    root.appendChild(duelHost);

    function unitEditor(side, cls, u, slotLabel) {
      const maxParty = format === "double" ? 3 : 6;
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
        if (maxParty > 1) kids.push(el("button", { class: "btn subtle sm", onClick: () => {
          const t = (Store.state.pokedex.trainers || {})[u.attId] || {};
          const team = (t.team || []).filter((id) => pool.indexOf(id) >= 0).slice(0, maxParty);
          if (team.length) { u.party = team; renderDuel(); } else alert("No team set — build one on the Safari page.");
        } }, "⚡ Use my team"));
        if (u.party.length) {
          const lead = Duel.statsFor(u.party[0]);
          const kos = ((Store.state.pokedex.trainers || {})[u.attId] || { caught: {} }).caught[u.party[0]];
          const vet = kos && kos.kos ? Math.min(20, 2 * kos.kos) : 0;
          kids.push(el("div", { class: "duel-pick-meta" }, (maxParty > 1
            ? "Party of " + u.party.length + " — lead: " : "") +
            lead.name + " · Lv50 · " + lead.hpMax + " HP" + (vet ? " · ⚔ veteran +" + vet + "% ATK" : "") + " · " + lead.moves.map((m) => m.name).join(" / ")));
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
        el("button", { class: "chip" + (format === "double" ? " on" : ""), onClick: () => { if (format !== "double") { format = "double"; duel.a = blankUnits(); duel.b = blankUnits(); renderDuel(); } } }, "🐾 Double — 2 on the field"),
      ]));
      if (format === "double") duelHost.appendChild(el("p", { class: "hint" },
        "2v2 on the field. Two trainers team up — each brings up to 3 (one fights, the rest are bench). Pick the SAME trainer in both slots to run a solo double from one party."));
      duelHost.appendChild(el("div", { class: "arena-grid" }, [
        duelSide("a", "🔵 Blue Corner", "blue"),
        el("div", { class: "arena-vs" }, "VS"),
        duelSide("b", "🔴 Red Corner", "red"),
      ]));
      duelHost.appendChild(el("div", { class: "toolbar", style: { justifyContent: "center" } }, [
        el("button", { class: "btn spin-btn", onClick: () => {
          const ok = (us) => us.every((u) => u.attId && u.party.length);
          if (!ok(duel.a) || !ok(duel.b)) { alert("Every trainer needs to be picked and have at least one Pokémon."); return; }
          const dup = (us) => us.length === 2 && us[0].attId === us[1].attId && us[0].party.some((id) => us[1].party.indexOf(id) >= 0);
          if (dup(duel.a) || dup(duel.b)) { alert("Same trainer twice is fine — but the two field slots must use DIFFERENT Pokémon."); return; }
          // Same trainer in both slots = a SOLO double: merge both slots into ONE
          // shared party (leads first) so either slot can field any of them.
          const buildSide = (us) => {
            if (format === "double" && us.length === 2 && us[0].attId && us[0].attId === us[1].attId) {
              const monIds = [us[0].party[0], us[1].party[0]].concat(us[0].party.slice(1), us[1].party.slice(1)).filter(Boolean);
              const unit = { attId: us[0].attId, monIds: monIds };
              return { units: [unit, { attId: us[0].attId, monIds: monIds }], shared: true };
            }
            return { units: us.map((u) => ({ attId: u.attId, monIds: u.party.slice() })) };
          };
          Duel.start({ mode: "local", title: (eventLabel || "").trim() || "Duel",
            a: buildSide(duel.a), b: buildSide(duel.b),
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
                  Duel.pickParty({ attId: me, min: 3, max: 3, title: "Your 3 Pokémon (pair battle)", hint: "You and your partner each bring 3 — one each on the field, 2v2, switch to your bench.", onDone: (mine) => {
                    Duel.pickTrainer({ exclude: [me], title: "Pick your partner", hint: "They fight beside you. If they're in the room on their own phone, they'll play their own turns.", onDone: (ally) => {
                      const allyName = (Store.attendee(ally) || {}).name || "Partner";
                      Duel.pickParty({ attId: ally, min: 3, max: 3, title: allyName + "'s 3 Pokémon", onDone: (theirs) => {
                        sent({ kind: "duel", party: mine, pairAtt: ally, pairParty: theirs });
                      } });
                    } });
                  } });
                } }, "🤝 Pair — bring a partner (3 each)"),
                el("button", { class: "btn primary", onClick: () => { fmt.close();
                  Duel.pickParty({ attId: me, min: 4, max: 4, title: "Pick FOUR Pokémon (double battle)", hint: "Your first two lead the field (2v2); the other two ride the bench. Tap in order.", onDone: (ids) => {
                    sent({ kind: "duel", party: ids, solo2: true });
                  } });
                } }, "🐾 Double — solo (4 Pokémon)"),
              ]),
            ]);
            fmt = Modal.open("🎮 Pokémon Duel", body, null, {});
          });
          // (The old remote "quick call" button is gone — real duels cover
          // phone-to-phone; the referee matchup below still logs live events.)
          return el("div", { class: "here-card" }, [
            src ? el("img", { class: "here-sprite", src: src, alt: "" }) : el("span", { class: "draft-thumb-ball" }),
            el("div", { class: "here-name" }, nm),
            duelBtn,
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
      // 📈 Duel Elo — singles only, everyone starts at 1000.
      const elo = (Store.state.battles && Store.state.battles.elo) || {};
      const eloRows = Object.keys(elo).map((id) => ({ a: Store.attendee(id), r: elo[id] }))
        .filter((x) => x.a).sort((x, y) => y.r - x.r);
      if (eloRows.length) {
        logHost.appendChild(el("h2", { class: "section-title" }, "📈 Duel Ratings"));
        logHost.appendChild(el("div", { class: "safari-board" }, eloRows.map((x, i) =>
          el("div", { class: "safari-board-row clickable" + (i === 0 ? " lead" : ""), onClick: () => window.Profile && Profile.open(x.a.id) }, [
            el("span", { class: "safari-board-rank" }, i === 0 ? "📈" : "#" + (i + 1)),
            el("span", { class: "safari-board-name" }, x.a.name),
            el("span", { class: "safari-board-n" }, String(x.r)),
          ]))));
      }
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
