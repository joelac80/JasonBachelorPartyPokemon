/* wheel.js — reusable canvas spinner. Global `Wheel`.
   Wheel.make({ items, onPick, buttonLabel }) -> DOM element.
   Each item is { label, ...anything }; onPick(item, index) fires when it lands. */
(function () {
  const { el, contrast } = U;
  const PALETTE = ["#ee1515", "#2a75bb", "#ffcb05", "#5fbf6a", "#f45f9c",
    "#7a5aa0", "#f5732f", "#3aa0e6", "#7fd7e0", "#9aba2c", "#c0392b", "#f2a7d6"];

  function draw(canvas, items, angle) {
    const ctx = canvas.getContext("2d");
    const size = canvas.width;
    const cx = size / 2, cy = size / 2, r = size / 2 - 6;
    ctx.clearRect(0, 0, size, size);

    if (!items.length) {
      ctx.fillStyle = "#e3e8f4";
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#5a6072";
      ctx.font = "bold 16px system-ui, sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("Nothing to spin", cx, cy);
      return;
    }
    const slice = (Math.PI * 2) / items.length;
    items.forEach((it, i) => {
      const start = angle + i * slice;
      ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, start + slice); ctx.closePath();
      ctx.fillStyle = PALETTE[i % PALETTE.length]; ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.25)"; ctx.lineWidth = 2; ctx.stroke();

      ctx.save();
      ctx.translate(cx, cy); ctx.rotate(start + slice / 2);
      ctx.textAlign = "right"; ctx.textBaseline = "middle";
      ctx.fillStyle = contrast(PALETTE[i % PALETTE.length]);
      ctx.font = "bold " + Math.max(10, Math.min(18, 260 / items.length + 6)) + "px system-ui, sans-serif";
      const label = it.label.length > 16 ? it.label.slice(0, 15) + "…" : it.label;
      ctx.fillText(label, r - 12, 0);
      ctx.restore();
    });

    // hub (poke ball)
    ctx.beginPath(); ctx.arc(cx, cy, 24, 0, Math.PI * 2);
    ctx.fillStyle = "#fff"; ctx.fill();
    ctx.strokeStyle = "#111"; ctx.lineWidth = 4; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.fillStyle = "#ee1515"; ctx.fill();
    ctx.strokeStyle = "#111"; ctx.lineWidth = 3; ctx.stroke();
  }

  function make(opts) {
    opts = opts || {};
    let items = opts.items || [];
    let angle = 0, spinning = false;

    const canvas = el("canvas", { class: "wheel", width: "340", height: "340" });
    const result = el("div", { class: "wheel-result" }, opts.hint || "Give it a spin!");
    const btn = el("button", { class: "btn spin-btn" }, opts.buttonLabel || "🎡 SPIN");

    function render() { draw(canvas, items, angle); }

    btn.addEventListener("click", () => {
      if (spinning || !items.length) return;
      if (window.SFX) SFX.spin();
      spinning = true; btn.disabled = true;
      const slice = (Math.PI * 2) / items.length;
      const startA = angle;
      const target = angle + (5 + Math.random() * 4) * Math.PI * 2 + Math.random() * Math.PI * 2;
      const dur = 4200, t0 = performance.now();
      const ease = (t) => 1 - Math.pow(1 - t, 3);
      function frame(now) {
        const t = Math.min(1, (now - t0) / dur);
        angle = startA + (target - startA) * ease(t);
        render();
        if (t < 1) { requestAnimationFrame(frame); return; }
        spinning = false; btn.disabled = false;
        const norm = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const pointer = (Math.PI * 1.5 - norm + Math.PI * 2) % (Math.PI * 2);
        const idx = Math.floor(pointer / slice) % items.length;
        result.innerHTML = "";
        result.appendChild(el("span", { class: "picked-name" }, "🎯 " + items[idx].label));
        if (window.SFX) SFX.win();
        if (opts.onPick) opts.onPick(items[idx], idx);
      }
      requestAnimationFrame(frame);
    });

    const wrap = el("div", { class: "wheel-col" }, [
      el("div", { class: "wheel-wrap" }, [
        el("div", { class: "wheel-pointer" }, "▼"),
        canvas,
      ]),
      result,
      btn,
    ]);

    // Allow callers to swap the item list and redraw.
    wrap.setItems = (next) => { items = next || []; render(); };
    render();
    return wrap;
  }

  window.Wheel = { make };
})();
