/* activities.js — the weekend itinerary, grouped by day. */
(function () {
  const { el } = U;

  function view(root) {
    root.appendChild(el("div", { class: "page-head" }, [
      el("h1", {}, "🗓️ The Itinerary"),
      el("p", { class: "page-sub" }, "The weekend game plan. Subject to lake time."),
    ]));

    const acts = Store.state.activities;
    if (!acts.length) {
      root.appendChild(el("p", { class: "empty" }, "No activities yet — add them in Settings."));
      return;
    }

    // group by day, preserving first-seen order
    const days = [];
    const byDay = {};
    acts.forEach((a) => {
      const d = a.day || "Anytime";
      if (!byDay[d]) { byDay[d] = []; days.push(d); }
      byDay[d].push(a);
    });

    days.forEach((d) => {
      root.appendChild(el("h2", { class: "day-title" }, d));
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

  window.Views = window.Views || {};
  window.Views.activities = view;
})();
