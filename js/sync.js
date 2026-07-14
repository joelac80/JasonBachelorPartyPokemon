/* sync.js — optional live multiplayer via Firestore. Local-first: the app
   works 100% offline and only touches the network when a room is enabled.
   The whole Store state is mirrored to rooms/{room} as a JSON string (a
   string sidesteps Firestore's no-nested-arrays rule — brackets use those).
   Last-write-wins at party scale. Global `window.Sync`. */
(function () {
  const SKEY = "jasonBachHub.sync.v1";
  const CKEY = "jasonBachHub.sync.client";
  const SDK_VER = "10.12.2";
  const SDK = [
    "https://www.gstatic.com/firebasejs/" + SDK_VER + "/firebase-app-compat.js",
    "https://www.gstatic.com/firebasejs/" + SDK_VER + "/firebase-auth-compat.js",
    "https://www.gstatic.com/firebasejs/" + SDK_VER + "/firebase-firestore-compat.js",
  ];

  // The party's Firebase project, baked in so guests only enter a room code.
  // A web config is a public identifier, not a secret — access is controlled
  // by the Firestore security rules (see SYNC.md). A pasted config in
  // Settings still overrides this (e.g. to point at a different project).
  const DEFAULT_CONFIG = {
    apiKey: "AIzaSyBRk2WxgCNUYbbf39TPwmy1KVd2TldxJyE",
    authDomain: "jason-bach-party.firebaseapp.com",
    projectId: "jason-bach-party",
    storageBucket: "jason-bach-party.firebasestorage.app",
    messagingSenderId: "466012282050",
    appId: "1:466012282050:web:ce1619ba0dc7c1a385ef5b",
  };

  let conf = load();                 // { config, room, name, me, enabled }
  // 🚪 The room this app BOOTED into (remembered below) — and the room the
  // app is ACTUALLY CONNECTED to right now. A room change only forces a full
  // reload when we were genuinely live in another room (stale subscriptions,
  // battle/duel caches); a fresh phone's FIRST join just connects in place —
  // which lets the welcome tour join the room BEFORE creating a trainer.
  const bootRoom = (conf.room || "").trim();
  let liveRoom = "";                 // set once connect() points at a room
  const RKEY = "jasonBachHub.rooms.v1";
  function knownRooms() {
    try { return JSON.parse(localStorage.getItem(RKEY) || "[]"); } catch (_) { return []; }
  }
  function rememberRoom(room) {
    room = (room || "").trim();
    if (!room) return;
    try {
      const list = knownRooms().filter((r) => r.room !== room);
      list.unshift({ room: room, ts: Date.now() });
      localStorage.setItem(RKEY, JSON.stringify(list.slice(0, 8)));
    } catch (_) {}
  }
  rememberRoom(bootRoom);
  // 🚧 STATE OWNERSHIP — which room this phone's local cache belongs to.
  // Switching crews must never cross-pollinate: if the cache belongs to a
  // DIFFERENT room, we adopt the new room wholesale (or fresh-seed an empty
  // one) instead of merging room A's people into room B.
  const SROOM = "jasonBachHub.stateRoom.v1";
  function stateRoom() { try { return localStorage.getItem(SROOM) || ""; } catch (_) { return ""; } }
  function setStateRoom(r) { try { localStorage.setItem(SROOM, r || ""); } catch (_) {} }
  function reloadIfRoomChanged() {
    if (!conf.enabled) return false;
    if (!liveRoom) return false;                            // never been live — connect in place
    if ((conf.room || "").trim() === liveRoom) return false;
    setTimeout(() => { try { location.reload(); } catch (_) {} }, 120);
    return true;
  }
  let app = null, db = null, ref = null, unsub = null;
  let applying = false;              // suppress echo while applying a remote doc
  let pushTimer = null, rev = 0;
  let statusState = "off", statusMsg = "";
  const statusSubs = [];

  // ---- presence + challenges (live multiplayer) ----
  let presRef = null, chalRef = null, myPresRef = null, liveRef = null, photosRef = null, duelRef = null, roamRef = null;
  let hbTimer = null, presUnsub = null, chalUnsub = null, liveUnsub = null, photosUnsub = null, duelUnsub = null, roamUnsub = null;
  let presenceList = [], roamLast = null;
  const battleMap = {}, duelMap = {};   // id → latest doc data (all live battles / duels)
  const presenceSubs = [], chIncSubs = [], chAccSubs = [], chDecSubs = [], liveSubs = [], duelSubs = [], roamSubs = [], stateSubs = [], photoSubs = [], photoReactSubs = [];
  const handledInc = {}, handledAcc = {}, handledDec = {};   // challenge ids we've already surfaced
  let photoSeen = null;                       // ids known from the FIRST snapshot (no ping for the backlog)
  let photoReactKeys = null;                  // photoId -> { "reactorClient|emoji": 1 } already seen (new ones ping)
  let renderTimer = null;                     // pending coalesced re-render (debounces remote-update flicker)
  // Generous TTL: phones suspend background tabs (heartbeats pause), so give
  // people 3 minutes before they drop off the "here now" list.
  const PRESENCE_TTL = 180000, HEARTBEAT = 25000;

  const clientId = (function () {
    let id = null;
    try { id = localStorage.getItem(CKEY); } catch (_) {}
    if (!id) { id = "c" + Math.random().toString(36).slice(2) + Date.now().toString(36); try { localStorage.setItem(CKEY, id); } catch (_) {} }
    return id;
  })();

  function load() {
    try { const raw = localStorage.getItem(SKEY); if (raw) { const o = JSON.parse(raw); if (!("me" in o)) o.me = ""; return o; } } catch (_) {}
    return { config: null, room: "", name: "", me: "", enabled: false };
  }
  function nowMs() { try { return Date.now(); } catch (_) { return 0; } }
  function newId(p) { return p + Math.random().toString(36).slice(2) + nowMs().toString(36); }
  function persist() { try { localStorage.setItem(SKEY, JSON.stringify(conf)); } catch (_) {} }

  function setStatus(state, msg) {
    statusState = state; statusMsg = msg || "";
    statusSubs.forEach((fn) => { try { fn(statusState, statusMsg); } catch (_) {} });
  }

  // Tolerant parse of a pasted Firebase config (JSON or a JS object literal).
  function parseConfig(text) {
    if (!text) return null;
    if (typeof text === "object") return text;
    let t = String(text).trim().replace(/^(?:const|let|var)\s+\w+\s*=\s*/, "").replace(/;+\s*$/, "");
    try { return JSON.parse(t); } catch (_) {}
    try { return (new Function("return (" + t + ")"))(); } catch (_) { return null; }
  }

  function loadScript(src) {
    return new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = src; s.async = true;
      s.onload = res; s.onerror = () => rej(new Error("Couldn't load " + src));
      document.head.appendChild(s);
    });
  }
  async function loadSDK() {
    if (window.firebase && firebase.firestore) return;
    for (const u of SDK) await loadScript(u);
    if (!window.firebase || !firebase.firestore) throw new Error("Firebase SDK failed to load (are you online?)");
  }

  async function connect() {
    const cfg = conf.config || DEFAULT_CONFIG, room = (conf.room || "").trim();
    if (!cfg || !cfg.projectId) { setStatus("error", "Add your Firebase config first."); return; }
    if (!room) { setStatus("error", "Pick a room code first."); return; }
    setStatus("connecting", "Connecting…");
    try {
      await loadSDK();
      if (!app) app = firebase.apps && firebase.apps.length ? firebase.app() : firebase.initializeApp(cfg);
      // Anonymous auth if it's enabled; harmless to skip when using open rules.
      try { if (firebase.auth) await firebase.auth().signInAnonymously(); }
      catch (e) { if (!/operation-not-allowed/.test(e && e.code || "")) console.warn("Sync: anon auth failed", e); }
      db = firebase.firestore();
      ref = db.collection("rooms").doc(room);
      if (unsub) { unsub(); unsub = null; }
      unsub = ref.onSnapshot(onSnap, (err) => {
        setStatus("error", /permission/i.test(err.message) ? "Permission denied — check Firestore rules." : err.message);
      });
      liveRoom = room;               // we are pointed at THIS room's channels now
      startPresence(room);
    } catch (e) {
      setStatus("error", (e && e.message) || "Connection failed.");
    }
  }

  function disconnect() {
    stopPresence();
    if (unsub) { unsub(); unsub = null; }
    ref = null;
    setStatus("off", "");
  }

  // ---- presence: heartbeat my doc, watch who else is here ----
  function startPresence(room) {
    presRef = db.collection("rooms").doc(room).collection("presence");
    chalRef = db.collection("rooms").doc(room).collection("challenges");
    myPresRef = presRef.doc(clientId);
    writePresence();
    clearInterval(hbTimer);
    hbTimer = setInterval(writePresence, HEARTBEAT);
    if (presUnsub) presUnsub();
    presUnsub = presRef.onSnapshot((snap) => {
      const now = nowMs(), list = [];
      snap.forEach((d) => { const x = d.data(); if (x && x.t && (now - x.t) < PRESENCE_TTL) list.push(x); });
      presenceList = list;
      presenceSubs.forEach((f) => { try { f(list); } catch (_) {} });
    }, function () {});
    if (chalUnsub) chalUnsub();
    chalUnsub = chalRef.onSnapshot(handleChallenges, function () {});
    // Live battles: ONE doc per battle (so several can run + be watched at
    // once). Each change is delivered to subscribers keyed by data.id; the map
    // lets late subscribers (and the Home list) see everything currently on.
    liveRef = db.collection("rooms").doc(room).collection("battles");
    if (liveUnsub) liveUnsub();
    liveUnsub = liveRef.onSnapshot((snap) => {
      snap.docChanges().forEach((ch) => {
        const data = ch.doc.data(); if (!data || !data.id) return;
        if (ch.type === "removed") delete battleMap[data.id]; else battleMap[data.id] = data;
        liveSubs.forEach((f) => { try { f(data); } catch (_) {} });
      });
    }, function () {});
    // Remote duel channel: ONE doc per battle, holding the matchup + an
    // append-only list of turn acts. Every phone (players AND spectators)
    // replays its acts. Keyed by id so concurrent battles never cross wires.
    duelRef = db.collection("rooms").doc(room).collection("duels");
    if (duelUnsub) duelUnsub();
    duelUnsub = duelRef.onSnapshot((snap) => {
      snap.docChanges().forEach((ch) => {
        const data = ch.doc.data(); if (!data || !data.id) return;
        if (ch.type === "removed") delete duelMap[data.id]; else duelMap[data.id] = data;
        duelSubs.forEach((f) => { try { f(data); } catch (_) {} });
      });
    }, function () {});
    // Roaming legendary event — one doc, whole room races to catch it.
    roamRef = db.collection("rooms").doc(room).collection("live").doc("roam");
    if (roamUnsub) roamUnsub();
    roamUnsub = roamRef.onSnapshot((d) => {
      roamLast = d.exists ? d.data() : null;
      roamSubs.forEach((f) => { try { f(roamLast); } catch (_) {} });
    }, function () {});
    // Photo log channel — one small doc per downscaled photo.
    photosRef = db.collection("rooms").doc(room).collection("photos");
    if (photosUnsub) photosUnsub();
    photoSeen = null; photoReactKeys = null;
    const reactKeysOf = (p) => (p.reactions || []).map((r) => (r.by || "") + "|" + r.emoji);
    photosUnsub = photosRef.onSnapshot((snap) => {
      const list = []; snap.forEach((d) => { const x = d.data(); if (x && x.id) list.push(x); });
      if (list.length) { applying = true; try { Store.mergePhotos(list); } finally { applying = false; } }   // upsert (adds + reaction/comment updates)
      // Detect genuinely NEW photos AND new reactions so listeners can ping. The
      // first snapshot is the existing backlog — prime the sets silently.
      if (photoSeen === null) {
        photoSeen = {}; photoReactKeys = {};
        list.forEach((p) => { photoSeen[p.id] = 1; const s = photoReactKeys[p.id] = {}; reactKeysOf(p).forEach((k) => { s[k] = 1; }); });
      } else {
        list.forEach((p) => {
          if (!photoSeen[p.id]) {
            // brand-new photo — announce it, and seed its reactions as seen so a
            // reaction already on it doesn't also ping.
            photoSeen[p.id] = 1;
            const s = photoReactKeys[p.id] = {}; reactKeysOf(p).forEach((k) => { s[k] = 1; });
            photoSubs.forEach((f) => { try { f(p); } catch (_) {} });
          } else {
            // existing photo — fire for each newly added reaction key.
            const seen = photoReactKeys[p.id] = photoReactKeys[p.id] || {};
            (p.reactions || []).forEach((r) => {
              const k = (r.by || "") + "|" + r.emoji;
              if (seen[k]) return;
              seen[k] = 1;
              photoReactSubs.forEach((f) => { try { f(p, r); } catch (_) {} });
            });
          }
        });
      }
    }, function () {});
    try { window.addEventListener("beforeunload", removePresence); } catch (_) {}
    // When the app returns to the foreground (unlocked phone / switched back),
    // the socket may have slept — freshen the heartbeat AND force-pull the
    // room so nothing logged while away is missed. Also on window focus.
    try {
      const wake = function () {
        if (document.visibilityState !== "visible" || !ref) return;
        writePresence();
        ref.get({ source: "server" }).then(function (doc) { if (doc.exists) onSnap(doc); }).catch(function () {});
      };
      document.addEventListener("visibilitychange", wake);
      window.addEventListener("focus", wake);
    } catch (_) {}
  }
  function writePresence() {
    if (!myPresRef) return;
    myPresRef.set({ clientId: clientId, attId: conf.me || "", name: conf.name || "", t: nowMs() }).catch(function () {});
  }
  function removePresence() { if (myPresRef) myPresRef.delete().catch(function () {}); }
  function stopPresence() {
    clearInterval(hbTimer); hbTimer = null;
    clearTimeout(renderTimer); renderTimer = null;   // drop any pending coalesced re-render
    if (presUnsub) { presUnsub(); presUnsub = null; }
    if (chalUnsub) { chalUnsub(); chalUnsub = null; }
    if (liveUnsub) { liveUnsub(); liveUnsub = null; }
    if (photosUnsub) { photosUnsub(); photosUnsub = null; } photoSeen = null; photoReactKeys = null;
    if (duelUnsub) { duelUnsub(); duelUnsub = null; }
    if (roamUnsub) { roamUnsub(); roamUnsub = null; }
    removePresence();
    presRef = chalRef = myPresRef = liveRef = photosRef = duelRef = roamRef = null; presenceList = []; roamLast = null;
    Object.keys(battleMap).forEach((k) => delete battleMap[k]); Object.keys(duelMap).forEach((k) => delete duelMap[k]);
    presenceSubs.forEach((f) => { try { f([]); } catch (_) {} });
  }

  // ---- challenges: fire incoming + accepted to whoever's involved ----
  function handleChallenges(snap) {
    const now = nowMs();
    snap.forEach((d) => {
      const c = d.data(); if (!c || !c.id) return;
      // Phone-addressed knocks go stale fast (2 min) — the sender is standing
      // right there. Trainer-addressed ones (no toClient) are PATIENT: they
      // wait up to a DAY for that trainer's next phone to connect, so you can
      // challenge someone who isn't in the room and it greets them on return.
      const ttl = c.toClient ? 120000 : 86400000;
      if (c.t && now - c.t > ttl) return;
      const forMe = c.toClient ? c.toClient === clientId : !!(c.toAtt && conf.me && c.toAtt === conf.me);
      if (c.state === "pending" && forMe && !handledInc[c.id]) {
        handledInc[c.id] = 1;
        chIncSubs.forEach((f) => { try { f(c); } catch (_) {} });
      }
      if (c.state === "accepted" && (c.fromClient === clientId || c.toClient === clientId) && !handledAcc[c.id]) {
        handledAcc[c.id] = 1;
        chAccSubs.forEach((f) => { try { f(c); } catch (_) {} });
        // the challenger tidies up the doc a few seconds later
        if (c.fromClient === clientId && chalRef) setTimeout(() => { chalRef.doc(c.id).delete().catch(function () {}); }, 6000);
      }
      // 🚫 a DECLINE finally reaches the challenger (it used to vanish
      // silently — you'd just wait forever). Same tidy-up as accepts.
      if (c.state === "declined" && c.fromClient === clientId && !handledDec[c.id]) {
        handledDec[c.id] = 1;
        chDecSubs.forEach((f) => { try { f(c); } catch (_) {} });
        if (chalRef) setTimeout(() => { chalRef.doc(c.id).delete().catch(function () {}); }, 6000);
      }
    });
  }

  // A full Router.render() rebuilds the whole page. Firing one per remote
  // write makes the app flicker when the room is busy, so we COALESCE: apply
  // the fresh state immediately (data is never stale), but debounce the
  // re-render — a burst of updates collapses into a single rebuild, and none
  // fires while the tab is hidden (a focus refresh catches you up).
  function scheduleRender() {
    if (renderTimer) return;                       // one already pending — coalesce
    renderTimer = setTimeout(() => {
      renderTimer = null;
      if (document.visibilityState === "hidden") return;
      const hold = window.__deferRender && window.__deferRender();
      if (!hold && window.Router && Router.render) Router.render({ keepScroll: true });
    }, 350);
  }

  // 🎴 IDENTITY LIFEBOAT + foreign-room adoption, in one place. `obj` is the
  // room's parsed state — or null when the room doc doesn't exist yet (first
  // one in seeds it fresh). A foreign wipe protects the new room from the old
  // room's data, but it must never delete the PERSON holding the phone: the
  // trainer created moments earlier in the welcome tour was vanishing the
  // instant the room loaded (and conf.me then pointed at a ghost, hiding
  // every picker). The signed-in trainer's PROFILE crosses the border —
  // progress (catches, badges, runs) stays behind in the old room.
  function adoptForeign(obj) {
    const meRec = conf.me && window.Store && Store.attendee(conf.me);
    applying = true;
    try { if (obj) Store.adoptRemote(obj); else Store.freshSlate(); }
    finally { applying = false; }
    if (meRec && !Store.attendee(meRec.id)) {
      const copy = JSON.parse(JSON.stringify(meRec));
      Store.update((s) => { s.attendees.push(copy); });
    }
  }

  function onSnap(doc) {
    // Does the local cache belong to ANOTHER room? (Empty owner = solo history
    // — carrying solo progress into your FIRST room is intended.)
    const owner = stateRoom();
    const foreign = !!(conf.room && owner && owner !== conf.room);
    if (!doc.exists) {
      // First in the room. A foreign cache must NOT become the new room's
      // seed — room B starts from a fresh slate, not room A's people (but the
      // signed-in trainer rides along — see adoptForeign).
      if (foreign) adoptForeign(null);
      setStateRoom(conf.room);
      push(); return;
    }
    const data = doc.data(); if (!data) return;
    if (data.writer === clientId) { setStatus("live", "Synced"); setStateRoom(conf.room); return; }  // our own echo
    if (!data.stateJson) return;
    let obj; try { obj = JSON.parse(data.stateJson); } catch (_) { return; }
    if (foreign) {
      adoptForeign(obj);   // wholesale — no merge with the old room's cache
    } else {
      applying = true;
      try { Store.applyRemote(obj); } finally { applying = false; }
    }
    setStateRoom(conf.room);
    // If our local party config (teams/events) is NEWER than what just arrived,
    // the sender was lagging — the merge kept ours; now re-assert it to the room
    // so the organizer's edit propagates instead of being lost to their push.
    try { if (!foreign && (Store.state.configRev || 0) > (obj.configRev || 0)) schedulePush(); } catch (_) {}
    // The state is now current in the Store. Schedule a (debounced) re-render
    // to reflect it — unless the active view is mid-interaction and asked us
    // to hold off (e.g. mid-catch in the Safari); their next action re-renders
    // with the fresh data anyway. That hold is re-checked when the timer fires.
    scheduleRender();
    setStatus("live", "Updated" + (data.by ? " · " + data.by : ""));
    stateSubs.forEach((f) => { try { f(); } catch (_) {} });   // e.g. 📬 inbox pings (run regardless)
  }

  function schedulePush() {
    if (!conf.enabled || applying || !ref) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(push, 700);
  }
  function push() {
    if (!ref) return;
    // Photos are shared over their own channel — keep them out of the state
    // doc so it never approaches Firestore's 1 MiB limit.
    let json; try { const snap = Object.assign({}, Store.state); delete snap.photos; json = JSON.stringify(snap); } catch (_) { return; }
    ref.set({
      stateJson: json, writer: clientId, by: conf.name || "", rev: ++rev,
      ts: firebase.firestore.FieldValue.serverTimestamp(),
    }).then(() => setStatus("live", "Synced"))
      .catch((e) => setStatus("error", /permission/i.test(e.message) ? "Permission denied — check Firestore rules." : e.message));
  }

  // Push local changes (debounced). Guarded so applying a remote doc doesn't echo.
  Store.subscribe(function () { schedulePush(); });

  window.Sync = {
    // Reconnect on load whenever a room was joined (config may be the baked-in
    // default, so its absence must NOT block the reconnect).
    init() { if (conf.enabled && conf.room) connect(); },
    getConf() {
      return { config: conf.config, room: conf.room || "", name: conf.name || "", me: conf.me || "", enabled: !!conf.enabled,
        usingDefault: !conf.config, projectId: (conf.config || DEFAULT_CONFIG).projectId };
    },
    isSupported() { return true; },
    // exposed for tests: the foreign-room adoption + identity lifeboat
    _adoptForeign(obj) { return adoptForeign(obj); },
    // Save config/room/name from the Settings form (does not auto-enable).
    // Leaving the config blank means "use the party's baked-in project".
    save(rawConfig, room, name) {
      if (rawConfig && String(rawConfig).trim()) {
        const cfg = parseConfig(rawConfig);
        if (!cfg || !cfg.projectId) return { ok: false, error: "That doesn't look like a Firebase config (no projectId)." };
        conf.config = cfg;
      } else {
        conf.config = null;   // fall back to DEFAULT_CONFIG
      }
      conf.room = (room || "").trim(); conf.name = (name || "").trim();
      persist();
      rememberRoom(conf.room);
      // Already live in another room? A room change means a FULL refresh.
      const reloading = reloadIfRoomChanged();
      return { ok: true, reloading: reloading };
    },
    // Rooms this phone has joined before (newest first) — for the tour and
    // Settings, so hopping between crews is one tap.
    knownRooms() { return knownRooms(); },
    // One-tap switch: save the room, enable sync, and reload clean.
    switchRoom(room) {
      conf.room = (room || "").trim();
      conf.enabled = !!conf.room;
      persist();
      rememberRoom(conf.room);
      if (!reloadIfRoomChanged()) { if (conf.enabled) connect(); }
    },
    enable() { conf.enabled = true; persist(); rememberRoom(conf.room); if (!reloadIfRoomChanged()) connect(); },
    disable() { conf.enabled = false; persist(); disconnect(); },
    // 🚪 Leave the current room: back to solo play. The local copy of the
    // room's world stays on this phone (local-first) — rejoining later picks
    // it right back up. Reloads when we were live so nothing stale lingers.
    leaveRoom() {
      const wasLive = !!liveRoom;
      conf.enabled = false; conf.room = "";
      persist();
      disconnect();
      if (wasLive) setTimeout(() => { try { location.reload(); } catch (_) {} }, 120);
      return wasLive;
    },
    // Drop a room from this phone's remembered list (does not touch the room).
    forgetRoom(room) {
      room = (room || "").trim();
      try { localStorage.setItem(RKEY, JSON.stringify(knownRooms().filter((r) => r.room !== room))); } catch (_) {}
    },
    status() { return { state: statusState, msg: statusMsg }; },
    onStatus(fn) { statusSubs.push(fn); fn(statusState, statusMsg); return () => { const i = statusSubs.indexOf(fn); if (i >= 0) statusSubs.splice(i, 1); }; },

    // ---- presence + challenges ----
    // Sign in as your trainer on THIS device (also used as your display name).
    getMe() { return conf.me || ""; },
    setMe(attId) {
      conf.me = attId || "";
      const a = window.Store && Store.attendee(attId);
      if (a) conf.name = a.name;
      persist();
      writePresence();
      try { window.dispatchEvent(new CustomEvent("sync-me")); } catch (_) {}
      return conf.name;
    },
    presence() { return presenceList.slice(); },
    onPresence(fn) { presenceSubs.push(fn); fn(presenceList.slice()); return () => { const i = presenceSubs.indexOf(fn); if (i >= 0) presenceSubs.splice(i, 1); }; },
    isLive() { return statusState === "live" || statusState === "connecting"; },
    myClientId() { return clientId; },
    // Force-pull the room doc right now (belt-and-suspenders on top of the
    // live listener — for when a phone woke from sleep and the socket lagged).
    // Returns a promise; resolves false if not connected.
    refresh() {
      if (!ref) return Promise.resolve(false);
      writePresence();
      return ref.get({ source: "server" }).then(function (doc) {
        if (doc.exists) onSnap(doc);
        setStatus("live", "Refreshed");
        return true;
      }).catch(function () {
        // fall back to the cache/whatever the listener has
        try { setStatus("live", "Synced"); } catch (_) {}
        return false;
      });
    },
    // Challenge a present device (by its clientId) to a battle. `extra` can
    // carry { kind: "duel", party: [monIds] } for a real remote duel, plus
    // { pairAtt, pairParty } to make it a DOUBLE battle (bring a partner).
    sendChallenge(toClient, toAtt, toName, event, extra) {
      if (!chalRef) return null;
      const id = newId("ch");
      chalRef.doc(id).set({
        id: id, fromClient: clientId, fromAtt: conf.me || "", fromName: conf.name || "You",
        toClient: toClient, toAtt: toAtt || "", toName: toName || "", event: event || "", state: "pending", t: nowMs(),
        kind: (extra && extra.kind) || "", party: (extra && extra.party) || [],
        pairAtt: (extra && extra.pairAtt) || "", pairParty: (extra && extra.pairParty) || [],
        solo2: !!(extra && extra.solo2),
      }).catch(function () {});
      return id;
    },
    respondChallenge(ch, accept) {
      if (!chalRef || !ch || !ch.id) return;
      chalRef.doc(ch.id).set({ state: accept ? "accepted" : "declined", t: nowMs() }, { merge: true }).catch(function () {});
    },
    onChallengeIncoming(fn) { chIncSubs.push(fn); return () => { const i = chIncSubs.indexOf(fn); if (i >= 0) chIncSubs.splice(i, 1); }; },
    onChallengeAccepted(fn) { chAccSubs.push(fn); return () => { const i = chAccSubs.indexOf(fn); if (i >= 0) chAccSubs.splice(i, 1); }; },
    onChallengeDeclined(fn) { chDecSubs.push(fn); return () => { const i = chDecSubs.indexOf(fn); if (i >= 0) chDecSubs.splice(i, 1); }; },
    _fireDeclined(c) { chDecSubs.forEach((f) => { try { f(c); } catch (_) {} }); },   // test seam
    _fireAccepted(c) { chAccSubs.forEach((f) => { try { f(c); } catch (_) {} }); },   // test seam
    _handleChal(list) { handleChallenges({ forEach: (f) => list.forEach((c) => f({ data: () => c })) }); },   // test seam

    // ---- live battles (broadcast so the whole room can watch — many at once) ----
    // Returns the battle's id; callers keep it to finish that exact battle.
    // Pass info.id to reuse an id (e.g. match the duel channel's id).
    startLiveBattle(info) {
      if (!liveRef || !info) return "";
      const id = info.id || newId("lb");
      liveRef.doc(id).set({
        id: id, aName: info.aName || "", bName: info.bName || "",
        aClient: info.aClient || "", bClient: info.bClient || "", event: info.event || "",
        stakes: info.stakes || "", mode: info.mode || "", state: "live", winner: "", t: nowMs(),
      }).catch(function () {});
      return id;
    },
    finishLiveBattle(id, winner) {
      if (!liveRef || !id) return;
      liveRef.doc(id).set({ state: "done", winner: winner || "", t: nowMs() }, { merge: true }).catch(function () {});
    },
    onLiveBattle(fn) {
      liveSubs.push(fn);
      // Replay everything currently known so a fresh subscriber catches up.
      Object.keys(battleMap).forEach((k) => { try { fn(battleMap[k]); } catch (_) {} });
      return () => { const i = liveSubs.indexOf(fn); if (i >= 0) liveSubs.splice(i, 1); };
    },
    // Every battle currently live, oldest first — for the Home "watch" list.
    // A phone that dies mid-battle never writes state:"done", so anything
    // "live" for 3+ hours is a ghost — filtered out of every list.
    liveActive() {
      const now = nowMs();
      return Object.keys(battleMap).map((k) => battleMap[k])
        .filter((d) => d && d.state === "live" && !(d.t && now - d.t > 10800000))
        .sort((a, b) => (a.t || 0) - (b.t || 0));
    },
    // Zombie sweep for MY OWN battles: any broadcast THIS device is a player
    // in that's still "live" when no battle is on screen means the app was
    // closed mid-fight — auto-forfeit them. Returns the docs it closed so
    // the caller can toast. (Other phones' ghosts age out via liveActive.)
    sweepMyLiveBattles() {
      const mine = Object.keys(battleMap).map((k) => battleMap[k])
        .filter((d) => d && d.state === "live" && (d.aClient === clientId || d.bClient === clientId));
      mine.forEach((d) => {
        battleMap[d.id] = Object.assign({}, d, { state: "done", winner: "" });
        if (liveRef) liveRef.doc(d.id).set({ state: "done", winner: "", t: nowMs() }, { merge: true }).catch(function () {});
      });
      return mine;
    },

    // ---- remote duels (turn-by-turn across phones) ----
    // The accepter writes the matchup; each phone appends its turn acts.
    // Setup travels as a JSON string (arrays nest inside it freely). One doc
    // per battle (id), so concurrent duels never overwrite each other.
    startRemoteDuel(setup) {
      if (!duelRef || !setup) return null;
      const id = newId("dl");
      duelRef.doc(id).set({ id: id, state: "live", t: nowMs(), setupJson: JSON.stringify(setup), acts: [] }).catch(function () {});
      return id;
    },
    sendDuelAct(id, act) {
      if (!duelRef || !id || !act) return;
      duelRef.doc(id).set({ acts: firebase.firestore.FieldValue.arrayUnion(act) }, { merge: true }).catch(function () {});
    },
    endRemoteDuel(id, winner) {
      if (!duelRef || !id) return;
      duelRef.doc(id).set({ state: "done", winner: winner || "", t: nowMs() }, { merge: true }).catch(function () {});
    },
    // The latest known data for one duel doc (setup + acts + rx), for late watchers.
    duelData(id) { return (id && duelMap[id]) || null; },
    // ---- roaming legendary (room-wide RACE — first catch claims it) ----
    startRoam(monId) {
      if (!roamRef || !monId) return;
      roamRef.set({ id: newId("rm"), monId: monId, state: "live", by: conf.name || "", t: nowMs() }).catch(function () {});
    },
    claimRoam(byName) {
      if (!roamRef) return;
      roamRef.set({ state: "done", claimedBy: byName || "", t: nowMs() }, { merge: true }).catch(function () {});
    },
    roam() {
      if (!roamLast || roamLast.state !== "live") return null;
      if (roamLast.t && nowMs() - roamLast.t > 1200000) return null;   // 20 min and it wanders off
      return roamLast;
    },
    onRoam(fn) { roamSubs.push(fn); return () => { const i = roamSubs.indexOf(fn); if (i >= 0) roamSubs.splice(i, 1); }; },

    // Spectator reaction — floats up on every screen watching THAT duel.
    sendDuelReaction(id, emoji) {
      if (!duelRef || !id || !emoji) return;
      duelRef.doc(id).set({ rx: firebase.firestore.FieldValue.arrayUnion({ e: emoji, by: conf.name || "", t: nowMs() }) }, { merge: true }).catch(function () {});
    },
    onDuel(fn) {
      duelSubs.push(fn);
      Object.keys(duelMap).forEach((k) => { try { fn(duelMap[k]); } catch (_) {} });
      return () => { const i = duelSubs.indexOf(fn); if (i >= 0) duelSubs.splice(i, 1); };
    },
    // fires after a REMOTE state doc is applied (not on local edits)
    onStateApplied(fn) { stateSubs.push(fn); return () => { const i = stateSubs.indexOf(fn); if (i >= 0) stateSubs.splice(i, 1); }; },
    // Fires with each NEW photo that lands from the room (backlog excluded).
    onPhotoAdded(fn) { photoSubs.push(fn); return () => { const i = photoSubs.indexOf(fn); if (i >= 0) photoSubs.splice(i, 1); }; },
    // Fires (photo, reaction) when a NEW reaction lands on any photo.
    onPhotoReaction(fn) { photoReactSubs.push(fn); return () => { const i = photoReactSubs.indexOf(fn); if (i >= 0) photoReactSubs.splice(i, 1); }; },

    // Share a photo moment to the room (its own doc — keeps the state doc lean).
    sharePhoto(entry) { if (photosRef && entry && entry.id) photosRef.doc(entry.id).set(entry).catch(function () {}); },
  };
})();
