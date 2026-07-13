/* home.js — landing hub: hero, countdown, fan badges, Oak's tip, nav. */
(function () {
  const { el } = U;
  let liveUnsub = null;   // so re-rendering Home doesn't stack live-battle subscribers

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
    { id: "safari", e: "🔴", t: "Safari Zone", x: 46, y: 12, sub: [
      { r: "safari",  e: "🔴", t: "Pokédex Safari", d: "Find, boost, throw — the catching game" },
      { r: "tracker", e: "🔬", t: "Pokédex Tracker", d: "All teams + the Type Masters" },
      { r: "trade",   e: "🔁", t: "Trading Post", d: "Swap caught Pokémon — some evolve when traded!" },
    ] },
    // ⚔️ Everything battle — the plateau where the ladders live.
    { id: "plateau", e: "🏟", t: "Indigo Plateau", x: 44, y: 46, sub: [
      { r: "regions",  e: "🗺", t: "The Journey",   d: "Every region — gyms → Elite Four → Champion, the Champions Cup & Movie Legends" },
      { r: "battle",   e: "⚔️", t: "Battle Arena",  d: "Real turn-based duels — singles or doubles, sips on the line" },
      { r: "tower",    e: "🗼", t: "Battle Tower",  d: "Streaks vs random trainers — PALMER every 7th, LEGENDS every 14th, rental mode" },
      { r: "nuzlocke", e: "🪦", t: "Nuzlocke Run",  d: "Permadeath Kanto → Johto → RED — fewest catches wears the crown" },
      { r: "dex",      e: "📕", t: "Pokédex",       d: "Every collection on one page — Gen 1-9, Hisui, Unown & Mega" },
    ] },
    { id: "victory",  r: "victoryroad", e: "🏆", t: "Victory Road",    x: 84, y: 40 },
    // 🎉 Everything that isn't catching or battling lives in Party Central.
    { id: "party", r: "party", e: "🎉", t: "Party Central", x: 68, y: 22 },
  ];
  const MAP_PATHS = [
    ["settings", "lodge"], ["lodge", "plateau"], ["safari", "plateau"],
    ["safari", "party"], ["plateau", "victory"], ["party", "victory"],
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

    // ⚡ Quick play — the crowd favorites, one tap from the front door.
    // (The drink quick-log moved out with the Tavern; see 📦 The Vault.)
    const QUICK = [
      { r: "safari",   e: "🔴", t: "Safari Zone",  d: "Catch 'em" },
      { r: "regions",  e: "🗺", t: "The Journey",  d: "Gyms → Champions" },
      { r: "battle",   e: "⚔️", t: "Battle Arena", d: "Real duels" },
      { r: "tower",    e: "🗼", t: "Battle Tower", d: "Streaks & PALMER" },
      { r: "nuzlocke", e: "🪦", t: "Nuzlocke",     d: "Permadeath run" },
      { r: "party",    e: "🎉", t: "Party Central", d: "Everything else" },
    ];
    root.appendChild(el("div", { class: "home-quick six" }, QUICK.map((q) =>
      el("a", { class: "hq-tile", href: "#/" + q.r }, [
        el("span", { class: "hq-e" }, q.e),
        el("span", { class: "hq-t" }, q.t),
        el("span", { class: "hq-d" }, q.d),
      ]))));

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

    const hero = el("section", { class: "hero" }, [
      p.heroImage
        ? el("img", { class: "hero-img", src: p.heroImage, alt: p.title })
        : el("div", { class: "hero-ball" }),
      el("div", { class: "hero-badge" }, "Party HQ"),
      el("h1", { class: "hero-title" }, p.title || "Pokémon Party"),
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

    // 📸 Snapshots strip — the latest photo moments, scroll sideways; tap one
    // to open it, or the header to jump to the full feed.
    const photos = (Store.state.photos || []).slice(0, 20);
    const head = el("h2", { class: "section-title snap-head", onClick: () => { location.hash = "#/feed"; } },
      [el("span", {}, "📸 Snapshots"), el("span", { class: "snap-all" }, "See all →")]);
    root.appendChild(head);
    root.appendChild(el("div", { class: "toolbar" }, [
      el("button", { class: "btn subtle sm", onClick: () => { if (window.PhotoLog) PhotoLog.capture(); } }, "📸 Add a photo moment"),
    ]));
    if (!photos.length) {
      root.appendChild(el("p", { class: "hint" }, "No photos yet — tap 📸 above (or the Snapshots feed) to start the roll."));
    } else {
      root.appendChild(el("div", { class: "snap-strip" }, photos.map((ph) =>
        el("figure", { class: "snap-shot", onClick: () => window.PhotoLog && PhotoLog.openDetail(ph.id, () => Router.render()) }, [
          el("img", { class: "snap-img", src: ph.img, alt: ph.caption || "" }),
          ph.by ? el("figcaption", { class: "snap-by" }, ph.by) : null,
        ]))));
    }
  }

  window.Views = window.Views || {};
  window.Views.home = view;
})();
