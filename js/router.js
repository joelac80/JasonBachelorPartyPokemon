/*
 * router.js — minimal hash router. Global `Router`.
 * Routes register a render(root) function; navigation is via #/route.
 */
(function () {
  const routes = {};
  let notFound = null;

  // 🎬 Body-level CINEMATICS — full-screen title cards, rains and confetti that
  // get appended straight to <body> and clear themselves on a timer or a tap.
  // They belong to the page that raised them; left alone they ride a navigation
  // and sit on top of an unrelated screen, eating the first tap (the Hall's
  // Bulbasaur rain held the screen for 3.3s wherever you went next).
  // ✅ New cinematics: just add `cinematic` to the overlay's class list and the
  // sweep picks it up — no edit here. A live `.battle` duel is NOT a cinematic
  // and must never appear in this list; neither may modals (they own their own
  // close callbacks).
  const CINEMATIC_STRAYS = [
    "body > .cinematic",       // 🎬 the shared opt-in marker
    "body > .league-intro",    // league / legend / movie intros + story beats
    "body > .hall-intro",      // 🌿 HALL OF BULBA!! Bulbasaur rain
    "body > .hisui-rift",      // 🏔 the sky tears open
    "body > .cer-confetti",    // 👑 ceremony confetti
  ].join(", ");

  const Router = {
    add(path, view) { routes[path] = view; return this; },
    setNotFound(view) { notFound = view; },

    current() {
      const hash = location.hash.replace(/^#\/?/, "");
      const [path, ...rest] = hash.split("/");
      return { path: path || "home", param: rest.join("/") };
    },

    go(path) { location.hash = "#/" + path; },

    // opts.keepScroll — rebuild the view WITHOUT jumping back to the top.
    // Used for live-sync refreshes (a roommate's catch/drink shouldn't yank
    // your scroll position). Real navigation scrolls to top as usual.
    // The full hash last painted — tells a GENUINE navigation apart from a
    // same-route re-render (live-sync refreshes call render({keepScroll:true})
    // and must never disturb an open cinematic).
    _lastHash: null,

    render(opts) {
      const root = document.getElementById("view");
      if (!root) return;
      const keepScroll = !!(opts && opts.keepScroll);
      const prevY = keepScroll ? (window.scrollY || window.pageYOffset || 0) : 0;
      // Safety net: if no battle overlay is up, the page must be scrollable
      // (a directly-removed .battle would otherwise leave the lock stuck).
      if (!document.querySelector(".battle"))
        document.documentElement.classList.remove("scroll-lock");
      // 🎬 Curtain sweep: every body-level cinematic in CINEMATIC_STRAYS (league
      // /movie/legend intros, story-beat curtains, the Hall's Bulbasaur rain,
      // the Hisui rift, ceremony confetti) would otherwise survive navigation
      // and sit on top of an unrelated page. On a GENUINE route change — the
      // hash differs from the one last painted — clear the strays. A same-route
      // re-render (live-sync render({keepScroll:true})) leaves an open cinematic
      // alone, and a live .battle overlay rides through untouched either way.
      const hash = location.hash || "#/home";
      if (this._lastHash !== null && hash !== this._lastHash)
        document.querySelectorAll(CINEMATIC_STRAYS).forEach((n) => { try { n.remove(); } catch (_) {} });
      this._lastHash = hash;
      // Each render rebuilds the view; the outgoing view's "hold remote
      // re-renders" request is void. Views that still want it re-set it.
      window.__deferRender = null;
      const { path, param } = this.current();
      const view = routes[path] || notFound || routes["home"];
      root.innerHTML = "";
      root.scrollTop = 0;
      try {
        view(root, param);
      } catch (e) {
        console.error("Router: view failed", path, e);
        root.textContent = "Something went wrong rendering this page.";
      }
      this._highlightNav(path);
      // Restore the reader's place on a live-sync refresh; otherwise top.
      window.scrollTo(0, keepScroll ? prevY : 0);
    },

    _highlightNav(path) {
      document.querySelectorAll("[data-route]").forEach((a) => {
        a.classList.toggle("active", a.getAttribute("data-route") === path);
      });
    },

    start() {
      window.addEventListener("hashchange", () => this.render());
      if (!location.hash) location.hash = "#/home";
      this.render();
    },
  };

  window.Router = Router;
})();
