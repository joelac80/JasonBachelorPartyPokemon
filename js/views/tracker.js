/* tracker.js — the Pokédex Tracker: every trainer's team of 6 and dex
   progress on one page, plus the Type Masters — one crown per Pokémon
   type, held by whoever has caught the most of it. */
(function () {
  const { el, energyIcon } = U;
  const DEX = () => window.DEX || {};
  const SP = () => window.DEX_SPRITES || {};

  function teamRow(attId) {
    const t = (Store.state.pokedex.trainers || {})[attId] || {};
    const team = (t.team || []).slice(0, 6);
    const slots = [];
    for (let i = 0; i < 6; i++) {
      const id = team[i];
      if (!id) { slots.push(el("span", { class: "trk-slot empty" }, "·")); continue; }
      const rc = (t.caught || {})[id];
      const shiny = !!(rc && rc.shiny);
      const src = (shiny && (window.DEX_SPRITES_SHINY || {})[id]) || SP()[id] || Store.sprite(id);
      const nm = DEX()[id] ? DEX()[id].n
        : ((Store.state.attendees.find((x) => x.favoriteId === id) || {}).favorite || "Partner");
      slots.push(src
        ? el("img", { class: "trk-slot" + (shiny ? " shiny" : ""), src: src, alt: nm, title: nm + (shiny ? " ✨ SHINY" : "") })
        : el("span", { class: "trk-slot empty" }, "◓"));
    }
    return el("div", { class: "trk-team" }, slots);
  }

  function trainerCard(a, leaders) {
    const caught = Store.dexCount(a.id);
    const tr = (Store.state.pokedex.trainers || {})[a.id] || {};
    const seen = Object.keys(Object.assign({}, tr.seen || {}, tr.caught || {})).length;
    const DEXN = Object.keys(window.DEX || {}).length || 251;
    const pct = Math.min(100, Math.round(caught / DEXN * 100));
    const myTypes = leaders.filter((l) => l.holderId === a.id && l.n > 0);
    return el("div", { class: "trk-card", onClick: () => window.Profile && Profile.open(a.id) }, [
      el("div", { class: "trk-head" }, [
        el("div", { class: "trk-name" }, a.name),
        el("div", { class: "trk-nums" }, "🔴 " + caught + " / " + DEXN + " · 👀 " + seen),
      ]),
      el("div", { class: "trk-bar" }, [el("div", { class: "trk-fill", style: { width: Math.max(pct, caught ? 2 : 0) + "%" } })]),
      teamRow(a.id),
      myTypes.length ? el("div", { class: "trk-gyms" }, myTypes.map((l) => {
        const ico = energyIcon(l.type);
        return el("span", { class: "trk-gym", title: l.type + " Type Master — " + l.n + " caught" },
          [ico ? el("img", { src: ico, alt: l.type }) : null, " ×" + l.n]);
      })) : null,
    ]);
  }

  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function view(root) {
    root.appendChild(el("div", { class: "page-head" }, [
      el("h1", {}, "🔬 Pokédex Tracker"),
      el("p", { class: "page-sub" }, "Every trainer's team and dex progress, live — and the Type Masters, one crown per type." ),
    ]));

    const leaders = Store.typeLeaders();

    // ---- all trainers at once ----
    root.appendChild(el("h2", { class: "section-title" }, "The Squad's Progress"));
    const ranked = Store.state.attendees.slice().sort((a, b) => Store.dexCount(b.id) - Store.dexCount(a.id));
    root.appendChild(el("div", { class: "trk-grid" }, ranked.map((a) => trainerCard(a, leaders))));

    // ---- type masters ----
    root.appendChild(el("h2", { class: "section-title" }, "⚡ Type Masters"));
    root.appendChild(el("p", { class: "hint" }, "Catch the most of a type to claim its crown. Partners don't count — go earn it in the grass." ));
    root.appendChild(el("div", { class: "gym-lead-grid" }, leaders.map((l) => {
      const ico = energyIcon(l.type);
      return el("div", { class: "gym-lead" + (l.n > 0 ? " held" : ""),
        onClick: l.holderId ? () => window.Profile && Profile.open(l.holderId) : null }, [
        ico ? el("img", { class: "gym-lead-ico", src: ico, alt: l.type }) : el("span", { class: "gym-lead-ico" }, "❓"),
        el("div", { class: "gym-lead-txt" }, [
          el("div", { class: "gym-lead-t" }, cap(l.type) + " Gym"),
          el("div", { class: "gym-lead-holder" }, l.n > 0 ? l.holder : "Unclaimed"),
          l.n > 0 ? el("div", { class: "gym-lead-n" }, l.n + " caught") : null,
        ]),
      ]);
    })));
  }

  window.Views = window.Views || {};
  window.Views.tracker = view;
})();
