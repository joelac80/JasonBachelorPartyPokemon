/* home.js — landing hub: hero, countdown, fan badges, Oak's tip, nav. */
(function () {
  const { el } = U;

  function countdownParts(target) {
    const now = new Date();
    const diff = target - now;
    if (isNaN(diff)) return null;
    if (diff <= 0) return { done: true };
    const s = Math.floor(diff / 1000);
    return {
      done: false,
      days: Math.floor(s / 86400),
      hours: Math.floor((s % 86400) / 3600),
      mins: Math.floor((s % 3600) / 60),
      secs: s % 60,
    };
  }

  // Live cross-feature trophies (Ash Ketchum, Master Catcher, Best Helper,
  // Battle Champ) — earned in the mini-games, surfaced on the front door.
  function liveTrophies() {
    const trophies = Store.liveTrophies();
    if (!trophies.length) return null;
    return el("div", { class: "trophy-strip" }, trophies.map((t) =>
      el("div", { class: "trophy" }, [
        el("span", { class: "trophy-emoji" }, t.emoji),
        el("div", { class: "trophy-txt" }, [
          el("div", { class: "trophy-title" }, t.title),
          el("div", { class: "trophy-holder" }, t.holder),
          el("div", { class: "trophy-sub" }, t.sub),
        ]),
      ])));
  }

  function oakTip() {
    const o = Store.state.oakTip || {};
    if (!o.quote) return null;
    return el("div", { class: "oak-tip" }, [
      o.image
        ? el("img", { src: o.image, alt: "Oak's tip" })
        : el("div", { class: "oak-ball" }, "👴"),
      el("div", {}, [
        el("div", { class: "oak-quote" }, "“" + o.quote + "”"),
        o.attribution ? el("div", { class: "oak-attr" }, "— " + o.attribution) : null,
      ]),
    ]);
  }

  // ---- Overworld region map (replaces the tile grid) ----------------------
  // Nine landmarks in a 100 x 64 viewBox. Single-destination landmarks link
  // straight through (r); multi-building "towns" (sub) open a town menu.
  const MAP = [
    { id: "settings", r: "settings",    e: "⚙️", t: "Settings",        x: 8,  y: 10 },
    { id: "lodge",    r: "roster",      e: "🎴", t: "The Lodge",       x: 13, y: 50 },
    { id: "tavern",   r: "drinks",      e: "🍺", t: "Lakeside Tavern", x: 32, y: 33 },
    { id: "safari", e: "🔴", t: "Safari Zone", x: 52, y: 11, sub: [
      { r: "safari",  e: "🔴", t: "Pokédex Safari", d: "Find, boost, throw — the catching game" },
      { r: "tracker", e: "🔬", t: "Pokédex Tracker", d: "All teams + the Type Gym Leaders" },
    ] },
    { id: "victory",  r: "victoryroad", e: "🏆", t: "Victory Rd",      x: 84, y: 40 },
    { id: "frontier", e: "⚔️", t: "Battle Frontier", x: 46, y: 46, sub: [
      { r: "battle",   e: "⚔️", t: "Battle Arena", d: "Any 1v1 or 2v2 — winner's team scores" },
      { r: "brackets", e: "🥊", t: "Brackets",     d: "Run a tournament" },
    ] },
    { id: "gamecorner", e: "🎰", t: "Game Corner", x: 68, y: 25, sub: [
      { r: "jeopardy",    e: "❓", t: "Jeopardy",   d: "Bulbasaur trivia + Daily Bulbas" },
      { r: "predictions", e: "🔮", t: "Oracle",     d: "Call it before it happens" },
      { r: "cards",       e: "🃏", t: "Card Table", d: "President, Euchre, King's Cup…" },
      { r: "challenges",  e: "🎣", t: "The Dock",   d: "Catch of the Day challenges" },
    ] },
    { id: "fame", e: "🏅", t: "Hall of Fame", x: 67, y: 52, sub: [
      { r: "badges",       e: "🏅", t: "Gym Badges",        d: "8 badges + the live trophies" },
      { r: "superlatives", e: "🗳️", t: "Awards",            d: "Vote the superlatives" },
      { r: "hall",         e: "🌿", t: "Hall of Bulbasaur", d: "The gallery wall" },
      { r: "messages",     e: "💌", t: "Message Wall",      d: "Notes for the groom (sealed!)" },
    ] },
    { id: "summit", e: "👑", t: "The Summit", x: 89, y: 12, sub: [
      { r: "ceremony", e: "👑", t: "Ceremony",    d: "Crown the champion + closing credits" },
      { r: "timeline", e: "📜", t: "Weekend Log", d: "Every moment, attributed" },
      { r: "stats",    e: "📊", t: "Trip Stats",  d: "Charts, Wrapped, exports" },
      { r: "poster",   e: "🖼️", t: "Poster",      d: "The keepsake board" },
    ] },
  ];
  const MAP_PATHS = [
    ["settings", "lodge"], ["lodge", "tavern"], ["tavern", "safari"], ["tavern", "frontier"],
    ["frontier", "gamecorner"], ["safari", "gamecorner"], ["frontier", "fame"],
    ["gamecorner", "victory"], ["fame", "victory"], ["victory", "summit"],
  ];

  // A town's menu of buildings.
  function openTown(id) {
    const n = MAP.find((m) => m.id === id);
    if (!n || !n.sub) return;
    if (window.SFX && SFX.blip) SFX.blip();
    const body = el("div", { class: "town-menu" }, n.sub.map((sb) =>
      el("a", { class: "town-item", href: "#/" + sb.r, onClick: () => ctrl.close() }, [
        el("span", { class: "town-e" }, sb.e),
        el("div", {}, [el("div", { class: "town-t" }, sb.t), el("div", { class: "town-d" }, sb.d)]),
      ])));
    const ctrl = Modal.open(n.e + " " + n.t, body, null, {});
  }

  function overworld() {
    const idx = {}; MAP.forEach((n) => (idx[n.id] = n));
    let s = '<svg viewBox="0 0 100 64" class="ow-svg" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Region map">';
    s += '<rect x="0" y="0" width="100" height="64" fill="#a6d88f"/>';
    s += '<ellipse cx="31" cy="18" rx="17" ry="8.5" fill="#8fd0e6" stroke="#6fb8d0" stroke-width="0.5"/>';
    [[5,40],[22,58],[45,60],[92,58],[78,20],[40,8],[97,30]].forEach((t) =>
      { s += '<circle cx="' + t[0] + '" cy="' + t[1] + '" r="2.1" fill="#5aa85a"/>'; });
    MAP_PATHS.forEach((pr) => {
      const p = idx[pr[0]], q = idx[pr[1]];
      if (!p || !q) return;
      s += '<line x1="' + p.x + '" y1="' + p.y + '" x2="' + q.x + '" y2="' + q.y +
        '" stroke="#efe1ac" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="0.1 3.2"/>';
    });
    MAP.forEach((n) => {
      const town = !!n.sub;
      s += town
        ? '<g class="ow-node" data-town="' + n.id + '" style="cursor:pointer">'
        : '<a href="#/' + n.r + '" class="ow-node">';
      const r = town ? 5.6 : 4.7;
      s += '<circle cx="' + n.x + '" cy="' + n.y + '" r="' + r + '" fill="#ffffff" stroke="#1f2330" stroke-width="0.8"/>';
      s += '<text x="' + n.x + '" y="' + (n.y + 0.3) + '" text-anchor="middle" dominant-baseline="central" font-size="' + (town ? 5.2 : 4.6) + '">' + n.e + '</text>';
      if (town) {
        s += '<circle cx="' + (n.x + 4.4) + '" cy="' + (n.y - 4.4) + '" r="2.3" fill="#e6352f" stroke="#fff" stroke-width="0.5"/>';
        s += '<text x="' + (n.x + 4.4) + '" y="' + (n.y - 4.1) + '" text-anchor="middle" dominant-baseline="central" font-size="2.8" fill="#fff" font-weight="bold">' + n.sub.length + '</text>';
      }
      s += '<text x="' + n.x + '" y="' + (n.y + r + 3.4) + '" text-anchor="middle" font-size="3" class="ow-label">' + n.t + '</text>';
      s += town ? '</g>' : '</a>';
    });
    s += '</svg>';
    const wrap = el("div", { class: "overworld" });
    wrap.innerHTML = s;
    wrap.addEventListener("click", (e) => {
      const g = e.target.closest && e.target.closest("[data-town]");
      if (g) openTown(g.getAttribute("data-town"));
    });
    return wrap;
  }

  function view(root) {
    const p = Store.state.party;
    const target = new Date(p.startDate);

    // Live-battle banner — appears while a room battle is on, so anyone who
    // dismissed the alert can still jump in to watch.
    if (window.Sync) {
      const liveHost = el("div", {});
      root.appendChild(liveHost);
      Sync.onLiveBattle((data) => {
        liveHost.innerHTML = "";
        if (!data || data.state !== "live") return;
        const btn = el("button", { class: "btn primary sm" }, "👀 Watch");
        btn.addEventListener("click", () => { if (window.watchLiveBattle) watchLiveBattle(data); });
        liveHost.appendChild(el("div", { class: "live-banner" }, [
          el("span", { class: "live-dot" }),
          el("span", { class: "live-txt" }, "LIVE: " + data.aName + " vs " + data.bName + (data.event ? " · " + data.event : "")),
          btn,
        ]));
      });
    }

    // Quick actions for the signed-in trainer — log your own drink or a photo
    // straight from the home screen (no navigating).
    const meId = window.Sync && Sync.getMe && Sync.getMe();
    if (meId && Store.attendee(meId)) {
      const me = Store.attendee(meId);
      const whichIn = el("input", { class: "in", placeholder: "Which one? (optional — e.g. Bud Light)" });
      root.appendChild(el("h2", { class: "section-title" }, "⚡ Quick log — " + me.name));
      root.appendChild(whichIn);
      root.appendChild(el("div", { class: "drink-btns" }, Store.drinkTypes().map((d) =>
        el("button", { class: "drink-btn", onClick: () => { Store.logDrink(meId, d.type, whichIn.value); whichIn.value = ""; if (window.SFX) SFX.coin(); } }, [
          el("span", { class: "drink-e" }, d.emoji), el("span", {}, d.type),
        ]))));
      root.appendChild(el("div", { class: "toolbar" }, [
        el("button", { class: "btn subtle", onClick: () => { if (window.PhotoLog) PhotoLog.capture(); } }, "📸 Add a photo moment"),
      ]));
    }

    const hero = el("section", { class: "hero" }, [
      p.heroImage
        ? el("img", { class: "hero-img", src: p.heroImage, alt: p.title })
        : el("div", { class: "hero-ball" }),
      el("div", { class: "hero-badge" }, "Bachelor Party HQ"),
      el("h1", { class: "hero-title" }, p.title || "Bachelor Party"),
      el("p", { class: "hero-sub" }, p.subtitle || ""),
      p.location ? el("p", { class: "cd-loc" }, "📍 " + p.location) : null,
      p.venue ? el("p", { class: "hero-blurb" }, p.venue) : null,
      el("p", { class: "hero-blurb" }, p.blurb || ""),
    ]);

    const cd = el("div", { class: "countdown" });
    function renderCd() {
      const parts = countdownParts(target);
      cd.innerHTML = "";
      if (!parts) { cd.appendChild(el("p", { class: "cd-note" }, "Set the party date in Settings.")); return; }
      if (parts.done) { cd.appendChild(el("p", { class: "cd-live" }, "🔥 It's GO time — the party is on!")); return; }
      const unit = (n, label) => el("div", { class: "cd-unit" }, [
        el("span", { class: "cd-num" }, String(n).padStart(2, "0")),
        el("span", { class: "cd-label" }, label),
      ]);
      cd.appendChild(el("div", { class: "cd-title" }, "Trainers assemble in"));
      cd.appendChild(el("div", { class: "cd-row" }, [
        unit(parts.days, "days"), unit(parts.hours, "hrs"),
        unit(parts.mins, "min"), unit(parts.secs, "sec"),
      ]));
    }
    renderCd();
    const timer = setInterval(() => {
      if (!document.body.contains(cd)) { clearInterval(timer); return; }
      renderCd();
    }, 1000);

    root.appendChild(hero);
    root.appendChild(cd);
    const trophies = liveTrophies();
    if (trophies) { root.appendChild(el("h2", { class: "section-title" }, "🏅 Live Trophies")); root.appendChild(trophies); }
    const oak = oakTip();
    if (oak) { root.appendChild(el("h2", { class: "section-title" }, "Oak's Tip")); root.appendChild(oak); }
    root.appendChild(el("h2", { class: "section-title" }, "Explore the Region"));
    root.appendChild(overworld());
  }

  window.Views = window.Views || {};
  window.Views.home = view;
})();
