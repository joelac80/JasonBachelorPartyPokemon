/* challenges.js — Catch of the Day: daily photo/dare challenges. Mark one
   "caught", tag who pulled it off, add a note. Progress is tracked across
   the weekend. Stored in Store.state.challengeDone[id] = {done, by, note}. */
(function () {
  const { el, uid } = U;
  function sfx(name) { if (window.SFX && SFX[name]) SFX[name](); }

  function done(id) { return Store.state.challengeDone[id] || null; }

  function markModal(ch, redraw) {
    const sel = el("select", { class: "in" }, [
      el("option", { value: "" }, "— who caught it? —"),
      ...Store.state.attendees.map((a) => el("option", { value: a.id }, a.name)),
    ]);
    const noteIn = el("input", { class: "in", placeholder: "Note / where's the proof? (optional)" });
    const existing = done(ch.id);
    if (existing) { sel.value = existing.by || ""; noteIn.value = existing.note || ""; }

    const body = el("div", { class: "modal-form" }, [
      el("p", { class: "hint" }, ch.desc || ""),
      el("label", { class: "field" }, ["Caught by", sel]),
      el("label", { class: "field" }, ["Note", noteIn]),
    ]);
    Modal.open("Catch: " + ch.title, body, () => {
      Store.update((s) => { s.challengeDone[ch.id] = { done: true, by: sel.value, note: noteIn.value.trim() }; });
      sfx("correct");
      redraw();
    }, { saveLabel: "✓ Mark caught" });
  }

  function attendeeName(id) { const a = Store.attendee(id); return a ? a.name : ""; }

  function card(ch, redraw) {
    const d = done(ch.id);
    const caught = d && d.done;
    return el("div", { class: "cotd-card" + (caught ? " caught" : "") }, [
      el("div", { class: "cotd-top" }, [
        el("span", { class: "cotd-emoji" }, ch.emoji || "📸"),
        el("div", { class: "cotd-main" }, [
          el("div", { class: "cotd-title" }, ch.title),
          el("div", { class: "cotd-desc" }, ch.desc || ""),
        ]),
        ch.points ? el("span", { class: "cotd-pts" }, "+" + ch.points) : null,
      ]),
      caught ? el("div", { class: "cotd-caught" }, [
        el("span", { class: "cotd-check" }, "✓ Caught"),
        d.by ? el("span", {}, "by " + attendeeName(d.by)) : null,
        d.note ? el("span", { class: "cotd-note" }, "“" + d.note + "”") : null,
      ]) : null,
      el("div", { class: "cotd-actions" }, [
        el("button", { class: caught ? "btn subtle sm" : "btn primary sm", onClick: () => markModal(ch, redraw) },
          caught ? "Edit" : "🎯 Mark caught"),
        caught ? el("button", { class: "btn subtle sm", onClick: () => {
          Store.update((s) => { delete s.challengeDone[ch.id]; }); redraw();
        } }, "Undo") : null,
        ch.custom ? el("button", { class: "btn danger sm", onClick: () => {
          U.ask("Delete the challenge “" + ch.title + "”?", { icon: "🗑", danger: true }, () => {
            Store.update((s) => { s.challenges = s.challenges.filter((c) => c.id !== ch.id); delete s.challengeDone[ch.id]; });
            redraw();
          });
        } }, "Delete") : null,
      ]),
    ]);
  }

  function openAdd(redraw) {
    const titleIn = el("input", { class: "in", placeholder: "e.g. Sunset Group Photo" });
    const descIn = el("input", { class: "in", placeholder: "What's the challenge?" });
    const dayIn = el("input", { class: "in", placeholder: "Day (e.g. Wednesday / Any)" });
    const emojiIn = el("input", { class: "in", placeholder: "📸", maxlength: "4" });
    const ptsIn = el("input", { class: "in", type: "number", placeholder: "Points (optional)" });
    const body = el("div", { class: "modal-form" }, [
      el("label", { class: "field" }, ["Title", titleIn]),
      el("label", { class: "field" }, ["Description", descIn]),
      el("label", { class: "field" }, ["Day", dayIn]),
      el("label", { class: "field" }, ["Emoji", emojiIn]),
      el("label", { class: "field" }, ["Points", ptsIn]),
    ]);
    Modal.open("New Challenge", body, () => {
      if (!titleIn.value.trim()) return;
      Store.update((s) => {
        s.challenges.push({
          id: uid("c"), title: titleIn.value.trim(), desc: descIn.value.trim(),
          day: dayIn.value.trim() || "Any", emoji: emojiIn.value.trim() || "📸",
          points: parseInt(ptsIn.value, 10) || 0, custom: true,
        });
      });
      redraw();
    }, { saveLabel: "Add challenge" });
  }

  function view(root) {
    root.appendChild(el("div", { class: "page-head" }, [
      el("h1", {}, "🎣 Daily Dares"),
      el("p", { class: "page-sub" }, "The Dock's Catch of the Day — daily photo & dare challenges. Reel 'em all in."),
    ]));

    const progress = el("div", { class: "cotd-progress" });
    root.appendChild(progress);

    root.appendChild(el("div", { class: "toolbar", style: { marginTop: "0", marginBottom: "8px" } }, [
      el("button", { class: "btn primary", onClick: () => openAdd(() => Router.render()) }, "＋ Add challenge"),
    ]));

    const host = el("div", {});
    function redraw() {
      const chs = Store.state.challenges || [];
      const caught = chs.filter((c) => done(c.id) && done(c.id).done).length;
      progress.innerHTML = "";
      progress.appendChild(el("div", { class: "cotd-progress-bar-wrap" }, [
        el("div", { class: "cotd-progress-bar", style: { width: (chs.length ? Math.round(caught / chs.length * 100) : 0) + "%" } }),
      ]));
      progress.appendChild(el("div", { class: "cotd-progress-txt" }, "🏅 " + caught + " / " + chs.length + " caught"));

      host.innerHTML = "";
      if (!chs.length) { host.appendChild(el("p", { class: "empty" }, "No challenges yet — add one above.")); return; }
      // Group by day, keeping seed order of first appearance.
      const order = [];
      const byDay = {};
      chs.forEach((c) => { const d = c.day || "Any"; if (!byDay[d]) { byDay[d] = []; order.push(d); } byDay[d].push(c); });
      order.forEach((d) => {
        host.appendChild(el("h2", { class: "section-title" }, d));
        const grid = el("div", { class: "cotd-grid" });
        byDay[d].forEach((c) => grid.appendChild(card(c, redraw)));
        host.appendChild(grid);
      });
    }
    redraw();
    root.appendChild(host);
  }

  window.Views = window.Views || {};
  window.Views.challenges = view;
})();
