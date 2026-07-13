/* onboard.js — the first-open tour. Seven quick slides that open on what
   the app IS — friends brought together by a love of the Pokémon world —
   then the three pillars: CATCHING, BATTLING, and the NUZLOCKE epics.
   Skippable at any moment; picking a trainer + room happens INSIDE the
   tour so nobody has to find Settings. Replayable from the Field Guide. */
(function () {
  const OKEY = "jasonBachHub.onboarded";

  function markSeen() { try { localStorage.setItem(OKEY, "1"); } catch (_) {} }
  function seen() { try { return localStorage.getItem(OKEY) === "1"; } catch (_) { return false; } }

  function start(force) {
    if (!force && (seen() || (window.Sync && Sync.getMe()))) return;
    const { el } = U;
    let sel = (window.Sync && Sync.getMe && Sync.getMe()) || "", idx = 0;
    const conf0 = (window.Sync && Sync.getConf && Sync.getConf()) || {};
    const roomIn = el("input", { class: "in", placeholder: "Room code (e.g. GARZA26)", value: conf0.room || "" });

    // notifications (slide 4) — enable right in the tour; repaints in place
    const noteHost = el("div", { class: "onb-note" });
    function paintNote() {
      noteHost.innerHTML = "";
      const A = window.AppNotify;
      const p = (A && A.supported && A.supported()) ? A.permission() : "unsupported";
      if (p === "granted") noteHost.appendChild(el("p", { class: "hint" }, "🔔 Notifications are ON — you're set."));
      else if (p === "denied") noteHost.appendChild(el("p", { class: "hint" }, "🔕 Blocked by the browser — you can turn them on later in iOS Settings → Notifications."));
      else if (p === "unsupported") noteHost.appendChild(el("p", { class: "hint" }, "📱 On iPhone, notifications need the Home Screen app: Share → Add to Home Screen, open from that icon, then enable alerts in ⚙️ Settings."));
      else noteHost.appendChild(el("button", { class: "btn primary", onClick: () => {
        try { AppNotify.request(() => paintNote()); } catch (_) {}
      } }, "🔔 Enable notifications"));
    }

    // trainer picker (slide 2) — picking only repaints the grid (no full
    // slide rebuild, no re-animation), so the tap feels instant.
    const grid = el("div", { class: "sl-vote-grid onb-grid" });
    function paintGrid() {
      grid.innerHTML = "";
      Store.state.attendees.forEach((a) => {
        const src = Store.favSprite ? Store.favSprite(a) : "";
        grid.appendChild(el("button", { class: "sl-vote-pick" + (sel === a.id ? " on" : ""), onClick: () => {
          sel = a.id; paintGrid(); syncNext();
          if (window.SFX && SFX.select) SFX.select();
        } }, [
          src ? el("img", { class: "sl-thumb", src: src, alt: "" }) : el("span", { class: "draft-thumb-ball" }),
          el("span", { class: "sl-vote-name" }, a.name),
        ]));
      });
      // ➕ Fresh-slate rooms start with NO trainers — anyone can create
      // themselves right here in the tour (also handy for late arrivals).
      grid.appendChild(el("button", { class: "sl-vote-pick onb-new-trainer", onClick: () => {
        const nm = (prompt("Your name, trainer?") || "").trim();
        if (!nm) return;
        const id = "t" + Math.random().toString(36).slice(2, 8);
        Store.update((s) => s.attendees.push({
          id: id, name: nm, nickname: "", team: "", type: "normal",
          rank: "Gym Leader", role: "The Squad", favorite: "", favoriteId: 0,
          photo: "", catchphrase: "",
        }));
        sel = id; paintGrid(); syncNext();
        if (window.SFX && SFX.fanfare) SFX.fanfare();
        // 🎯 The signup ritual: pick your favorite right away — the first
        // pick rolls the 1-in-16 shiny (the picker lifts above the tour).
        if (window.FavPick) FavPick.open(id, () => paintGrid());
      } }, [
        el("span", { class: "draft-thumb-ball" }),
        el("span", { class: "sl-vote-name" }, Store.state.attendees.length ? "➕ New trainer" : "➕ Create yourself"),
      ]));
    }

    const SLIDES = [
      { e: "👋", t: "For the love of Pokémon",
        d: "This app is for friends who grew up with this world — one screen on every phone that turns a room into a region. Catch across all nine generations, battle each other for real, and walk the whole saga side by side. Seven quick slides and you're a trainer (or skip and wing it — the ? button always has your back)." },
      { e: "🎴", t: "Who are you, trainer?",
        d: "Tap yourself (or create yourself). Everything you do — every catch, every badge, every duel win, every run — follows YOU: your Pokédex, your profile, your place in the Hall of Fame.",
        body: () => { paintGrid(); return grid; } },
      { e: "🔗", t: "Join your friends' room",
        d: "Type the room code the crew is using and every phone shares ONE living world — catches, battles and gym badges sync in real time. Leave it blank to run solo; you can join any time in ⚙️ Settings.",
        body: () => el("div", { class: "field" }, [roomIn]) },
      { e: "🔴", t: "Catch 'em — all nine generations",
        d: "The Safari Zone is the engine: find a wild Pokémon, earn boosts, throw. ✨ 1-in-16 encounters are SHINY. Fill the Pokédex from Kanto to Paldea (Hisui, Unown and Megas too), swap at the Trading Post — some Pokémon ONLY evolve by trade — and everything you catch fights for you everywhere else." },
      { e: "⚔️", t: "Battle 'em — for real",
        d: "Real turn-based duels, each trainer on their own phone — moves, types, crits, potions, sips on the line. Then take on 🗺 The Journey: nine regions of gyms → Elite Four → Champion, the Battle Tower, canon rivals ambushing the roads, Movie Legends, and the legends themselves. Big fights broadcast live — the whole room watches and cheers." },
      { e: "🪦", t: "…then dare the Nuzlocke",
        d: "The ultimate test, six ways: one region on the classic curve, a 🎲 randomizer, the 🌍 114-battle master gauntlet, 🕰 Through the Ages (nine generations, a fresh team each era — Professor Oak waits at the very end), 🎒 the Long Walk (one team through every region), or the 🎬 Movie Marathon against every film legend. Any Pokémon that faints is gone FOREVER — fewest catches wears the crown." },
      { e: "🔔", t: "One last thing — alerts, then go",
        d: "Get pinged when you're challenged, when a battle goes live, and when it's YOUR move (iPhone: best from the Home Screen app — Share → Add to Home Screen). Games, photos and everything else live in 🎉 Party Central; the ? up top opens the Field Guide. Now go — your friends are waiting.",
        body: () => { paintNote(); return noteHost; } },
    ];

    // Static overlay + skip button; only the card's CONTENT changes per
    // slide (rebuilding the whole overlay per tap restarted the entrance
    // animation — the "flash" — and reset grid scroll).
    const lay = el("div", { class: "onb" });
    const card = el("div", { class: "onb-card" });
    lay.appendChild(el("button", { class: "onb-skip", onClick: () => finish(true) }, "Skip tour ▸▸"));
    lay.appendChild(card);
    document.body.appendChild(lay);
    let nextBtn = null;
    function syncNext() { if (nextBtn) nextBtn.classList.toggle("off", idx === 1 && !sel); }

    function finish(apply) {
      markSeen();
      if (apply && sel) {
        const a = Store.attendee(sel);
        Sync.setMe(sel);
        const room = roomIn.value.trim();
        if (room) {
          Sync.save("", room, (a && a.name) || "");
          Sync.enable();
          if (window.AppNotify && AppNotify.supported() && AppNotify.permission() === "default") AppNotify.request(function () {});
        }
        if (window.SFX && SFX.win) SFX.win();
      }
      lay.remove();
      if (window.Router) Router.render();
    }

    function paint() {
      const s = SLIDES[idx];
      const last = idx === SLIDES.length - 1;
      card.innerHTML = "";
      nextBtn = el("button", { class: "btn primary", onClick: () => {
        if (idx === 1 && !sel) { alert("Tap your trainer first! (Or use “Skip tour” up top.)"); return; }
        if (last) { finish(true); return; }
        idx++; paint();
        if (window.SFX && SFX.blip) SFX.blip();
      } }, last ? "🚀 LET'S GO" : "Next ▸");
      [
        el("div", { class: "onb-hero" }, s.e),
        el("div", { class: "onb-title" }, s.t),
        el("p", { class: "onb-text" }, s.d),
        s.body ? s.body() : null,
        el("div", { class: "onb-dots" }, SLIDES.map((_, i) =>
          el("span", { class: "onb-dot" + (i === idx ? " on" : "") }))),
        el("div", { class: "toolbar onb-toolbar" }, [
          idx > 0 ? el("button", { class: "btn subtle", onClick: () => { idx--; paint(); } }, "◂ Back") : null,
          nextBtn,
        ]),
      ].forEach((n) => { if (n) card.appendChild(n); });
      syncNext();
      // pop the card on slide change only (scale-in; never translates)
      card.classList.remove("pop"); void card.offsetWidth; card.classList.add("pop");
    }
    paint();
    requestAnimationFrame(() => lay.classList.add("go"));
  }

  window.Onboard = { start: start, seen: seen };
})();
