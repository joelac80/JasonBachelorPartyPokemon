/* settings.js — manage party info, teams, events; backup / import / reset. */
(function () {
  const { el, uid, contrast } = U;

  // Every party/teams/events edit runs through here: it stamps `configRev` so a
  // lagging phone's last-write-wins push can't revert this edit (see
  // Store._mergeCumulative). Without this, a stale device kept clearing edits.
  function cfgUpdate(mut) {
    Store.update((s) => { mut(s); s.configRev = (Date.now && Date.now()) || ((s.configRev || 0) + 1); });
  }

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
        cfgUpdate((s) => {
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
            onChange: (e) => cfgUpdate((s) => { s.teams.find(x=>x.id===t.id).color = e.target.value; }) }),
          el("input", { class: "in", value: t.emoji, style: { maxWidth: "56px" },
            onChange: (e) => cfgUpdate((s) => { s.teams.find(x=>x.id===t.id).emoji = e.target.value; }) }),
          el("input", { class: "in grow", value: t.name,
            onChange: (e) => cfgUpdate((s) => { s.teams.find(x=>x.id===t.id).name = e.target.value; }) }),
          el("button", { class: "btn danger sm", onClick: () => {
            if (confirm("Delete " + t.name + "? Members become free agents.")) {
              cfgUpdate((s) => {
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
        cfgUpdate((s) => s.teams.push({
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
            onChange: (e) => cfgUpdate((s) => { s.events.find(x=>x.id===ev.id).emoji = e.target.value; }) }),
          el("input", { class: "in grow", value: ev.name,
            onChange: (e) => cfgUpdate((s) => { s.events.find(x=>x.id===ev.id).name = e.target.value; }) }),
          el("input", { class: "in", type: "number", value: ev.points, style: { maxWidth: "90px" },
            onChange: (e) => cfgUpdate((s) => { s.events.find(x=>x.id===ev.id).points = parseInt(e.target.value,10)||0; }) }),
          el("button", { class: "btn danger sm", onClick: () => {
            if (confirm("Delete event " + ev.name + "?")) {
              cfgUpdate((s) => {
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
        cfgUpdate((s) => s.events.push({
          id: uid("event"), name: "New Event", emoji: "🎯", points: 50, desc: "",
        }));
        render();
      } }, "+ Add event"),
    ]);
  }

  // A wipe can orphan the signed-in "me" — sign the ghost out right away so
  // the next trainer created on this phone auto-signs in (no Settings detour).
  function dropGhostMe() {
    try { if (window.Sync && Sync.getMe() && !Store.attendee(Sync.getMe())) Sync.setMe(""); } catch (_) {}
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
          U.ownerGate("Resetting EVERYTHING back to the blank default slate (wipes trainers, scores, drafts, edits)", () => {
            Store.reset();
            dropGhostMe();
            Router.render();
          });
        } }, "↺ Reset to defaults"),
        el("button", { class: "btn danger", onClick: () => {
          U.ownerGate("Starting a FRESH SLATE — wipes ALL progress AND the trainer list for the whole room", () => {
            Store.freshSlate();
            dropGhostMe();
            Router.render();
          });
        } }, "🧹 Fresh slate (blank trainers)"),
      ]),
    ]);
  }

  function exportData() {
    const blob = new Blob([Store.exportJSON()], { type: "application/json" });
    const a = el("a", {
      href: URL.createObjectURL(blob),
      download: "party-hub-backup.json",
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
    // (getConf omitted `me` for ages, so this select ALWAYS showed the
    // placeholder even while you were signed in — and every live-sync
    // re-render "reset" it. It reads the live value now, twice over.)
    const meSel = el("select", { class: "in" }, [el("option", { value: "" }, "— pick your trainer —")].concat(
      Store.state.attendees.map((a) => el("option", { value: a.id, selected: (Sync.getMe() || c.me) === a.id ? "true" : null }, a.name))));
    meSel.value = Sync.getMe() || "";
    meSel.addEventListener("change", () => {
      const nm = Sync.setMe(meSel.value);
      if (nm) nameIn.value = nm;
      U.toast(meSel.value ? "🎴 Signed in as " + nm : "👋 Signed out on this phone");
      Router.render({ keepScroll: true });   // locked rows + header reflect immediately
    });

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
      photoChk, el("span", {}, "📸 Alert me when someone else posts a photo"),
    ]);
    // Opt-in: a ping when someone reacts to one of YOUR photos.
    const reactChk = el("input", { type: "checkbox" });
    try { reactChk.checked = !!(window.AppNotify && AppNotify.reactAlerts()); } catch (_) {}
    reactChk.addEventListener("change", () => {
      if (window.AppNotify) AppNotify.setReactAlerts(reactChk.checked);
      if (reactChk.checked && window.AppNotify && AppNotify.permission() !== "granted") {
        AppNotify.request(() => paintNote());
      }
      toast(reactChk.checked ? "💛 You'll be pinged when someone reacts to your photos" : "Reaction alerts off");
    });
    const reactAlertRow = el("label", { class: "note-toggle" }, [
      reactChk, el("span", {}, "💛 Alert me when someone reacts to my photo"),
    ]);
    // Fire the exact alert a real photo triggers, so you can confirm it works
    // on THIS phone without waiting for someone else to post. (You never get
    // alerted for your own uploads — that's why testing solo looks silent.)
    const photoTestRow = el("div", { class: "toolbar" }, [
      el("button", { class: "btn subtle sm", onClick: () => {
        if (!window.AppNotify || !AppNotify.photoAlerts()) { toast("Turn on photo alerts first ☝️"); return; }
        if (window.SFX && SFX.blip) SFX.blip();
        U.toast("📸 Chris posted a photo — “sample shot” (test)", "View", () => { location.hash = "#/feed"; });
        if (AppNotify.permission() === "granted") setTimeout(() => { if (window.AppNotify) AppNotify.ping("📸 New photo!", "Chris just posted a moment (test)"); }, 4000);
      } }, "Send a test photo alert"),
      el("span", { class: "hint" }, "Fires the toast now; background the app within ~4s to see the phone banner too."),
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
      // 🚪 Known rooms — every crew this phone has played with, one-tap switch.
      (function knownRoomsRow() {
        const known = (Sync.knownRooms && Sync.knownRooms()) || [];
        if (!known.length) return null;
        const cur = (Sync.getConf().room || "").trim();
        const shareRow = cur ? el("div", { class: "toolbar" }, [
          el("button", { class: "btn subtle sm", onClick: () => {
            const link = location.origin + location.pathname + "#/join/" + encodeURIComponent(cur);
            const done = () => toast("📨 Invite link copied — send it to the crew!");
            if (navigator.share) navigator.share({ title: "Join our Pokémon room", text: "Join room " + cur + " — tap the link and you're in.", url: link }).catch(() => {});
            else if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(link).then(done, () => prompt("Copy the invite link:", link));
            else prompt("Copy the invite link:", link);
          } }, "📨 Share an invite link to " + cur),
          el("span", { class: "hint" }, "The link auto-fills the room — friends just tap Join."),
        ]) : null;
        return el("div", {}, [
          shareRow,
          // 🚪 leave = back to solo play; the room's world stays saved on this
          // phone (local-first), so rejoining later picks it right back up.
          cur ? el("div", { class: "toolbar" }, [
            el("button", { class: "btn subtle sm", onClick: () => {
              if (!confirm("Leave room " + cur + "? You go back to solo play — nothing is deleted, and you can rejoin any time.")) return;
              const reloading = Sync.leaveRoom();
              toast("👋 Left " + cur);
              if (!reloading) Router.render();
            } }, "👋 Leave " + cur + " (back to solo)"),
          ]) : null,
          el("p", { class: "hint" }, "🚪 Your rooms — tap to SWITCH; ✕ forgets a room from this list:"),
          el("div", { class: "toolbar", style: { flexWrap: "wrap" } }, known.map((r) =>
            el("span", { class: "room-chip-group" }, [
              el("button", { class: "btn sm " + (r.room === cur ? "primary" : "subtle"), onClick: () => {
                if (r.room === cur) { toast("Already in " + r.room); return; }
                if (!confirm("Switch this phone to room " + r.room + "? The app syncs with that crew" + (Sync.getConf().enabled ? " (reloads fresh)" : "") + ".")) return;
                Sync.switchRoom(r.room);
              } }, "🚪 " + r.room + (r.room === cur ? " ✓" : "")),
              r.room !== cur ? el("button", { class: "btn subtle sm room-forget", title: "Forget this room (just removes it from this list)", onClick: () => {
                Sync.forgetRoom(r.room);
                toast("Forgot " + r.room);
                Router.render({ keepScroll: true });
              } }, "✕") : null,
            ]))),
        ]);
      })(),
      el("div", { class: "toolbar" }, [enableBtn, saveBtn,
        el("button", { class: "btn subtle", onClick: () => {
          if (!confirm("👋 Log out of this trainer? The phone goes back to a fresh start (welcome tour included) — the room code stays filled in, and no scores are touched.")) return;
          try { Sync.setMe(""); } catch (_) {}
          try { localStorage.removeItem("jasonBachHub.onboarded"); } catch (_) {}
          location.hash = "#/home";
          location.reload();
        } }, "👋 Log out trainer"),
      ]),
      // 👑 ROOM OWNER — claim the room with a PIN; destructive acts
      // (removing trainers, fresh slate, reset) then require it. First
      // claim wins across the whole room.
      (function ownerBlock() {
        const host = el("div", {});
        function paint() {
          host.innerHTML = "";
          host.appendChild(el("h2", { class: "section-title" }, "👑 Room owner"));
          const o = Store.roomOwner && Store.roomOwner();
          if (o) {
            host.appendChild(el("p", { class: "hint" }, "This room is owned by " + (o.name || "a trainer") +
              ". Removing trainers and slate wipes ask for the owner's PIN. (Keep the PIN safe — there's no reset without it.)"));
            return;
          }
          const pinIn = el("input", { class: "in", type: "password", inputmode: "numeric", placeholder: "Choose a PIN (4+ digits)", autocomplete: "off", style: { maxWidth: "220px" } });
          const claim = () => {
            const meId = (window.Sync && Sync.getMe && Sync.getMe()) || "";
            if (!meId) { alert("Sign in as your trainer first (“You are” above)."); return; }
            if (String(pinIn.value || "").trim().length < 4) { toast("PIN needs at least 4 characters"); try { pinIn.focus(); } catch (_) {} return; }
            if (Store.claimRoom(pinIn.value, meId)) { toast("👑 You own this room — guard that PIN!"); paint(); }
            else { toast("Someone claimed it first!"); paint(); }
          };
          pinIn.addEventListener("keydown", (e) => { if (e.key === "Enter") claim(); });
          host.appendChild(el("p", { class: "hint" }, "Nobody owns this room yet. The owner's PIN gates trainer removal and the slate wipes below — claim it before the crew piles in."));
          host.appendChild(el("div", { class: "toolbar" }, [pinIn, el("button", { class: "btn primary sm", onClick: claim }, "👑 Claim room ownership")]));
        }
        paint();
        return host;
      })(),
      el("h2", { class: "section-title" }, "🔔 Phone alerts"),
      el("p", { class: "hint" }, "Get pinged when you're challenged or a battle starts. iPhone REQUIRES the app on your Home Screen first (Share → Add to Home Screen), opened from that icon."),
      noteStatus,
      noteBtns,
      photoAlertRow,
      reactAlertRow,
      photoTestRow,
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
      el("p", { class: "page-sub" }, "Your room, trainer and alerts up top; backups below — and the party-admin corner tucked under 🎉 Party Settings."),
    ]));
    root.appendChild(syncSection());
    // 🎉 PARTY SETTINGS — everything about the PARTY rather than the app:
    // the title on the home hero, drinking-game teams, Victory Road events.
    // Collapsed by default: one organizer touches these, everyone else never.
    root.appendChild(el("details", { class: "sync-help settings-party" }, [
      el("summary", {}, "🎉 Party Settings — title, teams & party events"),
      el("p", { class: "hint" }, "The organizer's corner. These name the party on the home page and drive the party-night games (teams, Victory Road points). App things — room, sync, alerts, backups — live outside this box."),
      partySection(),
      teamsSection(),
      eventsSection(),
    ]));
    root.appendChild(dataSection());

    // While you're actively editing a field here, hold off any live-sync
    // re-render — otherwise an incoming update from another phone would rebuild
    // the whole page and yank the input out from under you mid-edit. The Router
    // clears this the moment you navigate away or the page re-renders for real.
    window.__deferRender = function () {
      const a = document.activeElement;
      return !!(a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && root.contains(a));
    };
  }

  window.Views = window.Views || {};
  window.Views.settings = view;
})();
