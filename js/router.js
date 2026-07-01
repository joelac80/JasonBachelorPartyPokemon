/*
 * router.js — minimal hash router. Global `Router`.
 * Routes register a render(root) function; navigation is via #/route.
 */
(function () {
  const routes = {};
  let notFound = null;

  const Router = {
    add(path, view) { routes[path] = view; return this; },
    setNotFound(view) { notFound = view; },

    current() {
      const hash = location.hash.replace(/^#\/?/, "");
      const [path, ...rest] = hash.split("/");
      return { path: path || "home", param: rest.join("/") };
    },

    go(path) { location.hash = "#/" + path; },

    render() {
      const root = document.getElementById("view");
      if (!root) return;
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
      window.scrollTo(0, 0);
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
