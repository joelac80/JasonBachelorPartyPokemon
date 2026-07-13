/*
 * util.js — small DOM + formatting helpers. Global `U`.
 */
(function () {
  // Escape untrusted text before inserting into innerHTML.
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // Create an element with attrs + children. children = string | Node | array.
  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        const v = attrs[k];
        if (v == null || v === false) continue;
        if (k === "class") node.className = v;
        else if (k === "style" && typeof v === "object") {
          // Assign each property; use setProperty for CSS custom props (--x),
          // which are silently ignored by Object.assign / bracket assignment.
          for (const sk in v) {
            if (sk.charAt(0) === "-" && sk.charAt(1) === "-") node.style.setProperty(sk, v[sk]);
            else node.style[sk] = v[sk];
          }
        }
        else if (k.startsWith("on") && typeof v === "function") {
          node.addEventListener(k.slice(2).toLowerCase(), v);
        } else if (k === "dataset") {
          Object.assign(node.dataset, v);
        } else {
          node.setAttribute(k, v);
        }
      }
    }
    appendChildren(node, children);
    return node;
  }

  function appendChildren(node, children) {
    if (children == null) return;
    const list = Array.isArray(children) ? children : [children];
    list.forEach((c) => {
      if (c == null || c === false) return;
      node.appendChild(typeof c === "string" || typeof c === "number"
        ? document.createTextNode(String(c))
        : c);
    });
  }

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  // Contrast color (black/white) for a given hex background.
  function contrast(hex) {
    const h = hex.replace("#", "");
    if (h.length < 6) return "#000";
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return lum > 0.58 ? "#0d1b17" : "#ffffff";
  }

  // Simple id generator for user-added records.
  function uid(prefix) {
    return (prefix || "id") + "-" + Math.random().toString(36).slice(2, 9);
  }

  // Pokemon type -> accent color, used on trainer cards.
  const TYPE_COLORS = {
    grass: "#5fbf6a", fire: "#f5732f", water: "#3aa0e6", electric: "#f2c744",
    psychic: "#f45f9c", fighting: "#c0392b", normal: "#b7ad9b", ice: "#7fd7e0",
    ground: "#d4a25a", rock: "#b0a06a", flying: "#8fa9e6", ghost: "#7a5aa0",
    dragon: "#6a4de6", dark: "#4a4a5a", steel: "#8a97a8", fairy: "#f2a7d6",
    bug: "#9aba2c", poison: "#9a5aa0",
  };
  function typeColor(t) { return TYPE_COLORS[t] || TYPE_COLORS.normal; }

  // TCG-style energy/type symbol (data URI) for a type, or "".
  function energyIcon(t) {
    const E = window.ENERGY_ICONS || {};
    return E[t] || E.normal || "";
  }

  // Energy symbol for a team (team id doubles as a type; Pikachu → electric).
  function teamEnergyIcon(team) {
    if (!team) return "";
    const map = { normal: "electric" };
    return energyIcon(map[team.id] || team.id);
  }

  // A team's icon as a DOM node: energy symbol if we have one, else its emoji.
  function teamIcon(team) {
    const src = teamEnergyIcon(team);
    return src
      ? el("img", { class: "energy-ico team", src: src, alt: (team && team.id) || "" })
      : el("span", {}, (team && team.emoji) || "🎽");
  }

  // Fleeting bottom toast. Optional action shows a tappable button (e.g. Undo).
  let toastTimer = null;
  function toast(msg, actionLabel, actionFn) {
    let t = document.getElementById("toast");
    if (!t) { t = el("div", { id: "toast", class: "toast" }); document.body.appendChild(t); }
    t.innerHTML = "";
    t.appendChild(el("span", {}, msg));
    if (actionLabel && actionFn) {
      t.appendChild(el("button", { class: "toast-act", onClick: function () {
        try { actionFn(); } catch (_) {}
        t.classList.remove("show");
      } }, actionLabel));
    }
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, actionLabel ? 4000 : 1800);
  }

  // 🎴 IDENTITY LOCK — when a trainer is signed in on this phone, ACTION
  // views (catching, runs, journeys, logging) don't offer a "play as anyone"
  // picker: you are who you logged in as. Returns the locked row (and the
  // trainer id) when signed in, or null so the view falls back to its picker.
  function lockedTrainerRow(labelText) {
    const me = window.Sync && Sync.getMe && Sync.getMe();
    const a = me && window.Store && Store.attendee(me);
    if (!a) return null;
    const row = el("div", { class: "safari-trainer locked" }, [
      el("span", { class: "safari-trainer-lbl" }, labelText),
      el("span", { class: "trainer-locked-chip" }, "🎴 " + a.name),
      el("a", { class: "trainer-locked-switch", href: "#/settings" }, "switch in ⚙️"),
    ]);
    row.dataset.me = me;
    return row;
  }
  window.U = { esc, el, $, $$, contrast, uid, typeColor, TYPE_COLORS, energyIcon, teamEnergyIcon, teamIcon, toast, lockedTrainerRow };
})();
