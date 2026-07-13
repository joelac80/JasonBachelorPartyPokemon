/* superlatives.js — the crew votes on end-of-weekend awards. One tap = one
   vote. Leaders are crowned at the Champion Ceremony. Votes are stored in
   Store.state.superlativeVotes[categoryId][attendeeId]. */
(function () {
  const { el, uid } = U;
  function sfx(name) { if (window.SFX && SFX[name]) SFX[name](); }

  function votes(catId) { return Store.state.superlativeVotes[catId] || {}; }

  function tally(catId) {
    const v = votes(catId);
    return Store.state.attendees
      .map((a) => ({ a, n: v[a.id] || 0 }))
      .filter((r) => r.n > 0)
      .sort((x, y) => y.n - x.n);
  }

  // Winner (or null) for a category — used by the Ceremony too.
  function leader(catId) {
    const t = tally(catId);
    if (!t.length) return null;
    if (t.length > 1 && t[0].n === t[1].n) return { tie: true, rows: t.filter((r) => r.n === t[0].n) };
    return { a: t[0].a, n: t[0].n };
  }

  function castVote(catId, attId, redraw) {
    Store.update((s) => {
      s.superlativeVotes[catId] = s.superlativeVotes[catId] || {};
      s.superlativeVotes[catId][attId] = (s.superlativeVotes[catId][attId] || 0) + 1;
    });
    sfx("coin");
    redraw();
  }

  function openVote(cat, redraw) {
    const grid = el("div", { class: "sl-vote-grid" }, Store.state.attendees.map((a) =>
      el("button", { class: "sl-vote-pick", onClick: () => { castVote(cat.id, a.id, redraw); ref.close(); } }, [
        spriteOrBall(a),
        el("span", { class: "sl-vote-name" }, a.name),
      ])
    ));
    const ref = Modal.open("Vote — " + cat.title, grid, null, {});
  }

  function spriteOrBall(a) {
    const src = a.favoriteId ? Store.sprite(a.favoriteId) : "";
    return src ? el("img", { class: "sl-thumb", src, alt: "" }) : el("span", { class: "draft-thumb-ball" });
  }

  function card(cat, redraw) {
    const t = tally(cat.id);
    const max = Math.max(1, ...t.map((r) => r.n));
    const lead = leader(cat.id);

    const bars = el("div", { class: "sl-bars" });
    if (!t.length) {
      bars.appendChild(el("p", { class: "hint" }, "No votes yet — be the first."));
    } else {
      t.forEach((r, i) => {
        const isLead = lead && !lead.tie && lead.a.id === r.a.id;
        bars.appendChild(el("div", { class: "sl-bar-row" + (isLead ? " lead" : "") }, [
          el("div", { class: "sl-bar-name" }, (isLead ? "🏆 " : "") + r.a.name),
          el("div", { class: "sl-bar-wrap" }, [
            el("div", { class: "sl-bar", style: { width: Math.max(6, Math.round(r.n / max * 100)) + "%" } }),
          ]),
          el("div", { class: "sl-bar-n" }, String(r.n)),
        ]));
      });
    }

    return el("div", { class: "sl-card" }, [
      el("div", { class: "sl-card-head" }, [
        el("span", { class: "sl-emoji" }, cat.emoji || "🏅"),
        el("div", {}, [
          el("div", { class: "sl-title" }, cat.title),
          el("div", { class: "sl-desc" }, cat.desc || ""),
        ]),
      ]),
      bars,
      el("div", { class: "sl-actions" }, [
        el("button", { class: "btn primary sm", onClick: () => openVote(cat, redraw) }, "🗳 Cast a vote"),
        t.length ? el("button", { class: "btn subtle sm", onClick: () => {
          if (confirm("Clear all votes for “" + cat.title + "”?")) {
            Store.update((s) => { delete s.superlativeVotes[cat.id]; }); redraw();
          }
        } }, "Clear") : null,
        cat.custom ? el("button", { class: "btn danger sm", onClick: () => {
          Store.update((s) => { s.superlatives = s.superlatives.filter((c) => c.id !== cat.id); delete s.superlativeVotes[cat.id]; });
          redraw();
        } }, "Remove") : null,
      ]),
    ]);
  }

  function openAddCategory(redraw) {
    const titleIn = el("input", { class: "in", placeholder: "e.g. Best Dance Move" });
    const descIn = el("input", { class: "in", placeholder: "Short description (optional)" });
    const emojiIn = el("input", { class: "in", placeholder: "🏅", maxlength: "4" });
    const body = el("div", { class: "modal-form" }, [
      el("label", { class: "field" }, ["Award title", titleIn]),
      el("label", { class: "field" }, ["Description", descIn]),
      el("label", { class: "field" }, ["Emoji", emojiIn]),
    ]);
    Modal.open("New Award Category", body, () => {
      if (!titleIn.value.trim()) return;
      Store.update((s) => {
        s.superlatives.push({ id: uid("sl"), title: titleIn.value.trim(), desc: descIn.value.trim(), emoji: emojiIn.value.trim() || "🏅", custom: true });
      });
      redraw();
    }, { saveLabel: "Add category" });
  }

  function view(root) {
    root.appendChild(el("div", { class: "page-head" }, [
      el("h1", {}, "🗳️ Superlatives"),
      el("p", { class: "page-sub" }, "The human side of the achievement wall — the tiers (🎖 Badges page) measure what you DID; these votes crown HOW you did it. Winners are crowned at the Ceremony."),
    ]));

    root.appendChild(el("div", { class: "toolbar", style: { marginTop: "0", marginBottom: "8px" } }, [
      el("button", { class: "btn primary", onClick: () => openAddCategory(() => Router.render()) }, "＋ Add category"),
    ]));

    const grid = el("div", { class: "sl-grid" });
    function redraw() {
      grid.innerHTML = "";
      const cats = Store.state.superlatives || [];
      if (!cats.length) { grid.appendChild(el("p", { class: "empty" }, "No categories yet — add one above.")); return; }
      cats.forEach((c) => grid.appendChild(card(c, redraw)));
    }
    redraw();
    root.appendChild(grid);
  }

  // Expose the leader helper so the Ceremony can reuse it.
  window.Superlatives = { leader };
  window.Views = window.Views || {};
  window.Views.superlatives = view;
})();
