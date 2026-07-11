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
    const DEXN = (Store.dexTarget ? Store.dexTarget(a.id) : (Object.keys(window.DEX || {}).length || 251));
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

  // ---- browsable, filterable Pokédex: every mon, caught / seen / unseen for a
  // chosen trainer, sortable by number and filterable by generation + type. ----
  function dexBrowser(root) {
    root.appendChild(el("h2", { class: "section-title" }, "📒 Browse the Pokédex"));
    const me = (window.Sync && Sync.getMe && Sync.getMe()) || (Store.state.attendees[0] || {}).id || "";
    let attId = me;
    const filter = { gen: 0, type: "", desc: false };
    const CAPN = 400;

    const sel = el("select", { class: "in" }, Store.state.attendees.map((a) => el("option", { value: a.id }, a.name + "'s dex")));
    sel.value = attId;
    sel.onchange = () => { attId = sel.value; paint(); };

    const bar = window.DexFilter ? DexFilter.controls(filter, () => paint()) : null;
    const count = el("div", { class: "hint trk-dex-count" });
    const grid = el("div", { class: "trk-dex-grid" });

    function paint() {
      const tr = (Store.state.pokedex.trainers || {})[attId] || {};
      const caughtMap = tr.caught || {}, seenMap = tr.seen || {};
      const target = Store.dexTarget ? Store.dexTarget(attId) : (Object.keys(window.DEX || {}).length || 251);
      const allIds = []; for (let i = 1; i <= target; i++) allIds.push(i);
      const shown = window.DexFilter ? DexFilter.apply(allIds, filter) : allIds;
      grid.innerHTML = "";
      const clip = shown.slice(0, CAPN);
      clip.forEach((id) => {
        const d = DEX()[id]; if (!d) return;
        const rc = caughtMap[id]; const caught = !!rc; const seen = caught || !!seenMap[id];
        const shiny = !!(rc && rc.shiny);
        const src = (shiny && (window.DEX_SPRITES_SHINY || {})[id]) || SP()[id] || Store.sprite(id);
        grid.appendChild(el("div", { class: "trk-dex-cell " + (caught ? "caught" : seen ? "seen" : "unseen"),
          title: "#" + id + " " + (seen ? d.n : "???") + (caught ? (shiny ? " ✨ caught" : " · caught") : seen ? " · seen" : "") }, [
          src ? el("img", { src: src, alt: "" }) : el("span", { class: "trk-dex-ball" }, "◓"),
          shiny && caught ? el("span", { class: "trk-dex-shiny" }, "✨") : null,
          el("span", { class: "trk-dex-no" }, "#" + String(id).padStart(id > 999 ? 4 : 3, "0")),
        ]));
      });
      const nCaught = shown.filter((id) => caughtMap[id]).length;
      count.textContent = "🔴 " + nCaught + " caught · " + shown.length + " shown"
        + (shown.length > CAPN ? " (first " + CAPN + " — narrow by gen/type to see the rest)" : "");
    }

    root.appendChild(el("div", { class: "toolbar trk-dex-tools" }, [sel]));
    if (bar) root.appendChild(bar);
    root.appendChild(count);
    root.appendChild(grid);
    paint();
  }

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

    // ---- browsable, filterable Pokédex ----
    dexBrowser(root);
  }

  window.Views = window.Views || {};
  window.Views.tracker = view;
})();
