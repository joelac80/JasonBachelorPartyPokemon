/* trade.js — the Trading Post. 1-for-1 Pokémon swaps between trainers,
   link-cable style. Partners are untradeable (Jason keeps Bulbasaur, Joe
   keeps Totodile) unless a spare wild copy was caught. Kadabra, Machoke,
   Graveler and Haunter evolve when traded — just like the games. */
(function () {
  const { el } = U;
  const SP = window.DEX_SPRITES || {};
  const SPS = window.DEX_SPRITES_SHINY || {};
  function sfx(n) { if (window.SFX && SFX[n]) SFX[n](); }
  function nameOf(id) { return (window.DEX && DEX[id] && DEX[id].n) || ("#" + id); }
  function spriteOf(id, shiny) { return (shiny && SPS[id]) || SP[id] || Store.sprite(id); }
  function shinyOf(attId, id) {
    const t = ((Store.state.pokedex || {}).trainers || {})[attId];
    return !!(t && t.caught && t.caught[id] && t.caught[id].shiny);
  }

  // Cinematic swap overlay: sprites cross, evolutions flash.
  function playTrade(aName, aMon, aShiny, bName, bMon, bShiny, result, onDone) {
    const lay = el("div", { class: "trade-anim" }, [
      el("div", { class: "trade-anim-row" }, [
        el("img", { class: "trade-fly left", src: spriteOf(aMon, aShiny), alt: "" }),
        el("div", { class: "trade-arrows" }, "⇄"),
        el("img", { class: "trade-fly right", src: spriteOf(bMon, bShiny), alt: "" }),
      ]),
      el("div", { class: "trade-anim-txt" }, "Trading " + nameOf(aMon) + " ⇄ " + nameOf(bMon) + "…"),
    ]);
    document.body.appendChild(lay);
    sfx("spin");
    const txt = lay.querySelector(".trade-anim-txt");
    const steps = [];
    steps.push([1700, () => { txt.textContent = "📦 " + bName + " received " + nameOf(result.toB) + "! · " + aName + " received " + nameOf(result.toA) + "!"; sfx("coin"); }]);
    if (result.evoB) steps.push([1400, () => {
      txt.textContent = "⚡ Whoa! The traded " + nameOf(aMon) + " is evolving… it became " + nameOf(result.toB) + "!";
      const img = lay.querySelector(".trade-fly.left"); if (img) { img.src = spriteOf(result.toB, aShiny); img.classList.add("evo"); }
      sfx("evolve");
    }]);
    if (result.evoA) steps.push([1400, () => {
      txt.textContent = "⚡ Whoa! The traded " + nameOf(bMon) + " is evolving… it became " + nameOf(result.toA) + "!";
      const img = lay.querySelector(".trade-fly.right"); if (img) { img.src = spriteOf(result.toA, bShiny); img.classList.add("evo"); }
      sfx("evolve");
    }]);
    steps.push([1600, () => { txt.textContent = "🤝 Trade complete! Take care of them!"; sfx("win"); }]);
    let i = 0;
    (function next() {
      if (i >= steps.length) { setTimeout(() => { lay.remove(); onDone(); }, 1400); return; }
      const s = steps[i++]; setTimeout(() => { s[1](); next(); }, s[0]);
    })();
  }

  function view(root) {
    const pick = { a: { attId: "", mon: 0 }, b: { attId: "", mon: 0 } };

    root.appendChild(el("div", { class: "page-head" }, [
      el("h1", {}, "🔁 Trading Post"),
      el("p", { class: "page-sub" }, "Swap caught Pokémon 1-for-1, link-cable style. Partners are NOT for sale — and yes, certain Pokémon evolve when traded…"),
    ]));

    const host = el("div", {});
    root.appendChild(host);
    const recentHost = el("div", {});
    root.appendChild(recentHost);

    function sideCard(key, title, cls) {
      const d = pick[key];
      const other = pick[key === "a" ? "b" : "a"];
      const sel = el("select", { class: "in" }, [el("option", { value: "" }, "Pick a trainer…")]
        .concat(Store.state.attendees.map((a) =>
          el("option", { value: a.id, disabled: a.id === other.attId ? "true" : null }, a.name))));
      sel.value = d.attId;
      sel.addEventListener("change", () => { d.attId = sel.value; d.mon = 0; render(); });
      const kids = [el("div", { class: "arena-side-title" }, title), sel];
      if (d.attId) {
        const att = Store.attendee(d.attId);
        const pool = Duel.poolFor(d.attId);
        if (!pool.filter((id) => Store.canTrade(d.attId, id)).length)
          kids.push(el("p", { class: "hint" }, "Nothing tradeable yet — the partner stays, catch more in the Safari!"));
        kids.push(el("div", { class: "duel-pick-row" }, pool.map((id) => {
          const ok = Store.canTrade(d.attId, id);
          const locked = att && att.favoriteId === id && !ok;
          const shiny = shinyOf(d.attId, id);
          const src = spriteOf(id, shiny);
          return el("button", { class: "duel-pick" + (d.mon === id ? " on" : "") + (ok ? "" : " locked") + (shiny ? " is-shiny" : ""),
            title: nameOf(id) + (shiny ? " ✨ SHINY" : "") + (locked ? " — partner, untradeable ❤" : ""),
            onClick: () => { if (!ok) { sfx("error"); return; } d.mon = id; render(); } }, [
            src ? el("img", { src: src, alt: nameOf(id) }) : el("span", { class: "draft-thumb-ball" }),
            shiny ? el("span", { class: "duel-pick-shiny" }, "✨") : null,
            locked ? el("span", { class: "duel-pick-n lock" }, "🔒") : null,
          ]);
        })));
        if (d.mon) {
          const evo = Store.TRADE_EVOS[d.mon];
          kids.push(el("div", { class: "duel-pick-meta" }, "Offering: " + nameOf(d.mon) +
            (evo ? " — ⚡ evolves into " + nameOf(evo) + " when traded!" : "")));
        }
      }
      return el("div", { class: "arena-side " + cls }, kids);
    }

    function render() {
      host.innerHTML = "";
      host.appendChild(el("div", { class: "arena-grid" }, [
        sideCard("a", "🔵 Trainer A gives…", "blue"),
        el("div", { class: "arena-vs" }, "⇄"),
        sideCard("b", "🔴 Trainer B gives…", "red"),
      ]));
      const ready = pick.a.attId && pick.b.attId && pick.a.mon && pick.b.mon;
      host.appendChild(el("div", { class: "toolbar", style: { justifyContent: "center" } }, [
        el("button", { class: "btn spin-btn", onClick: () => {
          if (!ready) { alert("Pick both trainers and the Pokémon they're each giving up."); return; }
          const an = (Store.attendee(pick.a.attId) || {}).name, bn = (Store.attendee(pick.b.attId) || {}).name;
          if (!confirm("🔁 " + an + "'s " + nameOf(pick.a.mon) + " ⇄ " + bn + "'s " + nameOf(pick.b.mon) + " — deal?")) return;
          const aSh = shinyOf(pick.a.attId, pick.a.mon), bSh = shinyOf(pick.b.attId, pick.b.mon);
          const result = Store.trade(pick.a.attId, pick.a.mon, pick.b.attId, pick.b.mon);
          if (!result) { alert("That trade isn't allowed — partners stay home."); return; }
          const aM = pick.a.mon, bM = pick.b.mon;
          pick.a.mon = 0; pick.b.mon = 0;
          playTrade(an, aM, aSh, bn, bM, bSh, result, () => { render(); renderRecent(); });
        } }, "🔁 MAKE THE TRADE"),
      ]));
    }

    function renderRecent() {
      recentHost.innerHTML = "";
      const rows = (Store.state.chronicle || []).filter((c) => c.icon === "🔁" || (c.icon === "⚡" && /traded/.test(c.text))).slice(0, 10);
      if (!rows.length) return;
      recentHost.appendChild(el("h2", { class: "section-title" }, "Recent trades"));
      recentHost.appendChild(el("div", { class: "battle-log" }, rows.map((c) =>
        el("div", { class: "battle-log-row" }, c.icon + " " + c.text))));
    }

    render();
    renderRecent();
  }

  window.Views = window.Views || {};
  window.Views.trade = view;
})();
