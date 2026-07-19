/* feed.js — 📸 Snapshots: the weekend's photo feed, PokéGram-style.
   Every photo moment in one scrolling feed — poster's trainer avatar,
   caption, WHEN it happened, tap-to-react as your trainer, and comments.
   Photos sync over their own channel, so the whole room shares one feed. */
(function () {
  const { el } = U;

  function fmtTime(ts) {
    if (!ts) return "";
    try {
      const d = new Date(ts);
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      let h = d.getHours(); const m = String(d.getMinutes()).padStart(2, "0");
      const ap = h >= 12 ? "PM" : "AM"; h = h % 12 || 12;
      return days[d.getDay()] + " " + h + ":" + m + " " + ap;
    } catch (_) { return ""; }
  }

  function avatarFor(name) {
    const a = Store.state.attendees.find((x) => x.name === name);
    if (a) {
      if (a.photo) return el("img", { class: "feed-ava", src: a.photo, alt: "" });
      const f = Store.currentForm(a);
      const src = Store.favSprite(a);
      if (src) return el("img", { class: "feed-ava", src: src, alt: "" });
    }
    return el("span", { class: "feed-ava ball" }, "◓");
  }

  // selection mode persists across the in-view re-render
  let selecting = false;
  const picked = {};   // photoId -> true

  function view(root) {
    root.appendChild(el("div", { class: "page-head" }, [
      el("h1", {}, "📸 Snapshots"),
      el("p", { class: "page-sub" }, "The weekend's feed — every photo moment, who posted it, and when. React and comment as your trainer." ),
    ]));

    const photos = (Store.state.photos || []).slice();

    // top toolbar: take a new photo, upload one from the phone, and (when there
    // are photos) select-to-save.
    const tools = [
      el("button", { class: "btn spin-btn", onClick: () => { if (window.PhotoLog) PhotoLog.capture(() => Router.render(), { source: "camera" }); } }, "📸 Take a photo"),
      el("button", { class: "btn spin-btn", onClick: () => { if (window.PhotoLog) PhotoLog.capture(() => Router.render(), { source: "library" }); } }, "🖼 Upload a photo"),
    ];
    if (photos.length) tools.push(el("button", { class: "btn subtle", onClick: () => {
      selecting = !selecting;
      // leaving select mode drops the picks — coming back later shouldn't
      // resume a stale half-selection from last visit
      if (!selecting) Object.keys(picked).forEach((k) => delete picked[k]);
      Router.render();
    } }, selecting ? "✕ Done selecting" : "⬇️ Select & save"));
    root.appendChild(el("div", { class: "toolbar", style: { justifyContent: "center" } }, tools));

    if (!photos.length) {
      root.appendChild(el("p", { class: "empty" }, "No snapshots yet — be the first. Every photo lands here, on the Weekend Log, and on the Poster."));
      return;
    }

    // ---- SELECT & SAVE grid ----
    if (selecting) {
      const countLbl = el("span", { class: "sel-count" });
      const grid = el("div", { class: "sel-grid" });
      function paintCount() {
        const n = Object.keys(picked).filter((k) => picked[k]).length;
        countLbl.textContent = n + " selected";
        saveBtn.disabled = n ? null : "true";
        saveBtn.textContent = n ? "⬇️ Save " + n + " photo" + (n > 1 ? "s" : "") : "⬇️ Save";
      }
      const saveBtn = el("button", { class: "btn primary" });
      saveBtn.onclick = () => {
        const chosen = photos.filter((p) => picked[p.id]);
        if (chosen.length && window.PhotoLog) PhotoLog.saveMany(chosen);
      };
      root.appendChild(el("p", { class: "hint" }, "Tap the photos you want, then Save. On iPhone this opens the share sheet (choose “Save Images”); elsewhere it downloads a zip." ));
      root.appendChild(el("div", { class: "toolbar sel-bar" }, [
        el("button", { class: "btn subtle sm", onClick: () => { photos.forEach((p) => { picked[p.id] = true; }); Router.render(); } }, "Select all"),
        el("button", { class: "btn subtle sm", onClick: () => { Object.keys(picked).forEach((k) => delete picked[k]); Router.render(); } }, "Clear"),
        countLbl,
      ]));
      photos.forEach((p) => {
        const cell = el("button", { class: "sel-cell" + (picked[p.id] ? " on" : ""), onClick: () => {
          picked[p.id] = !picked[p.id]; cell.classList.toggle("on", !!picked[p.id]); paintCount();
        } }, [
          el("img", { class: "sel-img", src: p.img, alt: "" }),
          el("span", { class: "sel-check" }, "✓"),
        ]);
        grid.appendChild(cell);
      });
      root.appendChild(grid);
      root.appendChild(el("div", { class: "sel-save" }, [saveBtn]));
      paintCount();
      return;
    }

    const rid = PhotoLog.reactorId(), rname = PhotoLog.reactorName();
    // Refresh without losing scroll position (Router.render jumps to top).
    const refresh = () => { const y = window.scrollY; Router.render(); window.scrollTo(0, y); };
    root.appendChild(el("div", { class: "feed" }, photos.map((p) => {
      const openIt = () => window.PhotoLog && PhotoLog.openDetail(p.id, refresh);
      const cmts = p.comments || [];
      // reactions repaint IN PLACE — a tap must not rebuild the page
      const row = el("div", { class: "photo-react-row feed-react" });
      function paintRow() {
        row.innerHTML = "";
        const cur = Store._photo(p.id) || p;
        const counts = {}; (cur.reactions || []).forEach((r) => { counts[r.emoji] = (counts[r.emoji] || 0) + 1; });
        PhotoLog.REACTIONS.forEach((em) => {
          const mine = (cur.reactions || []).some((r) => r.by === rid && r.emoji === em);
          row.appendChild(el("button", { class: "photo-react" + (mine ? " on" : ""),
            onClick: () => { Store.reactPhoto(p.id, em, rid, rname); paintRow(); } },
            [em, counts[em] ? el("span", { class: "photo-react-n" }, String(counts[em])) : null]));
        });
      }
      paintRow();
      return el("article", { class: "feed-card" }, [
        el("div", { class: "feed-head" }, [
          avatarFor(p.by),
          el("div", { class: "feed-who" }, [
            el("div", { class: "feed-name" }, p.by || "The crew"),
            el("div", { class: "feed-time" }, fmtTime(p.ts)),
          ]),
        ]),
        el("img", { class: "feed-img", src: p.img, alt: p.caption || "", onClick: openIt }),
        p.caption ? el("div", { class: "feed-cap" }, p.caption) : null,
        row,
        cmts.length ? el("div", { class: "feed-cmts" }, [
          cmts.length > 2 ? el("button", { class: "feed-more", onClick: openIt }, "View all " + cmts.length + " comments") : null,
        ].concat(cmts.slice(-2).map((c) =>
          el("div", { class: "photo-comment" }, [el("b", {}, (c.name || "Someone") + ": "), c.text])))) : null,
        el("button", { class: "feed-comment-btn", onClick: openIt }, "💬 Comment…"),
      ]);
    })));
  }

  window.Views = window.Views || {};
  window.Views.feed = view;
})();
