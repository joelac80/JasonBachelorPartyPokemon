/* dex.js — 📕 THE POKÉDEX: every collection on ONE page. Region-style tab
   buttons switch between the nine generations plus the special dexes:
   🏔 Hisui (the 16 ancient forms behind the rift), 🔡 Unown (the living
   alphabet) and ✨ Mega (forms unlocked by Mega-Evolving in battle). Gen
   tabs respect the Gen Ladder (locked ones say which Champion opens them);
   Unown/Mega embed their full pages — secret battles included. */
(function () {
  const { el } = U;
  const DEX = window.DEX || {};
  const SP = window.DEX_SPRITES || {};
  const SPS = window.DEX_SPRITES_SHINY || {};
  const SPANS = (window.Store && Store.GEN_SPANS) || [];

  // Story order: Unown rides with its Johto era, Mega with its Kalos era,
  // and Hisui closes the list as the post-Sinnoh rift.
  const TABS = [
    { key: "g1", gen: 1, name: "Kanto", emoji: "🔴" },
    { key: "g2", gen: 2, name: "Johto", emoji: "🌸" },
    { key: "unown", name: "Unown", emoji: "🔡" },
    { key: "g3", gen: 3, name: "Hoenn", emoji: "🌊" },
    { key: "g4", gen: 4, name: "Sinnoh", emoji: "🏔" },
    { key: "g5", gen: 5, name: "Unova", emoji: "🏙" },
    { key: "g6", gen: 6, name: "Kalos", emoji: "🗼" },
    { key: "mega", name: "Mega", emoji: "✨" },
    { key: "g7", gen: 7, name: "Alola", emoji: "🌺" },
    { key: "g8", gen: 8, name: "Galar", emoji: "⚽" },
    { key: "g9", gen: 9, name: "Paldea", emoji: "🍊" },
    { key: "hisui", name: "Hisui", emoji: "⏳" },
    { key: "trainers", name: "Trainers", emoji: "🎓" },
  ];

  // Per-trainer catch records (same variant logic as the Safari dex).
  function rec(tid) { return ((Store.state.pokedex || {}).trainers || {})[tid] || { caught: {} }; }
  function ownsNormal(tid, id) {
    const t = rec(tid);
    if (t.have && t.have[id]) return true;
    return !!(t.caught && t.caught[id] && !t.caught[id].shiny);
  }
  function ownsShiny(tid, id) {
    const t = rec(tid);
    if (t.haveShiny && t.haveShiny[id]) return true;
    return !!(t.caught && t.caught[id] && t.caught[id].shiny);
  }

  // ── per-phone session ──
  let me = "";
  let tab = "g1";
  let shinyMode = false;

  function view(root) {
    const meId = (window.Sync && Sync.getMe && Sync.getMe()) || "";
    if (!me && meId && Store.attendee(meId)) me = meId;

    root.appendChild(el("div", { class: "page-head" }, [
      el("h1", {}, "📕 Pokédex"),
      el("p", { class: "page-sub" }, "Every collection in one place — flip between the nine generations, the ancient Hisui forms, the Unown alphabet and the Mega-Dex."),
    ]));

    const sel = el("select", { class: "in" }, [el("option", { value: "" }, "— pick a trainer —")].concat(
      Store.state.attendees.map((a) => el("option", { value: a.id, selected: me === a.id ? "true" : null }, a.name))));
    sel.addEventListener("change", () => { me = sel.value; Router.render(); });
    root.appendChild(el("div", { class: "safari-trainer" }, [el("span", { class: "safari-trainer-lbl" }, "Trainer:"), sel]));

    // The tab row — same look as The Journey's region tabs.
    const cap = me && Store.genCapFor ? Store.genCapFor(me) : 1;
    const bar = el("div", { class: "rg-tabs dex-tabbar" });
    TABS.forEach((t) => {
      const locked = me && t.gen ? t.gen > cap : (t.key === "hisui" ? !(me && Store.hisuiUnlocked && Store.hisuiUnlocked(me)) : false);
      bar.appendChild(el("button", { class: "rg-tab" + (tab === t.key ? " on" : "") + (locked ? " locked" : ""), onClick: () => { tab = t.key; Router.render(); } }, [
        el("span", { class: "rg-tab-emoji" }, locked ? "🔒" : t.emoji),
        el("span", { class: "rg-tab-name" }, t.name),
        t.gen ? el("span", { class: "rg-tab-gen" }, "Gen " + t.gen) : el("span", { class: "rg-tab-gen" }, "Special"),
      ]));
    });
    root.appendChild(bar);

    const host = el("div", {});
    root.appendChild(host);

    const t = TABS.find((x) => x.key === tab) || TABS[0];
    // 🔡 / ✨ — the full standalone pages ride along inside the tab.
    if (t.key === "unown" || t.key === "mega" || t.key === "trainers") {
      const emb = el("div", { class: "dex-embed" });
      host.appendChild(emb);
      const v = window.Views && window.Views[t.key === "mega" ? "megadex" : t.key === "trainers" ? "trainerdex" : "unown"];
      if (v) v(emb);
      return;
    }
    if (!me) { host.appendChild(el("p", { class: "empty" }, "👆 Pick a trainer to open their dex.")); return; }

    // 🏔 Hisui / gen tabs — locked panels name the gate, open ones show the grid.
    if (t.key === "hisui") {
      if (!(Store.hisuiUnlocked && Store.hisuiUnlocked(me))) {
        host.appendChild(el("div", { class: "dex-lock" }, [
          el("div", { class: "dex-lock-title" }, "🔒 The rift is sealed"),
          el("div", { class: "dex-lock-sub" }, "Beat Champion CYNTHIA in The Journey — the sky tears, Arceus speaks, and the 16 ancient Hisuian forms roam " + name(me) + "'s Safari."),
        ]));
        return;
      }
      renderGrid(host, (window.HISUI_WILD || []).slice(), "🏔 Hisuian forms of old — they roam the Safari like any species (shinies too).");
      return;
    }
    if (t.gen > cap) {
      const rung = (Store.GEN_LADDER || []).find((r) => r.gen === t.gen);
      host.appendChild(el("div", { class: "dex-lock" }, [
        el("div", { class: "dex-lock-title" }, "🔒 Gen " + t.gen + " — " + t.name + " is locked"),
        el("div", { class: "dex-lock-sub" }, (rung ? "Beat Champion " + rung.champName : "Climb the ladder") + " in The Journey to open it for " + name(me) + "."),
      ]));
      return;
    }
    const span = SPANS[t.gen - 1];
    const ids = []; for (let i = span[0]; i <= span[1]; i++) if (DEX[i]) ids.push(i);
    renderGrid(host, ids, null);
  }

  function name(tid) { const a = Store.attendee(tid); return a ? a.name : tid; }

  function renderGrid(host, ids, note) {
    const nNorm = ids.reduce((n, id) => n + (ownsNormal(me, id) ? 1 : 0), 0);
    const nShiny = ids.reduce((n, id) => n + (ownsShiny(me, id) ? 1 : 0), 0);
    host.appendChild(el("h2", { class: "section-title" },
      (shinyMode ? "✨ Shiny — " + nShiny : "Caught — " + nNorm) + " / " + ids.length));
    host.appendChild(el("div", { class: "dex-toggle" }, [
      el("button", { class: "btn sm" + (shinyMode ? " subtle" : " primary"), onClick: () => { shinyMode = false; Router.render(); } }, "Regular · " + nNorm),
      el("button", { class: "btn sm" + (shinyMode ? " primary" : " subtle"), onClick: () => { shinyMode = true; Router.render(); } }, "✨ Shiny · " + nShiny),
    ]));
    if (note) host.appendChild(el("p", { class: "hint" }, note));
    const grid = el("div", { class: "safari-dex" });
    ids.forEach((id) => {
      const got = shinyMode ? ownsShiny(me, id) : ownsNormal(me, id);
      const src = shinyMode ? SPS[id] : SP[id];
      grid.appendChild(el("div", { class: "safari-dex-cell" + (got ? " got" : "") + (shinyMode ? " shiny" : ""),
        title: got ? DEX[id].n + (shinyMode ? " ✨ SHINY" : "") : "#" + id + " — " + (shinyMode ? "no shiny yet" : "not caught") }, [
        src ? el("img", { src: src, alt: got ? DEX[id].n : "", loading: "lazy" }) : null,
        el("span", { class: "safari-dex-num" }, "#" + id),
        shinyMode && got ? el("span", { class: "safari-dex-shiny" }, "✨") : null,
      ]));
    });
    host.appendChild(grid);
  }

  window.Views = window.Views || {};
  window.Views.dex = view;
})();
