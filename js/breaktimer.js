/* breaktimer.js — ⏸ Shared "games resume at…" timer. Anyone can start a break;
   it syncs to every phone as a live countdown banner, alerts the room when it's
   set, and fires a "games are back on!" alert (OS notification + sound + toast)
   the moment it hits zero. Global `window.BreakTimer`. */
(function () {
  const { el } = U;
  function sfx(n) { if (window.SFX && SFX[n]) SFX[n](); }
  const RESUME_KEY = "jasonBachHub.breakResumed";     // last break 'set' we fired the resume alert for
  const SEEN_KEY = "jasonBachHub.breakSeen";          // last break 'set' we announced

  const QUICK = [5, 10, 15, 20, 30, 45, 60];

  function meName() {
    const me = window.Sync && Sync.getMe && Sync.getMe();
    const a = me && Store.attendee(me);
    if (a && a.name) return a.name;
    const c = window.Sync && Sync.getConf && Sync.getConf();
    return (c && c.name) || "Someone";
  }
  function fmt(ms) {
    const t = Math.max(0, Math.round(ms / 1000));
    const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
    const pad = (n) => (n < 10 ? "0" + n : "" + n);
    return (h > 0 ? h + ":" + pad(m) : m + "") + ":" + pad(s);
  }
  function clockStr(until) {
    try { return new Date(until).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }); }
    catch (_) { return ""; }
  }
  function raw() { return Store.state.break || null; }

  // ---- persistent banner (fixed, bottom) ----
  let banner = null;
  function ensureBanner() {
    if (banner) return banner;
    banner = el("div", { id: "break-banner", class: "break-banner hidden" });
    document.body.appendChild(banner);
    return banner;
  }
  function render() {
    const bn = ensureBanner();
    const b = raw(), now = Date.now();
    if (b && b.until && b.until > now) {
      bn.className = "break-banner";
      bn.innerHTML = "";
      bn.appendChild(el("div", { class: "break-main", onClick: () => open() }, [
        el("span", { class: "break-ico" }, "⏸"),
        el("div", { class: "break-txt" }, [
          el("div", { class: "break-count" }, "Games resume in " + fmt(b.until - now)),
          el("div", { class: "break-sub" },
            (b.note ? "“" + b.note + "” · " : "") + "back at " + clockStr(b.until) + (b.by ? " · " + b.by : "")),
        ]),
      ]));
      bn.appendChild(el("button", { class: "break-x", title: "End the break now", onClick: (e) => {
        e.stopPropagation(); Store.clearBreak(meName()); render();
      } }, "✕"));
    } else {
      bn.className = "break-banner hidden";
      bn.innerHTML = "";
    }
  }

  // ---- room alerts ----
  function foreground() { return document.visibilityState === "visible"; }
  function busyOverlay() { return !!document.querySelector(".battle, .onb"); }

  // Announce a freshly-set break to this phone (skipped on the setter's phone,
  // which stamps SEEN_KEY the moment it sets one).
  function announce(b) {
    const when = clockStr(b.until);
    // The banner (rendered right after) is the on-screen heads-up; a blip draws
    // the eye, and backgrounded phones get the OS notification.
    sfx("blip");
    if (window.AppNotify) AppNotify.ping("⏸ Break time!", "Games resume at " + when + (b.note ? " — " + b.note : ""));
  }
  function fireResume(b) {
    sfx("fanfare");
    if (window.AppNotify) AppNotify.ping("🎮 Games are back on!", "Break's over — back to it!");
    if (foreground() && !busyOverlay() && window.Modal) {
      let ctrl;
      const body = el("div", { class: "chal-modal break-resume" }, [
        el("div", { class: "break-resume-emoji" }, "🎮"),
        el("div", { class: "break-resume-title" }, "GAMES ARE BACK ON!"),
        el("p", {}, "Break's over — round everyone up and keep playing."),
        el("div", { class: "toolbar", style: { justifyContent: "center" } }, [
          el("button", { class: "btn primary", onClick: () => { if (ctrl) ctrl.close(); } }, "Let's go!"),
        ]),
      ]);
      ctrl = Modal.open("Break's over!", body, null, { noFooter: true });
    } else if (foreground()) {
      U.toast("🎮 Games are back on — break's over!", null, null);
    }
  }

  // Runs on every state change + once a second: keeps the banner live and fires
  // the announce / resume alerts exactly once per break (keyed by its `set`).
  function pump() {
    const b = raw();
    if (b && b.until && b.set) {
      const id = String(b.set);
      if (b.until > Date.now()) {
        let seen = ""; try { seen = localStorage.getItem(SEEN_KEY) || ""; } catch (_) {}
        if (seen !== id) { try { localStorage.setItem(SEEN_KEY, id); } catch (_) {} announce(b); }
      } else if (!b.cleared) {
        let done = ""; try { done = localStorage.getItem(RESUME_KEY) || ""; } catch (_) {}
        if (done !== id) { try { localStorage.setItem(RESUME_KEY, id); } catch (_) {} fireResume(b); }
      }
    }
    render();
  }

  // ---- the setter modal (start / adjust / clear a break) ----
  function open() {
    if (!window.Modal) return;
    const active = Store.getBreak();
    const note = el("input", { class: "in", placeholder: "What's the break for? (Lunch, pool, nap…)",
      value: (active && active.note) || "" });
    let ctrl;
    const setFor = (mins) => {
      Store.setBreak(mins, meName(), note.value.trim());
      const b = Store.getBreak();
      if (b) { try { localStorage.setItem(SEEN_KEY, String(b.set)); } catch (_) {} }   // don't re-announce to myself
      sfx("select"); render();
      U.toast("⏸ Break set — the room's been alerted.", null, null);
      if (ctrl) ctrl.close();
    };
    const quick = el("div", { class: "break-quick" }, QUICK.map((m) =>
      el("button", { class: "btn primary sm", onClick: () => setFor(m) }, m + " min")));
    const custom = el("input", { class: "in", type: "number", min: "1", max: "600", placeholder: "min" });
    const body = el("div", { class: "modal-form" }, [
      el("p", { class: "hint" }, "Start a shared break — every phone shows the countdown and gets pinged when games resume."),
      active ? el("div", { class: "break-active-note" }, "⏸ A break is running — resumes at " + clockStr(active.until) + ". Pick a new time to change it.") : null,
      el("label", { class: "field" }, [el("span", {}, "Note (optional)"), note]),
      el("div", { class: "field" }, [el("span", {}, "Resume in…"), quick]),
      el("div", { class: "break-custom" }, [
        custom,
        el("button", { class: "btn primary sm", onClick: () => { const v = parseInt(custom.value, 10); if (v > 0) setFor(v); } }, "Set"),
      ]),
      active ? el("div", { class: "toolbar" }, [
        el("button", { class: "btn danger sm", onClick: () => { Store.clearBreak(meName()); sfx("blip"); render(); if (ctrl) ctrl.close(); } }, "🛑 End break now"),
      ]) : null,
    ]);
    ctrl = Modal.open("⏸ Break timer", body, null, { noFooter: true });
  }

  // ---- boot ----
  ensureBanner();
  render();
  Store.subscribe(pump);
  if (window.Sync && Sync.onStateApplied) Sync.onStateApplied(pump);
  setInterval(pump, 1000);

  const btn = document.getElementById("break-btn");
  if (btn) btn.addEventListener("click", open);
  // Lives in the nav menu (keeps the top bar uncluttered). Open the setter
  // without navigating, and close the menu.
  const navBtn = document.getElementById("break-nav");
  if (navBtn) navBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const nav = document.getElementById("nav"); if (nav) nav.classList.remove("open");
    open();
  });

  window.BreakTimer = { open: open, render: render };
})();
