/* photolog.js — capture a photo moment: pick/take a photo, downscale it hard
   (so it fits localStorage + the sync photos channel), caption it, and log it
   to the weekend chronicle. Global `window.PhotoLog`. */
(function () {
  const { el } = U;
  const MAX = 512, QUALITY = 0.5;

  function stamp() { try { return Date.now(); } catch (_) { return 0; } }

  // Draw the image onto a canvas capped at MAX px and export a small JPEG.
  function downscale(file, cb) {
    const reader = new FileReader();
    reader.onload = function () {
      const img = new Image();
      img.onload = function () {
        let w = img.width, h = img.height;
        if (w > h && w > MAX) { h = Math.round(h * MAX / w); w = MAX; }
        else if (h >= w && h > MAX) { w = Math.round(w * MAX / h); h = MAX; }
        try {
          const c = document.createElement("canvas");
          c.width = w; c.height = h;
          c.getContext("2d").drawImage(img, 0, 0, w, h);
          cb(c.toDataURL("image/jpeg", QUALITY));
        } catch (_) { cb(reader.result); }
      };
      img.onerror = function () { cb(null); };
      img.src = reader.result;
    };
    reader.onerror = function () { cb(null); };
    reader.readAsDataURL(file);
  }

  function openForm(dataUri, onAdded) {
    const cap = el("input", { class: "in", placeholder: "Caption (optional)…" });
    const me = (window.Sync && Sync.getMe && Sync.getMe()) || "";
    const sel = el("select", { class: "in" }, [el("option", { value: "" }, "— who's in it / posted? —")].concat(
      Store.state.attendees.map((a) => el("option", { value: a.id, selected: a.id === me ? "true" : null }, a.name))));
    let ctrl;
    const body = el("div", { class: "modal-form" }, [
      el("img", { class: "photo-preview", src: dataUri, alt: "" }),
      el("label", { class: "field" }, [el("span", {}, "Caption"), cap]),
      el("label", { class: "field" }, [el("span", {}, "Posted by"), sel]),
      el("div", { class: "toolbar" }, [
        el("button", { class: "btn primary", onClick: function () {
          const a = Store.attendee(sel.value), by = a ? a.name : "";
          const entry = { id: "ph" + Math.random().toString(36).slice(2) + stamp().toString(36), ts: stamp(), img: dataUri, caption: cap.value.trim(), by: by };
          Store.addPhoto(entry);
          if (window.Sync && Sync.sharePhoto) Sync.sharePhoto(entry);
          if (window.SFX && SFX.win) SFX.win();
          if (ctrl) ctrl.close();
          if (onAdded) onAdded();
        } }, "📸 Add to log"),
        el("button", { class: "btn subtle", onClick: function () { if (ctrl) ctrl.close(); } }, "Cancel"),
      ]),
    ]);
    ctrl = Modal.open("Add a photo moment", body, null, {});
  }

  function capture(onAdded) {
    const input = el("input", { type: "file", accept: "image/*", style: { display: "none" } });
    input.setAttribute("capture", "environment");   // prefer the camera on phones
    document.body.appendChild(input);
    input.addEventListener("change", function () {
      const f = input.files && input.files[0];
      input.remove();
      if (!f) return;
      downscale(f, function (dataUri) {
        if (!dataUri) { alert("Couldn't read that image — try another."); return; }
        openForm(dataUri, onAdded);
      });
    });
    input.click();
  }

  window.PhotoLog = { capture: capture };
})();
