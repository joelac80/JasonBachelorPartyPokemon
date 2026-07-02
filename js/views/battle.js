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
      el("p", { class: "page-sub" }, "Set any matchup — 1v1 or 2v2 — tag the event, and battle. Winner's bragging rights only."),
    ]));

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
        },
      });
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
  }

  window.Views = window.Views || {};
  window.Views.battle = view;
})();
