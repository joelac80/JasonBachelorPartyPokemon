/* trade.js — the Trading Post. 1-for-1 Pokémon swaps between trainers,
   link-cable style. Partner favorites are untradeable (a trainer keeps
   their partner) unless a spare wild copy was caught. Kadabra, Machoke,
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
    // the other trainer — no need to be in the room when one is sent. The
    // section is ALWAYS shown (with a hint when empty) so it's discoverable,
    // and split into what's offered to you vs. what you've sent.
    function offerCard(o, kind) {
      const fromN = (Store.attendee(o.from) || {}).name || "?", toN = (Store.attendee(o.to) || {}).name || "?";
      let controls;
      if (kind === "in") {
        controls = [
          el("button", { class: "btn primary sm", onClick: () => {
            const gSh = !!o.giveShiny, wSh = !!o.wantShiny;
            const r = Store.resolveTradeOffer(o.id, true);
            if (!r.ok) { alert(r.why); renderInbox(); renderRecent(); return; }
            sfx("win");
            playTrade(fromN, o.give, gSh, toN, o.want, wSh, r.result, () => { renderInbox(); render(); renderRecent(); });
          } }, "✅ Accept"),
          el("button", { class: "btn subtle sm", onClick: () => { Store.resolveTradeOffer(o.id, false); sfx("error"); renderInbox(); } }, "❌ Decline"),
        ];
      } else if (kind === "out") {
        controls = [
          el("span", { class: "hint" }, "⏳ waiting on " + toN + "…"),
          // ✏️ Edit = pull this offer back into the picker so you can tweak it,
          // then re-send. (It's retracted first so it can't double-fire.)
          el("button", { class: "btn subtle sm", onClick: () => {
            pick.a.attId = o.from; pick.a.mon = o.give; pick.a.shiny = !!o.giveShiny;
            pick.b.attId = o.to;   pick.b.mon = o.want; pick.b.shiny = !!o.wantShiny;
            Store.cancelTradeOffer(o.id); sfx("select");
            renderInbox(); render();
            try { host.scrollIntoView({ behavior: "smooth", block: "start" }); } catch (_) {}
          } }, "✏️ Edit"),
          el("button", { class: "btn danger sm", onClick: () => {
            U.ask("Retract your offer to " + toN + "?", { icon: "⚠️", danger: true }, () => {
            Store.cancelTradeOffer(o.id); sfx("error"); renderInbox();
          });
      } }, "↩ Retract"),
        ];
      } else {
        controls = [el("span", { class: "hint" }, fromN + " → " + toN + " · waiting")];
      }
      return el("div", { class: "trade-offer" + (kind === "in" ? " mine" : "") }, [
        el("div", { class: "trade-offer-mons" }, [
          el("img", { src: spriteOf(o.give, o.giveShiny), alt: "" }),
          el("span", { class: "trade-offer-arrow" }, "⇄"),
          el("img", { src: spriteOf(o.want, o.wantShiny), alt: "" }),
        ]),
        el("div", { class: "trade-offer-txt" },
          fromN + " offers " + nameOf(o.give) + (o.giveShiny ? " ✨" : "") + " for " + toN + "'s " + nameOf(o.want) + (o.wantShiny ? " ✨" : "")),
        el("div", { class: "toolbar" }, controls),
      ]);
    }

    function renderInbox() {
      inboxHost.innerHTML = "";
      const me = (window.Sync && Sync.getMe && Sync.getMe()) || "";
      const all = ((Store.state.pokedex || {}).offers) || [];
      const open = all.filter((o) => o.status === "open");
      inboxHost.appendChild(el("h2", { class: "section-title" }, "📬 Trade Inbox"));

      if (!me) {
        inboxHost.appendChild(el("p", { class: "hint" }, open.length
          ? (open.length + " open offer" + (open.length > 1 ? "s" : "") + " below. Set who you are (Settings → “You are”) to accept or retract.")
          : "Set who you are (Settings → “You are”) to send and receive trade offers."));
      }

      const forMe = open.filter((o) => me && o.to === me);
      const byMe  = open.filter((o) => me && o.from === me);
      const others = open.filter((o) => !me || (o.to !== me && o.from !== me));

      if (forMe.length) {
        inboxHost.appendChild(el("h3", { class: "trade-sub" }, "📥 Offered to you"));
        inboxHost.appendChild(el("div", { class: "trade-inbox" }, forMe.map((o) => offerCard(o, "in"))));
      }
      if (byMe.length) {
        inboxHost.appendChild(el("h3", { class: "trade-sub" }, "📤 You sent"));
        inboxHost.appendChild(el("div", { class: "trade-inbox" }, byMe.map((o) => offerCard(o, "out"))));
      }
      if (others.length) {
        if (me) inboxHost.appendChild(el("h3", { class: "trade-sub" }, "🌐 Other open offers"));
        inboxHost.appendChild(el("div", { class: "trade-inbox" }, others.map((o) => offerCard(o, "other"))));
      }
      if (me && !forMe.length && !byMe.length && !others.length) {
        inboxHost.appendChild(el("p", { class: "hint" }, "No open trade offers right now — make one below and it lands in their inbox."));
      }

      // 🕘 History: recently settled offers you were part of, so you can see
      // what you sent / were offered even after it closes.
      const settled = all.filter((o) => o.status !== "open" && (!me || o.from === me || o.to === me)).slice(0, 6);
      if (settled.length) {
        inboxHost.appendChild(el("details", { class: "trade-history" }, [
          el("summary", {}, "🕘 Recent offer history"),
          el("div", { class: "battle-log" }, settled.map((o) => {
            const fromN = (Store.attendee(o.from) || {}).name || "?", toN = (Store.attendee(o.to) || {}).name || "?";
            const icon = o.status === "accepted" ? "✅" : o.status === "declined" ? "❌" : o.status === "cancelled" ? "↩" : "⌛";
            return el("div", { class: "battle-log-row" }, icon + " " + fromN + "'s " + nameOf(o.give) + (o.giveShiny ? " ✨" : "") +
              " ⇄ " + toN + "'s " + nameOf(o.want) + (o.wantShiny ? " ✨" : "") + " — " + o.status);
          })),
        ]));
      }
    }

    function sideCard(key, title, cls, opts) {
      opts = opts || {};
      const d = pick[key];
      const other = pick[key === "a" ? "b" : "a"];
      const kids = [el("div", { class: "arena-side-title" }, title)];
      if (opts.fixedAttId) {
        // Your side is locked to YOU — you can only ever give away your own
        // Pokémon, so no picker here, just your badge.
        d.attId = opts.fixedAttId;
        const a = Store.attendee(d.attId) || {};
        kids.push(el("div", { class: "trade-you-chip" }, [
          a.favoriteId ? el("img", { class: "sl-thumb", src: Store.sprite(a.favoriteId), alt: "" }) : el("span", { class: "draft-thumb-ball" }),
          el("span", {}, a.name || "You"),
        ]));
      } else {
        const sel = el("select", { class: "in" }, [el("option", { value: "" }, "Pick a trainer…")]
          .concat(Store.state.attendees
            .filter((a) => a.id !== opts.excludeId)
            .map((a) => el("option", { value: a.id, disabled: a.id === other.attId ? "true" : null }, a.name))));
        sel.value = d.attId;
        sel.addEventListener("change", () => { d.attId = sel.value; d.mon = 0; d.shiny = false; render(); });
        kids.push(sel);
      }
      if (d.attId) {
        const att = Store.attendee(d.attId);
        const pool = Duel.poolFor(d.attId);
        const anyTradeable = pool.some((id) => Store.canTrade(d.attId, id));
        if (!anyTradeable)
          kids.push(el("p", { class: "hint" }, "Nothing tradeable yet — the partner stays, catch more in the Safari!"));
        // One entry per HELD variant — a normal and a shiny of the same species
        // both appear so a trainer can send exactly the one they mean.
        const entries = [];
        pool.forEach((id) => {
          const vs = variantsFor(d.attId, id);
          if (vs.length) vs.forEach((sh) => entries.push({ id: id, shiny: sh }));
          else entries.push({ id: id, shiny: shinyOf(d.attId, id) });   // partner / not-yet-caught → shows locked
        });
        kids.push(el("div", { class: "duel-pick-row trade-pick-grid" + (d.mon ? " has-pick" : "") }, entries.map((e) => {
          const id = e.id, shiny = e.shiny;
          const ok = Store.canTrade(d.attId, id);
          const locked = att && att.favoriteId === id && !ok;
          const bothVariants = variantsFor(d.attId, id).length > 1;
          const on = d.mon === id && !!d.shiny === !!shiny;
          const src = spriteOf(id, shiny);
          const btn = el("button", { class: "duel-pick" + (on ? " on" : "") + (ok ? "" : " locked") + (shiny ? " is-shiny" : ""),
            title: nameOf(id) + (shiny ? " ✨ SHINY" : "") + (id === 10094 ? " — he chose YOU, untradeable ⚡" : locked ? " — partner, untradeable ❤" : ""),
            onClick: () => {
              if (!ok) { sfx("error"); return; }
              // Tapping the already-selected mon unpicks it.
              if (on) { d.mon = 0; d.shiny = false; } else { d.mon = id; d.shiny = shiny; }
              render();
            } }, [
            src ? el("img", { src: src, alt: nameOf(id) }) : el("span", { class: "draft-thumb-ball" }),
            shiny ? el("span", { class: "duel-pick-shiny" }, "✨") : null,
            locked ? el("span", { class: "duel-pick-n lock" }, "🔒") : null,
            on ? el("span", { class: "duel-pick-n sel" }, "✓") : null,
          ]);
          // Label disambiguates when both forms are shown; still flags a lone shiny.
          const lab = bothVariants ? (shiny ? "✨ Shiny" : "Normal") : (shiny ? "✨ Shiny" : "");
          return el("div", { class: "trade-pick-cell" }, [
            btn,
            lab ? el("div", { class: "trade-pick-lab" + (shiny ? " shiny" : "") }, lab) : null,
          ]);
        })));
        // Loud selection banner — sprite + name in a green card so there's
        // never any doubt about which mon is on the table for this side.
        if (d.mon) {
          const evo = Store.TRADE_EVOS[d.mon];
          kids.push(el("div", { class: "trade-sel" }, [
            el("img", { src: spriteOf(d.mon, d.shiny), alt: "" }),
            el("div", {}, [
              el("div", { class: "trade-sel-name" }, "✅ " + nameOf(d.mon) + (d.shiny ? " ✨ SHINY" : "")),
              el("div", { class: "trade-sel-sub" }, evo
                ? "⚡ Evolves into " + nameOf(evo) + " when traded!"
                : "Tap it again to unpick, or tap another to swap."),
            ]),
          ]));
        } else {
          kids.push(el("div", { class: "duel-pick-meta" }, "👆 Tap a Pokémon to select it."));
        }
      }
      return el("div", { class: "arena-side " + cls }, kids);
    }

    function render() {
      host.innerHTML = "";
      const me = (window.Sync && Sync.getMe && Sync.getMe()) || "";
      if (me) {
        // Identity set → you always trade AS yourself: side A is locked to you,
        // side B is whoever you want to trade with. Reset any stale picks that
        // don't fit (e.g. you were previously on the other side).
        if (pick.a.attId !== me) { pick.a.attId = me; pick.a.mon = 0; pick.a.shiny = false; }
        if (pick.b.attId === me) { pick.b.attId = ""; pick.b.mon = 0; pick.b.shiny = false; }
        host.appendChild(el("div", { class: "arena-grid" }, [
          sideCard("a", "🔵 You give…", "blue", { fixedAttId: me }),
          el("div", { class: "arena-vs" }, "⇄"),
          sideCard("b", "🔴 You want… (from)", "red", { excludeId: me }),
        ]));
      } else {
        // No identity chosen (hot-seat / pass-the-phone): keep the full picker,
        // but nudge toward setting who you are for the simpler solo flow.
        host.appendChild(el("p", { class: "hint", style: { marginTop: "0" } },
          "Tip: set who you are in Settings → “You are” to trade as yourself with one tap."));
        host.appendChild(el("div", { class: "arena-grid" }, [
          sideCard("a", "🔵 Trainer A gives…", "blue", {}),
          el("div", { class: "arena-vs" }, "⇄"),
          sideCard("b", "🔴 Trainer B gives…", "red", {}),
        ]));
      }
      const ready = pick.a.attId && pick.b.attId && pick.a.mon && pick.b.mon;
      // Consent rule: in a LIVE room, a trade involving another trainer is
      // ALWAYS an offer — it lands in their 📬 inbox (shared state), so
      // they DON'T have to be in the room right now: they accept or decline
      // from their own phone whenever they next open the app. Brokering
      // someone else's trade stays blocked. Only an unsynced phone
      // (hot-seat, pass-the-phone mode) trades instantly, behind a confirm.
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
          if (!ready) { alert(me ? "Pick the Pokémon you'll give, the trainer you want, and which of theirs you want." : "Pick both trainers and the Pokémon they're each giving up."); return; }
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
          U.ask("🔁 " + an + "'s " + nameOf(pick.a.mon) + (pick.a.shiny ? " ✨" : "") + " ⇄ " + bn + "'s " + nameOf(pick.b.mon) + (pick.b.shiny ? " ✨" : "") + " — deal?", { icon: "❓" }, () => {
          const aSh = !!pick.a.shiny, bSh = !!pick.b.shiny;
          const result = Store.trade(pick.a.attId, pick.a.mon, pick.b.attId, pick.b.mon, undefined, { aShiny: aSh, bShiny: bSh });
          if (!result) { alert("That trade isn't allowed — partners stay home."); return; }
          const aM = pick.a.mon, bM = pick.b.mon;
          pick.a.mon = 0; pick.b.mon = 0; pick.a.shiny = false; pick.b.shiny = false;
          playTrade(an, aM, aSh, bn, bM, bSh, result, () => { render(); renderRecent(); });
        });
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

    // 🔄 Live-sync updates must NOT rebuild the whole page here: a full
    // Router.render() re-enters view() and wipes your half-composed offer
    // (the `pick` state lives in this closure), so a busy room made the
    // screen "keep refreshing" mid-pick. Instead, refresh the three
    // sections in place — they re-read fresh Store state (new offers show
    // up, accepted trades update your pool) while your picks survive.
    // Router clears this hook the moment you navigate away.
    window.__deferRender = function () {
      try { renderInbox(); render(); renderRecent(); } catch (_) {}
      return true;
    };
  }

  window.Views = window.Views || {};
  window.Views.trade = view;
})();
