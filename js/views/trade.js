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
  function trec(attId) { return ((Store.state.pokedex || {}).trainers || {})[attId] || {}; }
  function shinyOf(attId, id) {
    const t = trec(attId);
    return !!(t.caught && t.caught[id] && t.caught[id].shiny);
  }
  // Per-variant ownership (mirrors Safari): normal and shiny are distinct.
  function ownsNormal(attId, id) {
    const t = trec(attId);
    if (t.have && t.have[id]) return true;
    return !!(t.caught && t.caught[id] && !t.caught[id].shiny);
  }
  function ownsShiny(attId, id) {
    const t = trec(attId);
    if (t.haveShiny && t.haveShiny[id]) return true;
    return !!(t.caught && t.caught[id] && t.caught[id].shiny);
  }
  // Which tradeable variants a trainer currently HOLDS for a species. Owning
  // both a normal and a shiny (with 2+ copies on hand) yields two pickable
  // entries so they choose which one to send; otherwise one, matching the
  // form the caught record advertises.
  function variantsFor(attId, id) {
    const r = trec(attId).caught && trec(attId).caught[id];
    if (!r) return [];
    if (ownsNormal(attId, id) && ownsShiny(attId, id) && (r.count || 1) >= 2) return [false, true];
    return [!!r.shiny];
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

  // Shared with app.js so remote trade offers can play the same cinematic.
  window.TradeFX = { play: playTrade, spriteOf: spriteOf, shinyOf: shinyOf, nameOf: nameOf };

  function view(root) {
    const pick = { a: { attId: "", mon: 0, shiny: false }, b: { attId: "", mon: 0, shiny: false } };

    root.appendChild(el("div", { class: "page-head" }, [
      el("h1", {}, "🔁 Trading Post"),
      el("p", { class: "page-sub" }, "Swap caught Pokémon 1-for-1, link-cable style. Partners are NOT for sale — and yes, certain Pokémon evolve when traded…"),
    ]));

    const inboxHost = el("div", {});
    root.appendChild(inboxHost);
    const host = el("div", {});
    root.appendChild(host);
    const recentHost = el("div", {});
    root.appendChild(recentHost);

    // 📬 The trade inbox: open offers live in shared state, so they wait for
    // the other trainer — no need to be in the room when one is sent.
    function renderInbox() {
      inboxHost.innerHTML = "";
      const offers = Store.tradeOffers();
      if (!offers.length) return;
      const me = (window.Sync && Sync.getMe && Sync.getMe()) || "";
      inboxHost.appendChild(el("h2", { class: "section-title" }, "📬 Trade Inbox"));
      inboxHost.appendChild(el("div", { class: "trade-inbox" }, offers.map((o) => {
        const fromN = (Store.attendee(o.from) || {}).name || "?", toN = (Store.attendee(o.to) || {}).name || "?";
        const forMe = me && o.to === me, byMe = me && o.from === me;
        const row = el("div", { class: "trade-offer" + (forMe ? " mine" : "") }, [
          el("div", { class: "trade-offer-mons" }, [
            el("img", { src: spriteOf(o.give, o.giveShiny), alt: "" }),
            el("span", { class: "trade-offer-arrow" }, "⇄"),
            el("img", { src: spriteOf(o.want, o.wantShiny), alt: "" }),
          ]),
          el("div", { class: "trade-offer-txt" },
            fromN + " offers " + nameOf(o.give) + (o.giveShiny ? " ✨" : "") + " for " + toN + "'s " + nameOf(o.want) + (o.wantShiny ? " ✨" : "")),
          el("div", { class: "toolbar" },
            forMe ? [
              el("button", { class: "btn primary sm", onClick: () => {
                const gSh = !!o.giveShiny, wSh = !!o.wantShiny;
                const r = Store.resolveTradeOffer(o.id, true);
                if (!r.ok) { alert(r.why); renderInbox(); renderRecent(); return; }
                sfx("win");
                playTrade(fromN, o.give, gSh, toN, o.want, wSh, r.result, () => { renderInbox(); render(); renderRecent(); });
              } }, "✅ Accept"),
              el("button", { class: "btn subtle sm", onClick: () => { Store.resolveTradeOffer(o.id, false); sfx("error"); renderInbox(); } }, "❌ Decline"),
            ] : byMe ? [
              el("span", { class: "hint" }, "waiting on " + toN + "…"),
              el("button", { class: "btn subtle sm", onClick: () => { Store.cancelTradeOffer(o.id); renderInbox(); } }, "↩ Cancel"),
            ] : [el("span", { class: "hint" }, "waiting on " + toN + "…")]),
        ]);
        return row;
      })));
    }

    function sideCard(key, title, cls) {
      const d = pick[key];
      const other = pick[key === "a" ? "b" : "a"];
      const sel = el("select", { class: "in" }, [el("option", { value: "" }, "Pick a trainer…")]
        .concat(Store.state.attendees.map((a) =>
          el("option", { value: a.id, disabled: a.id === other.attId ? "true" : null }, a.name))));
      sel.value = d.attId;
      sel.addEventListener("change", () => { d.attId = sel.value; d.mon = 0; d.shiny = false; render(); });
      const kids = [el("div", { class: "arena-side-title" }, title), sel];
      if (d.attId) {
        const att = Store.attendee(d.attId);
        const pool = Duel.poolFor(d.attId);
        if (!pool.filter((id) => Store.canTrade(d.attId, id)).length)
          kids.push(el("p", { class: "hint" }, "Nothing tradeable yet — the partner stays, catch more in the Safari!"));
        // One entry per HELD variant — a normal and a shiny of the same species
        // both appear so a trainer can send exactly the one they mean.
        const entries = [];
        pool.forEach((id) => {
          const vs = variantsFor(d.attId, id);
          if (vs.length) vs.forEach((sh) => entries.push({ id: id, shiny: sh }));
          else entries.push({ id: id, shiny: shinyOf(d.attId, id) });   // partner / not-yet-caught → shows locked
        });
        kids.push(el("div", { class: "duel-pick-row trade-pick-grid" }, entries.map((e) => {
          const id = e.id, shiny = e.shiny;
          const ok = Store.canTrade(d.attId, id);
          const locked = att && att.favoriteId === id && !ok;
          const bothVariants = variantsFor(d.attId, id).length > 1;
          const on = d.mon === id && !!d.shiny === !!shiny;
          const src = spriteOf(id, shiny);
          const btn = el("button", { class: "duel-pick" + (on ? " on" : "") + (ok ? "" : " locked") + (shiny ? " is-shiny" : ""),
            title: nameOf(id) + (shiny ? " ✨ SHINY" : "") + (locked ? " — partner, untradeable ❤" : ""),
            onClick: () => { if (!ok) { sfx("error"); return; } d.mon = id; d.shiny = shiny; render(); } }, [
            src ? el("img", { src: src, alt: nameOf(id) }) : el("span", { class: "draft-thumb-ball" }),
            shiny ? el("span", { class: "duel-pick-shiny" }, "✨") : null,
            locked ? el("span", { class: "duel-pick-n lock" }, "🔒") : null,
          ]);
          // Label disambiguates when both forms are shown; still flags a lone shiny.
          const lab = bothVariants ? (shiny ? "✨ Shiny" : "Normal") : (shiny ? "✨ Shiny" : "");
          return el("div", { class: "trade-pick-cell" }, [
            btn,
            lab ? el("div", { class: "trade-pick-lab" + (shiny ? " shiny" : "") }, lab) : null,
          ]);
        })));
        if (d.mon) {
          const evo = Store.TRADE_EVOS[d.mon];
          kids.push(el("div", { class: "duel-pick-meta" }, "Offering: " + nameOf(d.mon) + (d.shiny ? " ✨ shiny" : "") +
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
      // Consent rule: in a LIVE room, a trade involving another trainer is
      // ALWAYS an offer — it lands in their 📬 inbox (shared state), so
      // they DON'T have to be in the room right now: they accept or decline
      // from their own phone whenever they next open the app. Brokering
      // someone else's trade stays blocked. Only an unsynced phone
      // (hot-seat, pass-the-phone mode) trades instantly, behind a confirm.
      const me = (window.Sync && Sync.getMe && Sync.getMe()) || "";
      const live = window.Sync && Sync.isLive && Sync.isLive();
      let gate = { kind: "local" };
      if (live && ready) {
        const mine = pick.a.attId === me ? "a" : (pick.b.attId === me ? "b" : "");
        if (!me) gate = { kind: "blocked", why: "🔒 Live room: pick who YOU are first (Settings → You are) — the other trainer then gets this as an offer in their inbox." };
        else if (!mine) gate = { kind: "blocked", why: "🔒 Live room: trades need consent — sign in as one of the two traders. The other side accepts from their own phone." };
        else {
          const them = mine === "a" ? pick.b : pick.a;
          gate = { kind: "offer", mine: mine, them: them, themName: (Store.attendee(them.attId) || {}).name || "They" };
        }
      }
      host.appendChild(el("div", { class: "toolbar", style: { justifyContent: "center" } }, [
        el("button", { class: "btn spin-btn" + (gate.kind === "blocked" ? " off" : ""), onClick: () => {
          if (!ready) { alert("Pick both trainers and the Pokémon they're each giving up."); return; }
          if (gate.kind === "blocked") { alert(gate.why); return; }
          const an = (Store.attendee(pick.a.attId) || {}).name, bn = (Store.attendee(pick.b.attId) || {}).name;
          if (gate.kind === "offer") {
            const my = gate.mine === "a" ? pick.a : pick.b;
            const o = Store.sendTradeOffer(me, my.mon, gate.them.attId, gate.them.mon, undefined, my.shiny, gate.them.shiny);
            if (!o) { alert("That offer isn't allowed — partners stay home."); return; }
            sfx("coin");
            alert("📬 Offer dropped in " + gate.themName + "'s inbox — they accept (or decline) on their phone, even if they open the app later.");
            pick.a.mon = 0; pick.b.mon = 0; pick.a.shiny = false; pick.b.shiny = false;
            render(); renderInbox();
            return;
          }
          if (!confirm("🔁 " + an + "'s " + nameOf(pick.a.mon) + (pick.a.shiny ? " ✨" : "") + " ⇄ " + bn + "'s " + nameOf(pick.b.mon) + (pick.b.shiny ? " ✨" : "") + " — deal?")) return;
          const aSh = !!pick.a.shiny, bSh = !!pick.b.shiny;
          const result = Store.trade(pick.a.attId, pick.a.mon, pick.b.attId, pick.b.mon, undefined, { aShiny: aSh, bShiny: bSh });
          if (!result) { alert("That trade isn't allowed — partners stay home."); return; }
          const aM = pick.a.mon, bM = pick.b.mon;
          pick.a.mon = 0; pick.b.mon = 0; pick.a.shiny = false; pick.b.shiny = false;
          playTrade(an, aM, aSh, bn, bM, bSh, result, () => { render(); renderRecent(); });
        } }, gate.kind === "offer" ? "📬 SEND TRADE OFFER" : "🔁 MAKE THE TRADE"),
      ]));
      if (gate.kind === "offer") host.appendChild(el("p", { class: "hint", style: { textAlign: "center" } },
        "📬 Goes to " + gate.themName + "'s trade inbox — no need for them to be in the room right now."));
      if (gate.kind === "blocked") host.appendChild(el("p", { class: "hint", style: { textAlign: "center" } }, gate.why));
    }

    function renderRecent() {
      recentHost.innerHTML = "";
      const rows = (Store.state.chronicle || []).filter((c) => c.icon === "🔁" || (c.icon === "⚡" && /traded/.test(c.text))).slice(0, 10);
      if (!rows.length) return;
      recentHost.appendChild(el("h2", { class: "section-title" }, "Recent trades"));
      recentHost.appendChild(el("div", { class: "battle-log" }, rows.map((c) =>
        el("div", { class: "battle-log-row" }, c.icon + " " + c.text))));
    }

    renderInbox();
    render();
    renderRecent();
  }

  window.Views = window.Views || {};
  window.Views.trade = view;
})();
