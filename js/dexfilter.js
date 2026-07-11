/* dexfilter.js — shared Pokédex sort/filter controls: by National Dex number,
   generation, and type. Used by the team picker (gyms/league/tournament/duels)
   and the Pokédex Tracker's browser. window.DexFilter. */
(function () {
  const { el } = U;

  const GENS = [
    { g: 1, name: "Gen 1 · Kanto",  min: 1,   max: 151 },
    { g: 2, name: "Gen 2 · Johto",  min: 152, max: 251 },
    { g: 3, name: "Gen 3 · Hoenn",  min: 252, max: 386 },
    { g: 4, name: "Gen 4 · Sinnoh", min: 387, max: 493 },
    { g: 5, name: "Gen 5 · Unova",  min: 494, max: 649 },
    { g: 6, name: "Gen 6 · Kalos",  min: 650, max: 721 },
    { g: 7, name: "Gen 7 · Alola",  min: 722, max: 809 },
    { g: 8, name: "Gen 8 · Galar",  min: 810, max: 905 },
    { g: 9, name: "Gen 9 · Paldea", min: 906, max: 1025 },
  ];
  const TYPES = ["normal","fire","water","electric","grass","ice","fighting","poison","ground",
    "flying","psychic","bug","rock","ghost","dragon","dark","steel","fairy"];
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  function genOf(id) { for (let i = 0; i < GENS.length; i++) if (id >= GENS[i].min && id <= GENS[i].max) return GENS[i].g; return 0; }
  function typesOf(id) { const d = (window.DEX || {})[id]; return (d && d.t) || []; }
  function matches(id, f) {
    if (f.gen && genOf(id) !== f.gen) return false;
    if (f.type && typesOf(id).indexOf(f.type) < 0) return false;
    return true;
  }
  // Filter a list of dex ids and sort by number (asc, or desc when f.desc).
  function apply(ids, f) {
    const out = ids.filter((id) => matches(id, f));
    out.sort((a, b) => (f.desc ? b - a : a - b));
    return out;
  }

  // A compact filter bar bound to a mutable `state` ({gen,type,desc}); calls
  // onChange() after any change so the caller can re-render its grid.
  function controls(state, onChange) {
    const genSel = el("select", { class: "in dexf-sel" },
      [el("option", { value: "" }, "All gens")].concat(GENS.map((G) => el("option", { value: String(G.g) }, G.name))));
    genSel.value = state.gen ? String(state.gen) : "";
    genSel.onchange = () => { state.gen = genSel.value ? Number(genSel.value) : 0; onChange(); };

    const typeSel = el("select", { class: "in dexf-sel" },
      [el("option", { value: "" }, "All types")].concat(TYPES.map((t) => el("option", { value: t }, cap(t)))));
    typeSel.value = state.type || "";
    typeSel.onchange = () => { state.type = typeSel.value; onChange(); };

    const sortBtn = el("button", { class: "btn subtle sm dexf-sort" }, state.desc ? "▼ No." : "▲ No.");
    sortBtn.onclick = () => { state.desc = !state.desc; sortBtn.textContent = state.desc ? "▼ No." : "▲ No."; onChange(); };

    const clear = el("button", { class: "btn subtle sm", title: "Clear filters", onClick: () => {
      state.gen = 0; state.type = ""; state.desc = false;
      genSel.value = ""; typeSel.value = ""; sortBtn.textContent = "▲ No."; onChange();
    } }, "✕");

    return el("div", { class: "dexf-bar" }, [genSel, typeSel, sortBtn, clear]);
  }

  window.DexFilter = { GENS: GENS, TYPES: TYPES, genOf: genOf, typesOf: typesOf, matches: matches, apply: apply, controls: controls };
})();
