/* settings.js — manage party info, teams, events; backup / import / reset. */
(function () {
  const { el, uid, contrast } = U;

  function partySection() {
    const p = Store.state.party;
    const fields = [
      ["title", "Party title"],
      ["subtitle", "Subtitle"],
      ["location", "Location"],
      ["startDate", "Start (YYYY-MM-DDTHH:MM)"],
      ["blurb", "Blurb"],
    ];
    const inputs = {};
    const rows = fields.map(([key, label]) => {
      const input = el("input", { class: "in", value: p[key] || "" });
      inputs[key] = input;
      return el("label", { class: "field" }, [el("span", {}, label), input]);
    });
    return el("section", { class: "settings-block" }, [
      el("h2", { class: "section-title" }, "Party info"),
      el("div", { class: "settings-grid" }, rows),
      el("button", { class: "btn primary", onClick: () => {
        Store.update((s) => {
          for (const k in inputs) s.party[k] = inputs[k].value;
        });
        toast("Party info saved");
      } }, "Save party info"),
    ]);
  }

  function teamsSection() {
    const host = el("div", { class: "editable-list" });
    function render() {
      host.innerHTML = "";
      Store.state.teams.forEach((t) => {
        host.appendChild(el("div", { class: "edit-row" }, [
          el("input", { class: "in swatch", type: "color", value: t.color,
            onChange: (e) => Store.update((s) => { s.teams.find(x=>x.id===t.id).color = e.target.value; }) }),
          el("input", { class: "in", value: t.emoji, style: { maxWidth: "56px" },
            onChange: (e) => Store.update((s) => { s.teams.find(x=>x.id===t.id).emoji = e.target.value; }) }),
          el("input", { class: "in grow", value: t.name,
            onChange: (e) => Store.update((s) => { s.teams.find(x=>x.id===t.id).name = e.target.value; }) }),
          el("button", { class: "btn danger sm", onClick: () => {
            if (confirm("Delete " + t.name + "? Members become free agents.")) {
              Store.update((s) => {
                s.teams = s.teams.filter((x) => x.id !== t.id);
                s.attendees.forEach((a) => { if (a.team === t.id) a.team = ""; });
                for (const ev in s.scores) delete s.scores[ev][t.id];
              });
              render();
            }
          } }, "✕"),
        ]));
      });
    }
    render();
    return el("section", { class: "settings-block" }, [
      el("h2", { class: "section-title" }, "Teams"),
      host,
      el("button", { class: "btn primary", onClick: () => {
        Store.update((s) => s.teams.push({
          id: uid("team"), name: "New Team", emoji: "🎽", color: "#5fbf6a", captain: "",
        }));
        render();
      } }, "+ Add team"),
    ]);
  }

  function eventsSection() {
    const host = el("div", { class: "editable-list" });
    function render() {
      host.innerHTML = "";
      Store.state.events.forEach((ev) => {
        host.appendChild(el("div", { class: "edit-row" }, [
          el("input", { class: "in", value: ev.emoji, style: { maxWidth: "56px" },
            onChange: (e) => Store.update((s) => { s.events.find(x=>x.id===ev.id).emoji = e.target.value; }) }),
          el("input", { class: "in grow", value: ev.name,
            onChange: (e) => Store.update((s) => { s.events.find(x=>x.id===ev.id).name = e.target.value; }) }),
          el("input", { class: "in", type: "number", value: ev.points, style: { maxWidth: "90px" },
            onChange: (e) => Store.update((s) => { s.events.find(x=>x.id===ev.id).points = parseInt(e.target.value,10)||0; }) }),
          el("button", { class: "btn danger sm", onClick: () => {
            if (confirm("Delete event " + ev.name + "?")) {
              Store.update((s) => {
                s.events = s.events.filter((x) => x.id !== ev.id);
                delete s.scores[ev.id];
              });
              render();
            }
          } }, "✕"),
        ]));
      });
    }
    render();
    return el("section", { class: "settings-block" }, [
      el("h2", { class: "section-title" }, "Victory Road events"),
      host,
      el("button", { class: "btn primary", onClick: () => {
        Store.update((s) => s.events.push({
          id: uid("event"), name: "New Event", emoji: "🎯", points: 50, desc: "",
        }));
        render();
      } }, "+ Add event"),
    ]);
  }

  function dataSection() {
    return el("section", { class: "settings-block" }, [
      el("h2", { class: "section-title" }, "Backup & data"),
      el("p", { class: "hint" }, "All data lives in this browser. Export a backup file to move it to another device or keep it safe."),
      el("div", { class: "toolbar" }, [
        el("button", { class: "btn primary", onClick: exportData }, "⬇ Export backup"),
        el("label", { class: "btn subtle file-btn" }, [
          "⬆ Import backup",
          el("input", { type: "file", accept: "application/json", style: { display: "none" },
            onChange: importData }),
        ]),
        el("button", { class: "btn danger", onClick: () => {
          if (confirm("Reset EVERYTHING back to the defaults in seed.js? This wipes scores, drafts, and edits.")) {
            Store.reset();
            Router.render();
          }
        } }, "↺ Reset to defaults"),
      ]),
    ]);
  }

  function exportData() {
    const blob = new Blob([Store.exportJSON()], { type: "application/json" });
    const a = el("a", {
      href: URL.createObjectURL(blob),
      download: "bachelor-hub-backup.json",
    });
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function importData(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        Store.importJSON(reader.result);
        Router.render();
        toast("Backup imported");
      } catch (err) {
        alert("That file didn't look like a valid backup.");
      }
    };
    reader.readAsText(f);
  }

  function syncSection() {
    if (!window.Sync) return el("span");
    const c = Sync.getConf();

    const cfgIn = el("textarea", { class: "in mono", rows: 5,
      placeholder: "Preloaded with the party's project (" + c.projectId + ") — leave blank.\nPaste a firebaseConfig here only to override it." });
    if (c.config) cfgIn.value = JSON.stringify(c.config, null, 2);
    const roomIn = el("input", { class: "in", placeholder: "Room code (e.g. jason2026)", value: c.room });
    const nameIn = el("input", { class: "in", placeholder: "Your name (shown on updates)", value: c.name });

    // Sign in as your trainer on this device — powers "who's here" + challenges.
    const meSel = el("select", { class: "in" }, [el("option", { value: "" }, "— pick your trainer —")].concat(
      Store.state.attendees.map((a) => el("option", { value: a.id, selected: c.me === a.id ? "true" : null }, a.name))));
    meSel.addEventListener("change", () => { const nm = Sync.setMe(meSel.value); if (nm) nameIn.value = nm; });

    const statusEl = el("div", { class: "sync-status" });
    Sync.onStatus((state, msg) => {
      statusEl.className = "sync-status " + state;
      const label = { off: "● Off — local only", connecting: "● Connecting…", live: "● Live", error: "⚠ " + msg };
      statusEl.textContent = state === "live" && msg ? "● Live — " + msg : (label[state] || state);
    });

    // ---- phone notifications (status + explicit enable/test) ----
    const noteStatus = el("div", { class: "sync-status" });
    function paintNote() {
      const A = window.AppNotify;
      const p = A ? A.permission() : "unsupported";
      const ios = /iPad|iPhone|iPod/.test(navigator.userAgent || "");
      let txt, cls;
      if (p === "granted") { txt = "🔔 Notifications enabled" + (A.installed() ? " (installed app)" : ""); cls = "live"; }
      else if (p === "denied") { txt = "🔕 Blocked — allow notifications for this site in your phone's browser settings"; cls = "error"; }
      else if (p === "unsupported") {
        txt = ios ? "🔕 iPhone: tap Share → Add to Home Screen, then open from the new icon and enable here"
                  : "🔕 Notifications aren't supported in this browser";
        cls = "error";
      } else { txt = "🔔 Notifications off — tap Enable"; cls = "off"; }
      noteStatus.className = "sync-status " + cls;
      noteStatus.textContent = txt;
    }
    paintNote();
    const noteBtns = el("div", { class: "toolbar" }, [
      el("button", { class: "btn subtle sm", onClick: () => { if (window.AppNotify) AppNotify.request(() => paintNote()); } }, "🔔 Enable notifications"),
      el("button", { class: "btn subtle sm", onClick: () => {
        if (!window.AppNotify || AppNotify.permission() !== "granted") { alert("Enable notifications first."); return; }
        AppNotify.test(); toast("Test fires in 4s — switch to another app to see it");
      } }, "Send a test"),
    ]);

    // Opt-in: a ping for every new photo dropped in the room feed.
    const photoChk = el("input", { type: "checkbox" });
    try { photoChk.checked = !!(window.AppNotify && AppNotify.photoAlerts()); } catch (_) {}
    photoChk.addEventListener("change", () => {
      if (window.AppNotify) AppNotify.setPhotoAlerts(photoChk.checked);
      if (photoChk.checked && window.AppNotify && AppNotify.permission() !== "granted") {
        AppNotify.request(() => paintNote());
      }
      toast(photoChk.checked ? "📸 You'll be pinged for new photos" : "Photo alerts off");
    });
    const photoAlertRow = el("label", { class: "note-toggle" }, [
      photoChk, el("span", {}, "📸 Alert me whenever someone posts a photo"),
    ]);

    const enableBtn = el("button", { class: "btn primary" });
    function paintBtn() {
      const on = Sync.getConf().enabled;
      enableBtn.textContent = on ? "⏻ Disconnect" : "🔗 Connect & sync";
      enableBtn.className = "btn " + (on ? "danger" : "primary");
    }
    enableBtn.addEventListener("click", () => {
      if (Sync.getConf().enabled) { Sync.disable(); }
      else {
        const r = Sync.save(cfgIn.value, roomIn.value, nameIn.value);
        if (!r.ok) { alert(r.error); return; }
        if (!roomIn.value.trim()) { alert("Pick a room code first (everyone joins the same one)."); return; }
        // Ask for phone-notification permission on this user gesture.
        try { if (window.Notification && Notification.requestPermission) Notification.requestPermission(); } catch (_) {}
        Sync.enable();
      }
      paintBtn();
    });
    paintBtn();

    const saveBtn = el("button", { class: "btn subtle", onClick: () => {
      const r = Sync.save(cfgIn.value, roomIn.value, nameIn.value);
      if (!r.ok) { alert(r.error); return; }
      toast("Sync settings saved");
    } }, "Save settings");

    return el("section", { class: "settings-block" }, [
      el("h2", { class: "section-title" }, "🔗 Live Sync (Firestore)"),
      el("p", { class: "hint" }, "Off by default — the app runs fully local. Turn this on to share ONE live scoreboard across phones. The party's Firebase project is built in, so joining takes three taps: room code → your trainer → Connect."),
      statusEl,
      el("div", { class: "settings-grid" }, [
        el("label", { class: "field" }, [el("span", {}, "Room code (shared by all)"), roomIn]),
        el("label", { class: "field" }, [el("span", {}, "You are (your trainer)"), meSel]),
        el("label", { class: "field" }, [el("span", {}, "Your name"), nameIn]),
      ]),
      el("div", { class: "toolbar" }, [enableBtn, saveBtn,
        el("button", { class: "btn subtle", onClick: () => {
          if (!confirm("👋 Log out of this trainer? The phone goes back to a fresh start (welcome tour included) — the room code stays filled in, and no scores are touched.")) return;
          try { Sync.setMe(""); } catch (_) {}
          try { localStorage.removeItem("jasonBachHub.onboarded"); } catch (_) {}
          location.hash = "#/home";
          location.reload();
        } }, "👋 Log out trainer"),
      ]),
      el("h2", { class: "section-title" }, "🔔 Phone alerts"),
      el("p", { class: "hint" }, "Get pinged when you're challenged or a battle starts. iPhone REQUIRES the app on your Home Screen first (Share → Add to Home Screen), opened from that icon."),
      noteStatus,
      noteBtns,
      photoAlertRow,
      el("details", { class: "sync-help" }, [
        el("summary", {}, "How to join (every guest)"),
        el("ol", { class: "sync-steps" }, [
          el("li", {}, "Open the app link on your phone (Add to Home Screen for the best experience)."),
          el("li", {}, "Type the shared room code above."),
          el("li", {}, "Pick YOUR trainer under “You are”."),
          el("li", {}, "Tap Connect & sync — the Poké Ball in the top bar turns green when you're live."),
        ]),
      ]),
      el("details", { class: "sync-help" }, [
        el("summary", {}, "Advanced: use a different Firebase project"),
        el("p", { class: "hint" }, "The app ships pointed at the party's project. Paste a different firebaseConfig to override (blank = use the built-in one). One-time project setup lives in SYNC.md."),
        el("label", { class: "field" }, [el("span", {}, "Firebase config override"), cfgIn]),
      ]),
    ]);
  }

  function toast(msg) { U.toast(msg); }

  function view(root) {
    root.appendChild(el("div", { class: "page-head" }, [
      el("h1", {}, "⚙️ Settings"),
      el("p", { class: "page-sub" }, "Tune the party, teams, and events. Manage your data."),
    ]));
    root.appendChild(syncSection());
    root.appendChild(partySection());
    root.appendChild(teamsSection());
    root.appendChild(eventsSection());
    root.appendChild(dataSection());
  }

  window.Views = window.Views || {};
  window.Views.settings = view;
})();
