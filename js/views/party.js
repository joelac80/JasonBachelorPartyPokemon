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
