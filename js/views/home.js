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

  function fanBadges() {
    const badges = Store.state.badges || [];
    if (!badges.length) return null;
    return el("div", { class: "badge-strip" }, badges.map((b) =>
      el("div", { class: "badge" }, [
        b.img
          ? el("img", { src: b.img, alt: b.name })
          : el("span", { class: "badge-dot", style: { background: b.color || "#888" } }),
        el("span", {}, b.name),
      ])
    ));
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
  // Locations placed in a 100 x 64 viewBox; the SVG scales to fit any width.
  const MAP = [
    { r: "roster",       e: "🎴", t: "Squad",     x: 12, y: 51 },
    { r: "draft",        e: "🎡", t: "Draft",     x: 26, y: 43 },
    { r: "activities",   e: "🗓️", t: "Game Plan", x: 14, y: 30 },
    { r: "challenges",   e: "🎣", t: "The Dock",  x: 32, y: 25 },
    { r: "battle",       e: "⚔️", t: "Battle",    x: 43, y: 44 },
    { r: "brackets",     e: "🥊", t: "Brackets",  x: 45, y: 24 },
    { r: "jeopardy",     e: "❓", t: "Jeopardy",  x: 57, y: 34 },
    { r: "superlatives", e: "🗳️", t: "Awards",    x: 58, y: 52 },
    { r: "badges",       e: "🏅", t: "Badges",    x: 70, y: 43 },
    { r: "hall",         e: "🌿", t: "Hall",      x: 71, y: 24 },
    { r: "memes",        e: "😂", t: "Memes",     x: 84, y: 52 },
    { r: "victoryroad",  e: "🏆", t: "Victory Rd",x: 84, y: 33 },
    { r: "ceremony",     e: "👑", t: "Champion",  x: 86, y: 15 },
    { r: "settings",     e: "⚙️", t: "Settings",  x: 10, y: 14 },
  ];
  const MAP_PATHS = [[0,1],[1,4],[4,6],[6,8],[8,11],[11,12],[1,2],[2,3],[4,5],[6,7],[8,9],[7,10],[10,11],[0,13]];

  function overworld() {
    const idx = {}; MAP.forEach((n) => (idx[n.r] = n));
    let s = '<svg viewBox="0 0 100 64" class="ow-svg" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Region map">';
    s += '<rect x="0" y="0" width="100" height="64" fill="#a6d88f"/>';
    s += '<ellipse cx="31" cy="18" rx="17" ry="8.5" fill="#8fd0e6" stroke="#6fb8d0" stroke-width="0.5"/>';
    [[5,40],[19,58],[52,60],[66,57],[81,20],[38,9],[97,44]].forEach((t) =>
      { s += '<circle cx="' + t[0] + '" cy="' + t[1] + '" r="2.1" fill="#5aa85a"/>'; });
    MAP_PATHS.forEach((pr) => {
      const p = MAP[pr[0]], q = MAP[pr[1]];
      s += '<line x1="' + p.x + '" y1="' + p.y + '" x2="' + q.x + '" y2="' + q.y +
        '" stroke="#efe1ac" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="0.1 3.2"/>';
    });
    MAP.forEach((n) => {
      s += '<a href="#/' + n.r + '" class="ow-node">';
      s += '<circle cx="' + n.x + '" cy="' + n.y + '" r="4.7" fill="#ffffff" stroke="#1f2330" stroke-width="0.8"/>';
      s += '<text x="' + n.x + '" y="' + (n.y + 0.3) + '" text-anchor="middle" dominant-baseline="central" font-size="4.6">' + n.e + '</text>';
      s += '<text x="' + n.x + '" y="' + (n.y + 8) + '" text-anchor="middle" font-size="3" class="ow-label">' + n.t + '</text>';
      s += '</a>';
    });
    s += '</svg>';
    const wrap = el("div", { class: "overworld" });
    wrap.innerHTML = s;
    return wrap;
  }

  function view(root) {
    const p = Store.state.party;
    const target = new Date(p.startDate);

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
    const badges = fanBadges();
    if (badges) { root.appendChild(el("h2", { class: "section-title" }, "Fan Badges Earned")); root.appendChild(badges); }
    const oak = oakTip();
    if (oak) { root.appendChild(el("h2", { class: "section-title" }, "Oak's Tip")); root.appendChild(oak); }
    root.appendChild(el("h2", { class: "section-title" }, "Explore the Region"));
    root.appendChild(overworld());
  }

  window.Views = window.Views || {};
  window.Views.home = view;
})();
