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
    .add("ceremony", V.ceremony)
    .add("settings", V.settings)
    .add("help", V.help);
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

  // Music on/off toggle (background chiptune).
  const musicBtn = document.getElementById("music-toggle");
  if (musicBtn && window.SFX && SFX.toggleMusic) {
    const syncMusic = () => { musicBtn.classList.toggle("off", !SFX.isMusicOn()); };
    syncMusic();
    musicBtn.addEventListener("click", () => { SFX.toggleMusic(); syncMusic(); });
  } else if (musicBtn) {
    musicBtn.style.display = "none";
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

  // Optional live sync — connects only if a room was configured + enabled.
  if (window.Sync && Sync.init) {
    const dot = document.getElementById("sync-dot");
    if (dot) {
      const COLOR = { live: "#2ec96b", connecting: "#e6a100", error: "#e6352f", off: "#888" };
      const TITLE = { live: "Live — synced with the room", connecting: "Connecting to the room…", error: "Sync error — tap for Settings", off: "Sync off" };
      Sync.onStatus((state, msg) => {
        dot.style.display = state === "off" ? "none" : "inline-block";
        dot.dataset.state = state;
        dot.style.setProperty("--dot", COLOR[state] || "#888");
        dot.title = (state === "live" && msg && msg !== "Synced") ? "Live — " + msg : (TITLE[state] || "Live sync");
      });
    }
    Sync.init();

    // Incoming battle challenge → prompt to accept anywhere in the app.
    const el = U.el;
    Sync.onChallengeIncoming((ch) => {
      if (!window.Modal) return;
      if (window.SFX && SFX.select) SFX.select();
      let ctrl;
      const body = el("div", { class: "chal-modal" }, [
        el("div", { class: "chal-line" }, "⚔ " + (ch.fromName || "Someone") + " challenges you to a battle!"),
        ch.event ? el("div", { class: "chal-ev" }, "Event: " + ch.event) : null,
        el("div", { class: "toolbar" }, [
          el("button", { class: "btn primary", onClick: () => { Sync.respondChallenge(ch, true); if (ctrl) ctrl.close(); } }, "✅ Accept & battle"),
          el("button", { class: "btn subtle", onClick: () => { Sync.respondChallenge(ch, false); if (ctrl) ctrl.close(); } }, "Decline"),
        ]),
      ]);
      ctrl = Modal.open("Battle challenge!", body, null, {});
    });

    // Both phones launch the battle screen when a challenge is accepted.
    Sync.onChallengeAccepted((ch) => {
      if (window.Battle && Battle.start) {
        Battle.start({
          title: ch.event || "Challenge",
          a: { label: ch.fromName || "Challenger", names: [ch.fromName] },
          b: { label: ch.toName || "Opponent", names: [ch.toName] },
        });
      }
    });
  }
})();
