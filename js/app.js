/* app.js — bootstrap: register views, wire nav, start router. */
(function () {
  const V = window.Views || {};
  Router.add("home", V.home)
    .add("victoryroad", V.victoryroad)
    .add("draft", V.draft)
    .add("roster", V.roster)
    .add("activities", V.activities)
    .add("jeopardy", V.jeopardy)
    .add("brackets", V.brackets)
    .add("battle", V.battle)
    .add("safari", V.safari)
    .add("superlatives", V.superlatives)
    .add("challenges", V.challenges)
    .add("badges", V.badges)
    .add("hall", V.hall)
    .add("memes", V.memes)
    .add("ceremony", V.ceremony)
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

  // Sound on/off toggle (retro SFX).
  const sfxBtn = document.getElementById("sfx-toggle");
  if (sfxBtn && window.SFX) {
    const syncSfx = () => { sfxBtn.textContent = SFX.isMuted() ? "🔇" : "🔊"; };
    syncSfx();
    sfxBtn.addEventListener("click", () => { SFX.toggle(); syncSfx(); });
  } else if (sfxBtn) {
    sfxBtn.style.display = "none";
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

  Router.start();
})();
