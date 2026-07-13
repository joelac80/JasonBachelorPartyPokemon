/* app.js — bootstrap: register views, wire nav, start router. */
(function () {
  const V = window.Views || {};
  Router.add("home", V.home)
    .add("victoryroad", V.victoryroad)
    .add("leaderboard", V.leaderboard)
    .add("draft", V.draft)
    .add("roster", V.roster)
    .add("activities", V.activities)
    .add("party", V.party)
    .add("jeopardy", V.jeopardy)
    .add("brackets", V.brackets)
    .add("battle", V.battle)
    .add("tower", V.tower)
    .add("cups", V.cups)
    .add("nuzlocke", V.nuzlocke)
    .add("safari", V.safari)
    .add("drinks", V.drinks)
    .add("tracker", V.tracker)
    .add("dex", V.dex)
    .add("trainerdex", V.trainerdex)
    .add("unown", V.unown)
    .add("megadex", V.megadex)
    .add("trade", V.trade)
    .add("gyms", V.gyms)
    .add("league", V.league)
    .add("tournament", V.tournament)
    .add("movies", V.movies)
    .add("legends", V.legends)
    .add("regions", V.regions)
    .add("predictions", V.predictions)
    .add("cards", V.cards)
    .add("superlatives", V.superlatives)
    .add("challenges", V.challenges)
    .add("badges", V.badges)
    .add("feed", V.feed)
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
    const t = (Store.state.party && Store.state.party.title) || "Pokémon Journey";
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
  // 📦 The Vault — the tucked-away pages (post-weekend extras). Collapsed by
  // default; the toggle flips it open without closing the menu.
  const vaultBtn = document.getElementById("vault-toggle");
  const vaultBox = document.getElementById("nav-vault");
  if (vaultBtn && vaultBox) {
    vaultBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const open = vaultBox.classList.toggle("hidden");
      const arrow = document.getElementById("vault-arrow");
      if (arrow) arrow.textContent = open ? "▸" : "▾";
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
    // Opt-in: ping this phone every time a new photo lands in the room feed.
    photoAlerts() { try { return localStorage.getItem("jasonBachHub.notifyPhotos") === "1"; } catch (_) { return false; } },
    setPhotoAlerts(on) { try { localStorage.setItem("jasonBachHub.notifyPhotos", on ? "1" : "0"); } catch (_) {} },
    // Opt-in: ping when someone reacts to one of YOUR photos.
    reactAlerts() { try { return localStorage.getItem("jasonBachHub.notifyReacts") === "1"; } catch (_) { return false; } },
    setReactAlerts(on) { try { localStorage.setItem("jasonBachHub.notifyReacts", on ? "1" : "0"); } catch (_) {} },
  };

  // 📨 Invite links: #/join/CODE drops a phone straight into a room — one
  // confirm, then the full-reload room switch (same rule as Settings).
  (function joinLink() {
    const m = (location.hash || "").match(/^#\/join\/([^\/?#]+)/);
    if (!m) return;
    const code = decodeURIComponent(m[1]);
    try { history.replaceState(null, "", location.pathname + "#/home"); } catch (_) { location.hash = "#/home"; }
    const c = window.Sync && Sync.getConf ? Sync.getConf() : null;
    if (!c || (c.enabled && c.room === code)) return;
    if (!confirm("📨 You've been invited to room " + code + "! Join it? This phone will sync with that crew (the app reloads).")) return;
    Sync.switchRoom(code);
  })();

  Router.start();

  // ---- Pull-to-refresh -----------------------------------------------------
  // The room already streams live (Firestore listeners), but a phone waking
  // from sleep can lag — so let anyone pull DOWN from the top to force-pull
  // the latest. Works everywhere (we contain the browser's native gesture so
  // behavior is identical installed or in a tab).
  (function () {
    const ind = document.createElement("div");
    ind.id = "ptr"; ind.className = "ptr";
    ind.innerHTML = '<span class="ptr-spin">🔄</span>';
    document.body.appendChild(ind);
    let startY = 0, pulling = false, dist = 0, busy = false;
    const THRESH = 70, MAX = 110;
    const atTop = () => (window.scrollY || document.documentElement.scrollTop || 0) <= 0;
    function begin(y) { startY = y; pulling = true; dist = 0; }
    function move(y) {
      if (!pulling || busy) return;
      dist = y - startY;
      if (dist <= 0) { ind.style.transform = "translateX(-50%) translateY(-100%)"; ind.classList.remove("ready"); return; }
      const d = Math.min(dist * 0.5, MAX);
      ind.style.transform = "translateX(-50%) translateY(" + (d - 44) + "px)";
      ind.classList.toggle("ready", dist >= THRESH);
    }
    function end() {
      if (!pulling) return;
      pulling = false;
      if (dist >= THRESH && !busy) {
        busy = true;
        ind.classList.add("go"); ind.classList.remove("ready");
        ind.style.transform = "translateX(-50%) translateY(16px)";
        const done = () => {
          if (window.Router) Router.render();
          setTimeout(() => {
            ind.classList.remove("go");
            ind.style.transform = "translateX(-50%) translateY(-100%)";
            busy = false;
          }, 350);
        };
        if (window.Sync && Sync.isLive && Sync.isLive() && Sync.refresh) Sync.refresh().then(done, done);
        else setTimeout(done, 400);
      } else {
        ind.style.transform = "translateX(-50%) translateY(-100%)";
        ind.classList.remove("ready");
      }
    }
    document.addEventListener("touchstart", (e) => {
      if (busy || !atTop() || document.querySelector(".battle, .modal-overlay, .onb")) return;
      if (e.touches && e.touches.length === 1) begin(e.touches[0].clientY);
    }, { passive: true });
    document.addEventListener("touchmove", (e) => {
      if (!pulling) return;
      const y = e.touches[0].clientY;
      // only hijack a genuine downward pull that starts at the very top
      if (y - startY > 0 && atTop()) { if (e.cancelable) e.preventDefault(); move(y); }
      else if (y - startY <= 0) { pulling = false; ind.style.transform = "translateX(-50%) translateY(-100%)"; }
    }, { passive: false });
    document.addEventListener("touchend", end, { passive: true });
    // expose for a manual/programmatic trigger (and tests)
    window.pullRefresh = () => { busy = true; ind.classList.add("go"); const done = () => { if (window.Router) Router.render(); ind.classList.remove("go"); busy = false; }; if (window.Sync && Sync.isLive && Sync.isLive() && Sync.refresh) return Sync.refresh().then(done, done); done(); return Promise.resolve(); };
  })();

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
    // 🎴 Self-heal a GHOST identity: conf.me pointing at a trainer that no
    // longer exists locally (an old foreign-room wipe could orphan it — which
    // then hid every "who's playing" picker behind a nameless lock AND kept
    // the welcome tour from re-offering the trainer step). Sign the ghost out
    // so the pickers and the tour come back.
    try { if (Sync.getMe && Sync.getMe() && window.Store && !Store.attendee(Sync.getMe())) Sync.setMe(""); } catch (_) {}
    Sync.init();

    // First-open onboarding tour: six quick slides that walk a fresh phone
    // through the weekend — including picking your trainer + room code —
    // skippable at any moment. Replayable from the Field Guide.
    try {
      if (window.Onboard) setTimeout(() => Onboard.start(), 500);
      // 🎴 unfinished card? (still "New Trainer", or no favorite) — offer the
      // fixer on every reopen until the card is whole.
      setTimeout(() => { try { if (window.CardFixer) CardFixer.check(); } catch (_) {} }, 1400);
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
      // A SOLO double: one trainer fields 2v2 from a party of 4 — two field
      // slots sharing ONE bench (the first two picks lead). Both units carry the
      // full party; the engine points slot 0/1 at it and shares the bench.
      const soloUnits = (ids, attId, client) => {
        ids = (ids || []).filter(Boolean).slice(0, 4);
        const u = { attId: attId, client: client, monIds: ids };
        return ids.length > 1 ? [u, { attId: attId, client: client, monIds: ids }] : [u];
      };
      const launch = (bUnits, bShared) => {
        Sync.respondChallenge(ch, true);
        let aUnits;
        if (ch.solo2) {          // one trainer running both field slots (party of 4)
          aUnits = soloUnits(ch.party, ch.fromAtt, ch.fromClient);
        } else {
          aUnits = [{ attId: ch.fromAtt, client: ch.fromClient, monIds: ch.party || [] }];
          if (ch.pairAtt) aUnits.push({ attId: ch.pairAtt, client: clientOf(ch.pairAtt, ch.fromClient), monIds: ch.pairParty || [] });
        }
        const aLead = Duel.statsFor((ch.party || [])[0] || 1).x, bLead = Duel.statsFor(bUnits[0].monIds[0]).x;
        const setup = {
          title: ch.event || "Duel",
          first: aLead === bLead ? (Math.random() < 0.5 ? "a" : "b") : (aLead > bLead ? "a" : "b"),
          a: { units: aUnits, shared: !!ch.solo2 }, b: { units: bUnits, shared: !!bShared },
        };
        const names = (us) => us.map((u) => (Store.attendee(u.attId) || {}).name || "?").join(" & ");
        const duelId = Sync.startRemoteDuel(setup);
        // Banner shares the duel id so watchers can open the RIGHT duel doc.
        Sync.startLiveBattle({ id: duelId || undefined, aName: names(aUnits), bName: names(bUnits),
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
            onDone: (ids) => launch([{ attId: me, client: Sync.myClientId(), monIds: ids }], false) });
          return;
        }
        // Double battle: fight with a partner, or run two of your own.
        let styleCtrl;
        const withPartner = () => {
          Duel.pickParty({ attId: me, min: 3, max: 3, title: "Your 3 Pokémon (pair battle)", hint: "You and your partner each bring 3 — one each on the field, 2v2.", onDone: (mine) => {
            Duel.pickTrainer({ exclude: [me, ch.fromAtt, ch.pairAtt].filter(Boolean), title: "Pick your partner",
              hint: "They fight beside you. If they're in the room on their own phone, they'll play their own turns.",
              onDone: (ally) => {
                const allyName = (Store.attendee(ally) || {}).name || "Partner";
                Duel.pickParty({ attId: ally, min: 3, max: 3, title: allyName + "'s 3 Pokémon", onDone: (theirs) => {
                  launch([
                    { attId: me, client: Sync.myClientId(), monIds: mine },
                    { attId: ally, client: clientOf(ally, Sync.myClientId()), monIds: theirs },
                  ], false);
                } });
              } });
          } });
        };
        const solo = () => {
          Duel.pickParty({ attId: me, min: 4, max: 4, title: "Pick FOUR Pokémon", hint: "Your first two lead the field (2v2); the other two ride the bench.",
            onDone: (ids) => launch(soloUnits(ids, me, Sync.myClientId()), true) });
        };
        const sBody = el("div", { class: "chal-modal" }, [
          el("div", { class: "chal-line" }, "How does your side fight?"),
          el("div", { class: "toolbar" }, [
            el("button", { class: "btn primary", onClick: () => { styleCtrl.close(); withPartner(); } }, "🤝 With a partner (3 each)"),
            el("button", { class: "btn primary", onClick: () => { styleCtrl.close(); solo(); } }, "🐾 Solo — 4 Pokémon"),
          ]),
        ]);
        styleCtrl = Modal.open("Double battle!", sBody, null, { noFooter: true });
      };
      const pairName = ch.pairAtt ? ((Store.attendee(ch.pairAtt) || {}).name || "a partner") : "";
      const body = el("div", { class: "chal-modal" }, [
        el("div", { class: "chal-line" }, (isDuel ? "🎮 " : "⚔ ") + (ch.fromName || "Someone") +
          (ch.solo2 ? " challenges you to a DOUBLE battle (2v2), running a party of 4 — bring a partner or go solo!"
            : ch.pairAtt ? " & " + pairName + " challenge you to a PAIR battle (2v2) — grab a partner (or go solo with 4)!"
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
    // Duel ids we've already finished/watched — never re-open or replay them.
    // Persisted so closing + reopening the app can't force a rewatch of a
    // battle this device already saw end (the shared doc can linger on "live").
    const DUEL_ENDED_KEY = "jasonBachHub.endedDuels";
    let endedList = [];
    try { endedList = JSON.parse(localStorage.getItem(DUEL_ENDED_KEY) || "[]") || []; } catch (_) {}
    const endedDuels = {};
    endedList.forEach((id) => { endedDuels[id] = 1; });
    function markDuelEnded(id) {
      if (!id || endedDuels[id]) return;
      endedDuels[id] = 1; endedList.push(id);
      if (endedList.length > 50) endedList = endedList.slice(-50);
      try { localStorage.setItem(DUEL_ENDED_KEY, JSON.stringify(endedList)); } catch (_) {}
    }
    let latestDuel = null;
    Sync.onDuel((data) => {
      latestDuel = data;
      if (!data || !data.id || !data.setupJson) return;
      let setup; try { setup = JSON.parse(data.setupJson); } catch (_) { return; }
      const me = Sync.myClientId();
      const units = (setup.a.units || []).concat(setup.b.units || []);
      const mine = units.some((u) => u.client === me);
      const fresh = !data.t || (Date.now() - data.t) < 1800000;   // ignore stale docs (30 min)
      // Only spin up a fresh screen for a duel we haven't opened OR finished —
      // otherwise a late act / focus refresh would restart a done battle and
      // replay the whole thing from seq 0.
      if (data.state === "live" && mine && fresh && !duelScreens[data.id] && !endedDuels[data.id]) {
        const did = data.id;                            // pin THIS duel's id into the screen's callbacks
        duelScreens[did] = Duel.start(Object.assign({}, setup, {
          mode: "remote", myClient: me, duelId: did,
          net: { send: (act) => Sync.sendDuelAct(did, act) },
          onEnd: () => { delete duelScreens[did]; markDuelEnded(did); },
        }));
      }
      const h = duelScreens[data.id];
      if (h) {
        h.receiveActs(data.acts || []);
        if (h.receiveRx) h.receiveRx(data.rx || []);
      }
    });
    // 🧟 Zombie battle sweep — a phone closed mid-battle never reports a
    // winner, so its broadcast stays "live" forever. On boot (and whenever
    // the app comes back to the foreground), any live battle THIS device is
    // a player in — while no battle is actually on screen — gets auto-
    // forfeited, and a toast says so. Other phones' ghosts age out of the
    // lists via liveActive()'s 3-hour filter.
    function sweepZombieBattles() {
      try {
        if (!Sync.sweepMyLiveBattles) return;
        if (document.querySelector(".battle")) return;   // a battle IS running — nothing stale
        const closed = Sync.sweepMyLiveBattles();
        if (!closed.length) return;
        const d = closed[0];
        U.toast("🧹 Cleared " + (closed.length > 1 ? closed.length + " stale battles" : "a stale battle") +
          " (" + d.aName + " vs " + d.bName + (closed.length > 1 ? ", …" : "") + ") — auto-forfeited.");
        if (window.Router) Router.render();
      } catch (_) {}
    }
    // The battle list streams in asynchronously — give the first snapshot a
    // moment to land, then sweep; re-sweep whenever the app is re-opened.
    setTimeout(sweepZombieBattles, 4000);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") setTimeout(sweepZombieBattles, 2500);
    });

    // 📬 Trade inbox pings: when a synced update brings a new open offer
    // addressed to me, ping once per offer — no need to be watching.
    const OSEEN_KEY = "jasonBachHub.offersSeen";
    function checkTradeInbox() {
      try {
        const me = Sync.getMe && Sync.getMe();
        if (!me || !Store.tradeOffers) return;
        let seen = [];
        try { seen = JSON.parse(localStorage.getItem(OSEEN_KEY) || "[]"); } catch (_) {}
        const mine = Store.tradeOffers().filter((o) => o.to === me && seen.indexOf(o.id) < 0);
        if (!mine.length) return;
        mine.forEach((o) => seen.push(o.id));
        try { localStorage.setItem(OSEEN_KEY, JSON.stringify(seen.slice(-60))); } catch (_) {}
        const o = mine[0];
        const fromN = (Store.attendee(o.from) || {}).name || "Someone";
        const nm = (id) => (window.DEX && DEX[id] && DEX[id].n) || ("#" + id);
        notify("📬 Trade offer!", fromN + " offers " + nm(o.give) + " for your " + nm(o.want));
        if (window.SFX && SFX.blip) SFX.blip();
        let ctrl;
        const body = el("div", { class: "chal-modal" }, [
          el("div", { class: "chal-line" }, "📬 " + fromN + " offers their " + nm(o.give) + " for your " + nm(o.want) + "!" +
            (mine.length > 1 ? " (+" + (mine.length - 1) + " more offer" + (mine.length > 2 ? "s" : "") + " waiting)" : "")),
          el("div", { class: "toolbar" }, [
            el("button", { class: "btn primary", onClick: () => { if (ctrl) ctrl.close(); location.hash = "#/trade"; } }, "📬 Open Trading Post"),
            el("button", { class: "btn subtle", onClick: () => { if (ctrl) ctrl.close(); } }, "Later"),
          ]),
        ]);
        ctrl = Modal.open("Trade offer!", body, null, {});
      } catch (_) {}
    }
    if (Sync.onStateApplied) Sync.onStateApplied(checkTradeInbox);
    setTimeout(checkTradeInbox, 1500);   // catch offers that arrived while away

    // 🧭 Gen Ladder unlock — celebrate when THIS device's signed-in trainer
    // climbs a rung (their battles opened a new generation in the wild).
    const GENCAP_SEEN_KEY = "jasonBachHub.genCapSeen";
    function checkGenClimb() {
      try {
        const me = Sync.getMe && Sync.getMe();
        if (!me || !Store.genCapFor) return;
        const cap = Store.genCapFor(me);
        const seen = parseInt(localStorage.getItem(GENCAP_SEEN_KEY) || "1", 10) || 1;
        if (cap <= seen) return;
        localStorage.setItem(GENCAP_SEEN_KEY, String(cap));
        if (seen < 1 || cap === 1) return;
        const span = Store.GEN_SPANS[cap - 1];
        notify("🧭 GEN " + cap + " UNLOCKED!", "Your battles opened Gen " + cap + " — #" + span[0] + "–#" + span[1] + " now roam YOUR Safari!");
        if (window.SFX && SFX.fanfare) SFX.fanfare();
        U.toast("🧭 GEN " + cap + " UNLOCKED — #" + span[0] + "–#" + span[1] + " join your wild!", "🔴 Safari", () => { location.hash = "#/safari"; });
      } catch (_) {}
    }
    Store.subscribe(checkGenClimb);
    if (Sync.onStateApplied) Sync.onStateApplied(checkGenClimb);
    setTimeout(checkGenClimb, 1800);

    // 🏔 THE TEMPORAL RIFT — once per trainer, the first time this device sees
    // their CYNTHIA win: the Legends-Arceus opening. The sky tears, time runs
    // backward, and the voice of Arceus welcomes them to HISUI (the ancient
    // forms join their Safari + the Hisui specials open on the Sinnoh tab).
    const HISUI_SEEN_KEY = "jasonBachHub.hisuiSeen";
    function checkHisuiRift() {
      try {
        const me = Sync.getMe && Sync.getMe();
        if (!me || !Store.hisuiUnlocked || !Store.hisuiUnlocked(me)) return;
        const seen = (localStorage.getItem(HISUI_SEEN_KEY) || "").split(",").filter(Boolean);
        if (seen.indexOf(me) >= 0) return;
        seen.push(me);
        localStorage.setItem(HISUI_SEEN_KEY, seen.join(","));
        if (document.querySelector(".hisui-rift")) return;
        const arc = Store.sprite(493);
        const lay = U.el("div", { class: "hisui-rift" }, [
          U.el("div", { class: "hisui-rift-inner" }, [
            arc ? U.el("img", { class: "hisui-rift-arceus", src: arc, alt: "Arceus" }) : U.el("div", { class: "hisui-rift-mt" }, "🏔"),
            U.el("div", { class: "hisui-rift-flair" }, "⏳ THE SKY TEARS OPEN"),
            U.el("div", { class: "hisui-rift-voice" }, "“ALL POKÉMON EXIST TO HELP PEOPLE. YOU HAVE PROVEN YOURSELF AT THE SUMMIT OF SINNOH…”"),
            U.el("div", { class: "hisui-rift-voice" }, "“I AM ARCEUS. SEEK OUT ALL POKÉMON. I WILL BE WAITING — IN THE TIME BEFORE TIME.”"),
            U.el("div", { class: "hisui-rift-name" }, "WELCOME TO HISUI"),
            U.el("div", { class: "hisui-rift-sub" }, "🏔 " + ((window.HISUI_WILD || []).length || 16) + " ancient Hisuian forms now roam YOUR Safari — and the Hisui trials open on the Sinnoh tab: quell the FRENZIED NOBLES, then face the origins of time and space."),
            U.el("div", { class: "toolbar", style: { justifyContent: "center" } }, [
              U.el("button", { class: "btn spin-btn", onClick: () => { lay.remove(); location.hash = "#/safari"; } }, "🏔 Step through the rift"),
              U.el("button", { class: "btn subtle", onClick: () => lay.remove() }, "Wake up later"),
            ]),
          ]),
        ]);
        document.body.appendChild(lay);
        if (window.SFX && SFX.fanfare) SFX.fanfare();
        requestAnimationFrame(() => lay.classList.add("go"));
        notify("🏔 HISUI UNLOCKED!", "Arceus has spoken — the ancient forms roam your Safari.");
      } catch (_) {}
    }
    Store.subscribe(checkHisuiRift);
    if (Sync.onStateApplied) Sync.onStateApplied(checkHisuiRift);
    setTimeout(checkHisuiRift, 2600);

    // 📬 topbar inbox badge: shows (with a count) while offers addressed to
    // ME are waiting — tap it to land on the Trading Post.
    function updateInboxBadge() {
      try {
        const btn = document.getElementById("inbox-btn"), num = document.getElementById("inbox-count");
        if (!btn || !num) return;
        const me = Sync.getMe && Sync.getMe();
        const n = (me && Store.tradeOffers) ? Store.tradeOffers().filter((o) => o.to === me).length : 0;
        btn.classList.toggle("hidden", n === 0);
        num.textContent = n > 9 ? "9+" : String(n || "");
      } catch (_) {}
    }
    window.updateInboxBadge = updateInboxBadge;
    Store.subscribe(updateInboxBadge);
    if (Sync.onStateApplied) Sync.onStateApplied(updateInboxBadge);
    window.addEventListener("hashchange", updateInboxBadge);
    updateInboxBadge();

    // 🌩 roaming legendary — alert every phone; everyone can catch their own
    // before it wanders off (20 min, see Sync.roam).
    const handledRoam = {};
    Sync.onRoam((data) => {
      if (!data || !data.id) return;
      if (data.state === "live" && !handledRoam[data.id]) {
        handledRoam[data.id] = 1;
        if (data.t && Date.now() - data.t > 1200000) return;   // stale event
        const nm = (window.DEX && DEX[data.monId] && DEX[data.monId].n) || "legendary";
        notify("🌩 Roaming legendary!", "A wild " + nm + " is loose — go catch yours before it wanders off!");
        if (window.SFX && SFX.fanfare) SFX.fanfare();
        let rctrl;
        const rbody = el("div", { class: "chal-modal" }, [
          el("div", { class: "chal-line" }, "🌩 A wild " + nm.toUpperCase() + " is ROAMING the party! Every trainer can catch their own — but it wanders off in about 20 minutes."),
          el("div", { class: "toolbar" }, [
            el("button", { class: "btn primary", onClick: () => { if (rctrl) rctrl.close(); location.hash = "#/safari"; } }, "🎯 Hunt it"),
            el("button", { class: "btn subtle", onClick: () => { if (rctrl) rctrl.close(); } }, "Let it roam"),
          ]),
        ]);
        rctrl = Modal.open("Roaming legendary!", rbody, null, { noFooter: true });
      }
    });

    // 📸 New photo in the room feed → alert phones that opted in (Settings).
    // Two surfaces: an OS notification when the app is BACKGROUNDED, and an
    // in-app toast when you're looking at the app (an OS notification is
    // suppressed in the foreground, so without this you'd see nothing). Skips
    // your own uploads either way.
    if (Sync.onPhotoAdded) Sync.onPhotoAdded((p) => {
      if (!p || !window.AppNotify || !AppNotify.photoAlerts()) return;
      const meId = (Sync.getMe && Sync.getMe()) || "";
      if (p.loggedBy && meId && p.loggedBy === meId) return;   // don't alert my own post
      const who = p.by || (p.loggedBy && (Store.attendee(p.loggedBy) || {}).name) || "Someone";
      const cap = p.caption ? " — “" + p.caption + "”" : "";
      if (document.visibilityState === "visible") {
        if (window.SFX && SFX.blip) SFX.blip();
        U.toast("📸 " + who + " posted a photo" + cap, "View", () => { location.hash = "#/feed"; });
      } else {
        notify("📸 New photo!", who + " just posted a moment" + cap);
      }
    });

    // 💛 Someone reacted to YOUR photo → alert (opt-in). Same two surfaces as
    // above; only fires for reactions on a photo you posted, by someone else.
    if (Sync.onPhotoReaction) Sync.onPhotoReaction((p, r) => {
      if (!p || !r || !window.AppNotify || !AppNotify.reactAlerts()) return;
      const meId = (Sync.getMe && Sync.getMe()) || "";
      if (!meId || p.loggedBy !== meId) return;                 // only MY photos
      const myClient = Sync.myClientId && Sync.myClientId();
      if (myClient && r.by === myClient) return;                // not my own reaction
      const who = r.name || "Someone";
      const cap = p.caption ? " (“" + p.caption + "”)" : "";
      if (document.visibilityState === "visible") {
        if (window.SFX && SFX.blip) SFX.blip();
        U.toast(r.emoji + " " + who + " reacted to your photo" + cap, "View", () => { location.hash = "#/feed"; });
      } else {
        notify(r.emoji + " Reaction!", who + " reacted to your photo" + cap);
      }
    });

    function openDuelWatch(id) {
      const d = (Sync.duelData && Sync.duelData(id)) || (id && latestDuel && latestDuel.id === id ? latestDuel : null);
      if (!d || !d.id || !d.setupJson || d.state !== "live" || duelScreens[d.id] || endedDuels[d.id]) return;
      let setup; try { setup = JSON.parse(d.setupJson); } catch (_) { return; }
      const did = d.id;
      duelScreens[did] = Duel.start(Object.assign({}, setup, {
        mode: "watch", duelId: did, rx: (e) => Sync.sendDuelReaction(did, e),
        onEnd: () => { delete duelScreens[did]; markDuelEnded(did); },
      }));
      duelScreens[did].receiveActs(d.acts || []);
      duelScreens[did].receiveRx(d.rx || []);
    }

    // A live battle → the challenger referees (interactive), the opponent
    // auto-watches, and everyone else gets a "Watch" alert. Spectator screens
    // resolve when the referee reports the winner.
    const handledLive = {};
    // You watch one battle at a time; specId marks WHICH, so another battle
    // ending elsewhere can't resolve the screen you're actually watching.
    let specHandle = null, specId = "";
    // Only ONE "watch this battle" popup at a time — a new battle (or the end of
    // the current one) dismisses any offer still on screen so they never stack.
    let liveOfferCtrl = null, liveOfferId = "";
    function closeLiveOffer() { if (liveOfferCtrl) { try { liveOfferCtrl.close(); } catch (_) {} liveOfferCtrl = null; liveOfferId = ""; } }
    function openSpectator(data) {
      if (!data) return;
      if (data.mode === "duel-remote") { openDuelWatch(data.id); return; }   // turn-by-turn watch
      if (!window.Battle || !Battle.spectate || specHandle) return;          // already watching one
      specId = data.id;
      specHandle = Battle.spectate({
        title: data.event || "Challenge",
        a: { label: data.aName, names: [data.aName] },
        b: { label: data.bName, names: [data.bName] },
        onClose: () => { specHandle = null; specId = ""; },
      });
      if (data.state === "done") {   // opened one that already ended — resolve it
        setTimeout(() => { if (specHandle && specId === data.id) { specHandle.finish(data.winner || data.aName); specHandle = null; specId = ""; } }, 1900);
      }
    }
    // Let the Home "Live now" banner open the spectator screen.
    window.watchLiveBattle = openSpectator;
    Sync.onLiveBattle((data) => {
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
            onResult: (winnerKey) => Sync.finishLiveBattle(data.id, winnerKey === "a" ? data.aName : data.bName),
          });
        } else if (me === data.bClient) {             // the opponent — auto-watch
          if (data.mode === "duel-remote") return;    // they're playing it on their own phone
          notify("⚔ Your battle is on!", "vs " + data.aName + (data.event ? " · " + data.event : ""));
          openSpectator(data);
        } else {                                       // everyone else — offer to watch
          notify("⚔ Battle starting!", data.aName + " vs " + data.bName +
            (data.stakes ? " · " + data.stakes : data.event ? " · " + data.event : ""));
          if (window.SFX && SFX.blip) SFX.blip();
          closeLiveOffer();                              // a fresh battle replaces any stale offer
          const body = el("div", { class: "chal-modal" }, [
            el("div", { class: "chal-line" }, "⚔ " + data.aName + " vs " + data.bName + " — the battle is on!"),
            data.stakes ? el("div", { class: "chal-ev" }, data.stakes) : null,
            data.event ? el("div", { class: "chal-ev" }, "Event: " + data.event) : null,
            el("div", { class: "toolbar" }, [
              el("button", { class: "btn primary", onClick: () => { closeLiveOffer(); openSpectator(data); } }, "👀 Watch & cheer"),
              el("button", { class: "btn subtle", onClick: () => { closeLiveOffer(); } }, "Dismiss"),
            ]),
          ]);
          liveOfferId = data.id;
          liveOfferCtrl = Modal.open("Battle starting!", body, null, { onClose: () => { liveOfferCtrl = null; liveOfferId = ""; } });
        }
      }
      // The battle's over — pull down its offer popup and, if you were watching
      // THIS one, resolve the spectator screen.
      if (data.state === "done") {
        if (liveOfferId === data.id) closeLiveOffer();
        if (specHandle && specId === data.id) { specHandle.finish(data.winner || data.aName); specHandle = null; specId = ""; }
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
