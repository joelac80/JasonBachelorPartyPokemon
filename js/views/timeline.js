/* timeline.js — the Weekend Log: the full attributed activity feed (every
   catch, battle, drink, card round, prediction, badge and photo), filterable
   by category and by who logged it. The scrollable history of the trip. */
(function () {
  const { el } = U;
  function nm(id) { const a = Store.attendee(id); return a ? a.name : ""; }
  function timeOf(ts) { try { return new Date(ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }); } catch (_) { return ""; } }

  const CATS = [
    { key: "all", label: "All", match: null },
    { key: "safari", label: "🔴 Catches", icons: ["🔴"] },
    { key: "battle", label: "⚔️ Battles", icons: ["⚔️"] },
    { key: "drink", label: "🍺 Drinks", icons: ["🍺", "🍻", "🥃", "🍸", "🍷", "💧", "🥤", "🍾", "🥂"] },
    { key: "cards", label: "🃏 Cards", icons: ["🃏", "♠️", "🚌", "👑", "💩"] },
    { key: "oracle", label: "🔮 Oracle", icons: ["🔮"] },
    { key: "badge", label: "🏅 Badges", icons: ["🏅"] },
    { key: "photo", label: "📸 Photos", photo: true },
  ];
  function catOf(entry) {
    if (entry.img) return "photo";
    for (let i = 1; i < CATS.length; i++) { if (CATS[i].icons && CATS[i].icons.indexOf(entry.icon) >= 0) return CATS[i].key; }
    return "other";
  }

  function view(root) {
    let cat = "all", who = "";

    root.appendChild(el("div", { class: "page-head" }, [
      el("h1", {}, "📜 Weekend Log"),
      el("p", { class: "page-sub" }, "Every moment of the trip, stamped with who logged it. Filter by what happened or by scorekeeper." ),
    ]));

    // merged feed: text moments + photos
    function feed() {
      const moments = (Store.state.chronicle || []).map((c) => ({ ts: c.ts, icon: c.icon, text: c.text, by: c.by }));
      const photos = (Store.state.photos || []).map((p) => ({ ts: p.ts, img: p.img, text: p.caption, by: p.loggedBy, who: p.by, id: p.id, reactions: p.reactions, comments: p.comments }));
      return moments.concat(photos).sort((a, b) => b.ts - a.ts);   // newest first
    }

    const statHost = el("div", {}), filterHost = el("div", {}), listHost = el("div", {});
    [statHost, filterHost, listHost].forEach((h) => root.appendChild(h));

    function renderStats() {
      statHost.innerHTML = "";
      const all = feed();
      const keeper = Store.state.attendees.map((a) => ({ a: a, n: Store.logCount(a.id) })).filter((r) => r.n > 0).sort((x, y) => y.n - x.n)[0];
      statHost.appendChild(el("div", { class: "safari-stats" }, [
        el("div", { class: "safari-stat" }, [el("div", { class: "safari-stat-v" }, String(all.length)), el("div", { class: "safari-stat-l" }, "Moments logged")]),
        el("div", { class: "safari-stat" }, [el("div", { class: "safari-stat-v" }, String((Store.state.photos || []).length)), el("div", { class: "safari-stat-l" }, "Photos")]),
        el("div", { class: "safari-stat" }, [el("div", { class: "safari-stat-v" }, keeper ? "📋" : "—"), el("div", { class: "safari-stat-l" }, keeper ? keeper.a.name.split(" ")[0] + " leads" : "No logs yet")]),
      ]));
    }

    function renderFilters() {
      filterHost.innerHTML = "";
      filterHost.appendChild(el("div", { class: "tl-cats" }, CATS.map((c) =>
        el("button", { class: "chip" + (c.key === cat ? " on" : ""), onClick: () => { cat = c.key; renderList(); paintCats(); } }, c.label))));
      const sel = el("select", { class: "in" }, [el("option", { value: "" }, "Logged by: everyone")].concat(
        Store.state.attendees.map((a) => el("option", { value: a.id, selected: a.id === who ? "true" : null }, "Logged by: " + a.name))));
      sel.addEventListener("change", () => { who = sel.value; renderList(); });
      filterHost.appendChild(el("div", { class: "tl-who" }, [sel]));
    }
    function paintCats() {
      const btns = filterHost.querySelectorAll(".tl-cats .chip");
      btns.forEach((b, i) => b.classList.toggle("on", CATS[i].key === cat));
    }

    function entryEl(c) {
      const meta = el("div", { class: "tl-meta" }, timeOf(c.ts) + (c.by ? " · 📋 " + nm(c.by) : ""));
      if (c.img) {
        const counts = {}; (c.reactions || []).forEach((r) => { counts[r.emoji] = (counts[r.emoji] || 0) + 1; });
        const summary = Object.keys(counts).map((e) => e + counts[e]).join(" ");
        return el("div", { class: "tl-row photo", onClick: () => window.PhotoLog && PhotoLog.openDetail(c.id, () => renderList()) }, [
          el("img", { class: "tl-thumb", src: c.img, alt: c.text || "", loading: "lazy" }),
          el("div", { class: "tl-body" }, [
            el("div", { class: "tl-text" }, "📸 " + (c.text || "Photo") + (c.who ? " — " + c.who : "")),
            el("div", { class: "tl-meta" }, timeOf(c.ts) + (summary ? " · " + summary : "") + ((c.comments && c.comments.length) ? " · 💬 " + c.comments.length : "") + (c.by ? " · 📋 " + nm(c.by) : "")),
          ]),
        ]);
      }
      return el("div", { class: "tl-row" }, [
        el("span", { class: "tl-icon" }, c.icon || "•"),
        el("div", { class: "tl-body" }, [el("div", { class: "tl-text" }, c.text), meta]),
      ]);
    }

    function renderList() {
      listHost.innerHTML = "";
      let items = feed();
      if (cat !== "all") items = items.filter((c) => catOf(c) === cat);
      if (who) items = items.filter((c) => c.by === who);
      if (!items.length) { listHost.appendChild(el("p", { class: "hint" }, "Nothing here yet — play some games, log some drinks, snap some photos.")); return; }
      // group by day, newest day first
      const byDay = []; let curKey = null, cur = null;
      items.forEach((c) => { const k = Store.dayKey(c.ts); if (k !== curKey) { curKey = k; cur = { label: Store.dayLabel(c.ts), items: [] }; byDay.push(cur); } cur.items.push(c); });
      listHost.appendChild(el("div", { class: "tl-feed" }, byDay.map((d) =>
        el("div", { class: "tl-day" }, [el("div", { class: "tl-day-h" }, d.label), el("div", { class: "tl-day-items" }, d.items.map(entryEl))]))));
    }

    renderStats(); renderFilters(); renderList();
  }

  window.Views = window.Views || {};
  window.Views.timeline = view;
})();
