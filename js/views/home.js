/* home.js — landing hub with countdown + quick nav. */
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

  const TILES = [
    { route: "victoryroad", emoji: "🏆", title: "Victory Road", desc: "Beer Olympics scoreboard & events" },
    { route: "draft",       emoji: "🎡", title: "Draft & Wheel", desc: "Spin to draft the teams" },
    { route: "roster",      emoji: "🎴", title: "Trainer Cards", desc: "Everyone at the party" },
    { route: "activities",  emoji: "🗓️", title: "The Itinerary", desc: "The weekend game plan" },
    { route: "memes",       emoji: "😂", title: "Meme Vault", desc: "The good stuff" },
    { route: "settings",    emoji: "⚙️", title: "Settings", desc: "Data, backup & reset" },
  ];

  function view(root) {
    const p = Store.state.party;
    const target = new Date(p.startDate);

    const hero = el("section", { class: "hero" }, [
      el("div", { class: "hero-badge" }, "⚡ Bachelor Party HQ"),
      el("h1", { class: "hero-title" }, p.title || "Bachelor Party"),
      el("p", { class: "hero-sub" }, p.subtitle || ""),
      el("p", { class: "hero-blurb" }, p.blurb || ""),
    ]);

    const cd = el("div", { class: "countdown" });
    function renderCd() {
      const parts = countdownParts(target);
      cd.innerHTML = "";
      if (!parts) {
        cd.appendChild(el("p", { class: "cd-note" }, "Set the party date in Settings."));
        return;
      }
      if (parts.done) {
        cd.appendChild(el("p", { class: "cd-live" }, "🔥 It's GO time — the party is on!"));
        return;
      }
      const unit = (n, label) => el("div", { class: "cd-unit" }, [
        el("span", { class: "cd-num" }, String(n).padStart(2, "0")),
        el("span", { class: "cd-label" }, label),
      ]);
      cd.appendChild(el("div", { class: "cd-title" }, "Trainers assemble in"));
      cd.appendChild(el("div", { class: "cd-row" }, [
        unit(parts.days, "days"), unit(parts.hours, "hrs"),
        unit(parts.mins, "min"), unit(parts.secs, "sec"),
      ]));
      cd.appendChild(el("div", { class: "cd-loc" }, "📍 " + (p.location || "")));
    }
    renderCd();
    const timer = setInterval(() => {
      if (!document.body.contains(cd)) { clearInterval(timer); return; }
      renderCd();
    }, 1000);

    const grid = el("div", { class: "tile-grid" },
      TILES.map((t) =>
        el("a", { class: "tile", href: "#/" + t.route }, [
          el("div", { class: "tile-emoji" }, t.emoji),
          el("div", { class: "tile-title" }, t.title),
          el("div", { class: "tile-desc" }, t.desc),
        ])
      )
    );

    root.appendChild(hero);
    root.appendChild(cd);
    root.appendChild(grid);
  }

  window.Views = window.Views || {};
  window.Views.home = view;
})();
