/* app.js — bootstrap: register views, wire nav, start router. */
(function () {
  const V = window.Views || {};
  Router.add("home", V.home)
    .add("victoryroad", V.victoryroad)
    .add("draft", V.draft)
    .add("roster", V.roster)
    .add("activities", V.activities)
    .add("jeopardy", V.jeopardy)
    .add("brackets", V.brackets)
    .add("battle", V.battle)
    .add("safari", V.safari)
    .add("drinks", V.drinks)
    .add("tracker", V.tracker)
    .add("trade", V.trade)
    .add("gyms", V.gyms)
    .add("league", V.league)
    .add("predictions", V.predictions)
    .add("cards", V.cards)
    .add("superlatives", V.superlatives)
    .add("challenges", V.challenges)
    .add("badges", V.badges)
    .add("hall", V.hall)
    .add("ceremony", V.ceremony)
    .add("timeline", V.timeline)
    .add("stats", V.stats)
    .add("messages", V.messages)
    .add("poster", V.poster)
    .add("settings", V.settings)
    .add("help", V.help);
  Router.setNotFound(V.home);

  // Brand: your Pokémon (sprite + name) when signed in as a trainer, else the
  // party title. Evolving updates it live (currentForm is re-read on change).
  function syncTitle() {
    const t = (Store.state.party && Store.state.party.title) || "Bachelor Party HQ";
    document.title = t;
    const brand = document.getElementById("brand-title");
    const ball = document.querySelector(".brand-ball");
    const me = window.Sync && Sync.getMe && Sync.getMe();
    const a = me && Store.attendee(me);
    if (!brand) return;
    if (a) {
      const f = Store.currentForm(a);
      brand.textContent = f.name || a.name.split(" ")[0];
      const spr = f.id && Store.sprite(f.id);
      if (ball) {
        if (spr) { ball.innerHTML = '<img src="' + spr + '" alt="">'; ball.classList.add("mon"); }
        else { ball.textContent = "◓"; ball.classList.remove("mon"); }
      }
    } else {
      brand.textContent = t;
      if (ball) { ball.textContent = "◓"; ball.classList.remove("mon"); }
    }
  }
  Store.subscribe(syncTitle);
  window.addEventListener("sync-me", syncTitle);
  syncTitle();

  // Sound on/off toggle (retro SFX).
  const sfxBtn = document.getElementById("sfx-toggle");
  if (sfxBtn && window.SFX) {
    const syncSfx = () => { sfxBtn.textContent = SFX.isMuted() ? "🔇" : "🔊"; };
    syncSfx();
    sfxBtn.addEventListener("click", () => { SFX.toggle(); syncSfx(); });
  } else if (sfxBtn) {
    sfxBtn.style.display = "none";
  }

  // Music on/off toggle (background chiptune).
  const musicBtn = document.getElementById("music-toggle");
  if (musicBtn && window.SFX && SFX.toggleMusic) {
    const syncMusic = () => { musicBtn.classList.toggle("off", !SFX.isMusicOn()); };
    syncMusic();
    musicBtn.addEventListener("click", () => { SFX.toggleMusic(); syncMusic(); });
  } else if (musicBtn) {
    musicBtn.style.display = "none";
  }

  // Mobile nav toggle.
  const toggle = document.getElementById("nav-toggle");
  const nav = document.getElementById("nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => nav.classList.toggle("open"));
    nav.addEventListener("click", (e) => {
      if (e.target.closest("a")) nav.classList.remove("open");
    });
  }

  // ---- PWA: service worker + notifications --------------------------------
  // iPhones only support web notifications for Home-Screen-installed apps
  // (iOS 16.4+), and Android Chrome requires the service-worker path — so all
  // notifications route through the registration, not new Notification().
  if ("serviceWorker" in navigator) {
    try { navigator.serviceWorker.register("sw.js"); } catch (_) {}
  }
  function showNote(title, body) {
    const opts = { body: body, icon: "assets/icon-192.png", badge: "assets/icon-192.png", tag: "bachhub" };
    const fallback = () => { try { new Notification(title, opts); } catch (_) {} };
    if (navigator.serviceWorker && navigator.serviceWorker.getRegistration) {
      navigator.serviceWorker.getRegistration()
        .then((reg) => { if (reg && reg.showNotification) reg.showNotification(title, opts); else fallback(); })
        .catch(fallback);
    } else fallback();
  }
  function notify(title, body) {
    try {
      if (!("Notification" in window) || Notification.permission !== "granted") return;
      if (document.visibilityState === "visible") return;   // in-app modal covers foreground
      showNote(title, body);
    } catch (_) {}
  }
  window.AppNotify = {
    supported() { return "Notification" in window; },
    installed() { return (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true; },
    permission() { return ("Notification" in window) ? Notification.permission : "unsupported"; },
    request(cb) {
      try {
        const p = Notification.requestPermission((r) => cb && cb(r));
        if (p && p.then) p.then((r) => cb && cb(r));
      } catch (_) { cb && cb("unsupported"); }
    },
    // Delayed test so you can background the app and see it arrive.
    test() { setTimeout(() => { try { showNote("🔔 It works!", "Notifications are live — see you at the lake."); } catch (_) {} }, 4000); },
    // Visibility-guarded ping for app code (e.g. "your move" in remote duels).
    ping(title, body) { notify(title, body); },
  };

  Router.start();

  // Optional live sync — connects only if a room was configured + enabled.
  if (window.Sync && Sync.init) {
    const dot = document.getElementById("sync-dot");
    if (dot) {
      const COLOR = { live: "#2ec96b", connecting: "#e6a100", error: "#e6352f", off: "#888" };
      const TITLE = { live: "Live — synced with the room", connecting: "Connecting to the room…", error: "Sync error — tap for Settings", off: "Sync off" };
      Sync.onStatus((state, msg) => {
        dot.style.display = state === "off" ? "none" : "inline-block";
        dot.dataset.state = state;
        dot.style.setProperty("--dot", COLOR[state] || "#888");
        dot.title = (state === "live" && msg && msg !== "Synced") ? "Live — " + msg : (TITLE[state] || "Live sync");
      });
    }
    Sync.init();

    // First-open onboarding tour: six quick slides that walk a fresh phone
    // through the weekend — including picking your trainer + room code —
    // skippable at any moment. Replayable from the Field Guide.
    try {
      if (window.Onboard) setTimeout(() => Onboard.start(), 500);
    } catch (_) {}

    // Incoming battle challenge → prompt to accept anywhere in the app.
    // kind "duel" = a real remote duel: accepting opens your party picker,
    // then this phone writes the matchup so both phones (and watchers) open.
    const el = U.el;
    Sync.onChallengeIncoming((ch) => {
      if (!window.Modal) return;
      // 🔁 Trade offer — the other trainer consents on THEIR phone.
      if (ch.kind === "trade" && window.TradeFX) {
        const give = (ch.party || [])[0], want = (ch.pairParty || [])[0];
        notify("🔁 Trade offer!", (ch.fromName || "Someone") + " offers " + TradeFX.nameOf(give) + " for your " + TradeFX.nameOf(want));
        if (window.SFX && SFX.select) SFX.select();
        let tctrl;
        const tbody = el("div", { class: "chal-modal" }, [
          el("div", { class: "chal-line" }, "🔁 " + (ch.fromName || "Someone") + " offers their " + TradeFX.nameOf(give) + " for your " + TradeFX.nameOf(want) + "!"),
          el("div", { class: "trade-offer-row" }, [
            el("img", { class: "evo-prompt-img", src: TradeFX.spriteOf(give, TradeFX.shinyOf(ch.fromAtt, give)), alt: "" }),
            el("span", { class: "trade-arrows" }, "⇄"),
            el("img", { class: "evo-prompt-img", src: TradeFX.spriteOf(want, TradeFX.shinyOf(ch.toAtt, want)), alt: "" }),
          ]),
          el("div", { class: "toolbar" }, [
            el("button", { class: "btn primary", onClick: () => {
              if (tctrl) tctrl.close();
              const me = Sync.getMe();
              if (!me) { alert("Pick who you are first — Settings → “You are”."); return; }
              const aSh = TradeFX.shinyOf(ch.fromAtt, give), bSh = TradeFX.shinyOf(me, want);
              const result = Store.trade(ch.fromAtt, give, me, want);
              if (!result) { alert("That trade isn't valid anymore (already traded away?)."); Sync.respondChallenge(ch, false); return; }
              Sync.respondChallenge(ch, true);
              TradeFX.play(ch.fromName || "They", give, aSh, (Store.attendee(me) || {}).name || "You", want, bSh, result, function () {});
            } }, "🤝 Accept trade"),
            el("button", { class: "btn subtle", onClick: () => { Sync.respondChallenge(ch, false); if (tctrl) tctrl.close(); } }, "Decline"),
          ]),
        ]);
        tctrl = Modal.open("Trade offer!", tbody, null, { noFooter: true });
        return;
      }
      const isDuel = ch.kind === "duel";
      notify(isDuel ? "🎮 Duel challenge!" : "⚔ You've been challenged!",
        (ch.fromName || "Someone") + (isDuel ? " wants a Pokémon Duel" : " wants to battle") + (ch.event ? " · " + ch.event : ""));
      if (window.SFX && SFX.select) SFX.select();
      let ctrl;
      const isDouble = isDuel && (!!ch.pairAtt || !!ch.solo2);
      // A partner signed in on their own phone plays their own turns —
      // otherwise their side's lead phone drives both units.
      const clientOf = (attId, fallback) => {
        const p = (Sync.presence() || []).find((x) => x.attId === attId);
        return (p && p.clientId) || fallback;
      };
      const launch = (bUnits) => {
        Sync.respondChallenge(ch, true);
        let aUnits;
        if (ch.solo2) {          // one trainer running both slots
          aUnits = (ch.party || []).slice(0, 2).map((id) => ({ attId: ch.fromAtt, client: ch.fromClient, monIds: [id] }));
        } else {
          aUnits = [{ attId: ch.fromAtt, client: ch.fromClient, monIds: ch.party || [] }];
          if (ch.pairAtt) aUnits.push({ attId: ch.pairAtt, client: clientOf(ch.pairAtt, ch.fromClient), monIds: ch.pairParty || [] });
        }
        const aLead = Duel.statsFor((ch.party || [])[0] || 1).x, bLead = Duel.statsFor(bUnits[0].monIds[0]).x;
        const setup = {
          title: ch.event || "Duel",
          first: aLead === bLead ? (Math.random() < 0.5 ? "a" : "b") : (aLead > bLead ? "a" : "b"),
          a: { units: aUnits }, b: { units: bUnits },
        };
        const names = (us) => us.map((u) => (Store.attendee(u.attId) || {}).name || "?").join(" & ");
        Sync.startRemoteDuel(setup);
        Sync.startLiveBattle({ aName: names(aUnits), bName: names(bUnits),
          event: setup.title, aClient: ch.fromClient, bClient: Sync.myClientId(), mode: "duel-remote" });
      };
      const accept = () => {
        if (ctrl) ctrl.close();
        if (!isDuel) { Sync.respondChallenge(ch, true); return; }
        const me = Sync.getMe();
        if (!me) { alert("Pick who you are first — Settings → “You are”."); return; }
        if (!isDouble) {
          Duel.pickParty({ attId: me, title: "Choose your party",
            hint: (ch.fromName || "They") + " brought " + ((ch.party || []).length || 1) + ". Tap Pokémon in order — the first is your lead.",
            onDone: (ids) => launch([{ attId: me, client: Sync.myClientId(), monIds: ids }]) });
          return;
        }
        // Double battle: fight with a partner, or run two of your own.
        let styleCtrl;
        const withPartner = () => {
          Duel.pickParty({ attId: me, max: 1, title: "Your Pokémon (double battle)", onDone: (mine) => {
            Duel.pickTrainer({ exclude: [me, ch.fromAtt, ch.pairAtt].filter(Boolean), title: "Pick your partner",
              hint: "They fight beside you. If they're in the room on their own phone, they'll play their own turns.",
              onDone: (ally) => {
                const allyName = (Store.attendee(ally) || {}).name || "Partner";
                Duel.pickParty({ attId: ally, max: 1, title: allyName + "'s Pokémon", onDone: (theirs) => {
                  launch([
                    { attId: me, client: Sync.myClientId(), monIds: mine },
                    { attId: ally, client: clientOf(ally, Sync.myClientId()), monIds: theirs },
                  ]);
                } });
              } });
          } });
        };
        const solo = () => {
          Duel.pickParty({ attId: me, min: 2, max: 2, title: "Pick TWO Pokémon", hint: "Both fight at the same time.",
            onDone: (ids) => launch(ids.map((id) => ({ attId: me, client: Sync.myClientId(), monIds: [id] }))) });
        };
        const sBody = el("div", { class: "chal-modal" }, [
          el("div", { class: "chal-line" }, "How does your side fight?"),
          el("div", { class: "toolbar" }, [
            el("button", { class: "btn primary", onClick: () => { styleCtrl.close(); withPartner(); } }, "🤝 With a partner"),
            el("button", { class: "btn primary", onClick: () => { styleCtrl.close(); solo(); } }, "🐾 Solo — 2 Pokémon"),
          ]),
        ]);
        styleCtrl = Modal.open("Double battle!", sBody, null, { noFooter: true });
      };
      const pairName = ch.pairAtt ? ((Store.attendee(ch.pairAtt) || {}).name || "a partner") : "";
      const body = el("div", { class: "chal-modal" }, [
        el("div", { class: "chal-line" }, (isDuel ? "🎮 " : "⚔ ") + (ch.fromName || "Someone") +
          (ch.solo2 ? " challenges you to a DOUBLE battle, running two of their own Pokémon — bring a partner or go solo!"
            : ch.pairAtt ? " & " + pairName + " challenge you to a DOUBLE battle — grab a partner (or go solo with 2)!"
            : isDuel ? " challenges you to a Pokémon Duel! (bringing " + ((ch.party || []).length || 1) + ")"
            : " challenges you to a battle!")),
        ch.event ? el("div", { class: "chal-ev" }, "Event: " + ch.event) : null,
        el("div", { class: "toolbar" }, [
          el("button", { class: "btn primary", onClick: accept },
            isDouble ? "✅ Accept & pick your pair" : isDuel ? "✅ Accept & pick your party" : "✅ Accept & battle"),
          el("button", { class: "btn subtle", onClick: () => { Sync.respondChallenge(ch, false); if (ctrl) ctrl.close(); } }, "Decline"),
        ]),
      ]);
      ctrl = Modal.open(isDuel ? "Duel challenge!" : "Battle challenge!", body, null, {});
    });

    // On accept, the challenger broadcasts a live battle for the whole room.
    // (Duel challenges skip this — the accepter announces via the duel doc.)
    Sync.onChallengeAccepted((ch) => {
      if (ch.kind === "duel") return;
      // Trade accepted → the offerer's phone celebrates too (state syncs in).
      if (ch.kind === "trade") {
        if (ch.fromClient === Sync.myClientId() && window.TradeFX) {
          const give = (ch.party || [])[0], want = (ch.pairParty || [])[0];
          const EV = Store.TRADE_EVOS || {};
          const result = { toB: EV[give] || give, toA: EV[want] || want, evoB: !!EV[give], evoA: !!EV[want] };
          TradeFX.play(ch.fromName || "You", give, TradeFX.shinyOf(ch.fromAtt, give),
            ch.toName || "They", want, TradeFX.shinyOf(ch.toAtt, want), result, function () {});
          if (window.SFX && SFX.win) SFX.win();
        }
        return;
      }
      if (ch.fromClient === Sync.myClientId()) {
        Sync.startLiveBattle({ aName: ch.fromName, bName: ch.toName, event: ch.event, aClient: ch.fromClient, bClient: ch.toClient });
      }
    });

    // Remote duel doc → participants' screens open automatically; every
    // snapshot feeds the turn acts into any open duel screen (players and
    // spectators replay the exact same acts).
    const duelScreens = {};
    let latestDuel = null;
    Sync.onDuel((data) => {
      latestDuel = data;
      if (!data || !data.id || !data.setupJson) return;
      let setup; try { setup = JSON.parse(data.setupJson); } catch (_) { return; }
      const me = Sync.myClientId();
      const units = (setup.a.units || []).concat(setup.b.units || []);
      const mine = units.some((u) => u.client === me);
      const fresh = !data.t || (Date.now() - data.t) < 1800000;   // ignore stale docs (30 min)
      if (data.state === "live" && mine && fresh && !duelScreens[data.id]) {
        duelScreens[data.id] = Duel.start(Object.assign({}, setup, {
          mode: "remote", myClient: me,
          net: { send: Sync.sendDuelAct },
          onEnd: () => { delete duelScreens[data.id]; },
        }));
      }
      const h = duelScreens[data.id];
      if (h) {
        h.receiveActs(data.acts || []);
        if (h.receiveRx) h.receiveRx(data.rx || []);
      }
    });
    // 🌩 roaming legendary — alert every phone, first catch wins.
    const handledRoam = {};
    Sync.onRoam((data) => {
      if (!data || !data.id) return;
      if (data.state === "live" && !handledRoam[data.id]) {
        handledRoam[data.id] = 1;
        if (data.t && Date.now() - data.t > 1200000) return;   // stale event
        const nm = (window.DEX && DEX[data.monId] && DEX[data.monId].n) || "legendary";
        notify("🌩 Roaming legendary!", "A wild " + nm + " is loose — first catch claims it!");
        if (window.SFX && SFX.fanfare) SFX.fanfare();
        let rctrl;
        const rbody = el("div", { class: "chal-modal" }, [
          el("div", { class: "chal-line" }, "🌩 A wild " + nm.toUpperCase() + " is ROAMING the lake house! First trainer to catch it claims the only one in the region."),
          el("div", { class: "toolbar" }, [
            el("button", { class: "btn primary", onClick: () => { if (rctrl) rctrl.close(); location.hash = "#/safari"; } }, "🎯 Hunt it"),
            el("button", { class: "btn subtle", onClick: () => { if (rctrl) rctrl.close(); } }, "Let it roam"),
          ]),
        ]);
        rctrl = Modal.open("Roaming legendary!", rbody, null, { noFooter: true });
      }
      if (data.state === "done" && data.claimedBy && !handledRoam[data.id + "d"]) {
        handledRoam[data.id + "d"] = 1;
        notify("🌩 Claimed!", data.claimedBy + " caught the roaming legendary!");
      }
    });

    function openDuelWatch() {
      const d = latestDuel;
      if (!d || !d.id || !d.setupJson || d.state !== "live" || duelScreens[d.id]) return;
      let setup; try { setup = JSON.parse(d.setupJson); } catch (_) { return; }
      duelScreens[d.id] = Duel.start(Object.assign({}, setup, {
        mode: "watch", rx: Sync.sendDuelReaction,
        onEnd: () => { delete duelScreens[d.id]; },
      }));
      duelScreens[d.id].receiveActs(d.acts || []);
      duelScreens[d.id].receiveRx(d.rx || []);
    }

    // A live battle → the challenger referees (interactive), the opponent
    // auto-watches, and everyone else gets a "Watch" alert. Spectator screens
    // resolve when the referee reports the winner.
    const handledLive = {};
    let specHandle = null, latestLive = null;
    function openSpectator(data) {
      if (data && data.mode === "duel-remote") { openDuelWatch(); return; }   // turn-by-turn watch
      if (!window.Battle || !Battle.spectate || specHandle || !data) return;
      specHandle = Battle.spectate({
        title: data.event || "Challenge",
        a: { label: data.aName, names: [data.aName] },
        b: { label: data.bName, names: [data.bName] },
      });
      if (latestLive && latestLive.id === data.id && latestLive.state === "done") {
        setTimeout(() => { if (specHandle) { specHandle.finish(latestLive.winner || data.aName); specHandle = null; } }, 1900);
      }
    }
    // Let the Home "Live now" banner open the spectator screen.
    window.watchLiveBattle = openSpectator;
    Sync.onLiveBattle((data) => {
      latestLive = data;
      if (!data || !data.id) return;
      const me = Sync.myClientId();
      if (data.state === "live" && !handledLive[data.id]) {
        handledLive[data.id] = 1;
        if (me === data.aClient) {                    // referee — plays + reports
          // duel modes: the real Duel screen opens via its own channel
          if (data.mode === "duel" || data.mode === "duel-remote") return;
          Battle.start({
            title: data.event || "Challenge",
            a: { label: data.aName, names: [data.aName] },
            b: { label: data.bName, names: [data.bName] },
            onResult: (winnerKey) => Sync.finishLiveBattle(winnerKey === "a" ? data.aName : data.bName),
          });
        } else if (me === data.bClient) {             // the opponent — auto-watch
          if (data.mode === "duel-remote") return;    // they're playing it on their own phone
          notify("⚔ Your battle is on!", "vs " + data.aName + (data.event ? " · " + data.event : ""));
          openSpectator(data);
        } else {                                       // everyone else — offer to watch
          notify("⚔ Battle starting!", data.aName + " vs " + data.bName +
            (data.stakes ? " · " + data.stakes : data.event ? " · " + data.event : ""));
          if (window.SFX && SFX.blip) SFX.blip();
          let ctrl;
          const body = el("div", { class: "chal-modal" }, [
            el("div", { class: "chal-line" }, "⚔ " + data.aName + " vs " + data.bName + " — the battle is on!"),
            data.stakes ? el("div", { class: "chal-ev" }, data.stakes) : null,
            data.event ? el("div", { class: "chal-ev" }, "Event: " + data.event) : null,
            el("div", { class: "toolbar" }, [
              el("button", { class: "btn primary", onClick: () => { if (ctrl) ctrl.close(); openSpectator(data); } }, "👀 Watch & cheer"),
              el("button", { class: "btn subtle", onClick: () => { if (ctrl) ctrl.close(); } }, "Dismiss"),
            ]),
          ]);
          ctrl = Modal.open("Battle starting!", body, null, {});
        }
      }
      if (data.state === "done" && specHandle) {
        specHandle.finish(data.winner || data.aName);
        specHandle = null;
      }
      // Stakes battles (badges, League chambers, Mt. Silver) ping the room
      // with the result — even the phones that didn't watch.
      if (data.state === "done" && data.stakes && data.winner && !handledLive[data.id + ":res"]) {
        handledLive[data.id + ":res"] = 1;
        if (Sync.myClientId() !== data.aClient) notify("🏁 " + data.stakes, data.winner + " wins!");
      }
    });
  }
})();
