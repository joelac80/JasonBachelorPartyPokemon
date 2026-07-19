/* messages.js — the Message Wall for the groom. Everyone leaves a note/advice/
   roast; it stays SEALED from the groom's own phone until the closing ceremony
   unlocks it. Everyone else can read + write anytime. Feeds the poster finale. */
(function () {
  const { el } = U;

  function view(root) {
    const groom = Store.groom();
    const amGroom = Store.isGroomActor();
    const unlocked = !!Store.state.messagesUnlocked;

    root.appendChild(el("div", { class: "page-head" }, [
      el("h1", {}, "💌 Message Wall" + (groom ? " for " + groom.name.split(" ")[0] : "")),
      el("p", { class: "page-sub" }, "Notes, advice and roasts for the groom — revealed at the closing ceremony." ),
    ]));

    // Sealed from the groom until the ceremony unlocks it.
    if (amGroom && !unlocked) {
      root.appendChild(el("div", { class: "mw-locked" }, [
        el("div", { class: "mw-lock-emoji" }, "🔒"),
        el("div", { class: "mw-lock-title" }, "Sealed until the closing ceremony"),
        el("p", {}, "Eyes off, groom! The crew is leaving you messages — you'll unlock them all at the send-off. No peeking. 🌿"),
      ]));
      return;
    }

    const msgs = Store.state.messages || [];
    const list = el("div", { class: "mw-list" });
    function render() {
      list.innerHTML = "";
      if (!msgs.length) { list.appendChild(el("p", { class: "hint" }, "No messages yet — be the first to leave one for the groom.")); return; }
      msgs.forEach((m) => {
        const a = Store.attendee(m.by);
        list.appendChild(el("div", { class: "mw-card" }, [
          el("div", { class: "mw-text" }, "“" + m.text + "”"),
          el("div", { class: "mw-from" }, "— " + (a ? a.name : (m.by || "Anonymous"))),
        ]));
      });
    }
    render();

    // Everyone but the groom can post (the groom just reads once unlocked).
    if (!amGroom) {
      const me = (window.Sync && Sync.getMe && Sync.getMe()) || "";
      const fromSel = el("select", { class: "in" }, [el("option", { value: "" }, "— from —")].concat(
        Store.state.attendees.filter((a) => !groom || a.id !== groom.id).map((a) => el("option", { value: a.id, selected: a.id === me ? "true" : null }, a.name))));
      const ta = el("textarea", { class: "in", rows: 3, placeholder: "Your note, advice, or roast for the groom…" });
      const post = el("button", { class: "btn primary", onClick: () => {
        if (!ta.value.trim()) return;
        Store.addMessage(ta.value, fromSel.value);
        ta.value = ""; if (window.SFX) SFX.win();
        render();
      } }, "💌 Leave your message");
      root.appendChild(el("div", { class: "mw-form" }, [
        el("h2", { class: "section-title" }, "Leave a message" ),
        el("div", { class: "field" }, [el("span", {}, "From"), fromSel]),
        ta, el("div", { class: "toolbar" }, [post]),
      ]));
    }

    root.appendChild(el("h2", { class: "section-title" }, "The Wall (" + msgs.length + ")"));
    root.appendChild(list);
  }

  window.Views = window.Views || {};
  window.Views.messages = view;
})();
