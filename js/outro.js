/* outro.js — the closing-ceremony cinematic. Movie-style credits scroll up
   through the squad (bottom of the list first) with each trainer's stats,
   then a Bulbasaur-filled send-off for the groom, then the Poster. If the
   viewer IS the groom, a "NEW AREA UNLOCKED" pop-up reveals the Message Wall.
   Global `window.Outro`. */
(function () {
  const { el } = U;
  function sfx(n) { if (window.SFX && SFX[n]) SFX[n](); }

  function statLine(w) {
    const parts = [];
    if (w.caught) parts.push("🔴 " + w.caught);
    if (w.battleW || w.battleL) parts.push("⚔ " + w.battleW + "-" + w.battleL);
    if (w.drinks) parts.push("🍺 " + w.drinks);
    if (w.presidencies) parts.push("👑 " + w.presidencies);
    if (w.oracle) parts.push("🔮 " + w.oracle);
    if (w.logged) parts.push("📋 " + w.logged);
    return parts.join("   ·   ") || "along for the ride";
  }
  function trophiesFor(name) {
    return Store.liveTrophies().concat(Store.funSuperlatives()).filter((t) => t.holder === name).map((t) => t.emoji).join(" ");
  }
  function memberCard(a) {
    const f = Store.currentForm(a), spr = f.id ? Store.sprite(f.id) : "";
    const w = Store.wrapped(a.id), tro = trophiesFor(a.name);
    return el("div", { class: "outro-member" }, [
      spr ? el("img", { class: "outro-mon", src: spr, alt: "" }) : el("span", { class: "draft-thumb-ball" }),
      el("div", { class: "outro-mem-name" }, a.name),
      a.role ? el("div", { class: "outro-mem-role" }, a.role) : null,
      el("div", { class: "outro-mem-stats" }, statLine(w)),
      tro ? el("div", { class: "outro-mem-tro" }, tro) : null,
    ]);
  }

  function play() {
    const groom = Store.groom();
    const others = Store.state.attendees.filter((a) => !groom || a.id !== groom.id).slice().reverse();
    const overlay = el("div", { class: "outro" });
    document.body.appendChild(overlay);
    let phase = 1;
    sfx("fanfare");

    const skip = el("button", { class: "outro-skip" }, "Skip ▸");
    skip.addEventListener("click", () => toSendoff());
    overlay.appendChild(skip);

    // ---- phase 1: credits scroll (bottom of the squad → up to the groom) ----
    const items = [el("div", { class: "outro-title" }, (Store.state.party && Store.state.party.title) || "The Weekend"), el("div", { class: "outro-sub" }, "★ the squad ★")];
    others.forEach((a) => items.push(memberCard(a)));
    items.push(el("div", { class: "outro-sub" }, "…and the groom"));
    const credits = el("div", { class: "outro-credits" }, items);
    const dur = Math.max(14, others.length * 3.4 + 8);
    credits.style.animationDuration = dur + "s";
    overlay.appendChild(credits);
    const t1 = setTimeout(() => toSendoff(), dur * 1000);

    // ---- phase 2: the groom's Bulbasaur send-off ----
    function toSendoff() {
      if (phase >= 2) return; phase = 2; clearTimeout(t1);
      overlay.innerHTML = "";
      skip.textContent = "To the Poster ▸"; skip.onclick = finish; overlay.appendChild(skip);
      const spr = Store.sprite(1); // Bulbasaur
      for (let i = 0; i < 30; i++) {
        const n = spr ? el("img", { class: "outro-rain", src: spr, alt: "" }) : el("div", { class: "outro-rain ball" });
        n.style.left = (Math.random() * 96).toFixed(1) + "vw";
        n.style.width = ((34 + Math.random() * 46) | 0) + "px";
        n.style.animationDuration = (2.2 + Math.random() * 2.4).toFixed(2) + "s";
        n.style.animationDelay = (Math.random() * 1.6).toFixed(2) + "s";
        overlay.appendChild(n);
      }
      const gspr = groom && groom.favoriteId ? Store.sprite(Store.currentForm(groom).id) : "";
      const w = groom ? Store.wrapped(groom.id) : null;
      overlay.appendChild(el("div", { class: "outro-sendoff" }, [
        gspr ? el("img", { class: "outro-groom-mon", src: gspr, alt: "" }) : null,
        el("div", { class: "outro-sendoff-l" }, "TO THE GROOM"),
        el("div", { class: "outro-groom-name" }, groom ? groom.name : "The Groom"),
        w ? el("div", { class: "outro-groom-stats" }, statLine(w)) : null,
        el("div", { class: "outro-sendoff-msg" }, "Here's to " + (groom ? groom.name.split(" ")[0] : "the groom") + " — gotta catch that Bobby Quinn! 💍🌿"),
        el("button", { class: "btn spin-btn", onClick: finish }, "🖼️ To the Poster ▸"),
      ]));
      sfx("fanfare");
    }

    // ---- phase 3: to the poster + (groom only) the Message Wall unlock ----
    function finish() {
      if (phase >= 3) return; phase = 3;
      overlay.classList.add("out"); setTimeout(() => overlay.remove(), 500);
      const amGroom = Store.isGroomActor();
      if (window.Router) Router.go("poster");
      if (amGroom && window.Modal) {
        setTimeout(() => {
          let ctrl;
          const body = el("div", { class: "unlock-modal" }, [
            el("div", { class: "unlock-emoji" }, "🌿"),
            el("div", { class: "unlock-title" }, "NEW AREA UNLOCKED"),
            el("p", {}, "The whole crew left you something. Your Message Wall is now open."),
            el("button", { class: "btn primary", onClick: () => { Store.unlockMessages(); sfx("win"); if (ctrl) ctrl.close(); Router.go("messages"); } }, "💌 Enter the Message Wall"),
          ]);
          ctrl = Modal.open("Congratulations, Groom!", body, null, {});
        }, 800);
      }
    }
  }

  window.Outro = { play: play };
})();
