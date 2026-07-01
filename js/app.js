/* app.js — bootstrap: register views, wire nav, start router. */
(function () {
  const V = window.Views || {};
  Router.add("home", V.home)
    .add("victoryroad", V.victoryroad)
    .add("draft", V.draft)
    .add("roster", V.roster)
    .add("activities", V.activities)
    .add("memes", V.memes)
    .add("settings", V.settings);
  Router.setNotFound(V.home);

  // Reflect party title into the header + document title.
  function syncTitle() {
    const t = (Store.state.party && Store.state.party.title) || "Bachelor Party HQ";
    document.title = t;
    const brand = document.getElementById("brand-title");
    if (brand) brand.textContent = t;
  }
  Store.subscribe(syncTitle);
  syncTitle();

  // Mobile nav toggle.
  const toggle = document.getElementById("nav-toggle");
  const nav = document.getElementById("nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => nav.classList.toggle("open"));
    nav.addEventListener("click", (e) => {
      if (e.target.closest("a")) nav.classList.remove("open");
    });
  }

  Router.start();
})();
