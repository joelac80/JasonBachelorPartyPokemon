/* activities.js — The Game Plan grid + optional itinerary timeline. */
(function () {
  const { el } = U;

  function gamePlan(root) {
    const gp = Store.state.gamePlan || [];
    if (!gp.length) return;
    root.appendChild(el("h2", { class: "section-title" }, "The Game Plan"));
    root.appendChild(el("div", { class: "gameplan-grid" }, gp.map((g) =>
      el("div", { class: "gp-item" + (g.wildcard ? " wild" : "") }, [
        el("div", { class: "gp-emoji" }, g.emoji || "🎯"),
        el("div", {}, [
          g.wildcard ? el("div", { class: "gp-wildtag" }, "Wildcard") : null,
          el("div", { class: "gp-name" }, g.name || ""),
          g.note ? el("div", { class: "gp-note" }, g.note) : null,
        ]),
      ])
    )));
  }

  function itinerary(root) {
    const acts = Store.state.activities || [];
    if (!acts.length) return;

    root.appendChild(el("h2", { class: "section-title" }, "The Schedule"));

    const days = [];
    const byDay = {};
    acts.forEach((a) => {
      const d = a.day || "Anytime";
      if (!byDay[d]) { byDay[d] = []; days.push(d); }
      byDay[d].push(a);
    });

    days.forEach((d) => {
      root.appendChild(el("h3", { class: "day-title" }, d));
      root.appendChild(el("div", { class: "timeline" },
        byDay[d].map((a) =>
          el("div", { class: "tl-item" }, [
            el("div", { class: "tl-time" }, a.time || ""),
            el("div", { class: "tl-dot" }),
            el("div", { class: "tl-body" }, [
              el("div", { class: "tl-title" }, (a.emoji || "•") + " " + (a.title || "")),
              a.desc ? el("div", { class: "tl-desc" }, a.desc) : null,
            ]),
          ])
        )
      ));
    });
  }

  function view(root) {
    root.appendChild(el("div", { class: "page-head" }, [
      el("h1", {}, "🗓️ Game Plan"),
      el("p", { class: "page-sub" }, "The weekend line-up. Subject to lake time." ),
    ]));

    gamePlan(root);
    itinerary(root);

    if (!(Store.state.gamePlan || []).length && !(Store.state.activities || []).length) {
      root.appendChild(el("p", { class: "empty" }, "Nothing scheduled yet — add items in Settings."));
    }
  }

  window.Views = window.Views || {};
  window.Views.activities = view;
})();
