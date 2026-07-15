/* home.js — the front door, focused on the two things this app IS:
   CATCHING and BATTLING. The hero tells the story (friends brought
   together by a shared love of the Pokémon world), the pillars below it
   are the doors — Safari/Pokédex/Trading Post and Arena/Journey/Tower/
   Nuzlocke — plus the signed-in trainer's live career strip and quiet
   doors to the Squad, Party Central and Settings. */
(function () {
  const { el } = U;
  let liveUnsub = null;   // so re-rendering Home doesn't stack live-battle subscribers
  let roomUnsub = null;   // ditto for the hero's live sync-status line
  let hereUnsub = null;   // ditto for the 🟢 here-now ticker

  function view(root) {
    const p = Store.state.party;

    // 🟢 HERE NOW — a ticker across the top of Home: everyone signed in on
    // their phone right now. Tap a face to fire a challenge at them without
    // leaving the page (same single/pair/double picker as the Arena).
    if (window.Sync && Sync.onPresence) {
      const hereHost = el("div", {});
      root.appendChild(hereHost);
      if (hereUnsub) { try { hereUnsub(); } catch (_) {} hereUnsub = null; }
      const paintHere = (list) => {
        hereHost.innerHTML = "";
        if (!Sync.isLive || !Sync.isLive()) return;
        const meC = Sync.myClientId();
        const others = (list || []).filter((q) => q.clientId !== meC && q.attId);
        if (!others.length) return;                        // quiet when you're alone
        hereHost.appendChild(el("div", { class: "here-ticker" },
          [el("span", { class: "here-ticker-lab" }, "🟢 Here now")].concat(others.map((q) => {
            const a = Store.attendee(q.attId);
            const nm = (q.name || (a && a.name) || "Trainer").split(" ")[0];
            const src = a && Store.favSprite ? Store.favSprite(a) : "";
            return el("button", { class: "here-chip", title: "Challenge " + nm + " to a duel", onClick: () => {
              if (window.QuickChallenge) QuickChallenge(q, { onSent: (full) => U.toast("🎮 Challenge sent to " + full + " — waiting on their phone!") });
            } }, [
              src ? el("img", { class: "here-chip-img", src: src, alt: "" }) : el("span", { class: "here-chip-dot" }),
              el("span", { class: "here-chip-nm" }, nm),
              el("span", { class: "here-chip-sword" }, "⚔"),
            ]);
          }))));
      };
      hereUnsub = Sync.onPresence(paintHere);
    }

    // Live-battle strip — lists EVERY room battle currently on, so anyone who
    // dismissed the alert can pick which one to jump into and watch.
    if (window.Sync) {
      const liveHost = el("div", {});
      root.appendChild(liveHost);
      if (liveUnsub) { try { liveUnsub(); } catch (_) {} liveUnsub = null; }
      const paintLive = () => {
        liveHost.innerHTML = "";
        const active = (Sync.liveActive && Sync.liveActive()) || [];
        if (!active.length) return;
        if (active.length > 1) liveHost.appendChild(el("div", { class: "live-head" }, "🔴 " + active.length + " battles live — pick one to watch"));
        active.forEach((d) => {
          const btn = el("button", { class: "btn primary sm" }, "👀 Watch");
          btn.addEventListener("click", () => { if (window.watchLiveBattle) watchLiveBattle(d); });
          liveHost.appendChild(el("div", { class: "live-banner" }, [
            el("span", { class: "live-dot" }),
            el("span", { class: "live-txt" }, "LIVE: " + d.aName + " vs " + d.bName +
              (d.stakes ? " · " + d.stakes : d.event ? " · " + d.event : "")),
            btn,
          ]));
        });
      };
      // Any battle starting/ending re-paints the whole list from liveActive().
      liveUnsub = Sync.onLiveBattle(() => paintLive());
      paintLive();
    }

    // ── THE STORY — what this app is, right at the front door ──────────────
    const hero = el("section", { class: "hero" }, [
      p.heroImage
        ? el("img", { class: "hero-img", src: p.heroImage, alt: p.title })
        : el("div", { class: "hero-ball" }),
      el("div", { class: "hero-badge" }, "For the love of Pokémon"),
      el("h1", { class: "hero-title" }, p.title || "Pokémon Journey"),
      p.subtitle ? el("p", { class: "hero-sub" }, p.subtitle) : null,
      p.location ? el("p", { class: "cd-loc" }, "📍 " + p.location) : null,
      el("p", { class: "hero-blurb" }, "This is a place for friends who grew up loving the world of Pokémon — one app on every phone that turns a room into a region. Catch across all nine generations, battle each other for real, and walk the whole saga side by side: every gym, every Champion, every legend, every film."),
      el("p", { class: "hero-blurb hero-motto" }, "Catch 'em. Battle 'em. Never travel alone."),
      (function roomLine() {
        // The room chip tells the TRUTH about sync — "saved but only on this
        // phone" must never look identical to "live with the crew". Repaints
        // itself as the connection state changes.
        const c = (window.Sync && Sync.getConf && Sync.getConf()) || {};
        const room = (c.room || "").trim();
        const chip = el("a", { class: "hero-room", href: "#/settings" }, "");
        const paint = () => {
          chip.classList.remove("sync-bad");
          if (!room) { chip.textContent = "🔗 Playing solo — join a room in Settings"; return; }
          if (!c.enabled) { chip.textContent = "🔗 Room " + room + " · sync is OFF — tap to turn it on"; return; }
          const st = (window.Sync && Sync.status && Sync.status()) || { state: "off" };
          if (st.state === "error") {
            chip.textContent = "⚠️ Room " + room + " — NOT syncing: " + (st.msg || "can't reach the room") + " (tap to fix)";
            chip.classList.add("sync-bad");
          } else if (st.state === "connecting") chip.textContent = "🔗 Room " + room + " · connecting…";
          else if (st.state === "live") chip.textContent = "🔗 Room " + room + " · ✓ live with the crew";
          else chip.textContent = "🔗 Room " + room + " · waking the connection…";
        };
        if (window.Sync && Sync.onStatus) {
          if (roomUnsub) { try { roomUnsub(); } catch (_) {} }
          roomUnsub = Sync.onStatus(() => { if (chip.isConnected) paint(); });
        }
        paint();
        return chip;
      })(),
      p.blurb ? el("p", { class: "hero-blurb" }, p.blurb) : null,
    ]);
    // The big "Pokémon Journey" block sits right up top, just under the live
    // "here now" / "watch" strips — the front door of the app.
    root.appendChild(hero);

    // ── THE TWO PILLARS — catching and battling. The personal Journey status +
    // Whispers render just below the hero; the tiles + doors come after. ──
    const tile = (q) => el("a", { class: "hq-tile", href: "#/" + q.r }, [
      el("span", { class: "hq-e" }, q.e),
      el("span", { class: "hq-t" }, q.t),
      el("span", { class: "hq-d" }, q.d),
    ]);

    // 🧭 YOUR JOURNEY — the signed-in trainer's battle career, front and
    // center: ladder progress, tower streak, nuzlocke run, dex haul. Every
    // chip is a door to the thing it's bragging about.
    (function journeyStrip() {
      const me = window.Sync && Sync.getMe && Sync.getMe();
      const a = me && Store.attendee(me);
      if (!a || !Store.genCapFor) return;
      const cap = Store.genCapFor(me);
      const goal = Store.nextGenGoal && Store.nextGenGoal(me);
      const tw = Store.towerOf ? Store.towerOf(me) : { streak: 0, best: 0 };
      const run = Store.nuzRun ? Store.nuzRun(me) : null;
      const t = ((Store.state.pokedex || {}).trainers || {})[me] || {};
      const caught = Object.keys(t.caught || {}).length;
      const hisui = Store.hisuiUnlocked && Store.hisuiUnlocked(me);
      const chips = [
        { r: "regions", e: "🧭", t: "Gen " + cap + "/9" + (hisui ? " +⏳" : ""),
          d: goal ? "Next: " + goal.text : "the whole world is open" },
        { r: "tower", e: "🗼", t: tw.streak ? "Streak " + tw.streak : "Best " + (tw.best || 0),
          d: tw.streak ? "floor " + (tw.streak + 1) + " awaits" : (tw.best ? "climb again" : "enter the tower") },
        { r: "nuzlocke", e: run && !run.over ? (run.act === 2 ? "🗻" : "🪦") : "🪦",
          t: run && !run.over ? (run.act === 2 ? "Act II live" : (run.badges || []).length + " badge" + ((run.badges || []).length === 1 ? "" : "s")) : (run && (run.over === "champion" || run.over === "legend") ? "Crowned" : "No run"),
          d: run && !run.over ? run.catches + " caught · " + run.deaths + " lost" : (run && run.over === "legend" ? "🗻 Nuzlocke LEGEND" : run && run.over === "champion" ? "champion — go again?" : "pick a starter") },
        { r: "dex", e: "📕", t: caught + " caught", d: "open the Pokédex" },
      ];
      root.appendChild(el("div", { class: "journey-strip" },
        [el("span", { class: "journey-lab" }, "🎮 " + a.name.split(" ")[0] + "'s journey")].concat(
          chips.map((c) => el("a", { class: "journey-chip", href: "#/" + c.r }, [
            el("span", { class: "jc-e" }, c.e),
            el("span", {}, [el("span", { class: "jc-t" }, c.t), el("span", { class: "jc-d" }, c.d)]),
          ])))));
    })();

    // 🔮 WHISPERS — the tease layer: the nearest LOCKED mysteries for the
    // signed-in trainer, counted but never named. Reasons to keep going.
    (function whispers() {
      const me = window.Sync && Sync.getMe && Sync.getMe();
      if (!me || !Store.attendee(me)) return;
      const lines = [];
      const goal = Store.nextGenGoal && Store.nextGenGoal(me);
      if (goal) lines.push("🔒 A new generation stirs beyond your reach — " + goal.text + ".");
      const lw = Store.leagueWins(me);
      const films = (window.MOVIE_BOSSES || []).filter((b) => lw.indexOf(b.needs || "lance") < 0).length;
      if (films) lines.push("🎬 " + films + " film" + (films > 1 ? "s are" : " is") + " showing in eras you haven't conquered…");
      const myst = (window.LEAGUE_STAGES || []).filter((st) => st.mystery &&
        !Store.state.attendees.some((a) => Store.leagueWins(a.id).indexOf(st.key) >= 0)).length;
      if (myst) lines.push("👑 " + myst + " unnamed silhouette" + (myst > 1 ? "s" : "") + " hold" + (myst > 1 ? "" : "s") + " a throne nobody in this room has seen.");
      const secrets = ((window.LegendChallenge && LegendChallenge.SPECIALS) || []).filter((sp) => Store.secretWins(me).indexOf(sp.key) < 0).length;
      if (secrets) lines.push("🌌 " + secrets + " sealed story beat" + (secrets > 1 ? "s" : "") + " wait" + (secrets > 1 ? "" : "s") + " past badges you don't have yet…");
      const slots = (Store.NUZ_SLOTS || []).filter((k) => !Store.nuzRun(me, k)).length;
      if (slots) lines.push("🪦 " + slots + " permadeath epic" + (slots > 1 ? "s have" : " has") + " never been written on your card.");
      if (!lines.length) lines.push("🏆 Nothing left is hidden from you. The saga is yours.");
      root.appendChild(el("div", { class: "whispers" },
        [el("div", { class: "whispers-head" }, "🔮 Whispers")].concat(
          lines.slice(0, 3).map((t) => el("div", { class: "whisper" }, t)))));
    })();

    // ── THE TWO PILLARS — catching and battling, below the personal status ──
    root.appendChild(el("h2", { class: "section-title" }, "🔴 Catch 'em"));
    root.appendChild(el("div", { class: "home-quick six" }, [
      { r: "safari",  e: el("span", { class: "pokeball-ico", "aria-label": "Poké Ball" }), t: "Safari Zone",    d: "Berries, rocks, throw — Gen 1-9, shinies 1-in-20" },
      { r: "dex",     e: "📕", t: "Pokédex",        d: "Every collection — Hisui, Unown, Mega, Trainers" },
      { r: "trade",   e: "🔁", t: "Trading Post",   d: "Swap with friends — some only evolve by trade" },
    ].map(tile)));
    root.appendChild(el("h2", { class: "section-title" }, "⚔️ Battle 'em"));
    root.appendChild(el("div", { class: "home-quick" }, [
      { r: "battle",   e: "⚔️", t: "Battle Arena",  d: "Real duels, friend vs friend" },
      { r: "regions",  e: "🗺", t: "The Journey",   d: "Nine regions — ⚔ Challenge or 📖 True Story" },
      { r: "tower",    e: "🗼", t: "Battle Tower",  d: "Streaks, PALMER, the Legends floor" },
      { r: "cups",     e: "🏟", t: "Stadium Cups",  d: "Baby · Poké · Prime · Rental" },
      { r: "nuzlocke", e: "🪦", t: "Nuzlocke Run",  d: "Seven permadeath epics" },
    ].map(tile)));

    // Quiet doors — the crew, the full mode guide, and Settings. Kept above the
    // marketing hero so the useful stuff is reachable without scrolling.
    // (The old "Every way to play" directory is now its own page at #/guide.)
    root.appendChild(el("div", { class: "home-quick home-doors" }, [
      { r: "roster",      e: "🎴", t: "Squad",             d: "The trainers" },
      { r: "leaderboard", e: "🏆", t: "Leaderboard",       d: "The squad, ranked" },
      { r: "draft",       e: "🏆", t: "Draft Teams",       d: "Squads for Victory Road" },
      { r: "guide",       e: "🧭", t: "Every Way to Play", d: "The full mode directory" },
      { r: "settings",    e: "⚙️", t: "Settings",          d: "Room & sync" },
    ].map(tile)));
  }

  window.Views = window.Views || {};
  window.Views.home = view;
})();
