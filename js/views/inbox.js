/* views/inbox.js — 📬 the Alerts page: open trade offers waiting on YOU up
   top (live from synced state, with a jump to the Trading Post), then this
   phone's alert log — offers received, offers accepted/declined, challenges
   received, challenges declined. Viewing marks the log read. */
(function () {
  const { el } = U;

  function ago(ts) {
    if (!ts) return "";
    let now = 0; try { now = Date.now(); } catch (_) { return ""; }
    const s = Math.max(0, Math.round((now - ts) / 1000));
    if (s < 60) return "just now";
    const m = Math.round(s / 60); if (m < 60) return m + "m ago";
    const h = Math.round(m / 60); if (h < 24) return h + "h ago";
    return Math.round(h / 24) + "d ago";
  }

  function view(root) {
    root.appendChild(el("div", { class: "page-head" }, [
      el("h1", {}, "📬 Alerts"),
      el("p", { class: "page-sub" }, "Trade offers, battle challenges, and what came of the ones you sent."),
    ]));

    const me = (window.Sync && Sync.getMe && Sync.getMe()) || "";

    // ---- open trade offers waiting on you (live, actionable) ----
    const open = me && Store.tradeOffers ? Store.tradeOffers().filter((o) => o.to === me) : [];
    if (open.length) {
      const nameOf = (id) => (Store.attendee(id) || {}).name || "Someone";
      const monN = (id) => ((window.DEX || {})[id] || {}).n || "?";
      root.appendChild(el("div", { class: "safari-card" }, [
        el("div", { class: "nuz-lab-head" }, "🔁 Waiting on you (" + open.length + ")"),
        el("div", {}, open.map((o) => el("div", { class: "inbox-row unread" }, [
          el("span", { class: "inbox-emoji" }, "🔁"),
          el("div", { class: "inbox-main" }, [
            el("div", {}, nameOf(o.from) + " offers " + (o.giveShiny ? "✨ " : "") + monN(o.give)
              + " for your " + (o.wantShiny ? "✨ " : "") + monN(o.want)),
            el("div", { class: "inbox-when" }, ago(o.ts)),
          ]),
          el("button", { class: "btn sm primary", onClick: () => { location.hash = "#/trade"; } }, "Review"),
        ]))),
      ]));
    }

    // ---- the alert log ----
    const list = (window.Inbox && Inbox.list()) || [];
    if (!list.length && !open.length) {
      root.appendChild(el("p", { class: "empty" }, "All quiet. Offers, challenges, and their outcomes will land here."));
      return;
    }
    if (list.length) {
      root.appendChild(el("div", { class: "safari-card" }, [
        el("div", { class: "nuz-lab-head" }, "🔔 Recent"),
        el("div", {}, list.map((e) => el("div", { class: "inbox-row" + (e.read ? "" : " unread") }, [
          el("span", { class: "inbox-emoji" }, e.emoji),
          el("div", { class: "inbox-main" }, [
            el("div", {}, e.text),
            el("div", { class: "inbox-when" }, ago(e.ts)),
          ]),
          e.link ? el("button", { class: "btn sm subtle", onClick: () => { location.hash = e.link; } }, "Go") : null,
        ]))),
      ]));
    }
    // Seen = read (small delay so the unread styling is visible on arrival).
    setTimeout(() => { if (window.Inbox) Inbox.markAllRead(); }, 900);
  }

  window.Views = window.Views || {};
  window.Views.inbox = view;
})();
