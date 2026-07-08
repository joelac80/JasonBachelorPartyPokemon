/* onboard.js — the first-open tour. Six quick slides that walk a fresh
   phone through the whole weekend: who you are, the room code, catching,
   battling, and how everything scores. Skippable at any moment; picking a
   trainer + room happens INSIDE the tour so nobody has to find Settings.
   Replayable from the Field Guide. */
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
        const f = Store.currentForm(a);
        const src = f.id ? Store.sprite(f.id) : "";
        grid.appendChild(el("button", { class: "sl-vote-pick" + (sel === a.id ? " on" : ""), onClick: () => {
          sel = a.id; paintGrid(); syncNext();
          if (window.SFX && SFX.select) SFX.select();
        } }, [
          src ? el("img", { class: "sl-thumb", src: src, alt: "" }) : el("span", { class: "draft-thumb-ball" }),
          el("span", { class: "sl-vote-name" }, a.name),
        ]));
      });
    }

    const SLIDES = [
      { e: "👋", t: "Welcome to the world of Pokémon… bachelor parties!",
        d: "Jason's last stand — July 9–12 at the lake house. This app is the scoreboard, the Pokédex, and the referee, all in one. Six quick slides and you're ready (or skip and wing it — the ? button always has your back)." },
      { e: "🎴", t: "Who are you, trainer?",
        d: "Tap yourself. Everything you log — catches, duel wins, drinks, dares — follows YOU all weekend, on leaderboards, your profile, and the final poster.",
        body: () => { paintGrid(); return grid; } },
      { e: "🔗", t: "Join the crew's room",
        d: "Type the room code the crew is using and every phone shares ONE live scoreboard — battles, catches and drinks sync in real time. Leave it blank to run solo; you can join any time in ⚙️ Settings.",
        body: () => el("div", { class: "field" }, [roomIn]) },
      { e: "🔔", t: "Turn on alerts",
        d: "Get pinged when you're challenged, when a badge battle kicks off, when a trade offer lands in your inbox, and when it's YOUR move in a duel. iPhone: this works best from the Home Screen app (Share → Add to Home Screen).",
        body: () => { paintNote(); return noteHost; } },
      { e: "🔴", t: "Catch Pokémon in the Safari",
        d: "The Safari Zone is the engine: do dares to earn boosts, then throw. ✨ 1-in-16 encounters are SHINY. Swap at the Trading Post (some Pokémon ONLY evolve by trade), and your caught team fights for you everywhere else." },
      { e: "⚔️", t: "Battle on your own phones",
        d: "Real turn-based Lv50 duels — each trainer plays on their own phone. Every KO = 2 sips, losers toast 4. 🧪 Potion = 3 sips to heal; 🍺 finish half your drink for a can't-miss crit. Then climb: 16 Gym Leaders → Elite Four → Champion LANCE → …something waits on Mt. Silver. Big fights broadcast live — the whole room watches and cheers." },
      { e: "🏆", t: "Everything scores",
        d: "Jeopardy, the Oracle, the Card Table, drinks, dares — every win feeds your team's total on Victory Road, and Sunday's Ceremony crowns the champion. Lost later? Tap the ? up top for the Field Guide. Now go." },
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
