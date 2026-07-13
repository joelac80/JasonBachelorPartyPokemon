/* party.js — 🎉 PARTY CENTRAL: the one door to everything that isn't
   catching or battling. Games, honors, the record of the weekend, and the
   quieter Vault corners — all as tappable cards, grouped the way the old
   nav sections were. Keeps the main menu lean: Catch, Battle, Party. */
(function () {
  const { el } = U;

  const SECTIONS = [
    { head: "🎰 Game Corner", items: [
      { r: "jeopardy",    e: "❓", t: "Jeopardy",   d: "Bulbasaur trivia + Daily Bulbas" },
      { r: "cards",       e: "🃏", t: "Card Table", d: "President, Euchre, King's Cup…" },
    ] },
    { head: "🏅 Honors Hall", items: [
      { r: "badges",      e: "🏅", t: "Weekend Badges", d: "8 party badges + the live trophies" },
      { r: "feed",        e: "📸", t: "Snapshots",      d: "The photo feed — react + comment as your trainer" },
    ] },
    { head: "👑 The Summit", items: [
      { r: "ceremony",    e: "👑", t: "Ceremony",    d: "Crown the champion + closing credits" },
      { r: "timeline",    e: "📜", t: "Weekend Log", d: "Every moment, attributed" },
      { r: "stats",       e: "📊", t: "Trip Stats",  d: "Charts, Wrapped, exports" },
      { r: "poster",      e: "🖼️", t: "Poster",      d: "The keepsake board" },
    ] },
    { head: "📦 The Vault", items: [
      { r: "brackets",     e: "🥊", t: "Party Brackets", d: "Run a tournament — matchups launch real duels" },
      { r: "predictions",  e: "🔮", t: "Oracle",         d: "Call it before it happens" },
      { r: "challenges",   e: "🎣", t: "Daily Dares",    d: "The Dock — reel in the Catch of the Day" },
      { r: "drinks",       e: "🍺", t: "Drink Tracker",  d: "The Lakeside Tavern's old ledger" },
      { r: "superlatives", e: "🗳️", t: "Superlatives",   d: "Vote the end-of-weekend awards" },
      { r: "hall",         e: "🌿", t: "Gallery",        d: "The Hall of Bulbasaur — photos & art wall" },
      { r: "messages",     e: "💌", t: "Message Wall",   d: "Notes for the groom (sealed!)" },
    ] },
  ];

  function view(root) {
    root.appendChild(el("div", { class: "page-head" }, [
      el("h1", {}, "🎉 Party Central"),
      el("p", { class: "page-sub" }, "Everything that isn't catching or battling — the games, the honors, the record of the weekend, and the Vault."),
    ]));

    // ⏳ Countdown to the gathering (moved here from Home — party logistics
    // live with the party). Ticks live while a date is set in ⚙️ Settings.
    (function countdown() {
      const target = new Date((Store.state.party || {}).startDate);
      if (isNaN(target - 0)) return;
      const cd = el("div", { class: "countdown" });
      root.appendChild(cd);
      function paint() {
        const diff = target - new Date();
        cd.innerHTML = "";
        if (diff <= 0) { cd.appendChild(el("p", { class: "cd-live" }, "🔥 It's GO time — the party is on!")); return; }
        const s = Math.floor(diff / 1000);
        const unit = (n, label) => el("div", { class: "cd-unit" }, [
          el("span", { class: "cd-num" }, String(n).padStart(2, "0")),
          el("span", { class: "cd-label" }, label),
        ]);
        cd.appendChild(el("div", { class: "cd-title" }, "Trainers assemble in"));
        cd.appendChild(el("div", { class: "cd-row" }, [
          unit(Math.floor(s / 86400), "days"), unit(Math.floor((s % 86400) / 3600), "hrs"),
          unit(Math.floor((s % 3600) / 60), "min"), unit(s % 60, "sec"),
        ]));
      }
      paint();
      const timer = setInterval(() => {
        if (!document.body.contains(cd)) { clearInterval(timer); return; }
        paint();
      }, 1000);
    })();

    SECTIONS.forEach((sec) => {
      root.appendChild(el("h2", { class: "section-title" }, sec.head));
      root.appendChild(el("div", { class: "party-grid" }, sec.items.map((q) =>
        el("a", { class: "party-card", href: "#/" + q.r }, [
          el("span", { class: "party-card-e" }, q.e),
          el("span", { class: "party-card-t" }, q.t),
          el("span", { class: "party-card-d" }, q.d),
        ]))));
    });
  }

  window.Views = window.Views || {};
  window.Views.party = view;
})();
