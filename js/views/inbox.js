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

    // ---- start something — the inbox is a post office, not just a doormat.
    // Trades compose at the Trading Post (the full picker lives there);
    // battle requests go straight to a phone that's in the room RIGHT NOW.
    function pickFoe() {
      if (!window.Sync || !Sync.isLive || !Sync.isLive()) {
        U.toast("📡 Battle requests need a live room — join one in Settings.");
        return;
      }
      const meC = (Sync.myClientId && Sync.myClientId()) || "";
      // Everyone's fair game: 🟢 trainers here now get the knock instantly on
      // their phone; 💤 away trainers get a PATIENT request that greets them
      // the next time they open the app (it waits up to a day).
      const hereBy = {};
      (((Sync.presence && Sync.presence()) || [])).forEach((p) => {
        if (p.clientId && p.clientId !== meC && p.attId) hereBy[p.attId] = p;
      });
      const foes = Store.state.attendees.filter((a) => a.id !== me);
      if (!foes.length) { U.toast("😴 You're the only trainer registered — no one to challenge yet."); return; }
      foes.sort((a, b) => (hereBy[b.id] ? 1 : 0) - (hereBy[a.id] ? 1 : 0));
      let ctrl;
      const body = el("div", { class: "modal-form" }, [
        el("p", { class: "hint" }, "🟢 here now — it pops up on their phone. 💤 away — it waits for them (up to a day)."),
        el("div", { class: "sl-vote-grid" }, foes.map((a) => {
          const pres = hereBy[a.id];
          const src = Store.favSprite ? Store.favSprite(a) : "";
          return el("button", { class: "sl-vote-pick", onClick: () => {
            ctrl.close();
            const target = pres || { clientId: "", attId: a.id, name: a.name };
            if (window.QuickChallenge) QuickChallenge(target, { onSent: (nm) => U.toast(pres
              ? "🎮 Challenge sent to " + nm + " — waiting on their phone!"
              : "📮 Challenge posted to " + nm + " — it greets them next time they open the app.") });
          } }, [
            src ? el("img", { class: "sl-thumb", src: src, alt: "" }) : el("span", { class: "draft-thumb-ball" }),
            el("span", { class: "sl-vote-name" }, (pres ? "🟢 " : "💤 ") + a.name),
          ]);
        })),
      ]);
      ctrl = Modal.open("⚔ Send a battle request", body, null, { noFooter: true });
    }
    root.appendChild(el("div", { class: "safari-card" }, [
      el("div", { class: "nuz-lab-head" }, "📮 Start something"),
      el("div", { class: "toolbar" }, [
        el("button", { class: "btn primary", onClick: () => { location.hash = "#/trade"; } }, "🔁 Send trade offer"),
        el("button", { class: "btn primary", onClick: pickFoe }, "⚔ Send battle request"),
      ]),
      el("p", { class: "hint" }, "Trade offers compose at the Trading Post and wait in their inbox — even for trainers who are away. Battle requests pop up instantly on phones here now, and wait (up to a day) for anyone who isn't."),
    ]));

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
