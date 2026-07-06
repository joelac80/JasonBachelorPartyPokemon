/* modal.js — tiny modal dialog. Global `Modal`. */
(function () {
  const { el } = U;

  const Modal = {
    open(title, body, onSave, opts) {
      opts = opts || {};
      const overlay = el("div", { class: "modal-overlay" });
      const close = () => overlay.remove();

      const footer = el("div", { class: "modal-footer" }, [
        el("button", { class: "btn subtle", onClick: close }, "Cancel"),
        onSave
          ? el("button", { class: "btn primary", onClick: () => { onSave(); close(); } },
              opts.saveLabel || "Save")
          : null,
      ]);

      const dialog = el("div", { class: "modal" + (opts.wide ? " wide" : "") }, [
        el("div", { class: "modal-head" }, [
          el("h3", {}, title),
          el("button", { class: "modal-x", onClick: close }, "×"),
        ]),
        el("div", { class: "modal-body" }, body),
        footer,
      ]);

      overlay.appendChild(dialog);
      overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
      document.addEventListener("keydown", function onEsc(e) {
        if (e.key === "Escape") { close(); document.removeEventListener("keydown", onEsc); }
      });
      // Navigating away (link tap, back button) shouldn't leave a modal behind.
      window.addEventListener("hashchange", function onNav() {
        close(); window.removeEventListener("hashchange", onNav);
      });
      document.body.appendChild(overlay);
      return { close };
    },
  };

  window.Modal = Modal;
})();
