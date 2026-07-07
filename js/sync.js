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
  let app = null, db = null, ref = null, unsub = null;
  let applying = false;              // suppress echo while applying a remote doc
  let pushTimer = null, rev = 0;
  let statusState = "off", statusMsg = "";
  const statusSubs = [];

  // ---- presence + challenges (live multiplayer) ----
  let presRef = null, chalRef = null, myPresRef = null, liveRef = null, photosRef = null, duelRef = null;
  let hbTimer = null, presUnsub = null, chalUnsub = null, liveUnsub = null, photosUnsub = null, duelUnsub = null;
  let presenceList = [];
  const presenceSubs = [], chIncSubs = [], chAccSubs = [], liveSubs = [], duelSubs = [];
  const handledInc = {}, handledAcc = {};   // challenge ids we've already surfaced
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
    liveRef = db.collection("rooms").doc(room).collection("live").doc("current");
    if (liveUnsub) liveUnsub();
    liveUnsub = liveRef.onSnapshot((d) => {
      const data = d.exists ? d.data() : null;
      liveSubs.forEach((f) => { try { f(data); } catch (_) {} });
    }, function () {});
    // Remote duel channel: one doc holding the matchup + an append-only list
    // of turn acts. Every phone (players AND spectators) replays the acts.
    duelRef = db.collection("rooms").doc(room).collection("live").doc("duel");
    if (duelUnsub) duelUnsub();
    duelUnsub = duelRef.onSnapshot((d) => {
      const data = d.exists ? d.data() : null;
      duelSubs.forEach((f) => { try { f(data); } catch (_) {} });
    }, function () {});
    // Photo log channel — one small doc per downscaled photo.
    photosRef = db.collection("rooms").doc(room).collection("photos");
    if (photosUnsub) photosUnsub();
    photosUnsub = photosRef.onSnapshot((snap) => {
      const list = []; snap.forEach((d) => { const x = d.data(); if (x && x.id) list.push(x); });
      if (list.length) { applying = true; try { Store.mergePhotos(list); } finally { applying = false; } }   // upsert (adds + reaction/comment updates)
    }, function () {});
    try { window.addEventListener("beforeunload", removePresence); } catch (_) {}
    // Freshen our heartbeat the moment the tab comes back to the foreground.
    try { document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible") writePresence(); }); } catch (_) {}
  }
  function writePresence() {
    if (!myPresRef) return;
    myPresRef.set({ clientId: clientId, attId: conf.me || "", name: conf.name || "", t: nowMs() }).catch(function () {});
  }
  function removePresence() { if (myPresRef) myPresRef.delete().catch(function () {}); }
  function stopPresence() {
    clearInterval(hbTimer); hbTimer = null;
    if (presUnsub) { presUnsub(); presUnsub = null; }
    if (chalUnsub) { chalUnsub(); chalUnsub = null; }
    if (liveUnsub) { liveUnsub(); liveUnsub = null; }
    if (photosUnsub) { photosUnsub(); photosUnsub = null; }
    if (duelUnsub) { duelUnsub(); duelUnsub = null; }
    removePresence();
    presRef = chalRef = myPresRef = liveRef = photosRef = duelRef = null; presenceList = [];
    presenceSubs.forEach((f) => { try { f([]); } catch (_) {} });
  }

  // ---- challenges: fire incoming + accepted to whoever's involved ----
  function handleChallenges(snap) {
    const now = nowMs();
    snap.forEach((d) => {
      const c = d.data(); if (!c || !c.id) return;
      if (c.t && now - c.t > 120000) return;   // ignore stale (2 min)
      if (c.state === "pending" && c.toClient === clientId && !handledInc[c.id]) {
        handledInc[c.id] = 1;
        chIncSubs.forEach((f) => { try { f(c); } catch (_) {} });
      }
      if (c.state === "accepted" && (c.fromClient === clientId || c.toClient === clientId) && !handledAcc[c.id]) {
        handledAcc[c.id] = 1;
        chAccSubs.forEach((f) => { try { f(c); } catch (_) {} });
        // the challenger tidies up the doc a few seconds later
        if (c.fromClient === clientId && chalRef) setTimeout(() => { chalRef.doc(c.id).delete().catch(function () {}); }, 6000);
      }
    });
  }

  function onSnap(doc) {
    if (!doc.exists) { push(); return; }          // first in the room: seed it
    const data = doc.data(); if (!data) return;
    if (data.writer === clientId) { setStatus("live", "Synced"); return; }  // our own echo
    if (!data.stateJson) return;
    let obj; try { obj = JSON.parse(data.stateJson); } catch (_) { return; }
    applying = true;
    try { Store.applyRemote(obj); } finally { applying = false; }
    if (window.Router && Router.render) Router.render();
    setStatus("live", "Updated" + (data.by ? " · " + data.by : ""));
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
      return { config: conf.config, room: conf.room || "", name: conf.name || "", enabled: !!conf.enabled,
        usingDefault: !conf.config, projectId: (conf.config || DEFAULT_CONFIG).projectId };
    },
    isSupported() { return true; },
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
      return { ok: true };
    },
    enable() { conf.enabled = true; persist(); connect(); },
    disable() { conf.enabled = false; persist(); disconnect(); },
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
      }).catch(function () {});
      return id;
    },
    respondChallenge(ch, accept) {
      if (!chalRef || !ch || !ch.id) return;
      chalRef.doc(ch.id).set({ state: accept ? "accepted" : "declined", t: nowMs() }, { merge: true }).catch(function () {});
    },
    onChallengeIncoming(fn) { chIncSubs.push(fn); return () => { const i = chIncSubs.indexOf(fn); if (i >= 0) chIncSubs.splice(i, 1); }; },
    onChallengeAccepted(fn) { chAccSubs.push(fn); return () => { const i = chAccSubs.indexOf(fn); if (i >= 0) chAccSubs.splice(i, 1); }; },

    // ---- live battle (broadcast so the whole room can watch) ----
    startLiveBattle(info) {
      if (!liveRef || !info) return;
      liveRef.set({
        id: newId("lb"), aName: info.aName || "", bName: info.bName || "",
        aClient: info.aClient || "", bClient: info.bClient || "", event: info.event || "",
        mode: info.mode || "", state: "live", winner: "", t: nowMs(),
      }).catch(function () {});
    },
    finishLiveBattle(winner) {
      if (!liveRef) return;
      liveRef.set({ state: "done", winner: winner || "", t: nowMs() }, { merge: true }).catch(function () {});
    },
    onLiveBattle(fn) { liveSubs.push(fn); return () => { const i = liveSubs.indexOf(fn); if (i >= 0) liveSubs.splice(i, 1); }; },

    // ---- remote duels (turn-by-turn across phones) ----
    // The accepter writes the matchup; each phone appends its turn acts.
    // Setup travels as a JSON string (arrays nest inside it freely).
    startRemoteDuel(setup) {
      if (!duelRef || !setup) return null;
      const id = newId("dl");
      duelRef.set({ id: id, state: "live", t: nowMs(), setupJson: JSON.stringify(setup), acts: [] }).catch(function () {});
      return id;
    },
    sendDuelAct(act) {
      if (!duelRef || !act) return;
      duelRef.set({ acts: firebase.firestore.FieldValue.arrayUnion(act) }, { merge: true }).catch(function () {});
    },
    endRemoteDuel(winner) {
      if (!duelRef) return;
      duelRef.set({ state: "done", winner: winner || "", t: nowMs() }, { merge: true }).catch(function () {});
    },
    // Spectator reaction — floats up on every screen watching the duel.
    sendDuelReaction(emoji) {
      if (!duelRef || !emoji) return;
      duelRef.set({ rx: firebase.firestore.FieldValue.arrayUnion({ e: emoji, by: conf.name || "", t: nowMs() }) }, { merge: true }).catch(function () {});
    },
    onDuel(fn) { duelSubs.push(fn); return () => { const i = duelSubs.indexOf(fn); if (i >= 0) duelSubs.splice(i, 1); }; },

    // Share a photo moment to the room (its own doc — keeps the state doc lean).
    sharePhoto(entry) { if (photosRef && entry && entry.id) photosRef.doc(entry.id).set(entry).catch(function () {}); },
  };
})();
