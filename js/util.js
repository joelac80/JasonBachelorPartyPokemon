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
        else if (k === "style" && typeof v === "object") Object.assign(node.style, v);
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

  window.U = { esc, el, $, $$, contrast, uid, typeColor, TYPE_COLORS };
})();
