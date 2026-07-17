/* theme.js — 🌓 per-phone appearance: AUTO (follow the phone's light/dark
   setting) / light / dark. Stamps data-theme on <html>; the dark palette
   lives in styles.css and the BATTLE keeps its stadium look by re-pinning
   light values on its subtree. Loaded before the views so the page never
   flashes the wrong theme. */
(function () {
  const KEY = "jasonBachHub.theme.v1";
  const mq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  function get() {
    try { const v = localStorage.getItem(KEY); return v === "light" || v === "dark" ? v : "auto"; }
    catch (_) { return "auto"; }
  }
  function resolved() { const v = get(); return v === "auto" ? (mq && mq.matches ? "dark" : "light") : v; }
  function apply() { document.documentElement.dataset.theme = resolved(); }
  function set(v) { try { localStorage.setItem(KEY, v); } catch (_) {} apply(); }
  // Auto mode tracks the phone live — flip the system setting, the app follows.
  if (mq) {
    const onChange = () => { if (get() === "auto") apply(); };
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else if (mq.addListener) mq.addListener(onChange);
  }
  apply();
  window.Theme = { get: get, set: set, resolved: resolved, apply: apply };
})();
