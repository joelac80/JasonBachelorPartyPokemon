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

  let conf = load();                 // { config, room, name, enabled }
  let app = null, db = null, ref = null, unsub = null;
  let applying = false;              // suppress echo while applying a remote doc
  let pushTimer = null, rev = 0;
  let statusState = "off", statusMsg = "";
  const statusSubs = [];

  const clientId = (function () {
    let id = null;
    try { id = localStorage.getItem(CKEY); } catch (_) {}
    if (!id) { id = "c" + Math.random().toString(36).slice(2) + Date.now().toString(36); try { localStorage.setItem(CKEY, id); } catch (_) {} }
    return id;
  })();

  function load() {
    try { const raw = localStorage.getItem(SKEY); if (raw) return JSON.parse(raw); } catch (_) {}
    return { config: null, room: "", name: "", enabled: false };
  }
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
    const cfg = conf.config, room = (conf.room || "").trim();
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
    } catch (e) {
      setStatus("error", (e && e.message) || "Connection failed.");
    }
  }

  function disconnect() {
    if (unsub) { unsub(); unsub = null; }
    ref = null;
    setStatus("off", "");
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
    let json; try { json = JSON.stringify(Store.state); } catch (_) { return; }
    ref.set({
      stateJson: json, writer: clientId, by: conf.name || "", rev: ++rev,
      ts: firebase.firestore.FieldValue.serverTimestamp(),
    }).then(() => setStatus("live", "Synced"))
      .catch((e) => setStatus("error", /permission/i.test(e.message) ? "Permission denied — check Firestore rules." : e.message));
  }

  // Push local changes (debounced). Guarded so applying a remote doc doesn't echo.
  Store.subscribe(function () { schedulePush(); });

  window.Sync = {
    init() { if (conf.enabled && conf.config && conf.room) connect(); },
    getConf() { return { config: conf.config, room: conf.room || "", name: conf.name || "", enabled: !!conf.enabled }; },
    isSupported() { return true; },
    // Save config/room/name from the Settings form (does not auto-enable).
    save(rawConfig, room, name) {
      const cfg = parseConfig(rawConfig);
      if (!cfg || !cfg.projectId) return { ok: false, error: "That doesn't look like a Firebase config (no projectId)." };
      conf.config = cfg; conf.room = (room || "").trim(); conf.name = (name || "").trim();
      persist();
      return { ok: true };
    },
    enable() { conf.enabled = true; persist(); connect(); },
    disable() { conf.enabled = false; persist(); disconnect(); },
    status() { return { state: statusState, msg: statusMsg }; },
    onStatus(fn) { statusSubs.push(fn); fn(statusState, statusMsg); return () => { const i = statusSubs.indexOf(fn); if (i >= 0) statusSubs.splice(i, 1); }; },
  };
})();
