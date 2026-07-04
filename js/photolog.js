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
          const entry = { id: "ph" + Math.random().toString(36).slice(2) + stamp().toString(36), ts: stamp(), img: dataUri, caption: cap.value.trim(), by: by, loggedBy: Store.actorId() || undefined };
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

  // ---- reactions + comments on a photo ----
  const REACTIONS = ["❤️", "😂", "🔥", "👏", "🥳"];
  function reactorId() {
    let id = window.Sync && Sync.myClientId && Sync.myClientId();
    if (id) return id;
    try { id = localStorage.getItem("jasonBachHub.reactor"); if (!id) { id = "r" + Math.random().toString(36).slice(2); localStorage.setItem("jasonBachHub.reactor", id); } }
    catch (_) { id = "r0"; }
    return id;
  }
  function reactorName() { const me = window.Sync && Sync.getMe && Sync.getMe(); const a = me && Store.attendee(me); return a ? a.name : "Someone"; }

  function openDetail(photoId, onChange) {
    const rid = reactorId(), rname = reactorName();
    const host = el("div", {});
    let ctrl;
    function build() {
      const p = Store._photo(photoId);
      if (!p) { if (ctrl) ctrl.close(); return el("div"); }
      const counts = {}; (p.reactions || []).forEach((r) => { counts[r.emoji] = (counts[r.emoji] || 0) + 1; });
      const reactRow = el("div", { class: "photo-react-row" }, REACTIONS.map((em) => {
        const mine = (p.reactions || []).some((r) => r.by === rid && r.emoji === em);
        return el("button", { class: "photo-react" + (mine ? " on" : ""),
          onClick: () => { Store.reactPhoto(photoId, em, rid, rname); refresh(); if (onChange) onChange(); } },
          [em, counts[em] ? el("span", { class: "photo-react-n" }, String(counts[em])) : null]);
      }));
      const comments = el("div", { class: "photo-comments" }, (p.comments || []).map((c) =>
        el("div", { class: "photo-comment" }, [el("b", {}, (c.name || "Someone") + ": "), c.text])));
      const cin = el("input", { class: "in", placeholder: "Add a caption / comment…" });
      const cadd = el("button", { class: "btn primary sm", onClick: () => {
        if (cin.value.trim()) { Store.commentPhoto(photoId, cin.value, rid, rname); cin.value = ""; refresh(); if (onChange) onChange(); }
      } }, "Post");
      return el("div", { class: "photo-detail" }, [
        el("img", { class: "photo-detail-img", src: p.img, alt: p.caption || "" }),
        (p.caption || p.by) ? el("div", { class: "photo-detail-cap" }, (p.caption || "") + (p.by ? " — " + p.by : "")) : null,
        reactRow,
        el("div", { class: "section-title" }, "Comments"),
        (p.comments && p.comments.length) ? comments : el("p", { class: "hint" }, "No comments yet — add the first caption."),
        el("div", { class: "photo-add-row" }, [cin, cadd]),
      ]);
    }
    function refresh() { host.innerHTML = ""; host.appendChild(build()); }
    refresh();
    ctrl = Modal.open("Photo moment", host, null, {});
  }

  window.PhotoLog = { capture: capture, openDetail: openDetail };
})();
