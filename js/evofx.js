/* evofx.js — the shared evolution cinematic (global `EvoFX`).
 *
 * This is the exact "Squad evolution" screen from the trainer roster, lifted
 * out so the caught-Pokémon evolutions (in duels) get the same treatment:
 * dark silhouettes flicker old↔new and accelerate, a white flash, then the
 * new form reveals in full color with a caption and a firework burst of the
 * type's energy symbol — plus the evolve music and the win/mega fanfare.
 *
 * EvoFX.play({
 *   beforeSrc, afterSrc,     // sprite URLs (required)
 *   beforeName, afterName,   // for the caption
 *   type,                    // energy-symbol type for the fireworks (optional)
 *   mega, shiny,             // flags: mega glow / ✨ prefix (optional)
 *   scale,                   // final-form scale, default 1 (optional)
 *   verb,                    // "evolved into" (default) / "grew into" / …
 *   onComplete,              // called once when the cinematic settles
 * })
 */
(function () {
  const { el, energyIcon } = U;

  // A firework burst of the type's energy symbol, radiating from the center.
  function energyBurst(overlay, type) {
    const src = type && energyIcon(type);
    if (!src) return;
    const layer = el("div", { class: "evo-burst" });
    const N = 28;
    for (let i = 0; i < N; i++) {
      const ang = (i / N) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const dist = 120 + Math.random() * 190;
      const size = (18 + Math.random() * 24) | 0;
      const p = el("img", { class: "evo-burst-ico", src: src, alt: "" });
      p.style.setProperty("--tx", (Math.cos(ang) * dist).toFixed(0) + "px");
      p.style.setProperty("--ty", (Math.sin(ang) * dist).toFixed(0) + "px");
      p.style.setProperty("--rot", ((Math.random() * 720 - 360) | 0) + "deg");
      p.style.width = size + "px"; p.style.height = size + "px";
      p.style.animationDuration = (0.9 + Math.random() * 0.7).toFixed(2) + "s";
      p.style.animationDelay = (Math.random() * 0.12).toFixed(2) + "s";
      layer.appendChild(p);
    }
    overlay.appendChild(layer);
    setTimeout(() => layer.remove(), 2100);
  }

  function play(opts) {
    opts = opts || {};
    let done = false;
    const finish = () => { if (done) return; done = true; opts.onComplete && opts.onComplete(); };
    const isMega = !!opts.mega;
    const scale = opts.scale || 1;
    const type = opts.type || "";
    const verb = opts.verb || "evolved into";
    const beforeName = opts.beforeName || "";
    const afterName = (opts.shiny ? "✨" : "") + (opts.afterName || "");

    const imgOld = el("img", { class: "evo-anim-sprite sil", src: opts.beforeSrc || "", alt: "" });
    const imgNew = el("img", { class: "evo-anim-sprite sil hidden", src: opts.afterSrc || "", alt: "" });
    if (scale && scale !== 1) imgNew.style.setProperty("--s", scale);
    const flash = el("div", { class: "evo-anim-flash" });
    const cap = el("div", { class: "evo-anim-cap" });
    const overlay = el("div", { class: "evo-anim" }, [
      el("div", { class: "evo-anim-stage" }, [imgOld, imgNew]), flash, cap,
    ]);

    function close() { overlay.classList.add("out"); setTimeout(() => overlay.remove(), 380); finish(); }
    overlay.addEventListener("click", close);
    document.body.appendChild(overlay);

    if (window.SFX && SFX.evolve) SFX.evolve();

    const intervals = [300, 280, 250, 220, 190, 165, 145, 125, 110, 95, 85, 78, 72];
    let i = 0, showNew = false;
    function toggle() {
      if (done) return;
      showNew = !showNew;
      imgOld.classList.toggle("hidden", showNew);
      imgNew.classList.toggle("hidden", !showNew);
      if (i < intervals.length) setTimeout(toggle, intervals[i++]);
      else reveal();
    }
    setTimeout(toggle, 380);

    function reveal() {
      if (done) return;
      imgOld.classList.add("hidden");
      imgNew.classList.remove("hidden");
      flash.classList.add("go");
      if (window.SFX) (isMega ? (SFX.fanfare && SFX.fanfare()) : (SFX.win && SFX.win()));
      setTimeout(() => {
        imgNew.classList.remove("sil");
        imgNew.classList.add("reveal");
        if (isMega) imgNew.classList.add("mega");
        cap.textContent = (isMega ? "⚡ " : "✨ ") + beforeName + " " + verb + " " + afterName + "!";
        cap.classList.add("show");
        energyBurst(overlay, type);
        setTimeout(() => energyBurst(overlay, type), 550);
        if (isMega) setTimeout(() => energyBurst(overlay, type), 1050);
      }, 200);
      setTimeout(close, isMega ? 2800 : 2300);
    }
  }

  window.EvoFX = { play, energyBurst };
})();
