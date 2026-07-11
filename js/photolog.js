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

  // opts.source: "camera" forces the rear camera; "library"/omitted opens the
  // native picker so you can TAKE a new photo OR upload one from your gallery.
  function capture(onAdded, opts) {
    const input = el("input", { type: "file", accept: "image/*", style: { display: "none" } });
    if (opts && opts.source === "camera") input.setAttribute("capture", "environment");
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

  // Save a photo to the device. The image is a data: URI (JPEG), so an <a
  // download> works everywhere except iOS Safari, which ignores the download
  // attribute — there we open the image full-screen so a long-press → "Save
  // to Photos" works (the platform-native way to save on iPhone).
  function download(p) {
    if (!p || !p.img) return;
    const iOS = /iP(hone|od|ad)/.test(navigator.userAgent || "") ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const stampName = (function () {
      const who = (p.by || "photo").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
      return "bachparty-" + who + "-" + (p.ts || 0) + ".jpg";
    })();
    if (iOS) {
      const w = window.open();
      if (w) { w.document.write('<img src="' + p.img + '" style="max-width:100%">' +
        '<p style="font:14px sans-serif;text-align:center">Long-press the photo → “Save to Photos”.</p>'); }
      else { alert("Long-press the photo to save it to your camera roll."); }
      return;
    }
    const a = document.createElement("a");
    a.href = p.img; a.download = stampName;
    document.body.appendChild(a); a.click(); a.remove();
  }

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
      // Who reacted — names grouped by emoji, so you can see who ❤️'d your shot.
      const byEmoji = {};
      (p.reactions || []).forEach((r) => { (byEmoji[r.emoji] = byEmoji[r.emoji] || []).push(r.name || "Someone"); });
      const reactedBy = (p.reactions || []).length
        ? el("div", { class: "photo-reactors" }, REACTIONS.filter((em) => byEmoji[em]).map((em) =>
            el("div", { class: "photo-reactor-line" }, [
              el("span", { class: "photo-reactor-emoji" }, em),
              el("span", { class: "photo-reactor-names" }, byEmoji[em].join(", ")),
            ])))
        : null;
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
        reactedBy,
        el("div", { class: "toolbar", style: { justifyContent: "center" } }, [
          el("button", { class: "btn subtle sm", onClick: () => download(p) }, "⬇️ Save photo"),
        ]),
        el("div", { class: "section-title" }, "Comments"),
        (p.comments && p.comments.length) ? comments : el("p", { class: "hint" }, "No comments yet — add the first caption."),
        el("div", { class: "photo-add-row" }, [cin, cadd]),
      ]);
    }
    function refresh() { host.innerHTML = ""; host.appendChild(build()); }
    refresh();
    ctrl = Modal.open("Photo moment", host, null, {});
  }

  // ---- bulk save (select many → one download) -----------------------------
  function fileName(p, i) {
    const who = (p.by || "photo").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    return "bachparty-" + String(i + 1).padStart(2, "0") + "-" + who + ".jpg";
  }
  function dataUriToBytes(uri) {
    const b64 = String(uri || "").split(",")[1] || "";
    let bin = ""; try { bin = atob(b64); } catch (_) { return new Uint8Array(0); }
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i) & 255;
    return out;
  }
  function crc32(bytes) {
    if (!crc32.t) { const t = crc32.t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); t[n] = c >>> 0; } }
    let crc = 0xFFFFFFFF; const t = crc32.t;
    for (let i = 0; i < bytes.length; i++) crc = t[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }
  // Minimal STORE-mode ZIP (JPEGs are already compressed, so no deflate).
  function makeZip(files) {
    const u16 = (n) => [n & 255, (n >> 8) & 255];
    const u32 = (n) => [n & 255, (n >> 8) & 255, (n >> 16) & 255, (n >>> 24) & 255];
    const enc = (s) => { const a = []; for (let i = 0; i < s.length; i++) a.push(s.charCodeAt(i) & 255); return a; };
    const chunks = [], central = []; let offset = 0;
    files.forEach((f) => {
      const nb = enc(f.name), crc = crc32(f.bytes), sz = f.bytes.length;
      const local = [].concat(u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(sz), u32(sz), u16(nb.length), u16(0), nb);
      chunks.push(new Uint8Array(local), f.bytes);
      central.push({ nb: nb, crc: crc, sz: sz, offset: offset });
      offset += local.length + sz;
    });
    const cdStart = offset; let cd = [];
    central.forEach((c) => { cd = cd.concat(u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0), u32(c.crc), u32(c.sz), u32(c.sz), u16(c.nb.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(c.offset), c.nb); });
    chunks.push(new Uint8Array(cd));
    chunks.push(new Uint8Array([].concat(u32(0x06054b50), u16(0), u16(0), u16(central.length), u16(central.length), u32(cd.length), u32(cdStart), u16(0))));
    return new Blob(chunks, { type: "application/zip" });
  }
  // Save many photos at once: native share sheet where supported (iPhone can
  // "Save N Images" to the camera roll), else a single .zip download.
  function saveMany(photos) {
    photos = (photos || []).filter((p) => p && p.img);
    if (!photos.length) return;
    try {
      const fileObjs = photos.map((p, i) => new File([dataUriToBytes(p.img)], fileName(p, i), { type: "image/jpeg" }));
      if (navigator.canShare && navigator.canShare({ files: fileObjs })) {
        navigator.share({ files: fileObjs, title: "Bachelor Party photos" }).catch(function () {});
        return;
      }
    } catch (_) {}
    const blob = makeZip(photos.map((p, i) => ({ name: fileName(p, i), bytes: dataUriToBytes(p.img) })));
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "bachparty-photos.zip";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { try { URL.revokeObjectURL(url); } catch (_) {} }, 5000);
  }

  window.PhotoLog = { capture: capture, openDetail: openDetail, download: download, saveMany: saveMany,
    REACTIONS: REACTIONS, reactorId: reactorId, reactorName: reactorName };
})();
